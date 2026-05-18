import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc,
  runTransaction,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

// ดึงสิทธิ์การเข้าถึงรหัส Sandbox App ID ที่ถูกต้อง
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

export const adManagementService = {

  /**
   * 1. ดึงข้อมูลโฆษณาตามสถานะ 
   */
  getAdsByStatus: async (status = 'pending') => {
    try {
      const adsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads');
      const querySnapshot = await getDocs(adsCollectionRef);
      const adsList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === status) {
          adsList.push({ id: doc.id, ...data });
        }
      });

      adsList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt).getTime() || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt).getTime() || 0);
        return timeA - timeB;
      });

      return adsList;
    } catch (error) {
      console.error(`❌ Error fetching ads with status [${status}]:`, error);
      throw new Error('ไม่สามารถดึงข้อมูลคำขอโฆษณาได้ในขณะนี้');
    }
  },

  /**
   * 2. อนุมัติโฆษณา (Approve) & ปิดงาน To-do อัตโนมัติ
   */
  approveAd: async (adId) => {
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads', adId);
      await updateDoc(adRef, {
        status: 'active',
        updatedAt: serverTimestamp()
      });

      // 🔗 ระบบ Auto-Sync: ไปค้นหาการ์ด To-do ที่ผูกกับโฆษณานี้ แล้วปรับสถานะให้เป็น completed ทันที
      const todosRef = collection(db, 'artifacts', appId, 'public', 'data', 'todos');
      const q = query(todosRef, where('adId', '==', adId));
      const snapshot = await getDocs(q);
      snapshot.forEach((todoDoc) => {
        updateDoc(todoDoc.ref, { status: 'completed', updatedAt: serverTimestamp() });
      });

      return { success: true, message: 'อนุมัติโฆษณาสำเร็จ โฆษณาจะเริ่มแสดงผลทันที' };
    } catch (error) {
      console.error("❌ Error approving ad:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติโฆษณา' };
    }
  },

  /**
   * 3. ปฏิเสธโฆษณา คืนแต้ม และยกเลิกงาน To-do (Safe Refund Transaction)
   */
  rejectAd: async (adId, userId, refundAmount, reason = 'ผิดเงื่อนไขการให้บริการ') => {
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads', adId);
      const userRef = doc(db, 'artifacts', appId, 'users', userId);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error("ไม่พบข้อมูลบัญชีผู้ใช้เพื่อทำการคืนแต้มเครดิต");
        }

        const currentCredit = Number(userDoc.data().creditPoint) || 0;

        transaction.update(userRef, {
          creditPoint: currentCredit + refundAmount,
          updatedAt: serverTimestamp()
        });

        transaction.update(adRef, {
          status: 'rejected',
          rejectReason: reason,
          updatedAt: serverTimestamp()
        });
      });

      // 🔗 ระบบ Auto-Sync: ปรับสถานะ To-do ให้เป็น cancelled เพื่องานจะได้ออกจากหน้ากระดานผู้จัดการ
      const todosRef = collection(db, 'artifacts', appId, 'public', 'data', 'todos');
      const q = query(todosRef, where('adId', '==', adId));
      const snapshot = await getDocs(q);
      snapshot.forEach((todoDoc) => {
        updateDoc(todoDoc.ref, { status: 'cancelled', updatedAt: serverTimestamp() });
      });

      return { 
        success: true, 
        message: `ปฏิเสธคำขอและคืนแต้มจำนวน ${refundAmount} เครดิต เรียบร้อยแล้ว` 
      };

    } catch (error) {
      console.error("❌ Transaction Failed [rejectAd]:", error);
      return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการปฏิเสธและคืนแต้ม' };
    }
  },

  pauseAd: async (adId) => {
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads', adId);
      await updateDoc(adRef, {
        status: 'paused',
        updatedAt: serverTimestamp()
      });
      return { success: true, message: 'ระงับการแสดงผลชั่วคราวสำเร็จ' };
    } catch (error) {
      console.error("❌ Error pausing ad:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการระงับโฆษณา' };
    }
  }

};

export default adManagementService;