import { collection, doc, getDoc, getDocs, query, where, writeBatch, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';
import { getUsersPath, invalidateCreditHistoryCache } from './creditConfig';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * 🛑 ฟังก์ชันหยุดโฆษณาทุกตัวของเจ้าของเมื่อ Credit หมด (Out-Of-Credit Auto-Shutdown)
 */
export const pauseUserAdsOnOutOfCredit = async (partnerId) => {
  if (!partnerId) return;
  try {
    const adCols = ['partner_ads', 'billboard_ads', 'user_sku_ads'];
    const batch = writeBatch(db);
    let hasUpdates = false;

    const snapshots = await Promise.all(adCols.map(col => {
      const q = query(collection(db, getCollectionPath(col)), where('ownerId', '==', partnerId), where('status', '==', 'active'));
      return getDocs(q);
    }));

    snapshots.forEach(snap => {
      snap.forEach(docSnap => {
        batch.update(docSnap.ref, {
          status: 'OUT_OF_CREDIT',
          isActive: false,
          updatedAt: serverTimestamp()
        });
        hasUpdates = true;
      });
    });

    if (hasUpdates) {
      await batch.commit();
      console.log(`🛑 [adCreditService] Auto-suspended active ads for zero-credit partner: ${partnerId}`);
    }
  } catch (err) {
    console.error("🔥 Error auto-pausing ads on zero credit:", err);
  }
};

export const deductPartnerCredit = async (partnerId, cost = 10, actionType = 'click_contact') => {
  if (!partnerId || cost <= 0) return false;

  const usersPath = getUsersPath();
  const userRef = doc(db, usersPath, partnerId);
  const txRef = doc(collection(db, getCollectionPath('credit_transactions')));
  const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
  const storeProfileRef = doc(db, usersPath, partnerId, 'storeProfile', 'main');

  try {
    let isZeroCredit = false;

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) return;

      const currentPoints = Number(userDoc.data().creditPoints) || 0;
      
      if (currentPoints <= 0) {
        transaction.delete(activePartnerRef); 
        transaction.update(storeProfileRef, { isSupportActive: false }); 
        isZeroCredit = true;
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
        isZeroCredit = true;
      }

      transaction.set(txRef, {
        transactionId: `PARTNER-${actionType.toUpperCase()}-${Date.now()}`,
        uid: partnerId,
        type: 'deduct',
        amount: actualDeduct,
        balanceAfter: newBalance,
        action: actionType,
        note: actionType === 'click_contact' ? 'ค่าธรรมเนียมลูกค้ากดติดต่อร้านซ่อม' : 'ค่าธรรมเนียมแสดงป้ายร้าน (Impression)',
        timestamp: serverTimestamp()
      });
    });

    if (isZeroCredit) {
      await pauseUserAdsOnOutOfCredit(partnerId);
    }

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
  
  const txRef = doc(collection(db, getCollectionPath('credit_transactions')));

  const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), userId);

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
    type: 'deduct',
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
  const adImpCost = config.adImpressionCost || 5; 

  try {
    const statDocId = `${new Date().getFullYear()}-${new Date().getMonth()+1}`;
    const partnersToDeduct = [];

    const promises = partnerIds.map(async (partnerId) => {
      const partnerStatsRef = doc(db, getCollectionPath('partners'), partnerId, 'stats', statDocId);
      
      let shouldDeduct = false;

      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(partnerStatsRef);
        let unbilled = 1;
        let totalImp = 1;

        shouldDeduct = false;

        if (docSnap.exists()) {
          const data = docSnap.data();
          unbilled = (data.unbilledImpressions || 0) + 1;
          totalImp = (data.impressions || 0) + 1;
        }

        if (unbilled >= 100) {
          transaction.set(partnerStatsRef, { impressions: totalImp, unbilledImpressions: 0, updatedAt: serverTimestamp() }, { merge: true });
          shouldDeduct = true;
        } else {
          transaction.set(partnerStatsRef, { impressions: totalImp, unbilledImpressions: unbilled, updatedAt: serverTimestamp() }, { merge: true });
        }
      });
      
      if (shouldDeduct) {
        partnersToDeduct.push(partnerId);
      }
    });

    await Promise.all(promises);

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
    const partnerStatsRef = doc(db, getCollectionPath('partners'), partnerId, 'stats', statDocId);
    
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
