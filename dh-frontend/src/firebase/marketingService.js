/* eslint-disable */
import { db } from './config';
import { 
  collection, doc, getDocs, getDoc, query, where, 
  serverTimestamp, runTransaction, increment,
  writeBatch 
} from 'firebase/firestore';

// 🚀 นำเข้าระบบตัดเงินจาก Credit Service
import { deductPartnerCredit } from './creditService';

// 🛡️ กำหนด App ID
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 SMART CACHE & ANTI-FRAUD BUFFER SYSTEM
// ==========================================
let adStatsBuffer = {}; 
let flushInterval = null;

// 🚀 HOTFIX: แยก Cache ตามประเภทโฆษณาเพื่อป้องกันการจำค่าทับซ้อนกัน
let activeAdsCache = { data: {}, lastFetch: {} };
const CACHE_LIFETIME = 5 * 60 * 1000; 

// 🚀 อัปเกรดขั้นสุด: ยิงยอดวิว + หักเครดิต + เช็คงบประมาณ ใน Batch เดียว!
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
          
          // 🔍 ดึงข้อมูลโฆษณามาเช็คสถานะการเงิน (Real-time Validation)
          const adSnap = await getDoc(adRef);
          
          if (adSnap.exists()) {
            const adData = adSnap.data();
            const updateData = {};
            if (stats.views > 0) updateData['stats.views'] = increment(stats.views);
            if (stats.clicks > 0) updateData['stats.clicks'] = increment(stats.clicks);

            // 🛑 เช็คว่า "งบประมาณชนเพดาน" หรือยัง? (ถ้าชนเพดาน ให้หยุดโฆษณาทันที)
            if (adData.creditLimit !== -1 && adData.creditLimit > 0) {
               const currentViews = adData.stats?.views || 0;
               if ((currentViews + stats.views) >= adData.creditLimit) {
                  updateData['status'] = 'COMPLETED'; // ตัดจบแคมเปญ
               }
            }

            batch.update(adRef, updateData);
            hasUpdates = true;

            // 💸 หักเครดิต Pay-per-view (1 View = 1 Point) จากกระเป๋าเจ้าของ
            if (adData.ownerId && stats.views > 0) {
               await deductPartnerCredit(adData.ownerId, stats.views, 'ad_impression');
            }
          }
        }
      }
    }
    if (hasUpdates) {
      await batch.commit();
      console.log("✅ [Marketing] Ads stats flushed & credits deducted perfectly.");
    }
  } catch (error) {
    console.error("🔥 [Marketing] Error flushing ad stats:", error);
    // คืนค่าเข้า Buffer หากพัง
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

      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
      const q = query(adsRef, where('status', '==', 'APPROVED'), where('type', '==', adType));
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

      batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId), adPayload);
      if (oldCollectionName !== 'partner_ads') {
         batch.set(doc(db, 'artifacts', appId, 'public', 'data', oldCollectionName, adId), adPayload);
      }

      batch.set(doc(db, 'todos', taskId), todoPayload); 

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

      batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId), adPayload, { merge: true });
      if (oldCollectionName !== 'partner_ads') {
         batch.set(doc(db, 'artifacts', appId, 'public', 'data', oldCollectionName, adId), adPayload, { merge: true });
      }

      batch.set(doc(db, 'todos', taskId), todoPayload, { merge: true }); 

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
      const p1 = getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads'), where('ownerId', '==', userId)));
      const p2 = getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads'), where('ownerId', '==', userId)));
      const p3 = getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'billboard_ads'), where('ownerId', '==', userId)));

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
  detectPlatform, getActivePartnerAds, submitPartnerAd, updatePartnerAd,
  getUserPartnerAds, trackAdView, trackAdClick,
  logImpression, logClick 
} = marketingService;