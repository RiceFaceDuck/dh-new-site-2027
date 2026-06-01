/* eslint-disable */
import { useState, useEffect } from 'react';
import { 
  collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, limit, 
  runTransaction, increment, serverTimestamp, deleteDoc, where, startAfter 
} from 'firebase/firestore';
import { db } from './config';

// 🛡️ กำหนด App ID สำหรับการเข้าถึงแบบ Enterprise Sandbox
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 Smart Cache System (สำหรับประวัติการใช้งาน)
// ==========================================
let historyCache = {}; 
const CACHE_LIFETIME = 1000 * 60 * 5; // แคชมีอายุ 5 นาที

/**
 * 🧹 ล้างข้อมูล Cache แบบเจาะจง User
 * (ลูกเล่น: จะถูกเรียกใช้อัตโนมัติเมื่อมีการเปลี่ยนแปลงยอดเงิน เพื่อให้ประวัติอัปเดตใหม่เสมอ)
 */
export const invalidateCreditHistoryCache = (userId) => {
  if (userId) {
    delete historyCache[`${userId}_first_page`];
    console.log(`🧹 [CreditService] History cache forcefully invalidated for: ${userId}`);
  }
};

// ==========================================
// 🎮 Gamification & Formatting 
// ==========================================

export const getUserTier = (points = 0) => {
  if (points >= 100000) return { name: 'Diamond', icon: '💎', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' };
  if (points >= 10000) return { name: 'Platinum', icon: '👑', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
  if (points >= 5000) return { name: 'Gold', icon: '🥇', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (points >= 1000) return { name: 'Silver', icon: '🥈', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
  return { name: 'Member', icon: '🌟', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
};

export const formatCredit = (points = 0) => {
  if (points === undefined || points === null) return '0';
  return new Intl.NumberFormat('th-TH').format(points);
};

// ==========================================
// 📡 Real-time Data Sync (หัวใจสำคัญแก้ปัญหาเงินไม่ขึ้น)
// ==========================================

export const listenToUserCredit = (userId, callback) => {
  if (!userId) {
    callback({ balance: 0, tier: getUserTier(0), totalAccumulated: 0, pendingCredits: 0 });
    return () => {};
  }

  const walletRef = doc(db, 'artifacts', appId, 'users', userId, 'wallet', 'default');
  const profileRef = doc(db, 'artifacts', appId, 'users', userId);

  let state = {
    balance: 0,
    totalAccumulated: 0,
    pendingCredits: 0
  };

  const notifyUI = () => {
    callback({
      balance: state.balance,
      tier: getUserTier(state.balance),
      totalAccumulated: state.totalAccumulated,
      pendingCredits: state.pendingCredits
    });
  };

  const unsubWallet = onSnapshot(walletRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      state.balance = Number(data.balance) || 0;
      state.totalAccumulated = Number(data.totalAccumulated) || state.balance;
      notifyUI(); 
    }
  });

  const unsubProfile = onSnapshot(profileRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      state.pendingCredits = Number(data.pendingCredits) || 0;
      
      if (state.balance === 0) {
        state.balance = Number(data.creditPoints || data.creditPoint || data.stats?.creditBalance || data.partnerCredit || 0);
      }
      notifyUI();
    }
  });

  return () => {
    unsubWallet();
    unsubProfile();
  };
};

export const useUserCredit = (userId) => {
  const [creditInfo, setCreditInfo] = useState({
    balance: 0,
    tier: getUserTier(0),
    totalAccumulated: 0,
    pendingCredits: 0,
    loading: true,
    error: false
  });

  useEffect(() => {
    if (!userId) {
      setCreditInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = listenToUserCredit(userId, (data) => {
      setCreditInfo({
        ...data,
        loading: false,
        error: data.error || false
      });
    });

    return () => unsubscribe();
  }, [userId]);

  return creditInfo;
};

// ==========================================
// 📜 History & Management Services 
// ==========================================

export const getWalletBalance = async (userId) => {
  if (!userId) return { balance: 0, totalAccumulated: 0 };
  try {
    const walletRef = doc(db, 'artifacts', appId, 'users', userId, 'wallet', 'default');
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

  // 1. ถ้าเป็นการโหลดหน้าแรกสุด และมีแคช ให้ส่งแคชกลับไปเลย
  if (!lastDoc && !forceRefresh && historyCache[cacheKey] && (now - historyCache[cacheKey].fetchTime < CACHE_LIFETIME)) {
    console.log('⚡ [CreditService] Returning cached history (First Page) for:', userId);
    return historyCache[cacheKey].data;
  }

  try {
    console.log(`☁️ [CreditService] Fetching history from Firestore... (Page: ${lastDoc ? 'Next' : 'First'})`);
    const historyRef = collection(db, 'artifacts', appId, 'users', userId, 'credit_history');
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

    // 2. จำลง Cache เฉพาะการโหลดหน้าแรก
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

// ==========================================
// 🛍️ Order & Payment Credit Logic
// ==========================================

export const getCreditSettings = async () => {
  try {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch (error) {
    console.error("🔥 System Error [getCreditSettings]:", error);
    return null;
  }
};

export const calculateEarnedPoints = (amount, config) => {
  if (!amount || amount <= 0 || !config) return 0;
  const earningRate = config.earningRate || 100;
  let basePoints = Math.floor(amount / earningRate);
  let multiplier = config.tierMultiplier || 1;
  return Math.floor(basePoints * multiplier);
};

export const handlePaymentCompletion = async (orderId, userId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      const userRef = doc(db, 'artifacts', appId, 'users', userId);
      
      const [orderDoc, userDoc] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(userRef)
      ]);

      if (!orderDoc.exists() || !userDoc.exists()) return;
      
      const orderData = orderDoc.data();
      const pendingPoints = orderData.pendingCredits || 0;
      
      if (pendingPoints <= 0 || orderData.pointsAwarded) return;

      const currentPoints = userDoc.data().creditPoints || userDoc.data().creditPoint || 0;
      const newBalance = currentPoints + pendingPoints;

      transaction.update(orderRef, {
        pendingCredits: 0,
        pointsAwarded: true
      });

      transaction.update(userRef, {
        creditPoints: newBalance,
        creditPoint: newBalance,
        walletBalance: newBalance,
        partnerCredit: newBalance,
        'stats.creditBalance': newBalance
      });

      const txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
      transaction.set(txRef, {
        transactionId: `EARN-${Date.now()}`,
        uid: userId,
        type: 'deposit',
        amount: pendingPoints,
        balanceAfter: newBalance,
        referenceId: orderId,
        note: 'ได้รับแต้มจากการสั่งซื้อ',
        timestamp: serverTimestamp()
      });
    });

    invalidateCreditHistoryCache(userId);
    return true;
  } catch (error) {
    console.error("🔥 System Error [handlePaymentCompletion]:", error);
    throw error;
  }
};

// ==========================================
// 🌟 Partner & Affiliate System
// ==========================================

export const deductPartnerCredit = async (partnerId, cost = 10, actionType = 'click_contact') => {
  if (!partnerId || cost <= 0) return false;

  const userRef = doc(db, 'artifacts', appId, 'users', partnerId);
  const txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
  const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', partnerId);
  const storeProfileRef = doc(db, 'artifacts', appId, 'users', partnerId, 'storeProfile', 'main');

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) return;

      const currentPoints = userDoc.data().creditPoints || userDoc.data().creditPoint || 0;
      
      if (currentPoints <= 0) {
        transaction.delete(activePartnerRef); 
        transaction.update(storeProfileRef, { isSupportActive: false }); 
        return; 
      }

      const actualDeduct = Math.min(currentPoints, cost);
      const newBalance = currentPoints - actualDeduct;

      transaction.update(userRef, {
        creditPoints: newBalance,
        creditPoint: newBalance,
        walletBalance: newBalance,
        partnerCredit: newBalance,
        'stats.creditBalance': newBalance,
        updatedAt: serverTimestamp()
      });

      if (newBalance <= 0) {
        transaction.delete(activePartnerRef);
        transaction.update(storeProfileRef, { isSupportActive: false });
      }

      transaction.set(txRef, {
        transactionId: `PARTNER-${actionType.toUpperCase()}-${Date.now()}`,
        uid: partnerId,
        type: 'spend',
        amount: actualDeduct,
        balanceAfter: newBalance,
        action: actionType,
        note: actionType === 'click_contact' ? 'ค่าธรรมเนียมลูกค้ากดติดต่อร้านซ่อม' : 'ค่าธรรมเนียมแสดงป้ายร้าน (Impression)',
        timestamp: serverTimestamp()
      });
    });

    invalidateCreditHistoryCache(partnerId);
    return true;
  } catch (error) {
    console.error("🔥 Error in deductPartnerCredit:", error);
    return false;
  }
};

// ==========================================
// 🚀 NEW: Ad & Marketing Credit Core (Unified Architecture)
// ==========================================

/**
 * ⚡ [NEW] ฟังก์ชันตรวจสอบเครดิตล่วงหน้าอย่างรวดเร็ว (Pre-Validation)
 * ป้องกันผู้ใช้งานที่ไม่มีเครดิตพยายามกรอกข้อมูลโฆษณา
 */
export const checkAdCreditSufficiency = async (userId, requiredAmount) => {
  if (!userId || requiredAmount <= 0) return false;
  try {
    const walletRef = doc(db, 'artifacts', appId, 'users', userId, 'wallet', 'default');
    const userRef = doc(db, 'artifacts', appId, 'users', userId);
    
    // ลองเช็คจาก wallet ก่อน
    const walletSnap = await getDoc(walletRef);
    if (walletSnap.exists()) {
      return (Number(walletSnap.data().balance) || 0) >= requiredAmount;
    }
    
    // ถ้าไม่มีให้เช็คจาก profile
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return (Number(userSnap.data().creditPoints || userSnap.data().creditPoint || 0)) >= requiredAmount;
    }
    
    return false;
  } catch (error) {
    console.error("🔥 Error pre-validating ad credit:", error);
    return false;
  }
};

/**
 * 🔒 [UPGRADE] ฟังก์ชันหักเครดิตสำหรับโฆษณาแบบ Atomic Transaction (แม่นยำ 100%)
 * เพิ่ม Category และ Module เพื่อให้ประวัติแสดงผลได้สวยงาม
 */
export const consumeAdCreditWithTransaction = async (transaction, userId, amount, referenceId = null, adTitle = null) => {
  const userRef = doc(db, 'artifacts', appId, 'users', userId);
  const walletRef = doc(db, 'artifacts', appId, 'users', userId, 'wallet', 'default');
  
  const txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
  const historyRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'credit_history'));

  const [userDoc, walletDoc] = await Promise.all([
    transaction.get(userRef),
    transaction.get(walletRef)
  ]);

  let currentPoints = 0;
  const isWalletExist = walletDoc.exists();

  if (isWalletExist) {
    currentPoints = Number(walletDoc.data().balance) || 0;
  } else if (userDoc.exists()) {
    currentPoints = Number(userDoc.data().creditPoints || userDoc.data().creditPoint || 0);
  } else {
    throw new Error("ระบบไม่พบข้อมูลกระเป๋าเงินของคุณ");
  }

  if (currentPoints < amount) {
    throw new Error(`Credit Point ของคุณไม่เพียงพอ (ต้องการ ${amount} แต้ม) กรุณาเติมเครดิตก่อนทำรายการ`);
  }

  const newBalance = currentPoints - amount;
  const noteDisplay = adTitle ? `หักแต้มสำหรับโปรโมท: ${adTitle}` : 'หักแต้มสำหรับการฝากโฆษณา';

  // 1. ตัดเงิน
  if (isWalletExist) {
    transaction.update(walletRef, {
      balance: newBalance,
      updatedAt: serverTimestamp()
    });
  } else {
    transaction.set(walletRef, {
      balance: newBalance,
      totalAccumulated: newBalance,
      updatedAt: serverTimestamp()
    });
  }

  // 2. ตัดเงินสำรอง (Legacy support)
  if (userDoc.exists()) {
    transaction.update(userRef, {
      creditPoints: newBalance,
      creditPoint: newBalance,
      walletBalance: newBalance,
      partnerCredit: newBalance,
      'stats.creditBalance': newBalance,
      updatedAt: serverTimestamp()
    });
  }

  // 3. สร้าง Log ข้อมูลที่หรูหราและระบุหมวดหมู่ชัดเจน
  const txData = {
    transactionId: `TX-ADS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    uid: userId,
    type: 'spend',
    category: 'ads', // 🏷️ ระบุหมวดหมู่เป็น ads ชัดเจน
    module: 'partner_support', 
    amount: amount,
    balanceAfter: newBalance,
    referenceId: referenceId,
    note: noteDisplay,
    recordedBy: userId,
    timestamp: serverTimestamp()
  };

  transaction.set(txRef, txData);
  transaction.set(historyRef, {
    ...txData,
    createdAt: serverTimestamp()
  });

  return newBalance;
};

export const consumeAdCredit = async (userId, amount, referenceId = null, adTitle = null) => {
  if (!userId || amount <= 0) return false;

  try {
    await runTransaction(db, async (transaction) => {
      await consumeAdCreditWithTransaction(transaction, userId, amount, referenceId, adTitle);
    });
    
    // 🧹 ล้างแคชประวัติเพราะเงินออก (Trigger UI Update ทันที)
    invalidateCreditHistoryCache(userId);

    return true;
  } catch (error) {
    console.error("🔥 Error consuming ad credit:", error.message);
    throw error; 
  }
};

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
  console.log(`[Legacy Bypass] ข้ามการกันเครดิต ${amount} Pts (ระบบใหม่สร้างโฆษณาฟรีก่อน ค่อยเก็บเงินตอนแสดงผลจริง)`);
  return true; 
};

export const refundAdCredit = async (userId, amount, adTitle) => {
  console.log(`[Legacy Bypass] ข้ามการคืนเครดิต ${amount} Pts (เพราะไม่ได้หักตอนแรก)`);
  return true;
};