import { doc, getDoc, setDoc, collection, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config';

const CONFIG_DOC_ID = 'featured_config';
const COLLECTION_NAME = 'settings';

export const featuredConfigService = {
  /**
   * Get the current configuration for Featured Spares
   * @returns {Promise<{isActive: boolean, displayLimit: number}>}
   */
  async getConfig() {
    try {
      const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      // Default config if not exists
      return {
        isActive: true,
        displayLimit: 8
      };
    } catch (error) {
      console.error("Error fetching featured config:", error);
      throw error;
    }
  },

  /**
   * Update the configuration
   * @param {Object} config 
   */
  async updateConfig(config) {
    try {
      const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC_ID);
      await setDoc(docRef, config, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating featured config:", error);
      throw error;
    }
  },

  /**
   * Reseed all active products with a new randomSeed
   */
  async reseedAllProducts() {
    try {
      // Note: In a production app with thousands of products, 
      // this should be done via Cloud Functions or batched over time to avoid memory/read limits.
      // But for a utility manager function triggered rarely, we can do batch writes.
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      snapshot.docs.forEach(document => {
        const docRef = doc(db, 'products', document.id);
        currentBatch.update(docRef, { randomSeed: Math.random() });
        operationCount++;

        // Firestore batch limit is 500
        if (operationCount === 450) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });

      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      for (const batch of batches) {
        await batch.commit();
      }

      return snapshot.docs.length;
    } catch (error) {
      console.error("Error reseeding products:", error);
      throw error;
    }
  }
};
