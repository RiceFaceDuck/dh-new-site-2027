import { db } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

const COLLECTION_NAME = 'user_skus';

// ----------------------------------------------------------------------
// 🏷️ ค่าคงที่สำหรับสถานะต่างๆ (Constants)
// ----------------------------------------------------------------------
export const SKU_STATUS = {
  INACTIVE: 'inactive', // สร้างไว้เฉยๆ ยังไม่หักเครดิต/ยังไม่ส่งให้ ผจก.
  PENDING: 'pending',   // หักเครดิตแล้ว รอผู้จัดการอนุมัติ
  APPROVED: 'approved', // อนุมัติแล้ว (แสดงบนเว็บได้)
  REJECTED: 'rejected', // ไม่อนุมัติ
};

// ----------------------------------------------------------------------
// 🧠 Smart Caching System
// ----------------------------------------------------------------------
const approvedAdsCache = {
  data: [],
  lastFetched: null,
  ttl: 5 * 60 * 1000, // 5 นาที
};

// ----------------------------------------------------------------------
// 🚀 Main Service Object
// ----------------------------------------------------------------------
export const userSkuService = {
  
  createAdRequest: async (userId, adData) => {
    try {
      const payload = {
        userId,
        ...adData,
        status: adData.status || SKU_STATUS.INACTIVE, 
        clicks: 0, 
        views: 0,  
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      return docRef.id;
    } catch (error) {
      console.error("❌ [userSkuService] Error creating ad request:", error);
      throw new Error("ไม่สามารถสร้างรายการฝากโฆษณาได้ โปรดลองใหม่อีกครั้ง");
    }
  },

  getUserAds: async (userId) => {
    try {
      // 🚀 ปลดล็อก orderBy ออกเพื่อแก้ปัญหา Firebase Missing Index
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const ads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 🚀 นำข้อมูลมาเรียงลำดับด้วย JavaScript แทน
      return ads.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    } catch (error) {
      console.error("❌ [userSkuService] Error fetching user ads:", error);
      throw new Error("เกิดข้อผิดพลาดในการดึงข้อมูลโฆษณาของคุณ");
    }
  },

  getApprovedAdsForDisplay: async (forceRefresh = false, maxLimit = 50) => {
    const now = Date.now();
    if (!forceRefresh && approvedAdsCache.lastFetched && (now - approvedAdsCache.lastFetched < approvedAdsCache.ttl)) {
      return approvedAdsCache.data;
    }

    try {
      // 🚀 ปลดล็อก orderBy
      const q = query(
        collection(db, COLLECTION_NAME),
        where("status", "==", SKU_STATUS.APPROVED)
      );

      const querySnapshot = await getDocs(q);
      let ads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🚀 นำข้อมูลมาเรียงลำดับและตัดจำนวน limit ด้วย JavaScript แทน
      ads = ads.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).slice(0, maxLimit);

      approvedAdsCache.data = ads;
      approvedAdsCache.lastFetched = now;

      return ads;
    } catch (error) {
      console.error("❌ [userSkuService] Error fetching approved ads:", error);
      if (approvedAdsCache.data.length > 0) return approvedAdsCache.data;
      return [];
    }
  },

  deleteUserAd: async (adId) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, adId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("❌ [userSkuService] Error deleting ad:", error);
      throw new Error("ไม่สามารถลบรายการได้ โปรดลองใหม่อีกครั้ง");
    }
  }
};