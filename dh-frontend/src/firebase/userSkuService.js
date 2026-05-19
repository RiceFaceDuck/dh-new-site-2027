/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

// 🔐 ดึงสิทธิ์ App ID เพื่อใช้ชี้ Path ที่ถูกต้อง
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

export const SKU_STATUS = {
  PENDING: 'pending',
  APPROVED: 'active',
  REJECTED: 'rejected',
  PAUSED: 'paused',
  NO_CREDIT: 'paused_no_credit'
};

// 🎯 Helper Functions ช่วยชี้ Path ให้ถูกต้อง 100%
const getSkusCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'user_skus');

// 🟢 ส่งออกฟังก์ชันนี้ เพื่อให้ UserSkuFormModal เรียกใช้งานได้ (แก้ Error ทันที)
export const getManagerTodosCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'manager_todos');

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
   * 2. สร้างคำขอโฆษณาสินค้าใหม่
   */
  createAdRequest: async (userId, adData) => {
    try {
      const docRef = await addDoc(getSkusCollection(), {
        ...adData,
        ownerUid: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("🔥 Error creating ad request:", error);
      throw error;
    }
  },

  /**
   * 3. อัปเดต/แก้ไข ข้อมูลโฆษณา (CRUD - Update)
   */
  updateAdRequest: async (adId, updateData) => {
    try {
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
  }

};

export default userSkuService;