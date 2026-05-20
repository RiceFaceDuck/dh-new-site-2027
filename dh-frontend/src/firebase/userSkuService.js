/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

// นำเข้า Service หักเครดิตสุดรัดกุมที่เพิ่งอัปเกรด
import { consumeAdCreditWithTransaction } from './creditService';

// 🔐 ดึงสิทธิ์ App ID เพื่อใช้ชี้ Path ที่ถูกต้อง
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

export const SKU_STATUS = {
  PENDING: 'pending',
  APPROVED: 'active',
  REJECTED: 'rejected',
  PAUSED: 'paused',
  NO_CREDIT: 'paused_no_credit',
  EXPIRED: 'expired'
};

// 🎯 Helper Functions ช่วยชี้ Path ให้ถูกต้อง 100%
const getSkusCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'user_skus');

// 🟢 ส่งออกฟังก์ชันนี้ เพื่อให้ UserSkuFormModal เรียกใช้งานได้ (แก้ Error ทันที)
export const getManagerTodosCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'manager_todos');

// ==========================================
// 🛡️ Helper: ตรวจสอบความถูกต้องของลิงก์ URL
// ==========================================
const isValidUrl = (string) => {
  if (!string) return true; // ยอมให้เป็นค่าว่างได้ (ถ้าไม่ได้บังคับใส่)
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;  
  }
};

export const userSkuService = {
  
  /**
   * 1. ดึงรายการสินค้าโฆษณาของ User คนนั้นๆ
   */
  getUserAds: async (userId) => {
    try {
      const q = query(
        getSkusCollection(),
        where('ownerUid', '==', userId)
      );
      const snapshot = await getDocs(q);
      const ads = [];
      snapshot.forEach(doc => {
        ads.push({ id: doc.id, ...doc.data() });
      });

      // เรียงลำดับจากใหม่สุด ไป เก่าสุด
      return ads.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error("🔥 Error fetching user ads:", error);
      throw error;
    }
  },

  /**
   * 2. สร้างคำขอโฆษณาสินค้าใหม่ (🔥 ระบบ Atomic Transaction 100%)
   * @param {string} userId - ไอดีเจ้าของ
   * @param {object} adData - ข้อมูลโฆษณา (รูป, ชื่อ, landingPageUrl)
   * @param {number} creditCost - ราคาค่าลงโฆษณา (ถ้ามี)
   */
  createAdRequest: async (userId, adData, creditCost = 0) => {
    try {
      // 🛡️ Validate ลิงก์ก่อนให้เสียเงิน
      if (adData.landingPageUrl && !isValidUrl(adData.landingPageUrl)) {
        throw new Error("ลิงก์ Landing Page ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)");
      }

      let newAdId = null;

      // 🔐 ใช้ Transaction: หักแต้ม และ สร้างโฆษณา พร้อมกัน 100%
      await runTransaction(db, async (transaction) => {
        // ขั้นที่ 1: ถ้าโฆษณานี้มีราคา ต้องหักแต้มก่อน
        if (creditCost > 0) {
          const adTitle = adData.productName || adData.name || 'ฝากโฆษณาสินค้า';
          await consumeAdCreditWithTransaction(transaction, userId, creditCost, 'NEW_AD', adTitle);
        }

        // ขั้นที่ 2: สร้าง Document ใหม่
        const newAdRef = doc(getSkusCollection());
        newAdId = newAdRef.id;

        // วางโครงสร้างข้อมูลพร้อมรองรับระบบ Analytics ขั้นสูง
        const payload = {
          ...adData,
          ownerUid: userId,
          status: SKU_STATUS.APPROVED, // ลงโฆษณาหักแต้มแล้ว ให้ Active ทันที
          viewsCount: 0,
          clicksCount: 0,
          spentCredits: creditCost,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        transaction.set(newAdRef, payload);
      });

      return newAdId;
    } catch (error) {
      console.error("🔥 Error creating ad request:", error.message);
      throw error; // โยน Error ไปให้ UI โชว์ (เช่น "เงินไม่พอ" หรือ "ลิงก์ผิด")
    }
  },

  /**
   * 3. อัปเดต/แก้ไข ข้อมูลโฆษณา (CRUD - Update)
   */
  updateAdRequest: async (adId, updateData) => {
    try {
      if (updateData.landingPageUrl && !isValidUrl(updateData.landingPageUrl)) {
        throw new Error("ลิงก์ Landing Page ไม่ถูกต้อง");
      }

      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
      await updateDoc(adRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("🔥 Error updating ad request:", error);
      throw error;
    }
  },

  /**
   * 4. ลบ ข้อมูลโฆษณา (CRUD - Delete)
   */
  deleteAdRequest: async (adId) => {
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
      await deleteDoc(adRef);
      return true;
    } catch (error) {
      console.error("🔥 Error deleting ad request:", error);
      throw error;
    }
  },

  // ==========================================
  // 🌟 Gimmick Features (ฟีเจอร์พรีเมียมเสริมการขาย)
  // ==========================================

  /**
   * 5. สลับสถานะ เปิด/พัก โฆษณาด้วยตัวเอง (Pause/Active)
   */
  toggleAdStatus: async (adId, currentStatus) => {
    try {
      const newStatus = currentStatus === SKU_STATUS.APPROVED ? SKU_STATUS.PAUSED : SKU_STATUS.APPROVED;
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
      await updateDoc(adRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      return newStatus;
    } catch (error) {
      console.error("🔥 Error toggling ad status:", error);
      throw error;
    }
  },

  /**
   * 6. ต่ออายุโฆษณาในคลิกเดียว (หักแต้มแล้วรันต่อเลย)
   */
  renewAdRequest: async (userId, adId, adTitle, renewCost = 50) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. หักแต้ม
        await consumeAdCreditWithTransaction(transaction, userId, renewCost, adId, `ต่ออายุโฆษณา: ${adTitle}`);
        
        // 2. อัปเดตสถานะโฆษณาให้กลับมา Active
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_skus', adId);
        transaction.update(adRef, {
          status: SKU_STATUS.APPROVED,
          spentCredits: increment(renewCost), // สะสมยอดเงินที่ลงทุนไปกับโฆษณานี้
          updatedAt: serverTimestamp()
        });
      });
      return true;
    } catch (error) {
      console.error("🔥 Error renewing ad request:", error.message);
      throw error;
    }
  }

};

export default userSkuService;