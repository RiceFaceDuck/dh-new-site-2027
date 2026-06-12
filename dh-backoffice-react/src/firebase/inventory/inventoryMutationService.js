import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config';
import { gasHistoryService } from '../gasHistoryService';

const COLLECTION_NAME = 'products';

export const inventoryMutationService = {
  addProduct: async (productData) => {
    const docRef = doc(db, COLLECTION_NAME, productData.sku);
    await setDoc(docRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    gasHistoryService.log({
      level: 'INFO',
      module: 'Inventory',
      action: 'Create',
      target: { id: productData.sku, name: productData.name, type: 'Product' },
      details: {
        legacy_details: `เพิ่มสินค้าใหม่: ${productData.name}`,
        new_data: productData
      }
    });
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
      
      await updateDoc(docRef, {
        ...newData,
        updatedAt: serverTimestamp()
      });
      
      // Calculate diff for maximum detail
      const changes = {};
      for (const key in newData) {
        if (key === 'updatedAt') continue;
        if (JSON.stringify(newData[key]) !== JSON.stringify(oldData[key])) {
          changes[key] = { from: oldData[key], to: newData[key] };
        }
      }

      gasHistoryService.log({
        level: 'WARN',
        module: 'Inventory',
        action: 'Update',
        target: { id: sku, name: newData.name || oldData.name, type: 'Product' },
        details: {
          legacy_details: `แก้ไขข้อมูล: ${newData.name || oldData.name}`,
          changes: changes
        }
      });
    } else {
      // Fallback if doc didn't exist before
      await updateDoc(docRef, {
        ...newData,
        updatedAt: serverTimestamp()
      });
      gasHistoryService.log({
        level: 'WARN',
        module: 'Inventory',
        action: 'Update',
        target: { id: sku, name: newData.name, type: 'Product' },
        details: {
          legacy_details: `แก้ไขข้อมูล: ${newData.name}`,
          new_data: newData
        }
      });
    }
  },

  deleteProduct: async (sku, productName) => {
    const docRef = doc(db, COLLECTION_NAME, sku);
    await updateDoc(docRef, { isActive: false, updatedAt: serverTimestamp() });
    
    gasHistoryService.log({
      level: 'ERROR',
      module: 'Inventory',
      action: 'Delete (Soft)',
      target: { id: sku, name: productName, type: 'Product' },
      details: {
        legacy_details: `ปิดการขายสินค้า: ${productName}`,
        changes: { isActive: { from: true, to: false } }
      }
    });
  }
};
