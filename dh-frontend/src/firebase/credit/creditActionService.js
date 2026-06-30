import { collection, doc, getDoc, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';
import { appId, getUsersPath, invalidateCreditHistoryCache } from './creditConfig';

/**
 * ✨ Atomic Dual-Sync Credit Adjustment
 * สำหรับการทำรายการภายใน Transaction เดียวกัน
 */
export const adjustUserCreditWithTransaction = async (transaction, uid, amount, type, note, actorUid, referenceId = null) => {
    if (!uid) throw new Error("UID Missing");
    const safeAmount = Math.round(Number(amount) * 100) / 100;
    if (safeAmount <= 0) throw new Error("จำนวนเครดิตไม่ถูกต้อง");

    const usersColPathTx = getUsersPath();
    const userRef = doc(db, usersColPathTx, uid);
    
    let txRef;
    const refSuffix = referenceId ? referenceId : Date.now().toString();
    if (referenceId) {
      txRef = doc(db, 'artifacts', appId, 'public', 'data', 'credit_transactions', `ADJ_${type}_${referenceId}`);
      const txSnap = await transaction.get(txRef);
      if (txSnap.exists()) throw new Error("รายการอ้างอิงนี้ถูกดำเนินการไปแล้ว");
    } else {
      txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
    }

    const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', uid);
    
    const [userSnap, activePartnerSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(activePartnerRef)
    ]);
    if (!userSnap.exists()) throw new Error("ไม่พบบัญชีผู้ใช้งาน");

    let currentWallet = Number(userSnap.data().creditPoints || 0);
    const safeCurrentWallet = Math.round(currentWallet * 100) / 100;
    let newWalletBalance = safeCurrentWallet;

    if (type === 'deposit' || type === 'add' || type === 'earn') {
      newWalletBalance += safeAmount;
    } else if (type === 'deduct' || type === 'spend') {
      if (safeCurrentWallet < safeAmount) {
        throw new Error(`ยอดเครดิตของผู้ใช้งานมีไม่เพียงพอ`);
      }
      newWalletBalance -= safeAmount;
    }

    newWalletBalance = Math.round(newWalletBalance * 100) / 100;

    transaction.update(userRef, {
      creditPoints: newWalletBalance,  
      updatedAt: serverTimestamp()
    });

    // ✨ NEW FIX: Sync points to ActivePartners
    if (activePartnerSnap.exists()) {
      transaction.set(activePartnerRef, { points: newWalletBalance, updatedAt: serverTimestamp() }, { merge: true });
    }

    const mappedType = (type === 'deposit' || type === 'add' || type === 'earn') ? 'deposit' : 'spend';
    transaction.set(txRef, {
      transactionId: `TXM-${refSuffix}`,
      uid: uid,
      type: mappedType,
      amount: safeAmount,
      balanceAfter: newWalletBalance,
      referenceId: referenceId || 'FRONTEND_CHECKOUT',
      note: note || (mappedType === 'deposit' ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'),
      recordedBy: actorUid || uid,
      timestamp: serverTimestamp()
    });

    const personalHistoryRef = doc(collection(db, usersColPathTx, uid, 'credit_history'));
    transaction.set(personalHistoryRef, {
      type: mappedType,
      points: safeAmount,
      amount: safeAmount,
      note: note || 'ทำรายการกระเป๋าเงิน',
      referenceId: `TXM-${refSuffix}`,
      createdAt: serverTimestamp(),
      timestamp: serverTimestamp()
    });

    return { success: true, transactionId: txRef.id, newBalance: newWalletBalance };
};

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

export const calculateEarnedPoints = (amount, config, items = []) => {
  if (!amount || amount <= 0 || !config) return 0;
  const earningRate = config.earningRate || config.pointsEarningRate || 100;
  let basePoints = Math.floor(amount / earningRate);
  let multiplier = config.tierMultiplier || 1;
  let totalPoints = Math.floor(basePoints * multiplier);

  // คำนวณ Bonus จาก SKU
  if (config.skuBonusRules && items.length > 0) {
    const rules = config.skuBonusRules.split('\n').filter(Boolean);
    const skuMap = {};
    rules.forEach(rule => {
      const [sku, pts] = rule.split(':');
      if (sku && pts) {
        skuMap[sku.trim().toUpperCase()] = parseInt(pts.trim(), 10);
      }
    });

    items.forEach(item => {
      const itemSku = (item.sku || item.productSku || '').toUpperCase();
      if (itemSku && skuMap[itemSku]) {
        // ให้แต้มพิเศษตามจำนวนชิ้นที่ซื้อ
        const qty = item.quantity || item.qty || 1;
        totalPoints += skuMap[itemSku] * qty;
      }
    });
  }

  return totalPoints;
};

export const handlePaymentCompletion = async (orderId, userId) => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
      const usersPath = getUsersPath();
      const userRef = doc(db, usersPath, userId);
      
      const [orderDoc, userDoc] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(userRef)
      ]);

      if (!orderDoc.exists() || !userDoc.exists()) return;
      
      const orderData = orderDoc.data();
      const pendingPoints = orderData.pendingCredits || 0;
      
      if (pendingPoints <= 0 || orderData.pointsAwarded) return;

      const currentPoints = userDoc.data().creditPoints || 0;
      const newBalance = currentPoints + pendingPoints;

      transaction.update(orderRef, {
        pointsAwarded: true,
        pointsAwardedAt: serverTimestamp()
      });

      transaction.update(userRef, {
        creditPoints: newBalance,
        updatedAt: serverTimestamp()
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

export const deductPartnerCredit = async (partnerId, cost = 10, actionType = 'click_contact') => {
  if (!partnerId || cost <= 0) return false;

  const usersPath = getUsersPath();
  const userRef = doc(db, usersPath, partnerId);
  const txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
  const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', partnerId);
  const storeProfileRef = doc(db, usersPath, partnerId, 'storeProfile', 'main');

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) return;

      const currentPoints = Number(userDoc.data().creditPoints) || 0;
      
      if (currentPoints <= 0) {
        transaction.delete(activePartnerRef); 
        transaction.update(storeProfileRef, { isSupportActive: false }); 
        return; 
      }

      const actualDeduct = Math.min(currentPoints, cost);
      const newBalance = currentPoints - actualDeduct;

      transaction.update(userRef, {
        creditPoints: newBalance,
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

export const checkAdCreditSufficiency = async (userId, requiredAmount) => {
  if (!userId || requiredAmount <= 0) return false;
  try {
    const usersPath = getUsersPath();
    const userRef = doc(db, usersPath, userId);
    
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return (Number(userSnap.data().creditPoints || 0)) >= requiredAmount;
    }
    
    return false;
  } catch (error) {
    console.error("🔥 Error pre-validating ad credit:", error);
    return false;
  }
};

export const consumeAdCreditWithTransaction = async (transaction, userId, amount, referenceId = null, adTitle = null) => {
  const usersPath = getUsersPath();
  const userRef = doc(db, usersPath, userId);
  
  const txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
  const historyRef = doc(collection(db, usersPath, userId, 'credit_history'));

  const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', userId);

  const [userDoc, activePartnerSnap] = await Promise.all([
    transaction.get(userRef),
    transaction.get(activePartnerRef)
  ]);

  if (!userDoc.exists()) {
    throw new Error("ระบบไม่พบข้อมูลกระเป๋าเงินของคุณ");
  }

  let currentPoints = Number(userDoc.data().creditPoints || 0);

  if (currentPoints < amount) {
    throw new Error(`Credit Point ของคุณไม่เพียงพอ (ต้องการ ${amount} แต้ม) กรุณาเติมเครดิตก่อนทำรายการ`);
  }

  const newBalance = currentPoints - amount;
  const noteDisplay = adTitle ? `หักแต้มสำหรับโปรโมท: ${adTitle}` : 'หักแต้มสำหรับการฝากโฆษณา';

  transaction.update(userRef, {
    creditPoints: newBalance,
    updatedAt: serverTimestamp()
  });

  if (newBalance <= 0) {
    const storeProfileRef = doc(db, usersPath, userId, 'storeProfile', 'main');
    transaction.delete(activePartnerRef);
    transaction.update(storeProfileRef, { isSupportActive: false });
  } else if (activePartnerSnap.exists()) {
    transaction.set(activePartnerRef, { points: newBalance, updatedAt: serverTimestamp() }, { merge: true });
  }

  const txData = {
    transactionId: `TX-ADS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    uid: userId,
    type: 'spend',
    category: 'ads', 
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
    
    invalidateCreditHistoryCache(userId);

    return true;
  } catch (error) {
    console.error("🔥 Error consuming ad credit:", error.message);
    throw error; 
  }
};

export const trackAdImpressions = async (partnerIds, config) => {
  if (!partnerIds || partnerIds.length === 0 || !config) return;
  const adImpCost = config.adImpressionCost || 5; // e.g. 5 points per 100 views

  try {
    const statDocId = `${new Date().getFullYear()}-${new Date().getMonth()+1}`;
    const partnersToDeduct = [];

    // Batch updates manually using transactions (since normal batch won't easily support read-update for logic)
    const promises = partnerIds.map(async (partnerId) => {
      const partnerStatsRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', partnerId, 'stats', statDocId);
      
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(partnerStatsRef);
        let unbilled = 1;
        let totalImp = 1;

        if (docSnap.exists()) {
          const data = docSnap.data();
          unbilled = (data.unbilledImpressions || 0) + 1;
          totalImp = (data.impressions || 0) + 1;
        }

        if (unbilled >= 100) {
          // Reached threshold, deduct points and reset unbilled
          transaction.set(partnerStatsRef, { impressions: totalImp, unbilledImpressions: 0, updatedAt: serverTimestamp() }, { merge: true });
          partnersToDeduct.push(partnerId);
        } else {
          // Just increment
          transaction.set(partnerStatsRef, { impressions: totalImp, unbilledImpressions: unbilled, updatedAt: serverTimestamp() }, { merge: true });
        }
      });
    });

    await Promise.all(promises);

    // Deduct cost for those who hit the 100 impression threshold
    for (const pid of partnersToDeduct) {
      await deductPartnerCredit(pid, adImpCost, 'ad_impression');
    }

  } catch (error) {
    console.error("Error tracking ad impressions:", error);
  }
};

export const trackAdClick = async (partnerId, config) => {
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

    if (config && config.adClickCost) {
      await deductPartnerCredit(partnerId, config.adClickCost, 'click_contact');
    }
  } catch (error) {
    console.error("Error tracking ad click:", error);
  }
};

export const holdAdCredit = async (userId, amount, adTitle) => {
  console.log(`[Legacy Bypass] ข้ามการกันเครดิต ${amount} Pts`);
  return true; 
};

export const refundAdCredit = async (userId, amount, adTitle) => {
  console.log(`[Legacy Bypass] ข้ามการคืนเครดิต ${amount} Pts`);
  return true;
};
