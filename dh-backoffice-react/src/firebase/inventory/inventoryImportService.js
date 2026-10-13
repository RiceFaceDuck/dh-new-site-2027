import { limit, writeBatch, collection, doc, serverTimestamp, getDocs, query, where, documentId } from 'firebase/firestore';
import { db, auth } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const inventoryImportService = {
  // Check which SKUs already exist and fetch their data using Local-First 3-Tier Cache
  fetchExistingProducts: async (skus) => {
    try {
      const existingProducts = new Map();
      if (!skus || skus.length === 0) return existingProducts;

      // 🚀 Tier 1 & 2: ตรวจสอบจาก Local Cache (IndexedDB / Session) ก่อนเป็นด่านแรก (0 Reads)
      let cachedCatalog = [];
      try {
        const { catalogHydrationService } = await import('../catalogHydrationService');
        const fastResult = await catalogHydrationService.hydrateCatalog();
        if (Array.isArray(fastResult?.products)) {
          cachedCatalog = fastResult.products;
        }
      } catch (cacheErr) {
        console.warn('⚠️ [inventoryImportService] Local catalog check fallback:', cacheErr.message);
      }

      const cachedMap = new Map();
      cachedCatalog.forEach(p => {
        if (p.sku) cachedMap.set(String(p.sku).trim().toUpperCase(), p);
      });

      const missingSkus = [];
      skus.forEach(sku => {
        const upper = String(sku).trim().toUpperCase();
        if (cachedMap.has(upper)) {
          existingProducts.set(upper, cachedMap.get(upper));
        } else {
          missingSkus.push(upper);
        }
      });

      // หากมี SKU ตัวใดที่ไม่มีในแคช ค่อยดึงเฉพาะ Delta จาก Firestore (ประหยัด Reads มหาศาล)
      if (missingSkus.length > 0) {
        const chunks = [];
        for (let i = 0; i < missingSkus.length; i += 30) {
          chunks.push(missingSkus.slice(i, i + 30));
        }
        
        const chunkPromises = chunks.map(chunk => {
          const q = query(collection(db, getCollectionPath('products')), where(documentId(), 'in', chunk), limit(300));
          return getDocs(q);
        });
        
        const snapshots = await Promise.all(chunkPromises);
        snapshots.forEach(snap => {
          snap.forEach(docSnap => existingProducts.set(docSnap.id, docSnap.data()));
        });
      }
      
      return existingProducts;
    } catch (error) {
      console.error("🔥 Error in fetchExistingProducts:", error);
      throw error;
    }
  },

  processBulkImport: async (products, conflictStrategy, existingMapProvided = null) => {
    try {
      // 🚀 ประหยัด Reads: หากส่ง existingMap ที่เช็คไว้ตั้งแต่ตอนพรีวิวมา ให้ใช้ทันที ไม่ต้อง query ซ้ำซ้อน
      let existingProductsMap = existingMapProvided;
      if (!existingProductsMap) {
        const skus = products.map(p => p.sku);
        existingProductsMap = await inventoryImportService.fetchExistingProducts(skus);
      }
      
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
      
      // 🛡️ Batch Write Guard: คุมจำนวน Operations รวมต่อ Batch ไม่ให้เกิน 400 ops (Firestore Max = 500)
      if (toWrite.length > 0) {
        const batches = [];
        let currentBatch = writeBatch(db);
        let currentOps = 0;

        for (const p of toWrite) {
          const isNew = !existingProductsMap.has(p.sku);
          const isAddStockExplicit = p._addStockAmount !== undefined;
          const addedStock = Number(p._addStockAmount || 0);
          const newStockQty = Number(p.stockQuantity || 0);
          
          // คำนวณ ops ที่รายการนี้ต้องใช้: 1 (product) + (receipt ถ้ามี)
          const willCreateReceipt = (isNew && newStockQty > 0) || (!isNew && isAddStockExplicit && addedStock > 0);
          const requiredOps = willCreateReceipt ? 2 : 1;

          // ถ้า ops สะสมรวมกับรายการนี้จะเกิน 400 ให้ตัดเป็น batch ใหม่ทันที
          if (currentOps + requiredOps > 400) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            currentOps = 0;
          }

          const docRef = doc(db, getCollectionPath('products'), p.sku);
          
          if (p.category) {
            p.category_lower = p.category.trim().toLowerCase();
          }

          const productDataToSave = { ...p };
          delete productDataToSave._addStockAmount;
          delete productDataToSave._hasStockConflict;

          currentBatch.set(docRef, {
            ...productDataToSave,
            updatedAt: serverTimestamp(),
            ...(isNew ? { createdAt: serverTimestamp() } : {})
          }, { merge: true });
          currentOps += 1;

          if (willCreateReceipt) {
            const receiptRef = doc(collection(db, getCollectionPath('stock_receipts')));
            currentBatch.set(receiptRef, {
              sku: p.sku,
              quantity: isNew ? newStockQty : addedStock,
              source: isNew ? 'excel_import' : 'excel_import_addstock',
              createdBy: auth.currentUser?.uid || 'System',
              createdAt: serverTimestamp()
            });
            currentOps += 1;
          }
        }

        if (currentOps > 0) {
          batches.push(currentBatch);
        }

        // Commit ทุก Batch ตามลำดับ
        for (const b of batches) {
          await b.commit();
        }
        
        // 🚀 รวบ Summary Audit Log บันทึกเพียง 1 ครั้ง ไม่ยิง Loop N พันครั้ง
        gasHistoryService.log({
          level: 'INFO',
          module: 'Inventory',
          action: 'Bulk Import Summary',
          target: { id: 'Multiple', type: 'System' },
          details: {
            legacy_details: `นำเข้าสินค้าสำเร็จ ${toWrite.length} รายการ (ข้าม ${toSkip.length} รายการ)`,
            totalWritten: toWrite.length,
            totalSkipped: toSkip.length,
            tags: ['bulk_import', 'summary']
          }
        });

        // คิวซิงค์ Google Sheets (Background asynchronous)
        toWrite.forEach(p => {
          gasStockService.queueUpdate(p);
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
