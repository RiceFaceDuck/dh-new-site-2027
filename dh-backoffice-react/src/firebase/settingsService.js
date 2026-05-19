import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const SETTINGS_DOC = 'platform_links';
const MARKETING_DOC = 'marketing'; // 🎯 อ้างอิงเอกสารสำหรับการตั้งค่าการตลาดโฆษณา

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
  }
};

export default settingsService;