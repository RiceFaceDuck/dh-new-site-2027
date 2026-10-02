import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config.js';
import { historyService } from './historyService.js';
import { getCollectionPath } from 'dh-shared';

const SETTINGS_DOC = 'platform_links';
const MARKETING_DOC = 'marketing'; // 🎯 อ้างอิงเอกสารสำหรับการตั้งค่าการตลาดโฆษณา
const THEME_DOC = 'storefrontTheme'; // 🎨 อ้างอิงเอกสารสำหรับการตั้งค่าธีมหน้าบ้าน

const STOREFRONT_CONFIG_DOC = 'storefront_config'; // 🛍️ อ้างอิงเอกสารหลักสำหรับคอนฟิกหน้าบ้านรวม

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

// 💡 Default Role & Tier Settings
export const DEFAULT_ROLE_TIER_SETTINGS = {
  roles: [
    { id: 'member', name: 'Member / General', level: 1, description: 'ลูกค้าทั่วไป / สมาชิกเริ่มต้น', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200', defaultPriceTier: 'retail' },
    { id: 'wholesale', name: 'Wholesale / Mechanic', level: 2, description: 'ช่างซ่อม / ราคาส่งทั่วไป', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200', defaultPriceTier: 'wholesale' },
    { id: 'partner', name: 'VIP / Retail Partner', level: 3, description: 'ร้านค้าพันธมิตร / VIP', badgeColor: 'bg-slate-800 text-white border-slate-800', defaultPriceTier: 'partner' },
    { id: 'enterprise', name: 'Enterprise Partner', level: 4, description: 'คู่ค้าใหญ่ระดับองค์กร / สัญญารายปี', badgeColor: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', defaultPriceTier: 'enterprise' }
  ],
  tiers: [
    { id: 'member', name: 'Member', icon: '🌟', minPoints: 0, multiplier: 1.0, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'silver', name: 'Silver', icon: '🥈', minPoints: 1000, multiplier: 1.05, color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { id: 'gold', name: 'Gold', icon: '🥇', minPoints: 5000, multiplier: 1.10, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'platinum', name: 'Platinum', icon: '👑', minPoints: 10000, multiplier: 1.20, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'diamond', name: 'Diamond', icon: '💎', minPoints: 100000, multiplier: 1.50, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' }
  ],
  hierarchyPolicy: {
    allowManualRoleOverride: true,
    autoTierCalculation: true,
    inheritTierDiscount: true
  }
};

let cachedRoleTierConfig = null;
let lastRoleTierFetch = 0;
const ROLE_TIER_TTL = 5 * 60 * 1000; // 5 นาที In-Memory Cache เพื่อ Zero Quota Leak

export const settingsService = {
  // ==========================================
  // 1. ระบบจัดการ Platform Links Regex (ระบบเดิม)
  // ==========================================
  getPlatformRegex: async () => {
    try {
      const docRef = doc(db, getCollectionPath('settings'), SETTINGS_DOC);
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
      const docRef = doc(db, getCollectionPath('settings'), SETTINGS_DOC);
      await setDoc(docRef, {
        ...regexData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await historyService.addLog('Settings', 'Update', SETTINGS_DOC, 'อัปเดตการตั้งค่า Platform Links', auth.currentUser?.uid);
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
      const docRef = doc(db, getCollectionPath('settings'), MARKETING_DOC);
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
      const docRef = doc(db, getCollectionPath('settings'), MARKETING_DOC);
      
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
      
      await historyService.addLog('Settings', 'Update', MARKETING_DOC, 'อัปเดตเรทราคาเครดิตโฆษณา', auth.currentUser?.uid);
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
      // 1. อ่านจาก storefront_config ก่อน (โครงสร้างใหม่)
      const configDocRef = doc(db, getCollectionPath('settings'), STOREFRONT_CONFIG_DOC);
      const configSnap = await getDoc(configDocRef);
      if (configSnap.exists() && configSnap.data()?.theme) {
        return { ...DEFAULT_THEME_CONFIG, ...configSnap.data().theme };
      }

      // 2. Fallback อ่านจาก storefrontTheme (โครงสร้างเดิม)
      const docRef = doc(db, getCollectionPath('settings'), THEME_DOC);
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
      // 1. Dual-Write ไปยัง storefront_config.theme
      const configDocRef = doc(db, getCollectionPath('settings'), STOREFRONT_CONFIG_DOC);
      await setDoc(configDocRef, {
        theme: themeConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Dual-Write ไปยัง storefrontTheme (รักษาความเข้ากันได้ย้อนหลัง 100%)
      const themeDocRef = doc(db, getCollectionPath('settings'), THEME_DOC);
      await setDoc(themeDocRef, {
        ...themeConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. บันทึกประวัติการแก้ไขจุดเดียว (Single Source of Truth)
      await historyService.addLog('Settings', 'Update', THEME_DOC, 'อัปเดตการตั้งค่าธีมหน้าบ้าน', auth.currentUser?.uid);
      return { success: true, message: 'บันทึกการตั้งค่าธีมหน้าบ้านสำเร็จ' };
    } catch (error) {
      console.error("🔥 Error updating storefront theme:", error);
      throw error;
    }
  },

  // ==========================================
  // 5. ระบบ Role & Tier Configuration (Cached)
  // ==========================================
  getRoleTierConfig: async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cachedRoleTierConfig && (now - lastRoleTierFetch < ROLE_TIER_TTL)) {
      return cachedRoleTierConfig;
    }
    try {
      const docRef = doc(db, getCollectionPath('settings'), 'role_tier_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        cachedRoleTierConfig = { ...DEFAULT_ROLE_TIER_SETTINGS, ...snap.data() };
      } else {
        cachedRoleTierConfig = DEFAULT_ROLE_TIER_SETTINGS;
      }
      lastRoleTierFetch = now;
      return cachedRoleTierConfig;
    } catch (error) {
      console.warn("Could not fetch role_tier_config from Firestore, using cache/defaults:", error);
      return cachedRoleTierConfig || DEFAULT_ROLE_TIER_SETTINGS;
    }
  },

  clearRoleTierCache: () => {
    cachedRoleTierConfig = null;
    lastRoleTierFetch = 0;
  }
};

export default settingsService;