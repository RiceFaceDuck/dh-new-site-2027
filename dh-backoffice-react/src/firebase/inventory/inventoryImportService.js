import { writeBatch, collection, doc, serverTimestamp, getDocs, query, where, documentId, setDoc } from 'firebase/firestore';
import { db, auth } from '../config';
import { gasHistoryService } from '../gasHistoryService';

export const inventoryImportService = {
  // Check which SKUs already exist (chunked to respect 30 items 'in' limit)
  checkExistingSkus: async (skus) => {
    const existingSkus = new Set();
    const chunks = [];
    for (let i = 0; i < skus.length; i += 30) {
      chunks.push(skus.slice(i, i + 30));
    }
    
    for (const chunk of chunks) {
      const q = query(collection(db, 'products'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach(doc => existingSkus.add(doc.id));
    }
    
    return existingSkus;
  },

  processBulkImport: async (products, conflictStrategy) => {
    const skus = products.map(p => p.sku);
    const existingSkus = await inventoryImportService.checkExistingSkus(skus);
    
    const toWrite = [];
    const toSkip = [];
    const toTodo = [];
    
    products.forEach(p => {
      if (existingSkus.has(p.sku)) {
        if (conflictStrategy === 'overwrite') {
          toWrite.push(p);
        } else if (conflictStrategy === 'todo') {
          toTodo.push(p);
        } else {
          toSkip.push(p);
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
          const docRef = doc(db, 'products', p.sku);
          
          // Inject category_lower for frontend query support
          if (p.category) {
            p.category_lower = p.category.trim().toLowerCase();
          }

          batch.set(docRef, {
            ...p,
            updatedAt: serverTimestamp(),
            // Only set createdAt if new (merge handles it, but just safely applying it)
            ...(existingSkus.has(p.sku) ? {} : { createdAt: serverTimestamp() })
          }, { merge: true }); // Merge ensures we don't accidentally wipe fields we didn't specify
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
        const isNew = !existingSkus.has(p.sku);
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
    
    // Send to-do if requested
    if (toTodo.length > 0) {
      const todoId = `T-${Date.now()}`;
      const docRef = doc(db, 'todos', todoId);
      await setDoc(docRef, {
        type: 'PRODUCT_IMPORT_APPROVAL',
        title: `ตรวจสอบนำเข้าสินค้า (SKU ซ้ำ) ${toTodo.length} รายการ`,
        description: `พบ SKU ซ้ำซ้อนขณะนำเข้าด้วย Excel กรุณาตรวจสอบและอนุมัติการอัพเดทข้อมูลทับของเดิม`,
        priority: 'Normal',
        status: 'pending_manager',
        referenceType: 'BulkImport',
        referenceId: todoId,
        payload: { items: toTodo },
        createdByUid: auth.currentUser?.uid || 'System',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return {
      successCount: toWrite.length,
      skippedCount: toSkip.length,
      todoCount: toTodo.length
    };
  }
};
