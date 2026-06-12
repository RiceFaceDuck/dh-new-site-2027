import { doc, updateDoc, serverTimestamp, increment, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { transactionService } from '../transactionService';

const TODOS_COLLECTION = 'todos';

export const claimManagerService = {
  // ==========================================
  // ✅ 4. อนุมัติรายการ (ผู้จัดการ) - ควบคุมทั้งเคลม/คืน/และยกเลิก
  // ==========================================
  approveRequest: async (task, adminUid, adminName) => {
    const { payload, type, id: todoId } = task;
    const qty = Number(payload.qty || 1);

    if (type === 'CANCEL_CLAIM_APPROVAL' || type === 'CANCEL_RETURN_APPROVAL') {
      const isCancelReturn = type === 'CANCEL_RETURN_APPROVAL';
      
      if (task.originalStatus === 'approved') {
        if (isCancelReturn) {
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
          await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(qty) });
        }

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
          legacy_details: `ผู้จัดการอนุมัติการยกเลิกรายการ และปรับปรุงสต๊อกเรียบร้อย`,
          payload: payload
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
      });
      return true;
    }

    const isReturn = type === 'RETURN_APPROVAL';
    const isClaim = type === 'CLAIM_APPROVAL';

    // ✨ UX UPGRADE: Update task with tracking number if provided by Manager
    const updates = {
      status: 'approved',
      handledBy: adminUid,
      updatedAt: serverTimestamp()
    };
    if (payload.trackingNo) {
        updates['payload.trackingNo'] = payload.trackingNo;
    }

    await updateDoc(doc(db, TODOS_COLLECTION, todoId), updates);

    if (isReturn) {
      await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(qty) });
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
      gasHistoryService.log({
        level: 'INFO',
        module: 'Return',
        action: 'Approve',
        target: { id: payload.returnId, type: 'Task' },
        details: {
          legacy_details: `อนุมัติคืนสินค้า ${payload.sku} จำนวน ${qty} ชิ้น (คืนเงิน ฿${refundAmount})`,
          payload: payload,
          financials: { refundAmount }
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
      });
    
    } else if (isClaim) {
      await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(-qty) });
      
      gasHistoryService.log({
        level: 'INFO',
        module: 'Claim',
        action: 'Approve',
        target: { id: payload.claimId, type: 'Task' },
        details: {
          legacy_details: `อนุมัติเคลมสินค้า ${payload.sku} จำนวน ${qty} ชิ้น (เบิกสต๊อกของใหม่)`,
          payload: payload
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
      });
    }

    if (payload.orderDocId) {
      await updateDoc(doc(db, 'orders', payload.orderDocId), {
        refundsAndClaims: arrayUnion({
          type: isReturn ? 'Return' : 'Claim',
          id: isReturn ? payload.returnId : payload.claimId,
          sku: payload.sku,
          qty: qty,
          amount: isReturn ? (payload.purchasePrice * qty) : 0,
          approvedAt: new Date().toISOString()
        })
      });
    }
    return true;
  },

  // ==========================================
  // ❌ 5. ไม่อนุมัติรายการ (ผู้จัดการ)
  // ==========================================
  rejectRequest: async (task, reason, adminUid) => {
    if (task.type === 'CANCEL_CLAIM_APPROVAL' || task.type === 'CANCEL_RETURN_APPROVAL') {
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

    await updateDoc(doc(db, TODOS_COLLECTION, task.id), {
      status: 'rejected',
      handledBy: adminUid,
      rejectReason: reason,
      updatedAt: serverTimestamp()
    });
    
    const refId = task.payload.returnId || task.payload.claimId;
    const logType = task.type === 'RETURN_APPROVAL' ? 'Return' : 'Claim';
    
    gasHistoryService.log({
      level: 'ERROR',
      module: logType,
      action: 'Reject',
      target: { id: refId, type: 'Task' },
      details: {
        legacy_details: `ไม่อนุมัติคำขอ: ${reason}`,
        reason: reason,
        task_id: task.id,
        payload: task.payload
      },
      actorOverride: { uid: adminUid, name: 'Manager', email: 'N/A' }
    });
    return true;
  }
};
