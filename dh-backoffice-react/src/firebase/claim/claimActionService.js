import { doc, updateDoc, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';

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
    await updateDoc(doc(db, 'products', payload.sku), { 
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

    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    // ตัดสต๊อกสินค้าดี เพื่อส่งมอบให้ลูกค้า
    await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(-qty) });

    if (payload.orderDocId) {
      await updateDoc(doc(db, 'orders', payload.orderDocId), {
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
      module: 'Claim',
      action: 'Reject',
      target: { id: task.payload.claimId, type: 'Task' },
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
