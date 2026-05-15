/* eslint-disable */
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, limit, runTransaction, increment, serverTimestamp, deleteDoc, where } from 'firebase/firestore';
import { db } from './config';

// 🛡️ กำหนด App ID สำหรับการเข้าถึงแบบ Enterprise Sandbox
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 Smart Cache System (สำหรับประวัติการใช้งาน)
// ==========================================
let historyCache = {}; 
const CACHE_LIFETIME = 1000 * 60 * 5; 

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

/**
 * ⚡ ดึงข้อมูลยอดเครดิตปัจจุบันแบบ Real-time (Dual-Listener)
 * เจาะเข้าไปดูในตู้เซฟ Wallet โดยตรง! รับประกันยอดเงินอัปเดตตรงกัน 100%
 */
export const listenToUserCredit = (userId, callback) => {
  if (!userId) {
    callback({ balance: 0, tier: getUserTier(0), totalAccumulated: 0, pendingCredits: 0 });
    return () => {};
  }

  // 🔥 อัปเกรด: ชี้เป้าไปที่ "ตู้เซฟกระเป๋าเงิน (Wallet)" โดยตรง แทนการดูแค่ป้ายชื่อหน้าโปรไฟล์
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

  // 🎧 Listener 1: ฟังการเคลื่อนไหวของกระเป๋าเงินหลัก (The Absolute Source of Truth)
  const unsubWallet = onSnapshot(walletRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      // อัปเดต state ด้วยยอดเงินล่าสุดที่แอดมินเพิ่งกดเพิ่มให้
      state.balance = Number(data.balance) || 0;
      state.totalAccumulated = Number(data.totalAccumulated) || state.balance;
      notifyUI(); // แจ้งหน้าเว็บให้อัปเดตตัวเลขทันที
    }
  });

  // 🎧 Listener 2: ฟังโปรไฟล์ (เพื่อดึงยอด Pending หรือใช้เป็นระบบสำรองกรณีบัญชีเก่ามาก)
  const unsubProfile = onSnapshot(profileRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      state.pendingCredits = Number(data.pendingCredits) || 0;
      
      // Fallback: ถ้ายอดในตู้เซฟ Wallet เป็น 0 ให้ลองสแกนหาใน Profile เผื่อเป็นบัญชีเก่าที่ยังไม่โดน Migrate
      if (state.balance === 0) {
        state.balance = Number(data.creditPoints || data.creditPoint || data.stats?.creditBalance || data.partnerCredit || 0);
      }
      notifyUI();
    }
  });

  // คืนค่าฟังก์ชันสำหรับปิดหูฟังทั้ง 2 ตัวเมื่อลูกค้าออกจากหน้าเว็บ
  return () => {
    unsubWallet();
    unsubProfile();
  };
};

/**
 * 🪝 React Hook อัจฉริยะ (Custom Hook) 
 */
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

export const getCreditHistory = async (userId, forceRefresh = false) => {
  if (!userId) return [];

  const now = Date.now();
  const userCache = historyCache[userId];

  if (!forceRefresh && userCache && (now - userCache.fetchTime < CACHE_LIFETIME)) {
    return userCache.data;
  }

  try {
    const historyRef = collection(db, 'artifacts', appId, 'users', userId, 'credit_history');
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    
    let historyList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    historyCache[userId] = { data: historyList, fetchTime: now };
    return historyList;
  } catch (error) {
    console.error("❌ Error fetching credit history:", error);
    return userCache ? userCache.data : []; 
  }
};

// ==========================================
// 🛍️ Order & Payment Credit Logic (ใช้สำหรับตะกร้าสินค้า Cart / Checkout)
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
        creditPoint: newBalance
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
    return true;
  } catch (error) {
    console.error("🔥 Error in deductPartnerCredit:", error);
    return false;
  }
};

export const consumeAdCredit = async (userId, amount, referenceId = null) => {
  if (!userId || amount <= 0) return false;

  const userRef = doc(db, 'artifacts', appId, 'users', userId);
  const txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้");

      const currentPoints = userDoc.data().creditPoints || userDoc.data().creditPoint || 0;
      if (currentPoints < amount) throw new Error("แต้มสะสมไม่เพียงพอ");

      const newBalance = currentPoints - amount;

      transaction.update(userRef, {
        creditPoints: newBalance,
        creditPoint: newBalance, 
        updatedAt: serverTimestamp()
      });

      transaction.set(txRef, {
        transactionId: `TX-${Date.now()}`,
        uid: userId,
        type: 'spend',
        amount: amount,
        balanceAfter: newBalance,
        referenceId: referenceId,
        note: 'หักแต้มสำหรับโฆษณา',
        recordedBy: userId,
        timestamp: serverTimestamp()
      });
    });
    return true;
  } catch (error) {
    console.error("🔥 Error consuming ad credit:", error);
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
  console.log(`[Legacy Bypass] ข้ามการกันเครดิต ${amount} Pts (ระบบใหม่สร้างฟรี)`);
  return true; 
};

export const refundAdCredit = async (userId, amount, adTitle) => {
  console.log(`[Legacy Bypass] ข้ามการคืนเครดิต ${amount} Pts (เพราะไม่ได้หักแต่แรก)`);
  return true;
};