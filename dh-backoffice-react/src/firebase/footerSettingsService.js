import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { 
  FooterConfigSchema, 
  CANONICAL_DEFAULT_FOOTER_CONFIG, 
  DEFAULT_FOOTER_CONFIG 
} from 'dh-shared';

const FOOTER_DOC = 'footer_config';
const STOREFRONT_DOC = 'storefront_config';

export { CANONICAL_DEFAULT_FOOTER_CONFIG, DEFAULT_FOOTER_CONFIG };

export const footerSettingsService = {
  getFooterConfig: async () => {
    try {
      const storefrontRef = doc(db, getCollectionPath('settings'), STOREFRONT_DOC);
      const storefrontSnap = await getDoc(storefrontRef);
      if (storefrontSnap.exists() && storefrontSnap.data()?.footer) {
        return { ...CANONICAL_DEFAULT_FOOTER_CONFIG, ...storefrontSnap.data().footer };
      }

      const footerRef = doc(db, getCollectionPath('settings'), FOOTER_DOC);
      const footerSnap = await getDoc(footerRef);
      if (footerSnap.exists()) {
        return { ...CANONICAL_DEFAULT_FOOTER_CONFIG, ...footerSnap.data() };
      }

      return CANONICAL_DEFAULT_FOOTER_CONFIG;
    } catch (error) {
      console.error("🔥 Error fetching footer config:", error);
      return CANONICAL_DEFAULT_FOOTER_CONFIG;
    }
  },

  updateFooterConfig: async (configData) => {
    try {
      const validatedData = FooterConfigSchema.parse(configData);
      const batch = writeBatch(db);
      
      const storefrontRef = doc(db, getCollectionPath('settings'), STOREFRONT_DOC);
      batch.set(storefrontRef, {
        footer: validatedData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const footerRef = doc(db, getCollectionPath('settings'), FOOTER_DOC);
      batch.set(footerRef, {
        ...validatedData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      return { success: true, message: 'บันทึกการตั้งค่า Footer สำเร็จ', data: validatedData };
    } catch (error) {
      console.error("🔥 Error updating footer config:", error);
      throw error;
    }
  }
};

export default footerSettingsService;
