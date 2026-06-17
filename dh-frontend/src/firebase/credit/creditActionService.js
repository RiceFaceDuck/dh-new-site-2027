import { collection, doc, getDoc, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';
import { appId, getUsersPath, invalidateCreditHistoryCache } from './creditConfig';

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
    const walletRef = doc(db, usersPath, userId, 'wallet', 'default');
    const userRef = doc(db, usersPath, userId);
    
    const walletSnap = await getDoc(walletRef);
    if (walletSnap.exists()) {
      return (Number(walletSnap.data().balance) || 0) >= requiredAmount;
    }
    
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
  const walletRef = doc(db, usersPath, userId, 'wallet', 'default');
  
  const txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
  const historyRef = doc(collection(db, usersPath, userId, 'credit_history'));

  const [userDoc, walletDoc] = await Promise.all([
    transaction.get(userRef),
    transaction.get(walletRef)
  ]);

  let currentPoints = 0;
  const isWalletExist = walletDoc.exists();

  if (isWalletExist) {
    currentPoints = Number(walletDoc.data().balance) || 0;
  } else if (userDoc.exists()) {
    currentPoints = Number(userDoc.data().creditPoints || 0);
  } else {
    throw new Error("ระบบไม่พบข้อมูลกระเป๋าเงินของคุณ");
  }

  if (currentPoints < amount) {
    throw new Error(`Credit Point ของคุณไม่เพียงพอ (ต้องการ ${amount} แต้ม) กรุณาเติมเครดิตก่อนทำรายการ`);
  }

  const newBalance = currentPoints - amount;
  const noteDisplay = adTitle ? `หักแต้มสำหรับโปรโมท: ${adTitle}` : 'หักแต้มสำหรับการฝากโฆษณา';

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

  if (userDoc.exists()) {
    transaction.update(userRef, {
      creditPoints: newBalance,
      updatedAt: serverTimestamp()
    });
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
  console.log(`[Legacy Bypass] ข้ามการกันเครดิต ${amount} Pts`);
  return true; 
};

export const refundAdCredit = async (userId, amount, adTitle) => {
  console.log(`[Legacy Bypass] ข้ามการคืนเครดิต ${amount} Pts`);
  return true;
};
