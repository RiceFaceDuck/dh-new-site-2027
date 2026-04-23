import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const SETTINGS_DOC = 'platform_links';

// 💡 Default Regex ในกรณีที่ยังไม่มีข้อมูลใน Database (ป้องกัน Error)
export const DEFAULT_REGEX = {
  shopee: '(shopee\\.co\\.th|s\\.shopee\\.co\\.th)',
  lazada: '(lazada\\.co\\.th|c\\.lazada\\.co\\.th|s\\.lazada\\.co\\.th)',
  tiktok: '(tiktok\\.com|vt\\.tiktok\\.com|shop\\.tiktok\\.com)',
  facebook: '(facebook\\.com|fb\\.me|fb\\.watch)'
};

export const settingsService = {
  // ดึงกฎ Regex ทั้งหมด
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

  // บันทึกกฎ Regex ใหม่ (ใช้งานโดย Manager)
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
  }
};