import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

import { safeJsonParse } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
export const DEFAULT_THEME_CONFIG = {
  themeId: 'theme-trusted-partner', // เปลี่ยนค่าเริ่มต้นเป็น theme ใหม่
  backgroundUrl: '',
  blurLevel: '16',
  opacityTop: 75,
  opacityMid: 55,
  opacityBottom: 35
};

const CACHE_KEY = 'dh_storefront_theme_cache';

export function useStorefrontTheme() {
  const [themeConfig, setThemeConfig] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? safeJsonParse(cached) : DEFAULT_THEME_CONFIG;
    } catch (e) {
      return DEFAULT_THEME_CONFIG;
    }
  });

  useEffect(() => {
    const docRef = doc(db, getCollectionPath('settings'), 'storefrontTheme');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const newTheme = { ...DEFAULT_THEME_CONFIG, ...docSnap.data() };
        setThemeConfig(newTheme);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newTheme));
      }
    }, (error) => {
      console.error("🔥 Error listening to storefront theme:", error);
    });

    return () => unsubscribe();
  }, []);

  return themeConfig;
}
