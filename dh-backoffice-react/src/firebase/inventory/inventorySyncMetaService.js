import { createStore, get, set } from 'idb-keyval';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  documentId,
  serverTimestamp,
  increment,
  limit
} from 'firebase/firestore';
import { db, auth } from '../config.js';
import { getCollectionPath } from 'dh-shared';

// ==========================================
// 1. Constants & IndexedDB Setup
// ==========================================
export const INVENTORY_SYNC_CHANNEL = 'dh_inventory_sync';
export const INVENTORY_STORAGE_KEY = 'dh_inventory_sync_event';
export const MAX_DELTA_SKUS = 150;
const SETTINGS_COLLECTION = getCollectionPath('settings');
const META_DOC_ID = 'inventory_meta';

export const IDB_KEYS = {
  CATALOG: 'dh_inventory_full_catalog',
  VERSION: 'dh_inventory_version',
  HASH: 'dh_inventory_catalog_hash',
  LAST_FETCH: 'dh_inventory_last_fetch'
};

export const inventoryStore = (typeof window !== 'undefined' && typeof indexedDB !== 'undefined')
  ? createStore('dh_inventory_db', 'dh_inventory_store')
  : null;

// ==========================================
// 2. Tier 1: In-Memory Singleton Cache
// ==========================================
let inMemoryCatalog = null;
let inMemoryVersion = 0;
let inMemoryHash = '';
let inMemoryLastFetch = 0;
let inFlightPromise = null;

// ==========================================
// 3. Normalization Helper
// ==========================================
/**
 * Normalizes a raw product object ensuring all required catalog fields exist.
 */
export function normalizeProduct(item) {
  if (!item || typeof item !== 'object') return null;
  const sku = String(item.sku || item.id || '').trim();
  if (!sku) return null;

  const wholesale = Number(item.Price !== undefined ? item.Price : (item.wholesalePrice !== undefined ? item.wholesalePrice : (item.price || 0))) || 0;
  const retail = Number(item.retailPrice !== undefined ? item.retailPrice : (item.Price || wholesale || 0)) || 0;
  const stock = Number(item.stockQuantity !== undefined ? item.stockQuantity : (item.stock !== undefined ? item.stock : 0)) || 0;
  const buffer = Number(item.bufferStock !== undefined ? item.bufferStock : 2) || 2;
  const image = item.image || item.imageUrl || (Array.isArray(item.images) && item.images[0]) || null;
  const barcode = item.barcode ? String(item.barcode).trim() : sku;

  return {
    ...item,
    id: item.id || sku,
    sku,
    barcode,
    name: item.name || sku,
    Price: wholesale,
    wholesalePrice: wholesale,
    retailPrice: retail,
    price: wholesale,
    stockQuantity: stock,
    stock,
    bufferStock: buffer,
    image,
    imageUrl: image,
    images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (image ? [image] : []),
    category: item.category || '',
    brand: item.brand || '',
    type: item.type || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    isActive: item.isActive !== false
  };
}

// ==========================================
// 4. Hash / Checksum Calculation
// ==========================================
/**
 * Deterministic Dual-Algorithm (FNV-1a 32-bit + DJB2 32-bit) Catalog Hash
 */
export function computeCatalogHash(catalog) {
  if (!catalog || !Array.isArray(catalog) || catalog.length === 0) {
    return 'empty_00000000';
  }

  const sorted = [...catalog].sort((a, b) =>
    String(a.sku || a.id || '').localeCompare(String(b.sku || b.id || ''))
  ).map(item =>
    `${item.sku || item.id || ''}:${Number(item.stockQuantity ?? 0)}:${Number(item.Price ?? item.price ?? item.wholesalePrice ?? 0)}:${Number(item.adjustmentHistory?.['30'] ?? 0)}:${item.updatedAt?.seconds || item.updatedAt || ''}`
  ).join('|');

  let h1 = 2166136261; // FNV-1a 32-bit offset basis
  let h2 = 5381;       // DJB2 hash seed

  for (let i = 0; i < sorted.length; i++) {
    const code = sorted.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 16777619);
    h2 = ((h2 << 5) + h2) ^ code;
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `cat_${p1}${p2}_${catalog.length}`;
}

// ==========================================
// 5. Cross-Tab Broadcast & Channel Sync
// ==========================================
/**
 * Broadcasts inventory sync event across browser tabs with guaranteed channel cleanup.
 */
export function broadcastInventorySync(payload) {
  if (!payload || typeof payload !== 'object') return;
  const data = {
    type: payload.type || 'INVENTORY_VERSION_INCREMENT',
    version: typeof payload.version === 'number' ? payload.version : undefined,
    skus: Array.isArray(payload.skus) ? payload.skus.filter(Boolean) : [],
    timestamp: typeof payload.timestamp === 'number' ? payload.timestamp : Date.now()
  };

  if (typeof BroadcastChannel !== 'undefined') {
    let channel = null;
    try {
      channel = new BroadcastChannel(INVENTORY_SYNC_CHANNEL);
      channel.postMessage(data);
    } catch (err) {
      console.warn('⚠️ [BroadcastSync] BroadcastChannel postMessage error:', err);
    } finally {
      if (channel) {
        try {
          channel.close();
        } catch {
          /* ignore close error */
        }
      }
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({
        ...data,
        _nonce: Math.random()
      }));
    } catch (err) {
      console.warn('⚠️ [BroadcastSync] localStorage fallback error:', err);
    }
  }
}

/**
 * Subscribes to cross-tab broadcast events with BroadcastChannel and storage fallback.
 */
export function subscribeInventorySyncChannel(callback, getCurrentVersion) {
  let isSubscribed = true;
  let channel = null;

  const handleMessage = (data) => {
    if (!isSubscribed || !data || typeof data !== 'object') return;
    try {
      const type = data.type;
      if (!type) return;
      const version = typeof data.version === 'number' ? data.version : undefined;
      const skus = Array.isArray(data.skus) ? data.skus : [];
      const timestamp = typeof data.timestamp === 'number' ? data.timestamp : Date.now();

      if (version !== undefined && typeof getCurrentVersion === 'function') {
        const currentVer = getCurrentVersion();
        if (typeof currentVer === 'number' && currentVer > 0 && version <= currentVer) {
          return;
        }
      }

      callback({ type, version, skus, timestamp });
    } catch (err) {
      console.warn('⚠️ [BroadcastSync] Error processing sync message:', err);
    }
  };

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(INVENTORY_SYNC_CHANNEL);
      channel.addEventListener('message', (event) => {
        handleMessage(event?.data);
      });
    } catch (err) {
      console.warn('⚠️ [BroadcastSync] BroadcastChannel init error:', err);
    }
  }

  const storageHandler = (event) => {
    if (!isSubscribed || event?.key !== INVENTORY_STORAGE_KEY || !event?.newValue) return;
    try {
      handleMessage(JSON.parse(event.newValue));
    } catch (err) {
      console.warn('⚠️ [BroadcastSync] Storage event parse error:', err);
    }
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', storageHandler);
  }

  return () => {
    isSubscribed = false;
    if (channel) {
      try {
        channel.close();
      } catch {
        /* ignore close error */
      }
      channel = null;
    }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('storage', storageHandler);
    }
  };
}

// ==========================================
// 6. Metadata Service (settings/inventory_meta)
// ==========================================
/**
 * Reads settings/inventory_meta document directly (1 Read).
 */
export async function getInventoryMeta() {
  try {
    const metaRef = doc(db, SETTINGS_COLLECTION, META_DOC_ID);
    const snap = await getDoc(metaRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('🔥 Error fetching inventory meta:', err);
    return null;
  }
}

/**
 * Subscribes to real-time updates on settings/inventory_meta.
 */
export function subscribeInventoryMeta(callback) {
  try {
    const metaRef = doc(db, SETTINGS_COLLECTION, META_DOC_ID);
    return onSnapshot(
      metaRef,
      (snap) => {
        if (snap.exists() && typeof callback === 'function') {
          callback(snap.data());
        }
      },
      (error) => {
        console.warn('⚠️ [InventorySyncMeta] Snapshot listener error:', error?.message || error);
      }
    );
  } catch (err) {
    console.error('🔥 Error subscribing inventory meta:', err);
    return () => {};
  }
}

/**
 * Resets the fullSyncRequired flag on settings/inventory_meta.
 */
export async function resetFullSyncFlag() {
  try {
    const metaRef = doc(db, SETTINGS_COLLECTION, META_DOC_ID);
    await setDoc(metaRef, {
      fullSyncRequired: false,
      lastUpdated: serverTimestamp(),
      lastAction: 'reset_full_sync_flag'
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('🔥 Error resetting fullSyncRequired flag:', err);
    return false;
  }
}

/**
 * Records an inventory change event to settings/inventory_meta.
 */
export async function recordInventoryChange(skus, action = 'update', newHash = null) {
  try {
    const skuList = Array.isArray(skus) ? skus : [skus];
    const cleanSkus = Array.from(new Set(
      skuList
        .filter(s => s != null && String(s).trim() !== '')
        .map(s => String(s).trim())
    ));

    if (cleanSkus.length === 0 && !newHash && action !== 'rebuild') return;

    const metaRef = doc(db, SETTINGS_COLLECTION, META_DOC_ID);
    const isRebuild = action === 'rebuild';
    const isOverLimit = cleanSkus.length > MAX_DELTA_SKUS;
    const fullSync = isRebuild || isOverLimit;

    const updatePayload = {
      version: increment(1),
      lastUpdated: serverTimestamp(),
      lastAction: action,
      recentUpdatedSkus: fullSync ? [] : cleanSkus,
      fullSyncRequired: fullSync,
      tags: ['inventory_meta', 'inventory_sync', action].filter(Boolean),
      updatedBy: auth?.currentUser?.uid || 'system',
      updatedByName: auth?.currentUser?.displayName || auth?.currentUser?.email || 'System'
    };

    if (isRebuild) {
      updatePayload.lastSnapshotAt = serverTimestamp();
    }
    if (newHash) {
      updatePayload.catalogHash = newHash;
    }

    await setDoc(metaRef, updatePayload, { merge: true });

    broadcastInventorySync({
      type: fullSync ? 'INVENTORY_VERSION_INCREMENT' : (cleanSkus.length > 0 ? 'INVENTORY_DELTA_MUTATION' : 'INVENTORY_VERSION_INCREMENT'),
      skus: fullSync ? [] : cleanSkus,
      timestamp: Date.now()
    });
  } catch (err) {
    console.warn('⚠️ [InventorySyncMeta] Failed to record inventory change:', err?.message || err);
  }
}

// ==========================================
// 7. Delta Fetch Engine
// ==========================================
/**
 * Fetches delta products for up to 150 SKUs in batches of 30 documents.
 */
export async function fetchDeltaProducts(updatedSkus) {
  if (!Array.isArray(updatedSkus) || updatedSkus.length === 0) return [];

  const cleanSkus = Array.from(new Set(
    updatedSkus
      .filter(s => s != null && String(s).trim() !== '')
      .map(s => String(s).trim())
  ));

  if (cleanSkus.length === 0) return [];

  const targetSkus = cleanSkus.slice(0, MAX_DELTA_SKUS);
  const productsCollection = collection(db, getCollectionPath('products'));
  const fetchedProducts = [];
  const fetchedSkuSet = new Set();

  const batches = [];
  for (let i = 0; i < targetSkus.length; i += 30) {
    batches.push(targetSkus.slice(i, i + 30));
  }

  for (const batch of batches) {
    try {
      // 1. Primary: query by documentId() 'in' batch (direct key lookup)
      const qDocId = query(productsCollection, where(documentId(), 'in', batch));
      const snapDocId = await getDocs(qDocId);

      snapDocId.forEach(docSnap => {
        if (docSnap.exists()) {
          const norm = normalizeProduct({ id: docSnap.id, ...docSnap.data() });
          if (norm && norm.sku) {
            fetchedProducts.push(norm);
            fetchedSkuSet.add(norm.sku);
            fetchedSkuSet.add(docSnap.id);
          }
        }
      });

      // 2. Fallback: check if any SKUs in this batch were not matched by documentId
      const missingSkus = batch.filter(sku => !fetchedSkuSet.has(sku) && !fetchedSkuSet.has(sku.toUpperCase()));
      if (missingSkus.length > 0) {
        const qSku = query(productsCollection, where('sku', 'in', missingSkus));
        const snapSku = await getDocs(qSku);
        snapSku.forEach(docSnap => {
          if (docSnap.exists()) {
            const norm = normalizeProduct({ id: docSnap.id, ...docSnap.data() });
            if (norm && norm.sku && !fetchedSkuSet.has(norm.sku)) {
              fetchedProducts.push(norm);
              fetchedSkuSet.add(norm.sku);
            }
          }
        });
      }
    } catch (err) {
      console.warn(`⚠️ [InventorySyncMeta] Batch delta query error for ${batch.length} SKUs:`, err?.message || err);
      // Secondary fallback on error
      try {
        const qFallback = query(productsCollection, where('sku', 'in', batch));
        const snapFallback = await getDocs(qFallback);
        snapFallback.forEach(docSnap => {
          if (docSnap.exists()) {
            const norm = normalizeProduct({ id: docSnap.id, ...docSnap.data() });
            if (norm && norm.sku && !fetchedSkuSet.has(norm.sku)) {
              fetchedProducts.push(norm);
              fetchedSkuSet.add(norm.sku);
            }
          }
        });
      } catch (fallbackErr) {
        console.warn('⚠️ [InventorySyncMeta] Batch delta fallback error:', fallbackErr?.message || fallbackErr);
      }
    }
  }

  return fetchedProducts;
}

// ==========================================
// 8. Tier 3: Cloud Firestore Chunk Hydration
// ==========================================
/**
 * Fetches all bundled catalog chunks (catalogs/search_index + search_index_p1..p7) strictly <= 8 reads.
 */
export async function fetchBundledCatalogChunks() {
  try {
    const manifestRef = doc(db, getCollectionPath('catalogs'), 'search_index');
    const manifestSnap = await getDoc(manifestRef);

    if (manifestSnap.exists()) {
      const data = manifestSnap.data();
      const chunkCount = Number(data.chunkCount || data.searchChunkCount || 0);
      const version = Number(data.version || 1);
      const chunkPromises = [];

      for (let i = 1; i <= chunkCount; i++) {
        const chunkRef = doc(db, getCollectionPath('catalogs'), `search_index_p${i}`);
        chunkPromises.push(getDoc(chunkRef).catch(err => {
          console.warn(`⚠️ [InventorySyncMeta] Chunk p${i} fetch error:`, err?.message || err);
          return null;
        }));
      }

      const chunkSnaps = await Promise.all(chunkPromises);
      const allItems = [];

      chunkSnaps.forEach(snap => {
        if (snap && snap.exists()) {
          const cData = snap.data();
          const items = cData.items || cData.products || [];
          if (Array.isArray(items)) {
            allItems.push(...items);
          }
        }
      });

      // Alternate naming fallback if search_index_p* returned empty
      if (allItems.length === 0 && chunkCount > 0) {
        const altPromises = [];
        for (let i = 0; i < chunkCount; i++) {
          const altRef = doc(db, getCollectionPath('catalogs'), `search_catalog_chunk_${i}`);
          altPromises.push(getDoc(altRef).catch(() => null));
        }
        const altSnaps = await Promise.all(altPromises);
        altSnaps.forEach(snap => {
          if (snap && snap.exists()) {
            const cData = snap.data();
            const items = cData.items || cData.products || [];
            if (Array.isArray(items)) {
              allItems.push(...items);
            }
          }
        });
      }

      if (allItems.length > 0) {
        return {
          catalog: allItems.map(normalizeProduct).filter(Boolean),
          version,
          chunkCount
        };
      }

      // Check L2 cache if chunks empty
      if (inventoryStore) {
        try {
          const cached = await get(IDB_KEYS.CATALOG, inventoryStore);
          if (Array.isArray(cached) && cached.length > 0) {
            console.warn('🛡️ [inventorySyncMetaService] Chunks empty; using L2 IndexedDB cache fallback');
            return {
              catalog: cached.map(normalizeProduct).filter(Boolean),
              version,
              chunkCount
            };
          }
        } catch {
          /* ignore L2 fallback error */
        }
      }

      return {
        catalog: [],
        version,
        chunkCount
      };
    } else {
      // Manifest absent fallback: check L2 cache
      if (inventoryStore) {
        try {
          const cached = await get(IDB_KEYS.CATALOG, inventoryStore);
          if (Array.isArray(cached) && cached.length > 0) {
            console.warn('🛡️ [inventorySyncMetaService] search_index manifest absent; using L2 IndexedDB cache fallback');
            return {
              catalog: cached.map(normalizeProduct).filter(Boolean),
              version: 1,
              chunkCount: 0
            };
          }
        } catch {
          /* ignore L2 fallback error */
        }
      }

      // Category shards fallback (cat_general, cat_hardware, etc.)
      const categories = ['general', 'hardware', 'battery', 'screen', 'keyboard', 'adapter', 'accessories'];
      const catItems = [];
      for (const cat of categories) {
        try {
          const snap = await getDoc(doc(db, getCollectionPath('catalogs'), `cat_${cat}`));
          if (snap.exists() && Array.isArray(snap.data().items)) {
            catItems.push(...snap.data().items);
          }
        } catch {
          /* ignore category shard error */
        }
      }
      if (catItems.length > 0) {
        return {
          catalog: catItems.map(normalizeProduct).filter(Boolean),
          version: 1,
          chunkCount: categories.length
        };
      }

      // Fallback: direct collection query
      try {
        const prodCol = collection(db, getCollectionPath('products'));
        const snap = await getDocs(query(prodCol, limit(500)));
        return {
          catalog: snap.docs.map(d => normalizeProduct({ id: d.id, ...d.data() })).filter(Boolean),
          version: 1,
          chunkCount: 0
        };
      } catch {
        return {
          catalog: [],
          version: 1,
          chunkCount: 0
        };
      }
    }
  } catch (err) {
    console.warn('⚠️ [inventorySyncMetaService] fetchBundledCatalogChunks error:', err);
    if (inventoryStore) {
      try {
        const cached = await get(IDB_KEYS.CATALOG, inventoryStore);
        if (Array.isArray(cached) && cached.length > 0) {
          return {
            catalog: cached.map(normalizeProduct).filter(Boolean),
            version: 1,
            chunkCount: 0
          };
        }
      } catch {
        /* ignore L2 fallback error */
      }
    }
    // If Firestore throws and no valid local cache exists in IDB, rethrow the error.
    throw err;
  }
}

// ==========================================
// 9. Core Workflow: 3-Tier Catalog Hydration
// ==========================================
async function _executeGetOrFetchCatalog(forceRefresh) {
  let localCatalog = null;
  let localVersion = 0;
  let localHash = '';

  // 1. Read L2 IndexedDB Cache
  if (inventoryStore) {
    try {
      const [cachedCatalog, cachedVersion, cachedHash] = await Promise.all([
        get(IDB_KEYS.CATALOG, inventoryStore),
        get(IDB_KEYS.VERSION, inventoryStore),
        get(IDB_KEYS.HASH, inventoryStore)
      ]);

      if (Array.isArray(cachedCatalog) && cachedCatalog.length > 0) {
        const sanitized = cachedCatalog.filter(item => item && typeof item === 'object' && (item.sku || item.id));
        if (sanitized.length > 0) {
          localCatalog = sanitized;
          localVersion = Number(cachedVersion || 0);
          localHash = cachedHash || computeCatalogHash(sanitized);
        }
      }
    } catch (err) {
      console.warn('⚠️ [InventorySyncMeta] IDB Read error:', err);
      localCatalog = null;
      localVersion = 0;
      localHash = '';
    }
  }

  // 2. If L2 cache exists and not forcing refresh, check server metadata
  if (!forceRefresh && localCatalog && localVersion > 0) {
    try {
      const meta = await getInventoryMeta();
      const serverVersion = Number(meta?.version || 0);
      const serverHash = meta?.catalogHash;

      // 2.1 Server version matches or local is up-to-date (Hit: 1 Meta Read, 0 Chunk Reads)
      if (serverVersion > 0 && localVersion >= serverVersion && (!serverHash || serverHash === localHash)) {
        inMemoryCatalog = localCatalog;
        inMemoryVersion = localVersion;
        inMemoryHash = localHash;
        inMemoryLastFetch = Date.now();

        return {
          catalog: localCatalog,
          products: localCatalog,
          version: localVersion,
          catalogHash: localHash,
          fromCache: true
        };
      }

      // 2.2 Delta Sync Eligible (serverVersion > localVersion, <= 150 SKUs, !fullSyncRequired)
      const recentSkus = meta?.recentUpdatedSkus || [];
      const canDelta = !meta?.fullSyncRequired && recentSkus.length > 0 && recentSkus.length <= MAX_DELTA_SKUS;

      if (serverVersion > localVersion && canDelta) {
        console.log(`⚡ [InventorySyncMeta] Delta sync: fetching ${recentSkus.length} updated SKUs (v${localVersion} -> v${serverVersion})...`);
        const deltaItems = await fetchDeltaProducts(recentSkus);

        if (deltaItems.length > 0) {
          const deltaMap = new Map(deltaItems.map(item => [item.sku, item]));
          const merged = localCatalog.map(item =>
            deltaMap.has(item.sku) ? { ...item, ...deltaMap.get(item.sku) } : item
          );
          const existingSkuSet = new Set(merged.map(item => item.sku));
          deltaItems.forEach(item => {
            if (!existingSkuSet.has(item.sku)) {
              merged.unshift(item);
              existingSkuSet.add(item.sku);
            }
          });

          const newHash = computeCatalogHash(merged);
          inMemoryCatalog = merged;
          inMemoryVersion = serverVersion;
          inMemoryHash = newHash;
          inMemoryLastFetch = Date.now();

          if (inventoryStore) {
            try {
              await Promise.all([
                set(IDB_KEYS.CATALOG, merged, inventoryStore),
                set(IDB_KEYS.VERSION, serverVersion, inventoryStore),
                set(IDB_KEYS.HASH, newHash, inventoryStore),
                set(IDB_KEYS.LAST_FETCH, inMemoryLastFetch, inventoryStore)
              ]);
            } catch (err) {
              console.warn('⚠️ [InventorySyncMeta] IDB delta write error:', err);
            }
          }

          return {
            catalog: merged,
            products: merged,
            version: serverVersion,
            catalogHash: newHash,
            fromCache: false
          };
        }
      }

      // 2.3 Server version advanced and full sync is required
      if (serverVersion > localVersion && !canDelta) {
        console.log(`📦 [InventorySyncMeta] Server version ${serverVersion} > local ${localVersion} with full sync required. Hydrating via bundled chunks (<=8 reads)...`);
        const chunkResult = await fetchBundledCatalogChunks();
        const rawChunks = Array.isArray(chunkResult) ? chunkResult : (chunkResult?.catalog || []);
        if (rawChunks.length > 0) {
          const normalized = rawChunks.map(normalizeProduct).filter(Boolean);
          const newHash = computeCatalogHash(normalized);
          inMemoryCatalog = normalized;
          inMemoryVersion = serverVersion;
          inMemoryHash = newHash;
          inMemoryLastFetch = Date.now();

          if (inventoryStore) {
            try {
              await Promise.all([
                set(IDB_KEYS.CATALOG, normalized, inventoryStore),
                set(IDB_KEYS.VERSION, serverVersion, inventoryStore),
                set(IDB_KEYS.HASH, newHash, inventoryStore),
                set(IDB_KEYS.LAST_FETCH, inMemoryLastFetch, inventoryStore)
              ]);
            } catch (err) {
              console.warn('⚠️ [InventorySyncMeta] IDB full sync write error:', err);
            }
          }

          return {
            catalog: normalized,
            products: normalized,
            version: serverVersion,
            catalogHash: newHash,
            fromCache: false
          };
        }
      }

      // Cache fallback if meta exists but no update applied
      inMemoryCatalog = localCatalog;
      inMemoryVersion = localVersion;
      inMemoryHash = localHash;
      return {
        catalog: localCatalog,
        products: localCatalog,
        version: localVersion,
        catalogHash: localHash,
        fromCache: true
      };
    } catch (err) {
      console.warn('⚠️ [InventorySyncMeta] Meta check error, using local cache fallback:', err);
      inMemoryCatalog = localCatalog;
      inMemoryVersion = localVersion;
      inMemoryHash = localHash;
      return {
        catalog: localCatalog,
        products: localCatalog,
        version: localVersion,
        catalogHash: localHash,
        fromCache: true
      };
    }
  }

  // 3. Cold Start (No local cache or forceRefresh) -> Fetch Bundled Chunks
  try {
    const chunkResult = await fetchBundledCatalogChunks();
    const { catalog: normalized = [], version = 1 } = Array.isArray(chunkResult)
      ? { catalog: chunkResult.map(normalizeProduct).filter(Boolean), version: 1 }
      : (chunkResult || {});

    if (normalized.length === 0) {
      if (localCatalog && localCatalog.length > 0) {
        console.warn('⚠️ [InventorySyncMeta] Fetched chunk catalog is empty; preserving existing local cache');
        inMemoryCatalog = localCatalog;
        inMemoryVersion = localVersion;
        inMemoryHash = localHash;
        return {
          catalog: localCatalog,
          products: localCatalog,
          version: localVersion,
          catalogHash: localHash,
          fromCache: true
        };
      }
      // If normalized.length === 0 and localCatalog is absent, do NOT write [] to IDB.
      console.warn('⚠️ [InventorySyncMeta] Cold start catalog fetch returned 0 items; refusing to write empty array to IDB.');
      return {
        catalog: null,
        products: [],
        version: 0,
        catalogHash: '',
        fromCache: false
      };
    }

    const newHash = computeCatalogHash(normalized);

    // Version is directly derived from manifestSnap in fetchBundledCatalogChunks,
    // completely eliminating the redundant getInventoryMeta() call (strictly <= 8 reads).
    inMemoryCatalog = normalized;
    inMemoryVersion = version;
    inMemoryHash = newHash;
    inMemoryLastFetch = Date.now();

    if (inventoryStore) {
      try {
        await Promise.all([
          set(IDB_KEYS.CATALOG, normalized, inventoryStore),
          set(IDB_KEYS.VERSION, version, inventoryStore),
          set(IDB_KEYS.HASH, newHash, inventoryStore),
          set(IDB_KEYS.LAST_FETCH, inMemoryLastFetch, inventoryStore)
        ]);
      } catch (err) {
        console.warn('⚠️ [InventorySyncMeta] IDB initial write error:', err);
      }
    }

    return {
      catalog: normalized,
      products: normalized,
      version,
      catalogHash: newHash,
      fromCache: false
    };
  } catch (err) {
    console.error('🔥 [InventorySyncMeta] Full catalog fetch error:', err);
    if (localCatalog && localCatalog.length > 0) {
      inMemoryCatalog = localCatalog;
      inMemoryVersion = localVersion;
      inMemoryHash = localHash;
      return {
        catalog: localCatalog,
        products: localCatalog,
        version: localVersion,
        catalogHash: localHash,
        fromCache: true
      };
    }
    return {
      catalog: null,
      products: [],
      version: 0,
      catalogHash: '',
      fromCache: false,
      error: err
    };
  }
}

/**
 * ⚡ 3-Tier Zero-Read Catalog Hydration Entry Point
 *
 * Tier 1: In-Memory Singleton (0ms, 0 Reads on Warm Hit)
 * Tier 2: IndexedDB L2 Persistent Cache (dh_inventory_db / dh_inventory_store)
 * Tier 3: Firestore Bundled Chunks (catalogs/search_index + search_index_p1..p7) <= 8 Reads total
 *
 * @param {Object|boolean} [options={ forceRefresh: false }]
 * @returns {Promise<{catalog: Array, products: Array, version: number, catalogHash: string, fromCache: boolean}>}
 */
export async function getOrFetchCatalog(options = {}) {
  const isForceRefresh = typeof options === 'boolean' ? options : !!options?.forceRefresh;

  // L1 In-Memory Cache Fast Return (0ms, 0 Reads)
  if (!isForceRefresh && Array.isArray(inMemoryCatalog) && inMemoryCatalog.length > 0) {
    return {
      catalog: inMemoryCatalog,
      products: inMemoryCatalog,
      version: inMemoryVersion,
      catalogHash: inMemoryHash,
      fromCache: true
    };
  }

  // In-flight promise deduplication
  if (!isForceRefresh && inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = _executeGetOrFetchCatalog(isForceRefresh).finally(() => {
    inFlightPromise = null;
  });

  return inFlightPromise;
}

// ==========================================
// 10. Default Export Object
// ==========================================
export const inventorySyncMetaService = {
  INVENTORY_SYNC_CHANNEL,
  INVENTORY_STORAGE_KEY,
  MAX_DELTA_SKUS,
  IDB_KEYS,
  inventoryStore,
  normalizeProduct,
  computeCatalogHash,
  broadcastInventorySync,
  subscribeInventorySyncChannel,
  getInventoryMeta,
  subscribeInventoryMeta,
  resetFullSyncFlag,
  recordInventoryChange,
  fetchDeltaProducts,
  fetchBundledCatalogChunks,
  getOrFetchCatalog
};

export default inventorySyncMetaService;
