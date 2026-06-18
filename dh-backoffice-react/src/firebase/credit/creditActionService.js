import { doc, getDocs, runTransaction, collection, serverTimestamp, query, where, documentId, limit } from 'firebase/firestore';
import { db } from '../config';
import { historyService } from '../historyService';
import { formatCredit } from './creditFormatService';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const getUsersPath = () => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('canvas') && typeof __app_id !== 'undefined') {
        return `artifacts/${__app_id}/public/data/users`;
    }
    return 'users';
};

/**
 * ✨ Atomic Dual-Sync Credit Adjustment (SECURED & FINANCIAL GRADE)
 * อัปเกรดระบบเพื่อความแม่นยำสูงสุดระดับธุรกรรมการเงิน
 */
export const adjustUserCredit = async (inputUid, amount, type, note, actorUid, referenceId = null) => {
  try {
    if (!inputUid) throw new Error("ระบบปฏิเสธการทำรายการ: ไม่พบรหัสผู้ใช้งาน (UID Missing)");

    // ✨ Smart UID Resolver (รองรับ รหัสสั้น 8 ตัว, เบอร์โทร, customerCode)
    const cleanInput = inputUid.trim();
    let resolvedUid = cleanInput;
    const usersColPath = getUsersPath();
    const usersRefColl = collection(db, usersColPath);
    
    // ถ้าไม่ใช่ UID เต็มยาวๆ ให้ลองค้นหาดูเผื่อเป็นรหัสย่อ
    if (cleanInput.length < 20) {
      let snap = await getDocs(query(usersRefColl, where('customerCode', '==', cleanInput)));
      if (!snap.empty) resolvedUid = snap.docs[0].id;
      else {
        snap = await getDocs(query(usersRefColl, where('customerCode', '==', cleanInput.toUpperCase())));
        if (!snap.empty) resolvedUid = snap.docs[0].id;
        else {
          snap = await getDocs(query(usersRefColl, where('phone', '==', cleanInput)));
          if (!snap.empty) resolvedUid = snap.docs[0].id;
          else {
            // ค้นหาแบบ StartsWith ของ Document ID 
            snap = await getDocs(query(usersRefColl, where(documentId(), '>=', cleanInput), where(documentId(), '<=', cleanInput + '\uf8ff'), limit(1)));
            if (!snap.empty) resolvedUid = snap.docs[0].id;
          }
        }
      }
    }
    const uid = resolvedUid;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("ระบบปฏิเสธการทำรายการ: จำนวนเครดิตไม่ถูกต้อง ต้องมากกว่า 0");
    }
    if (numAmount > 10000000) {
      throw new Error("ระบบปฏิเสธการทำรายการ: จำนวนเครดิตเกินเพดานสูงสุดที่กำหนดต่อครั้ง (Anti-Fraud Lock)");
    }

    const safeAmount = Math.round(numAmount * 100) / 100;

    let transactionId = null;
    await runTransaction(db, async (transaction) => {
      
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      
      const usersColPathTx = getUsersPath();
      const userRef = doc(db, usersColPathTx, uid);
      const walletRef = doc(db, usersColPathTx, uid, 'wallet', 'default');
      
      let txRef;
      const refSuffix = referenceId ? referenceId : Date.now().toString();
      if (referenceId) {
        txRef = doc(db, 'artifacts', appId, 'public', 'data', 'credit_transactions', `ADJ_${type}_${referenceId}`);
        const txSnap = await transaction.get(txRef);
        if (txSnap.exists()) throw new Error("รายการอ้างอิงนี้ถูกดำเนินการไปแล้ว (Duplicate Transaction Prevention)");
      } else {
        txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
      }

      const [settingsSnap, userSnap, walletSnap] = await Promise.all([
        transaction.get(settingsRef),
        transaction.get(userRef),
        transaction.get(walletRef)
      ]);

      const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;
      const ledger = settingsData?.ledger || { systemPoolMax: 1000000, totalAllocated: 0, status: 'SECURE' };

      let currentWallet = 0;
      let totalAccumulated = 0;
      if (walletSnap.exists()) {
        currentWallet = Number(walletSnap.data().balance) || 0;
        totalAccumulated = Number(walletSnap.data().totalAccumulated) || 0;
      } else if (userSnap.exists()) {
        currentWallet = Number(userSnap.data().creditPoints || 0);
      }

      const safeCurrentWallet = Math.round(currentWallet * 100) / 100;
      const sysMax = Number(ledger.systemPoolMax) || 1000000;
      let newTotalAllocated = Number(ledger.totalAllocated) || 0;
      
      let newWalletBalance = safeCurrentWallet;
      let newTotalAccumulated = Number(totalAccumulated) || 0;

      if (type === 'deposit' || type === 'add') {
        if (sysMax > 0 && (newTotalAllocated + safeAmount) > sysMax) {
          throw new Error(`ไม่อนุมัติการทำรายการ: ทุนสำรองกลางไม่เพียงพอ`);
        }
        newWalletBalance += safeAmount;
        newTotalAccumulated += safeAmount;
        newTotalAllocated += safeAmount; 
      } else if (type === 'deduct' || type === 'cash_withdrawal' || type === 'spend') {
        if (safeCurrentWallet < safeAmount) {
          throw new Error(`ยอดเครดิตของผู้ใช้งานมีไม่เพียงพอ (ต้องการ ${safeAmount} Pts, มียอดเพียง ${safeCurrentWallet} Pts)`);
        }
        newWalletBalance -= safeAmount;
        newTotalAllocated = Math.max(0, newTotalAllocated - safeAmount);
      } else {
        throw new Error("ประเภทการปรับปรุงเครดิตไม่ถูกต้องในระบบ");
      }

      newWalletBalance = Math.round(newWalletBalance * 100) / 100;

      let newLedgerStatus = 'SECURE';
      const utilization = sysMax > 0 ? (newTotalAllocated / sysMax) : 0;
      if (utilization >= 0.9) newLedgerStatus = 'WARNING'; 
      if (utilization >= 1) newLedgerStatus = 'BREACHED'; 

      transaction.set(settingsRef, {
        ledger: { ...ledger, totalAllocated: newTotalAllocated, status: newLedgerStatus, lastAuditTime: serverTimestamp() },
        updatedAt: serverTimestamp()
      }, { merge: true });

      transaction.set(walletRef, {
        balance: newWalletBalance,
        totalAccumulated: newTotalAccumulated,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const syncPayload = {
        creditPoints: newWalletBalance,  
        updatedAt: serverTimestamp()
      };

      transaction.set(userRef, syncPayload, { merge: true });

      const userEmail = userSnap.exists() ? userSnap.data().email : 'Migrated User';

      transactionId = txRef.id;
      transaction.set(txRef, {
        transactionId: `TXM-${refSuffix}`,
        uid: uid,
        userEmail: userEmail || 'unknown@system.local',
        type: (type === 'deposit' || type === 'add') ? 'add' : 'deduct',
        amount: safeAmount,
        balanceAfter: newWalletBalance,
        referenceId: referenceId || 'MANUAL_ADJUST',
        note: note || ((type === 'deposit' || type === 'add') ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'),
        remark: note || ((type === 'deposit' || type === 'add') ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'),
        recordedBy: actorUid || 'System',
        operatorUid: actorUid || 'System',
        timestamp: serverTimestamp()
      });

      const personalHistoryRef = doc(collection(db, 'artifacts', appId, 'users', uid, 'credit_history'));
      transaction.set(personalHistoryRef, {
        type: (type === 'deposit' || type === 'add') ? 'earn' : 'spend',
        points: safeAmount,
        amount: safeAmount,
        note: note || 'ทำรายการกระเป๋าเงิน',
        referenceId: `TXM-${refSuffix}`,
        adjustedBy: actorUid || 'System',
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      });
    });

    console.info(`✅ [Credit Engine] Transaction TXM-${referenceId || 'MANUAL'} Completed for UID: ${uid} | Amount: ${amount}`);

    if (historyService && historyService.addLog) {
      await historyService.addLog('CyberAuditCore', (type === 'deposit' || type === 'add') ? 'CreditDeposit' : 'CreditDeduct', uid, `${(type === 'deposit' || type === 'add') ? 'เพิ่ม' : 'ลด'}เครดิต ฿${safeAmount.toLocaleString()}`, actorUid);
    }
    return { success: true, transactionId };
  } catch (error) {
    console.error("🔥 System Error [adjustUserCredit]:", error);
    throw error;
  }
};

export const handlePaymentCompletion = async (orderId, userId) => {
  try {
    if (!orderId || !userId) throw new Error("ข้อมูลคำสั่งซื้อหรือผู้ใช้ไม่ครบถ้วน");

    let pendingPointsToAward = 0;

    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error("ไม่พบข้อมูลคำสั่งซื้อในระบบ");
      
      const orderData = orderDoc.data();
      const pendingPoints = orderData.pendingCredits || 0;
      
      if (orderData.pointsAwarded || pendingPoints <= 0) return;

      pendingPointsToAward = pendingPoints;

      transaction.update(orderRef, { pendingCredits: 0, pointsAwarded: true, awardedAt: serverTimestamp() });
    });
    
    if (pendingPointsToAward > 0) {
      await adjustUserCredit(userId, pendingPointsToAward, 'deposit', `ได้รับแต้มจากการสั่งซื้อรหัส ${orderId}`, 'System_Order_Completion', orderId);
    }
    
    return true;
  } catch (error) {
    console.error("🔥 System Error [handlePaymentCompletion]:", error);
    throw error;
  }
};

export const clawbackPoints = async (uid, points, referenceId, actorUid) => {
  if (!points || points <= 0) return true; 
  try {
    await adjustUserCredit(uid, points, 'deduct', `ดึงแต้มคืนจากบิลยกเลิก: ${referenceId}`, actorUid || 'System_Clawback', `CB_${referenceId}`);
    if (historyService && historyService.addLog) {
       await historyService.addLog('CyberAuditCore', 'PointClawback', referenceId, `ริบแต้มคืน ${formatCredit(points)} แต้ม จากบิลที่ยกเลิก`, actorUid);
    }
    return true;
  } catch (error) {
    console.error("🔥 System Error [clawbackPoints]:", error);
    throw error;
  }
};
