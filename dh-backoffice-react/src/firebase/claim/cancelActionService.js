import { doc, updateDoc, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { transactionService } from '../transactionService';
import { gasStockService } from '../gasStockService';

const TODOS_COLLECTION = 'todos';

export const cancelActionService = {
  approveCancel: async (task, adminUid, adminName) => {
    const { payload, type, id: todoId } = task;
    const qty = Number(payload.qty || 1);
    const isCancelReturn = type === 'CANCEL_RETURN_APPROVAL';
    
    const isCompleted = task.originalStatus === 'completed';
    const isProcessing = task.originalStatus === 'processing';
    const hasArrived = isProcessing || isCompleted;

    // 1. จัดการสต๊อกของเสีย (Defect Stock)
    // สำหรับการเคลม (Claim) ถ้ารับของเสียมาแล้ว ต้องหักสต๊อกของเสียออก เพราะยกเลิกรายการ
    if (!isCancelReturn && hasArrived) {
        const pRef = doc(db, 'products', payload.sku);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
            await updateDoc(pRef, { defectQuantity: increment(-qty) });
        }
    }

    // 2. หากเป็นการยกเลิกรายการที่ 'completed' ไปแล้ว ต้องดึงสต๊อกและเงินคืน
    if (isCompleted) {
      if (isCancelReturn) {
        // ยกเลิกการคืนสินค้า: ดึงสต๊อกกลับ (-qty) และดึงเงินคืนลูกค้ากลับ
        const pRef = doc(db, 'products', payload.sku);
        let pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
            await updateDoc(pRef, { stockQuantity: increment(-qty) });
            const currentStock = Number(pSnap.data().stockQuantity || 0);
            gasStockService.queueUpdate({ ...pSnap.data(), sku: payload.sku, stockQuantity: currentStock - qty });
            await gasStockService.forceSync();
        }

        let refundAmount = (payload.purchasePrice || 0) * qty;
        const penalty = Number(payload.freebiePenaltyAmount) || 0;
        if (penalty > 0) {
          refundAmount = Math.max(0, refundAmount - penalty);
        }

        if (payload.customerUid && payload.customerUid !== 'Walk-in') {
          await transactionService.recordTransaction({
            uid: payload.customerUid,
            type: 'spend',
            amount: refundAmount,
            referenceId: payload.returnId,
            recordedBy: adminUid,
            note: `ดึงยอดเงินคืนเนื่องจากผู้จัดการยกเลิกการคืนสินค้า${penalty > 0 ? ' (หักลบค่าปรับของแถม)' : ''}`
          });
        }
      } else {
        // ยกเลิกการเคลม: เอาสต๊อกที่เบิกให้ลูกค้าไปแล้ว (+qty) คืนกลับมา
        const pRef = doc(db, 'products', payload.sku);
        let pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
            await updateDoc(pRef, { stockQuantity: increment(qty) });
            const currentStock = Number(pSnap.data().stockQuantity || 0);
            gasStockService.queueUpdate({ ...pSnap.data(), sku: payload.sku, stockQuantity: currentStock + qty });
            await gasStockService.forceSync();
        }
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

  rejectCancel: async (task, reason, adminUid, adminName) => {
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
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  }
};
