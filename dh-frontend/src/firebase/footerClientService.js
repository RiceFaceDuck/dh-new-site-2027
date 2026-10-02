import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { safeJsonParse } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { CANONICAL_DEFAULT_FOOTER_CONFIG } from 'dh-shared';

const FOOTER_DOC = 'footer_config';
const STOREFRONT_DOC = 'storefront_config';
const CACHE_KEY = 'dh_footer_config_cache';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 ชั่วโมง

export const footerClientService = {
  getFooterConfig: async () => {
    // 1. อ่านจาก Session Storage ก่อน เพื่อประหยัด Quota Read
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = safeJsonParse(cached);
        const isExpired = Date.now() - parsedCache?.timestamp > CACHE_EXPIRY_MS;
        
        if (!isExpired && parsedCache?.data) {
          return parsedCache.data;
        }
      }
    } catch (e) {
      console.warn("Failed to read footer cache:", e);
    }

    // 2. ถ้าไม่มี Cache หรือ Cache หมดอายุ ให้ดึงจาก Firestore (Dual-Source Parity)
    try {
      let configData = null;

      // อ่านจาก storefront_config.footer ก่อนเพื่อให้ได้ข้อมูลล่าสุดตรงกับระบบรวมศูนย์
      const storefrontRef = doc(db, getCollectionPath('settings'), STOREFRONT_DOC);
      const storefrontSnap = await getDoc(storefrontRef);
      if (storefrontSnap.exists() && storefrontSnap.data()?.footer) {
        configData = { ...CANONICAL_DEFAULT_FOOTER_CONFIG, ...storefrontSnap.data().footer };
      } else {
        // Fallback ไปยัง footer_config doc
        const footerRef = doc(db, getCollectionPath('settings'), FOOTER_DOC);
        const footerSnap = await getDoc(footerRef);
        if (footerSnap.exists()) {
          configData = { ...CANONICAL_DEFAULT_FOOTER_CONFIG, ...footerSnap.data() };
        }
      }

      if (!configData) {
        configData = CANONICAL_DEFAULT_FOOTER_CONFIG;
      }

      // 3. เซฟลง Cache เพื่อใช้ในครั้งต่อไป
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: configData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn("Failed to set footer cache:", e);
      }

      return configData;
    } catch (error) {
      console.error("🔥 Error fetching footer config:", error);
      return CANONICAL_DEFAULT_FOOTER_CONFIG;
    }
  }
};

export default footerClientService;
