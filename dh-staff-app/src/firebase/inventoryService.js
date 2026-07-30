import { collection, doc, getDoc, getDocs, query, where, limit, startAfter } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils.js';

const COLLECTION_NAME = 'products';

export const inventoryService = {
  /**
   * Fetch unique product categories to display in the filter bar
   * @returns {Promise<string[]>} Array of category names
   */
  getUniqueProductCategories: async () => {
    try {
      // ดึงจาก settings ก่อนเพื่อประหยัด read (เหมือนใน backoffice)
      const docRef = doc(db, getCollectionPath('settings'), 'product_categories');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          return data.categories.sort();
        }
      }

      // ถ้าไม่มีให้ fallback ดึงจาก products ทั้งหมดที่ active (จำกัดสูงสุด 500)
      console.log("⚠️ [Fallback] Fetching categories from active products...");
      const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true), limit(500));
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
   * Fetch active products once for fast local searching and filtering (จำกัดสูงสุด 500)
   * @returns {Promise<object[]>} Array of products
   */
  getAllActiveProducts: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true), limit(500));
      const snapshot = await getDocs(q);
      let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // เรียงตาม SKU
      return products.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  },

  /**
   * Fetch products with pagination and optional filtering
   */
  getPaginatedProducts: async ({ category, searchQuery, lastDocItem, limitCount = 20 }) => {
    try {
      let constraints = [where('isActive', '==', true)];

      if (category && category !== 'All') {
        constraints.push(where('category', '==', category));
      }

      if (searchQuery && searchQuery.trim()) {
         const queryUpper = searchQuery.toUpperCase().trim();
         // Basic prefix search on SKU
         constraints.push(where('sku', '>=', queryUpper));
         constraints.push(where('sku', '<=', queryUpper + '\uf8ff'));
      }

      let q = query(collection(db, COLLECTION_NAME), ...constraints, limit(limitCount));
      
      if (lastDocItem) {
        // Because we might not have a clean 'orderBy' on SKU when searching, we keep it simple.
        // Actually, if we use startAfter we need to pass the DocumentSnapshot.
        // We'll require the caller to pass the lastDoc snapshot.
        q = query(collection(db, COLLECTION_NAME), ...constraints, limit(limitCount));
        // To properly paginate without complex composite indexes, we'll just fetch a slightly larger limit if not searching, or implement startAfter if caller passes actual docSnap.
      }

      // ⚠️ Real server-side pagination (startAfter)
      if (lastDocItem && lastDocItem.docSnap) {
         q = query(collection(db, COLLECTION_NAME), ...constraints, startAfter(lastDocItem.docSnap), limit(limitCount));
      }

      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), docSnap: doc }));
      
      return {
        products,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
        hasMore: snapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error("Error fetching paginated products:", error);
      // Fallback for missing indexes: return empty to trigger a message
      return { products: [], lastDoc: null, hasMore: false };
    }
  }
};
