import { db } from './config';
import { 
  collection, doc, getDocs, getDoc, query, where, 
  serverTimestamp, writeBatch, limit, updateDoc, deleteDoc 
} from 'firebase/firestore';

import { trackAdView, trackAdClick, logImpression, logClick } from './marketingAnalyticsService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🚀 HOTFIX: แยก Cache ตามประเภทโฆษณาเพื่อป้องกันการจำค่าทับซ้อนกัน
let activeAdsCache = { data: {}, lastFetch: {} };
const CACHE_LIFETIME = 5 * 60 * 1000; 

// 🛡️ Quota Shield: แคชโฆษณาตามรายผู้ใช้เพื่อป้องกันการยิง 3 Collection ซ้ำซ้อน
const userAdsCache = new Map();
const USER_ADS_CACHE_TTL = 3 * 60 * 1000; 

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
      // 🚀 SSOT Optimization: ใช้ partner_ads เป็น Single Source of Truth รวมทุกประเภทโฆษณา
      const collectionName = 'partner_ads';
      const adsRef = collection(db, getCollectionPath(collectionName));
      const q = query(adsRef, where('status', 'in', ['active', 'ACTIVE']), where('type', '==', adType), limit(100));
      const snapshot = await getDocs(q);
      
      const adsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        _collection: collectionName,
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
      let taskTitle = `ตรวจสอบโฆษณา: ${adData.title || 'นามบัตร'}`;

      if (adType === 'PRODUCT_LINK') {
          legacyTaskType = 'USER_SKU_APPROVAL';
          taskTitle = `ตรวจสอบสินค้าโปรโมท: ${adData.title}`;
      } else if (adType === 'BILLBOARD') {
          legacyTaskType = 'BILLBOARD_APPROVAL';
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

      // 🚀 SSOT: บันทึกเข้า partner_ads คอลเลกชันเดียวเป็น Single Source of Truth
      batch.set(doc(db, getCollectionPath('partner_ads'), adId), adPayload);

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
        isActive: false,
        creditLimit: creditLimitVal, 
        updatedAt: serverTimestamp()
      };

      let legacyTaskType = 'AD_APPROVAL';
      let taskTitle = `[แก้ไข] ตรวจสอบโฆษณา: ${adData.title || 'นามบัตร'}`;

      if (adType === 'PRODUCT_LINK') {
          legacyTaskType = 'USER_SKU_APPROVAL';
          taskTitle = `[แก้ไข] ตรวจสอบสินค้า: ${adData.title}`;
      } else if (adType === 'BILLBOARD') {
          legacyTaskType = 'BILLBOARD_APPROVAL';
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

      // 🚀 SSOT: อัปเดตที่ partner_ads คอลเลกชันเดียวเป็น Single Source of Truth
      batch.set(doc(db, getCollectionPath('partner_ads'), adId), adPayload, { merge: true });

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

  getUserPartnerAds: async (userId, forceRefresh = false) => {
    if (!userId) return [];
    if (!forceRefresh && userAdsCache.has(userId)) {
      const cached = userAdsCache.get(userId);
      if (Date.now() - cached.timestamp < USER_ADS_CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      // 🚀 SSOT & Quota Shield: ยิงคิวรี่ตรงที่ partner_ads คอลเลกชันเดียว ลดโควต้าอ่านลง 66%
      const q = query(
        collection(db, getCollectionPath('partner_ads')), 
        where('ownerId', '==', userId), 
        limit(100)
      );
      const snapshot = await getDocs(q);
      
      const uniqueAds = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      uniqueAds.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt).getTime() || 0)) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt).getTime() || 0)));
      
      userAdsCache.set(userId, { data: uniqueAds, timestamp: Date.now() });
      return uniqueAds;
    } catch (error) {
      console.error("🔥 Error fetching user partner ads:", error);
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

      // 🚀 SSOT: ตรวจสอบและอัปเดตที่ partner_ads เป็นหลัก (1 Read)
      const primaryRef = doc(db, getCollectionPath('partner_ads'), adId);
      const primarySnap = await getDoc(primaryRef);
      let adDocData = primarySnap.exists() ? primarySnap.data() : null;

      if (primarySnap.exists()) {
        await updateDoc(primaryRef, updatePayload);
      } else {
        // Fallback สำหรับโฆษณารุ่นเก่าที่ยังตกค้างใน legacy collections
        const legacyCols = ['billboard_ads', 'user_sku_ads'];
        for (const col of legacyCols) {
          const snap = await getDoc(doc(db, getCollectionPath(col), adId));
          if (snap.exists()) {
            adDocData = snap.data();
            await updateDoc(snap.ref, updatePayload);
            break;
          }
        }
      }

      // ถ้าเป็นการพักโฆษณานามบัตร (BUSINESS_CARD) ให้ลบออกจาก ActivePartners เพื่อไม่ให้แสดงบนเรดาร์
      if (newStatus === 'paused' && adDocData && adDocData.type === 'BUSINESS_CARD' && adDocData.ownerId) {
        try {
          await deleteDoc(doc(db, getCollectionPath('ActivePartners'), adDocData.ownerId));
        } catch (e) {
          console.warn("ActivePartners sync on pause warning:", e);
        }
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
      const updatePayload = {
        status: 'pending',
        isActive: false,
        updatedAt: serverTimestamp(),
        resubmittedAt: serverTimestamp()
      };

      let adData = {};
      let targetRef = null;
      const primaryRef = doc(db, getCollectionPath('partner_ads'), adId);
      const primarySnap = await getDoc(primaryRef);

      if (primarySnap.exists()) {
        adData = primarySnap.data();
        targetRef = primaryRef;
      } else {
        // Fallback สำหรับคอลเลกชันเก่า
        const legacyCols = ['billboard_ads', 'user_sku_ads'];
        for (const col of legacyCols) {
          const snap = await getDoc(doc(db, getCollectionPath(col), adId));
          if (snap.exists()) {
            adData = snap.data();
            targetRef = snap.ref;
            break;
          }
        }
      }

      const batch = writeBatch(db);
      if (targetRef) {
        batch.update(targetRef, updatePayload);
      }

      // ดันคำร้องใหม่ไปยัง todos เพื่อให้ผู้จัดการเห็นอยู่ด้านบนสุด
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