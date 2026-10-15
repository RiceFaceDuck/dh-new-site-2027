import { doc, setDoc, updateDoc, getDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, arrayRemove, limit } from 'firebase/firestore';
import { db, auth } from '../config';
import { inventorySyncService } from './inventorySyncService';
import { historyService } from '../historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = getCollectionPath('products');

export const inventoryMutationService = {
  addProduct: async (productData) => {
    const docRef = doc(db, COLLECTION_NAME, productData.sku);
    
    // 🛡️ Pre-flight Duplicate SKU Guard: Prevent catastrophic overwrite of existing products
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      throw new Error(`รหัสสินค้า (SKU) "${productData.sku}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
    }

    // Inject category_lower for frontend query support
    if (productData.category) {
      productData.category_lower = productData.category.trim().toLowerCase();
    }

    // 🛡️ Description Parity: Sync description and fullDescription for Storefront parity
    if (productData.description && !productData.fullDescription) {
      productData.fullDescription = productData.description;
    } else if (productData.fullDescription && !productData.description) {
      productData.description = productData.fullDescription;
    }

    await setDoc(docRef, {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 📦 บันทึกประวัติสินค้าเข้า (Stock-In)
    if (Number(productData.stockQuantity) > 0) {
      try {
        const receiptRef = doc(collection(db, getCollectionPath('stock_receipts')));
        await setDoc(receiptRef, {
          sku: productData.sku,
          quantity: Number(productData.stockQuantity || 0),
          source: 'manual_add',
          createdBy: auth.currentUser?.uid || 'System',
          createdAt: serverTimestamp()
        });
      } catch (errReceipt) {
        console.warn("Stock receipt write error:", errReceipt);
      }
    }

    // 🚀 บันทึก History
    await historyService.addLog('Inventory', 'CreateProduct', productData.sku, `เพิ่มสินค้าใหม่ SKU: ${productData.sku}`, auth.currentUser?.uid);

    inventorySyncService.broadcastCreate(productData);
    await inventorySyncService.syncCategory(productData.category);
  },

  updateProduct: async (sku, newData) => {
    const docRef = doc(db, COLLECTION_NAME, sku);
    
    // 🛡️ Strip synthetic UI stats added by useInventoryData / useInventorySearch
    delete newData.sales30D;
    delete newData.stockIn30D;
    delete newData.claims30D;
    delete newData.adjustment30D;
    delete newData.stats;
    delete newData.totalSold;
    delete newData.id;

    // Inject category_lower for frontend query support
    if (newData.category) {
      newData.category_lower = newData.category.trim().toLowerCase();
    }
    
    // 🛡️ Description Parity: Sync description and fullDescription
    if (newData.description && !newData.fullDescription) {
      newData.fullDescription = newData.description;
    } else if (newData.fullDescription && !newData.description) {
      newData.description = newData.fullDescription;
    }

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const oldData = docSnap.data();
      let hasChanges = false;

      // 🛡️ Preserve Existing Images Invariant:
      // If newData.images is empty but oldData has images, NEVER wipe out existing product images
      if ((!newData.images || !Array.isArray(newData.images) || newData.images.length === 0) && (Array.isArray(oldData.images) && oldData.images.length > 0)) {
        newData.images = oldData.images;
        newData.image = oldData.image || oldData.images[0] || null;
        if (oldData.imageUrl) newData.imageUrl = oldData.imageUrl;
      }

      // 🛡️ Preserve Accounting History Invariant:
      // Prevent synthetic UI objects from corrupting canonical claimHistory/salesHistory
      if (oldData.claimHistory && (!Array.isArray(newData.claimHistory) || (newData.claimHistory && typeof newData.claimHistory === 'object' && '30' in newData.claimHistory))) {
        newData.claimHistory = oldData.claimHistory;
      }

      // 🛡️ Concurrency Lost-Update Guard:
      // If the admin did not modify stockQuantity in the form, preserve the live oldData.stockQuantity (e.g. from POS sales)
      if (newData._initialStock !== undefined) {
        if (Number(newData.stockQuantity) === Number(newData._initialStock)) {
          newData.stockQuantity = oldData.stockQuantity;
        }
        delete newData._initialStock;
      }

      // 📦 ตรวจสอบการเปลี่ยนแปลงสต็อกเพื่อบันทึกประวัติ (เพิ่ม = stock_receipts, ลด = stock_adjustments)
      if (newData.stockQuantity !== undefined && oldData.stockQuantity !== undefined) {
        const addedStock = Number(newData.stockQuantity || 0) - Number(oldData.stockQuantity || 0);
        if (addedStock > 0) {
          try {
            const receiptRef = doc(collection(db, getCollectionPath('stock_receipts')));
            await setDoc(receiptRef, {
              sku: sku,
              quantity: addedStock,
              source: 'manual_update',
              createdBy: auth.currentUser?.uid || 'System',
              createdAt: serverTimestamp()
            });
          } catch (errReceipt) {
            console.warn("Stock receipt write error:", errReceipt);
          }
        } else if (addedStock < 0) {
          try {
            const adjustmentRef = doc(collection(db, getCollectionPath('stock_adjustments')));
            await setDoc(adjustmentRef, {
              sku: sku,
              previousStock: Number(oldData.stockQuantity || 0),
              newStock: Number(newData.stockQuantity || 0),
              difference: addedStock,
              quantity: Math.abs(addedStock),
              reason: 'manual_inventory_edit',
              createdBy: auth.currentUser?.uid || 'System',
              createdAt: serverTimestamp()
            });
          } catch (errAdj) {
            console.warn("Stock adjustment write error:", errAdj);
          }
        }
      }
      
      for (const key in newData) {
        if (key === 'updatedAt' || key === 'randomSeed') continue;
        
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
      // Safe Fallback if doc didn't exist before (setDoc with merge instead of failing updateDoc)
      await setDoc(docRef, {
        ...newData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

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
        const todosRef = collection(db, getCollectionPath('todos'));
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

    // 🧹 Cleanup Dangling Pointers (Orphaned Array Refs)
    try {
        const batch = writeBatch(db);
        let hasBatchOps = false;

        // 1. Remove from other products' substituteSkus
        const substituteQ = query(collection(db, COLLECTION_NAME), where('substituteSkus', 'array-contains', sku), limit(50));
        const substituteSnap = await getDocs(substituteQ);
        substituteSnap.forEach(docSnap => {
            batch.update(docSnap.ref, { substituteSkus: arrayRemove(sku) });
            hasBatchOps = true;
        });

        // 2. Remove from promotions
        const promoQ = query(collection(db, getCollectionPath('promotions')), where('applicableSkus', 'array-contains', sku), limit(50));
        const promoSnap = await getDocs(promoQ);
        promoSnap.forEach(docSnap => {
            batch.update(docSnap.ref, { applicableSkus: arrayRemove(sku) });
            hasBatchOps = true;
        });

        // 3. Remove from freebies
        const freebieQ = query(collection(db, getCollectionPath('freebies')), where('applicableSkus', 'array-contains', sku), limit(50));
        const freebieSnap = await getDocs(freebieQ);
        freebieSnap.forEach(docSnap => {
            batch.update(docSnap.ref, { applicableSkus: arrayRemove(sku) });
            hasBatchOps = true;
        });

        if (hasBatchOps) {
            await batch.commit();
            console.log(`✅ [InventoryMutationService] Cleaned up dangling pointers for SKU: ${sku}`);
        }
    } catch (cleanupError) {
        console.error("🔥 Error cleaning up dangling pointers:", cleanupError);
    }

    inventorySyncService.broadcastDelete(sku, productName);
  }
};
