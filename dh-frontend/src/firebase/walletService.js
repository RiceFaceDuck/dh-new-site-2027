/* eslint-disable */
import { useState, useEffect } from 'react';
import { 
  collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, limit, 
  runTransaction, serverTimestamp, startAfter, increment 
} from 'firebase/firestore';
import { db } from './config';

// 🛡️ กำหนด App ID สำหรับการเข้าถึงแบบ Enterprise Sandbox
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 Smart Cache System (สำหรับประวัติ Wallet)
// ==========================================
let walletHistoryCache = {}; 
const CACHE_LIFETIME = 1000 * 60 * 5; // แคชมีอายุ 5 นาที

/**
 * 🧹 ล้างข้อมูล Cache อัตโนมัติเมื่อมีการทำธุรกรรม
 */
export const invalidateWalletCache = (userId) => {
  if (userId) {
    delete walletHistoryCache[`${userId}_wallet_page_1`];
    console.log(`🧹 [WalletService] Wallet cache invalidated for: ${userId}`);
  }
};

// ==========================================
// 📡 Real-time Data Sync (ยอดเงินวอลเล็ต)
// ==========================================

/**
 * ⚡ Hook: ดึงยอดเงินวอลเล็ต และยอดที่กำลังรอถอนแบบ Real-time
 */
export const useWalletBalance = (uid) => {
  const [walletData, setWalletData] = useState({
    walletBalance: 0,
    pendingWithdrawal: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!uid) {
      setWalletData(prev => ({ ...prev, loading: false }));
      return;
    }

    const userRef = doc(db, 'artifacts', appId, 'users', uid);

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWalletData({
          walletBalance: Number(data.walletBalance || data.stats?.currentWallet || 0),
          pendingWithdrawal: Number(data.pendingWithdrawal || 0),
          loading: false,
          error: null
        });
      } else {
        setWalletData(prev => ({ ...prev, loading: false }));
      }
    }, (error) => {
      console.error("❌ [WalletService] Error listening to wallet:", error);
      setWalletData(prev => ({ ...prev, loading: false, error }));
    });

    return () => unsubscribe();
  }, [uid]);

  return walletData;
};

// ==========================================
// 📜 History Services (ระบบประวัติแบบ Pagination)
// ==========================================

/**
 * ⚡ โหลดประวัติการคืนเงิน/ถอนเงิน แบบประหยัด Reads (ทีละ 10)
 */
export const getWalletHistory = async (userId, lastDoc = null, pageSize = 10, forceRefresh = false) => {
  if (!userId) return { logs: [], lastDoc: null, hasMore: false };

  const now = Date.now();
  const cacheKey = `${userId}_wallet_page_1`;

  // 1. เสิร์ฟหน้าแรกจาก Cache ถ้ามี
  if (!lastDoc && !forceRefresh && walletHistoryCache[cacheKey] && (now - walletHistoryCache[cacheKey].fetchTime < CACHE_LIFETIME)) {
    console.log('⚡ [WalletService] Returning cached wallet history for:', userId);
    return walletHistoryCache[cacheKey].data;
  }

  try {
    const historyRef = collection(db, 'artifacts', appId, 'users', userId, 'wallet_transactions');
    let q;

    if (lastDoc) {
      q = query(historyRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(historyRef, orderBy('timestamp', 'desc'), limit(pageSize));
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
      walletHistoryCache[cacheKey] = { data: result, fetchTime: now };
    }

    return result;
  } catch (error) {
    console.error("❌ [WalletService] Error fetching wallet history:", error);
    if (!lastDoc && walletHistoryCache[cacheKey]) return walletHistoryCache[cacheKey].data;
    throw error;
  }
};

// ==========================================
// 🏦 Withdrawal & Transactions (หัวใจหลักของ Wallet)
// ==========================================

/**
 * 🚀 ร้องขอถอนเงินออกจากระบบ (Atomic Transaction)
 * @param {string} userId - ไอดีลูกค้า
 * @param {number} amount - จำนวนเงินที่ต้องการถอน
 * @param {object} bankInfo - ข้อมูลบัญชีธนาคาร { bankName, accountName, accountNumber }
 */
export const requestWalletWithdrawal = async (userId, amount, bankInfo) => {
  if (!userId || amount <= 0 || !bankInfo) {
    throw new Error("ข้อมูลไม่ครบถ้วน หรือยอดเงินไม่ถูกต้อง");
  }

  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'artifacts', appId, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้งาน");

      const userData = userSnap.data();
      const currentBalance = Number(userData.walletBalance || userData.stats?.currentWallet || 0);

      // 1. ตรวจสอบยอดเงิน (ป้องกันการแก้ HTML เพื่อถอนเงินเกินจริง)
      if (currentBalance < amount) {
        throw new Error("ยอดเงินค้างในระบบไม่เพียงพอต่อการถอน");
      }

      const txId = `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 2. ล็อกยอดเงินทันที! หักจาก walletBalance ไปไว้ที่ pendingWithdrawal
      transaction.update(userRef, {
        walletBalance: increment(-amount),
        pendingWithdrawal: increment(amount),
        updatedAt: serverTimestamp()
      });

      // 3. บันทึกประวัติฝั่งลูกค้า
      const userTxRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'wallet_transactions'));
      transaction.set(userTxRef, {
        transactionId: txId,
        type: 'WITHDRAWAL_REQUEST',
        amount: amount,
        status: 'PENDING',
        bankInfo: bankInfo,
        note: 'รอแอดมินตรวจสอบและโอนเงินเข้าบัญชี',
        timestamp: serverTimestamp()
      });

      // 4. 🌟 [COOL FEATURE] ยิงตรงเข้า To-do ส่วนกลางของระบบหลังบ้าน (Backoffice)
      const todoRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'todos'));
      transaction.set(todoRef, {
        taskId: txId,
        taskType: 'WALLET_WITHDRAWAL',
        status: 'PENDING',
        priority: 'HIGH',
        customer: {
          uid: userId,
          name: userData.displayName || userData.accountName || 'ลูกค้า',
          phone: userData.phoneNumber || ''
        },
        withdrawalDetails: {
          amount: amount,
          bankName: bankInfo.bankName,
          accountName: bankInfo.accountName,
          accountNumber: bankInfo.accountNumber
        },
        createdAt: serverTimestamp(),
        createdBy: userId
      });
    });

    // 🧹 ล้างแคชประวัติเพื่อบังคับให้หน้าเว็บดึงข้อมูลใหม่
    invalidateWalletCache(userId);

    console.log("✅ [WalletService] Withdrawal request processed and sent to Backoffice To-do.");
    return true;

  } catch (error) {
    console.error("🔥 [WalletService] Withdrawal Transaction Failed:", error.message);
    throw error;
  }
};

// ==========================================
// 🛡️ Legacy Support (ฮอทฟิกซ์: ป้องกัน Error ของ TabWallet.jsx ตัวเก่า)
// จะถูกโละทิ้งอย่างสมบูรณ์เมื่อเราไปถึงขั้นตอนที่ 8
// ==========================================
export const claimPendingCredit = async (userId, pendingId) => {
  console.log(`[WalletService] claimPendingCredit triggered for ${pendingId} (Legacy Bypass)`);
  // คืนค่า true ชั่วคราวเพื่อให้ UI ไม่ค้าง
  return true; 
};

export const earnPendingCredit = async (userId, amount) => {
  console.log(`[WalletService] earnPendingCredit triggered for ${amount} (Legacy Bypass)`);
  return true;
};