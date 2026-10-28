import {
  doc,
  getDoc,
  writeBatch,
  collection,
  getDocs,
  query,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config.js';
import { getCollectionPath } from 'dh-shared';
import { inventorySyncMetaService } from './inventorySyncMetaService.js';

// 🛡️ Runaway Quota Guard: Concurrency deduplication & throttle state
let inFlightReconciliation = null;
let lastReconcileTime = 0;
let lastReconcileVersion = 0;
let lastReconciledItems = [];
const RECONCILE_THROTTLE_MS = 30000;

/**
 * Resolves secondary field aliases so incoming updates to `stock`, `wholesalePrice`, `price`, or `RetailPrice`
 * are not shadowed by stale primary aliases (`stockQuantity`, `Price`, `retailPrice`) present on existing shard items.
 */
function resolveItemAliases(data) {
  if (!data || typeof data !== 'object') return data;
  const resolved = { ...data };

  // Stock aliases
  if (data.stock !== undefined && data.stockQuantity === undefined) {
    resolved.stockQuantity = data.stock;
  } else if (data.stockQuantity !== undefined && data.stock === undefined) {
    resolved.stock = data.stockQuantity;
  }

  // Wholesale price aliases
  if (data.wholesalePrice !== undefined && data.Price === undefined) {
    resolved.Price = data.wholesalePrice;
    resolved.price = data.wholesalePrice;
  } else if (data.price !== undefined && data.Price === undefined && data.wholesalePrice === undefined) {
    resolved.Price = data.price;
    resolved.wholesalePrice = data.price;
  } else if (data.Price !== undefined) {
    resolved.wholesalePrice = data.Price;
    resolved.price = data.Price;
  }

  // Retail price aliases
  if (data.RetailPrice !== undefined && data.retailPrice === undefined) {
    resolved.retailPrice = data.RetailPrice;
  }

  return resolved;
}

/**
 * Sanitizes an item object ensuring no undefined values exist to prevent Firestore SDK rejection.
 * Strict Lean Catalog Schema: Prevents multi-megabyte base64 strings or internal comments from bloating shards.
 */
function sanitizeItemForShard(item) {
  if (!item || typeof item !== 'object') return null;
  const sku = String(item.sku || item.id || '').trim().toUpperCase();
  if (!sku) return null;

  const wholesale = Number(item.Price !== undefined ? item.Price : (item.wholesalePrice !== undefined ? item.wholesalePrice : (item.price || 0))) || 0;
  const retail = Number(item.retailPrice !== undefined ? item.retailPrice : (item.RetailPrice !== undefined ? item.RetailPrice : (item.Price || wholesale || 0))) || 0;
  const stock = Number(item.stockQuantity !== undefined ? item.stockQuantity : (item.stock !== undefined ? item.stock : 0)) || 0;
  const image = item.image || item.imageUrl || (Array.isArray(item.images) && typeof item.images[0] === 'string' && item.images[0].startsWith('http') ? item.images[0] : null) || null;
  const barcode = item.barcode ? String(item.barcode).trim() : sku;

  // Filter image URLs to only valid HTTP(S) links (strictly filter out massive raw base64 data strings)
  const validImages = Array.isArray(item.images)
    ? item.images.filter(img => typeof img === 'string' && img.startsWith('http') && img.length < 2000)
    : (image && image.startsWith('http') && image.length < 2000 ? [image] : []);

  const cleaned = {
    id: item.id || sku,
    sku,
    barcode,
    name: String(item.name || sku).trim(),
    Price: wholesale,
    price: wholesale,
    wholesalePrice: wholesale,
    retailPrice: retail,
    stockQuantity: stock,
    stock,
    inStock: stock > 0,
    bufferStock: Number(item.bufferStock !== undefined && !isNaN(Number(item.bufferStock)) ? Number(item.bufferStock) : 2),
    image: validImages[0] || null,
    imageUrl: validImages[0] || null,
    images: validImages,
    category: String(item.category || '').trim(),
    category_lower: String(item.category_lower || item.category || '').trim().toLowerCase(),
    brand: String(item.brand || '').trim(),
    type: String(item.type || '').trim(),
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
    compatibleModels: Array.isArray(item.compatibleModels) ? item.compatibleModels.filter(Boolean) : [],
    compatiblePartNumbers: Array.isArray(item.compatiblePartNumbers) ? item.compatiblePartNumbers.filter(Boolean) : [],
    shortDescription: String(item.shortDescription || '').trim().slice(0, 500),
    sellingModel: String(item.sellingModel || '').trim(),
    substituteSkus: Array.isArray(item.substituteSkus) ? item.substituteSkus.filter(Boolean) : [],
    warehouseLocation: String(item.warehouseLocation || '').trim(),
    isActive: item.isActive !== false
  };

  if (item.adjustmentHistory && typeof item.adjustmentHistory === 'object') {
    cleaned.adjustmentHistory = item.adjustmentHistory;
  }

  // Strip undefined values
  Object.keys(cleaned).forEach(k => {
    if (cleaned[k] === undefined) {
      delete cleaned[k];
    }
  });

  return cleaned;
}

export const catalogShardSyncService = {
  /**
   * Syncs updated/created products into Firestore Catalog Shards (`catalogs/search_index_p1..p7`)
   * and increments the central manifest version (`catalogs/search_index`).
   * 
   * Triggers targeted delta sync across all connected clients via `inventorySyncMetaService`.
   * 
   * @param {Array<Object>} updatedProducts - Array of modified product objects
   * @param {Object} [options={}] - { action: 'update' | 'create' | 'delete' | 'import' }
   * @returns {Promise<{success: boolean, updatedCount: number, modifiedShards: number[]}>}
   */
  syncProductsToShards: async (updatedProducts = [], options = {}) => {
    try {
      if (!Array.isArray(updatedProducts) || updatedProducts.length === 0) {
        return { success: true, updatedCount: 0, modifiedShards: [] };
      }

      const action = options.action || 'update';
      const productMap = new Map();
      const cleanSkus = [];

      updatedProducts.forEach(raw => {
        if (!raw || (!raw.sku && !raw.id)) return;
        const upper = String(raw.sku || raw.id).trim().toUpperCase();
        productMap.set(upper, raw);
        cleanSkus.push(upper);
      });

      if (cleanSkus.length === 0) {
        return { success: true, updatedCount: 0, modifiedShards: [] };
      }

      // 1. Fetch Central Manifest (1 Read)
      const manifestRef = doc(db, getCollectionPath('catalogs'), 'search_index');
      const manifestSnap = await getDoc(manifestRef);
      if (!manifestSnap.exists()) {
        console.warn('⚠️ [catalogShardSyncService] Manifest not found, running full reconciliation...');
        return await catalogShardSyncService.reconcileAllShardsFromProducts();
      }
      const manifestData = manifestSnap.data();
      const chunkCount = Number(manifestData.chunkCount) || 7;

      // 2. Fetch all chunk documents (chunkCount Reads <= 7)
      const chunkPromises = [];
      for (let i = 1; i <= chunkCount; i++) {
        const chunkRef = doc(db, getCollectionPath('catalogs'), `search_index_p${i}`);
        chunkPromises.push(getDoc(chunkRef));
      }
      const chunkSnaps = await Promise.all(chunkPromises);

      // 🛡️ Data Loss Guard: Validate all shards exist and were successfully read
      for (let idx = 0; idx < chunkSnaps.length; idx++) {
        const snap = chunkSnaps[idx];
        if (!snap || !snap.exists()) {
          throw new Error(`Catalog shard search_index_p${idx + 1} is missing or inaccessible. Aborting shard sync to protect data integrity.`);
        }
      }

      const shardItemsMap = new Map(); // shardIndex (1-based) -> Array of items
      const remainingSkus = new Set(cleanSkus);
      const modifiedShardIndices = new Set();

      chunkSnaps.forEach((snap, idx) => {
        const shardIndex = idx + 1;
        const items = Array.isArray(snap.data()?.items)
          ? [...snap.data().items]
          : [];
        shardItemsMap.set(shardIndex, items);
      });

      // 3. Update existing SKUs across the shards
      for (let i = 1; i <= chunkCount; i++) {
        const items = shardItemsMap.get(i);
        let shardChanged = false;

        for (let j = 0; j < items.length; j++) {
          const itemSku = String(items[j]?.sku || items[j]?.id || '').trim().toUpperCase();
          if (productMap.has(itemSku)) {
            const updateData = productMap.get(itemSku);
            const isDeleting = action === 'delete' || updateData.isActive === false;

            // 🛡️ Soft-Delete & Deactivation Guard: Prune inactive/deleted items from catalog shards
            if (isDeleting) {
              items.splice(j, 1);
              j--;
              shardChanged = true;
              remainingSkus.delete(itemSku);
              continue;
            }

            const resolvedUpdate = resolveItemAliases(updateData);
            const sanitized = sanitizeItemForShard({
              ...items[j],
              ...resolvedUpdate,
              sku: itemSku
            });

            if (sanitized) {
              items[j] = sanitized;
              shardChanged = true;
              remainingSkus.delete(itemSku);
            }
          }
        }

        if (shardChanged) {
          modifiedShardIndices.add(i);
        }
      }

      // 4. If any SKUs are new (not present in any shard), distribute evenly to the shard currently having fewest items
      if (remainingSkus.size > 0) {
        remainingSkus.forEach(newSku => {
          const updateData = productMap.get(newSku);
          // 🛡️ Inactive & Deletion Guard: Never add draft, hidden, or deleted products to public shards
          if (updateData && (updateData.isActive === false || action === 'delete')) {
            return;
          }

          let bestShardIndex = 1;
          let minLength = Infinity;
          for (let i = 1; i <= chunkCount; i++) {
            const len = shardItemsMap.get(i).length;
            if (len < minLength) {
              minLength = len;
              bestShardIndex = i;
            }
          }

          const targetItems = shardItemsMap.get(bestShardIndex);
          const resolvedUpdate = resolveItemAliases(updateData);
          const sanitized = sanitizeItemForShard({ ...resolvedUpdate, sku: newSku });
          if (sanitized) {
            targetItems.push(sanitized);
            modifiedShardIndices.add(bestShardIndex);
          }
        });
      }

      // 5. Commit modifications atomically via Firestore writeBatch
      let totalCalculatedItems = 0;
      for (let i = 1; i <= chunkCount; i++) {
        totalCalculatedItems += shardItemsMap.get(i).length;
      }

      let manifestVersion = Date.now();
      if (modifiedShardIndices.size > 0) {
        const batch = writeBatch(db);

        // Write modified shards
        modifiedShardIndices.forEach(shardIdx => {
          const chunkRef = doc(db, getCollectionPath('catalogs'), `search_index_p${shardIdx}`);
          batch.set(chunkRef, {
            chunkId: `search_index_p${shardIdx}`,
            items: shardItemsMap.get(shardIdx),
            updatedAt: serverTimestamp()
          }, { merge: true });
        });

        // Write Central Manifest
        batch.set(manifestRef, {
          chunkId: 'search_index',
          version: manifestVersion,
          chunkCount,
          totalItems: totalCalculatedItems,
          updatedAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }, { merge: true });

        await batch.commit();
        console.log(`✅ [catalogShardSyncService] Synced ${cleanSkus.length} products to Shards: [${Array.from(modifiedShardIndices).join(', ')}]`);
      }

      // 6. Broadcast real-time delta change to settings/inventory_meta and connected clients
      try {
        await inventorySyncMetaService.recordInventoryChange(cleanSkus, action);
      } catch (metaErr) {
        console.warn('⚠️ [catalogShardSyncService] recordInventoryChange warning:', metaErr.message);
      }

      return {
        success: true,
        version: manifestVersion,
        updatedCount: cleanSkus.length,
        modifiedShards: Array.from(modifiedShardIndices)
      };
    } catch (err) {
      console.error('🔥 [catalogShardSyncService] Error syncing products to shards:', err);
      throw err;
    }
  },

  /**
   * Reconciles all 7 catalog shards directly from the live `products` collection.
   * Completely heals any discrepancies between live products and catalog shards.
   * 🛡️ Quota & Concurrency Guard: Enforces in-flight deduplication and a 30s throttle cooldown
   * to strictly block runaway multi-thousand document reads across concurrent tabs or bots.
   * 
   * @param {Object} options - { force?: boolean }
   * @returns {Promise<{success: boolean, version: number, totalItems: number, items: Array<Object>}>}
   */
  reconcileAllShardsFromProducts: async (options = {}) => {
    // 🛡️ 1. In-flight promise sharing (Zero duplicate Firestore collection sweeps)
    if (inFlightReconciliation) {
      console.log('⏳ [catalogShardSyncService] Full reconciliation already in flight, sharing active promise...');
      return inFlightReconciliation;
    }

    // 🛡️ 2. Rate-limit cooldown guard (Skip duplicate multi-thousand reads if run within 30s)
    const now = Date.now();
    if (!options.force && (now - lastReconcileTime) < RECONCILE_THROTTLE_MS && lastReconciledItems.length > 0) {
      console.warn(`🛡️ [catalogShardSyncService] Reconcile throttled (${Math.round((RECONCILE_THROTTLE_MS - (now - lastReconcileTime)) / 1000)}s cooldown remaining). Returning cached items.`);
      return { success: true, version: lastReconcileVersion || now, totalItems: lastReconciledItems.length, items: lastReconciledItems, throttled: true };
    }

    inFlightReconciliation = (async () => {
      try {
        console.log('🔄 [catalogShardSyncService] Starting full catalog shard reconciliation from live products collection...');
        const prodCollection = collection(db, getCollectionPath('products'));
        const q = query(prodCollection, limit(4000));
        const snapshot = await getDocs(q);

        const allItems = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.isActive !== false) {
            const norm = sanitizeItemForShard({ id: docSnap.id, ...data });
            if (norm && norm.sku) {
              allItems.push(norm);
            }
          }
        });

        // Deterministic sort by SKU
        allItems.sort((a, b) => a.sku.localeCompare(b.sku));

        const chunkCount = 7;
        const shards = [];
        const baseSize = Math.floor(allItems.length / chunkCount);
        const remainder = allItems.length % chunkCount;
        let currentIndex = 0;

        for (let i = 0; i < chunkCount; i++) {
          const currentChunkSize = baseSize + (i < remainder ? 1 : 0);
          shards.push(allItems.slice(currentIndex, currentIndex + currentChunkSize));
          currentIndex += currentChunkSize;
        }

        const manifestVersion = Date.now();
        const batch = writeBatch(db);
        for (let i = 1; i <= chunkCount; i++) {
          const chunkRef = doc(db, getCollectionPath('catalogs'), `search_index_p${i}`);
          batch.set(chunkRef, {
            chunkId: `search_index_p${i}`,
            items: shards[i - 1],
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        const manifestRef = doc(db, getCollectionPath('catalogs'), 'search_index');
        batch.set(manifestRef, {
          chunkId: 'search_index',
          version: manifestVersion,
          chunkCount,
          totalItems: allItems.length,
          updatedAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }, { merge: true });

        await batch.commit();

        // Update in-memory state tracking
        lastReconcileTime = Date.now();
        lastReconcileVersion = manifestVersion;
        lastReconciledItems = allItems;

        // Trigger rebuild signal
        await inventorySyncMetaService.recordInventoryChange([], 'rebuild');

        console.log(`✅ [catalogShardSyncService] Reconciled all 7 shards (${allItems.length} items total) successfully!`);
        return { success: true, version: manifestVersion, totalItems: allItems.length, items: allItems };
      } catch (err) {
        console.error('🔥 [catalogShardSyncService] Error reconciling shards from products:', err);
        throw err;
      } finally {
        inFlightReconciliation = null;
      }
    })();

    return inFlightReconciliation;
  }
};
