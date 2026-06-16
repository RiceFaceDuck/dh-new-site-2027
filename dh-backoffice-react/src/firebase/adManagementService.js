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

// 🚀 ฟังก์ชันช่วยเหลือสำหรับเรียก Collection
// ตอนนี้ใช้ todos ที่ root level เพื่อลดความซ้ำซ้อน
const getTodosCollection = () => collection(db, 'todos');

// ฟังก์ชันหา Collection หลักของ Ad ตาม ID
const getSpecificAdsCollectionPath = (adId) => {
  if (String(adId).includes('PRODUCT_LINK') || String(adId).includes('SKU')) {
      return 'user_sku_ads';
  }
  if (String(adId).includes('BILLBOARD') || String(adId).includes('BB')) {
      return 'billboard_ads';
  }
  return 'partner_ads';
};

export const adManagementService = {

  /**
   * 1. ดึงข้อมูลโฆษณาตามสถานะ (ค่าเริ่มต้นคือ pending - รอตรวจสอบ)
   */
  getAdsByStatus: async (status = 'pending') => {
    try {
      // 💡 ดึงจาก partner_ads เป็นหลัก เพราะ marketingService เซฟไว้ที่นี่ทั้งหมด
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads'), where('status', '==', status));
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
   */
  approveAd: async (adId, targetSkuId) => {
    try {
      const batch = writeBatch(db);
      
      const specificCol = getSpecificAdsCollectionPath(adId);
      const adRef = doc(collection(db, 'artifacts', appId, 'public', 'data', specificCol), adId);
      
      const updatePayload = {
        status: 'active',
        isActive: true,
        updatedAt: serverTimestamp()
      };
      
      batch.update(adRef, updatePayload);

      if (specificCol !== 'partner_ads') {
        const partnerAdRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads'), adId);
        batch.update(partnerAdRef, updatePayload);
      }

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
      
      const specificCol = getSpecificAdsCollectionPath(adId);
      const adRef = doc(collection(db, 'artifacts', appId, 'public', 'data', specificCol), adId);
      
      const updatePayload = {
        status: 'rejected',
        isActive: false,
        rejectReason: reason,
        updatedAt: serverTimestamp()
      };
      
      batch.update(adRef, updatePayload);

      if (specificCol !== 'partner_ads') {
        const partnerAdRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads'), adId);
        batch.update(partnerAdRef, updatePayload);
      }

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
   */
  pauseAd: async (adId) => {
    try {
      const specificCol = getSpecificAdsCollectionPath(adId);
      const updatePayload = {
        status: 'paused',
        isActive: false, // ปิดสวิตช์การแสดงผล
        pauseReason: 'ถูกระงับโดยผู้ดูแลระบบ',
        updatedAt: serverTimestamp()
      };
      
      const adRef = doc(collection(db, 'artifacts', appId, 'public', 'data', specificCol), adId);
      await updateDoc(adRef, updatePayload);

      if (specificCol !== 'partner_ads') {
        const partnerAdRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads'), adId);
        await updateDoc(partnerAdRef, updatePayload).catch(()=>{});
      }

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
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'partner_ads'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.size; // คืนค่าตัวเลขจำนวนคำขอไปแสดงบน Widget
    } catch (error) {
      console.error("❌ Error getting pending count:", error);
      return 0;
    }
  }
};

export default adManagementService;