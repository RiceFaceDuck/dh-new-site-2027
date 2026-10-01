import { collection, query, orderBy, limit, getDocs, doc, runTransaction, serverTimestamp, increment, where, onSnapshot, startAfter } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { creditCacheManager, CREDIT_CACHE_KEYS, CREDIT_CACHE_TTL } from './credit/creditCacheManager';

export const creditHistoryService = {
  getCachedCreditTransactions: async ({ limitCount = 50, forceRefresh = false, cursor = null } = {}) => {
    if (!forceRefresh && !cursor) {
      const cached = creditCacheManager.get(CREDIT_CACHE_KEYS.TRANSACTION_HISTORY, CREDIT_CACHE_TTL.TRANSACTION_HISTORY);
      if (cached) return cached;
    }
    try {
      let q;
      if (cursor) {
        q = query(
          collection(db, getCollectionPath('credit_transactions')),
          orderBy('timestamp', 'desc'),
          startAfter(cursor),
          limit(limitCount)
        );
      } else {
        q = query(
          collection(db, getCollectionPath('credit_transactions')),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : (d.timestamp || new Date().toISOString())
        };
      });
      list.lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      list.hasMore = snapshot.docs.length >= limitCount;

      if (!cursor) {
        creditCacheManager.set(CREDIT_CACHE_KEYS.TRANSACTION_HISTORY, list);
      }
      return list;
    } catch (error) {
      console.error("🔥 System Error [getCachedCreditTransactions]:", error);
      throw error;
    }
  },

  getPointsHistory: async (userId, limitCount = 30) => {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, getCollectionPath('credit_transactions')),
        where('uid', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 System Error [getPointsHistory]:", error);
      return [];
    }
  },

  subscribeToCreditTransactions: (callback, limitCount = 100) => {
    const q = query(
      collection(db, getCollectionPath('credit_transactions')),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          timestamp: d.timestamp?.toDate()?.toISOString() || new Date().toISOString()
        };
      });
      callback(data, null);
    }, (error) => {
      console.error("🔥 DH-Core System Error [Fetch History]:", error);
      callback(null, error);
    });
    return unsubscribe;
  }
};

// ==========================================
// 💡 Track Ad Click & Legacy Support
// ==========================================

export const trackAdClick = async (partnerId) => {
  if (!partnerId) return;
  try {
    const statDocId = `${new Date().getFullYear()}-${new Date().getMonth()+1}`;
    const partnerStatsRef = doc(db, getCollectionPath('partners'), partnerId, 'stats', statDocId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(partnerStatsRef);
      if (docSnap.exists()) {
        transaction.update(partnerStatsRef, { clicks: increment(1), updatedAt: serverTimestamp() });
      } else {
        transaction.set(partnerStatsRef, { impressions: 0, clicks: 1, spentCredits: 0, updatedAt: serverTimestamp() });
      }
    });
  } catch (error) {
    console.error("Error tracking ad click:", error);
  }
};

export const holdAdCredit = async (userId, amount, adTitle) => {
  console.info(`[Legacy Bypass] ข้ามการกันเครดิต ${amount} Pts (ระบบใหม่เปิดให้ใช้งานฟรี)`);
  return true; 
};

export const refundAdCredit = async (userId, amount, adTitle) => {
  console.info(`[Legacy Bypass] ข้ามการคืนเครดิต ${amount} Pts (เพราะไม่ได้ถูกหักออกแต่แรก)`);
  return true;
};
