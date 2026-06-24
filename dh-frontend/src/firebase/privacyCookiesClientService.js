import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

const PRIVACY_DOC = 'privacy_cookies_config';
const CACHE_KEY = 'dh_privacy_config_cache';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 ชั่วโมง

const DEFAULT_PRIVACY_CONFIG = {
  logoUrl: "https://firebasestorage.googleapis.com/v0/b/dh-notebook-frontend.appspot.com/o/system_assets%2Fdh-logo.png?alt=media",
  bannerText: "เว็บไซต์นี้มีการใช้งานคุกกี้ (Cookies) เพื่อมอบประสบการณ์ที่ดีที่สุดในการใช้งานเว็บไซต์ให้แก่คุณ รวมถึงเพื่อช่วยปรับปรุงบริการของเราให้ดียิ่งขึ้น คุณสามารถอ่านรายละเอียดเพิ่มเติมได้ที่ นโยบายความเป็นส่วนตัว",
  policyLinks: {
    privacyPolicyUrl: "/privacy-policy",
    cookiePolicyUrl: "/cookie-policy",
    termsOfServiceUrl: "/terms-of-service"
  },
  cookieTypes: [
    {
      id: "necessary",
      name: "Strictly Necessary Cookies",
      description: "คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานของเว็บไซต์ เพื่อให้เว็บไซต์สามารถทำงานได้เป็นปกติ และไม่สามารถปิดการใช้งานในระบบของเราได้",
      isMandatory: true,
      defaultEnabled: true
    },
    {
      id: "analytics",
      name: "Analytics Cookies",
      description: "คุกกี้ประเภทนี้ช่วยให้เราทราบถึงการปฏิสัมพันธ์ของผู้ใช้งานในการใช้บริการเว็บไซต์ รวมถึงช่วยให้เราสามารถวัดผลและปรับปรุงประสิทธิภาพการทำงานของเว็บไซต์ให้ดียิ่งขึ้น",
      isMandatory: false,
      defaultEnabled: true
    },
    {
      id: "marketing",
      name: "Marketing & Targeting Cookies",
      description: "คุกกี้ประเภทนี้จะถูกกำหนดผ่านเว็บไซต์ของเราโดยพาร์ทเนอร์โฆษณา เพื่อสร้างโปรไฟล์เกี่ยวกับความสนใจของคุณ และแสดงโฆษณาที่เกี่ยวข้องบนเว็บไซต์อื่นๆ",
      isMandatory: false,
      defaultEnabled: false
    }
  ]
};

export const privacyCookiesClientService = {
  getConfig: async () => {
    // 1. อ่านจาก Session Storage ก่อน เพื่อประหยัด Firestore Reads
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = new Date().getTime();
        if (now - timestamp < CACHE_EXPIRY_MS) {
          return data;
        }
      }
    } catch (err) {
      console.warn("Cookie cache parse error:", err);
    }

    // 2. ถ้าแคชหมดอายุหรือไม่มีแคช ให้ดึงจาก Firestore
    try {
      const docRef = doc(db, 'settings', PRIVACY_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const mergedData = { ...DEFAULT_PRIVACY_CONFIG, ...data };
        
        // 3. เซฟลง Session Storage
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: mergedData,
          timestamp: new Date().getTime()
        }));

        return mergedData;
      } else {
        return DEFAULT_PRIVACY_CONFIG;
      }
    } catch (error) {
      console.error("Error fetching privacy config:", error);
      return DEFAULT_PRIVACY_CONFIG;
    }
  }
};
