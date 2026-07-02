import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';

export const inventorySyncService = {
  /**
   * Updates global category list to save Firebase reads during Category dropdown fetch
   */
  syncCategory: async (newCategory, oldCategory = null) => {
    if (newCategory && newCategory !== oldCategory) {
      const settingsRef = doc(db, 'settings', 'product_categories');
      await setDoc(settingsRef, {
        categories: arrayUnion(newCategory)
      }, { merge: true });
    }
  },

  /**
   * Broadcasts product changes to Google Apps Script and History Log
   */
  broadcastCreate: async (productData) => {
    // ✅ [Auto-Sync] ส่งเข้าคิวอัปเดต Google Sheet และบังคับซิงค์ทันที
    gasStockService.queueUpdate(productData);
    await gasStockService.forceSync();
    
    // Log History
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

  broadcastUpdate: async (sku, newData, oldData) => {
    // ✅ [Auto-Sync] ส่งเข้าคิวอัปเดต Google Sheet และบังคับซิงค์ทันที
    gasStockService.queueUpdate({ sku, ...newData });
    await gasStockService.forceSync();

    // Calculate diff
    const changes = {};
    if (oldData) {
      for (const key in newData) {
        if (key === 'updatedAt') continue;
        if (JSON.stringify(newData[key]) !== JSON.stringify(oldData[key])) {
          changes[key] = { from: oldData[key], to: newData[key] };
        }
      }
    }

    gasHistoryService.log({
      level: 'WARN',
      module: 'Inventory',
      action: 'Update',
      target: { id: sku, name: newData.name || (oldData && oldData.name), type: 'Product' },
      details: oldData ? {
        legacy_details: `แก้ไขข้อมูล: ${newData.name || oldData.name}`,
        changes: changes
      } : {
        legacy_details: `แก้ไขข้อมูล: ${newData.name}`,
        new_data: newData
      }
    });
  },

  broadcastDelete: (sku, productName) => {
    // Note: If you want to sync soft deletes to Google Sheet, uncomment below:
    // gasStockService.queueUpdate({ sku, isActive: false });

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
