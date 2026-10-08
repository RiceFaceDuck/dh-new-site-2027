import { createStore, get, set } from 'idb-keyval';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// ==========================================
// 1. Constants & Storage Store Definition
// ==========================================
const IDB_STORE_NAME = 'dh_storefront_store';
const IDB_DB_NAME = 'dh_storefront_db';

export const IDB_KEYS = {
  CATALOG: 'dh_storefront_full_catalog',
  META: 'dh_storefront_catalog_meta'
};

const storefrontStore = (typeof window !== 'undefined' && typeof indexedDB !== 'undefined')
  ? createStore(IDB_DB_NAME, IDB_STORE_NAME)
  : null;

// In-Memory Singleton Cache (0ms, 0 Reads within same SPA session)
let inMemoryCatalog = null;
let inMemoryMeta = null;
let isPrefetching = false;
let prefetchListeners = [];

// ==========================================
// 2. Data Sanitization Guard (Zero-Leak Security)
// ==========================================
/**
 * ทำความสะอาดข้อมูลสินค้าให้ปลอดภัยสำหรับหน้าร้าน 100%
 * ตัดราคาทุน, ข้อมูลซัพพลายเออร์, บันทึกสต็อกหลังบ้าน ออกจากฝั่ง Client
 */
export function sanitizeStorefrontProduct(item) {
  if (!item || typeof item !== 'object') return null;
  const sku = String(item.sku || item.id || '').trim();
  if (!sku) return null;

  // ป้องกันสินค้าที่ถูกปิดการใช้งาน
  if (item.isActive === false) return null;

  const price = Number(item.retailPrice ?? item.Price ?? item.price ?? item.wholesalePrice ?? 0) || 0;
  const stock = Number(item.stockQuantity ?? item.stock ?? 0) || 0;
  const image = (Array.isArray(item.images) && item.images[0]) || item.image || item.imageUrl || null;

  return {
    id: item.id || sku,
    sku,
    name: item.name || item.title || item.productName || sku,
    brand: item.brand || '',
    category: item.category || '',
    category_lower: item.category_lower || (item.category ? String(item.category).toLowerCase() : ''),
    model: item.model || '',
    price,
    retailPrice: price,
    stockQuantity: stock,
    stock,
    inStock: stock > 0,
    images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (image ? [image] : []),
    image,
    imageUrl: image,
    description: item.description || '',
    shortDescription: item.shortDescription || '',
    compatibleModels: Array.isArray(item.compatibleModels) ? item.compatibleModels : [],
    compatiblePartNumbers: Array.isArray(item.compatiblePartNumbers) ? item.compatiblePartNumbers : [],
    substituteSkus: Array.isArray(item.substituteSkus) ? item.substituteSkus : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    type: item.type || ''
  };
}

// ==========================================
// 3. Catalog Hydration Engine
// ==========================================
/**
 * ดึงข้อมูลสินค้าหน้าร้านฉบับเต็มอย่างมีประสิทธิภาพสูงสุด
 * 1. ตรวจสอบ In-Memory Singleton (0ms)
 * 2. ตรวจสอบ IndexedDB L2 Cache (0 Reads)
 * 3. ตรวจสอบ Manifest ใน Firestore เพียง 1 Read
 * 4. หาก Version ตรงกัน ➔ ใช้ข้อมูลในเครื่องทันที (1 Read ทั้งระบบ)
 * 5. หากแคชยังไม่มี ➔ โหลด Fast Slice ก่อน แล้วแอบโหลด Chunks ที่เหลือในเบื้องหลัง
 */
export async function getStorefrontCatalog(options = {}) {
  const { forceRefresh = false, onProgress = null } = options;

  // 1. Tier 1: In-Memory Singleton Hit
  if (!forceRefresh && inMemoryCatalog && inMemoryCatalog.length > 0) {
    return {
      products: inMemoryCatalog,
      meta: inMemoryMeta,
      isComplete: true,
      source: 'memory'
    };
  }

  // 2. Tier 2: IndexedDB L2 Cache Check
  let idbProducts = null;
  let idbMeta = null;

  if (storefrontStore && !forceRefresh) {
    try {
      const [cachedProducts, cachedMeta] = await Promise.all([
        get(IDB_KEYS.CATALOG, storefrontStore).catch(() => null),
        get(IDB_KEYS.META, storefrontStore).catch(() => null)
      ]);
      if (Array.isArray(cachedProducts) && cachedProducts.length > 0) {
        idbProducts = cachedProducts;
        idbMeta = cachedMeta;
      }
    } catch (idbErr) {
      console.warn('⚠️ [StorefrontCatalog] IDB read error:', idbErr);
    }
  }

  // 3. ตรวจสอบ Manifest ใน Firestore (catalogs/search_index) (1 Read)
  let manifest = null;
  try {
    const manifestRef = doc(db, getCollectionPath('catalogs'), 'search_index');
    const manifestSnap = await getDoc(manifestRef);
    if (manifestSnap && manifestSnap.exists()) {
      manifest = manifestSnap.data();
    }
  } catch (manifestErr) {
    console.warn('⚠️ [StorefrontCatalog] Manifest check error:', manifestErr?.message || manifestErr);
  }

  // หากมีแคชใน IndexedDB และ Version ตรงกับ Manifest ➔ Hit 100%
  if (manifest && idbProducts && idbMeta && !forceRefresh) {
    const manifestVersion = Number(manifest.version || manifest.updatedAt || 1);
    if (Number(idbMeta.version) === manifestVersion) {
      inMemoryCatalog = idbProducts;
      inMemoryMeta = idbMeta;
      return {
        products: idbProducts,
        meta: idbMeta,
        isComplete: true,
        source: 'idb'
      };
    }
  }

  // 4. กรณีมี IDB Cache เก่าแต่ Manifest เปลี่ยน หรือไม่มี Manifest (Offline) ➔ คืนของเก่าก่อนแล้วแอบซิงค์
  if (idbProducts && idbProducts.length > 0 && !forceRefresh && !manifest) {
    inMemoryCatalog = idbProducts;
    inMemoryMeta = idbMeta;
    return {
      products: idbProducts,
      meta: idbMeta,
      isComplete: true,
      source: 'idb_stale'
    };
  }

  // 5. Tier 3: Fetch Chunks (catalogs/search_index_p1..p7)
  const chunkCount = Number(manifest?.chunkCount || manifest?.searchChunkCount || 7);
  const manifestVersion = Number(manifest?.version || 1);

  // 🚀 Fast Path: โหลด Chunk 1 ก่อน เพื่อให้หน้าจอแสดงผลได้เร็วที่สุด (< 100ms)
  let initialProducts = [];
  try {
    const chunk1Ref = doc(db, getCollectionPath('catalogs'), 'search_index_p1');
    const chunk1Snap = await getDoc(chunk1Ref);
    if (chunk1Snap && chunk1Snap.exists()) {
      const c1Data = chunk1Snap.data();
      const rawC1 = c1Data.items || c1Data.products || [];
      if (Array.isArray(rawC1)) {
        initialProducts = rawC1.map(sanitizeStorefrontProduct).filter(Boolean);
      }
    }
  } catch (c1Err) {
    console.warn('⚠️ [StorefrontCatalog] Chunk 1 fast fetch error:', c1Err);
  }

  // หากได้ Chunk 1 แล้ว เริ่มกระบวนการ Background Prefetch สำหรับ Chunk 2 ถึง N ทันที
  if (initialProducts.length > 0) {
    inMemoryCatalog = initialProducts;
    inMemoryMeta = { version: manifestVersion, chunkCount, isPartial: true, timestamp: Date.now() };

    triggerBackgroundHydration(manifestVersion, chunkCount, initialProducts, onProgress);

    return {
      products: initialProducts,
      meta: inMemoryMeta,
      isComplete: false,
      source: 'chunk_1_partial'
    };
  }

  // หากไม่มี Chunk 1 ให้รวบรวม Chunks ทั้งหมดพร้อมกัน
  const fullResult = await fetchAllChunksDirectly(manifestVersion, chunkCount, onProgress);
  return fullResult;
}

// ==========================================
// 4. Background Pre-fetching Engine (requestIdleCallback)
// ==========================================
/**
 * แอบดาวน์โหลด Chunks ที่เหลือในเบื้องหลังโดยไม่รบกวน Thread หลักของเบราว์เซอร์
 */
function triggerBackgroundHydration(version, chunkCount, chunk1Items = [], onProgress = null) {
  if (isPrefetching) {
    if (onProgress) prefetchListeners.push(onProgress);
    return;
  }

  isPrefetching = true;
  if (onProgress) prefetchListeners.push(onProgress);

  const runHydration = async () => {
    try {
      const allItems = [...chunk1Items];
      const chunkPromises = [];

      for (let i = 2; i <= chunkCount; i++) {
        const chunkRef = doc(db, getCollectionPath('catalogs'), `search_index_p${i}`);
        chunkPromises.push(
          getDoc(chunkRef).then(snap => {
            if (snap && snap.exists()) {
              const d = snap.data();
              return d.items || d.products || [];
            }
            return [];
          }).catch(err => {
            console.warn(`⚠️ [BackgroundPrefetch] Error loading chunk ${i}:`, err);
            return [];
          })
        );
      }

      const results = await Promise.all(chunkPromises);
      results.forEach(items => {
        if (Array.isArray(items)) {
          allItems.push(...items.map(sanitizeStorefrontProduct).filter(Boolean));
        }
      });

      // Deduplicate by SKU or ID
      const seen = new Set();
      const deduped = [];
      for (const item of allItems) {
        const key = item.sku || item.id;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }

      // บันทึกลง Memory Singleton
      inMemoryCatalog = deduped;
      inMemoryMeta = {
        version,
        totalItems: deduped.length,
        chunkCount,
        timestamp: Date.now(),
        isPartial: false
      };

      // บันทึกลง IndexedDB ถาวร
      if (storefrontStore) {
        try {
          await Promise.all([
            set(IDB_KEYS.CATALOG, deduped, storefrontStore),
            set(IDB_KEYS.META, inMemoryMeta, storefrontStore)
          ]);
        } catch (saveErr) {
          console.warn('⚠️ [StorefrontCatalog] Failed to persist to IDB:', saveErr);
        }
      }

      // แจ้งผู้ฟังทั้งหมดว่าโหลดแคตตาล็อกฉบับสมบูรณ์เรียบร้อยแล้ว
      prefetchListeners.forEach(listener => {
        try { listener(deduped, inMemoryMeta); } catch { /* ignore */ }
      });
    } catch (err) {
      console.error('🔥 [BackgroundPrefetch] Critical error during background hydration:', err);
    } finally {
      isPrefetching = false;
      prefetchListeners = [];
    }
  };

  // ใช้ requestIdleCallback หากเบราว์เซอร์รองรับ หรือ fallback ไป setTimeout
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => runHydration(), { timeout: 2000 });
  } else {
    setTimeout(runHydration, 300);
  }
}

/**
 * ฟังก์ชันดึง Chunks ทั้งหมดพร้อมกันกรณีที่จำเป็น
 */
async function fetchAllChunksDirectly(version, chunkCount, onProgress = null) {
  const chunkPromises = [];
  for (let i = 1; i <= chunkCount; i++) {
    const chunkRef = doc(db, getCollectionPath('catalogs'), `search_index_p${i}`);
    chunkPromises.push(
      getDoc(chunkRef).then(snap => {
        if (snap && snap.exists()) {
          const d = snap.data();
          return d.items || d.products || [];
        }
        return [];
      }).catch(() => [])
    );
  }

  const chunkResults = await Promise.all(chunkPromises);
  const rawItems = [];
  chunkResults.forEach(items => {
    if (Array.isArray(items)) {
      rawItems.push(...items);
    }
  });

  const products = rawItems.map(sanitizeStorefrontProduct).filter(Boolean);
  const seen = new Set();
  const deduped = [];
  for (const item of products) {
    const key = item.sku || item.id;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  const meta = {
    version,
    totalItems: deduped.length,
    chunkCount,
    timestamp: Date.now(),
    isPartial: false
  };

  inMemoryCatalog = deduped;
  inMemoryMeta = meta;

  if (storefrontStore) {
    try {
      await Promise.all([
        set(IDB_KEYS.CATALOG, deduped, storefrontStore),
        set(IDB_KEYS.META, meta, storefrontStore)
      ]);
    } catch { /* ignore */ }
  }

  if (onProgress) {
    try { onProgress(deduped, meta); } catch { /* ignore */ }
  }

  return {
    products: deduped,
    meta,
    isComplete: true,
    source: 'chunks_full'
  };
}

/**
 * สมัครรับการแจ้งเตือนเมื่อ Full Catalog โหลดเสร็จในเบื้องหลัง
 */
export function subscribeStorefrontCatalogUpdates(callback) {
  if (typeof callback !== 'function') return () => {};
  if (inMemoryMeta && !inMemoryMeta.isPartial) {
    callback(inMemoryCatalog, inMemoryMeta);
    return () => {};
  }
  prefetchListeners.push(callback);
  return () => {
    prefetchListeners = prefetchListeners.filter(l => l !== callback);
  };
}
