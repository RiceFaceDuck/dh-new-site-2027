import { collection, query, where, getDocs, getDoc, doc, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath, safeJsonParse } from 'dh-shared';

const searchCache = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes in-memory TTL

export const CUSTOMER_ADS_CACHE_KEY = 'dh_customers_ads_cache_v10';
const ADS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

let adsIndexMemoryCache = null;
let adsIndexLastFetch = 0;

/**
 * 📢 Fetch & Cache Partner Ads Index for Fast In-Memory Customer Search
 * Uses sessionStorage + memory Map for 0-Read performance during active sessions
 */
export const fetchCustomerAdsIndex = async (force = false) => {
  const now = Date.now();

  // 1. In-memory cache check
  if (!force && adsIndexMemoryCache && (now - adsIndexLastFetch < ADS_CACHE_TTL_MS)) {
    return adsIndexMemoryCache;
  }

  // 2. SessionStorage cache check
  if (!force && typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(CUSTOMER_ADS_CACHE_KEY);
      const rawTime = window.sessionStorage.getItem(`${CUSTOMER_ADS_CACHE_KEY}_time`);
      if (raw && rawTime) {
        const time = parseInt(rawTime, 10);
        if (now - time < ADS_CACHE_TTL_MS) {
          const parsed = safeJsonParse(raw);
          if (parsed && parsed.byUid) {
            adsIndexMemoryCache = parsed;
            adsIndexLastFetch = time;
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("⚠️ Failed reading ads index from sessionStorage:", e);
    }
  }

  // 3. Fetch from Firestore partner_ads (SSOT for all partner ads & business cards)
  try {
    const q = query(collection(db, getCollectionPath('partner_ads')), limit(500));
    const snapshot = await getDocs(q);

    const byUid = {};
    const byAccountId = {};
    const adsList = [];

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const adId = docSnap.id;
      const ownerId = d.ownerId || d.partnerId || (adId.startsWith('AD-CARD-') ? adId.replace('AD-CARD-', '') : null);
      const accountId = (d.accountId || d.customerId || '').trim().toUpperCase();

      const title = (d.title || d.partnerName || d.storeName || '').trim();
      const description = (d.description || d.richDescription || '').trim();
      const services = (d.services || '').trim();
      const openHours = (d.openHours || '').trim();
      const address = (d.address || '').trim();
      const landmarks = (d.landmarks || '').trim();
      const type = (d.type || '').trim();
      const phone = (d.phone || '').trim();

      const blobParts = [
        title,
        description,
        services,
        openHours,
        address,
        landmarks,
        type,
        phone,
        accountId
      ].filter(Boolean);

      const searchBlob = blobParts.join(' ').toLowerCase();

      const adInfo = {
        id: adId,
        title,
        partnerName: d.partnerName || title,
        description,
        services,
        openHours,
        address,
        landmarks,
        type,
        phone,
        ownerId,
        accountId,
        searchBlob,
        imageUrl: d.imageUrl || d.storeImage || ''
      };

      adsList.push(adInfo);

      if (ownerId) {
        if (!byUid[ownerId]) {
          byUid[ownerId] = {
            adStoreTitle: title,
            adSearchBlob: searchBlob,
            ads: [adInfo]
          };
        } else {
          byUid[ownerId].ads.push(adInfo);
          byUid[ownerId].adSearchBlob += ` ${searchBlob}`;
          if (!byUid[ownerId].adStoreTitle && title) {
            byUid[ownerId].adStoreTitle = title;
          }
        }
      }

      if (accountId) {
        if (!byAccountId[accountId]) {
          byAccountId[accountId] = {
            adStoreTitle: title,
            adSearchBlob: searchBlob,
            ads: [adInfo]
          };
        } else {
          byAccountId[accountId].ads.push(adInfo);
          byAccountId[accountId].adSearchBlob += ` ${searchBlob}`;
          if (!byAccountId[accountId].adStoreTitle && title) {
            byAccountId[accountId].adStoreTitle = title;
          }
        }
      }
    });

    const result = { byUid, byAccountId, adsList };
    adsIndexMemoryCache = result;
    adsIndexLastFetch = now;

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(CUSTOMER_ADS_CACHE_KEY, JSON.stringify(result));
        window.sessionStorage.setItem(`${CUSTOMER_ADS_CACHE_KEY}_time`, now.toString());
      } catch (e) {
        console.warn("⚠️ Failed writing ads index to sessionStorage:", e);
      }
    }

    return result;
  } catch (err) {
    console.error("🔥 Error fetching customer ads index:", err);
    return adsIndexMemoryCache || { byUid: {}, byAccountId: {}, adsList: [] };
  }
};

/**
 * 🧹 Clear ads index cache on manual refresh
 */
export const clearCustomerAdsCache = () => {
  adsIndexMemoryCache = null;
  adsIndexLastFetch = 0;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(CUSTOMER_ADS_CACHE_KEY);
      window.sessionStorage.removeItem(`${CUSTOMER_ADS_CACHE_KEY}_time`);
    } catch (e) {
      // Ignore
    }
  }
};

/**
 * 💎 Helper to attach Ad marketing data to customer object
 */
export const enrichCustomerWithAdData = (customer, adsIndex) => {
  if (!customer) return customer;
  const uid = customer.uid || customer.id;
  const accountId = (customer.accountId || customer.customerCode || '').trim().toUpperCase();

  const adEntry = (uid && adsIndex?.byUid?.[uid]) ||
                  (accountId && adsIndex?.byAccountId?.[accountId]) ||
                  null;

  if (!adEntry) return customer;

  return {
    ...customer,
    adStoreTitle: adEntry.adStoreTitle || customer.adStoreTitle || '',
    adSearchBlob: adEntry.adSearchBlob || customer.adSearchBlob || '',
    ads: adEntry.ads || customer.ads || []
  };
};

/**
 * 🔍 Smart In-Memory Memoized Database Search for Customers
 * Searches directly against users collection with exact indexed queries
 * AND searches partner_ads for marketing keywords (store name, description, services)
 */
export const searchCustomersFromDB = async (rawQuery) => {
  try {
    if (!rawQuery || rawQuery.trim().length < 2) return [];

    const trimmed = rawQuery.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check in-memory cache
    const cached = searchCache.get(lower);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const usersRef = collection(db, getCollectionPath('users'));
    let matches = [];

    const cleanDigits = trimmed.replace(/\D/g, '');
    const isPhoneNumber = cleanDigits.length >= 9 && /^0[0-9]{8,9}$/.test(cleanDigits);

    // 2. Numeric / Phone query -> Phone search across phone, tel, mobile, phoneNumber
    if (/^[0-9]+$/.test(trimmed) || isPhoneNumber) {
      const searchTarget = isPhoneNumber ? cleanDigits : trimmed;
      const qPhone = query(usersRef, where('phone', '==', searchTarget), limit(20));
      const qTel = query(usersRef, where('tel', '==', searchTarget), limit(20));
      const qMobile = query(usersRef, where('mobile', '==', searchTarget), limit(20));
      const qPhoneNumber = query(usersRef, where('phoneNumber', '==', searchTarget), limit(20));

      const [sPhone, sTel, sMobile, sPhoneNumber] = await Promise.all([
        getDocs(qPhone),
        getDocs(qTel),
        getDocs(qMobile),
        getDocs(qPhoneNumber)
      ]);

      matches = [
        ...sPhone.docs.map(d => ({ id: d.id, ...d.data() })),
        ...sTel.docs.map(d => ({ id: d.id, ...d.data() })),
        ...sMobile.docs.map(d => ({ id: d.id, ...d.data() })),
        ...sPhoneNumber.docs.map(d => ({ id: d.id, ...d.data() }))
      ];
    } else {
      // 3. String query -> AccountId, CustomerCode, Email
      const upper = trimmed.toUpperCase();
      const queries = [
        query(usersRef, where('accountId', '==', upper), limit(20)),
        query(usersRef, where('customerCode', '==', upper), limit(20)),
        query(usersRef, where('email', '==', lower), limit(20))
      ];

      if (trimmed !== upper) {
        queries.push(query(usersRef, where('accountId', '==', trimmed), limit(20)));
        queries.push(query(usersRef, where('customerCode', '==', trimmed), limit(20)));
      }

      const snaps = await Promise.all(queries.map(q => getDocs(q)));
      matches = snaps.flatMap(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // 4. 📢 Search in Partner Ads (ชื่อร้านค้าในโฆษณา, คำอธิบาย, บริการ เช่น "ดีไวซ์ ไอที", "ซ่อมคอมภูเก็ต")
    const adsIndex = await fetchCustomerAdsIndex();
    const matchingAds = (adsIndex?.adsList || []).filter(ad => {
      return ad.searchBlob && ad.searchBlob.includes(lower);
    });

    if (matchingAds.length > 0) {
      const existingUserIds = new Set(matches.map(m => m.id || m.uid));
      const targetUserIdsToFetch = new Set();

      matchingAds.forEach(ad => {
        if (ad.ownerId && !existingUserIds.has(ad.ownerId)) {
          targetUserIdsToFetch.add(ad.ownerId);
        }
      });

      if (targetUserIdsToFetch.size > 0) {
        const fetchPromises = Array.from(targetUserIdsToFetch).slice(0, 10).map(uid => 
          getDoc(doc(db, getCollectionPath('users'), uid))
        );
        const userSnaps = await Promise.all(fetchPromises);
        userSnaps.forEach(snap => {
          if (snap.exists()) {
            matches.push({ id: snap.id, uid: snap.id, ...snap.data() });
          }
        });
      }
    }

    // 5. Deduplicate and enrich results with Ads data
    const unique = matches
      .filter((item, idx, arr) => arr.findIndex(x => (x.id || x.uid) === (item.id || item.uid)) === idx)
      .map(item => enrichCustomerWithAdData(item, adsIndex));

    // 6. Store in memory cache
    searchCache.set(lower, { timestamp: Date.now(), data: unique });
    return unique;
  } catch (err) {
    console.error("🔥 Error searching customers from DB:", err);
    return [];
  }
};
