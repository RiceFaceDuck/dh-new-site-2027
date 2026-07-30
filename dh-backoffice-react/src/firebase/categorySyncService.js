import { doc, getDocs, collection, writeBatch, query, where, getDoc, limit, startAfter } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const categorySyncService = {
  /**
   * Rename a category across all collections (products, homepage_categories, settings)
   * @param {string} oldType The existing category type
   * @param {string} newType The new category type
   * @param {string} oldName The existing category name
   * @param {string} newName The new category name
   * @param {string} actorUid The user ID performing the action
   */
  renameCategory: async (oldType, newType, oldName, newName, actorUid = 'system') => {
    if (!oldType && !oldName) return 0;
    
    try {
      console.log(`Starting category sync: ${oldType} -> ${newType}`);
      let batch = writeBatch(db);
      let batchCount = 0;
      let totalUpdated = 0;

      const commitBatchIfNeeded = async () => {
        if (batchCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      };

      // 1. Update product_settings global list
      const settingsRef = doc(db, getCollectionPath('product_settings'), 'categories');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.categories && Array.isArray(data.categories)) {
          const newCategories = data.categories.map(c => 
            (c.toLowerCase() === oldType.toLowerCase() || c === oldName) ? (newType || newName) : c
          );
          const uniqueCategories = [...new Set(newCategories)];
          batch.update(settingsRef, { categories: uniqueCategories });
          batchCount++;
        }
      }

      // 2. Update homepage_categories
      const hcRef = collection(db, getCollectionPath('homepage_categories'));
      const hcSnap1 = await getDocs(query(hcRef, where('type', '==', oldType), limit(500)));
      hcSnap1.forEach(docSnap => {
        batch.update(docSnap.ref, { type: newType, name: newName });
        batchCount++;
      });
      await commitBatchIfNeeded();

      // 3. Update products (Match by category_lower) with startAfter pagination loop
      const productsRef = collection(db, getCollectionPath('products'));
      let lastDoc = null;
      let hasMore = true;

      while (hasMore) {
        let qConstraints = [
          where('category_lower', '==', oldType.trim().toLowerCase()),
          limit(500)
        ];
        if (lastDoc) {
          qConstraints.push(startAfter(lastDoc));
        }

        const productsSnap = await getDocs(query(productsRef, ...qConstraints));
        if (productsSnap.empty) {
          hasMore = false;
          break;
        }

        for (const d of productsSnap.docs) {
          batch.update(d.ref, { 
            category: newType || newName,
            category_lower: (newType || newName).trim().toLowerCase()
          });
          batchCount++;
          totalUpdated++;
          await commitBatchIfNeeded();
        }

        lastDoc = productsSnap.docs[productsSnap.docs.length - 1];
        if (productsSnap.docs.length < 500) {
          hasMore = false;
        }
      }

      // Commit any remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }

      await historyService.addLog(
        'Settings', 
        'Update', 
        'GlobalCategory', 
        `ซิงค์ข้อมูลประเภทสินค้าจาก "${oldType}" เป็น "${newType}" (อัปเดตสินค้า ${totalUpdated} รายการ)`, 
        actorUid
      );

      console.log(`Category sync completed! Total products updated: ${totalUpdated}`);
      return totalUpdated;
    } catch (error) {
      console.error('🔥 Error during category sync:', error);
      throw error;
    }
  }
};
