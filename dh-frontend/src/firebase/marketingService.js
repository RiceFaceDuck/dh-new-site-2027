/* eslint-disable */
import { db } from './config';
import { 
  collection, doc, getDocs, query, where, 
  serverTimestamp, increment, writeBatch 
} from 'firebase/firestore';

// 🛡️ กำหนด App ID ที่ถูกต้องตาม Security Rules
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 SMART CACHE & ANTI-FRAUD BUFFER SYSTEM
// ==========================================
let adStatsBuffer = {}; 
let flushInterval = null;

let activeAdsCache = { data: {}, lastFetch: 0 };
const CACHE_LIFETIME = 5 * 60 * 1000; 

export const flushAdStatsBatch = async () => {
  if (Object.keys(adStatsBuffer).length === 0) return;
  const statsToProcess = { ...adStatsBuffer };
  adStatsBuffer = {}; 

  try {
    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const collectionName in statsToProcess) {
      for (const adId in statsToProcess[collectionName]) {
        const stats = statsToProcess[collectionName][adId];
        if (stats.views > 0 || stats.clicks > 0) {
          const adRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, adId);
          const updateData = {};
          if (stats.views > 0) updateData['stats.views'] = increment(stats.views);
          if (stats.clicks > 0) updateData['stats.clicks'] = increment(stats.clicks);
          batch.update(adRef, updateData);
          hasUpdates = true;
        }
      }
    }
    if (hasUpdates) await batch.commit();
  } catch (error) {
    console.error("🔥 [Marketing] Error flushing ad stats:", error);
    for (const col in statsToProcess) {
      if (!adStatsBuffer[col]) adStatsBuffer[col] = {};
      for (const id in statsToProcess[col]) {
        if (!adStatsBuffer[col][id]) adStatsBuffer[col][id] = { views: 0, clicks: 0 };
        adStatsBuffer[col][id].views += statsToProcess[col][id].views;
        adStatsBuffer[col][id].clicks += statsToProcess[col][id].clicks;
      }
    }
  }
};

const startFlushInterval = () => {
  if (!flushInterval) flushInterval = setInterval(flushAdStatsBatch, 15000);
};

if (typeof window !== "undefined") {
  window.addEventListener('beforeunload', flushAdStatsBatch);
}

const checkAntiFraud = (actionType, adId) => {
  const sessionKey = `dh_ad_${actionType}_${adId}`;
  const lastAction = sessionStorage.getItem(sessionKey);
  const now = Date.now();
  if (lastAction && (now - parseInt(lastAction)) < 300000) return false; 
  sessionStorage.setItem(sessionKey, now.toString());
  return true; 
};

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
    if (activeAdsCache.data[adType] && (now - activeAdsCache.lastFetch) < CACHE_LIFETIME) {
      return activeAdsCache.data[adType];
    }
    try {
      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads');
      const q = query(adsRef, where('status', '==', 'APPROVED'), where('type', '==', adType));
      const snapshot = await getDocs(q);
      const adsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      adsList.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      const limitedAds = adsList.slice(0, 30);

      activeAdsCache.data[adType] = limitedAds;
      activeAdsCache.lastFetch = now;
      return limitedAds;
    } catch (error) {
      console.error(`❌ Error fetching active ${adType}:`, error);
      return []; 
    }
  },

  // 🚀 THE BULLETPROOF FIX: ปรับ โครงสร้าง Payload ให้ตรงกับระบบ Manager Panel (หลังบ้าน) 100%
  submitPartnerAd: async (userId, adType, adData, creditLimitVal) => {
    if (!userId || !adType || !adData) throw new Error("ข้อมูลไม่ครบถ้วน");

    try {
      const batch = writeBatch(db); 
      const adId = `AD-${adType}-${Date.now()}`;
      const taskId = `TODO-${adId}`;

      // 1. จัดเตรียม Payload ของโฆษณา
      const adPayload = {
        ...adData,
        type: adType, 
        ownerId: userId,
        status: 'pending', 
        creditLimit: creditLimitVal, 
        stats: { views: 0, clicks: 0 },
        createdAt: serverTimestamp()
      };

      // 2. กำหนดประเภทและชื่อให้ตรงกับ Backend
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

      // 🎯 3. สร้าง Todo Payload ที่หน้าตาเหมือนของเก่าเป๊ะๆ (Flat Structure)
      // ฟิลด์เหล่านี้คือสิ่งที่ตารางหลังบ้านต้องการเพื่อนำไปแสดงผล
      const todoPayload = {
        taskId: taskId,
        type: legacyTaskType,
        taskType: legacyTaskType, 
        status: 'pending',
        priority: 'High',
        
        // 🚨 ฟิลด์บังคับที่ระบบหลังบ้านต้องใช้
        title: taskTitle,
        description: `พาร์ทเนอร์ ${adData.partnerName || 'DH Partner'} ฝากโปรโมท (งบ: ${creditLimitVal === -1 ? 'ไม่จำกัด' : creditLimitVal + ' Pts'})`,
        targetSkuId: adId,    // 🔑 สำคัญมาก: หลังบ้านใช้คีย์นี้เป็น ID เพื่อเปิดดูข้อมูล
        partnerId: userId,    // 🔑 สำคัญมาก
        customerName: adData.partnerName || 'พาร์ทเนอร์',
        
        // ข้อมูลสำรอง (ส่งไปเผื่อไว้)
        adDetails: adPayload,
        skuDetails: adPayload,
        adPayload: adPayload,
        
        requestedAt: serverTimestamp(), // 🔑 สำคัญมาก
        createdAt: serverTimestamp(),
        createdBy: userId
      };

      // 4. เขียนข้อมูลลงตารางโฆษณา
      batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId), adPayload);
      if (oldCollectionName !== 'partner_ads') {
         batch.set(doc(db, 'artifacts', appId, 'public', 'data', oldCollectionName, adId), adPayload);
      }

      // 5. ส่งงานเข้ากระดานผู้จัดการ (ยิงเข้า manager_todos ที่เดียวกับที่หลังบ้านอ่าน)
      batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId), todoPayload);         
      batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'manager_todos', taskId), todoPayload); 

      await batch.commit();

      console.log(`✅ [Marketing] ${adType} Ad submitted perfectly matching Manager's schema!`);
      activeAdsCache.lastFetch = 0; 
      return true;
    } catch (error) {
      console.error(`🔥 [Marketing] ${adType} submit failed:`, error.message);
      throw error;
    }
  },

  getUserPartnerAds: async (userId) => {
    try {
      const p1 = getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads'), where('ownerId', '==', userId)));
      const p2 = getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads'), where('ownerId', '==', userId)));

      const [s1, s2] = await Promise.all([p1, p2]);
      
      const adsList = [
        ...s1.docs.map(d => ({ id: d.id, ...d.data() })),
        ...s2.docs.map(d => ({ id: d.id, type: 'PRODUCT_LINK', ...d.data() }))
      ];

      const uniqueAds = Array.from(new Map(adsList.map(item => [item.id, item])).values());
      uniqueAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      return uniqueAds;
    } catch (error) {
      return [];
    }
  },

  trackAdView: async (collectionName, adId) => {
    if (!adId || !collectionName) return;
    if (!checkAntiFraud('view', adId)) return;
    if (!adStatsBuffer[collectionName]) adStatsBuffer[collectionName] = {};
    if (!adStatsBuffer[collectionName][adId]) adStatsBuffer[collectionName][adId] = { views: 0, clicks: 0 };
    adStatsBuffer[collectionName][adId].views += 1;
    startFlushInterval(); 
  },

  trackAdClick: async (collectionName, adId) => {
    if (!adId || !collectionName) return;
    if (!checkAntiFraud('click', adId)) return;
    if (!adStatsBuffer[collectionName]) adStatsBuffer[collectionName] = {};
    if (!adStatsBuffer[collectionName][adId]) adStatsBuffer[collectionName][adId] = { views: 0, clicks: 0 };
    adStatsBuffer[collectionName][adId].clicks += 1;
    startFlushInterval();
    flushAdStatsBatch();
  },

  logImpression: async (adId) => {
    if (!adId) return;
    const col = String(adId).includes('SKU') ? 'user_sku_ads' : (String(adId).includes('BB') ? 'billboard_ads' : 'partner_ads');
    return marketingService.trackAdView(col, adId);
  },
  
  logClick: async (adId) => {
    if (!adId) return;
    const col = String(adId).includes('SKU') ? 'user_sku_ads' : (String(adId).includes('BB') ? 'billboard_ads' : 'partner_ads');
    return marketingService.trackAdClick(col, adId);
  }
};

export const { 
  detectPlatform, getActivePartnerAds, submitPartnerAd, 
  getUserPartnerAds, trackAdView, trackAdClick,
  logImpression, logClick 
} = marketingService;