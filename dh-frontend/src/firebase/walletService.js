import { useState, useEffect } from 'react';
import { db } from './config';
import { 
  collection, doc, getDoc, onSnapshot, query, 
  serverTimestamp, where, writeBatch, Timestamp, addDoc, updateDoc 
} from 'firebase/firestore';

// ==========================================
// ⚡ Hook: ดึงยอดเงิน กระเป๋า และเครดิตรออนุมัติ (แยกจากระบบเดิม)
// ==========================================
export const useWalletBalance = (uid) => {
  const [data, setData] = useState({
    balance: 0,
    tier: 'MEMBER',
    totalAccumulated: 0,
    pendingCredits: [],
    loading: true
  });

  useEffect(() => {
    if (!uid) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const userRef = doc(db, 'users', uid);
    const pendingRef = collection(db, 'users', uid, 'pending_credits');
    // ดึงเฉพาะรายการที่ยังไม่เข้ากระเป๋าจริง (action_required หรือ maturing)
    const qPending = query(pendingRef, where('status', 'in', ['action_required', 'maturing']));

    // Listener 1: ดึงยอดรวม
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        setData(prev => ({
          ...prev,
          balance: userData.creditPoint || 0,
          tier: userData.tier || 'MEMBER',
          totalAccumulated: userData.totalAccumulatedCredit || 0,
        }));
      }
    });

    // Listener 2: ดึงรายการรออนุมัติ (Pending)
    const unsubPending = onSnapshot(qPending, (snap) => {
      const pending = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // เรียงลำดับรายการใหม่ล่าสุดขึ้นก่อน
      pending.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setData(prev => ({ ...prev, pendingCredits: pending, loading: false }));
    });

    return () => {
      unsubUser();
      unsubPending();
    };
  }, [uid]);

  return data;
};

// ==========================================
// ⏳ กดยืนยันรับเครดิต (กฎ 11 วัน)
// ==========================================
export const claimPendingCredit = async (uid, creditId) => {
  if (!uid || !creditId) throw new Error("Invalid parameters");
  try {
    const creditRef = doc(db, 'users', uid, 'pending_credits', creditId);
    
    // ตั้งค่าเวลา 11 วันล่วงหน้า
    const matureDate = new Date();
    matureDate.setDate(matureDate.getDate() + 11);

    await updateDoc(creditRef, {
      status: 'maturing',
      matureDate: Timestamp.fromDate(matureDate),
      claimedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("❌ Error claiming credit:", error);
    throw error;
  }
};

// ==========================================
// 📥 สร้างรายการ Pending (ทำงานเมื่อซื้อของสำเร็จ)
// ==========================================
export const earnPendingCredit = async (uid, amount, orderId) => {
   if (!uid || amount <= 0) return;
   try {
     const pendingRef = collection(db, 'users', uid, 'pending_credits');
     await addDoc(pendingRef, {
       amount: amount,
       sourceRef: orderId,
       status: 'action_required', // บังคับให้ลูกค้าเข้ามากดยืนยัน
       createdAt: serverTimestamp()
     });
     return true;
   } catch (error) {
     console.error("❌ Error earning pending credit:", error);
     throw error;
   }
};

// ==========================================
// 🔒 ระบบบัญชีคู่ (Double-entry Bookkeeping)
// ==========================================
export const processCreditTransaction = async (uid, amount, type, description, referenceId) => {
  if (amount <= 0) throw new Error("Amount must be greater than 0");

  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const userHistoryRef = doc(collection(db, 'users', uid, 'credit_history'));
  
  // บัญชีกลางของบริษัท เพื่อควบคุมเครดิตรวมทั้งระบบ (System Ledger)
  const systemPoolRef = doc(db, 'system_accounts', 'DH_CREDIT_POOL'); 
  
  try {
    const userSnap = await getDoc(userRef);
    const sysSnap = await getDoc(systemPoolRef);
    
    const currentBalance = userSnap.exists() ? (userSnap.data().creditPoint || 0) : 0;
    const totalAcc = userSnap.exists() ? (userSnap.data().totalAccumulatedCredit || 0) : 0;
    const sysBalance = sysSnap.exists() ? (sysSnap.data().balance || 0) : 0; 

    let newUserBalance = currentBalance;
    let newTotalAcc = totalAcc;
    let newSysBalance = sysBalance;
    let logType = '';

    if (type === 'SPEND') {
      // 🔴 หักเครดิต (นำไปใช้เป็นส่วนลด)
      if (currentBalance < amount) throw new Error("Insufficient credit balance");
      newUserBalance -= amount;
      newSysBalance += amount; // เงินตีกลับเข้ากองกลาง
      logType = 'spend';
    } else if (type === 'EARN' || type === 'MATURE') {
      // 🟢 อนุมัติเครดิตเข้ากระเป๋าผู้ใช้จริง
      newUserBalance += amount;
      newTotalAcc += amount;
      newSysBalance -= amount; // เงินออกจากกองกลาง
      logType = 'earn';
    } else {
      throw new Error("Invalid transaction type");
    }

    // 1. อัปเดตฝั่งลูกค้า
    batch.set(userRef, { 
      creditPoint: newUserBalance,
      totalAccumulatedCredit: newTotalAcc
    }, { merge: true });

    // 2. อัปเดตฝั่งกองกลางบริษัท
    batch.set(systemPoolRef, {
      balance: newSysBalance,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 3. ประวัติลูกค้า
    batch.set(userHistoryRef, {
      amount: amount,
      type: logType,
      description: description,
      referenceId: referenceId,
      balanceAfter: newUserBalance,
      timestamp: serverTimestamp()
    });

    // 4. ประวัติกองกลาง (Audit Trail)
    const sysHistoryRef = doc(collection(db, 'system_accounts', 'DH_CREDIT_POOL', 'transactions'));
    batch.set(sysHistoryRef, {
      amount: amount,
      type: type === 'SPEND' ? 'RECOVERED_FROM_SPEND' : 'ISSUED_TO_USER',
      userUid: uid,
      referenceId: referenceId,
      sysBalanceAfter: newSysBalance,
      timestamp: serverTimestamp()
    });

    // ทำการรันก้อนข้อมูลทั้งหมดพร้อมกันแบบ Atomic
    await batch.commit();
    return true;
  } catch (error) {
    console.error("❌ Double-entry transaction failed:", error);
    throw error;
  }
};