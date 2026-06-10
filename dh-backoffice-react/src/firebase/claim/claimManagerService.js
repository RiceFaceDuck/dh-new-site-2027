import { doc, updateDoc, serverTimestamp, increment, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { historyService } from '../historyService';
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
      await historyService.addLog('Claim/Return', 'CancelApproved', refId, `ผู้จัดการอนุมัติการยกเลิกรายการ และปรับปรุงสต๊อกเรียบร้อย`, adminUid);
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
      await historyService.addLog('Return', 'Approve', payload.returnId, `อนุมัติคืนสินค้า ${payload.sku} จำนวน ${qty} ชิ้น (คืนเงิน ฿${refundAmount})`, adminUid);
    
    } else if (isClaim) {
      await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(-qty) });
      await historyService.addLog('Claim', 'Approve', payload.claimId, `อนุมัติเคลมสินค้า ${payload.sku} จำนวน ${qty} ชิ้น (เบิกสต๊อกของใหม่)`, adminUid);
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
      await historyService.addLog('Claim/Return', 'RejectCancel', refId, `ผู้จัดการไม่อนุมัติการยกเลิก: ${reason}`, adminUid);
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
    await historyService.addLog(logType, 'Reject', refId, `ไม่อนุมัติคำขอ: ${reason}`, adminUid);
    return true;
  }
};
