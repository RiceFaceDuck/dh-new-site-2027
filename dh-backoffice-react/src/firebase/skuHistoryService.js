import { get, set, del } from 'idb-keyval';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { historyService } from './historyService';

const CACHE_PREFIX = 'sku_hist_cache_';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (600,000 ms)
const memoryCache = new Map();

/**
 * Helper to safely extract milliseconds from various timestamp representations
 */
function getTimestampMs(t) {
  if (!t) return 0;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;
  if (typeof t === 'number') return t > 1e11 ? t : t * 1000;
  if (typeof t === 'string') {
    const parsed = Date.parse(t);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Ensures log.details is safely renderable in React JSX (e.g. HistoryModal.jsx)
 * while preserving structured object fields for HistoryLogPanel.jsx
 */
function makeDisplaySafe(log) {
  if (!log) return log;
  if (typeof log.details === 'object' && log.details !== null) {
    const summaryText = log.details.legacy_details || 
      log.details.text || 
      log.details.comment || 
      log.details.reason || 
      (log.details.reference ? `อ้างอิง #${log.details.reference}` : '') || 
      '';
    if (!log.details[Symbol.iterator]) {
      Object.defineProperty(log.details, Symbol.iterator, {
        enumerable: false,
        configurable: true,
        value: function*() { yield summaryText; }
      });
    }
  }
  return log;
}

/**
 * Creates a rich result object that implements both the contract of PROJECT.md
 * and array-like iterable compatibility.
 */
function createResultObject({ billingHistory, claimsHistory, activityLogs, logs, fromCache, cachedAt }) {
  const safeLogs = (logs || []).map(makeDisplaySafe);
  return {
    billingHistory: billingHistory || [],
    claimsHistory: claimsHistory || [],
    activityLogs: activityLogs || [],
    logs: safeLogs,
    fromCache: Boolean(fromCache),
    cachedAt: Number(cachedAt || Date.now()),
    [Symbol.iterator]() {
      return this.logs[Symbol.iterator]();
    },
    get length() {
      return this.logs.length;
    },
    map(...args) {
      return this.logs.map(...args);
    },
    filter(...args) {
      return this.logs.filter(...args);
    },
    slice(...args) {
      return this.logs.slice(...args);
    },
    forEach(...args) {
      return this.logs.forEach(...args);
    }
  };
}

/**
 * Fetch SKU history concurrently across orders, claims, and activity logs
 * with 2-tier caching (Memory L1 + IndexedDB L2, 10 min TTL).
 * 
 * @param {string|object} sku - Product SKU string or product object
 * @param {object|boolean} [options] - Options object { forceRefresh: boolean, product?: object } or boolean forceRefresh
 * @returns {Promise<object>} Result object with billingHistory, claimsHistory, activityLogs, logs, fromCache, cachedAt
 */
export async function fetchSkuHistory(sku, options = {}) {
  const skuStr = typeof sku === 'string' ? sku : (sku?.sku || '');
  if (!skuStr) {
    return createResultObject({
      billingHistory: [],
      claimsHistory: [],
      activityLogs: [],
      logs: [],
      fromCache: false,
      cachedAt: Date.now()
    });
  }

  const skuUpper = String(skuStr).trim().toUpperCase();
  const cacheKey = `${CACHE_PREFIX}${skuUpper}`;
  const forceRefresh = typeof options === 'boolean' ? options : Boolean(options?.forceRefresh);
  const product = (typeof sku === 'object' && sku !== null) ? sku : (options?.product || null);

  // 1. Check RAM Cache (L1) - 0 Reads
  if (!forceRefresh && memoryCache.has(skuUpper)) {
    const cached = memoryCache.get(skuUpper);
    if (cached && (Date.now() - (cached.cachedAt || 0) < CACHE_TTL)) {
      return createResultObject({ ...cached, fromCache: true });
    }
  }

  // 2. Check IndexedDB Cache (L2) - 0 Reads
  if (!forceRefresh) {
    try {
      const idbCached = await get(cacheKey);
      if (idbCached && idbCached.cachedAt && (Date.now() - idbCached.cachedAt < CACHE_TTL)) {
        memoryCache.set(skuUpper, idbCached);
        return createResultObject({ ...idbCached, fromCache: true });
      }
    } catch (e) {
      console.warn('Read SKU history IDB cache warning:', e);
    }
  }

  const billingHistory = [];
  const claimsHistory = [];
  const timelineLogs = [];

  // 3. Concurrently Query 3 Channels
  const [ordersResult, claimsResult, logsResult] = await Promise.all([
    // Channel a: Billing Orders (Firestore: where itemSkus array-contains sku, limit 20)
    (async () => {
      try {
        const ordersRef = collection(db, getCollectionPath('orders'));
        const ordersQuery = query(
          ordersRef,
          where('itemSkus', 'array-contains', skuUpper),
          limit(20)
        );
        const ordersSnap = await getDocs(ordersQuery);
        const docs = [];
        ordersSnap.forEach(docSnap => docs.push({ id: docSnap.id, data: docSnap.data() }));
        return docs;
      } catch (err) {
        console.warn('Fetch historical orders for SKU warning:', err);
        return [];
      }
    })(),

    // Channel b: Claims & Returns (Firestore: where payload.sku == sku, limit 25)
    (async () => {
      try {
        const claimsRef = collection(db, getCollectionPath('claims'));
        const claimsQuery = query(
          claimsRef,
          where('payload.sku', '==', skuUpper),
          limit(25)
        );
        const claimsSnap = await getDocs(claimsQuery);
        const docs = [];
        claimsSnap.forEach(docSnap => docs.push({ id: docSnap.id, data: docSnap.data() }));
        return docs;
      } catch (err) {
        console.warn('Fetch claims for SKU warning:', err);
        return [];
      }
    })(),

    // Channel c: System Activity Logs (GAS via historyService - 0 Firestore Reads)
    (async () => {
      try {
        const res = await historyService.getRecentLogs(30, null, 'ALL', 'ALL', skuUpper);
        return res?.logs || [];
      } catch (err) {
        console.warn('Fetch system logs for SKU warning:', err);
        return [];
      }
    })()
  ]);

  // Process Channel a (Orders)
  ordersResult.forEach(({ id: docId, data: order }) => {
    const matchingItems = (order.items || []).filter(item => 
      String(item?.sku || item?.id || '').trim().toUpperCase() === skuUpper
    );
    const totalQty = matchingItems.reduce((acc, item) => acc + (Number(item?.qty || item?.quantity) || 1), 0);
    const orderId = order.orderId || docId;
    const customerName = order.customerInfo?.fullName || 
      order.customerInfo?.name || 
      order.customerInfo?.displayName || 
      order.customer?.name || 
      order.customer?.accountName || 
      order.customer?.firstName || 
      order.walkInName || 
      'ลูกค้าทั่วไป';
    const unitPrice = Number(matchingItems[0]?.price || matchingItems[0]?.retailPrice || matchingItems[0]?.unitPrice || 0);
    const orderTotal = totalQty * unitPrice;
    const orderDate = order.createdAt 
      ? (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toISOString() : String(order.createdAt))
      : (order.date || new Date().toISOString());

    billingHistory.push({
      id: `order-${docId}`,
      orderId,
      date: orderDate,
      customer: customerName,
      qty: totalQty,
      price: unitPrice,
      total: orderTotal,
      status: order.status || 'COMPLETED'
    });

    timelineLogs.push({
      id: `order-hist-${docId}`,
      action: 'SALE',
      module: 'Billing',
      details: {
        type: 'ขายออก',
        qtyChange: -totalQty,
        reference: orderId,
        customerName,
        salePrice: unitPrice,
        orderId,
        legacy_details: `ขายออกบิล ${orderId} (${totalQty} ชิ้น) ให้ ${customerName}`
      },
      performedBy: order.creatorName || order.createdBy || 'Staff',
      timestamp: order.createdAt || { seconds: Math.floor(new Date(order.date || Date.now()).getTime() / 1000) },
      isSale: true
    });
  });

  // Process Channel b (Claims & Returns)
  claimsResult.forEach(({ id: docId, data: claim }) => {
    const payload = claim.payload || {};
    const claimTypeRaw = String(claim.type || '').toUpperCase();
    const isReturn = claimTypeRaw.includes('RETURN') || Boolean(payload.returnId);
    const isExchange = claimTypeRaw.includes('EXCHANGE') || claimTypeRaw.includes('SWAP') || Boolean(payload.exchangeId);
    
    const claimId = payload.claimId || payload.returnId || payload.exchangeId || claim.claimId || docId;
    const qty = Number(payload.qty || claim.qty || payload.quantity || 1);
    const status = claim.status || 'pending';
    const reason = payload.returnReason || payload.symptomCode || payload.issueDescription || payload.reason || claim.reason || '';
    const claimDate = claim.createdAt
      ? (claim.createdAt.seconds ? new Date(claim.createdAt.seconds * 1000).toISOString() : String(claim.createdAt))
      : (claim.date || new Date().toISOString());

    let normType = 'CLAIM';
    let normAction = 'CLAIM';
    let normModule = 'Claim';
    let qtyChange = 0;
    let label = 'รับเคลม';

    if (isReturn) {
      normType = 'RETURN';
      normAction = 'RETURN';
      normModule = 'Return';
      qtyChange = +qty;
      label = 'รับคืน';
    } else if (isExchange) {
      normType = 'EXCHANGE';
      normAction = 'EXCHANGE';
      normModule = 'Exchange';
      qtyChange = 0;
      label = 'เปลี่ยนสินค้า';
    }

    claimsHistory.push({
      id: `claim-${docId}`,
      claimId,
      date: claimDate,
      type: normType,
      qty,
      status,
      reason
    });

    timelineLogs.push({
      id: `claim-hist-${docId}`,
      action: normAction,
      module: normModule,
      details: {
        type: label,
        qtyChange,
        reference: claimId,
        claimType: payload.claimType || claim.claimType || label,
        issue: reason,
        claimStatus: status,
        reason,
        legacy_details: `${label} ${claimId} (${qty} ชิ้น)${reason ? `: ${reason}` : ''}`
      },
      performedBy: payload.creatorName || claim.creatorName || claim.createdBy || 'Staff',
      timestamp: claim.createdAt || { seconds: Math.floor(Date.now() / 1000) }
    });
  });

  // Process Channel c (System Activity Logs)
  const activityLogs = logsResult || [];
  activityLogs.forEach((log, index) => {
    const actUpper = String(log.action || '').toUpperCase();
    let action = 'SYSTEM';
    let qtyChange = 0;
    if (actUpper.includes('ADJUST') || actUpper.includes('STOCK')) {
      action = 'ADJUST';
    } else if (actUpper.includes('UPDATE') || actUpper.includes('EDIT')) {
      action = 'UPDATE';
    } else if (actUpper.includes('CREATE') || actUpper.includes('IMPORT') || actUpper.includes('RECEIVE')) {
      action = 'RECEIVE';
      qtyChange = Number(product?.stockQuantity || 0);
    }

    // Avoid duplicate if already represented by order or claim
    const logDetailsStr = typeof log.details === 'string' ? log.details : (log.details?.legacy_details || '');
    const isDuplicate = timelineLogs.some(tl => {
      const ref = tl.details?.reference;
      return ref && (log.targetId === ref || logDetailsStr.includes(ref));
    });

    if (!isDuplicate) {
      timelineLogs.push({
        id: `system-log-${log.id || `${log.client_timestamp || Date.now()}_${index}`}`,
        action,
        module: log.module || 'Inventory',
        details: {
          reference: log.targetId || skuUpper,
          legacy_details: logDetailsStr || JSON.stringify(log.details || {}),
          qtyChange
        },
        performedBy: log.actorName || log.performedBy || 'System',
        timestamp: log.timestamp || { seconds: 0 }
      });
    }
  });

  // Channel d: Product Object Internal Notes (if product passed)
  if (product) {
    if (product.comment && typeof product.comment === 'string' && product.comment.trim()) {
      timelineLogs.push({
        id: 'legacy-comment-str',
        action: 'NOTE',
        module: 'Note',
        details: { reference: 'บันทึกเดิม', text: product.comment, legacy_details: product.comment },
        performedBy: 'Legacy System',
        timestamp: { seconds: 0 },
        isLegacy: true
      });
    }

    if (Array.isArray(product.internalComments)) {
      product.internalComments.forEach((c, idx) => {
        timelineLogs.push({
          id: c.id || `legacy-arr-${idx}`,
          action: 'NOTE',
          module: 'Note',
          details: { reference: 'บันทึกโน้ต', text: c.text, legacy_details: c.text },
          performedBy: c.name || c.uid || 'Staff',
          timestamp: c.timestamp 
            ? (typeof c.timestamp.toMillis === 'function' ? c.timestamp : { seconds: Math.floor(new Date(c.timestamp).getTime() / 1000) }) 
            : { seconds: 0 },
          isLegacy: true
        });
      });
    }
  }

  // Sort timeline chronologically (newest first)
  timelineLogs.sort((a, b) => getTimestampMs(b.timestamp) - getTimestampMs(a.timestamp));

  // Deduplicate timeline logs by ID
  const deduplicatedLogs = [];
  const seenIds = new Set();
  for (const log of timelineLogs) {
    if (!seenIds.has(log.id)) {
      seenIds.add(log.id);
      deduplicatedLogs.push(log);
    }
  }

  // Sort billingHistory and claimsHistory descending by date
  billingHistory.sort((a, b) => getTimestampMs(b.date) - getTimestampMs(a.date));
  claimsHistory.sort((a, b) => getTimestampMs(b.date) - getTimestampMs(a.date));

  const now = Date.now();
  const cacheData = {
    billingHistory,
    claimsHistory,
    activityLogs,
    logs: deduplicatedLogs,
    cachedAt: now
  };

  // Save to L1 Memory Cache & L2 IndexedDB Cache
  memoryCache.set(skuUpper, cacheData);
  try {
    await set(cacheKey, cacheData);
  } catch (e) {
    console.warn('Save SKU history IDB cache warning:', e);
  }

  return createResultObject({ ...cacheData, fromCache: false });
}

/**
 * Clear cached SKU history from Memory and IndexedDB.
 * If sku is null/undefined, clears all memory cache entries.
 * 
 * @param {string|object} [sku] - Product SKU or null
 * @returns {Promise<void>}
 */
export async function clearSkuHistoryCache(sku = null) {
  try {
    if (sku) {
      const skuUpper = String(typeof sku === 'string' ? sku : (sku?.sku || '')).trim().toUpperCase();
      memoryCache.delete(skuUpper);
      await del(`${CACHE_PREFIX}${skuUpper}`);
    } else {
      memoryCache.clear();
    }
  } catch (e) {
    console.warn('Clear SKU history cache warning:', e);
  }
}

export const skuHistoryService = {
  fetchSkuHistory,
  clearSkuHistoryCache
};

export default skuHistoryService;
