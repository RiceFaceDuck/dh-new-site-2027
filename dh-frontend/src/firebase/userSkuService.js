/* eslint-disable */
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

export const SKU_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  INACTIVE: 'INACTIVE'
};

// ----------------------------------------------------------------------
// 🧠 Smart Caching System (ประหยัด Reads ลดภาระ Database)
// ----------------------------------------------------------------------
const activeAdsCache = {
  data: [],
  lastFetched: null,
  ttl: 5 * 60 * 1000, // แคชไว้ 5 นาที
};

export const userSkuService = {
  createAdRequest: async (userId, adData) => {
    try {
      const docRef = await addDoc(collection(db, 'user_skus'), {
        ...adData,
        ownerUid: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating ad request:", error);
      throw error;
    }
  },

  getUserAds: async (userId) => {
    try {
      const q = query(
        collection(db, 'user_skus'), 
        where("ownerUid", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const ads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return ads.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    } catch (error) {
      console.error("Error fetching user ads:", error);
      throw error;
    }
  },

  // 🚀 ฟังก์ชันดึงโฆษณาโชว์หน้าเว็บ (ปลดล็อกข้อจำกัด Firebase Index)
  getActiveAdsForDisplay: async (forceRefresh = false) => {
    const now = Date.now();

    // 1. เช็ค Cache ก่อน เพื่อลดภาระ Database
    if (!forceRefresh && activeAdsCache.lastFetched && (now - activeAdsCache.lastFetched < activeAdsCache.ttl)) {
      let cachedAds = [...activeAdsCache.data];
      // สุ่มตำแหน่งใหม่ทุกครั้ง
      for (let i = cachedAds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cachedAds[i], cachedAds[j]] = [cachedAds[j], cachedAds[i]];
      }
      return cachedAds;
    }

    try {
      // 🚀 แก้ปัญหา Missing Index และ รองรับข้อมูลเก่า: 
      // ใช้ 'in' เพื่อหาทั้งพิมพ์เล็กและใหญ่ และหลีกเลี่ยงการใช้ where("isActive") คู่กัน
      const q = query(
        collection(db, 'user_skus'),
        where("status", "in", ['APPROVED', 'approved'])
      );
      
      const querySnapshot = await getDocs(q);
      let ads = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // กรอง isActive ด้วย JavaScript แทน เพื่อหลีกเลี่ยง Error หน้าบ้าน
        .filter(ad => ad.isActive === true); 
      
      activeAdsCache.data = [...ads];
      activeAdsCache.lastFetched = now;

      // ✨ สุ่มลำดับการแสดงผลโฆษณา (Fisher-Yates Shuffle) 
      for (let i = ads.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ads[i], ads[j]] = [ads[j], ads[i]];
      }
      
      return ads;
    } catch (error) {
      console.error("🔥 Error fetching active ads for display:", error);
      if (activeAdsCache.data.length > 0) return activeAdsCache.data;
      return [];
    }
  },

  deleteUserAd: async (adId) => {
    try {
      const docRef = doc(db, 'user_skus', adId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("❌ Error deleting ad:", error);
      throw new Error("ไม่สามารถลบรายการได้ โปรดลองใหม่อีกครั้ง");
    }
  }
};