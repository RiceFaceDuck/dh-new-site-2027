import { collection, query, orderBy, limit, getDocs, doc, runTransaction, serverTimestamp, increment, where, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export const creditHistoryService = {
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
    
    return onSnapshot(q, (snap) => {
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
  }
};

// ==========================================
// 💡 Track Ad Click & Legacy Support
// ==========================================

export const trackAdClick = async (partnerId) => {
  if (!partnerId) return;
  try {
    const statDocId = `${new Date().getFullYear()}-${new Date().getMonth()+1}`;
    const partnerStatsRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', partnerId, 'stats', statDocId);
    
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
