import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const FOOTER_DOC = 'footer_config';

export const DEFAULT_FOOTER_CONFIG = {
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
    { id: 'q1', label: 'อะไหล่ภายใน', url: '#' },
    { id: 'q2', label: 'อุปกรณ์ภายนอก', url: '#' },
    { id: 'q3', label: 'เครื่องมือช่าง', url: '#' },
    { id: 'q4', label: 'โปรโมชั่นพาร์ทเนอร์', url: '#' }
  ],
  supportLinks: [
    { id: 's1', label: 'คู่มือการใช้งานระบบ', url: '#' },
    { id: 's2', label: 'เงื่อนไขการรับประกัน (Claim)', url: '#' },
    { id: 's3', label: 'สมัครตัวแทนจำหน่าย', url: '#' },
    { id: 's4', label: 'ติดตามสถานะคำสั่งซื้อ', url: '#' }
  ]
};

export const footerSettingsService = {
  getFooterConfig: async () => {
    try {
      const docRef = doc(db, 'settings', FOOTER_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_FOOTER_CONFIG, ...snap.data() };
      }
      return DEFAULT_FOOTER_CONFIG;
    } catch (error) {
      console.error("🔥 Error fetching footer config:", error);
      return DEFAULT_FOOTER_CONFIG;
    }
  },

  updateFooterConfig: async (configData) => {
    try {
      const docRef = doc(db, 'settings', FOOTER_DOC);
      await setDoc(docRef, {
        ...configData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { success: true, message: 'บันทึกการตั้งค่า Footer สำเร็จ' };
    } catch (error) {
      console.error("🔥 Error updating footer config:", error);
      throw error;
    }
  }
};

export default footerSettingsService;
