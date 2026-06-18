import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config';

const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

export const squadConfigService = {
  /**
   * ดึงการตั้งค่า Squad Highlight
   */
  getConfig: async () => {
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'settings', 'squadConfig');
      const snap = await getDoc(configRef);
      
      if (snap.exists()) {
        return snap.data();
      }
      
      return {
        isActive: true,
        displayLimit: 3
      };
    } catch (error) {
      console.error("Error fetching squad config:", error);
      throw error;
    }
  },

  /**
   * อัปเดตการตั้งค่า Squad Highlight
   */
  updateConfig: async (newConfig) => {
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'settings', 'squadConfig');
      const snap = await getDoc(configRef);
      
      if (!snap.exists()) {
        await setDoc(configRef, newConfig);
      } else {
        await updateDoc(configRef, newConfig);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating squad config:", error);
      throw error;
    }
  }
};
