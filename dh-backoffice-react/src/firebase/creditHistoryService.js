import { collection, query, orderBy, limit, getDocs, doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './config';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export const creditHistoryService = {
  getPointsHistory: async (userId, limitCount = 30) => {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, 'artifacts', appId, 'users', userId, 'credit_history'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 System Error [getPointsHistory]:", error);
      return [];
    }
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
