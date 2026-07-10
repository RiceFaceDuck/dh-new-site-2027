import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

export const squadConfigService = {
  /**
   * ดึงการตั้งค่า Squad Highlight (แผงช่างแนะนำ)
   */
  getConfig: async () => {
    try {
      const configRef = doc(db, getCollectionPath('settings'), 'squadConfig');
      const snap = await getDoc(configRef);
      
      if (snap.exists()) {
        return snap.data();
      }
      
      // Default config
      return {
        isActive: true,
        displayLimit: 3
      };
    } catch (error) {
      console.error("Error fetching squad config:", error);
      return {
        isActive: true,
        displayLimit: 3
      };
    }
  }
};
