/* eslint-disable */
import { db } from './config';
import { 
  collection, doc, getDocs, getDoc, query, where, 
  serverTimestamp, runTransaction, increment, orderBy, limit 
} from 'firebase/firestore';

// 🚀 นำเข้าฟังก์ชันหักเครดิตแบบ Transaction จาก Credit Service
import { consumeAdCreditWithTransaction } from './creditService';

// 🛡️ กำหนด App ID สำหรับการเข้าถึงแบบ Enterprise Sandbox
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

export const marketingService = {
  
  // ==========================================
  // 📢 1. ฟังก์ชันสำหรับดึงโฆษณามาแสดงผลหน้าเว็บ (Hotfix กู้ชีพ)
  // ==========================================
  
  /**
   * ดึงแผ่นป้ายโฆษณา (Billboard) ที่อนุมัติแล้วมาแสดงผล
   */
  getActiveBillboardAds: async () => {
    try {
      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'billboard_ads');
      const q = query(adsRef, where('status', '==', 'APPROVED'), orderBy('createdAt', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("❌ [Marketing] Error fetching active billboards:", error);
      return []; // คืนค่า Array ว่างเพื่อไม่ให้ UI พัง
    }
  },

  /**
   * ดึงสินค้าโฆษณาของลูกค้า (User SKU) ที่อนุมัติแล้ว มาแทรกกับสินค้าหลัก (10:1)
   */
  getActiveAds: async () => {
    try {
      const skuRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads');
      const q = query(skuRef, where('status', '==', 'APPROVED'), orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("❌ [Marketing] Error fetching active user SKUs:", error);
      return []; // คืนค่า Array ว่างเพื่อไม่ให้ UI พัง
    }
  },


  // ==========================================
  // 🛒 2. ฟังก์ชันสั่งซื้อ/ฝากโฆษณา (ใช้ Credit Point)
  // ==========================================

  /**
   * ลูกค้าฝากป้ายโฆษณา (Billboard)
   * ทำงานแบบ Atomic: หักแต้ม -> บันทึกข้อมูล -> ส่งเข้า To-do ผู้จัดการ
   */
  requestBillboardAd: async (userId, adData, creditCost) => {
    if (!userId || !adData || creditCost <= 0) throw new Error("ข้อมูลไม่ครบถ้วน");

    try {
      await runTransaction(db, async (transaction) => {
        const adId = `AD-BB-${Date.now()}`;
        const taskId = `TODO-${adId}`;
        
        // 1. 🪙 หักเครดิตแบบปลอดภัย (อ่านค่า และ หักยอด)
        await consumeAdCreditWithTransaction(transaction, userId, creditCost, adId, `ซื้อป้ายโฆษณา: ${adData.title}`);

        // 2. 📢 บันทึกโฆษณาในสถานะ PENDING (รออนุมัติ)
        const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'billboard_ads', adId);
        const adPayload = {
          ...adData,
          ownerId: userId,
          status: 'PENDING', // ต้องรอผู้จัดการอนุมัติ
          cost: creditCost,
          stats: { views: 0, clicks: 0 },
          createdAt: serverTimestamp()
        };
        transaction.set(adRef, adPayload);

        // 3. 🏢 ส่งงานเข้า To-do กระดานผู้จัดการ (Manager Board)
        const todoRef = doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId);
        transaction.set(todoRef, {
          taskId: taskId,
          taskType: 'BILLBOARD_APPROVAL', // ตรงกับ MANAGER_TASK_TYPES ใน todoService
          status: 'PENDING',
          priority: 'NORMAL',
          customer: { uid: userId },
          adDetails: adPayload,
          createdAt: serverTimestamp(),
          createdBy: userId
        });
      });

      console.log("✅ [Marketing] Billboard Ad requested successfully");
      return true;
    } catch (error) {
      console.error("🔥 [Marketing] Billboard Ad request failed:", error.message);
      throw error;
    }
  },

  /**
   * ลูกค้าฝากขายสินค้า (User SKU)
   * ทำงานแบบ Atomic: หักแต้ม -> บันทึกข้อมูล -> ส่งเข้า To-do ผู้จัดการ
   */
  requestUserSkuAd: async (userId, skuData, creditCost) => {
    if (!userId || !skuData || creditCost <= 0) throw new Error("ข้อมูลไม่ครบถ้วน");

    try {
      await runTransaction(db, async (transaction) => {
        const skuId = `SKU-${Date.now()}`;
        const taskId = `TODO-${skuId}`;
        
        // 1. 🪙 หักเครดิตแบบปลอดภัย
        await consumeAdCreditWithTransaction(transaction, userId, creditCost, skuId, `ฝากโปรโมทสินค้า: ${skuData.productName}`);

        // 2. 📦 บันทึกสินค้าในสถานะ PENDING (รออนุมัติ)
        const skuRef = doc(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads', skuId);
        const skuPayload = {
          ...skuData,
          ownerId: userId,
          status: 'PENDING', 
          cost: creditCost,
          stats: { views: 0, clicks: 0 },
          createdAt: serverTimestamp()
        };
        transaction.set(skuRef, skuPayload);

        // 3. 🏢 ส่งงานเข้า To-do กระดานผู้จัดการ
        const todoRef = doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId);
        transaction.set(todoRef, {
          taskId: taskId,
          taskType: 'USER_SKU_APPROVAL', // ตรงกับ MANAGER_TASK_TYPES
          status: 'PENDING',
          priority: 'NORMAL',
          customer: { uid: userId },
          skuDetails: skuPayload,
          createdAt: serverTimestamp(),
          createdBy: userId
        });
      });

      console.log("✅ [Marketing] User SKU Ad requested successfully");
      return true;
    } catch (error) {
      console.error("🔥 [Marketing] User SKU Ad request failed:", error.message);
      throw error;
    }
  },


  // ==========================================
  // 📊 3. ฟังก์ชัน Tracking และดึงข้อมูลส่วนตัว (Dashboard)
  // ==========================================

  /**
   * อัปเดตยอดเข้าชม (Impressions) อัตโนมัติเวลาคนเลื่อนผ่าน
   */
  trackAdView: async (collectionName, adId) => {
    if (!adId) return;
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, adId);
      await runTransaction(db, async (transaction) => {
        const adDoc = await transaction.get(adRef);
        if (adDoc.exists()) {
          transaction.update(adRef, { 'stats.views': increment(1) });
        }
      });
    } catch (error) {
      console.error(`[Marketing] Track view error (${adId}):`, error);
    }
  },

  /**
   * อัปเดตยอดคลิก (Clicks) อัตโนมัติเวลาคนกดดูสินค้า/ป้าย
   */
  trackAdClick: async (collectionName, adId) => {
    if (!adId) return;
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, adId);
      await runTransaction(db, async (transaction) => {
        const adDoc = await transaction.get(adRef);
        if (adDoc.exists()) {
          transaction.update(adRef, { 'stats.clicks': increment(1) });
        }
      });
    } catch (error) {
      console.error(`[Marketing] Track click error (${adId}):`, error);
    }
  },

  /**
   * ดึงประวัติป้ายโฆษณาทั้งหมดของตัวเอง (ไว้โชว์หน้า Profile)
   */
  getUserBillboards: async (userId) => {
    try {
      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'billboard_ads');
      const q = query(adsRef, where('ownerId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("❌ [Marketing] Error fetching user billboards:", error);
      return [];
    }
  },

  /**
   * ดึงประวัติสินค้าโปรโมททั้งหมดของตัวเอง (ไว้โชว์หน้า Profile)
   */
  getUserSkuAds: async (userId) => {
    try {
      const skuRef = collection(db, 'artifacts', appId, 'public', 'data', 'user_sku_ads');
      const q = query(skuRef, where('ownerId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("❌ [Marketing] Error fetching user SKUs:", error);
      return [];
    }
  }

};

// Export individual functions to support both import styles
export const { 
  getActiveBillboardAds, 
  getActiveAds, 
  requestBillboardAd, 
  requestUserSkuAd,
  trackAdView,
  trackAdClick,
  getUserBillboards,
  getUserSkuAds
} = marketingService;