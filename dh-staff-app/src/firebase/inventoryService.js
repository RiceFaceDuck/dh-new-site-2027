import { collection, doc, getDoc, getDocs, query, limit, orderBy, where, startAfter } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'products';

export const inventoryService = {
  /**
   * Fetch unique product categories to display in the filter bar
   * @returns {Promise<string[]>} Array of category names
   */
  getUniqueProductCategories: async () => {
    try {
      // ดึงจาก settings ก่อนเพื่อประหยัด read (เหมือนใน backoffice)
      const docRef = doc(db, 'settings', 'product_categories');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          return data.categories.sort();
        }
      }

      // ถ้าไม่มีให้ fallback ดึงจาก products ทั้งหมดที่ active
      console.log("⚠️ [Fallback] Fetching categories from active products...");
      const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const uniqueCategories = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          uniqueCategories.add(data.category.toLowerCase().trim());
        }
      });
      return Array.from(uniqueCategories).sort();

    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  /**
   * Fetch all active products once for fast local searching and filtering
   * @returns {Promise<object[]>} Array of products
   */
  getAllActiveProducts: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // กรองเฉพาะที่ Active และเรียงตาม SKU
      return products
        .filter(p => p.isActive !== false)
        .sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  }
};
