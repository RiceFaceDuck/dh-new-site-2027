import { doc, updateDoc, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { transactionService } from '../transactionService';

const TODOS_COLLECTION = 'todos';

export const cancelActionService = {
  approveCancel: async (task, adminUid, adminName) => {
    const { payload, type, id: todoId } = task;
    const qty = Number(payload.qty || 1);
    const isCancelReturn = type === 'CANCEL_RETURN_APPROVAL';
    
    // หากเป็นการยกเลิกรายการที่ 'approved' หรือ 'completed' ไปแล้ว ต้องดึงสต๊อกและเงินคืน
    if (task.originalStatus === 'approved' || task.originalStatus === 'completed') {
      if (isCancelReturn) {
        // ยกเลิกการคืนสินค้า: ดึงสต๊อกกลับ (-qty) และดึงเงินคืนลูกค้ากลับ
        await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(-qty) });
        const refundAmount = (payload.purchasePrice || 0) * qty;
        if (payload.customerUid && payload.customerUid !== 'Walk-in') {
          await transactionService.recordTransaction({
            uid: payload.customerUid,
            type: 'spend',
            amount: refundAmount,
            referenceId: payload.returnId,
            recordedBy: adminUid,
            note: 'ดึงยอดเงินคืนเนื่องจากผู้จัดการยกเลิกการคืนสินค้า'
          });
        }
      } else {
        // ยกเลิกการเคลม: เอาสต๊อกที่เบิกให้ลูกค้าไปแล้ว (+qty) คืนกลับมา
        await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(qty) });
      }

      // เอาออกจากประวัติ order
      if (payload.orderDocId) {
        const orderRef = doc(db, 'orders', payload.orderDocId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.refundsAndClaims) {
            const filteredRC = orderData.refundsAndClaims.filter(rc => rc.id !== payload.returnId && rc.id !== payload.claimId);
            await updateDoc(orderRef, { refundsAndClaims: filteredRC });
          }
        }
      }
    }

    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'cancelled', 
      handledBy: adminUid,
      updatedAt: serverTimestamp()
    });

    const refId = payload.returnId || payload.claimId;
    gasHistoryService.log({
      level: 'WARN',
      module: 'Claim/Return',
      action: 'CancelApproved',
      target: { id: refId, type: 'Task' },
      details: {
        legacy_details: `ผู้จัดการอนุมัติการยกเลิกรายการ และปรับปรุงข้อมูลเรียบร้อย`,
        payload: payload
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  rejectCancel: async (task, reason, adminUid) => {
    await updateDoc(doc(db, TODOS_COLLECTION, task.id), {
      title: task.originalTitle || task.title, 
      type: task.originalType, 
      status: task.originalStatus, 
      rejectCancelReason: reason,
      updatedAt: serverTimestamp()
    });
    
    const refId = task.payload.returnId || task.payload.claimId;
    gasHistoryService.log({
      level: 'ERROR',
      module: 'Claim/Return',
      action: 'RejectCancel',
      target: { id: refId, type: 'Task' },
      details: {
        legacy_details: `ผู้จัดการไม่อนุมัติการยกเลิก: ${reason}`,
        reason: reason,
        task_id: task.id
      },
      actorOverride: { uid: adminUid, name: 'Manager', email: 'N/A' }
    });
    return true;
  }
};
