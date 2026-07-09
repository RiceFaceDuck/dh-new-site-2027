import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const CHUNK_SIZE = 400; // Safe margin below 500 limit

export const dataRepairService = {
  
  repairUsersWallet: async (onProgress) => {
    try {
      const snap = await getDocs(collection(db, getCollectionPath('users')));
      let totalToUpdate = 0;
      let processed = 0;
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const userDoc of snap.docs) {
        const data = userDoc.data();
        let needsUpdate = false;
        let updates = {};

        if (data.walletBalance === undefined) {
          updates.walletBalance = 0;
          needsUpdate = true;
        }

        if (needsUpdate) {
          batch.update(doc(db, getCollectionPath('users'), userDoc.id), updates);
          totalToUpdate++;
          batchCount++;

          if (batchCount >= CHUNK_SIZE) {
            await batch.commit();
            processed += batchCount;
            if (onProgress) onProgress(`อัปเดต Users ไปแล้ว ${processed} รายการ...`);
            batch = writeBatch(db);
            batchCount = 0;
          }
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        processed += batchCount;
      }
      return { success: true, count: processed };
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  repairOrdersSchema: async (onProgress) => {
    try {
      const snap = await getDocs(collection(db, getCollectionPath('orders')));
      let totalToUpdate = 0;
      let processed = 0;
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const orderDoc of snap.docs) {
        const data = orderDoc.data();
        let needsUpdate = false;
        let updates = {};

        if (data.refundsAndClaims === undefined) {
          updates.refundsAndClaims = [];
          needsUpdate = true;
        }
        
        if (data.totalDiscount === undefined) {
          updates.totalDiscount = 0;
          needsUpdate = true;
        }

        // Check items for missing priceAtPurchase
        if (Array.isArray(data.items)) {
          let itemsChanged = false;
          const updatedItems = data.items.map(item => {
            let newItem = { ...item };
            if (newItem.priceAtPurchase === undefined) {
               newItem.priceAtPurchase = Number(newItem.price || 0);
               itemsChanged = true;
            }
            if (newItem.nameAtPurchase === undefined) {
               newItem.nameAtPurchase = newItem.name || 'Unknown Item';
               itemsChanged = true;
            }
            return newItem;
          });

          if (itemsChanged) {
            updates.items = updatedItems;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          batch.update(doc(db, getCollectionPath('orders'), orderDoc.id), updates);
          totalToUpdate++;
          batchCount++;

          if (batchCount >= CHUNK_SIZE) {
            await batch.commit();
            processed += batchCount;
            if (onProgress) onProgress(`อัปเดต Orders ไปแล้ว ${processed} รายการ...`);
            batch = writeBatch(db);
            batchCount = 0;
          }
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        processed += batchCount;
      }
      return { success: true, count: processed };
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  repairProductsSchema: async (onProgress) => {
    try {
      const snap = await getDocs(collection(db, getCollectionPath('products')));
      let totalToUpdate = 0;
      let processed = 0;
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const productDoc of snap.docs) {
        const data = productDoc.data();
        let needsUpdate = false;
        let updates = {};

        if (data.defectQuantity === undefined) {
          updates.defectQuantity = 0;
          needsUpdate = true;
        }

        if (data.stats === undefined) {
          updates.stats = { sold: 0, views: 0 };
          needsUpdate = true;
        } else {
          if (data.stats.sold === undefined) {
            updates['stats.sold'] = 0;
            needsUpdate = true;
          }
          if (data.stats.views === undefined) {
            updates['stats.views'] = 0;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          batch.update(doc(db, getCollectionPath('products'), productDoc.id), updates);
          totalToUpdate++;
          batchCount++;

          if (batchCount >= CHUNK_SIZE) {
            await batch.commit();
            processed += batchCount;
            if (onProgress) onProgress(`อัปเดต Products ไปแล้ว ${processed} รายการ...`);
            batch = writeBatch(db);
            batchCount = 0;
          }
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        processed += batchCount;
      }
      return { success: true, count: processed };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

};
