import { collection, doc, getDoc, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../config';
import { getUsersPath, historyCache, CACHE_LIFETIME } from './creditConfig';

export const getWalletBalance = async (userId) => {
  if (!userId) return { balance: 0, totalAccumulated: 0 };
  try {
    const usersPath = getUsersPath();
    const walletRef = doc(db, usersPath, userId, 'wallet', 'default');
    const snapshot = await getDoc(walletRef);
    if (snapshot.exists()) return snapshot.data();
    return { balance: 0, totalAccumulated: 0 };
  } catch (error) {
    console.error("❌ Error fetching wallet balance:", error);
    return { balance: 0, totalAccumulated: 0 };
  }
};

export const getCreditHistory = async (userId, lastDoc = null, pageSize = 10, forceRefresh = false) => {
  if (!userId) return { logs: [], lastDoc: null, hasMore: false };

  const now = Date.now();
  const cacheKey = `${userId}_first_page`;

  if (!lastDoc && !forceRefresh && historyCache[cacheKey] && (now - historyCache[cacheKey].fetchTime < CACHE_LIFETIME)) {
    console.log('⚡ [CreditService] Returning cached history (First Page) for:', userId);
    return historyCache[cacheKey].data;
  }

  try {
    console.log(`☁️ [CreditService] Fetching history from Firestore... (Page: ${lastDoc ? 'Next' : 'First'})`);
    const usersPath = getUsersPath();
    const historyRef = collection(db, usersPath, userId, 'credit_history');
    let q;

    if (lastDoc) {
      q = query(historyRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(historyRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const logs = [];
    let newLastDoc = null;

    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() });
      newLastDoc = docSnap; 
    });

    const result = {
      logs,
      lastDoc: newLastDoc,
      hasMore: snapshot.docs.length === pageSize 
    };

    if (!lastDoc) {
      historyCache[cacheKey] = { data: result, fetchTime: now };
    }

    return result;
  } catch (error) {
    console.error("❌ [CreditService] Error fetching credit history:", error);
    if (!lastDoc && historyCache[cacheKey]) return historyCache[cacheKey].data;
    throw error;
  }
};
