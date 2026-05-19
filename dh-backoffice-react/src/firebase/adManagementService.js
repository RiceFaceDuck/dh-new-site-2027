/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc,
  serverTimestamp,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

// 🔐 ดึงสิทธิ์การเข้าถึงรหัส Sandbox App ID ที่ถูกต้อง (ยึดตามโครงสร้างความปลอดภัย)
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

// 🚀 ฟังก์ชันช่วยเหลือสำหรับเรียก Collection ให้ตรงกับ Master Plan (v2.3)
const getAdsCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'user_skus');
const getTodosCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'manager_todos');

export const adManagementService = {

  /**
   * 1. ดึงข้อมูลโฆษณาตามสถานะ (ค่าเริ่มต้นคือ pending - รอตรวจสอบ)
   */
  getAdsByStatus: async (status = 'pending') => {
    try {
      // 💡 ประหยัด Indexing ด้วยการ Query แค่ Status แล้วค่อยมา Sort ด้วย JavaScript Memory
      const q = query(getAdsCollection(), where('status', '==', status));
      const querySnapshot = await getDocs(q);
      const adsList = [];
      
      querySnapshot.forEach((doc) => {
        adsList.push({ id: doc.id, ...doc.data() });
      });

      // เรียงลำดับจากใหม่สุด ไป เก่าสุด
      adsList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt).getTime() || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt).getTime() || 0);
        return timeB - timeA; 
      });

      return adsList;
    } catch (error) {
      console.error(`❌ Error fetching ads with status [${status}]:`, error);
      throw new Error('ไม่สามารถดึงข้อมูลคำขอโฆษณาได้ในขณะนี้');
    }
  },

  /**
   * 2. อนุมัติโฆษณา (Approve) & ปิดงาน To-do อัตโนมัติด้วย Batch Write
   * การใช้ Batch ทำให้มั่นใจว่า โฆษณาเปิด + งานถูกเคลียร์ พร้อมกัน 100%
   */
  approveAd: async (adId, targetSkuId) => {
    try {
      const batch = writeBatch(db);
      const adRef = doc(getAdsCollection(), adId);
      
      // 2.1 อัปเดตสถานะโฆษณาเป็นพร้อมใช้งาน
      batch.update(adRef, {
        status: 'active',
        isActive: true, // เผื่อกรณี User ปิดสวิตช์ไว้ ให้บังคับเปิดหลังอนุมัติทันที
        updatedAt: serverTimestamp()
      });

      // 2.2 ค้นหา To-do ของผู้จัดการที่เกี่ยวข้อง เพื่อปิดงาน (Auto-sync)
      if (targetSkuId) {
        const q = query(getTodosCollection(), where('targetSkuId', '==', targetSkuId), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        snapshot.forEach((todoDoc) => {
          batch.update(todoDoc.ref, { 
            status: 'resolved', 
            resolution: 'approved',
            updatedAt: serverTimestamp() 
          });
        });
      }

      await batch.commit(); // สั่งรันทุกคำสั่งพร้อมกัน
      return { success: true, message: '✅ อนุมัติโฆษณาสำเร็จ โฆษณาพร้อมแสดงผลทันที' };
    } catch (error) {
      console.error("❌ Error approving ad:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติโฆษณา' };
    }
  },

  /**
   * 3. ปฏิเสธโฆษณา (Reject) & ระบุเหตุผลให้ User ทราบ
   */
  rejectAd: async (adId, targetSkuId, reason = 'ผิดเงื่อนไขการให้บริการของ DH Notebook') => {
    try {
      const batch = writeBatch(db);
      const adRef = doc(getAdsCollection(), adId);
      
      // 3.1 อัปเดตสถานะเป็นถูกปฏิเสธ พร้อมแนบเหตุผล
      batch.update(adRef, {
        status: 'rejected',
        isActive: false,
        rejectReason: reason,
        updatedAt: serverTimestamp()
      });

      // 3.2 ปิดงานใน To-do ของผู้จัดการเช่นกัน
      if (targetSkuId) {
        const q = query(getTodosCollection(), where('targetSkuId', '==', targetSkuId), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        snapshot.forEach((todoDoc) => {
          batch.update(todoDoc.ref, { 
            status: 'resolved', 
            resolution: 'rejected', 
            updatedAt: serverTimestamp() 
          });
        });
      }

      await batch.commit();
      return { success: true, message: `🛑 ปฏิเสธคำขอโฆษณาเรียบร้อยแล้ว` };
    } catch (error) {
      console.error("❌ Failed [rejectAd]:", error);
      return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ' };
    }
  },

  /**
   * 4. สั่งระงับการแสดงผลฉุกเฉิน (โดยผู้จัดการ)
   * ใช้ในกรณีที่โฆษณาผ่านการอนุมัติไปแล้ว แต่พบปัญหาภายหลัง
   */
  pauseAd: async (adId) => {
    try {
      const adRef = doc(getAdsCollection(), adId);
      await updateDoc(adRef, {
        status: 'paused',
        isActive: false, // ปิดสวิตช์การแสดงผล
        pauseReason: 'ถูกระงับโดยผู้ดูแลระบบ',
        updatedAt: serverTimestamp()
      });
      return { success: true, message: 'ระงับการแสดงผลโฆษณานี้ชั่วคราวสำเร็จ' };
    } catch (error) {
      console.error("❌ Error pausing ad:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการระงับโฆษณา' };
    }
  },

  /**
   * 5. [NEW] ฟังก์ชันสำหรับ Dashboard: นับจำนวนคำขอที่รออนุมัติ
   */
  getPendingCount: async () => {
    try {
      const q = query(getAdsCollection(), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.size; // คืนค่าตัวเลขจำนวนคำขอไปแสดงบน Widget
    } catch (error) {
      console.error("❌ Error getting pending count:", error);
      return 0;
    }
  }
};

export default adManagementService;