import { doc, getDocs, collection, writeBatch, query, where, getDoc } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

export const categorySyncService = {
  /**
   * Rename a category across all collections (products, homepage_categories, settings)
   * @param {string} oldCategoryName The existing category name
   * @param {string} newCategoryName The new category name
   * @param {string} actorUid The user ID performing the action
   */
  renameCategory: async (oldCategoryName, newCategoryName, actorUid = 'system') => {
    if (!oldCategoryName || !newCategoryName || oldCategoryName === newCategoryName) {
      throw new Error('Invalid category names provided for sync.');
    }

    try {
      console.log(`Starting category sync: ${oldCategoryName} -> ${newCategoryName}`);
      let batch = writeBatch(db);
      let batchCount = 0;
      let totalUpdated = 0;

      const commitBatchIfNeeded = async () => {
        if (batchCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      };

      // 1. Update settings/product_categories
      const settingsRef = doc(db, 'settings', 'product_categories');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.categories && Array.isArray(data.categories)) {
          const newCategories = data.categories.map(c => c === oldCategoryName ? newCategoryName : c);
          // Also deduplicate in case newCategoryName already existed
          const uniqueCategories = [...new Set(newCategories)];
          batch.update(settingsRef, { categories: uniqueCategories });
          batchCount++;
        }
      }

      // 2. Update homepage_categories
      const hcRef = collection(db, 'homepage_categories');
      const hcSnap = await getDocs(query(hcRef, where('type', '==', oldCategoryName)));
      hcSnap.forEach(docSnap => {
        batch.update(docSnap.ref, { type: newCategoryName });
        batchCount++;
      });
      await commitBatchIfNeeded();

      // 3. Update products
      const productsRef = collection(db, 'products');
      const productsSnap = await getDocs(query(productsRef, where('category', '==', oldCategoryName)));
      
      for (const d of productsSnap.docs) {
        batch.update(d.ref, { 
          category: newCategoryName,
          category_lower: newCategoryName.toLowerCase() 
        });
        batchCount++;
        totalUpdated++;
        await commitBatchIfNeeded();
      }

      // Commit any remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }

      await historyService.addLog(
        'Settings', 
        'Update', 
        'GlobalCategory', 
        `เปลี่ยนชื่อหมวดหมู่จาก "${oldCategoryName}" เป็น "${newCategoryName}" (อัปเดตสินค้า ${totalUpdated} รายการ)`, 
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
