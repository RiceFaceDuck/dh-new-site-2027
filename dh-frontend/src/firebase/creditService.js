import { collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, limit, runTransaction, increment } from 'firebase/firestore';
import { db } from './config';

// กำหนด App ID
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 Smart Cache System (สำหรับประวัติการใช้งาน)
// ==========================================
let historyCache = {}; // รูปแบบ: { userId: { data: [], fetchTime: timestamp } }
const CACHE_LIFETIME = 1000 * 60 * 5; // แคชประวัติไว้ 5 นาที (ประหยัด Reads)

// ==========================================
// 🎮 Gamification & Formatting (ลูกเล่นสร้างความตื่นเต้น)
// ==========================================

/**
 * 🏆 คำนวณระดับ VIP ของลูกค้าจากยอด Credit สะสม
 * ช่วยให้ลูกค้ารู้สึกสนุกและอยากสะสมคะแนนมากขึ้น
 */
export const getUserTier = (points = 0) => {
  if (points >= 10000) return { name: 'Platinum', icon: '👑', color: 'text-purple-600', bg: 'bg-purple-100' };
  if (points >= 5000) return { name: 'Gold', icon: '🥇', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (points >= 1000) return { name: 'Silver', icon: '🥈', color: 'text-gray-600', bg: 'bg-gray-100' };
  return { name: 'Member', icon: '🌟', color: 'text-blue-600', bg: 'bg-blue-100' };
};

/**
 * 💎 ฟอร์แมตตัวเลขให้ดูสวยงาม (เช่น 1,200 🪙)
 */
export const formatCredit = (points = 0) => {
  return new Intl.NumberFormat('th-TH').format(points);
};

// ==========================================
// 📡 Data Fetching Services
// ==========================================

/**
 * 💰 ดึงข้อมูล Wallet ล่าสุดแบบครั้งเดียว (One-time fetch)
 * @param {string} userId - ไอดีของลูกค้า
 */
export const getWalletBalance = async (userId) => {
  if (!userId) return { balance: 0, totalAccumulated: 0 };

  try {
    const walletRef = doc(db, 'artifacts', appId, 'users', userId, 'wallet', 'default');
    const snapshot = await getDoc(walletRef);
    
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return { balance: 0, totalAccumulated: 0 };
  } catch (error) {
    console.error("❌ Error fetching wallet balance:", error);
    return { balance: 0, totalAccumulated: 0 };
  }
};

/**
 * ⚡ ติดตามข้อมูล Wallet แบบ Real-time (ใช้สำหรับแสดงที่แถบเมนู หรือ Header)
 * @param {string} userId - ไอดีของลูกค้า
 * @param {function} callback - ฟังก์ชันรับข้อมูลเมื่อมีการเปลี่ยนแปลง
 * @returns {function} - ฟังก์ชันสำหรับ Unsubscribe
 */
export const subscribeToWallet = (userId, callback) => {
  if (!userId) return () => {};

  const walletRef = doc(db, 'artifacts', appId, 'users', userId, 'wallet', 'default');
  
  const unsubscribe = onSnapshot(
    walletRef, 
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          balance: data.balance || 0,
          totalAccumulated: data.totalAccumulated || 0,
          tier: getUserTier(data.balance || 0) // คืนค่าระดับ VIP ไปพร้อมกันเลย
        });
      } else {
        callback({ balance: 0, totalAccumulated: 0, tier: getUserTier(0) });
      }
    },
    (error) => {
      console.error("❌ Error subscribing to wallet:", error);
      callback({ balance: 0, error: true });
    }
  );

  return unsubscribe;
};

/**
 * 📜 ดึงประวัติการใช้งาน Credit (History Log)
 * ใช้การเรียงลำดับด้วย JavaScript Memory เพื่อความรวดเร็วและปลอดภัยจาก Missing Index Error
 * @param {string} userId - ไอดีของลูกค้า
 * @param {boolean} forceRefresh - บังคับดึงข้อมูลใหม่
 */
export const getCreditHistory = async (userId, forceRefresh = false) => {
  if (!userId) return [];

  const now = Date.now();
  const userCache = historyCache[userId];

  // คืนค่าจาก Cache ถ้ามีและยังไม่หมดอายุ
  if (!forceRefresh && userCache && (now - userCache.fetchTime < CACHE_LIFETIME)) {
    console.log("🟢 Loaded Credit History from Smart Cache (Saved Reads)");
    return userCache.data;
  }

  try {
    const historyRef = collection(db, 'artifacts', appId, 'users', userId, 'credit_history');
    
    // FETCH ข้อมูลโดย Query ดึงล่าสุด 30 รายการ ช่วยลดปริมาณ Reads แทนการดึงทั้งหมด
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    
    let historyList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // บันทึกลง Cache
    historyCache[userId] = {
      data: historyList,
      fetchTime: now
    };

    console.log(`📡 Fetched ${historyList.length} History Logs from Firestore`);
    return historyList;
  } catch (error) {
    console.error("❌ Error fetching credit history:", error);
    return userCache ? userCache.data : []; // หากเกิด Error ให้ดึง Cache เก่ามาใช้กันหน้าพัง
  }
};
// ==========================================
// 💡 Point Consumption Logic: หักแต้มสำหรับการโฆษณา
// ==========================================
export const consumeAdCredit = async (userId, amount, referenceId = null) => {
  if (!userId || amount <= 0) return false;

  const userRef = doc(db, 'users', userId);
  const txRef = doc(collection(db, 'credit_transactions'));

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้");

      const currentPoints = userDoc.data().points || 0;
      if (currentPoints < amount) throw new Error("แต้มสะสมไม่เพียงพอสำหรับการโฆษณา");

      const newBalance = currentPoints - amount;

      // 1. หักแต้มผู้ใช้
      transaction.update(userRef, {
        points: newBalance,
        updatedAt: new Date().toISOString()
      });

      // 2. บันทึกประวัติการหักแต้ม
      transaction.set(txRef, {
        transactionId: `TX-${Date.now()}`,
        uid: userId,
        type: 'spend',
        amount: amount,
        balanceAfter: newBalance,
        referenceId: referenceId,
        note: 'หักแต้มสำหรับค่าโฆษณา (Ad Impression/Click)',
        recordedBy: userId,
        timestamp: new Date().toISOString()
      });

      // 3. บันทึกสถิติลง sub-collection ของพาร์ทเนอร์ (Lead Generation Tracking)
      const partnerStatsRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', userId, 'stats', `${new Date().getFullYear()}-${new Date().getMonth()+1}`);
      const partnerStatsDoc = await transaction.get(partnerStatsRef);
      if (partnerStatsDoc.exists()) {
        transaction.update(partnerStatsRef, {
           impressions: increment(1),
           spentCredits: increment(amount),
           updatedAt: new Date().toISOString()
        });
      } else {
        transaction.set(partnerStatsRef, {
           impressions: 1,
           clicks: 0,
           spentCredits: amount,
           updatedAt: new Date().toISOString()
        });
      }
    });
    return true;
  } catch (error) {
    console.error("🔥 Error consuming ad credit:", error);
    throw error;
  }
};

// ==========================================
// 💡 Track Ad Click: บันทึกเมื่อมีการคลิกโฆษณาพาร์ทเนอร์
// ==========================================
export const trackAdClick = async (partnerId) => {
  if (!partnerId) return;

  try {
    const statDocId = `${new Date().getFullYear()}-${new Date().getMonth()+1}`;
    const partnerStatsRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', partnerId, 'stats', statDocId);

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(partnerStatsRef);
      if (docSnap.exists()) {
        transaction.update(partnerStatsRef, {
          clicks: increment(1),
          updatedAt: new Date().toISOString()
        });
      } else {
        transaction.set(partnerStatsRef, {
          impressions: 0,
          clicks: 1,
          spentCredits: 0,
          updatedAt: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    console.error("Error tracking ad click:", error);
  }
};
