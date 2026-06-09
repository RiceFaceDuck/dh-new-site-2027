import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export const creditSettingsService = {
  getCreditSettings: async () => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) return docSnap.data();
      
      const defaultSettings = {
        ledger: { systemPoolMax: 1000000, totalAllocated: 0, lastAuditTime: serverTimestamp(), status: 'SECURE' },
        earningRate: 100,      
        redemptionRate: 1,     
        pointToCashRatio: 1, 
        pendingDays: 11,       
        rewardRules: { review: 10, knowledgeSharing: 50, referral: 100 },
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error("🔥 System Error [getCreditSettings]:", error);
      throw error;
    }
  },

  updateCreditSettings: async (settingsData, uid) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      const payload = { ...settingsData, updatedAt: serverTimestamp(), updatedBy: uid || 'Admin' };
      await setDoc(docRef, payload, { merge: true });

      if (historyService && historyService.addLog) {
        await historyService.addLog('CyberAuditCore', 'SystemConfigAltered', 'settings_credit_config', `ปรับปรุงตัวแปรระบบ Credit`, uid || 'System');
      }
      return true;
    } catch (error) {
      console.error("🔥 System Error [updateCreditSettings]:", error);
      throw error;
    }
  }
};
