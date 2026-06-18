import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './config';

/**
 * 📦 Store Profile Submit Service (SRP)
 * Handles the complex logic of saving a Store Profile, formatting URLs, 
 * updating ads to PENDING, and syncing data relationships.
 */
export const storeProfileSubmitService = {

  saveStoreProfile: async (appId, user, storeData, businessCardAd) => {
    try {
      console.log("Executing storeProfileSubmitService... (Forced HMR invalidation)");
      const finalStoreData = { ...storeData };
      
      // 1. Format URLs
      const urlFields = ['messengerUrl', 'lineUrl', 'youtubeUrl', 'tiktokUrl', 'shopeeUrl', 'lazadaUrl', 'websiteUrl'];
      urlFields.forEach(field => {
        if (finalStoreData[field] && !finalStoreData[field].startsWith('http')) {
          if (field === 'messengerUrl' && finalStoreData[field].includes('m.me')) {
            finalStoreData[field] = 'https://' + finalStoreData[field];
          } else {
            finalStoreData[field] = 'https://' + finalStoreData[field];
          }
        }
      });

      const batch = writeBatch(db); 

      // 2. บันทึกข้อมูลร้านลงระบบ Profile หลัก
      const storeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'storeProfile', 'main');
      batch.set(storeRef, { ...finalStoreData, updatedAt: serverTimestamp() }, { merge: true });

      // Refs สำหรับการอัปเดตสถานะและแผนที่
      const activePartnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'ActivePartners', user.uid);
      const adId = `AD-CARD-${user.uid}`;
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId);
      const taskId = `TODO-${adId}`;

      if (finalStoreData.isSupportActive) {
        if (!finalStoreData.latitude || !finalStoreData.longitude) {
           throw new Error("กรุณากดปุ่ม 'ดึงพิกัดปัจจุบัน' ก่อนเปิดรับการสนับสนุน");
        }

        // 🌟 THE FIX [Data Relationship]: Remove from radar immediately on update.
        // It must be approved by Manager before appearing on the map again.
        batch.delete(activePartnerRef);

        const adPayload = {
           id: adId,
           type: 'BUSINESS_CARD',
           ownerId: user.uid,
           title: finalStoreData.storeName,
           description: finalStoreData.description || finalStoreData.services || '',
           imageUrl: finalStoreData.storeImage || 'https://placehold.co/400x400/e2e8f0/475569?text=Store',
           targetUrl: finalStoreData.websiteUrl || finalStoreData.messengerUrl || finalStoreData.lineUrl || finalStoreData.googleMapLink || '#',
           messengerUrl: finalStoreData.messengerUrl || '',
           lineUrl: finalStoreData.lineUrl || '',
           phone: finalStoreData.phone || '',
           partnerName: finalStoreData.storeName,
           // Data needed for ActivePartners sync later when approved
           services: finalStoreData.services || '',
           googleMapLink: finalStoreData.googleMapLink || '',
           latitude: Number(finalStoreData.latitude), 
           longitude: Number(finalStoreData.longitude), 
           status: 'PENDING', 
           isActive: false, // ปิดการแสดงผลจนกว่าจะอนุมัติ
           creditLimit: -1, 
           updatedAt: serverTimestamp()
        };

        if (!businessCardAd) {
           adPayload.stats = { views: 0, clicks: 0 };
        }

        const todoPayload = {
          taskId: taskId,
          type: 'AD_APPROVAL',
          taskType: 'AD_APPROVAL',
          status: 'pending',
          priority: 'High',
          title: `ตรวจสอบนามบัตร: ${finalStoreData.storeName}`,
          description: `พาร์ทเนอร์อัปเดตข้อมูลและขอเปิดใช้นามบัตรโฆษณา`,
          targetSkuId: adId,
          partnerId: user.uid,
          customerName: finalStoreData.storeName,
          adDetails: adPayload,
          requestedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          createdBy: user.uid
        };

        batch.set(adRef, adPayload, { merge: true });
        batch.set(doc(db, 'todos', taskId), todoPayload, { merge: true });

      } else {
        // หากปิดการรับลูกค้า
        batch.delete(activePartnerRef);
        batch.set(adRef, { status: 'INACTIVE', isActive: false, updatedAt: serverTimestamp() }, { merge: true });
        batch.delete(doc(db, 'todos', taskId));
      }
      
      await batch.commit();
      
      // ล้างแคชเพื่อให้ระบบโหลดใหม่ (ใช้ localStorage เพื่อให้มีผลทุกแท็บ)
      localStorage.removeItem(`active_partners_cache_v3_${appId}`);
      
      return finalStoreData;
    } catch (error) {
      console.error("🔥 Error in storeProfileSubmitService:", error);
      throw error;
    }
  }
};
