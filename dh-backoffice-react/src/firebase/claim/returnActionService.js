import { doc, updateDoc, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { transactionService } from '../transactionService';

const TODOS_COLLECTION = 'todos';

export const returnActionService = {
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
      module: 'Return',
      action: 'Approve',
      target: { id: payload.returnId, type: 'Task' },
      details: {
        legacy_details: `อนุมัติคำขอคืนสินค้า ${payload.sku} (รอรับสินค้าจากลูกค้า)`,
        payload: payload
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  markArrived: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    
    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'processing',
      updatedAt: serverTimestamp()
    });

    gasHistoryService.log({
      level: 'INFO',
      module: 'Return',
      action: 'ItemArrived',
      target: { id: payload.returnId, type: 'Task' },
      details: {
        legacy_details: `รับสินค้าคืนแล้ว กำลังตรวจสอบสภาพสินค้า ${payload.sku}`,
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  completeRequest: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    const qty = Number(payload.qty || 1);

    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    // 1. เพิ่มสต๊อกกลับเข้าคลัง
    await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(qty) });
    
    // 2. คืนเงินให้ลูกค้า (ถ้าไม่ใช่ลูกค้าทั่วไป)
    const refundAmount = (payload.purchasePrice || 0) * qty;
    if (payload.customerUid && payload.customerUid !== 'Walk-in') {
      await transactionService.recordTransaction({
        uid: payload.customerUid,
        type: 'refund',
        amount: refundAmount,
        referenceId: payload.returnId,
        recordedBy: adminUid
      });
    }

    // 3. บันทึกประวัติบิล
    if (payload.orderDocId) {
      await updateDoc(doc(db, 'orders', payload.orderDocId), {
        refundsAndClaims: arrayUnion({
          type: 'Return',
          id: payload.returnId,
          sku: payload.sku,
          qty: qty,
          amount: refundAmount,
          approvedAt: new Date().toISOString()
        })
      });
    }

    gasHistoryService.log({
      level: 'INFO',
      module: 'Return',
      action: 'Completed',
      target: { id: payload.returnId, type: 'Task' },
      details: {
        legacy_details: `คืนสินค้าสำเร็จ ${payload.sku} จำนวน ${qty} ชิ้น (คืนเงิน ฿${refundAmount})`,
        financials: { refundAmount }
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  rejectRequest: async (task, reason, adminUid) => {
    await updateDoc(doc(db, TODOS_COLLECTION, task.id), {
      status: 'rejected',
      handledBy: adminUid,
      rejectReason: reason,
      updatedAt: serverTimestamp()
    });
    
    gasHistoryService.log({
      level: 'ERROR',
      module: 'Return',
      action: 'Reject',
      target: { id: task.payload.returnId, type: 'Task' },
      details: {
        legacy_details: `ไม่อนุมัติคำขอ: ${reason}`,
        reason: reason,
        task_id: task.id
      },
      actorOverride: { uid: adminUid, name: 'Manager', email: 'N/A' }
    });
    return true;
  }
};
