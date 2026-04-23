import { collection, doc, runTransaction, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'credit_transactions';

export const transactionService = {
  /**
   * 🌟 Atomic Update: บันทึกประวัติและอัปเดตยอดคงเหลือที่ User Profile ใน Transaction เดียวกัน
   * ป้องกัน Data Race Condition (เหรียญงอก/เหรียญหาย) 100%
   */
  recordTransaction: async ({ uid, type, amount, referenceId = null, recordedBy = 'system' }) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. ดึงข้อมูล User Profile ปัจจุบันเพื่อคำนวณยอด
        const userRef = doc(db, 'users', uid);
        const userDoc = await transaction.get(userRef);
        
        let currentBalance = 0;
        if (userDoc.exists()) {
          // รองรับทั้ง field เก่าและใหม่
          currentBalance = userDoc.data().stats?.creditBalance || userDoc.data().partnerCredit || 0;
        }

        const numAmount = Number(amount);
        let newBalance = currentBalance;

        // คำนวณยอดใหม่
        if (type === 'deposit' || type === 'refund' || type === 'bonus') {
          newBalance += numAmount;
        } else if (type === 'spend') {
          if (currentBalance < numAmount) {
             throw new Error("ยอดเครดิตไม่เพียงพอ");
          }
          newBalance -= numAmount;
        }

        // 2. สร้าง Log การเงิน
        const newTxRef = doc(collection(db, COLLECTION_NAME));
        transaction.set(newTxRef, {
          transactionId: `TX-${Date.now()}`,
          uid,
          type,
          amount: numAmount,
          balanceAfter: newBalance, // เก็บ Snapshot ยอดคงเหลือหลังทำรายการ
          referenceId,
          recordedBy,
          timestamp: serverTimestamp()
        });

        // 3. อัปเดตยอดคงเหลือกลับไปที่ User Profile ทันที
        if (userDoc.exists()) {
          transaction.update(userRef, {
            'stats.creditBalance': newBalance,
            'partnerCredit': newBalance, // Sync ของเก่าเพื่อไม่ให้ระบบอื่นพัง
            updatedAt: serverTimestamp()
          });
        }
      });
      return true;
    } catch (error) {
      console.error("🔥 Error recording transaction: ", error);
      throw error; // โยน Error กลับไปให้ UI แจ้งเตือน
    }
  },

  getAllTransactions: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error fetching transactions: ", error);
      return [];
    }
  }
};