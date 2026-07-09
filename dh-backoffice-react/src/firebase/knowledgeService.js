import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const knowledgeService = {
  getKnowledgeConfig: async () => {
    try {
      const configRef = doc(db, getCollectionPath('settings'), 'knowledge_config');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      console.error("🔥 System Error [getKnowledgeConfig]:", error);
      throw error;
    }
  },

  updateKnowledgeConfig: async (configData) => {
    try {
      const configRef = doc(db, getCollectionPath('settings'), 'knowledge_config');
      await setDoc(configRef, configData, { merge: true });
      return true;
    } catch (error) {
      console.error("🔥 System Error [updateKnowledgeConfig]:", error);
      throw error;
    }
  }
};
