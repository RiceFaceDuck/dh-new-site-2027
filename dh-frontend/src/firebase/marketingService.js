/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  runTransaction, 
  serverTimestamp,
  writeBatch,
  increment,
  limit
} from 'firebase/firestore';

// 🔐 ดึงสิทธิ์ App ID
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

// ==========================================
// Helper Functions
// ==========================================

const detectPlatform = (url) => {
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

// 📥 ฟังก์ชันดึงเรทราคาจากหลังบ้าน (Marketing Settings)
const getMarketingSettings = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'marketing'));
    if (snap.exists()) {
      return {
        costPerView: Number(snap.data().costPerView) || 1, // Default: 1 View = 1 Credit
        costPerClick: Number(snap.data().costPerClick) || 5, // Default: 1 Click = 5 Credits
      };
    }
  } catch (error) {
    console.error("🔥 Error fetching ad settings:", error);
  }
  return { costPerView: 1, costPerClick: 5 }; // Fallback ป้องกันระบบพัง
};


// ==========================================
// Impression Batching Engine (ระบบประหยัด Database อัจฉริยะ)
// ==========================================
let impressionQueue = {}; // ตัวอย่าง: { 'sku_123': { count: 5, ownerUid: 'user_001' } }
let batchTimer = null;
const BATCH_INTERVAL = 15000; // รวบยอดส่งและหักเงินทุก 15 วินาที

const flushImpressions = async () => {
  if (Object.keys(impressionQueue).length === 0) return;
  
  // 1. ก๊อปปี้คิวปัจจุบัน และรีเซ็ตคิวหลักให้ว่างเพื่อรับรอบใหม่
  const queueToProcess = { ...impressionQueue };
  impressionQueue = {}; 

  try {
    // 2. ดึงเรทโฆษณาปัจจุบัน (ค่า Credit / View)
    const settings = await getMarketingSettings();
    const batch = writeBatch(db);
    let hasOps = false;

    // 3. วนลูปบวกยอด View และ หักเงินตามเรท
    for (const [adId, data] of Object.entries(queueToProcess)) {
      if (data.count > 0) {
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
        
        // ก. บันทึกยอด Impression ของโฆษณา
        batch.update(adRef, {
          'stats.impressions': increment(data.count)
        });

        // ข. หักยอดเครดิตจากกระเป๋าเงินเจ้าของ (ตามเรท costPerView * จำนวนที่มองเห็น)
        if (data.ownerUid && settings.costPerView > 0) {
          const totalDeduction = data.count * settings.costPerView;
          const walletRef = doc(db, 'artifacts', appId, 'public', 'data', 'credit_wallets', data.ownerUid);
          batch.update(walletRef, {
            balance: increment(-totalDeduction),
            lastUpdatedAt: serverTimestamp()
          });
        }
        
        hasOps = true;
      }
    }

    if (hasOps) {
      await batch.commit();
      console.log(`👁️ [Marketing Engine] Flushed ${Object.keys(queueToProcess).length} ad impressions successfully.`);
    }
  } catch (error) {
    console.error("❌ Failed to flush impressions:", error);
    // ถ้ายิง DB พัง ให้เอาข้อมูลกลับคืนคิว เพื่อรอส่งรอบหน้า (รักษาผลประโยชน์บริษัท)
    for (const [adId, data] of Object.entries(queueToProcess)) {
      if (!impressionQueue[adId]) {
        impressionQueue[adId] = { count: 0, ownerUid: data.ownerUid };
      }
      impressionQueue[adId].count += data.count;
    }
  }
};


// ==========================================
// Marketing & Ad Services
// ==========================================

export const marketingService = {
  
  /**
   * 1. ดึงโฆษณาที่ Active เพื่อนำไปแทรกกับสินค้า
   */
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

  /**
   * 2. บันทึกยอดการมองเห็น (Impression) เข้าสู่คิว (รับ ownerUid เพื่อนำไปหักเงิน)
   */
  logImpression: (adId, ownerUid) => {
    if (!adId || !ownerUid) return;
    
    // บวกเลขใน Memory Queue
    if (!impressionQueue[adId]) {
      impressionQueue[adId] = { count: 0, ownerUid: ownerUid };
    }
    impressionQueue[adId].count += 1;

    // ตั้งเวลาให้ส่งข้อมูลอัตโนมัติ
    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        flushImpressions();
        batchTimer = null;
      }, BATCH_INTERVAL);
    }
  },

  /**
   * 3. บันทึกยอดการคลิก และ หักเครดิตเจ้าของโฆษณาแบบ Real-time (Dynamic Rate)
   */
  logClickAndDeductCredit: async (adId, ownerUid) => {
    try {
      // 1. ดึงเรทการคลิกจาก Settings ก่อน
      const settings = await getMarketingSettings();
      const clickCost = settings.costPerClick; // Dynamic Click Cost (e.g., 5)

      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
      const walletRef = doc(db, 'artifacts', appId, 'public', 'data', 'credit_wallets', ownerUid);

      await runTransaction(db, async (transaction) => {
        // 2. อ่านกระเป๋าเงิน
        const walletDoc = await transaction.get(walletRef);
        
        // 3. ถ้ากระเป๋าไม่มีเงิน หรือเครดิตน้อยกว่าค่าคลิก ให้ระงับโฆษณาทันที
        if (!walletDoc.exists() || (walletDoc.data().balance || 0) < clickCost) {
           transaction.update(adRef, { 
             isActive: false, 
             status: 'paused_no_credit',
             updatedAt: serverTimestamp()
           });
           throw new Error("Ad disabled: Owner out of credits");
        }

        const currentBalance = walletDoc.data().balance;

        // 4. หักเครดิตการคลิก
        transaction.update(walletRef, {
          balance: currentBalance - clickCost,
          lastUpdatedAt: serverTimestamp()
        });

        // 5. เพิ่มยอด Click ให้โฆษณา
        transaction.update(adRef, {
          'stats.clicks': increment(1)
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