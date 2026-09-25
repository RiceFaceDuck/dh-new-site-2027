/* eslint-disable */
import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  updateDoc,
  serverTimestamp,
  query,
  where,
  limit,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🔐 ดึงสิทธิ์การเข้าถึงรหัส Sandbox App ID ที่ถูกต้อง (ยึดตามโครงสร้างความปลอดภัย)
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';

// 🚀 ฟังก์ชันช่วยเหลือสำหรับเรียก Collection
// ตอนนี้ใช้ todos ที่ root level เพื่อลดความซ้ำซ้อน
const getTodosCollection = () => collection(db, getCollectionPath('todos'));

// ฟังก์ชันหา Collection หลักของ Ad ตาม ID
const getSpecificAdsCollectionPath = (adId) => {
  if (String(adId).includes('PRODUCT_LINK') || String(adId).includes('PRODUCT') || String(adId).includes('SKU')) {
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
      const q = query(collection(db, getCollectionPath('partner_ads')), where('status', '==', status), limit(500));
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
   * ดึงข้อมูลแคมเปญโฆษณาทั้งหมดของลูกค้า (อิงจาก ownerId)
   */
  getAdsByUserId: async (uid) => {
    try {
      // 🚀 SSOT Optimization: ดึงจาก partner_ads เป็นหลัก
      const q = query(collection(db, getCollectionPath('partner_ads')), where('ownerId', '==', uid), limit(500));
      const snap = await getDocs(q);
      
      const adsList = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      return adsList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt).getTime() || 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt).getTime() || 0);
        return timeB - timeA; 
      });
    } catch (error) {
      console.error(`❌ Error fetching ads for user [${uid}]:`, error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูล Store Profile ของลูกค้า
   */
  getStoreProfile: async (uid) => {
    try {
      // 🚀 SSOT: อ่านจาก users/{uid}/storeProfile/main เป็นหลัก
      const storeRef = doc(db, getCollectionPath('users'), uid, 'storeProfile', 'main');
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists()) return storeSnap.data();

      // 🛡️ Fallback: ดึงจาก artifacts หากยังไม่มีใน users
      const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';
      const legacyStoreRef = doc(db, 'artifacts', appId, 'users', uid, 'storeProfile', 'main');
      const legacySnap = await getDoc(legacyStoreRef);
      return legacySnap.exists() ? legacySnap.data() : null;
    } catch (error) {
      console.error(`❌ Error fetching store profile for [${uid}]:`, error);
      return null;
    }
  },

  /**
   * 2. อนุมัติโฆษณา (Approve) & ปิดงาน To-do อัตโนมัติด้วย Batch Write
   */
  approveAd: async (adId, taskId) => {
    try {
      // 🚀 SSOT Resilient Resolution: ตรวจสอบ partner_ads เป็นหลัก และ fallback หา legacy collection
      const partnerAdRef = doc(collection(db, getCollectionPath('partner_ads')), adId);
      const partnerSnap = await getDoc(partnerAdRef);

      const specificCol = getSpecificAdsCollectionPath(adId);
      const legacyRef = specificCol !== 'partner_ads' ? doc(collection(db, getCollectionPath(specificCol)), adId) : null;
      const legacySnap = legacyRef ? await getDoc(legacyRef) : null;

      if (!partnerSnap.exists() && (!legacySnap || !legacySnap.exists())) {
        throw new Error("ไม่พบข้อมูลโฆษณา");
      }

      const adData = partnerSnap.exists() ? partnerSnap.data() : legacySnap.data();
      const batch = writeBatch(db);
      
      const updatePayload = {
        status: 'active',
        isActive: true,
        updatedAt: serverTimestamp()
      };
      
      if (partnerSnap.exists()) {
        batch.update(partnerAdRef, updatePayload);
      }
      if (legacySnap && legacySnap.exists()) {
        batch.update(legacyRef, updatePayload);
      }

      // 🌟 THE FIX [Data Relationship]: Sync full store profile to ActivePartners upon approval
      if (adData.type === 'BUSINESS_CARD') {
         const partnerId = adData.ownerId;
         const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);

         // Fetch user points from users/{partnerId}
         let points = 0;
         try {
           const userRef = doc(db, getCollectionPath('users'), partnerId);
           const userSnap = await getDoc(userRef);
           if (userSnap.exists()) {
             const uData = userSnap.data();
             points = Number(uData.creditPoints || uData.points || 0);
           }
         } catch (e) {
           console.warn("Could not fetch user points for partner sync:", e);
         }

         batch.set(activePartnerRef, {
            partnerId: partnerId,
            storeName: adData.partnerName || adData.title || '',
            services: adData.services || adData.description || '',
            phone: adData.phone || '',
            messengerUrl: adData.messengerUrl || '',
            lineUrl: adData.lineUrl || '',
            googleMapLink: adData.googleMapLink || '',
            latitude: Number(adData.latitude || 0),
            longitude: Number(adData.longitude || 0),
            storeImage: adData.imageUrl || '',
            address: adData.address || '',
            landmarks: adData.landmarks || '',
            richDescription: adData.richDescription || '',
            galleryImages: Array.isArray(adData.galleryImages) ? adData.galleryImages : [],
            openHours: adData.openHours || '',
            websiteUrl: adData.websiteUrl || '',
            youtubeUrl: adData.youtubeUrl || '',
            tiktokUrl: adData.tiktokUrl || '',
            shopeeUrl: adData.shopeeUrl || '',
            lazadaUrl: adData.lazadaUrl || '',
            points: points,
            isActive: true,
            updatedAt: serverTimestamp()
         }, { merge: true });
      }

      // 2.2 ปิดงานใน To-do ของผู้จัดการโดยตรง (Direct Update ไม่ต้อง Query)
      if (taskId) {
        const todoRef = doc(getTodosCollection(), taskId);
        batch.update(todoRef, { 
          status: 'completed', 
          resolution: 'approved',
          updatedAt: serverTimestamp() 
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
  rejectAd: async (adId, taskId, reason = 'ผิดเงื่อนไขการให้บริการของ DH Notebook') => {
    try {
      // 🚀 SSOT Resilient Resolution: ตรวจสอบ partner_ads เป็นหลัก และ fallback หา legacy collection
      const partnerAdRef = doc(collection(db, getCollectionPath('partner_ads')), adId);
      const partnerSnap = await getDoc(partnerAdRef);

      const specificCol = getSpecificAdsCollectionPath(adId);
      const legacyRef = specificCol !== 'partner_ads' ? doc(collection(db, getCollectionPath(specificCol)), adId) : null;
      const legacySnap = legacyRef ? await getDoc(legacyRef) : null;

      if (!partnerSnap.exists() && (!legacySnap || !legacySnap.exists())) {
        throw new Error("ไม่พบข้อมูลโฆษณา");
      }

      const adData = partnerSnap.exists() ? partnerSnap.data() : legacySnap.data();
      const batch = writeBatch(db);
      
      const updatePayload = {
        status: 'rejected',
        isActive: false,
        rejectReason: reason,
        updatedAt: serverTimestamp()
      };
      
      if (partnerSnap.exists()) {
        batch.update(partnerAdRef, updatePayload);
      }
      if (legacySnap && legacySnap.exists()) {
        batch.update(legacyRef, updatePayload);
      }

      // 🌟 THE FIX [Data Relationship]: Restore from ActivePartners if rejected
      if (adData && adData.type === 'BUSINESS_CARD') {
         const partnerId = adData.ownerId;
         const partnerRef = doc(db, getCollectionPath('partners'), partnerId);
         const partnerSnap = await getDoc(partnerRef);
         
         if (partnerSnap.exists() && partnerSnap.data().isActive !== false) {
             const pData = partnerSnap.data();
             const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
             batch.set(activePartnerRef, {
                partnerId: partnerId,
                storeName: pData.storeName || pData.accountName || pData.displayName || '',
                services: pData.services || pData.description || '',
                phone: pData.phone || '',
                messengerUrl: pData.messengerUrl || '',
                lineUrl: pData.lineUrl || '',
                googleMapLink: pData.googleMapLink || '',
                latitude: Number(pData.latitude || 0),
                longitude: Number(pData.longitude || 0),
                storeImage: pData.storeImage || pData.avatarUrl || '',
                updatedAt: serverTimestamp()
             }, { merge: true });
         } else {
             // If partner doesn't exist or is not active, delete from ActivePartners
             const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
             batch.delete(activePartnerRef);
         }
      }

      // 3.2 ปิดงานใน To-do ของผู้จัดการโดยตรง (Direct Update)
      if (taskId) {
        const todoRef = doc(getTodosCollection(), taskId);
        batch.update(todoRef, { 
          status: 'rejected', 
          resolution: 'rejected', 
          updatedAt: serverTimestamp() 
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
      // 🚀 SSOT Resilient Resolution: ตรวจสอบ partner_ads เป็นหลัก และ fallback หา legacy collection
      const partnerAdRef = doc(collection(db, getCollectionPath('partner_ads')), adId);
      const partnerSnap = await getDoc(partnerAdRef);

      const specificCol = getSpecificAdsCollectionPath(adId);
      const legacyRef = specificCol !== 'partner_ads' ? doc(collection(db, getCollectionPath(specificCol)), adId) : null;
      const legacySnap = legacyRef ? await getDoc(legacyRef) : null;

      if (!partnerSnap.exists() && (!legacySnap || !legacySnap.exists())) {
        throw new Error("ไม่พบข้อมูลโฆษณา");
      }

      const adData = partnerSnap.exists() ? partnerSnap.data() : legacySnap.data();
      const updatePayload = {
        status: 'paused',
        isActive: false, // ปิดสวิตช์การแสดงผล
        pauseReason: 'ถูกระงับโดยผู้ดูแลระบบ',
        updatedAt: serverTimestamp()
      };
      
      const batch = writeBatch(db);
      
      if (partnerSnap.exists()) {
        batch.update(partnerAdRef, updatePayload);
      }
      if (legacySnap && legacySnap.exists()) {
        batch.update(legacyRef, updatePayload);
      }

      // 🌟 THE FIX [Data Relationship]: Remove from ActivePartners if paused
      if (adData && adData.type === 'BUSINESS_CARD' && adData.ownerId) {
         const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), adData.ownerId);
         batch.delete(activePartnerRef);
      }

      await batch.commit();

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
      const q = query(collection(db, getCollectionPath('partner_ads')), where('status', '==', 'pending'));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count; // คืนค่าตัวเลขจำนวนคำขอไปแสดงบน Widget
    } catch (error) {
      console.error("❌ Error getting pending count:", error);
      return 0;
    }
  }
};

export default adManagementService;