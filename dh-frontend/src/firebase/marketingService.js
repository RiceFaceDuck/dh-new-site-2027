import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';

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
  return 'other';
};

// ==========================================
// Marketing & Ad Services
// ==========================================

export const marketingService = {
  
  // ... (หากมี Service การตลาดอื่นๆ ในอนาคตสามารถนำมาต่อตรงนี้ได้ ห้ามลบโครงสร้างนี้) ...

  /**
   * 1. ส่งคำขอลงโฆษณา (Atomic Transaction)
   * @param {Object} adData - ข้อมูลโฆษณา (title, description, imageUrl, youtubeUrl, targetUrl)
   * @param {String} userId - ID ของผู้ใช้งานที่ส่งคำขอ
   * @param {Number} adCost - ราคาเครดิตที่ต้องจ่ายต่อ 1 โฆษณา (ดึงจาก Global Settings)
   * @returns {Object} { success: boolean, message/error: string, adId?: string }
   */
  submitAdRequest: async (adData, userId, adCost) => {
    try {
      const userRef = doc(db, 'users', userId);
      const newAdRef = doc(collection(db, 'sponsored_ads')); // สร้าง Reference และ ID รอไว้เลย

      // เริ่มทำ Transaction (ต้องทำสำเร็จทั้งหมด หรือยกเลิกทั้งหมด)
      await runTransaction(db, async (transaction) => {
        // 1. อ่านข้อมูล User ล่าสุดจาก Database ป้องกันการโกงหรือยอดไม่ตรง
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error("ระบบไม่พบข้อมูลผู้ใช้งานของคุณ");
        }

        const currentCredit = userDoc.data().creditPoint || 0;

        // 2. ตรวจสอบเงื่อนไข
        if (currentCredit < adCost) {
          throw new Error("Credit Point ของคุณไม่เพียงพอสำหรับการลงโฆษณา");
        }

        // 3. หักแต้ม Credit
        transaction.update(userRef, {
          creditPoint: currentCredit - adCost,
          updatedAt: serverTimestamp()
        });

        // 4. บันทึกคำขอโฆษณาลง Database
        const platform = detectPlatform(adData.targetUrl);
        transaction.set(newAdRef, {
          ...adData,
          userId: userId,
          platform: platform,
          status: 'pending', // รอผู้จัดการอนุมัติผ่าน To-do
          clicks: 0,         // Database เตรียมพร้อมสำหรับเก็บสถิติ
          impressions: 0,    // Database เตรียมพร้อมสำหรับเก็บสถิติ
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      return { 
        success: true, 
        message: 'ส่งคำขอสำเร็จ! ระบบได้หัก Credit ของคุณแล้ว กรุณารอผู้จัดการอนุมัติ',
        adId: newAdRef.id 
      };

    } catch (error) {
      console.error("❌ Transaction Failed [submitAdRequest]:", error);
      return { 
        success: false, 
        error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง' 
      };
    }
  },

  /**
   * 2. ดึงโฆษณาที่ Active เพื่อนำไปแสดงผลแทรกกับสินค้า
   * @returns {Array} Array ของโฆษณาที่สุ่มลำดับมาแล้ว (Shuffle)
   */
  fetchActiveAds: async () => {
    try {
      // ดึงเฉพาะโฆษณาที่อนุมัติแล้ว
      const adsQuery = query(
        collection(db, 'sponsored_ads'),
        where('status', '==', 'active'),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(adsQuery);
      const activeAds = [];
      
      querySnapshot.forEach((doc) => {
        activeAds.push({ id: doc.id, ...doc.data() });
      });

      // ลูกเล่นเสริม: สับเปลี่ยนลำดับ (Fisher-Yates Shuffle) แบบง่าย
      // เพื่อให้โฆษณาแต่ละตัวมีโอกาสแสดงผลเป็นอันดับแรกเท่าๆ กัน ไม่กระจุกตัว
      const shuffledAds = activeAds.sort(() => 0.5 - Math.random());

      return shuffledAds;
    } catch (error) {
      console.error("❌ Error fetching active ads:", error);
      throw error;
    }
  }

};

export default marketingService;