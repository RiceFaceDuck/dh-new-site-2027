import { doc, getDoc } from 'firebase/firestore';
import { db } from './config.js';

const SETTINGS_DOC = 'warranty';

const DEFAULT_WARRANTY = {
  categories: {
    'Panel': { claimDays: 180, returnDays: 7 },
    'Keyboard': { claimDays: 90, returnDays: 7 },
    'Battery': { claimDays: 180, returnDays: 7 },
    'Adapter': { claimDays: 180, returnDays: 7 },
    'General': { claimDays: 30, returnDays: 7 }
  },
  skus: {}
};

let cachedWarrantyConfig = null;

export const warrantyClientService = {
  getWarrantySettings: async () => {
    if (cachedWarrantyConfig) return cachedWarrantyConfig;

    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        cachedWarrantyConfig = {
          categories: { ...DEFAULT_WARRANTY.categories, ...(data.categories || {}) },
          skus: data.skus || {}
        };
        return cachedWarrantyConfig;
      }
      cachedWarrantyConfig = DEFAULT_WARRANTY;
      return DEFAULT_WARRANTY;
    } catch (error) {
      console.error("🔥 Error fetching warranty settings:", error);
      return DEFAULT_WARRANTY;
    }
  }
};
