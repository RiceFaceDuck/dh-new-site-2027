import { limit, writeBatch, collection, doc, serverTimestamp, getDocs, query, where, documentId } from 'firebase/firestore';
import { db, auth } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const inventoryImportService = {
  // Check which SKUs already exist and fetch their data
  fetchExistingProducts: async (skus) => {
    try {
      const existingProducts = new Map();
      const chunks = [];
      for (let i = 0; i < skus.length; i += 30) {
        chunks.push(skus.slice(i, i + 30));
      }
      
      const chunkPromises = chunks.map(chunk => {
        const q = query(collection(db, getCollectionPath('products')), where(documentId(), 'in', chunk), limit(300));
        return getDocs(q);
      });
      
      const snapshots = await Promise.all(chunkPromises);
      snapshots.forEach(snap => {
        snap.forEach(doc => existingProducts.set(doc.id, doc.data()));
      });
      
      return existingProducts;
    } catch (error) {
      console.error("🔥 Error in fetchExistingProducts:", error);
      throw error;
    }
  },

  processBulkImport: async (products, conflictStrategy) => {
    try {
      const skus = products.map(p => p.sku);
      const existingProductsMap = await inventoryImportService.fetchExistingProducts(skus);
      
      const toWrite = [];
      const toSkip = [];
      
      products.forEach(p => {
        if (existingProductsMap.has(p.sku)) {
          if (conflictStrategy === 'overwrite') {
            toWrite.push(p);
          } else {
            toSkip.push(p); // skip is default for existing if not overwrite
          }
        } else {
          toWrite.push(p); // New items always written
        }
      });
      
      // Batch write toWrite items (max 500 ops per batch)
      if (toWrite.length > 0) {
        const chunks = [];
        for (let i = 0; i < toWrite.length; i += 500) {
          chunks.push(toWrite.slice(i, i + 500));
        }
        
        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(p => {
            const docRef = doc(db, getCollectionPath('products'), p.sku);
            const isNew = !existingProductsMap.has(p.sku);
            const existingData = existingProductsMap.get(p.sku);
            
            // Inject category_lower for frontend query support
            if (p.category) {
              p.category_lower = p.category.trim().toLowerCase();
            }

            // 📦 บันทึกประวัติสินค้าเข้าจาก Excel Import (Fix Duplicate Stock Receipt Bug)
            const isAddStockExplicit = p._addStockAmount !== undefined;
            const addedStock = Number(p._addStockAmount || 0);
            const newStockQty = Number(p.stockQuantity || 0);
            
            // Clean up temporary frontend properties before saving
            const productDataToSave = { ...p };
            delete productDataToSave._addStockAmount;
            delete productDataToSave._hasStockConflict;

            batch.set(docRef, {
              ...productDataToSave,
              updatedAt: serverTimestamp(),
              // Only set createdAt if new (merge handles it, but just safely applying it)
              ...(isNew ? { createdAt: serverTimestamp() } : {})
            }, { merge: true }); 
            
            if (isNew && newStockQty > 0) {
               // ของใหม่ รับเข้าตามจำนวน
               const receiptRef = doc(collection(db, getCollectionPath('stock_receipts')));
               batch.set(receiptRef, {
                 sku: p.sku,
                 quantity: newStockQty,
                 source: 'excel_import',
                 createdBy: auth.currentUser?.uid || 'System',
                 createdAt: serverTimestamp()
               });
            } else if (!isNew && isAddStockExplicit && addedStock > 0) {
               // ของเก่า และผู้ใช้อัพช่อง AddStock เท่านั้น ถึงจะนับว่าเป็นการรับเข้า
               const receiptRef = doc(collection(db, getCollectionPath('stock_receipts')));
               batch.set(receiptRef, {
                 sku: p.sku,
                 quantity: addedStock,
                 source: 'excel_import_addstock',
                 createdBy: auth.currentUser?.uid || 'System',
                 createdAt: serverTimestamp()
               });
            }
          });
          await batch.commit();
        }
        
        gasHistoryService.log({
          level: 'INFO',
          module: 'Inventory',
          action: 'Bulk Import Summary',
          target: { id: 'Multiple', type: 'System' },
          details: {
            legacy_details: `นำเข้าสินค้าสำเร็จ ${toWrite.length} รายการ`,
            tags: ['bulk_import', 'summary']
          }
        });

        toWrite.forEach(p => {
          const isNew = !existingProductsMap.has(p.sku);
          
          // 🚀 Queue update to Google Sheets so Realtime BigSeller Sync detects it
          gasStockService.queueUpdate(p);

          gasHistoryService.log({
            level: 'INFO',
            module: 'Inventory',
            action: isNew ? 'Create (Import)' : 'Update (Import)',
            target: { id: p.sku, name: p.name, type: 'Product' },
            details: {
              legacy_details: `นำเข้าข้อมูลสินค้า: ${p.sku}`,
              data: p,
              tags: ['bulk_import', 'excel_import', p.sku]
            }
          });
        });
      }
      
      return {
        successCount: toWrite.length,
        skippedCount: toSkip.length,
        todoCount: 0
      };
    } catch (error) {
      console.error("🔥 Error in processBulkImport:", error);
      throw error;
    }
  }
};
