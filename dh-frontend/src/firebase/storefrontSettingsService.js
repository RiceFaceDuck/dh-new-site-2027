import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

const HERO_DOC = 'hero_config';

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

export const storefrontSettingsService = {
  /**
   * ดึงข้อมูลการตั้งค่าป้ายโฆษณาหลัก (Hero Billboard)
   */
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
  }
};
