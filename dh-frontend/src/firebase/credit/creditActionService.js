import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';
import { getUsersPath, invalidateCreditHistoryCache } from './creditConfig';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { getUserTier } from './creditFormatService';

export const adjustUserCreditWithTransaction = async (transaction, uid, amount, type, note, actorUid, referenceId = null) => {
  try {
    if (!uid) throw new Error("UID Missing");
    const safeAmount = Math.round(Number(amount) * 100) / 100;
    if (safeAmount <= 0) throw new Error("จำนวนเครดิตไม่ถูกต้อง");

    const usersColPathTx = getUsersPath();
    const userRef = doc(db, usersColPathTx, uid);
    
    let txRef;
    const refSuffix = referenceId ? referenceId : Date.now().toString();
    if (referenceId) {
      txRef = doc(db, getCollectionPath('credit_transactions'), `ADJ_${type}_${referenceId}`);
      const txSnap = await transaction.get(txRef);
      if (txSnap.exists()) throw new Error("รายการอ้างอิงนี้ถูกดำเนินการไปแล้ว");
    } else {
      txRef = doc(collection(db, getCollectionPath('credit_transactions')));
    }

    const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), uid);
    
    const [userSnap, activePartnerSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(activePartnerRef)
    ]);
    if (!userSnap.exists()) throw new Error("ไม่พบบัญชีผู้ใช้งาน");

    let currentWallet = Number(userSnap.data().creditPoints || 0);
    const safeCurrentWallet = Math.round(currentWallet * 100) / 100;
    let newWalletBalance = safeCurrentWallet;
    let totalAccumulated = Number(userSnap.data().totalAccumulatedPoints || currentWallet);

    if (type === 'deposit' || type === 'add' || type === 'earn') {
      newWalletBalance += safeAmount;
      totalAccumulated += safeAmount;
    } else if (type === 'deduct' || type === 'spend') {
      if (safeCurrentWallet < safeAmount) {
        throw new Error(`ยอดเครดิตของผู้ใช้งานมีไม่เพียงพอ`);
      }
      newWalletBalance -= safeAmount;
    }

    newWalletBalance = Math.round(newWalletBalance * 100) / 100;

    transaction.update(userRef, {
      creditPoints: newWalletBalance,
      totalAccumulatedPoints: totalAccumulated,
      updatedAt: serverTimestamp()
    });

    if (activePartnerSnap.exists()) {
      transaction.set(activePartnerRef, { points: newWalletBalance, updatedAt: serverTimestamp() }, { merge: true });
    }

    const mappedType = (type === 'deposit' || type === 'add' || type === 'earn') ? 'add' : 'deduct';
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

    return { success: true, transactionId: txRef.id, newBalance: newWalletBalance };
  } catch (error) {
    console.error("🔥 Error in adjustUserCreditWithTransaction:", error);
    throw error;
  }
};

export const getCreditSettings = async () => {
  try {
    const docRef = doc(db, getCollectionPath('settings'), 'credit_config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch (error) {
    console.error("🔥 System Error [getCreditSettings]:", error);
    return null;
  }
};

export const calculateEarnedPoints = (amount, config, items = [], userTotalAccumulatedPoints = 0) => {
  if (!amount || amount <= 0 || !config) return 0;
  const earningRate = config.earningRate || config.pointsEarningRate || 100;
  let basePoints = Math.floor(amount / earningRate);
  const userTier = getUserTier(userTotalAccumulatedPoints);
  let multiplier = config.tierMultiplier || userTier.multiplier;
  let totalPoints = Math.floor(basePoints * multiplier);

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
      const orderRef = doc(db, getCollectionPath('orders'), orderId);
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
      const txRef = doc(collection(db, getCollectionPath('credit_transactions')));
      transaction.set(txRef, {
        transactionId: `EARN-${Date.now()}`,
        uid: userId,
        type: 'add',
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
