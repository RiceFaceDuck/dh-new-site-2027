import { doc, setDoc, updateDoc, getDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../config';
import { inventorySyncService } from './inventorySyncService';
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

    // 🚀 บันทึก History
    await historyService.addLog('Inventory', 'CreateProduct', productData.sku, `เพิ่มสินค้าใหม่ SKU: ${productData.sku}`, auth.currentUser?.uid);

    inventorySyncService.broadcastCreate(productData);
    await inventorySyncService.syncCategory(productData.category);
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

      // 🚀 บันทึก History
      await historyService.addLog('Inventory', 'UpdateProduct', sku, `แก้ไขข้อมูลสินค้า SKU: ${sku}`, auth.currentUser?.uid);

      inventorySyncService.broadcastUpdate(sku, newData, oldData);
      await inventorySyncService.syncCategory(newData.category, oldData.category);
    } else {
      // Fallback if doc didn't exist before
      await updateDoc(docRef, {
        ...newData,
        updatedAt: serverTimestamp()
      });

      // 🚀 บันทึก History
      await historyService.addLog('Inventory', 'UpdateProduct', sku, `แก้ไขข้อมูลสินค้า (Fallback Create) SKU: ${sku}`, auth.currentUser?.uid);

      inventorySyncService.broadcastUpdate(sku, newData, null);
      await inventorySyncService.syncCategory(newData.category);
    }
  },

  deleteProduct: async (sku, productName) => {
    const docRef = doc(db, COLLECTION_NAME, sku);
    await updateDoc(docRef, { isActive: false, updatedAt: serverTimestamp() });
    
    // 🚀 บันทึก History
    await historyService.addLog('Inventory', 'DeleteProduct', sku, `ลบสินค้า SKU: ${sku} - ${productName}`, auth.currentUser?.uid);

    // 🧹 Cleanup Orphaned Todos (Strict Data Relations)
    try {
        const todosRef = collection(db, 'todos');
        const q = query(todosRef, where('referenceId', '==', sku));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const batch = writeBatch(db);
            querySnapshot.forEach((todoDoc) => {
                batch.update(todoDoc.ref, {
                    status: 'cancelled',
                    handledBy: auth.currentUser?.uid || 'system',
                    updatedAt: serverTimestamp()
                });
            });
            await batch.commit();
            console.log(`✅ [InventoryMutationService] Cleaned up ${querySnapshot.size} orphaned todos for SKU: ${sku}`);
        }
    } catch (todoError) {
        console.error("🔥 Error cleaning up related todos for product:", todoError);
    }

    inventorySyncService.broadcastDelete(sku, productName);
  }
};
