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
  increment,
  writeBatch
} from 'firebase/firestore';

const AD_COLLECTION = 'user_skus';
const USERS_COLLECTION = 'users'; 
const SETTINGS_COLLECTION = 'system_settings';
const AD_SETTINGS_DOC = 'ad_configuration';

export const AD_STATUS = {
  PENDING: 'pending',   
  APPROVED: 'approved', 
  REJECTED: 'rejected', 
};

export const adManagementService = {
  
  getPendingAds: async () => {
    try {
      // 🚀 ปลดล็อก orderBy
      const q = query(
        collection(db, AD_COLLECTION),
        where("status", "==", AD_STATUS.PENDING)
      );
      const querySnapshot = await getDocs(q);
      const ads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 🚀 เรียงลำดับด้วย JavaScript (ล่าสุดขึ้นก่อน)
      return ads.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    } catch (error) {
      console.error("❌ [adManagementService] Error fetching pending ads:", error);
      throw new Error("ไม่สามารถโหลดรายการโฆษณาที่รอตรวจสอบได้");
    }
  },

  getAdsByStatus: async (status) => {
    try {
      // 🚀 ปลดล็อก orderBy
      const q = query(
        collection(db, AD_COLLECTION),
        where("status", "==", status)
      );
      const querySnapshot = await getDocs(q);
      const ads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // 🚀 เรียงลำดับด้วย JavaScript
      return ads.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
    } catch (error) {
      console.error(`❌ [adManagementService] Error fetching ads by status ${status}:`, error);
      throw new Error("เกิดข้อผิดพลาดในการโหลดประวัติโฆษณา");
    }
  },

  approveAd: async (adId, managerId) => {
    try {
      const adRef = doc(db, AD_COLLECTION, adId);
      await updateDoc(adRef, {
        status: AD_STATUS.APPROVED,
        approvedBy: managerId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("❌ [adManagementService] Error approving ad:", error);
      throw new Error("ไม่สามารถบันทึกการอนุมัติได้");
    }
  },

  rejectAdAndRefund: async (adId, userId, refundAmount, managerId, reason = "") => {
    try {
      const batch = writeBatch(db);

      const adRef = doc(db, AD_COLLECTION, adId);
      batch.update(adRef, {
        status: AD_STATUS.REJECTED,
        rejectReason: reason,
        rejectedBy: managerId,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (userId && refundAmount > 0) {
        const userRef = doc(db, USERS_COLLECTION, userId);
        batch.update(userRef, {
          creditPoints: increment(refundAmount) 
        });
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error("❌ [adManagementService] Error rejecting ad and refunding:", error);
      throw new Error("การทำรายการปฏิเสธและคืนเครดิตล้มเหลว โปรดตรวจสอบระบบ");
    }
  },

  getAdSettings: async () => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, AD_SETTINGS_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return {
          displayRatio: 10,       
          creditCostPerDisplay: 1, 
          isActive: true
        };
      }
    } catch (error) {
      console.error("❌ [adManagementService] Error fetching ad settings:", error);
      throw new Error("ไม่สามารถโหลดข้อมูลการตั้งค่าโฆษณาได้");
    }
  },

  saveAdSettings: async (newSettings, managerId) => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, AD_SETTINGS_DOC);
      await setDoc(docRef, {
        ...newSettings,
        updatedBy: managerId,
        updatedAt: serverTimestamp()
      }, { merge: true }); 
      return true;
    } catch (error) {
      console.error("❌ [adManagementService] Error saving ad settings:", error);
      throw new Error("บันทึกการตั้งค่าล้มเหลว");
    }
  }
};