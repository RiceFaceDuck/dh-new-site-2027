/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  doc, 
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
// Helper Functions (ลูกเล่นเสริมการทำงาน)
// ==========================================

/**
 * ฟังก์ชันตรวจจับ Platform จาก URL อัตโนมัติ
 * ช่วยให้ระบบรู้ว่าจะต้องแสดง Icon หรือหน้าตา UI แบบไหน
 */
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

/**
 * Fisher-Yates Shuffle (สลับลำดับ Array แบบสุ่ม 100%)
 * เพื่อให้โฆษณาทุกตัวมีโอกาสแสดงผลเท่าเทียมกัน
 */
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};


// ==========================================
// Impression Batching Engine (ระบบประหยัด Database)
// ==========================================
let impressionQueue = {}; // ตัวอย่าง: { 'sku_123': 5, 'sku_456': 2 }
let batchTimer = null;
const BATCH_INTERVAL = 15000; // รวบยอดส่งทุก 15 วินาที

const flushImpressions = async () => {
  if (Object.keys(impressionQueue).length === 0) return;
  
  // ก๊อปปี้คิวปัจจุบัน และรีเซ็ตคิวหลักให้ว่างเพื่อรับรอบใหม่
  const queueToProcess = { ...impressionQueue };
  impressionQueue = {}; 

  try {
    const batch = writeBatch(db);
    let hasOps = false;

    for (const [adId, count] of Object.entries(queueToProcess)) {
      if (count > 0) {
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
        // บันทึกยอด Impression เพิ่มขึ้นตามจำนวนที่สะสมไว้
        batch.update(adRef, {
          'stats.impressions': increment(count)
        });
        hasOps = true;
      }
    }

    if (hasOps) {
      await batch.commit();
      console.log(`👁️ [Marketing Engine] Flushed ${Object.keys(queueToProcess).length} ad impressions successfully.`);
    }
  } catch (error) {
    console.error("❌ Failed to flush impressions:", error);
    // ถ้ายิง DB พัง ให้เอาข้อมูลกลับคืนคิว เพื่อรอส่งรอบหน้า (ไม่ให้ยอดหาย)
    for (const [adId, count] of Object.entries(queueToProcess)) {
      impressionQueue[adId] = (impressionQueue[adId] || 0) + count;
    }
  }
};


// ==========================================
// Marketing & Ad Services
// ==========================================

export const marketingService = {
  
  /**
   * 1. ดึงโฆษณาที่ Active เพื่อนำไปแสดงผลแทรกกับสินค้า (ดึงมาแค่นิดเดียวเพื่อความเร็ว)
   * @returns {Array} Array ของโฆษณาที่สุ่มลำดับมาแล้ว
   */
  fetchActiveAds: async (limitAds = 30) => {
    try {
      const adsQuery = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'user_skus'),
        where('status', '==', 'active'),
        where('isActive', '==', true),
        limit(limitAds) // ดึงมาแค่ 30 ตัวก็พอต่อการแสดงผล 1 หน้า
      );
      
      const querySnapshot = await getDocs(adsQuery);
      const activeAds = [];
      
      querySnapshot.forEach((doc) => {
        activeAds.push({ id: doc.id, ...doc.data() });
      });

      // สับเปลี่ยนลำดับให้กระจายตัว ไม่ซ้ำซาก
      return shuffleArray(activeAds);
      
    } catch (error) {
      console.error("❌ Error fetching active ads:", error);
      return []; // คืนค่าว่างไป หน้าเว็บจะได้ไม่พัง
    }
  },

  /**
   * 2. บันทึกยอดการมองเห็น (Impression) เข้าสู่คิว (ไม่ยิง DB ทันที)
   */
  logImpression: (adId) => {
    if (!adId) return;
    
    // บวกเลขใน Memory
    impressionQueue[adId] = (impressionQueue[adId] || 0) + 1;

    // ตั้งเวลาให้ส่งข้อมูลอัตโนมัติ
    if (!batchTimer) {
      batchTimer = setTimeout(() => {
        flushImpressions();
        batchTimer = null;
      }, BATCH_INTERVAL);
    }
  },

  /**
   * 3. บันทึกยอดการคลิก และ หักเครดิตเจ้าของโฆษณาแบบ Real-time
   * (ต้องใช้ Transaction เพื่อป้องกันลูกค้ากดรัวๆ แล้วพอยต์ติดลบ)
   */
  logClickAndDeductCredit: async (adId, ownerUid, clickCost = 1) => {
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
      // สมมติว่าเก็บเครดิตไว้ที่ Collection credit_wallets (อิงตาม creditService ที่ใช้)
      const walletRef = doc(db, 'artifacts', appId, 'public', 'data', 'credit_wallets', ownerUid);

      await runTransaction(db, async (transaction) => {
        // 1. อ่านกระเป๋าเงินเจ้าของโฆษณา
        const walletDoc = await transaction.get(walletRef);
        
        // ถ้ากระเป๋าไม่มีเงิน หรือไม่พบกระเป๋า ให้ระงับโฆษณา
        if (!walletDoc.exists() || (walletDoc.data().balance || 0) < clickCost) {
           transaction.update(adRef, { 
             isActive: false, 
             status: 'paused_no_credit',
             updatedAt: serverTimestamp()
           });
           throw new Error("Ad disabled: Owner out of credits");
        }

        const currentBalance = walletDoc.data().balance;

        // 2. หักเครดิต
        transaction.update(walletRef, {
          balance: currentBalance - clickCost,
          lastUpdatedAt: serverTimestamp()
        });

        // 3. เพิ่มยอด Click ให้โฆษณา
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

  /**
   * ฟังก์ชันแถม: ดึงข้อมูลแยก Platform
   */
  detectPlatform: detectPlatform

};

export default marketingService;