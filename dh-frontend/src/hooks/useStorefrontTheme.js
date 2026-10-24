import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { safeJsonParse } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const DEFAULT_THEME_CONFIG = {
  themeId: 'theme-trusted-partner', // ค่าเริ่มต้นเป็น theme ใหม่
  backgroundUrl: '',
  blurLevel: '16',
  opacityTop: 75,
  opacityMid: 55,
  opacityBottom: 35
};

const CACHE_KEY = 'dh_storefront_theme_cache_v2';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 ชั่วโมงเพื่อประหยัดโควต้าอ่าน 100%

export function useStorefrontTheme() {
  const [themeConfig, setThemeConfig] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = safeJsonParse(cached);
        if (parsed?.data) return parsed.data;
      }
      return DEFAULT_THEME_CONFIG;
    } catch (e) {
      return DEFAULT_THEME_CONFIG;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const loadThemeConfig = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = safeJsonParse(cached);
          const now = Date.now();
          // หากแคชยังไม่หมดอายุ (1 ชม.) ใช้ของเดิมทันที: 0 Reads, 0 Listener
          if (parsed?.timestamp && (now - parsed.timestamp) < CACHE_TTL_MS && parsed?.data) {
            return;
          }
        }

        // ดึงแบบ Single Fetch เมื่อหมดอายุ (1 Read เท่านั้น ไม่เปิด Listener ทิ้งไว้)
        const docRef = doc(db, getCollectionPath('settings'), 'storefrontTheme');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          const newTheme = { ...DEFAULT_THEME_CONFIG, ...docSnap.data() };
          setThemeConfig(newTheme);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: newTheme,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.warn("⚠️ [StorefrontTheme] Error fetching theme:", error);
      }
    };

    loadThemeConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  return themeConfig;
}
