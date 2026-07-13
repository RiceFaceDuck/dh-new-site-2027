import { doc, getDocs, collection, writeBatch, query, where, getDoc, limit } from 'firebase/firestore';
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
    if (!oldType || !newType || !oldName || !newName) {
      throw new Error('Invalid category names/types provided for sync.');
    }
    if (oldType.trim().toLowerCase() === newType.trim().toLowerCase() && oldName.trim() === newName.trim()) {
      return 0; // No changes needed
    }

    try {
      console.log(`Starting category sync: ${oldType} -> ${newType}`);
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
      const settingsRef = doc(db, getCollectionPath('settings'), 'product_categories');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data.categories && Array.isArray(data.categories)) {
          const newCategories = data.categories.map(c => 
            (c.toLowerCase() === oldType.toLowerCase() || c === oldName) ? (newType || newName) : c
          );
          // Also deduplicate in case newCategoryName already existed
          const uniqueCategories = [...new Set(newCategories)];
          batch.update(settingsRef, { categories: uniqueCategories });
          batchCount++;
        }
      }

      // 2. Update homepage_categories (In case of duplicates or other docs sharing the same type/name)
      const hcRef = collection(db, getCollectionPath('homepage_categories'));
      const hcSnap1 = await getDocs(query(hcRef, where('type', '==', oldType), limit(500)));
      hcSnap1.forEach(docSnap => {
        batch.update(docSnap.ref, { type: newType, name: newName });
        batchCount++;
      });
      await commitBatchIfNeeded();

      // 3. Update products (Match by category_lower)
      const productsRef = collection(db, getCollectionPath('products'));
      const productsSnap = await getDocs(query(productsRef, where('category_lower', '==', oldType.trim().toLowerCase()), limit(500)));
      
      for (const d of productsSnap.docs) {
        batch.update(d.ref, { 
          category: newType || newName,
          category_lower: (newType || newName).trim().toLowerCase()
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
