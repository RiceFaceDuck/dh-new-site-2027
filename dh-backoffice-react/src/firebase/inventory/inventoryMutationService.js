import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config';
import { historyService } from '../historyService';

const COLLECTION_NAME = 'products';

export const inventoryMutationService = {
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
  }
};
