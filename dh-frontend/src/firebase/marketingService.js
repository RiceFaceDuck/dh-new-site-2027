/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  runTransaction, 
  serverTimestamp,
  writeBatch,
  increment,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';

// 🚀 นำเข้า Transaction Helper สำหรับหักเครดิต
import { consumeAdCreditWithTransaction } from './creditService';

// 🔐 ดึงสิทธิ์ App ID
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

// ==========================================
// Helper Functions
// ==========================================

export const detectPlatform = (url) => {
  if (!url) return 'other';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('shopee.')) return 'shopee';
  if (lowerUrl.includes('lazada.')) return 'lazada';
  if (lowerUrl.includes('tiktok.')) return 'tiktok';
  if (lowerUrl.includes('facebook.')) return 'facebook';
  if (lowerUrl.includes('thisshop.')) return 'thisshop';
  if (lowerUrl.includes('line.')) return 'lineshopping';
  if (lowerUrl.includes('youtube.')) return 'youtube';
  return 'other';
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// 📥 ฟังก์ชันดึงเรทราคาจากหลังบ้าน
const getMarketingSettings = async () => {
  try {
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'marketing_rates');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        costPerView: Number(data.costPerView) || 1, 
        costPerClick: Number(data.costPerClick) || 5,
      };
    }
  } catch (error) {
    console.error("🔥 Error fetching ad settings:", error);
  }
  return { costPerView: 1, costPerClick: 5 };
};

// ==========================================
// Impression Batching Engine
// ==========================================
let impressionQueue = {}; 
let batchTimer = null;
const BATCH_INTERVAL = 15000; 

const flushImpressions = async () => {
  if (Object.keys(impressionQueue).length === 0) return;
  
  const queueToProcess = { ...impressionQueue };
  impressionQueue = {}; 

  try {
    const settings = await getMarketingSettings();
    const batch = writeBatch(db);
    let hasOps = false;

    for (const [adId, data] of Object.entries(queueToProcess)) {
      if (data.count > 0) {
        // แก้ไข Path: อ้างอิงตาราง user_skus ที่เราใช้งานจริง
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
        
        // 1. อัปเดตสถิติ View
        batch.update(adRef, {
          'viewsCount': increment(data.count)
        });

        // 2. หักเงินในกระเป๋า (Wallet)
        if (data.ownerUid && settings.costPerView > 0) {
          const totalDeduction = data.count * settings.costPerView;
          // แก้ไข Path: วิ่งไปหักเงินที่กระเป๋า Wallet จริงๆ ของ User
          const walletRef = doc(db, 'artifacts', appId, 'users', data.ownerUid, 'wallet', 'default');
          batch.update(walletRef, {
            balance: increment(-totalDeduction),
            updatedAt: serverTimestamp()
          });
        }
        hasOps = true;
      }
    }

    if (hasOps) {
      await batch.commit();
      console.log(`👁️ [Marketing Engine] Flushed ${Object.keys(queueToProcess).length} ad impressions.`);
    }
  } catch (error) {
    console.error("❌ Failed to flush impressions:", error);
    // Rollback คิว
    for (const [adId, data] of Object.entries(queueToProcess)) {
      if (!impressionQueue[adId]) impressionQueue[adId] = { count: 0, ownerUid: data.ownerUid };
      impressionQueue[adId].count += data.count;
    }
  }
};

// ==========================================
// Marketing & Ad Services
// ==========================================

export const marketingService = {
  
  fetchActiveAds: async (limitAds = 30) => {
    try {
      const adsQuery = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'user_skus'),
        where('status', '==', 'active'),
        where('isActive', '==', true),
        limit(limitAds) 
      );
      const querySnapshot = await getDocs(adsQuery);
      const activeAds = [];
      querySnapshot.forEach((doc) => {
        activeAds.push({ id: doc.id, ...doc.data() });
      });
      return shuffleArray(activeAds);
    } catch (error) {
      console.error("❌ Error fetching active ads:", error);
      return []; 
    }
  },

  logImpression: (adId, ownerUid) => {
    if (!adId || !ownerUid) return;
    
    if (!impressionQueue[adId]) {
      impressionQueue[adId] = { count: 0, ownerUid: ownerUid };
    }
    impressionQueue[adId].count += 1;

    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        flushImpressions();
        batchTimer = null;
      }, BATCH_INTERVAL);
    }
  },

  logClickAndDeductCredit: async (adId, ownerUid, adTitle = "Ad Click") => {
    try {
      const settings = await getMarketingSettings();
      const clickCost = settings.costPerClick;

      await runTransaction(db, async (transaction) => {
        // 1. หักเครดิตแบบ Atomic
        await consumeAdCreditWithTransaction(transaction, ownerUid, clickCost, adId, `คลิกโฆษณา: ${adTitle}`);

        // 2. อัปเดตสถิติ Click
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
        transaction.update(adRef, {
          'clicksCount': increment(1),
          'updatedAt': serverTimestamp()
        });
      });

      return { success: true };
    } catch (error) {
      console.log("⚠️ Click Log Notice:", error.message);
      return { success: false };
    }
  },

  detectPlatform: detectPlatform
};

export default marketingService;