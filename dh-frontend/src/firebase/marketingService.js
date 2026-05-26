/* eslint-disable */
import { db } from './config';
import { 
  collection, doc, getDocs, getDoc, query, where, 
  serverTimestamp, runTransaction, increment, limit,
  writeBatch 
} from 'firebase/firestore';

// 🚀 นำเข้าฟังก์ชันหักเครดิตแบบ Transaction จาก Credit Service
import { consumeAdCreditWithTransaction } from './creditService';

// 🛡️ กำหนด App ID สำหรับการเข้าถึงแบบ Enterprise Sandbox
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// 🧠 SMART CACHE & ANTI-FRAUD BUFFER SYSTEM
// ==========================================

let adStatsBuffer = {}; 
let flushInterval = null;

let activeAdsCache = {
  data: {},
  lastFetch: 0
};
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

    if (hasUpdates) {
      await batch.commit();
    }
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
  if (!flushInterval) {
    flushInterval = setInterval(flushAdStatsBatch, 15000);
  }
};

if (typeof window !== "undefined") {
  window.addEventListener('beforeunload', () => {
    flushAdStatsBatch();
  });
}

const checkAntiFraud = (actionType, adId) => {
  const sessionKey = `dh_ad_${actionType}_${adId}`;
  const lastAction = sessionStorage.getItem(sessionKey);
  const now = Date.now();
  
  if (lastAction && (now - parseInt(lastAction)) < 300000) {
    return false; 
  }
  
  sessionStorage.setItem(sessionKey, now.toString());
  return true; 
};


export const marketingService = {
  
  // ==========================================
  // 🌟 UNIFIED ARCHITECTURE (รองรับ 3 ระบบ)
  // ==========================================

  /**
   * 🤖 [NEW] ฟังก์ชันวิเคราะห์ Platform อัตโนมัติ (แก้บั๊ก ProductAdCard)
   */
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
      // 🚀 HOTFIX: ลบ orderBy ออกเพื่อแก้ Firebase Composite Index Error
      const q = query(
        adsRef, 
        where('status', '==', 'APPROVED'),
        where('type', '==', adType)
      );
      const snapshot = await getDocs(q);
      const adsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 🚀 ทำการ Sort ใหม่ล่าสุด ฝั่ง Client ทันที
      adsList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      // ดึงไปแสดงแค่ 30 รายการล่าสุด
      const limitedAds = adsList.slice(0, 30);

      activeAdsCache.data[adType] = limitedAds;
      activeAdsCache.lastFetch = now;

      return limitedAds;
    } catch (error) {
      console.error(`❌ [Marketing] Error fetching active ${adType} ads:`, error);
      return []; 
    }
  },

  submitPartnerAd: async (userId, adType, adData, creditCost) => {
    if (!userId || !adType || !adData || creditCost <= 0) throw new Error("ข้อมูลไม่ครบถ้วน");

    try {
      await runTransaction(db, async (transaction) => {
        const adId = `AD-${adType}-${Date.now()}`;
        const taskId = `TODO-${adId}`;
        
        let adTitle = adData.businessName || adData.productName || adData.title || 'โฆษณา';
        await consumeAdCreditWithTransaction(transaction, userId, creditCost, adId, `ซื้อพื้นที่โฆษณา: ${adTitle}`);

        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId);
        const adPayload = {
          ...adData,
          type: adType, 
          ownerId: userId,
          status: 'PENDING', 
          cost: creditCost,
          stats: { views: 0, clicks: 0 },
          createdAt: serverTimestamp()
        };
        transaction.set(adRef, adPayload);

        const todoRef = doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId);
        transaction.set(todoRef, {
          taskId: taskId,
          taskType: `${adType}_AD_APPROVAL`, 
          status: 'PENDING',
          priority: 'NORMAL',
          customer: { uid: userId },
          adDetails: adPayload,
          createdAt: serverTimestamp(),
          createdBy: userId
        });
      });

      console.log(`✅ [Marketing] ${adType} Ad requested successfully`);
      activeAdsCache.lastFetch = 0; 
      return true;
    } catch (error) {
      console.error(`🔥 [Marketing] ${adType} Ad request failed:`, error.message);
      throw error;
    }
  },

  getUserPartnerAds: async (userId) => {
    try {
      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads');
      // 🚀 HOTFIX: ลบ orderBy ออกเช่นกัน
      const q = query(adsRef, where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      
      const adsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      adsList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      return adsList;
    } catch (error) {
      console.error("❌ [Marketing] Error fetching user unified ads:", error);
      return [];
    }
  },

  // ==========================================
  // 📊 3. ฟังก์ชัน Tracking (Anti-Fraud & Batch)
  // ==========================================

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

  // ==========================================
  // ⚠️ ฟังก์ชัน Legacy (เก็บไว้รองรับระบบเก่า)
  // ==========================================
  
  getActiveBillboardAds: async () => {
    try {
      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'billboard_ads');
      const q = query(adsRef, where('status', '==', 'APPROVED'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      return list.slice(0, 5);
    } catch (error) {
      return []; 
    }
  },

  getActiveAds: async () => {
    try {
      const skuRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads');
      const q = query(skuRef, where('status', '==', 'APPROVED'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      return list.slice(0, 20);
    } catch (error) {
      return []; 
    }
  },

  requestBillboardAd: async (userId, adData, creditCost) => {
    if (!userId || !adData || creditCost <= 0) throw new Error("ข้อมูลไม่ครบถ้วน");
    try {
      await runTransaction(db, async (transaction) => {
        const adId = `AD-BB-${Date.now()}`;
        const taskId = `TODO-${adId}`;
        await consumeAdCreditWithTransaction(transaction, userId, creditCost, adId, `ซื้อป้ายโฆษณา: ${adData.title}`);
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'billboard_ads', adId);
        const adPayload = { ...adData, ownerId: userId, status: 'PENDING', cost: creditCost, stats: { views: 0, clicks: 0 }, createdAt: serverTimestamp() };
        transaction.set(adRef, adPayload);
        const todoRef = doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId);
        transaction.set(todoRef, { taskId: taskId, taskType: 'BILLBOARD_APPROVAL', status: 'PENDING', priority: 'NORMAL', customer: { uid: userId }, adDetails: adPayload, createdAt: serverTimestamp(), createdBy: userId });
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  requestUserSkuAd: async (userId, skuData, creditCost) => {
    if (!userId || !skuData || creditCost <= 0) throw new Error("ข้อมูลไม่ครบถ้วน");
    try {
      await runTransaction(db, async (transaction) => {
        const skuId = `SKU-${Date.now()}`;
        const taskId = `TODO-${skuId}`;
        await consumeAdCreditWithTransaction(transaction, userId, creditCost, skuId, `ฝากโปรโมทสินค้า: ${skuData.productName}`);
        const skuRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads', skuId);
        const skuPayload = { ...skuData, ownerId: userId, status: 'PENDING', cost: creditCost, stats: { views: 0, clicks: 0 }, createdAt: serverTimestamp() };
        transaction.set(skuRef, skuPayload);
        const todoRef = doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId);
        transaction.set(todoRef, { taskId: taskId, taskType: 'USER_SKU_APPROVAL', status: 'PENDING', priority: 'NORMAL', customer: { uid: userId }, skuDetails: skuPayload, createdAt: serverTimestamp(), createdBy: userId });
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  getUserBillboards: async (userId) => {
    try {
      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'billboard_ads');
      const q = query(adsRef, where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      return list;
    } catch (error) {
      return [];
    }
  },

  getUserSkuAds: async (userId) => {
    try {
      const skuRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads');
      const q = query(skuRef, where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      return list;
    } catch (error) {
      return [];
    }
  }

};

export const { 
  getActiveBillboardAds, 
  getActiveAds, 
  requestBillboardAd, 
  requestUserSkuAd,
  trackAdView,
  trackAdClick,
  getUserBillboards,
  getUserSkuAds,
  submitPartnerAd,
  getActivePartnerAds,
  getUserPartnerAds,
  detectPlatform // 🚀 ส่งออกเพื่อให้ ProductAdCard ใช้งานได้
} = marketingService;