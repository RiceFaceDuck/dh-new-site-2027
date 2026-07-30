import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const CACHE_DURATION = 5 * 60 * 1000; 

// Simple cache store for shared services
const cacheStore = {
  activeCategories: { data: null, lastFetch: 0 },
  allCategories: { data: null, lastFetch: 0 }
};

/**
 * Shared Category Service
 */
export const sharedCategoryService = {
  /**
   * ดึงข้อมูลหมวดหมู่ทั้งหมด (แบบไม่สนใจสถานะ) พร้อมเรียงลำดับ
   */
  getAllCategories: async (db, collectionName = 'homepage_categories') => {
    try {
      const q = query(collection(db, collectionName), orderBy('order', 'asc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error in shared getAllCategories:', error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลหมวดหมู่เฉพาะที่เปิดใช้งาน พร้อม Cache
   */
  getActiveCategories: async (db, collectionName = 'homepage_categories', useCache = true) => {
    try {
      const now = Date.now();
      if (useCache && cacheStore.activeCategories.data && (now - cacheStore.activeCategories.lastFetch < CACHE_DURATION)) {
        return cacheStore.activeCategories.data;
      }

      const q = query(collection(db, collectionName), limit(100));
      const snapshot = await getDocs(q);
      
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const activeCategories = categories.filter(cat => 
        cat.status === 'active' || cat.isActive === true
      );

      activeCategories.sort((a, b) => (a.order || 0) - (b.order || 0));

      cacheStore.activeCategories.data = activeCategories;
      cacheStore.activeCategories.lastFetch = now;

      return activeCategories;
    } catch (error) {
      console.error('Error fetching active categories in shared:', error);
      throw error; 
    }
  },
  
  clearCache: () => {
    cacheStore.activeCategories = { data: null, lastFetch: 0 };
    cacheStore.allCategories = { data: null, lastFetch: 0 };
  }
};
