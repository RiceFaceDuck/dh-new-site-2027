import { doc, getDoc, setDoc, getDocs, collection, query, where, orderBy, limit, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath, safeJsonParse } from 'dh-shared';

export const CUSTOMER_CACHE_KEY = 'dh_customers_data_cache_v10';
export const CUSTOMER_LAST_SYNC_KEY = 'dh_customers_last_sync_v10';

export const STAFF_ROLES = [
  'พนักงานทั่วไป', 'ช่าง', 'พนักงานแพ็ค', 'บัญชี', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ',
  'Admin', 'Manager', 'Owner', 'manager', 'owner', 'admin', 'packer', 'staff'
];

/**
 * 📞 Normalize Thai phone numbers to standard 10-digit format
 */
export const normalizePhone = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = String(phoneStr).replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) {
    digits = '0' + digits.substring(2);
  }
  return digits;
};

/**
 * ⏱️ Robust timestamp parsing helper converting Timestamp, object, or string to epoch milliseconds
 */
export const parseTimestampNumber = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  const p = new Date(val).getTime();
  return isNaN(p) ? 0 : p;
};

/**
 * 🛡️ Customer Order Matching Helper
 */
export const isCustomerMatch = (orderData, orderId, customer) => {
  if (!orderData || !customer) return false;

  const targetIds = [
    customer.id,
    customer.uid,
    customer.accountId,
    customer.customerCode
  ].filter(Boolean);

  const custEmail = customer.email ? String(customer.email).trim().toLowerCase() : null;
  const custPhone = normalizePhone(customer.phone || customer.phoneNumber || customer.contactPhone);

  const orderCust = orderData.customer || {};
  const orderCustInfo = orderData.customerInfo || {};

  const orderUid = orderCust.uid || orderData.userId || orderCustInfo.uid || orderData.customerId;
  const orderDocId = orderCust.id || orderCustInfo.id;
  const orderAccountId = orderCust.accountId || orderCustInfo.accountId;
  const orderCode = orderCust.customerCode || orderCustInfo.customerCode;
  const orderEmail = (orderCust.email || orderCustInfo.email || orderData.email || '').trim().toLowerCase();
  const orderPhone = normalizePhone(orderCust.phone || orderCustInfo.phone || orderData.walkInPhone || orderData.phone);

  if (targetIds.length > 0) {
    if (
      (orderUid && orderUid !== 'WALK-IN' && targetIds.includes(orderUid)) ||
      (orderDocId && orderDocId !== 'WALK-IN' && targetIds.includes(orderDocId)) ||
      (orderAccountId && targetIds.includes(orderAccountId)) ||
      (orderCode && targetIds.includes(orderCode))
    ) {
      return true;
    }
  }

  if (custEmail && custEmail.includes('@') && orderEmail && orderEmail.includes('@') && custEmail === orderEmail) {
    return true;
  }

  if (custPhone && custPhone.length >= 9 && orderPhone && orderPhone.length >= 9 && custPhone === orderPhone) {
    return true;
  }

  return false;
};

/**
 * 💎 Filter out staff & deleted records, then sort by Last Order -> 30D Sales -> Wallet
 */
export const filterAndSortCustomers = (users) => {
  if (!Array.isArray(users)) return [];

  const customersOnly = users.filter(user =>
    (!user.role || !STAFF_ROLES.includes(user.role)) &&
    user.status !== 'deleted' &&
    user.isActive !== false
  );

  return customersOnly.sort((a, b) => {
    const lastOrderA = Number(a.lastOrderDate || a.stats?.lastOrderDate || a.stats?.lastPurchaseDate || 0);
    const lastOrderB = Number(b.lastOrderDate || b.stats?.lastOrderDate || b.stats?.lastPurchaseDate || 0);
    if (lastOrderB !== lastOrderA) return lastOrderB - lastOrderA;

    const salesA = Number(a.sales30Days || a.stats?.sales30Days || a.stats?.monthlySales || 0);
    const salesB = Number(b.sales30Days || b.stats?.sales30Days || b.stats?.monthlySales || 0);
    if (salesB !== salesA) return salesB - salesA;

    const walletA = Number(a.walletBalance || 0);
    const walletB = Number(b.walletBalance || 0);
    return walletB - walletA;
  });
};

/**
 * 📦 Read cached customer directory from SessionStorage (with LocalStorage fallback)
 */
export const readCachedCustomers = async () => {
  let cachedUsers = [];
  let lastSync = 0;

  if (typeof window === 'undefined') {
    return { cachedUsers, lastSync };
  }

  try {
    const sessionData = window.sessionStorage.getItem(CUSTOMER_CACHE_KEY);
    const sessionSync = window.sessionStorage.getItem(CUSTOMER_LAST_SYNC_KEY);

    if (sessionData) {
      cachedUsers = safeJsonParse(sessionData) || [];
      if (sessionSync) lastSync = parseInt(sessionSync, 10) || 0;
    } else {
      // LocalStorage fallback for continuity
      const localData = localStorage.getItem(CUSTOMER_CACHE_KEY);
      const localSync = localStorage.getItem(CUSTOMER_LAST_SYNC_KEY);
      if (localData) {
        cachedUsers = safeJsonParse(localData) || [];
        if (localSync) lastSync = parseInt(localSync, 10) || 0;
        // Promote to sessionStorage
        window.sessionStorage.setItem(CUSTOMER_CACHE_KEY, localData);
        if (localSync) window.sessionStorage.setItem(CUSTOMER_LAST_SYNC_KEY, localSync);
      }
    }
  } catch (err) {
    console.error("Failed to parse customer cache:", err);
    cachedUsers = [];
  }

  return { cachedUsers, lastSync };
};

/**
 * 💾 Write customer directory to SessionStorage & LocalStorage
 */
export const writeCachedCustomers = (customersList) => {
  if (typeof window === 'undefined' || !Array.isArray(customersList)) return;

  try {
    const serialized = JSON.stringify(customersList);
    const syncTime = Date.now().toString();

    window.sessionStorage.setItem(CUSTOMER_CACHE_KEY, serialized);
    window.sessionStorage.setItem(CUSTOMER_LAST_SYNC_KEY, syncTime);
    localStorage.setItem(CUSTOMER_CACHE_KEY, serialized);
    localStorage.setItem(CUSTOMER_LAST_SYNC_KEY, syncTime);
  } catch (err) {
    console.error("Failed to write customer cache:", err);
  }
};

/**
 * ⚡ Fetch pre-bundled customer directory chunk from Firestore catalogs
 * Preserves 100% of fields (accountId, storeName, phone, address, etc.)
 */
export const fetchCustomerDirectoryChunk = async () => {
  try {
    const dirRef = doc(db, getCollectionPath('catalogs'), 'customers_directory');
    const dirSnap = await getDoc(dirRef);

    if (!dirSnap.exists()) return null;

    const dirData = dirSnap.data();
    let rawCustomers = Array.isArray(dirData.customers) ? dirData.customers : (Array.isArray(dirData.items) ? dirData.items : []);
    const chunkCount = Number(dirData.chunkCount || 0);

    // Multi-chunk partition support (when catalog exceeds single document limit)
    if (rawCustomers.length === 0 && chunkCount > 0) {
      const chunkPromises = [];
      for (let i = 1; i <= chunkCount; i++) {
        chunkPromises.push(getDoc(doc(db, getCollectionPath('catalogs'), `customers_directory_p${i}`)));
      }
      const chunkSnaps = await Promise.all(chunkPromises);
      chunkSnaps.forEach(snap => {
        if (snap.exists()) {
          const cData = snap.data();
          const items = Array.isArray(cData.customers) ? cData.customers : (Array.isArray(cData.items) ? cData.items : []);
          rawCustomers.push(...items);
        }
      });
    }

    if (rawCustomers.length === 0) return null;

    return rawCustomers.map(item => {
      const resolvedName = item.storeName || item.accountName || item.displayName || item.name || (item.firstName ? `${item.firstName} ${item.lastName || ''}`.trim() : '') || 'ลูกค้าทั่วไป';
      const resolvedPhone = item.phone && item.phone !== '-' ? item.phone : (item.phoneNumber && item.phoneNumber !== '-' ? item.phoneNumber : '-');
      const resolvedAccountId = item.accountId || item.customerCode || (item.id || item.uid)?.substring(0, 8)?.toUpperCase() || '';

      return {
        id: item.uid || item.id,
        uid: item.uid || item.id,
        ...item,
        name: resolvedName,
        storeName: item.storeName || resolvedName,
        displayName: item.displayName || resolvedName,
        accountName: item.accountName || resolvedName,
        phone: resolvedPhone,
        phoneNumber: resolvedPhone,
        logisticProvider: item.logisticProvider || item.preferredCourier || '',
        preferredCourier: item.preferredCourier || item.logisticProvider || '',
        logisticNote: item.logisticNote || '',
        role: item.role || item.rank || 'Customer',
        rank: item.rank || item.role || 'Customer',
        accountId: resolvedAccountId,
        customerCode: item.customerCode || resolvedAccountId,
        walletBalance: Number(item.walletBalance || 0),
        creditPoints: Number(item.creditPoints || item.points || 0),
        hasTaxInfo: Boolean(item.hasTaxInfo || item.taxId),
        address: item.address || null,
        legacyAddress: item.legacyAddress || null,
        shippingAddress: item.shippingAddress || null,
        taxId: item.taxId || null,
        shippingNotes: item.shippingNotes || '',
        contactName: item.contactName || '',
        lastOrderDate: parseTimestampNumber(item.lastOrderDate || item.stats?.lastOrderDate || 0),
        sales30Days: Number(item.sales30Days || 0),
        orderCount30Days: Number(item.orderCount30Days || 0),
        createdAt: item.createdAt?.toMillis ? item.createdAt.toMillis() : (typeof item.createdAt === 'number' ? item.createdAt : Date.now()),
        updatedAt: item.updatedAt?.toMillis ? item.updatedAt.toMillis() : (typeof item.updatedAt === 'number' ? item.updatedAt : Date.now())
      };
    });
  } catch (err) {
    console.warn("⚠️ Customers directory chunk fallback error:", err.message);
    return null;
  }
};

/**
 * 🚀 Bounded Delta Fetching from Firestore users collection
 */
export const fetchCustomersFromFirestore = async (lastSyncTime = 0, cachedUsers = []) => {
  const isIncremental = lastSyncTime > 0 && cachedUsers.length > 0;
  let q;

  if (isIncremental) {
    const bufferMs = 5 * 60 * 1000; // 5-minute safety window
    const safeSyncTime = Math.max(0, lastSyncTime - bufferMs);
    q = query(
      collection(db, getCollectionPath('users')),
      where('updatedAt', '>', Timestamp.fromMillis(safeSyncTime)),
      limit(300)
    );
  } else {
    q = query(
      collection(db, getCollectionPath('users')),
      orderBy('createdAt', 'desc'),
      limit(300)
    );
  }

  const snapshot = await getDocs(q);
  if (snapshot.empty && isIncremental) {
    return { updatedUsers: cachedUsers, hasChanges: false };
  }

  const fetchedData = snapshot.docs.map(d => {
    const data = d.data();
    const resolvedName = data.storeName || data.accountName || data.displayName || data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : '') || 'ลูกค้าทั่วไป';
    const resolvedPhone = data.phone && data.phone !== '-' ? data.phone : (data.phoneNumber && data.phoneNumber !== '-' ? data.phoneNumber : '-');
    const resolvedAccountId = data.accountId || data.customerCode || d.id.substring(0, 8).toUpperCase();

    return {
      id: d.id,
      uid: d.id,
      ...data,
      name: resolvedName,
      storeName: data.storeName || resolvedName,
      displayName: data.displayName || resolvedName,
      accountName: data.accountName || resolvedName,
      phone: resolvedPhone,
      phoneNumber: resolvedPhone,
      logisticProvider: data.logisticProvider || data.preferredCourier || '',
      preferredCourier: data.preferredCourier || data.logisticProvider || '',
      role: data.role || 'Customer',
      rank: data.rank || data.role || 'Customer',
      accountId: resolvedAccountId,
      customerCode: data.customerCode || resolvedAccountId,
      walletBalance: Number(data.walletBalance || 0),
      creditPoints: Number(data.creditPoints || data.stats?.rewardPoints || 0),
      hasTaxInfo: Boolean(data.hasTaxInfo || data.taxId || data.taxInfo || data.taxAddress),
      lastOrderDate: parseTimestampNumber(data.lastOrderDate || data.stats?.lastOrderDate || data.stats?.lastPurchaseDate || 0),
      sales30Days: Number(data.sales30Days || data.stats?.sales30Days || data.stats?.monthlySales || 0),
      orderCount30Days: Number(data.orderCount30Days || 0),
      createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
      updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt
    };
  });

  let mergedUsers = [];
  if (isIncremental) {
    const fetchedMap = new Map(fetchedData.map(u => [u.id, u]));
    mergedUsers = cachedUsers.map(u => fetchedMap.has(u.id) ? fetchedMap.get(u.id) : u);
    const existingIds = new Set(cachedUsers.map(u => u.id));
    const brandNew = fetchedData.filter(u => !existingIds.has(u.id));
    mergedUsers = [...mergedUsers, ...brandNew];
  } else {
    mergedUsers = fetchedData;
  }

  return { updatedUsers: mergedUsers, hasChanges: true };
};

/**
 * 📊 Apply Active 30-day stats delta onto customer array without re-fetching individual orders
 */
export const applyActiveStatsDelta = (customersList, activeStatsMap) => {
  if (!Array.isArray(customersList) || customersList.length === 0) {
    return { updatedList: customersList || [], isChanged: false };
  }
  if (!activeStatsMap || Object.keys(activeStatsMap).length === 0) {
    return { updatedList: customersList, isChanged: false };
  }

  const byUid = new Map();
  const byAccount = new Map();
  const byPhone = new Map();

  Object.entries(activeStatsMap).forEach(([key, stats]) => {
    if (!stats) return;
    if (stats.uid) {
      byUid.set(stats.uid, stats);
      byUid.set(String(stats.uid).toLowerCase(), stats);
      byUid.set(String(stats.uid).toUpperCase(), stats);
    }
    byUid.set(key, stats);
    byUid.set(String(key).toLowerCase(), stats);
    byUid.set(String(key).toUpperCase(), stats);

    if (stats.accountId) {
      byAccount.set(String(stats.accountId).toUpperCase(), stats);
    }
    if (stats.phone) {
      const norm = normalizePhone(stats.phone);
      if (norm && norm.length >= 9) byPhone.set(norm, stats);
    }
  });

  let isChanged = false;

  const updatedList = customersList.map(cust => {
    const targetId = cust.uid || cust.id;
    const targetAccount = cust.accountId ? String(cust.accountId).toUpperCase() : (cust.customerCode ? String(cust.customerCode).toUpperCase() : null);
    const targetPhone = cust.phone && cust.phone !== '-' ? cust.phone : (cust.phoneNumber && cust.phoneNumber !== '-' ? cust.phoneNumber : null);
    const normPhone = targetPhone ? normalizePhone(targetPhone) : null;

    const match = (targetId ? (byUid.get(targetId) || byUid.get(String(targetId).toLowerCase()) || byUid.get(String(targetId).toUpperCase())) : null) ||
                  (targetAccount ? byAccount.get(targetAccount) : null) ||
                  (normPhone ? byPhone.get(normPhone) : null);

    const currentLastOrder = Number(cust.lastOrderDate || cust.stats?.lastOrderDate || cust.stats?.lastPurchaseDate || 0);
    const currentSales30 = Number(cust.sales30Days || 0);
    const currentOrderCount30 = Number(cust.orderCount30Days || 0);

    if (match) {
      let resolvedLastOrder = currentLastOrder;
      if (match.lastOrderDate) {
        const parsedMatchDate = parseTimestampNumber(match.lastOrderDate);
        if (parsedMatchDate > 0) {
          resolvedLastOrder = Math.max(currentLastOrder, parsedMatchDate);
        }
      }

      const newSales = match.sales30Days !== undefined ? Number(match.sales30Days) : (match.sales30d !== undefined ? Number(match.sales30d) : currentSales30);
      const newCount = match.orderCount30Days !== undefined ? Number(match.orderCount30Days) : (match.orderCount30d !== undefined ? Number(match.orderCount30d) : currentOrderCount30);

      if (resolvedLastOrder !== currentLastOrder || newSales !== currentSales30 || newCount !== currentOrderCount30) {
        isChanged = true;
        return {
          ...cust,
          lastOrderDate: resolvedLastOrder,
          sales30Days: newSales,
          orderCount30Days: newCount,
          stats: {
            ...(cust.stats || {}),
            lastOrderDate: resolvedLastOrder,
            sales30Days: newSales,
            orderCount30Days: newCount
          }
        };
      }
    } else if (currentSales30 > 0 || currentOrderCount30 > 0) {
      isChanged = true;
      return {
        ...cust,
        sales30Days: 0,
        orderCount30Days: 0,
        stats: {
          ...(cust.stats || {}),
          sales30Days: 0,
          orderCount30Days: 0
        }
      };
    }

    return cust;
  });

  return { updatedList: isChanged ? updatedList : customersList, isChanged };
};

/**
 * 🔄 Auto-Sync single customer to Directory Chunk in Firestore (Client-side sync on mutation)
 */
export const syncCustomerToDirectoryChunk = async (customer, action = 'upsert') => {
  if (!customer) return;
  const targetId = customer.id || customer.uid;
  if (!targetId && action === 'delete') return;

  try {
    const dirRef = doc(db, getCollectionPath('catalogs'), 'customers_directory');

    const updatedItems = await runTransaction(db, async (transaction) => {
      const dirSnap = await transaction.get(dirRef);
      let items = [];

      if (dirSnap.exists()) {
        const data = dirSnap.data();
        items = Array.isArray(data.customers) ? [...data.customers] : [];
      }

      if (action === 'delete') {
        items = items.filter(c => c.id !== targetId && c.uid !== targetId);
      } else {
        const resolvedName = customer.storeName || customer.accountName || customer.displayName || customer.name || 'ลูกค้าทั่วไป';
        const resolvedPhone = customer.phone && customer.phone !== '-' ? customer.phone : (customer.phoneNumber && customer.phoneNumber !== '-' ? customer.phoneNumber : '-');
        const resolvedAccountId = customer.accountId || customer.customerCode || (targetId ? targetId.substring(0, 8).toUpperCase() : '');

        const newEntry = {
          uid: targetId,
          id: targetId,
          name: resolvedName,
          storeName: customer.storeName || resolvedName,
          displayName: customer.displayName || resolvedName,
          accountName: customer.accountName || resolvedName,
          phone: resolvedPhone,
          phoneNumber: resolvedPhone,
          logisticProvider: customer.logisticProvider || customer.preferredCourier || '',
          preferredCourier: customer.preferredCourier || customer.logisticProvider || '',
          logisticNote: customer.logisticNote || customer.shippingNotes || '',
          role: customer.role || customer.rank || 'Customer',
          rank: customer.rank || customer.role || 'Customer',
          accountId: resolvedAccountId,
          customerCode: customer.customerCode || resolvedAccountId,
          walletBalance: Number(customer.walletBalance || 0),
          creditPoints: Number(customer.creditPoints || 0),
          hasTaxInfo: Boolean(customer.hasTaxInfo || customer.taxId),
          address: customer.address || null,
          legacyAddress: customer.legacyAddress || null,
          shippingAddress: customer.shippingAddress || null,
          taxId: customer.taxId || null,
          shippingNotes: customer.shippingNotes || customer.logisticNote || '',
          contactName: customer.contactName || customer.firstName || '',
          firstName: customer.firstName || customer.contactName || '',
          lastOrderDate: Number(customer.lastOrderDate || 0),
          sales30Days: Number(customer.sales30Days || 0),
          orderCount30Days: Number(customer.orderCount30Days || 0),
          isActive: customer.isActive !== false,
          status: customer.status || 'active'
        };

        const existingIndex = items.findIndex(c =>
          (targetId && (c.id === targetId || c.uid === targetId)) ||
          (newEntry.phone && newEntry.phone !== '-' && c.phone === newEntry.phone)
        );

        if (existingIndex >= 0) {
          items[existingIndex] = { ...items[existingIndex], ...newEntry };
        } else {
          items.unshift(newEntry);
        }
      }

      transaction.set(dirRef, {
        chunkId: 'customers_directory',
        totalCustomers: items.length,
        generatedAt: Timestamp.now(),
        customers: items
      }, { merge: true });

      return items;
    });

    writeCachedCustomers(updatedItems);
    console.log(`✅ [Auto-Sync] Synchronized customer (${action}) to directory chunk with transaction. Total: ${updatedItems.length}`);
  } catch (err) {
    console.warn(`⚠️ [Auto-Sync] Failed to sync customer to directory chunk:`, err.message);
  }
};
