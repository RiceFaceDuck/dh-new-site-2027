import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

import { safeJsonParse } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
const HERO_DOC = 'hero_config';

export const DEFAULT_HERO_CONFIG = {
  isActive: true,
  title: '<span class="text-yellow-400">TEQFIX:</span> YOUR CERTIFIED PARTNER <br class="hidden md:block" /> FOR ELECTRONIC REPAIRS & <br class="hidden md:block" /> GENUINE SPARES.',
  titleSegments: [
    { text: 'TEQFIX: ', isHighlight: true, breakDesktop: false, breakAll: false },
    { text: 'YOUR CERTIFIED PARTNER ', isHighlight: false, breakDesktop: true, breakAll: false },
    { text: 'FOR ELECTRONIC REPAIRS & ', isHighlight: false, breakDesktop: true, breakAll: false },
    { text: 'GENUINE SPARES.', isHighlight: false, breakDesktop: false, breakAll: false }
  ],
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
  },
  overlay: {
    color: '#1f2937',
    opacity: 90
  }
};

const CACHE_KEY = 'dh_hero_config_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 mins

export const storefrontSettingsService = {
  /**
   * ดึงข้อมูลการตั้งค่าป้ายโฆษณาหลัก (Hero Billboard) พร้อมระบบ Cache ใน LocalStorage
   */
  getHeroConfig: async () => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = safeJsonParse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              return data;
            }
          } catch (e) {
            console.warn("Malformed hero config cache. Refreshing.");
          }
        }
      }

      const docRef = doc(db, getCollectionPath('settings'), HERO_DOC);
      const snap = await getDoc(docRef);
      let result = DEFAULT_HERO_CONFIG;
      if (snap.exists()) {
        result = { ...DEFAULT_HERO_CONFIG, ...snap.data() };
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      }

      return result;
    } catch (error) {
      console.error("🔥 Error fetching hero config:", error);
      // Fallback: ดึงแคชเก่ามาใช้ต่อถ้ามี แม้จะหมดอายุแล้ว ดีกว่าพังหรือแสดงหน้าเว็บว่างเปล่า
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data } = safeJsonParse(cached);
            return data;
          } catch (e) {
            // ignore
          }
        }
      }
      return DEFAULT_HERO_CONFIG;
    }
  },

  getActiveFreebies: async () => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, getCollectionPath('freebies')), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error fetching active freebies:", error);
      return [];
    }
  },

  getActiveShippingRules: async () => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, getCollectionPath('shipping_rules')), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error fetching active shipping rules:", error);
      return [];
    }
  }
};
