import { get, set, del } from 'idb-keyval';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { safeJsonParse } from 'dh-shared';
import { gasStockService } from './gasStockService';

// Storage & Cache Keys
const IDB_CATALOG_PRODUCTS_KEY = 'dh_pos_catalog_products';
const IDB_CATALOG_META_KEY = 'dh_pos_catalog_meta';
const SESSION_CATALOG_KEY = 'search_hybrid_cache';
const SESSION_META_KEY = 'search_hybrid_cache_meta';
const SESSION_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// 💎 Tier 1: In-Memory Singleton Cache
let inMemoryProducts = null;
let inMemoryMeta = null;

/**
 * Normalize product object to guarantee all POS required fields exist.
 */
export const normalizeProduct = (p) => {
  if (!p || typeof p !== 'object') return null;
  const sku = String(p.sku || p.id || '').trim();
  if (!sku) return null;

  const wholesale = Number(p.Price !== undefined ? p.Price : (p.wholesalePrice !== undefined ? p.wholesalePrice : (p.retailPrice || 0))) || 0;
  const retail = Number(p.retailPrice !== undefined ? p.retailPrice : (p.Price || wholesale || 0)) || 0;
  const stock = Number(p.stockQuantity !== undefined ? p.stockQuantity : (p.stock !== undefined ? p.stock : 0)) || 0;
  const image = p.image || p.imageUrl || (Array.isArray(p.images) && p.images[0]) || null;
  const barcode = p.barcode ? String(p.barcode).trim() : sku;

  return {
    ...p,
    id: p.id || sku,
    sku,
    barcode,
    name: p.name || sku,
    Price: wholesale,
    retailPrice: retail,
    wholesalePrice: wholesale,
    stockQuantity: stock,
    stock,
    image,
    imageUrl: image,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (image ? [image] : []),
    category: p.category || '',
    brand: p.brand || '',
    type: p.type || '',
    tags: Array.isArray(p.tags) ? p.tags : []
  };
};

/**
 * Read cached products from Tier 1 (In-Memory or SessionStorage).
 */
const readFastCache = () => {
  if (Array.isArray(inMemoryProducts) && inMemoryProducts.length > 0) {
    return { products: inMemoryProducts, meta: inMemoryMeta, source: 'memory' };
  }

  if (typeof window !== 'undefined') {
    try {
      const sessionData = window.sessionStorage.getItem(SESSION_CATALOG_KEY);
      const sessionMeta = window.sessionStorage.getItem(SESSION_META_KEY);
      if (sessionData && sessionMeta) {
        const meta = safeJsonParse(sessionMeta);
        const now = Date.now();
        if (meta && meta.timestamp && (now - Number(meta.timestamp)) < SESSION_CACHE_TTL) {
          const parsed = safeJsonParse(sessionData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            inMemoryProducts = parsed;
            inMemoryMeta = meta;
            return { products: parsed, meta, source: 'session' };
          }
        }
      }
    } catch (e) {
      console.warn('[catalogHydrationService] Error reading session cache:', e);
    }
  }

  return null;
};

/**
 * Save products to Tier 1 (In-Memory and SessionStorage) and Tier 2 (IndexedDB).
 */
const persistCatalogCache = async (products, meta) => {
  if (!Array.isArray(products) || products.length === 0) return;

  inMemoryProducts = products;
  inMemoryMeta = meta;

  // SessionStorage (Tier 1)
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(SESSION_CATALOG_KEY, JSON.stringify(products));
      window.sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
      window.sessionStorage.setItem('search_hybrid_cache_expiry', String(Date.now() + SESSION_CACHE_TTL));
    } catch (e) {
      console.warn('[catalogHydrationService] SessionStorage write error (likely full):', e.message);
    }
  }

  // IndexedDB (Tier 2 L2 persistent cache)
  try {
    await Promise.all([
      set(IDB_CATALOG_PRODUCTS_KEY, products),
      set(IDB_CATALOG_META_KEY, meta)
    ]);
  } catch (e) {
    console.warn('[catalogHydrationService] IndexedDB write error:', e.message);
  }
};

/**
 * ⚡ 3-Tier Local-First Catalog Hydration Service
 *
 * Tier 1: In-Memory / SessionStorage (0ms, 0 Reads)
 * Tier 2: IndexedDB L2 Cache with 1-Read Manifest check (catalogs/search_index)
 * Tier 3: Firestore Chunk Loading (catalogs/search_index_p1..p7) strictly <= 8 Reads total
 * Graceful Fallback: Google Apps Script backup inventory (gasStockService) if chunks fail
 */
export const hydrateCatalog = async (options = {}) => {
  const { forceRefresh = false } = options;

  // 1. Fast Tier 1 Check
  if (!forceRefresh) {
    const fastCache = readFastCache();
    if (fastCache) {
      return fastCache;
    }
  }

  // 2. Tier 2: Check IndexedDB L2 Cache
  let idbProducts = null;
  let idbMeta = null;
  try {
    const [cachedProducts, cachedMeta] = await Promise.all([
      get(IDB_CATALOG_PRODUCTS_KEY).catch(() => null),
      get(IDB_CATALOG_META_KEY).catch(() => null)
    ]);
    if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
      idbProducts = cachedProducts;
      idbMeta = cachedMeta;
    }
  } catch (e) {
    console.warn('[catalogHydrationService] IDB read error:', e);
  }

  // 3. Tier 3: Manifest check in Firestore (1 Read)
  let manifestSnap = null;
  let manifest = null;
  try {
    const manifestRef = doc(db, getCollectionPath('catalogs'), 'search_index');
    manifestSnap = await getDoc(manifestRef);
    if (manifestSnap && manifestSnap.exists()) {
      manifest = manifestSnap.data();
    }
  } catch (err) {
    console.warn('[catalogHydrationService] Manifest fetch error:', err.message);
  }

  // If manifest exists, check if IDB cache is already fresh
  if (manifest && idbProducts && idbMeta && !forceRefresh) {
    const manifestVersion = manifest.version || manifest.updatedAt || 1;
    if (idbMeta.version === manifestVersion) {
      // ✅ 1-Read Cache Hit! IDB cache is fresh and valid.
      inMemoryProducts = idbProducts;
      inMemoryMeta = idbMeta;
      return { products: idbProducts, meta: idbMeta, source: 'idb' };
    }
  }

  // 4. Fetch Chunks (catalogs/search_index_p1..p7)
  if (manifest) {
    try {
      const chunkCount = Number(manifest.chunkCount) || 7;
      const chunkPromises = [];
      for (let i = 1; i <= chunkCount; i++) {
        const chunkRef = doc(db, getCollectionPath('catalogs'), `search_index_p${i}`);
        chunkPromises.push(getDoc(chunkRef).catch(() => null));
      }

      const chunkSnaps = await Promise.all(chunkPromises);
      const rawItems = [];

      chunkSnaps.forEach((snap, idx) => {
        if (snap && snap.exists()) {
          const data = snap.data();
          const items = data.items || data.products || [];
          if (Array.isArray(items)) {
            rawItems.push(...items);
          }
        } else {
          console.warn(`[catalogHydrationService] Chunk search_index_p${idx + 1} not found.`);
        }
      });

      if (rawItems.length > 0) {
        const normalizedItems = rawItems
          .map(normalizeProduct)
          .filter(Boolean);

        const newMeta = {
          version: manifest.version || manifest.updatedAt || 1,
          totalItems: normalizedItems.length,
          timestamp: Date.now(),
          chunkCount
        };

        await persistCatalogCache(normalizedItems, newMeta);
        return { products: normalizedItems, meta: newMeta, source: 'chunks' };
      }
    } catch (chunkError) {
      console.error('[catalogHydrationService] Error fetching chunked catalog:', chunkError);
    }
  }

  // If IDB has any cached data, use it before calling external fallback
  if (idbProducts && idbProducts.length > 0 && !forceRefresh) {
    inMemoryProducts = idbProducts;
    inMemoryMeta = idbMeta || { version: 'idb_stale', timestamp: Date.now() };
    return { products: idbProducts, meta: inMemoryMeta, source: 'idb_stale' };
  }

  // 5. Graceful Fallback: Google Apps Script Backup (gasStockService)
  try {
    console.log('[catalogHydrationService] Falling back to gasStockService backup...');
    const gasData = await gasStockService.fetchBackupInventory();
    if (Array.isArray(gasData) && gasData.length > 0) {
      const normalizedGas = gasData
        .map(normalizeProduct)
        .filter(Boolean);

      const gasMeta = {
        version: 'gas_backup',
        totalItems: normalizedGas.length,
        timestamp: Date.now()
      };

      await persistCatalogCache(normalizedGas, gasMeta);
      return { products: normalizedGas, meta: gasMeta, source: 'gas' };
    }
  } catch (gasError) {
    console.error('[catalogHydrationService] Error in GAS fallback:', gasError);
  }

  // If all failed, return empty array defensively
  return { products: [], meta: { version: 'empty' }, source: 'none' };
};

/**
 * Fast lookup for a product by SKU in memory or cache.
 */
export const findProductInCache = (sku) => {
  if (!sku || !inMemoryProducts) return null;
  const term = String(sku).trim().toLowerCase();
  return inMemoryProducts.find(p => p.sku?.toLowerCase() === term || p.barcode?.toLowerCase() === term) || null;
};

/**
 * Clear all levels of catalog caches.
 */
export const clearCatalogCache = async () => {
  inMemoryProducts = null;
  inMemoryMeta = null;

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(SESSION_CATALOG_KEY);
      window.sessionStorage.removeItem(SESSION_META_KEY);
      window.sessionStorage.removeItem('search_hybrid_cache_expiry');
    } catch (e) {}
  }

  try {
    await Promise.all([
      del(IDB_CATALOG_PRODUCTS_KEY).catch(() => null),
      del(IDB_CATALOG_META_KEY).catch(() => null)
    ]);
  } catch (e) {}
};

export const catalogHydrationService = {
  hydrateCatalog,
  normalizeProduct,
  findProductInCache,
  clearCatalogCache
};
