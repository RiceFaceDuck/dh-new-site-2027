/* eslint-disable */
import { db } from './config';
import { 
  collection, doc, getDocs, getDoc, query, where, 
  serverTimestamp, runTransaction, increment,
  writeBatch, limit 
} from 'firebase/firestore';

import { trackAdView, trackAdClick, logImpression, logClick } from './marketingAnalyticsService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// 🚀 HOTFIX: แยก Cache ตามประเภทโฆษณาเพื่อป้องกันการจำค่าทับซ้อนกัน
let activeAdsCache = { data: {}, lastFetch: {} };
const CACHE_LIFETIME = 5 * 60 * 1000; 

export const marketingService = {
  
  detectPlatform: (url) => {
    if (!url) return 'other';
    const lowerUrl = String(url).toLowerCase();
    if (lowerUrl.includes('shopee.')) return 'shopee';
    if (lowerUrl.includes('lazada.')) return 'lazada';
    if (lowerUrl.includes('tiktok.')) return 'tiktok';
    if (lowerUrl.includes('facebook.')) return 'facebook';
    if (lowerUrl.includes('thisshop.')) return 'thisshop';
    if (lowerUrl.includes('line.me') || lowerUrl.includes('lineshopping')) return 'lineshopping';
    return 'other';
  },

  getActivePartnerAds: async (adType = 'BUSINESS_CARD') => {
    const now = Date.now();
    const lastFetchTime = activeAdsCache.lastFetch[adType] || 0;
    
    // ใช้ Cache ถ้ายังไม่หมดอายุ
    if (activeAdsCache.data[adType] && (now - lastFetchTime) < CACHE_LIFETIME) {
      return activeAdsCache.data[adType];
    }
    
    try {
      // 🚀 HOTFIX: ชี้เป้าคิวรี่ไปที่ Collection ที่ถูกต้อง เพื่อให้ตรงกับสถานะที่ถูกอัปเดตจากระบบ Backoffice
      let collectionName = 'partner_ads';
      if (adType === 'PRODUCT_LINK') collectionName = 'user_sku_ads';
      if (adType === 'BILLBOARD') collectionName = 'billboard_ads';

      const adsRef = collection(db, getCollectionPath(collectionName));
      const q = query(adsRef, where('status', '==', 'active'), where('type', '==', adType), limit(100));
      const snapshot = await getDocs(q);
      
      const adsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        _collection: collectionName, // แนบ collection กลับไปให้ trackView หักเครดิตถูกตาราง
        ...doc.data() 
      }));

      adsList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      const limitedAds = adsList.slice(0, 30); // โชว์โฆษณาสูงสุด 30 ตัวต่อรอบ

      activeAdsCache.data[adType] = limitedAds;
      activeAdsCache.lastFetch[adType] = now;
      return limitedAds;
    } catch (error) {
      console.error(`❌ Error fetching active ${adType}:`, error);
      return []; 
    }
  },

  submitPartnerAd: async (userId, adType, adData, creditLimitVal) => {
    if (!userId || !adType || !adData) throw new Error("ข้อมูลไม่ครบถ้วน");

    try {
      const batch = writeBatch(db); 
      const adId = `AD-${adType}-${Date.now()}`;
      const taskId = `TODO-${adId}`;

      const adPayload = {
        ...adData,
        type: adType, 
        ownerId: userId,
        status: 'pending', 
        creditLimit: creditLimitVal, 
        stats: { views: 0, clicks: 0 },
        createdAt: serverTimestamp()
      };

      let legacyTaskType = 'AD_APPROVAL';
      let oldCollectionName = 'partner_ads';
      let taskTitle = `ตรวจสอบโฆษณา: ${adData.title || 'นามบัตร'}`;

      if (adType === 'PRODUCT_LINK') {
          legacyTaskType = 'USER_SKU_APPROVAL';
          oldCollectionName = 'user_sku_ads';
          taskTitle = `ตรวจสอบสินค้าโปรโมท: ${adData.title}`;
      } else if (adType === 'BILLBOARD') {
          legacyTaskType = 'BILLBOARD_APPROVAL';
          oldCollectionName = 'billboard_ads';
          taskTitle = `ตรวจสอบแผ่นป้ายโฆษณา: ${adData.title}`;
      }

      const todoPayload = {
        taskId: taskId,
        type: legacyTaskType,
        taskType: legacyTaskType, 
        status: 'pending',
        priority: 'High',
        title: taskTitle,
        description: `พาร์ทเนอร์ ${adData.partnerName || 'DH Partner'} ฝากโปรโมท (งบ: ${creditLimitVal === -1 ? 'ไม่จำกัด' : creditLimitVal + ' Pts'})`,
        targetSkuId: adId,    
        partnerId: userId,    
        customerName: adData.partnerName || 'พาร์ทเนอร์',
        adDetails: adPayload,
        skuDetails: adPayload,
        adPayload: adPayload,
        requestedAt: serverTimestamp(), 
        createdAt: serverTimestamp(),
        createdBy: userId
      };

      batch.set(doc(db, getCollectionPath('partner_ads'), adId), adPayload);
      if (oldCollectionName !== 'partner_ads') {
         batch.set(doc(db, getCollectionPath(oldCollectionName), adId), adPayload);
      }

      batch.set(doc(db, getCollectionPath('todos'), taskId), todoPayload); 

      // 🚀 History Log: บันทึกการส่งคำร้องเข้า Central To-Do
      const logId = `submit_ad_${adId}_${Date.now()}`;
      batch.set(doc(db, getCollectionPath('system_logs'), logId), {
        module: 'Marketing',
        action: 'SubmitAd',
        targetId: adId,
        details: `Partner ${userId} submitted a new ${adType} ad request to Central To-Do`,
        timestamp: serverTimestamp(),
        performedBy: userId
      });

      await batch.commit();

      console.log(`✅ [Marketing] ${adType} Ad submitted perfectly matching Manager's schema!`);
      // เคลียร์แคชเพื่อให้โหลดข้อมูลใหม่รอบถัดไป
      activeAdsCache.lastFetch[adType] = 0; 
      return true;
    } catch (error) {
      console.error(`🔥 [Marketing] ${adType} submit failed:`, error.message);
      throw error;
    }
  },

  updatePartnerAd: async (userId, adId, adType, adData, creditLimitVal) => {
    if (!userId || !adId || !adType || !adData) throw new Error("ข้อมูลไม่ครบถ้วน");

    try {
      const batch = writeBatch(db); 
      const taskId = `TODO-${adId}`;

      const adPayload = {
        ...adData,
        type: adType, 
        ownerId: userId,
        status: 'pending', 
        creditLimit: creditLimitVal, 
        updatedAt: serverTimestamp()
      };

      let legacyTaskType = 'AD_APPROVAL';
      let oldCollectionName = 'partner_ads';
      let taskTitle = `[แก้ไข] ตรวจสอบโฆษณา: ${adData.title || 'นามบัตร'}`;

      if (adType === 'PRODUCT_LINK') {
          legacyTaskType = 'USER_SKU_APPROVAL';
          oldCollectionName = 'user_sku_ads';
          taskTitle = `[แก้ไข] ตรวจสอบสินค้า: ${adData.title}`;
      } else if (adType === 'BILLBOARD') {
          legacyTaskType = 'BILLBOARD_APPROVAL';
          oldCollectionName = 'billboard_ads';
          taskTitle = `[แก้ไข] ตรวจสอบแผ่นป้าย: ${adData.title}`;
      }

      const todoPayload = {
        taskId: taskId,
        type: legacyTaskType,
        taskType: legacyTaskType, 
        status: 'pending',
        priority: 'High',
        title: taskTitle,
        description: `พาร์ทเนอร์ขอแก้ไขโฆษณา (งบ: ${creditLimitVal === -1 ? 'ไม่จำกัด' : creditLimitVal + ' Pts'})`,
        targetSkuId: adId,    
        partnerId: userId,    
        customerName: adData.partnerName || 'พาร์ทเนอร์',
        adDetails: adPayload,
        skuDetails: adPayload,
        adPayload: adPayload,
        requestedAt: serverTimestamp(), 
        updatedAt: serverTimestamp(),
        createdBy: userId
      };

      batch.set(doc(db, getCollectionPath('partner_ads'), adId), adPayload, { merge: true });
      if (oldCollectionName !== 'partner_ads') {
         batch.set(doc(db, getCollectionPath(oldCollectionName), adId), adPayload, { merge: true });
      }

      batch.set(doc(db, getCollectionPath('todos'), taskId), todoPayload, { merge: true }); 

      // 🚀 History Log: บันทึกการขอแก้ไขคำร้องโฆษณา
      const logId = `update_ad_${adId}_${Date.now()}`;
      batch.set(doc(db, getCollectionPath('system_logs'), logId), {
        module: 'Marketing',
        action: 'UpdateAdRequest',
        targetId: adId,
        details: `Partner ${userId} updated the ${adType} ad request`,
        timestamp: serverTimestamp(),
        performedBy: userId
      });

      await batch.commit();

      console.log(`✅ [Marketing] ${adType} Ad updated perfectly!`);
      activeAdsCache.lastFetch[adType] = 0; 
      return true;
    } catch (error) {
      console.error(`🔥 [Marketing] ${adType} update failed:`, error.message);
      throw error;
    }
  },

  getUserPartnerAds: async (userId) => {
    try {
      const p1 = getDocs(query(collection(db, getCollectionPath('partner_ads')), where('ownerId', '==', userId), limit(50)));
      const p2 = getDocs(query(collection(db, getCollectionPath('user_sku_ads')), where('ownerId', '==', userId), limit(50)));
      const p3 = getDocs(query(collection(db, getCollectionPath('billboard_ads')), where('ownerId', '==', userId), limit(50)));

      const [s1, s2, s3] = await Promise.all([p1, p2, p3]);
      
      const adsList = [
        ...s1.docs.map(d => ({ id: d.id, ...d.data() })),
        ...s2.docs.map(d => ({ id: d.id, type: 'PRODUCT_LINK', ...d.data() })),
        ...s3.docs.map(d => ({ id: d.id, type: 'BILLBOARD', ...d.data() }))
      ];

      const uniqueAds = Array.from(new Map(adsList.map(item => [item.id, item])).values());
      uniqueAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      return uniqueAds;
    } catch (error) {
    console.error("🔥 Error:", error);

      return [];
    }
  },

  toggleAdStatus: async (adId, currentStatus, adType) => {
    if (!adId) return false;
    try {
      const isCurrentlyActive = ['APPROVED', 'ACTIVE'].includes(String(currentStatus).toUpperCase());
      const newStatus = isCurrentlyActive ? 'paused' : 'active';
      const newIsActive = !isCurrentlyActive;

      const updatePayload = {
        status: newStatus,
        isActive: newIsActive,
        updatedAt: serverTimestamp()
      };

      const resolveCollection = (type) => {
        if (!type) return null;
        const t = String(type).toLowerCase();
        if (t.includes('partner') || t === 'partner_ads') return 'partner_ads';
        if (t.includes('billboard') || t === 'billboard_ads') return 'billboard_ads';
        if (t.includes('sku') || t === 'user_sku_ads') return 'user_sku_ads';
        return null;
      };

      const targetCol = resolveCollection(adType);
      const adCols = targetCol ? [targetCol] : ['partner_ads', 'billboard_ads', 'user_sku_ads'];
      const batch = writeBatch(db);

      // 🚀 Quota Optimization: ดึงเฉพาะคอลเลกชันเป้าหมายเมื่อทราบ adType ประหยัด Reads จาก 3 เหลือ 1 Read
      const snaps = await Promise.all(adCols.map(col => getDoc(doc(db, getCollectionPath(col), adId))));
      
      let updatedCount = 0;
      snaps.forEach(snap => {
        if (snap.exists()) {
          batch.update(snap.ref, updatePayload);
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
      }

      activeAdsCache.lastFetch = {}; // ล้าง cache
      return { success: true, newStatus };
    } catch (err) {
      console.error("🔥 Error toggling ad status:", err);
      throw err;
    }
  },

  resubmitPartnerAd: async (userId, adId, adType) => {
    if (!userId || !adId) return false;
    try {
      const batch = writeBatch(db);
      const updatePayload = {
        status: 'PENDING',
        updatedAt: serverTimestamp(),
        resubmittedAt: serverTimestamp()
      };

      const resolveCollection = (type) => {
        if (!type) return null;
        const t = String(type).toLowerCase();
        if (t.includes('partner') || t === 'partner_ads') return 'partner_ads';
        if (t.includes('billboard') || t === 'billboard_ads') return 'billboard_ads';
        if (t.includes('sku') || t === 'user_sku_ads') return 'user_sku_ads';
        return null;
      };

      const targetCol = resolveCollection(adType);
      const adCols = targetCol ? [targetCol] : ['partner_ads', 'billboard_ads', 'user_sku_ads'];
      const snaps = await Promise.all(adCols.map(col => getDoc(doc(db, getCollectionPath(col), adId))));
      
      let adData = {};
      snaps.forEach(snap => {
        if (snap.exists()) {
          batch.update(snap.ref, updatePayload);
          adData = { ...snap.data() };
        }
      });

      // ดันคำร้องใหม่ไปยัง central_todos เพื่อให้ผู้จัดการเห็นอยู่ด้านบนสุด
      const taskId = `TODO-RESUBMIT-${adId}`;
      const legacyTaskType = adType === 'BILLBOARD' ? 'APPROVE_BILLBOARD_AD' : 'APPROVE_PARTNER_AD';
      const todoPayload = {
        taskId: taskId,
        type: legacyTaskType,
        taskType: legacyTaskType, 
        status: 'pending',
        priority: 'High',
        title: `[ส่งคำร้องซ้ำ] ${adData.title || adData.productName || 'โฆษณาพาร์ทเนอร์'}`,
        description: `พาร์ทเนอร์ส่งคำร้องขออนุมัติโฆษณาอีกครั้ง (Resubmitted)`,
        targetSkuId: adId,    
        partnerId: userId,    
        customerName: adData.partnerName || 'พาร์ทเนอร์',
        adDetails: adData,
        requestedAt: serverTimestamp(), 
        updatedAt: serverTimestamp(),
        createdBy: userId
      };

      batch.set(doc(db, getCollectionPath('todos'), taskId), todoPayload, { merge: true });

      await batch.commit();
      activeAdsCache.lastFetch = {};
      return { success: true };
    } catch (err) {
      console.error("🔥 Error resubmitting ad:", err);
      throw err;
    }
  },

  trackAdView,
  trackAdClick,
  logImpression,
  logClick
};

export const { 
  detectPlatform, getActivePartnerAds, submitPartnerAd, updatePartnerAd,
  getUserPartnerAds, toggleAdStatus, resubmitPartnerAd
} = marketingService;