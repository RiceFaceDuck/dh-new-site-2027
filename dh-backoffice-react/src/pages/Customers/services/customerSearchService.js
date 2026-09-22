import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared';

const searchCache = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes in-memory TTL

/**
 * 🔍 Smart In-Memory Memoized Database Search for Customers
 * Searches directly against users collection with exact indexed queries
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

    // 2. Numeric query -> Phone search across phone, tel, mobile
    if (/^[0-9]+$/.test(trimmed)) {
      const qPhone = query(usersRef, where('phone', '==', trimmed), limit(20));
      const qTel = query(usersRef, where('tel', '==', trimmed), limit(20));
      const qMobile = query(usersRef, where('mobile', '==', trimmed), limit(20));

      const [sPhone, sTel, sMobile] = await Promise.all([
        getDocs(qPhone),
        getDocs(qTel),
        getDocs(qMobile)
      ]);

      matches = [
        ...sPhone.docs.map(d => ({ id: d.id, ...d.data() })),
        ...sTel.docs.map(d => ({ id: d.id, ...d.data() })),
        ...sMobile.docs.map(d => ({ id: d.id, ...d.data() }))
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

    // 4. Deduplicate results
    const unique = matches.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);

    // 5. Store in memory cache
    searchCache.set(lower, { timestamp: Date.now(), data: unique });
    return unique;
  } catch (err) {
    console.error("🔥 Error searching customers from DB:", err);
    return [];
  }
};
