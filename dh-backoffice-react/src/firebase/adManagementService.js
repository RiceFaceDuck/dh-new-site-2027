/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  getDoc,
  setDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

const AD_COLLECTION = 'user_skus';
const SETTINGS_COLLECTION = 'system_settings';
const AD_SETTINGS_DOC = 'ad_configuration';

// 📌 สถานะของ User SKU (ซิงค์ให้ตรงกับ Frontend และ Backend UI)
export const AD_STATUS = {
  PENDING: 'PENDING',     // รอตรวจสอบ
  APPROVED: 'APPROVED',   // อนุมัติแล้ว
  REJECTED: 'REJECTED',   // ไม่อนุมัติ
  INACTIVE: 'INACTIVE'    // ปิดการใช้งานชั่วคราว
};

export const adManagementService = {
  
  // 🚀 1. โหลดรายการโฆษณาทั้งหมด (ดึงครั้งเดียว ประหยัด Reads แล้วไป Filter ฝั่ง Client เอา)
  getAllAds: async () => {
    try {
      const q = query(collection(db, AD_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("❌ [adManagementService] Error fetching all ads:", error);
      throw new Error("ไม่สามารถโหลดรายการโฆษณาทั้งหมดได้");
    }
  },

  // 🚀 2. โหลดเฉพาะรายการที่รอตรวจสอบ
  getPendingAds: async () => {
    try {
      // เลี่ยงปัญหา Index ด้วยการ Query where ก่อน แล้วค่อย Sort ด้วย JavaScript
      const q = query(
        collection(db, AD_COLLECTION),
        where("status", "==", AD_STATUS.PENDING)
      );
      const querySnapshot = await getDocs(q);
      const ads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // เรียงลำดับล่าสุดขึ้นก่อน
      return ads.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    } catch (error) {
      console.error("❌ [adManagementService] Error fetching pending ads:", error);
      throw new Error("ไม่สามารถโหลดรายการโฆษณาที่รอตรวจสอบได้");
    }
  },

  // 🚀 3. โหลดแยกตามสถานะอื่นๆ
  getAdsByStatus: async (status) => {
    try {
      const q = query(
        collection(db, AD_COLLECTION),
        where("status", "==", status)
      );
      const querySnapshot = await getDocs(q);
      const ads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return ads.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    } catch (error) {
      console.error(`❌ [adManagementService] Error fetching ads by status ${status}:`, error);
      throw new Error("เกิดข้อผิดพลาดในการโหลดประวัติโฆษณา");
    }
  },

  // 🚀 4. อนุมัติโฆษณา
  approveAd: async (adId, managerId) => {
    try {
      const adRef = doc(db, AD_COLLECTION, adId);
      await updateDoc(adRef, {
        status: AD_STATUS.APPROVED,
        approvedBy: managerId || 'System',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("❌ [adManagementService] Error approving ad:", error);
      throw new Error("ไม่สามารถบันทึกการอนุมัติได้");
    }
  },

  // 🚀 5. ไม่อนุมัติโฆษณา (ตัดระบบ Refund ออก เนื่องจากสร้างโฆษณาได้ฟรีตามเงื่อนไขใหม่)
  rejectAd: async (adId, managerId, reason = "ผิดเงื่อนไขข้อตกลงการลงโฆษณา") => {
    try {
      const adRef = doc(db, AD_COLLECTION, adId);
      await updateDoc(adRef, {
        status: AD_STATUS.REJECTED,
        rejectReason: reason,
        rejectedBy: managerId || 'System',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("❌ [adManagementService] Error rejecting ad:", error);
      throw new Error("การทำรายการปฏิเสธโฆษณาล้มเหลว โปรดตรวจสอบระบบอีกครั้ง");
    }
  },

  // 🚀 6. ดึงข้อมูลตั้งค่าระบบโฆษณา (Ad Configurations)
  getAdSettings: async () => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, AD_SETTINGS_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // ค่า Configuration เริ่มต้น กรณีระบบใหม่เอี่ยม
        return {
          displayRatio: 10,           // แทรกโฆษณา 1 ชิ้น ทุกๆ สินค้าทั่วไป 10 ชิ้น
          creditCostPerClick: 1,      // ค่าธรรมเนียม เครดิต/การคลิก
          creditCostPerImpression: 0, // ค่าธรรมเนียม เครดิต/การมองเห็น (อาจจะฟรี ปล่อย 0 ไว้ก่อน)
          isActive: true
        };
      }
    } catch (error) {
      console.error("❌ [adManagementService] Error fetching ad settings:", error);
      throw new Error("ไม่สามารถโหลดข้อมูลการตั้งค่าโฆษณาได้");
    }
  },

  // 🚀 7. บันทึกข้อมูลตั้งค่าระบบโฆษณา
  saveAdSettings: async (newSettings, managerId) => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, AD_SETTINGS_DOC);
      await setDoc(docRef, {
        ...newSettings,
        updatedBy: managerId || 'Admin',
        updatedAt: serverTimestamp()
      }, { merge: true }); 
      return true;
    } catch (error) {
      console.error("❌ [adManagementService] Error saving ad settings:", error);
      throw new Error("บันทึกการตั้งค่าระบบโฆษณาล้มเหลว");
    }
  }
};