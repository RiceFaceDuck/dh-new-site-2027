import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './config';

const CONFIG_DOC_ID = 'featured_config';
const CONFIG_COLLECTION = 'settings';
const PRODUCTS_COLLECTION = 'products';

export const featuredQueryService = {
  /**
   * Fetch configuration for Featured Spares
   */
  async getConfig() {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return { isActive: true, displayLimit: 8 };
    } catch (error) {
      console.error("Error fetching featured config:", error);
      return { isActive: true, displayLimit: 8 }; // Fallback
    }
  },

  /**
   * Fetch truly randomized active products using randomSeed
   * @param {number} limitCount 
   */
  async getRandomFeaturedProducts(limitCount = 8) {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const randomSeed = Math.random();
      const fetchPoolSize = limitCount * 3; // Fetch extra to filter out inactive ones in memory

      // Query using ONLY randomSeed to avoid Firebase composite index requirement
      let q1 = query(
        productsRef,
        where('randomSeed', '>=', randomSeed),
        orderBy('randomSeed'),
        limit(fetchPoolSize)
      );

      let snapshot = await getDocs(q1);
      let products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // If we didn't get enough products, fetch from the beginning (<= randomSeed)
      if (products.length < fetchPoolSize) {
        const remainingCount = fetchPoolSize - products.length;
        let q2 = query(
          productsRef,
          where('randomSeed', '<', randomSeed),
          orderBy('randomSeed'),
          limit(remainingCount)
        );
        const snapshot2 = await getDocs(q2);
        const products2 = snapshot2.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        products = [...products, ...products2];
      }

      // Filter active products in memory and slice to the requested limit
      const activeProducts = products.filter(p => p.isActive !== false);
      const finalProducts = activeProducts.slice(0, limitCount);

      // Shuffle the results slightly for better perceived randomness
      return finalProducts.sort(() => 0.5 - Math.random());
      
    } catch (error) {
      console.error("Error fetching random products:", error);
      // Fallback
      try {
        const fallbackQuery = query(
          collection(db, PRODUCTS_COLLECTION),
          limit(limitCount * 2)
        );
        const fallbackSnap = await getDocs(fallbackQuery);
        const fbProducts = fallbackSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        return fbProducts.filter(p => p.isActive !== false).slice(0, limitCount);
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  }
};
