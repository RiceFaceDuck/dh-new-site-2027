import { doc, updateDoc, serverTimestamp, increment, arrayUnion, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const TODOS_COLLECTION = 'todos';

export const claimActionService = {
  approveRequest: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;

    const updates = {
      status: 'waiting_item',
      handledBy: adminUid,
      updatedAt: serverTimestamp()
    };
    if (payload.trackingNo) {
        updates['payload.trackingNo'] = payload.trackingNo;
    }

    await updateDoc(doc(db, TODOS_COLLECTION, todoId), updates);

    gasHistoryService.log({
      level: 'INFO',
      module: 'Claim',
      action: 'Approve',
      target: { id: payload.claimId, type: 'Task' },
      details: {
        legacy_details: `อนุมัติคำขอเคลม ${payload.sku} (รอรับสินค้าเสียจากลูกค้า)`,
        payload: payload
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  markArrived: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    const qty = Number(payload.qty || 1);
    
    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'processing',
      updatedAt: serverTimestamp()
    });

    // เพิ่มสต๊อกสินค้าเสีย (Defect Stock) ไว้ตรวจสอบทีหลัง
    await updateDoc(doc(db, getCollectionPath('products'), payload.sku), { 
        defectQuantity: increment(qty) 
    });

    gasHistoryService.log({
      level: 'INFO',
      module: 'Claim',
      action: 'ItemArrived',
      target: { id: payload.claimId, type: 'Task' },
      details: {
        legacy_details: `รับของเสียเข้าคลัง (${qty} ชิ้น) กำลังตรวจสอบเพื่อเบิกของใหม่ ${payload.sku}`,
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  completeRequest: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    const qty = Number(payload.qty || 1);

    const updateData = {
      status: 'completed',
      updatedAt: serverTimestamp()
    };
    if (payload.returnTrackingNo) {
        updateData['payload.returnTrackingNo'] = payload.returnTrackingNo;
    }
    
    let finalNewStock = 0;
    let productData = null;

    await runTransaction(db, async (transaction) => {
      const pRef = doc(db, getCollectionPath('products'), payload.sku);
      const pSnap = await transaction.get(pRef);
      if (!pSnap.exists()) {
        throw new Error(`ไม่พบสินค้า SKU: ${payload.sku} ในระบบ`);
      }

      productData = pSnap.data();
      const currentStock = Number(productData.stockQuantity || 0);

      if (currentStock < qty) {
        throw new Error(`สินค้า ${productData.sku} สต็อกคงเหลือไม่เพียงพอสำหรับทำรายการเคลม (คงเหลือ ${currentStock} ชิ้น, ต้องการ ${qty} ชิ้น)`);
      }

      finalNewStock = currentStock - qty;

      transaction.update(pRef, { 
        stockQuantity: finalNewStock,
        'stats.sold': increment(qty)
      });

      transaction.update(doc(db, TODOS_COLLECTION, todoId), updateData);

      if (payload.orderDocId) {
        const orderRef = doc(db, getCollectionPath('orders'), payload.orderDocId);
        transaction.update(orderRef, {
          refundsAndClaims: arrayUnion({
            type: 'Claim',
            id: payload.claimId,
            sku: payload.sku,
            qty: qty,
            amount: 0,
            approvedAt: new Date().toISOString()
          })
        });
      }
    });

    if (productData) {
      gasStockService.queueUpdate({
          ...productData,
          sku: payload.sku,
          stockQuantity: finalNewStock
      });
      await gasStockService.forceSync();
    }

    gasHistoryService.log({
      level: 'INFO',
      module: 'Claim',
      action: 'Completed',
      target: { id: payload.claimId, type: 'Task' },
      details: {
        legacy_details: `เคลมเปลี่ยนสินค้าสำเร็จ ${payload.sku} จำนวน ${qty} ชิ้น (เบิกสต๊อกของใหม่)`,
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });

    // ✨ บันทึกประวัติย่อยระดับ SKU สำหรับการดึงสต๊อกใหม่ไปเคลม
    setTimeout(() => {
      gasHistoryService.log({
        level: 'INFO',
        module: 'Claim',
        action: 'SKU_CLAIM',
        target: { id: payload.sku, type: 'Product' },
        details: {
          type: 'เคลม',
          qtyChange: -qty,
          reference: payload.claimId,
          legacy_details: `ตัดสต๊อกเพื่อเคลมเปลี่ยนสินค้า (${payload.claimId})`
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager' }
      });
    }, 0);

    return true;
  },

  rejectRequest: async (task, reason, adminUid, adminName) => {
    await updateDoc(doc(db, TODOS_COLLECTION, task.id), {
      status: 'rejected',
      handledBy: adminUid,
      rejectReason: reason,
      updatedAt: serverTimestamp()
    });
    
    gasHistoryService.log({
      level: 'ERROR',
      module: 'Claim',
      action: 'Reject',
      target: { id: task.payload.claimId, type: 'Task' },
      details: {
        legacy_details: `ไม่อนุมัติคำขอ: ${reason}`,
        reason: reason,
        task_id: task.id
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  }
};
