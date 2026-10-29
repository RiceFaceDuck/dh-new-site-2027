import { doc, runTransaction, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { getCreditSettings } from './creditActionService';
import { COLLECTIONS } from 'dh-shared';

/**
 * 📦 บริการจัดการโควต้าโฆษณาแบบเติมเงินล่วงหน้า (Prepaid Ad Quota Engine)
 */

/**
 * ดึงราคาและจำนวนครั้งของแพ็กเกจโควต้าจากระบบหลังบ้าน
 * @returns {Promise<{ cost: number, count: number }>}
 */
export const getAdImpressionPricing = async () => {
  const config = await getCreditSettings();
  const cost = Number(config?.adImpressionCost ?? 15);
  const count = Number(config?.adImpressionCount ?? 100);
  return { cost, count };
};

/**
 * ตรวจสอบความพร้อมในการเปิดใช้งานป้าย (Pre-Activation Gatekeeper)
 * @param {number} userCredit - เครดิตคงเหลือของผู้ใช้
 * @param {Object} adData - ข้อมูลป้ายโฆษณา
 * @param {{ cost: number, count: number }} pricing - ราคาแพ็กเกจ
 * @returns {{ canActivate: boolean, needsPayment: boolean, requiredCost: number, quotaCount: number, reason?: string }}
 */
export const checkCanActivateAd = (userCredit = 0, adData = {}, pricing = { cost: 15, count: 100 }) => {
  const remainingViews = Number(adData?.remainingViews ?? 0);

  // 1. ถ้ายังมีโควต้าวิวเหลืออยู่เดิม สามารถเปิดใช้งานต่อได้ทันทีโดยไม่ต้องจ่ายแต้มเพิ่ม
  if (remainingViews > 0) {
    return {
      canActivate: true,
      needsPayment: false,
      requiredCost: 0,
      quotaCount: remainingViews,
      remainingViews
    };
  }

  // 2. ถ้าโควต้าหมดแล้ว ต้องซื้อแพ็กเกจใหม่ ตรวจสอบว่าแต้มในกระเป๋าพอหรือไม่
  const hasEnoughCredit = Number(userCredit) >= pricing.cost;
  return {
    canActivate: hasEnoughCredit,
    needsPayment: true,
    requiredCost: pricing.cost,
    quotaCount: pricing.count,
    remainingViews: 0,
    reason: hasEnoughCredit ? null : 'INSUFFICIENT_CREDIT'
  };
};

/**
 * เปิดใช้งานป้ายโฆษณาพร้อมหักแต้มล่วงหน้าและเติมโควต้า (Atomic Transaction)
 * @param {string} userId - UID ของผู้ใช้
 * @param {string} adId - ID ของป้ายโฆษณา
 * @param {string} adType - ประเภทป้าย ('BUSINESS_CARD' | 'PRODUCT_LINK' | 'BILLBOARD')
 * @param {Object} currentAdData - ข้อมูลป้ายปัจจุบัน
 * @returns {Promise<{ success: boolean, deducted: number, remainingViews: number, resumed: boolean }>}
 */
export const activateAdWithPrepaidQuota = async (userId, adId, adType, currentAdData = {}) => {
  if (!userId || !adId) throw new Error("Missing userId or adId");

  const pricing = await getAdImpressionPricing();
  const remainingViews = Number(currentAdData?.remainingViews ?? 0);

  // กรณีที่ 1: มีโควต้าเดิมเหลืออยู่แล้ว -> เปิดใช้งานต่อ ไม่หักแต้มซ้ำ
  if (remainingViews > 0) {
    const { toggleAdStatus } = await import('../marketingService');
    await toggleAdStatus(adId, 'paused', adType);
    return {
      success: true,
      deducted: 0,
      remainingViews,
      resumed: true
    };
  }

  // กรณีที่ 2: โควต้าหมดหรือเริ่มเปิดครั้งแรก -> หักแต้มล่วงหน้าแบบ Atomic Transaction
  return await runTransaction(db, async (transaction) => {
    // 1. Read Phase
    const userRef = doc(db, getCollectionPath('users'), userId);
    const primaryAdRef = doc(db, getCollectionPath('partner_ads'), adId);
    const settingsRef = doc(db, getCollectionPath('settings'), 'credit_config');

    const [userSnap, adSnap, settingsSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(primaryAdRef),
      transaction.get(settingsRef)
    ]);

    if (!userSnap.exists()) throw new Error("ไม่พบบัญชีผู้ใช้งาน");
    
    // ตรวจสอบคอลเลกชันของป้ายโฆษณา (SSOT ใน partner_ads หรือ fallback)
    let targetAdRef = primaryAdRef;
    let actualAdData = adSnap.exists() ? adSnap.data() : null;

    if (!actualAdData) {
      const skuRef = doc(db, getCollectionPath('user_sku_ads'), adId);
      const skuSnap = await transaction.get(skuRef);
      if (skuSnap.exists()) {
        targetAdRef = skuRef;
        actualAdData = skuSnap.data();
      }
    }

    if (!actualAdData) throw new Error("ไม่พบข้อมูลป้ายโฆษณา");

    const userData = userSnap.data();
    const currentPoints = Number(userData.creditPoints || 0);

    // 🛡️ Gatekeeper Guard: แต้มต้องพอตามราคาแพ็กเกจ
    if (currentPoints < pricing.cost) {
      throw new Error(`เครดิตของคุณไม่เพียงพอ (มี ${currentPoints} Pts) ต้องใช้ ${pricing.cost} Pts ในการเปิดใช้งาน`);
    }

    // คำนวณยอดเงินและบัญชีกองกลาง
    const sData = settingsSnap.exists() ? settingsSnap.data() : {};
    const ledger = sData.ledger || { systemPoolMax: 10000000, totalAllocated: 0, status: "SECURE" };
    const currentAllocated = Number(ledger.totalAllocated || 0);

    const safeCost = Math.round(pricing.cost * 100) / 100;
    const newPoints = Math.max(0, Math.round((currentPoints - safeCost) * 100) / 100);
    const newAllocated = Math.max(0, Math.round((currentAllocated - safeCost) * 100) / 100);

    // 2. Write Phase
    // A. ตัดแต้มผู้ใช้
    transaction.update(userRef, {
      creditPoints: newPoints,
      updatedAt: serverTimestamp()
    });

    // B. บันทึกบัญชีกองกลาง (Ledger Parity Guard)
    transaction.update(settingsRef, {
      "ledger.totalAllocated": newAllocated,
      updatedAt: serverTimestamp()
    });

    // C. บันทึกประวัติธุรกรรมการซื้อโควต้าโฆษณา (Credit Transaction Audit Log)
    const txId = `AD_QUOTA_${adId}_${Date.now()}`;
    const txRef = doc(db, getCollectionPath(COLLECTIONS.CREDIT_TRANSACTIONS), txId);
    transaction.set(txRef, {
      id: txId,
      uid: userId,
      type: 'PREPAID_AD_IMPRESSION',
      amount: safeCost,
      balanceAfter: newPoints,
      note: `ซื้อโควต้าแสดงผลโฆษณา ${pricing.count} ครั้ง (${safeCost} Pts)`,
      adId,
      adType: actualAdData.type || adType || 'BUSINESS_CARD',
      quotaViews: pricing.count,
      createdAt: serverTimestamp()
    });

    // D. อัปเดตสถานะและเติมโควต้าให้ป้ายโฆษณา
    transaction.update(targetAdRef, {
      status: 'active',
      isActive: true,
      quotaViews: pricing.count,
      remainingViews: pricing.count,
      activePackageCost: safeCost,
      isQuotaExhausted: false,
      autoRollover: true,
      updatedAt: serverTimestamp()
    });

    // E. หากเป็นนามบัตรช่าง (BUSINESS_CARD) ให้คืนสถานะลง ActivePartners ทันที
    if (actualAdData.type === 'BUSINESS_CARD') {
      const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), userId);
      const storeName = actualAdData.title || actualAdData.partnerName || userData.storeName || userData.displayName || 'ช่างซ่อมคอมพิวเตอร์';
      transaction.set(activePartnerRef, {
        partnerId: userId,
        storeName,
        services: actualAdData.description || userData.services || 'บริการซ่อมคอมพิวเตอร์',
        phone: actualAdData.phone || userData.phone || '',
        latitude: actualAdData.latitude ?? userData.latitude ?? 0,
        longitude: actualAdData.longitude ?? userData.longitude ?? 0,
        storeImage: actualAdData.imageUrl || userData.storeImage || null,
        points: newPoints,
        isActive: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return {
      success: true,
      deducted: safeCost,
      remainingViews: pricing.count,
      resumed: false
    };
  });
};
