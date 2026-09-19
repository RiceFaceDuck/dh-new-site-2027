import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const ORDER_CACHE_KEY = 'dh_recent_orders_cache_v1';
export const ORDER_META_KEY = 'dh_recent_orders_meta_v1';

// 💎 Tier 1: In-Memory Fast Cache
let inMemoryOrders = null;
let inMemoryMeta = null;

/**
 * Read local cached orders from memory or SessionStorage.
 */
export const readCachedOrders = () => {
  if (inMemoryOrders && inMemoryOrders.length > 0) {
    return { orders: inMemoryOrders, meta: inMemoryMeta };
  }

  if (typeof window !== 'undefined') {
    try {
      const metaStr = window.sessionStorage.getItem(ORDER_META_KEY);
      const dataStr = window.sessionStorage.getItem(ORDER_CACHE_KEY);
      if (metaStr && dataStr) {
        const meta = JSON.parse(metaStr);
        const orders = JSON.parse(dataStr);
        if (Array.isArray(orders) && orders.length > 0) {
          inMemoryOrders = orders;
          inMemoryMeta = meta;
          return { orders, meta };
        }
      }
    } catch (e) {
      console.warn("Error reading local order cache:", e);
    }
  }

  return { orders: null, meta: null };
};

/**
 * Write orders to memory and SessionStorage (Overwrite).
 */
export const writeCachedOrders = (orders, meta = {}) => {
  if (!Array.isArray(orders)) return;
  inMemoryOrders = orders;
  inMemoryMeta = {
    version: meta.version || Date.now(),
    updatedAt: meta.updatedAt || Date.now(),
    count: orders.length
  };

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(ORDER_META_KEY, JSON.stringify(inMemoryMeta));
      window.sessionStorage.setItem(ORDER_CACHE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn("Error writing local order cache:", e);
    }
  }
};

/**
 * ⚡ Real-Time Bundled Orders Listener (Cache & Overwrite)
 * - Listens to a SINGLE document `catalogs/recent_orders` (1 Read).
 * - Reactively updates the UI whenever a new bill is created or modified.
 * - If the document does not exist yet, invokes `onFallbackNeeded` seamlessly.
 */
export const subscribeRecentOrdersCatalog = (onUpdate, onFallbackNeeded) => {
  try {
    const docRef = doc(db, getCollectionPath('catalogs'), 'recent_orders');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        if (onFallbackNeeded) onFallbackNeeded('NOT_FOUND');
        return;
      }

      const data = docSnap.data();
      const rawOrders = data.orders || [];

      if (!Array.isArray(rawOrders) || rawOrders.length === 0) {
        if (onFallbackNeeded) onFallbackNeeded('EMPTY');
        return;
      }

      // Convert stored timestamps/dates into consistent structure
      const formattedOrders = rawOrders.map(order => {
        let createdAt = order.createdAt;
        if (createdAt && typeof createdAt === 'number') {
          // Provide mock toDate() for seamless backwards compatibility with UI
          createdAt = {
            toDate: () => new Date(order.createdAt),
            seconds: Math.floor(order.createdAt / 1000),
            nanoseconds: 0
          };
        }
        return {
          ...order,
          createdAt
        };
      });

      // Cache & Overwrite
      writeCachedOrders(formattedOrders, {
        version: data.version,
        updatedAt: data.updatedAt
      });

      if (onUpdate) {
        onUpdate(formattedOrders);
      }
    }, (error) => {
      console.warn("⚠️ subscribeRecentOrdersCatalog error (using fallback):", error.message);
      if (onFallbackNeeded) onFallbackNeeded(error);
    });

    return unsubscribe;
  } catch (err) {
    console.warn("⚠️ Exception in subscribeRecentOrdersCatalog:", err);
    if (onFallbackNeeded) onFallbackNeeded(err);
    return () => {};
  }
};
