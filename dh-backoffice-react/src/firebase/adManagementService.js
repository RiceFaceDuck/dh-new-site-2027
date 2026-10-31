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
   * ดึงข้อมูล Store Profile ของลูกค้า พร้อมผูกข้อมูลสถิติจาก ActivePartners
   */
  getStoreProfile: async (uid) => {
    try {
      let profileData = null;
      // 🚀 SSOT: อ่านจาก users/{uid}/storeProfile/main เป็นหลัก
      const storeRef = doc(db, getCollectionPath('users'), uid, 'storeProfile', 'main');
      const storeSnap = await getDoc(storeRef);
      if (storeSnap.exists()) {
        profileData = storeSnap.data();
      } else {
        // 🛡️ Fallback: ดึงจาก artifacts หากยังไม่มีใน users
        const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';
        const legacyStoreRef = doc(db, 'artifacts', appId, 'users', uid, 'storeProfile', 'main');
        const legacySnap = await getDoc(legacyStoreRef);
        if (legacySnap.exists()) {
          profileData = legacySnap.data();
        }
      }

      // 🌟 Parity: ตรวจสอบและเชื่อมโยง viewCount และ likeCount จาก ActivePartners (SSOT สถิติร้าน)
      try {
        const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), uid);
        const activePartnerSnap = await getDoc(activePartnerRef);
        if (activePartnerSnap.exists()) {
          const apData = activePartnerSnap.data();
          profileData = {
            ...(profileData || {}),
            viewCount: Number(apData.viewCount || apData.viewsCount || profileData?.viewCount || 0),
            likeCount: Number(apData.likeCount || profileData?.likeCount || 0),
            activePartner: apData
          };
        }
      } catch (apErr) {
        console.debug(`[getStoreProfile] ActivePartners stats fetch deferred:`, apErr?.message);
      }

      return profileData;
    } catch (error) {
      console.error(`❌ Error fetching store profile for [${uid}]:`, error);
      return null;
    }
  },

  /**
   * ดึงข้อมูล ActivePartners รายบุคคลสำหรับตรวจสถิติร้านค้า
   */
  getActivePartner: async (uid) => {
    try {
      const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), uid);
      const activePartnerSnap = await getDoc(activePartnerRef);
      return activePartnerSnap.exists() ? activePartnerSnap.data() : null;
    } catch (error) {
      console.debug(`[getActivePartner] Error fetching ActivePartners for [${uid}]:`, error);
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

      // 🌟 THE FIX [Data Relationship]: Sync full store profile to ActivePartners and active_partners_bundle upon approval
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

         const storeImage = adData.imageUrl || '';
         const storeName = adData.partnerName || adData.title || '';
         const services = adData.services || adData.description || '';
         const phone = adData.phone || '';
         const messengerUrl = adData.messengerUrl || '';
         const lineUrl = adData.lineUrl || '';
         const googleMapLink = adData.googleMapLink || '';
         const latitude = Number(adData.latitude || 0);
         const longitude = Number(adData.longitude || 0);
         const address = adData.address || '';
         const landmarks = adData.landmarks || '';
         const richDescription = adData.richDescription || '';
         const galleryImages = Array.isArray(adData.galleryImages) ? adData.galleryImages : [];
         const openHours = adData.openHours || '';
         const websiteUrl = adData.websiteUrl || '';
         const youtubeUrl = adData.youtubeUrl || '';
         const tiktokUrl = adData.tiktokUrl || '';
         const shopeeUrl = adData.shopeeUrl || '';
         const lazadaUrl = adData.lazadaUrl || '';

         batch.set(activePartnerRef, {
            partnerId: partnerId,
            storeName: storeName,
            services: services,
            phone: phone,
            messengerUrl: messengerUrl,
            lineUrl: lineUrl,
            googleMapLink: googleMapLink,
            latitude: latitude,
            longitude: longitude,
            storeImage: storeImage,
            address: address,
            landmarks: landmarks,
            richDescription: richDescription,
            galleryImages: galleryImages,
            openHours: openHours,
            websiteUrl: websiteUrl,
            youtubeUrl: youtubeUrl,
            tiktokUrl: tiktokUrl,
            shopeeUrl: shopeeUrl,
            lazadaUrl: lazadaUrl,
            points: points,
            isActive: true,
            updatedAt: serverTimestamp()
         }, { merge: true });

         // 🌟 Event-Driven Starter Bundle Snapshot: อัปเดตร้านช่างใน catalogs/active_partners_bundle ทันที
         try {
           const bundleRef = doc(db, 'catalogs', 'active_partners_bundle');
           const bundleSnap = await getDoc(bundleRef);
           if (bundleSnap.exists()) {
             const bData = bundleSnap.data() || {};
             let items = Array.isArray(bData.items) ? [...bData.items] : [];
             const existingIdx = items.findIndex(i => (i.id === partnerId || i.partnerId === partnerId));
             const existingAd = existingIdx >= 0 ? items[existingIdx] : null;
             const existingStats = existingAd?.stats || {};

             const partnerItem = {
               id: partnerId,
               partnerId: partnerId,
               storeName: storeName,
               partnerName: storeName,
               services: services,
               phone: phone,
               messengerUrl: messengerUrl,
               lineUrl: lineUrl,
               googleMapLink: googleMapLink,
               latitude: latitude,
               longitude: longitude,
               storeImage: storeImage,
               imageUrl: storeImage,
               address: address,
               landmarks: landmarks,
               openHours: openHours,
               points: points,
               viewsCount: Number(adData?.stats?.views || adData?.viewsCount || 0),
               stats: {
                 ...existingStats,
                 views: existingAd?.stats?.views || existingAd?.viewsCount || 0,
                 clicks: existingAd?.stats?.clicks || Number(adData?.stats?.clicks || adData?.clicks || 0)
               },
               isVerified: true,
               isActive: true
             };
             // 🛡️ M3 Parity: ป้องกันการรีเซ็ตยอดวิวเดิมของร้านใน bundle
             if (existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views) {
               partnerItem.viewsCount = existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views || 0;
             }
             if (existingIdx >= 0) {
               items[existingIdx] = { ...items[existingIdx], ...partnerItem };
             } else {
               items.unshift(partnerItem);
             }
             batch.set(bundleRef, {
               items: items.slice(0, 100),
               totalActivePartners: items.length,
               bundledCount: items.slice(0, 100).length,
               updatedAt: serverTimestamp()
             }, { merge: true });
           }
         } catch (e) {
           console.warn("Could not sync partner into active_partners_bundle:", e);
         }
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

      // 🌟 THE FIX [Data Relationship]: Remove from ActivePartners and active_partners_bundle if paused
      if (adData && adData.type === 'BUSINESS_CARD' && adData.ownerId) {
         const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), adData.ownerId);
         batch.delete(activePartnerRef);

         try {
           const bundleRef = doc(db, 'catalogs', 'active_partners_bundle');
           const bundleSnap = await getDoc(bundleRef);
           if (bundleSnap.exists()) {
             const bData = bundleSnap.data() || {};
             const items = Array.isArray(bData.items) ? bData.items : [];
             const filtered = items.filter(i => (i.id !== adData.ownerId && i.partnerId !== adData.ownerId));
             if (filtered.length !== items.length) {
               batch.set(bundleRef, {
                 items: filtered,
                 totalActivePartners: filtered.length,
                 bundledCount: filtered.length,
                 updatedAt: serverTimestamp()
               }, { merge: true });
             }
           }
         } catch (e) {
           console.warn("Could not remove partner from active_partners_bundle in pauseAd:", e);
         }
      }

      await batch.commit();

      return { success: true, message: 'ระงับการแสดงผลโฆษณานี้ชั่วคราวสำเร็จ' };
    } catch (error) {
      console.error("❌ Error pausing ad:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการระงับโฆษณา' };
    }
  },

  /**
   * 5. ลบโฆษณาถาวร (Delete Ad) โดยผู้ดูแลระบบ / ผู้จัดการ
   */
  deleteAd: async (adId) => {
    try {
      if (!adId) throw new Error("ไม่พบรหัสโฆษณา");
      const batch = writeBatch(db);

      const partnerAdRef = doc(db, getCollectionPath('partner_ads'), adId);
      const partnerSnap = await getDoc(partnerAdRef);

      const specificCol = getSpecificAdsCollectionPath(adId);
      const legacyRef = specificCol !== 'partner_ads' ? doc(db, getCollectionPath(specificCol), adId) : null;
      const legacySnap = legacyRef ? await getDoc(legacyRef) : null;

      const adData = partnerSnap.exists() ? partnerSnap.data() : (legacySnap?.exists() ? legacySnap.data() : null);

      if (partnerSnap.exists()) {
        batch.delete(partnerAdRef);
      }
      if (legacySnap && legacySnap.exists()) {
        batch.delete(legacyRef);
      }

      if (adData && adData.type === 'BUSINESS_CARD' && adData.ownerId) {
        const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), adData.ownerId);
        batch.delete(activePartnerRef);

        try {
          const bundleRef = doc(db, 'catalogs', 'active_partners_bundle');
          const bundleSnap = await getDoc(bundleRef);
          if (bundleSnap.exists()) {
            const bData = bundleSnap.data() || {};
            const items = Array.isArray(bData.items) ? bData.items : [];
            const filtered = items.filter(i => (i.id !== adData.ownerId && i.partnerId !== adData.ownerId));
            if (filtered.length !== items.length) {
              batch.set(bundleRef, {
                items: filtered,
                totalActivePartners: filtered.length,
                bundledCount: filtered.length,
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          }
        } catch (e) {
          console.warn("Could not remove partner from active_partners_bundle in deleteAd:", e);
        }
      }

      const todoRef = doc(getTodosCollection(), `TODO-${adId}`);
      const todoResubmitRef = doc(getTodosCollection(), `TODO-RESUBMIT-${adId}`);
      batch.delete(todoRef);
      batch.delete(todoResubmitRef);

      await batch.commit();
      return { success: true, message: 'ลบโฆษณาเรียบร้อยแล้ว' };
    } catch (error) {
      console.error("❌ Error deleting ad:", error);
      return { success: false, message: error.message || 'เกิดข้อผิดพลาดในการลบโฆษณา' };
    }
  },

  /**
   * 6. [NEW] ฟังก์ชันสำหรับ Dashboard: นับจำนวนคำขอที่รออนุมัติ
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