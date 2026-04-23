import { collection, doc, setDoc, updateDoc, getDoc, getDocs, query, limit, startAfter, orderBy, serverTimestamp, where, increment } from 'firebase/firestore';
import { db, auth } from './config';
import { historyService } from './historyService';
import { todoService } from './todoService';

const COLLECTION_NAME = 'products';

export const inventoryService = {
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

  addProduct: async (productData) => {
    const docRef = doc(db, COLLECTION_NAME, productData.sku);
    await setDoc(docRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await historyService.addLog('Inventory', 'Create', productData.sku, `เพิ่มสินค้าใหม่: ${productData.name}`, auth.currentUser?.uid);
  },

  updateProduct: async (sku, newData) => {
    const docRef = doc(db, COLLECTION_NAME, sku);
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const oldData = docSnap.data();
      let hasChanges = false;
      
      for (const key in newData) {
        if (key === 'updatedAt') continue;
        
        if (typeof newData[key] === 'object' && newData[key] !== null) {
          if (JSON.stringify(newData[key]) !== JSON.stringify(oldData[key] || (Array.isArray(newData[key]) ? [] : {}))) {
            hasChanges = true;
            break;
          }
        } 
        else if (newData[key] !== oldData[key]) {
          hasChanges = true;
          break;
        }
      }
      
      if (!hasChanges) {
        console.log(`📦 [Smart Write] ข้อมูล SKU: ${sku} ไม่มีการเปลี่ยนแปลง ข้ามการบันทึกเพื่อประหยัด Writes`);
        return; 
      }
    }

    await updateDoc(docRef, {
      ...newData,
      updatedAt: serverTimestamp()
    });
    await historyService.addLog('Inventory', 'Update', sku, `แก้ไขข้อมูล: ${newData.name}`, auth.currentUser?.uid);
  },

  deleteProduct: async (sku, productName) => {
    const docRef = doc(db, COLLECTION_NAME, sku);
    await updateDoc(docRef, { isActive: false, updatedAt: serverTimestamp() });
    await historyService.addLog('Inventory', 'Delete (Soft)', sku, `ปิดการขายสินค้า: ${productName}`, auth.currentUser?.uid);
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

  // ✨ อัปเกรด Sourcing Management รองรับข้อมูลแบบ Object 
  reportNonExisting: async (reportData, uid) => {
    if (!reportData || !reportData.keyword || !reportData.keyword.trim()) return;
    try {
      const slugId = reportData.keyword.trim().toLowerCase().replace(/[^a-z0-9ก-๙]/g, '-');
      const docRef = doc(db, 'sourcing_requests', slugId);
      
      await setDoc(docRef, {
        keyword: reportData.keyword.trim(),
        category: reportData.category || '',
        customerName: reportData.customerName || '',
        referenceLink: reportData.referenceLink || '',
        sampleImage: reportData.sampleImage || '', 
        demandCount: increment(1),
        lastRequestedAt: serverTimestamp(),
        status: 'pending'
      }, { merge: true });
      
    } catch (error) {
      console.error("🔥 Error reporting non-existing product:", error);
    }
  },

  submitKnowledgeUpdate: async (sku, productName, modelOrPart, type, uid) => {
    try {
      await todoService.requestKnowledgeApproval(sku, productName, modelOrPart, type, uid);
    } catch (error) {
      console.error("🔥 Error submitting knowledge:", error);
      throw error;
    }
  }
};