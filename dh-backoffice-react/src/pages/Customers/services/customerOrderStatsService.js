import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { normalizePhone } from './customerMatchService';

export const CUSTOMER_ACTIVE_META_KEY = 'dh_customers_active_meta_v1';
export const CUSTOMER_ACTIVE_30D_KEY = 'dh_customers_active_30d_v1';

// ๐’ Tier 1: In-Memory Stats Cache
let activeCatalogMemoryCache = null;
const pageStatsMemoryCache = new Map();
const STATS_CACHE_TTL_MS = 5 * 60 * 1000;

export const clearCustomerStatsCache = (uid = null) => {
  if (uid) {
    pageStatsMemoryCache.delete(uid);
    if (activeCatalogMemoryCache?.customers?.[uid]) {
      delete activeCatalogMemoryCache.customers[uid];
    }
  } else {
    pageStatsMemoryCache.clear();
    activeCatalogMemoryCache = null;
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(CUSTOMER_ACTIVE_META_KEY);
        window.sessionStorage.removeItem(CUSTOMER_ACTIVE_30D_KEY);
      } catch (e) {}
    }
  }
};

/**
 * ๐ ๏ธ Parse any date/timestamp representation safely into epoch milliseconds.
 * Supports Firestore Timestamp (.toMillis(), .toDate()), seconds object, number, and date string.
 */
export const parseTimestamp = (val) => {
  if (!val || val === '-') return 0;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * ๐ก๏ธ Strict Paid Order Detection
 * Excludes cancelled, void, draft, pending, unpaid, or rejected orders.
 * Accurately detects completed / paid transactions.
 */
export const isOrderPaid = (orderData) => {
  if (!orderData) return false;
  const statusLower = (orderData.status || '').toLowerCase().trim();
  const paymentStatusLower = (orderData.paymentStatus || '').toLowerCase().trim();

  // 1. Explicitly cancelled, void, draft, deleted, rejected, or unpaid
  if (['cancelled', 'void', 'deleted', 'draft', 'rejected', 'ยกเลิก'].includes(statusLower)) return false;
  if (['unpaid', 'failed', 'pending', 'draft', 'waiting_payment', 'waiting_verification', 'รอชำระ', 'รอตรวจสอบ', 'ยกเลิก'].includes(paymentStatusLower)) return false;
  if (['pending', 'draft', 'waiting_payment', 'waiting_verification', 'รอชำระ', 'รอตรวจสอบ'].includes(statusLower)) return false;

  // 2. Explicitly paid flags
  if (orderData.isPaid === true) return true;
  if (['paid', 'completed', 'verified', 'success', 'ชำระแล้ว'].includes(paymentStatusLower)) return true;
  if (['paid', 'completed', 'success', 'approved', 'delivered', 'shipped', 'ปกติ', 'อนุมัติแล้ว'].includes(statusLower)) return true;

  return false;
};

/**
 * โก Fetch pre-aggregated 30-day active customer stats (Zero-Read Cache & Overwrite)
 * - Reads single pre-aggregated document `catalogs/customers_active_30d` (1 Read).
 * - Compares server `version` / `updatedAt` against cached metadata in SessionStorage.
 * - Returns `{ hasChanges, customersMap, version }`.
 * - 0 Reads if cached version matches.
 */
export const fetchActiveCustomerStats = async (force = false) => {
  try {
    // 1. Read cached metadata from SessionStorage
    let localMeta = null;
    let localCustomers = null;
    if (typeof window !== 'undefined') {
      try {
        const metaStr = window.sessionStorage.getItem(CUSTOMER_ACTIVE_META_KEY);
        if (metaStr) localMeta = JSON.parse(metaStr);
        const dataStr = window.sessionStorage.getItem(CUSTOMER_ACTIVE_30D_KEY);
        if (dataStr) localCustomers = JSON.parse(dataStr);
      } catch (e) {}
    }

    // 1.5 Fast-path guard: if already checked and missing recently within TTL, skip redundant Firestore read
    if (!force && activeCatalogMemoryCache?.missing && (Date.now() - (activeCatalogMemoryCache.checkedAt || 0) < STATS_CACHE_TTL_MS)) {
      return { hasChanges: false, customersMap: {}, version: 0 };
    }

    // 2. Fetch single pre-aggregated catalog document (1 Read)
    const activeDocRef = doc(db, getCollectionPath('catalogs'), 'customers_active_30d');
    const docSnap = await getDoc(activeDocRef);

    if (!docSnap || !docSnap.exists || !docSnap.exists()) {
      activeCatalogMemoryCache = {
        missing: true,
        checkedAt: Date.now(),
        customers: {},
        version: 0
      };
      return { hasChanges: false, customersMap: {}, version: 0 };
    }

    const serverData = docSnap.data() || {};
    const serverVersion = Number(serverData.version || 0);
    const customersMap = serverData.customers || serverData.items || {};

    const isSameVersion = localMeta && localMeta.version === serverVersion && localMeta.version > 0;

    // Fast-path: return cached map without re-processing sessionStorage
    if (!force && isSameVersion && (activeCatalogMemoryCache || localCustomers)) {
      if (!activeCatalogMemoryCache) {
        activeCatalogMemoryCache = {
          ...serverData,
          customers: localCustomers || customersMap
        };
      }
      return {
        hasChanges: false,
        customersMap: activeCatalogMemoryCache.customers || localCustomers || customersMap,
        version: serverVersion
      };
    }

    // Version changed or cold fetch -> update In-Memory and SessionStorage
    activeCatalogMemoryCache = serverData;
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(CUSTOMER_ACTIVE_META_KEY, JSON.stringify({
          version: serverVersion,
          updatedAt: parseTimestamp(serverData.updatedAt) || Date.now(),
          activeCount: serverData.activeCount || Object.keys(customersMap).length
        }));
        window.sessionStorage.setItem(CUSTOMER_ACTIVE_30D_KEY, JSON.stringify(customersMap));
      } catch (storageErr) {
        console.warn("โ ๏ธ [customerOrderStatsService] SessionStorage write warning:", storageErr.message);
      }
    }

    // Populate pageStatsMemoryCache for quick individual key lookups
    Object.entries(customersMap).forEach(([key, stats]) => {
      const statsObj = {
        lastOrderDate: Number(stats.lastOrderDate || 0),
        sales30Days: Number(stats.sales30Days || 0),
        orderCount30Days: Number(stats.orderCount30Days || 0)
      };
      pageStatsMemoryCache.set(key, { timestamp: Date.now(), data: statsObj });
      if (stats.uid) pageStatsMemoryCache.set(stats.uid, { timestamp: Date.now(), data: statsObj });
      if (stats.accountId) pageStatsMemoryCache.set(String(stats.accountId).toUpperCase(), { timestamp: Date.now(), data: statsObj });
      if (stats.phone) {
        const norm = normalizePhone(stats.phone);
        if (norm) pageStatsMemoryCache.set(norm, { timestamp: Date.now(), data: statsObj });
      }
    });

    return {
      hasChanges: true,
      customersMap,
      version: serverVersion
    };
  } catch (err) {
    console.error("Error fetching active customer stats:", err);
    return {
      hasChanges: false,
      customersMap: activeCatalogMemoryCache?.customers || {},
      version: 0
    };
  }
};

/**
 * ๐ฏ Instant zero-read lookup against cached `customers_active_30d` map for current page.
 * Strictly 0 queries to `orders` collection.
 */
export const fetchOrderStatsForPage = async (pageCustomers) => {
  if (!pageCustomers || !Array.isArray(pageCustomers) || pageCustomers.length === 0) return {};

  const orderStatsMap = {};

  // Retrieve active stats map from in-memory cache or SessionStorage
  let activeMap = activeCatalogMemoryCache?.customers || null;
  const phoneMap = activeCatalogMemoryCache?.phoneMap || {};
  const accountMap = activeCatalogMemoryCache?.accountMap || {};

  if (!activeMap && typeof window !== 'undefined') {
    try {
      const dataStr = window.sessionStorage.getItem(CUSTOMER_ACTIVE_30D_KEY);
      if (dataStr) activeMap = JSON.parse(dataStr);
    } catch (e) {}
  }

  // Build secondary lookup maps if phoneMap/accountMap not fully populated
  const byPhone = new Map(Object.entries(phoneMap));
  const byAccount = new Map(Object.entries(accountMap));
  if (activeMap) {
    Object.entries(activeMap).forEach(([key, stats]) => {
      if (stats.phone) {
        const norm = normalizePhone(stats.phone);
        if (norm && !byPhone.has(norm)) byPhone.set(norm, key);
      }
      if (stats.accountId) {
        const acc = String(stats.accountId).toUpperCase();
        if (!byAccount.has(acc)) byAccount.set(acc, key);
      }
    });
  }

  pageCustomers.forEach(cust => {
    const uid = cust.uid || cust.id;
    const accountId = cust.accountId ? String(cust.accountId).toUpperCase() : (cust.customerCode ? String(cust.customerCode).toUpperCase() : null);
    const rawPhone = cust.phone && cust.phone !== '-' ? cust.phone : (cust.phoneNumber && cust.phoneNumber !== '-' ? cust.phoneNumber : null);
    const normPhone = rawPhone ? normalizePhone(rawPhone) : null;

    let stats = null;
    if (activeMap) {
      if (uid && activeMap[uid]) {
        stats = activeMap[uid];
      } else if (cust.id && activeMap[cust.id]) {
        stats = activeMap[cust.id];
      } else if (accountId && (byAccount.has(accountId) && activeMap[byAccount.get(accountId)])) {
        stats = activeMap[byAccount.get(accountId)];
      } else if (normPhone && (byPhone.has(normPhone) && activeMap[byPhone.get(normPhone)])) {
        stats = activeMap[byPhone.get(normPhone)];
      }
    }

    // Fallback to pageStatsMemoryCache if available
    if (!stats) {
      if (uid && pageStatsMemoryCache.has(uid)) stats = pageStatsMemoryCache.get(uid).data;
      else if (cust.id && pageStatsMemoryCache.has(cust.id)) stats = pageStatsMemoryCache.get(cust.id).data;
      else if (accountId && pageStatsMemoryCache.has(accountId)) stats = pageStatsMemoryCache.get(accountId).data;
      else if (normPhone && pageStatsMemoryCache.has(normPhone)) stats = pageStatsMemoryCache.get(normPhone).data;
    }

    const fallbackLastOrder = parseTimestamp(
      cust.lastOrderDate || 
      cust.stats?.lastOrderDate || 
      cust.stats?.lastPurchaseDate || 
      cust.lastPurchaseDate || 0
    );

    const resolvedStats = {
      lastOrderDate: stats ? Number(stats.lastOrderDate || fallbackLastOrder) : fallbackLastOrder,
      sales30Days: stats ? Number(stats.sales30Days || 0) : 0,
      orderCount30Days: stats ? Number(stats.orderCount30Days || 0) : 0
    };

    if (uid) orderStatsMap[uid] = resolvedStats;
    if (cust.id) orderStatsMap[cust.id] = resolvedStats;
  });

  return orderStatsMap;
};
