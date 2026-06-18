import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const SETTINGS_DOC = 'platform_links';
const MARKETING_DOC = 'marketing'; // 🎯 อ้างอิงเอกสารสำหรับการตั้งค่าการตลาดโฆษณา
const THEME_DOC = 'storefrontTheme'; // 🎨 อ้างอิงเอกสารสำหรับการตั้งค่าธีมหน้าบ้าน
const HERO_DOC = 'hero_config'; // 🖼️ อ้างอิงเอกสารสำหรับป้ายโฆษณาหน้าแรก

// 💡 Default Regex ในกรณีที่ยังไม่มีข้อมูลใน Database (ป้องกัน Error)
export const DEFAULT_REGEX = {
  shopee: '(shopee\\.co\\.th|s\\.shopee\\.co\\.th)',
  lazada: '(lazada\\.co\\.th|c\\.lazada\\.co\\.th|s\\.lazada\\.co\\.th)',
  tiktok: '(tiktok\\.com|vt\\.tiktok\\.com|shop\\.tiktok\\.com)',
  facebook: '(facebook\\.com|fb\\.me|fb\\.watch)'
};

// 💡 Default Ad Rates สำหรับระบบโฆษณา (อิงตามแผน Phase 3 & 4)
// ปกป้องระบบในกรณีที่ Database ยังไม่มีข้อมูล จะดึงค่าดั้งเดิมเหล่านี้ไปใช้งานทันที
export const DEFAULT_AD_RATES = {
  costPerView: 1,     // ค่าเริ่มต้น: 1 Credit / 1 View
  costPerClick: 5,    // ค่าเริ่มต้น: 5 Credits / 1 Click
  displayRatio: 10    // ค่าเริ่มต้น: อัตราส่วนโฆษณา 10:1
};

// 💡 Default Storefront Theme (ถ้ายังไม่ได้ตั้งค่าจากหลังบ้าน)
export const DEFAULT_THEME_CONFIG = {
  backgroundUrl: '/user-bg.jpg',
  blurLevel: '16', // px
  opacityTop: 75,
  opacityMid: 55,
  opacityBottom: 35
};

// 💡 Default Hero Banner Config
export const DEFAULT_HERO_CONFIG = {
  isActive: true,
  title: '<span class="text-yellow-400">TEQFIX:</span> YOUR CERTIFIED PARTNER <br class="hidden md:block" /> FOR ELECTRONIC REPAIRS & <br class="hidden md:block" /> GENUINE SPARES.',
  imageUrl: 'https://images.unsplash.com/photo-1591405351990-4726e331f14c?w=1200&q=80',
  primaryButton: {
    label: 'BOOK A SQUAD',
    link: '/squad',
    isActive: true
  },
  secondaryButton: {
    label: 'SHOP SPARES',
    link: '/category/all',
    isActive: true
  }
};

export const settingsService = {
  // ==========================================
  // 1. ระบบจัดการ Platform Links Regex (ระบบเดิม)
  // ==========================================
  getPlatformRegex: async () => {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_REGEX, ...snap.data() };
      }
      return DEFAULT_REGEX;
    } catch (error) {
      console.error("🔥 Error fetching platform regex:", error);
      return DEFAULT_REGEX;
    }
  },

  updatePlatformRegex: async (regexData) => {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC);
      await setDoc(docRef, {
        ...regexData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("🔥 Error updating platform regex:", error);
      throw error;
    }
  },

  // ==========================================
  // 2. ระบบจัดการเรทราคาโฆษณาและอัตราส่วน (Marketing Settings) [ใหม่]
  // ==========================================
  
  /**
   * ดึงค่าคอนฟิกการหักเครดิตโฆษณาจาก Database
   */
  getAdRates: async () => {
    try {
      const docRef = doc(db, 'settings', MARKETING_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        // นำข้อมูลใน DB มาเขียนทับ Default ถ้าอันไหนใน DB ไม่มีจะใช้ค่า Default ทันที
        return { ...DEFAULT_AD_RATES, ...snap.data() };
      }
      return DEFAULT_AD_RATES;
    } catch (error) {
      console.error("🔥 Error fetching ad rates:", error);
      return DEFAULT_AD_RATES;
    }
  },

  /**
   * อัปเดตและบันทึกค่าคอนฟิกการหักเครดิตโฆษณา
   */
  updateAdRates: async (ratesData) => {
    try {
      const docRef = doc(db, 'settings', MARKETING_DOC);
      
      // แปลงข้อมูลที่รับมาให้มั่นใจว่าเป็นตัวเลขเสมอ (ป้องกันความผิดพลาดตอนนำไปคำนวณ)
      const cleanData = {
        costPerView: Number(ratesData.costPerView) || 0,
        costPerClick: Number(ratesData.costPerClick) || 0,
        displayRatio: Number(ratesData.displayRatio) || 0,
      };

      await setDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return { success: true, message: 'บันทึกการตั้งค่าเรทโฆษณาสำเร็จ' };
    } catch (error) {
      console.error("🔥 Error updating ad rates:", error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่าโฆษณา' };
    }
  },

  // ==========================================
  // 3. ระบบจัดการธีมหน้าบ้าน (Storefront Theme) [ใหม่]
  // ==========================================
  
  getStorefrontTheme: async () => {
    try {
      const docRef = doc(db, 'settings', THEME_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_THEME_CONFIG, ...snap.data() };
      }
      return DEFAULT_THEME_CONFIG;
    } catch (error) {
      console.error("🔥 Error fetching storefront theme:", error);
      return DEFAULT_THEME_CONFIG;
    }
  },

  updateStorefrontTheme: async (themeConfig) => {
    try {
      const docRef = doc(db, 'settings', THEME_DOC);
      await setDoc(docRef, {
        ...themeConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true, message: 'บันทึกการตั้งค่าธีมหน้าบ้านสำเร็จ' };
    } catch (error) {
      console.error("🔥 Error updating storefront theme:", error);
      throw error;
    }
  },

  // ==========================================
  // 4. ระบบจัดการป้ายโฆษณาหน้าแรก (Hero Billboard) [ใหม่]
  // ==========================================
  
  getHeroConfig: async () => {
    try {
      const docRef = doc(db, 'settings', HERO_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_HERO_CONFIG, ...snap.data() };
      }
      return DEFAULT_HERO_CONFIG;
    } catch (error) {
      console.error("🔥 Error fetching hero config:", error);
      return DEFAULT_HERO_CONFIG;
    }
  },

  updateHeroConfig: async (heroConfig) => {
    try {
      const docRef = doc(db, 'settings', HERO_DOC);
      await setDoc(docRef, {
        ...heroConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true, message: 'บันทึกการตั้งค่าป้ายหน้าแรกสำเร็จ' };
    } catch (error) {
      console.error("🔥 Error updating hero config:", error);
      throw error;
    }
  }
};

export default settingsService;