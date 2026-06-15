import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const DEFAULT_THEME_CONFIG = {
  backgroundUrl: '/user-bg.jpg',
  blurLevel: '16',
  opacityTop: 75,
  opacityMid: 55,
  opacityBottom: 35
};

export function useStorefrontTheme() {
  const [themeConfig, setThemeConfig] = useState(DEFAULT_THEME_CONFIG);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'storefrontTheme');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setThemeConfig({ ...DEFAULT_THEME_CONFIG, ...docSnap.data() });
      }
    }, (error) => {
      console.error("🔥 Error listening to storefront theme:", error);
    });

    return () => unsubscribe();
  }, []);

  return themeConfig;
}
