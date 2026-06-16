import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

const FOOTER_DOC = 'footer_config';
const CACHE_KEY = 'dh_footer_config_cache';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 ชั่วโมง

const DEFAULT_FOOTER_CONFIG = {
  colors: {
    bgDark: 'slate-900',
    textMuted: 'slate-400',
    primaryAccent: 'cyber-blue'
  },
  company: {
    logoUrl: '/logo.png',
    description: 'ผู้นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร พร้อมเครือข่ายช่างพันธมิตรทั่วประเทศ ที่พร้อมให้บริการคุณด้วยระบบปฏิบัติการอัจฉริยะ',
    address: 'ศูนย์การค้าเซียร์รังสิต ชั้น 3 ห้อง xxx ถ.พหลโยธิน จ.ปทุมธานี 12130',
    lineId: '@dhnotebook',
    lineAddFriendUrl: 'https://line.me/ti/p/~@dhnotebook',
    phone: '02-xxx-xxxx'
  },
  quickLinks: [
    { id: 'q1', label: 'อะไหล่ภายใน', url: '/categories/inside' },
    { id: 'q2', label: 'อุปกรณ์ภายนอก', url: '/categories/outside' },
    { id: 'q3', label: 'เครื่องมือช่าง', url: '/categories/tools' },
    { id: 'q4', label: 'โปรโมชั่นพาร์ทเนอร์', url: '/promotions' }
  ],
  supportLinks: [
    { id: 's1', label: 'คู่มือการใช้งานระบบ', url: '/help/manual' },
    { id: 's2', label: 'เงื่อนไขการรับประกัน (Claim)', url: '/help/warranty' },
    { id: 's3', label: 'สมัครตัวแทนจำหน่าย', url: '/register/partner' },
    { id: 's4', label: 'ติดตามสถานะคำสั่งซื้อ', url: '/tracking' }
  ]
};

export const footerClientService = {
  getFooterConfig: async () => {
    // 1. ลองอ่านจาก Session Storage ก่อน (ช่วยประหยัด Read มหาศาล)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const isExpired = Date.now() - parsedCache.timestamp > CACHE_EXPIRY_MS;
        
        if (!isExpired) {
          return parsedCache.data;
        }
      }
    } catch (e) {
      console.warn("Failed to read footer cache:", e);
    }

    // 2. ถ้าไม่มี Cache หรือ Cache หมดอายุ ให้ดึงจาก Firebase
    try {
      const docRef = doc(db, 'settings', FOOTER_DOC);
      const snap = await getDoc(docRef);
      let configData = DEFAULT_FOOTER_CONFIG;
      
      if (snap.exists()) {
        configData = { ...DEFAULT_FOOTER_CONFIG, ...snap.data() };
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
      return DEFAULT_FOOTER_CONFIG;
    }
  }
};

export default footerClientService;
