import { doc, getDoc, getDocs, runTransaction, collection, serverTimestamp, query, where, documentId, limit } from 'firebase/firestore';
import { db } from '../config';
import { historyService } from '../historyService';
import { formatCredit, calculateEarnedPoints } from './creditFormatService';
import { getCollectionPath, getUsersPath } from 'dh-shared/src/firebase/pathUtils';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const uidCache = new Map();
const UID_CACHE_TTL = 5 * 60 * 1000;

/**
 * ✨ Smart UID Resolver (รองรับ รหัสสั้น 8 ตัว, Account ID, เบอร์โทร, customerCode, Email)
 */
export const resolveSmartUid = async (inputUid) => {
  if (!inputUid) return inputUid;
  const cleanInput = String(inputUid).trim();
  if (!cleanInput) return cleanInput;

  const cached = uidCache.get(cleanInput);
  if (cached && (Date.now() - cached.timestamp < UID_CACHE_TTL)) {
    return cached.uid;
  }

  let resolvedUid = cleanInput;
  const usersColPath = getUsersPath();
  const usersRefColl = collection(db, usersColPath);

  if (cleanInput.length >= 20) {
    try {
      const directDoc = await getDoc(doc(db, usersColPath, cleanInput));
      if (directDoc.exists()) {
        uidCache.set(cleanInput, { uid: cleanInput, timestamp: Date.now() });
        return cleanInput;
      }
    } catch (e) {}
  }

  const upper = cleanInput.toUpperCase();
  const lower = cleanInput.toLowerCase();

  // 1. Account ID
  let snap = await getDocs(query(usersRefColl, where('accountId', '==', upper), limit(1)));
  if (!snap.empty) resolvedUid = snap.docs[0].id;

  if (resolvedUid === cleanInput && upper !== cleanInput) {
    snap = await getDocs(query(usersRefColl, where('accountId', '==', cleanInput), limit(1)));
    if (!snap.empty) resolvedUid = snap.docs[0].id;
  }

  // 2. Customer Code
  if (resolvedUid === cleanInput) {
    snap = await getDocs(query(usersRefColl, where('customerCode', '==', upper), limit(1)));
    if (!snap.empty) resolvedUid = snap.docs[0].id;
  }
  if (resolvedUid === cleanInput && upper !== cleanInput) {
    snap = await getDocs(query(usersRefColl, where('customerCode', '==', cleanInput), limit(1)));
    if (!snap.empty) resolvedUid = snap.docs[0].id;
  }

  // 3. Phone / PhoneNumber
  if (resolvedUid === cleanInput) {
    snap = await getDocs(query(usersRefColl, where('phone', '==', cleanInput), limit(1)));
    if (!snap.empty) resolvedUid = snap.docs[0].id;
  }
  if (resolvedUid === cleanInput) {
    snap = await getDocs(query(usersRefColl, where('phoneNumber', '==', cleanInput), limit(1)));
    if (!snap.empty) resolvedUid = snap.docs[0].id;
  }

  // 4. Email
  if (resolvedUid === cleanInput && cleanInput.includes('@')) {
    snap = await getDocs(query(usersRefColl, where('email', '==', lower), limit(1)));
    if (!snap.empty) resolvedUid = snap.docs[0].id;
  }

  // 5. Document ID prefix search
  if (resolvedUid === cleanInput && cleanInput.length >= 6) {
    snap = await getDocs(query(usersRefColl, where(documentId(), '>=', cleanInput), where(documentId(), '<=', cleanInput + '\uf8ff'), limit(1)));
    if (!snap.empty) resolvedUid = snap.docs[0].id;
  }

  uidCache.set(cleanInput, { uid: resolvedUid, timestamp: Date.now() });
  return resolvedUid;
};

/**
 * ⚡ Resolve Smart User Info for Operations Tab
 */
export const resolveSmartUserInfo = async (input) => {
  if (!input) return null;
  const clean = String(input).trim();
  if (!clean) return null;

  const uid = await resolveSmartUid(clean);
  if (!uid) return null;

  try {
    const usersPath = getUsersPath();
    const userDoc = await getDoc(doc(db, usersPath, uid));
    if (!userDoc.exists()) return null;

    const d = userDoc.data();
    const displayName = getCustomerDisplayName(d, '') ||
      (d.firstName ? `${d.firstName} ${d.lastName || ''}`.trim() : null) ||
      d.displayName || d.storeName || d.email || 'Unknown User';

    return {
      uid: userDoc.id,
      accountId: d.accountId || userDoc.id.substring(0, 8).toUpperCase(),
      displayName,
      email: d.email || '-',
      phone: d.phone || d.phoneNumber || '-',
      creditPoints: Number(d.creditPoints || 0),
      walletBalance: Number(d.walletBalance || 0),
      role: d.role || 'user'
    };
  } catch (e) {
    console.error('🔥 Error resolving user info:', e);
    return null;
  }
};

/**
 * ✨ Atomic Dual-Sync Credit Adjustment (SECURED & FINANCIAL GRADE)
 * สำหรับการทำรายการภายใน Transaction เดียวกัน (เช่น เรียกจาก BillingService)
 * รับ uid แบบตรงๆ เท่านั้น (ไม่ทำการ Query หา UID ย่อ)
 */
export const getCreditPreloadRefs = (uid, type, referenceId = null) => {
    const settingsRef = doc(db, getCollectionPath('settings'), 'credit_config');
    const usersColPathTx = getUsersPath();
    const userRef = doc(db, usersColPathTx, uid);
    const walletRef = doc(db, usersColPathTx, uid, 'wallet', 'default');
    let txRef = null;
    if (referenceId) {
      txRef = doc(db, getCollectionPath('credit_transactions'), `ADJ_${type}_${referenceId}`);
    }
    const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), uid);
    
    return { settingsRef, userRef, walletRef, txRef, activePartnerRef };
};

export const adjustUserCreditWithTransaction = async (transaction, uid, amount, type, note, actorUid, referenceId = null, preloadedSnaps = null) => {
  try {
    if (!uid) throw new Error("ระบบปฏิเสธการทำรายการ: ไม่พบรหัสผู้ใช้งาน (UID Missing)");

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("ระบบปฏิเสธการทำรายการ: จำนวนเครดิตไม่ถูกต้อง ต้องมากกว่า 0");
    }
    if (numAmount > 10000000) {
      throw new Error("ระบบปฏิเสธการทำรายการ: จำนวนเครดิตเกินเพดานสูงสุดที่กำหนดต่อครั้ง (Anti-Fraud Lock)");
    }

    let safeAmount = Math.round(numAmount * 100) / 100;
    
    const settingsRef = doc(db, getCollectionPath('settings'), 'credit_config');
    const usersColPathTx = getUsersPath();
    const userRef = doc(db, usersColPathTx, uid);
    // ⚠️ Legacy Wallet (Deprecated) - คงไว้เพื่อ Sync ข้อมูลเก่าเท่านั้น ห้ามใช้อ่านเป็น Source of truth
    const walletRef = doc(db, usersColPathTx, uid, 'wallet', 'default');
    const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), uid);
    
    let txRef;
    const refSuffix = referenceId ? referenceId : Date.now().toString();
    if (referenceId) {
      txRef = doc(db, getCollectionPath('credit_transactions'), `ADJ_${type}_${referenceId}`);
    } else {
      txRef = doc(collection(db, getCollectionPath('credit_transactions')));
    }

    let txSnap, settingsSnap, userSnap, walletSnap, activePartnerSnap;
    
    if (preloadedSnaps) {
       txSnap = preloadedSnaps.txSnap;
       settingsSnap = preloadedSnaps.settingsSnap;
       userSnap = preloadedSnaps.userSnap;
       walletSnap = preloadedSnaps.walletSnap;
       activePartnerSnap = preloadedSnaps.activePartnerSnap;
       
       if (referenceId && txSnap && txSnap.exists()) {
           throw new Error("รายการอ้างอิงนี้ถูกดำเนินการไปแล้ว (Duplicate Transaction Prevention)");
       }
    } else {
       if (referenceId) {
         txSnap = await transaction.get(txRef);
         if (txSnap.exists()) throw new Error("รายการอ้างอิงนี้ถูกดำเนินการไปแล้ว (Duplicate Transaction Prevention)");
       }
       [settingsSnap, userSnap, walletSnap, activePartnerSnap] = await Promise.all([
         transaction.get(settingsRef),
         transaction.get(userRef),
         transaction.get(walletRef),
         transaction.get(activePartnerRef)
       ]);
    }

    if (!userSnap || !userSnap.exists()) {
        throw new Error("ไม่พบบัญชีผู้ใช้งานที่ระบุ");
    }

    const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;
    const ledger = settingsData?.ledger || { systemPoolMax: 1000000, totalAllocated: 0, status: 'SECURE' };

    // ✨ Canonical Source of Truth คือ creditPoints บน userDoc เท่านั้น!
    let currentPoints = Number(userSnap.data().creditPoints || 0);
    let totalAccumulated = 0;
    if (walletSnap.exists()) {
      totalAccumulated = Number(walletSnap.data().totalAccumulated) || 0;
    }

    const safeCurrentPoints = Math.round(currentPoints * 100) / 100;
    const sysMax = Number(ledger.systemPoolMax) || 1000000;
    let newTotalAllocated = Number(ledger.totalAllocated) || 0;
    
    let newPointsBalance = safeCurrentPoints;
    let newTotalAccumulated = Number(totalAccumulated) || 0;

    if (type === 'deposit' || type === 'add' || type === 'earn') {
      if (sysMax > 0 && (newTotalAllocated + safeAmount) > sysMax) {
        throw new Error(`ไม่อนุมัติการทำรายการ: ทุนสำรองกลางไม่เพียงพอ`);
      }
      newPointsBalance += safeAmount;
      newTotalAccumulated += safeAmount;
      newTotalAllocated += safeAmount; 
    } else if (type === 'deduct' || type === 'cash_withdrawal' || type === 'spend' || type === 'clawback') {
      if (safeCurrentPoints < safeAmount) {
        if (type === 'clawback') {
            safeAmount = Math.max(0, safeCurrentPoints); // ✨ ยึดเท่าที่เหลือ ไม่ Throw Error
        } else {
            throw new Error(`ยอดเครดิตของผู้ใช้งานมีไม่เพียงพอ (ต้องการ ${safeAmount} Pts, มียอดเพียง ${safeCurrentPoints} Pts)`);
        }
      }
      newPointsBalance -= safeAmount;
      newTotalAllocated = Math.max(0, newTotalAllocated - safeAmount);
    } else {
      throw new Error("ประเภทการปรับปรุงเครดิตไม่ถูกต้องในระบบ");
    }

    newPointsBalance = Math.round(newPointsBalance * 100) / 100;

    let newLedgerStatus = 'SECURE';
    const utilization = sysMax > 0 ? (newTotalAllocated / sysMax) : 0;
    if (utilization >= 0.9) newLedgerStatus = 'WARNING'; 
    if (utilization >= 1) newLedgerStatus = 'BREACHED'; 

    transaction.set(settingsRef, {
      ledger: { ...ledger, totalAllocated: newTotalAllocated, status: newLedgerStatus, lastAuditTime: serverTimestamp() },
      updatedAt: serverTimestamp()
    }, { merge: true });

    transaction.set(walletRef, {
      balance: newPointsBalance,
      totalAccumulated: newTotalAccumulated,
      updatedAt: serverTimestamp()
    }, { merge: true });

    const syncPayload = {
      creditPoints: newPointsBalance,  
      totalAccumulatedPoints: newTotalAccumulated,
      updatedAt: serverTimestamp()
    };

    transaction.set(userRef, syncPayload, { merge: true });

    // ✨ NEW FIX: Sync points to ActivePartners to prevent denormalization issues
    if (activePartnerSnap.exists()) {
      transaction.set(activePartnerRef, { points: newPointsBalance, updatedAt: serverTimestamp() }, { merge: true });
    }

    const userData = userSnap.data();
    const userEmail = userData.email || 'Migrated User';
    const resolvedName = getCustomerDisplayName(userData, '') || (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : null) || (userData.email ? userData.email.split('@')[0] : null) || userData.phone || userData.phoneNumber || 'Unknown';

    const transactionId = txRef.id;
    const mappedType = (type === 'deposit' || type === 'add' || type === 'earn') ? 'add' : 'deduct';
    transaction.set(txRef, {
      transactionId: `TXM-${refSuffix}`,
      uid: uid,
      partnerName: resolvedName,
      userEmail: userEmail || 'unknown@system.local',
      type: mappedType,
      amount: safeAmount,
      balanceAfter: newPointsBalance,
      referenceId: referenceId || 'MANUAL_ADJUST',
      note: note || (mappedType === 'add' ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'),
      remark: note || (mappedType === 'add' ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'),
      recordedBy: actorUid || 'System',
      operatorUid: actorUid || 'System',
      timestamp: serverTimestamp()
    });

    console.info(`✅ [Credit Engine] Sub-Transaction TXM-${referenceId || 'MANUAL'} Prepped for UID: ${uid} | Amount: ${amount}`);
    return { success: true, transactionId, newBalance: newPointsBalance };
  } catch (error) {
    console.error("🔥 Error in adjustUserCreditWithTransaction:", error);
    throw error;
  }
};

/**
 * ✨ Atomic Dual-Sync Credit Adjustment (Standalone)
 */
export const adjustUserCredit = async (inputUid, amount, type, note, actorUid, referenceId = null) => {
  try {
    if (!inputUid) throw new Error("ระบบปฏิเสธการทำรายการ: ไม่พบรหัสผู้ใช้งาน (UID Missing)");

    // ✨ Smart UID Resolver (รองรับ รหัสสั้น 8 ตัว, เบอร์โทร, customerCode)
    const uid = await resolveSmartUid(inputUid);

    let transactionId = null;
    await runTransaction(db, async (transaction) => {
      const result = await adjustUserCreditWithTransaction(transaction, uid, amount, type, note, actorUid, referenceId);
      transactionId = result.transactionId;
    });

    const mappedType = (type === 'deposit' || type === 'add' || type === 'earn') ? 'add' : 'deduct';
    if (historyService && historyService.addLog) {
      await historyService.addLog('CyberAuditCore', mappedType === 'add' ? 'CreditDeposit' : 'CreditDeduct', uid, `${mappedType === 'add' ? 'เพิ่ม' : 'ลด'}เครดิต ฿${amount.toLocaleString()}`, actorUid);
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
      const orderRef = doc(db, getCollectionPath('orders'), orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error("ไม่พบข้อมูลคำสั่งซื้อในระบบ");
      
      const orderData = orderDoc.data();
      if (orderData.pointsAwarded) return;

      // ✨ SECURITY FIX: อิงยอดเงินจาก Transaction เท่านั้น เลิกเชื่อ Frontend (Zero-Trust)
      const finalTotal = Number(orderData.finalTotal || orderData.totals?.netTotal || orderData.netTotal || 0);
      const walletUsedAmount = Number(orderData.walletUsedAmount || orderData.calculationLog?.usedWallet || 0);
      const amountForPoints = Math.max(0, finalTotal - walletUsedAmount);
      
      const settingsRef = doc(db, getCollectionPath('settings'), 'credit_config');
      const settingsSnap = await transaction.get(settingsRef);
      const creditConfig = settingsSnap.exists() ? settingsSnap.data() : null;
      
      const userRef = doc(db, getCollectionPath('users'), userId);
      const userSnap = await transaction.get(userRef);
      const userTotalAccumulatedPoints = userSnap.exists() ? Number(userSnap.data().totalAccumulatedPoints || userSnap.data().creditPoints || 0) : 0;
      
      const calculatedPoints = calculateEarnedPoints(amountForPoints, creditConfig, orderData.items || [], userTotalAccumulatedPoints);
      
      if (calculatedPoints <= 0) {
          transaction.update(orderRef, { pendingCredits: 0, pointsAwarded: true, awardedAt: serverTimestamp() });
          return;
      }

      pendingPointsToAward = calculatedPoints;

      await adjustUserCreditWithTransaction(
        transaction,
        userId,
        calculatedPoints,
        'deposit',
        `ได้รับแต้มจากการสั่งซื้อรหัส ${orderId}`,
        'System_Order_Completion',
        orderId
      );

      transaction.update(orderRef, { pendingCredits: calculatedPoints, pointsAwarded: true, awardedAt: serverTimestamp() });
    });
    
    if (pendingPointsToAward > 0 && historyService && historyService.addLog) {
      await historyService.addLog(
        'CyberAuditCore', 
        'CreditDeposit', 
        userId, 
        `เพิ่มเครดิต ฿${pendingPointsToAward.toLocaleString()} (แต้มจากการสั่งซื้อรหัส ${orderId})`, 
        'System_Order_Completion'
      );
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

/**
 * 🔒 Atomic Wallet Balance Adjustment (Error Correction Engine)
 * สำหรับปรับยอดกระเป๋าเงินเพื่อแก้ไขตัวเลขทางบัญชีที่ผิดพลาดใน Transaction
 */
export const adjustUserWalletWithTransaction = async (transaction, uid, amount, type, note, actorUid, referenceId = null) => {
  try {
    if (!uid) throw new Error("ระบบปฏิเสธการทำรายการ: ไม่พบรหัสผู้ใช้งาน (UID Missing)");

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("ระบบปฏิเสธการทำรายการ: จำนวนเงินไม่ถูกต้อง ต้องมากกว่า 0");
    }
    if (numAmount > 10000000) {
      throw new Error("ระบบปฏิเสธการทำรายการ: จำนวนเงินเกินเพดานสูงสุดที่กำหนดต่อครั้ง (Anti-Fraud Lock)");
    }

    const safeAmount = Math.round(numAmount * 100) / 100;
    
    const usersColPathTx = getUsersPath();
    const userRef = doc(db, usersColPathTx, uid);
    
    // ✅ [SECURITY FIX] ป้องกันการกดเบิ้ล/ส่งซ้ำ (Idempotency Check)
    let txRef;
    if (referenceId) {
      txRef = doc(db, usersColPathTx, uid, 'wallet_transactions', `ADJ_WALLET_${referenceId}`);
      const txSnap = await transaction.get(txRef);
      if (txSnap.exists()) {
        throw new Error("รายการอ้างอิงนี้ถูกดำเนินการไปแล้ว (Duplicate Transaction Prevention)");
      }
    } else {
      txRef = doc(collection(db, usersColPathTx, uid, 'wallet_transactions'));
    }

    const userSnap = await transaction.get(userRef);
    if (!userSnap || !userSnap.exists()) {
      throw new Error("ไม่พบบัญชีผู้ใช้งานที่ระบุ");
    }

    const currentWallet = Number(userSnap.data().walletBalance || 0);
    let newWalletBalance = currentWallet;

    if (type === 'adjust_add' || type === 'deposit' || type === 'add') {
      newWalletBalance += safeAmount;
    } else if (type === 'adjust_deduct' || type === 'deduct' || type === 'withdraw') {
      if (currentWallet < safeAmount) {
        throw new Error(`ยอดเงินคงเหลือใน Wallet มีไม่เพียงพอสำหรับการปรับยอด (ต้องการปรับลด ${safeAmount} บาท, มีเพียง ${currentWallet} บาท)`);
      }
      newWalletBalance -= safeAmount;
    } else {
      throw new Error("ประเภทการปรับปรุง Wallet ไม่ถูกต้องในระบบ");
    }

    newWalletBalance = Math.round(newWalletBalance * 100) / 100;

    // Update wallet balance on user doc
    transaction.update(userRef, {
      walletBalance: newWalletBalance,
      updatedAt: serverTimestamp()
    });

    const userData = userSnap.data();
    const userEmail = userData.email || 'Migrated User';
    const resolvedName = getCustomerDisplayName(userData, '') || (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : null) || (userData.email ? userData.email.split('@')[0] : null) || userData.phone || userData.phoneNumber || 'Unknown';

    // บันทึกธุรกรรมลงใน wallet_transactions
    // REFUND = ปรับยอดเพิ่ม (มีผลบวก), SPEND = ปรับยอดลด (มีผลลบ)
    const mappedType = (type === 'adjust_add' || type === 'deposit' || type === 'add') ? 'REFUND' : 'SPEND';
    
    transaction.set(txRef, {
      transactionId: referenceId ? `TXW_ADJ_${referenceId}` : txRef.id,
      type: mappedType,
      amount: safeAmount,
      balanceAfter: newWalletBalance,
      status: 'SUCCESS',
      note: note || (mappedType === 'REFUND' ? 'ปรับเพิ่มยอดเงิน Wallet (แก้ไขข้อผิดพลาด)' : 'ปรับลดยอดเงิน Wallet (แก้ไขข้อผิดพลาด)'),
      operatorUid: actorUid || 'System',
      timestamp: serverTimestamp()
    });

    console.info(`✅ [Wallet Engine] Sub-Transaction ADJUST Prepped for UID: ${uid} | Amount: ${amount}`);
    return { success: true, transactionId: txRef.id, newBalance: newWalletBalance };
  } catch (error) {
    console.error("🔥 Error in adjustUserWalletWithTransaction:", error);
    throw error;
  }
};

/**
 * 🔒 Non-transactional wrapper for adjusting wallet balance
 * รองรับการยิงตรงและระบบ Smart UID Resolver
 */
export const adjustUserWallet = async (inputUid, amount, type, note, actorUid, referenceId = null) => {
  try {
    if (!inputUid) throw new Error("ระบบปฏิเสธการทำรายการ: ไม่พบรหัสผู้ใช้งาน (UID Missing)");

    const uid = await resolveSmartUid(inputUid);

    let transactionId = null;
    let newBalance = 0;
    await runTransaction(db, async (transaction) => {
      const result = await adjustUserWalletWithTransaction(transaction, uid, amount, type, note, actorUid, referenceId);
      transactionId = result.transactionId;
      newBalance = result.newBalance;
    });

    const mappedType = (type === 'adjust_add' || type === 'deposit' || type === 'add') ? 'WalletCorrectionAdd' : 'WalletCorrectionDeduct';
    if (historyService && historyService.addLog) {
      await historyService.addLog('CyberAuditCore', mappedType, uid, `ปรับปรุงตัวเลขกระเป๋าเงิน ฿${amount.toLocaleString()} (สาเหตุ: ${note})`, actorUid);
    }
    return { success: true, transactionId, newBalance };
  } catch (error) {
    console.error("🔥 System Error [adjustUserWallet]:", error);
    throw error;
  }
};
