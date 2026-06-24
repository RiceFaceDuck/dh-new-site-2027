import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const PRIVACY_DOC = 'privacy_cookies_config';

export const DEFAULT_PRIVACY_CONFIG = {
  logoUrl: 'https://firebasestorage.googleapis.com/v0/b/dh-notebook-new.appspot.com/o/public%2Flogo%2Fdh-logo-square.png?alt=media', 
  bannerText: 'เว็บไซต์นี้มีการใช้งานคุกกี้ เพื่อเพิ่มประสิทธิภาพและประสบการณ์ที่ดีในการใช้งานเว็บไซต์ของท่าน ท่านสามารถอ่านรายละเอียดเพิ่มเติมได้ที่ นโยบายความเป็นส่วนตัว และ นโยบายคุกกี้',
  policyLinks: {
    privacyPolicyUrl: '/privacy-policy',
    cookiePolicyUrl: '/cookie-policy'
  },
  consentTexts: {
    registration: 'ฉันยอมรับ [terms] และ [privacy]',
    checkout: 'ข้าพเจ้าได้อ่านและยอมรับ [terms] และ [privacy] ของบริษัทแล้ว',
    scanner: 'รูปแบบการทำงาน: โปรแกรมนี้ทำงานโดยการอ่านค่ารหัสประจำตัวอุปกรณ์ (Hardware IDs) จากระบบปฏิบัติการ ซึ่งเป็นข้อมูลทางเทคนิคของชิ้นส่วนต่างๆ ในระดับฮาร์ดแวร์ (เช่น รหัสจอกระจก, รุ่นเมนบอร์ด) โดยไม่มีการเข้าถึงไฟล์ส่วนตัว เอกสาร หรือรหัสผ่านใดๆ ทั้งสิ้น\n\nการจัดเก็บข้อมูล: เมื่อโปรแกรมทำงานเสร็จสิ้น ผลลัพธ์สเปคเครื่องจะแสดงบนหน้าเว็บไซต์นี้ และหากคุณเข้าสู่ระบบอยู่ ข้อมูลสเปคเครื่องนี้จะถูกบันทึกลงในโปรไฟล์บัญชีของคุณโดยอัตโนมัติ เพื่อใช้ประโยชน์ในการเทียบอะไหล่ให้ตรงรุ่นแบบ 100% และใช้เป็นข้อมูลอ้างอิงในการรับประกันสินค้าของ DH Notebook'
  },
  cookieTypes: [
    {
      id: 'necessary',
      name: 'คุกกี้ที่มีความจำเป็น (Necessary)',
      description: 'คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานของเว็บไซต์ เพื่อให้เว็บไซต์สามารถทำงานได้เป็นปกติ',
      isMandatory: true,
      isEnabled: true
    },
    {
      id: 'analytics',
      name: 'คุกกี้เพื่อการวิเคราะห์ (Analytics)',
      description: 'คุกกี้ประเภทนี้จะช่วยให้เว็บไซต์สามารถจดจำและนับจำนวนผู้เข้าชมเว็บไซต์ ตลอดจนช่วยให้เว็บไซต์ทราบถึงพฤติกรรมในการเยี่ยมชมเว็บไซต์',
      isMandatory: false,
      isEnabled: true
    },
    {
      id: 'marketing',
      name: 'คุกกี้เพื่อการโฆษณา (Marketing)',
      description: 'คุกกี้ประเภทนี้จะถูกจดจำการเข้าสู่หน้าเว็บไซต์ และนำเสนอโฆษณาที่เกี่ยวข้องและตรงกับความสนใจของท่าน',
      isMandatory: false,
      isEnabled: false
    }
  ]
};

export const privacyCookiesService = {
  getPrivacyConfig: async () => {
    try {
      const docRef = doc(db, 'settings', PRIVACY_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_PRIVACY_CONFIG, ...snap.data() };
      }
      return DEFAULT_PRIVACY_CONFIG;
    } catch (error) {
      console.error("🔥 Error fetching privacy config:", error);
      return DEFAULT_PRIVACY_CONFIG;
    }
  },

  updatePrivacyConfig: async (configData) => {
    try {
      const docRef = doc(db, 'settings', PRIVACY_DOC);
      await setDoc(docRef, {
        ...configData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true, message: 'บันทึกการตั้งค่า Privacy & Cookies สำเร็จ' };
    } catch (error) {
      console.error("🔥 Error updating privacy config:", error);
      throw error;
    }
  }
};

export default privacyCookiesService;
