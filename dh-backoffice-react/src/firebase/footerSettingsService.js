import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const FOOTER_DOC = 'footer_config';
const STOREFRONT_DOC = 'storefront_config';

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
  socialHub: {
    enabled: true,
    facebook: 'https://facebook.com/dhnotebook',
    tiktok: 'https://tiktok.com/@dhnotebook',
    line: 'https://line.me/ti/p/~@dhnotebook',
    youtube: 'https://youtube.com/@dhnotebook',
    instagram: 'https://instagram.com/dhnotebook'
  },
  trustBadges: {
    enabled: true,
    badges: [
      { id: 'b2bPartner', label: 'VERIFIED B2B PARTNER', icon: 'ShieldCheck', active: true, description: 'พันธมิตรช่างซ่อมและร้านค้าทั่วประเทศ' },
      { id: 'dbdRegistered', label: 'DBD REGISTERED', icon: 'Award', active: true, description: 'จดทะเบียนพาณิชย์อิเล็กทรอนิกส์ถูกต้อง' },
      { id: 'genuineWarranty', label: 'รับประกันของแท้ 100%', icon: 'CheckCircle2', active: true, description: 'มั่นใจในคุณภาพสินค้าทุกชิ้น' },
      { id: 'expressDelivery', label: 'จัดส่งด่วน 24 ชม.', icon: 'Truck', active: true, description: 'จัดส่งรวดเร็วทั่วไทย ถึงมือทันใจ' }
    ]
  },
  businessHours: {
    openHours: '10:00',
    closeHours: '19:30',
    days: 'เปิดบริการทุกวัน (จันทร์ - อาทิตย์)',
    note: 'ศูนย์บริการเซียร์รังสิตเปิดทำการตามเวลาห้างสรรพสินค้า',
    emergencyCare: {
      available: true,
      phone: '081-xxx-xxxx',
      label: 'สายด่วนช่าง 24 ชม.',
      note: 'ปรึกษาปัญหาฮาร์ดแวร์เร่งด่วนนอกเวลาทำการ'
    }
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
      const storefrontRef = doc(db, getCollectionPath('settings'), STOREFRONT_DOC);
      const storefrontSnap = await getDoc(storefrontRef);
      if (storefrontSnap.exists() && storefrontSnap.data()?.footer) {
        return { ...DEFAULT_FOOTER_CONFIG, ...storefrontSnap.data().footer };
      }

      const footerRef = doc(db, getCollectionPath('settings'), FOOTER_DOC);
      const footerSnap = await getDoc(footerRef);
      if (footerSnap.exists()) {
        return { ...DEFAULT_FOOTER_CONFIG, ...footerSnap.data() };
      }

      return DEFAULT_FOOTER_CONFIG;
    } catch (error) {
      console.error("🔥 Error fetching footer config:", error);
      return DEFAULT_FOOTER_CONFIG;
    }
  },

  updateFooterConfig: async (configData) => {
    try {
      const batch = writeBatch(db);
      const storefrontRef = doc(db, getCollectionPath('settings'), STOREFRONT_DOC);
      batch.set(storefrontRef, {
        footer: configData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const footerRef = doc(db, getCollectionPath('settings'), FOOTER_DOC);
      batch.set(footerRef, {
        ...configData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      return { success: true, message: 'บันทึกการตั้งค่า Footer สำเร็จ', data: configData };
    } catch (error) {
      console.error("🔥 Error updating footer config:", error);
      throw error;
    }
  }
};

export default footerSettingsService;
