import { useState, useEffect } from 'react';
import { 
  collection, doc, getDocs, onSnapshot, query, orderBy, limit, 
  runTransaction, serverTimestamp, startAfter, increment 
} from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { getUsersPath } from 'dh-shared/src/firebase/pathUtils';
import { userDocumentSubscriptionManager } from './user/userDocumentSubscriptionManager';

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

    const unsubscribe = userDocumentSubscriptionManager.subscribe(uid, (data) => {
      if (data) {
        setWalletData({
          walletBalance: Number(data.walletBalance ?? 0),
          pendingWithdrawal: Number(data.pendingWithdrawal || 0),
          loading: false,
          error: null
        });
      } else {
        setWalletData(prev => ({ ...prev, loading: false }));
      }
    });

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (err) {
        console.warn("⚠️ [WalletService] Error during unmount cleanup:", err);
      }
    };
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
    const usersPath = getUsersPath();
    const historyRef = collection(db, usersPath, userId, 'wallet_transactions');
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
 * 🔒 [RESERVED / FUTURE FEATURE] ร้องขอถอนเงินอัตโนมัติออกจากระบบ
 * 
 * ⚠️ นโยบายปัจจุบัน: ระบบ "ถอนเงินอัตโนมัติบนหน้าเว็บ" ถูกล็อกสถานะ (HOLD) ไว้ก่อนตามคำสั่งผู้บริหาร
 * การขอคืนเงินของลูกค้าในปัจจุบันดำเนินการผ่านการติดต่อเจ้าหน้าที่ทาง LINE OA
 * เมื่อมีคำสั่งเปิดใช้งานในอนาคต ฟังก์ชันนี้จะถูกเชื่อมต่อไปยัง Cloud Function `requestWithdrawal` (Admin SDK)
 */
export const requestWalletWithdrawal = async (userId, amount, bankInfo) => {
  // 🛡️ Policy Guard: บล็อกการเรียกใช้จากไคลเอนต์โดยตรงจนกว่าจะได้รับคำสั่งเปิดใช้งาน
  throw new Error("ระบบถอนเงินอัตโนมัติบนหน้าเว็บยังไม่เปิดให้บริการในขณะนี้ กรุณาติดต่อเจ้าหน้าที่ผ่าน LINE OA เพื่อแจ้งขอคืนเงินครับ");
};

// ==========================================
// 🛡️ Legacy Support removed. Use creditActionService instead.
// ==========================================