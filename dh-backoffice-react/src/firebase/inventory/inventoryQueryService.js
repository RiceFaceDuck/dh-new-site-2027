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
  }
};
