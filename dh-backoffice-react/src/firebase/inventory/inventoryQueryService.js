import { collection, doc, getDoc, getDocs, query, limit, startAfter, orderBy, where } from 'firebase/firestore';
import { db } from '../config';

const COLLECTION_NAME = 'products';

export const inventoryQueryService = {
  getInventorySettings: async () => {
    try {
      const docRef = doc(db, 'settings', 'inventory');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return { defaultBufferStock: 2 }; 
    } catch (error) {
      console.error("🔥 Error fetching inventory settings:", error);
      return { defaultBufferStock: 2 };
    }
  },

  getPaginatedProducts: async (maxLimit = 20, lastDocRef = null) => {
    try {
      let q;
      if (lastDocRef) {
        q = query(collection(db, COLLECTION_NAME), orderBy('sku'), startAfter(lastDocRef), limit(maxLimit));
      } else {
        q = query(collection(db, COLLECTION_NAME), orderBy('sku'), limit(maxLimit));
      }
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      return { products, lastDoc };
    } catch (error) {
      console.error("🔥 Error fetching products:", error);
      return { products: [], lastDoc: null };
    }
  },

  getAllActiveProductsForSearch: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error fetching active products:", error);
      return [];
    }
  },

  getSalesStats30d: async (sku) => {
    try {
      return {
        sold: Math.floor(Math.random() * 50) + 5, 
        returned: Math.floor(Math.random() * 2),  
        viewed: Math.floor(Math.random() * 200) + 20
      };
    } catch (error) {
      return { sold: 0, returned: 0, viewed: 0 };
    }
  },

  getProductBySku: async (sku) => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('sku', '==', sku), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error("🔥 Error fetching product by SKU:", error);
      throw error;
    }
  },

  getUniqueProductCategories: async () => {
    try {
      // 🚀 ประหยัด Reads โดยดึงจาก settings/product_categories
      const docRef = doc(db, 'settings', 'product_categories');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          return data.categories.sort();
        }
      }

      // Fallback: ถ้ายังไม่มีข้อมูลใน settings หรือข้อมูลว่าง ให้ไปอ่านจาก products ทั้งหมด
      console.log("⚠️ [Fallback] ไม่พบข้อมูลใน settings/product_categories กำลังดึงจาก products ทั้งหมด...");
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      const uniqueCategories = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          // เก็บค่าเป็น lowercase เพื่อไม่ให้ซ้ำซ้อน
          uniqueCategories.add(data.category.toLowerCase().trim());
        }
      });
      return Array.from(uniqueCategories).sort();

    } catch (error) {
      console.error("🔥 Error fetching unique categories:", error);
      return [];
    }
  }
};
