import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './config';

// กำหนด App ID ตามโครงสร้างของระบบ
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// ==========================================
// In-memory Cache System (ประหยัด Reads)
// ==========================================
let cachedAds = null;
let cachedBanners = null;
let adsFetchTime = 0;
let bannersFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 5; // แคชข้อมูลไว้ 5 นาที (300,000 ms)

/**
 * ดึงข้อมูลโฆษณาสินค้า (อัตราส่วน 1:1) ที่มีสถานะ 'active'
 * @param {boolean} forceRefresh - บังคับดึงข้อมูลใหม่จาก Firestore โดยไม่ใช้ Cache
 * @returns {Promise<Array>} - Array ของข้อมูลโฆษณา
 */
export const getActiveAds = async (forceRefresh = false) => {
  const now = Date.now();

  // ตรวจสอบว่ามี Cache และยังไม่หมดอายุหรือไม่
  if (!forceRefresh && cachedAds && (now - adsFetchTime < CACHE_DURATION)) {
    console.log("MarketingService: Loaded ads from cache (Saved Firestore Reads)");
    return cachedAds;
  }

  try {
    const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'marketing_ads');
    // ดึงเฉพาะโฆษณาที่เปิดใช้งานอยู่
    const q = query(adsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    const ads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // บันทึกลง Cache
    cachedAds = ads;
    adsFetchTime = now;
    
    return ads;
  } catch (error) {
    console.error("MarketingService: Error fetching active ads:", error);
    // หาก Error ให้ส่งคืน Cache เก่า (ถ้ามี) เพื่อไม่ให้หน้าเว็บพัง
    return cachedAds || [];
  }
};

/**
 * ดึงข้อมูลแผ่นป้ายโฆษณา (Banners) ที่มีสถานะ 'active'
 * @param {boolean} forceRefresh - บังคับดึงข้อมูลใหม่จาก Firestore โดยไม่ใช้ Cache
 * @returns {Promise<Array>} - Array ของข้อมูลแบนเนอร์
 */
export const getActiveBanners = async (forceRefresh = false) => {
  const now = Date.now();

  if (!forceRefresh && cachedBanners && (now - bannersFetchTime < CACHE_DURATION)) {
    console.log("MarketingService: Loaded banners from cache (Saved Firestore Reads)");
    return cachedBanners;
  }

  try {
    const bannersRef = collection(db, 'artifacts', appId, 'public', 'data', 'marketing_banners');
    // ดึงเฉพาะแบนเนอร์ที่เปิดใช้งานอยู่
    const q = query(bannersRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    const banners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    cachedBanners = banners;
    bannersFetchTime = now;
    
    return banners;
  } catch (error) {
    console.error("MarketingService: Error fetching active banners:", error);
    return cachedBanners || [];
  }
};

/**
 * ล้าง Cache ทั้งหมด (เรียกใช้เมื่อแอดมินหรือระบบต้องการบังคับล้างเพื่ออัปเดตทันที)
 */
export const clearMarketingCache = () => {
  cachedAds = null;
  cachedBanners = null;
  adsFetchTime = 0;
  bannersFetchTime = 0;
  console.log("MarketingService: Cache cleared");
};

// ==========================================
// ส่งออก Object หลัก เพื่อป้องกัน Error กับระบบเก่าที่ import { marketingService }
// ==========================================
export const marketingService = {
  getActiveAds,
  getActiveBanners,
  clearMarketingCache
};