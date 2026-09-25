import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './config';

const CONFIG_DOC_ID = 'featured_config';
const CONFIG_COLLECTION = 'settings';
const PRODUCTS_COLLECTION = 'products';

// Cache mechanism to save Firebase reads (5 minutes)
let cache = {
  data: null,
  lastFetch: 0
};
const CACHE_DURATION = 5 * 60 * 1000;

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
      const now = Date.now();
      if (cache.data && cache.data.length >= limitCount && (now - cache.lastFetch < CACHE_DURATION)) {
        // Return a fresh shuffled slice of the cached data
        return [...cache.data].sort(() => 0.5 - Math.random()).slice(0, limitCount);
      }

      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const randomSeed = Math.random();
      const fetchPoolSize = limitCount * 3; // Fetch extra to filter out inactive ones in memory

      // 🚀 Latency & UX Optimization: Execute q1 and q2 queries in parallel via Promise.all
      const q1 = query(
        productsRef,
        where('randomSeed', '>=', randomSeed),
        orderBy('randomSeed'),
        limit(fetchPoolSize)
      );

      const q2 = query(
        productsRef,
        where('randomSeed', '<', randomSeed),
        orderBy('randomSeed'),
        limit(fetchPoolSize)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const products1 = snap1.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const products2 = snap2.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      let products = [...products1, ...products2];

      // Filter active products in memory and slice to the requested limit
      const activeProducts = products.filter(p => p.isActive !== false);
      const finalProducts = activeProducts.slice(0, limitCount);

      // Save to cache before shuffling
      cache.data = activeProducts;
      cache.lastFetch = now;

      // Shuffle the results slightly for better perceived randomness
      return finalProducts.sort(() => 0.5 - Math.random());
      
    } catch (error) {
      console.error("Error fetching random products:", error);
      // Fallback
      const fallbackQuery = query(
        collection(db, PRODUCTS_COLLECTION),
        limit(limitCount * 2)
      );
      const fallbackSnap = await getDocs(fallbackQuery);
      const fbProducts = fallbackSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      return fbProducts.filter(p => p.isActive !== false).slice(0, limitCount);
    }
  }
};
