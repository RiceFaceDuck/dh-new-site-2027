import { collection, doc, addDoc, updateDoc, serverTimestamp, increment, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { transactionService } from './transactionService';

const TODOS_COLLECTION = 'todos';

export const claimService = {
  // ==========================================
  // 🛠️ 1. ส่งคำร้องขอเคลมสินค้า (Claim)
  // ==========================================
  requestClaim: async (bill, item, claimForm, userUid, userName) => {
    try {
      const claimId = claimForm.transactionId; // ใช้ transactionId จาก Form

      const payload = {
        claimId, 
        orderId: bill.orderId,
        orderDocId: bill.id, 
        customerUid: bill.customer?.uid || 'Walk-in', 
        customerName: bill.customer?.name || 'ลูกค้าทั่วไป',
        sku: item.sku, 
        productName: item.name, 
        purchaseDate: claimForm.warrantyDate,
        symptomCode: claimForm.reasonCode, 
        symptomDetails: claimForm.details, 
        trackingNo: claimForm.tracking || '',
        qty: claimForm.qty || 1, 
        status: claimForm.currentStatus, // รับสถานะปัจจุบันจาก Form
        actionType: claimForm.actionType, // การกระทำ (เคลมสินค้า)
        inspectorName: claimForm.inspectorName,
        images: claimForm.images || [], // รับภาพที่อัปโหลด
        requestedBy: userUid, 
        requestedByName: userName
      };

      await addDoc(collection(db, TODOS_COLLECTION), {
        type: "CLAIM_APPROVAL",
        title: `ขออนุมัติเคลม: ${item.name} (${claimId})`,
        description: `บิลอ้างอิง: ${bill.orderId}\nอาการเสีย: ${claimForm.reasonCode}\nรายละเอียด: ${claimForm.details || '-'}\nการกระทำ: ${claimForm.actionType}\nจำนวน: ${payload.qty} ชิ้น`,
        priority: "High", 
        status: "pending_manager",
        referenceType: "Order", 
        referenceId: bill.orderId,
        payload: payload, 
        createdByUid: userUid, 
        handledBy: null,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      });

      await historyService.addLog('Claim', 'Request', claimId, `พนักงาน ${userName} ทำรายการแจ้งเคลมสินค้า ${item.sku} รหัส ${claimId} (รออนุมัติ)`, userUid);
      return claimId;
    } catch (error) { throw error; }
  },

  // ==========================================
  // 📦 2. ส่งคำร้องขอคืนสินค้า (Return)
  // ==========================================
  requestReturn: async (bill, item, returnForm, userUid, userName) => {
    try {
      const returnId = returnForm.transactionId;

      const payload = {
        returnId, 
        orderId: bill.orderId,
        orderDocId: bill.id, 
        customerUid: bill.customer?.uid || 'Walk-in', 
        customerName: bill.customer?.name || 'ลูกค้าทั่วไป',
        sku: item.sku, 
        productName: item.name, 
        purchasePrice: item.pricePerUnit || item.price, 
        purchaseDate: returnForm.warrantyDate,
        returnReason: returnForm.reasonCode, 
        returnDetails: returnForm.details, 
        trackingNo: returnForm.tracking || '',
        qty: returnForm.qty || 1, 
        status: returnForm.currentStatus, 
        actionType: returnForm.actionType, 
        inspectorName: returnForm.inspectorName,
        images: returnForm.images || [], 
        requestedBy: userUid, 
        requestedByName: userName
      };

      await addDoc(collection(db, TODOS_COLLECTION), {
        type: "RETURN_APPROVAL",
        title: `ขออนุมัติคืนสินค้า: ${item.sku} (ยอด ฿${(payload.purchasePrice * payload.qty).toLocaleString()})`,
        description: `บิลอ้างอิง: ${bill.orderId}\nเหตุผลการคืน: ${returnForm.reasonCode}\nรายละเอียด: ${returnForm.details || '-'}\nการกระทำ: ${returnForm.actionType}\nจำนวน: ${payload.qty} ชิ้น`,
        priority: "Critical", 
        status: "pending_manager",
        referenceType: "Order", 
        referenceId: bill.orderId,
        payload: payload, 
        createdByUid: userUid, 
        handledBy: null,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      });

      await historyService.addLog('Return', 'Request', returnId, `พนักงาน ${userName} ทำรายการแจ้งคืนสินค้า ${item.sku} (รออนุมัติ)`, userUid);
      return returnId;
    } catch (error) { throw error; }
  },

  // ==========================================
  // ⚠️ 3. ส่งคำร้องขอยกเลิกรายการเคลม/คืน (Request Cancel)
  // ==========================================
  requestCancelTodo: async (task, reason, userUid, userName) => {
    try {
      const docRef = doc(db, TODOS_COLLECTION, task.id);
      
      const newType = task.type === 'CLAIM_APPROVAL' ? 'CANCEL_CLAIM_APPROVAL' : 'CANCEL_RETURN_APPROVAL';
      const refId = task.payload.returnId || task.payload.claimId;

      const newTitle = task.type === 'CLAIM_APPROVAL' 
        ? `ขอยกเลิกใบเคลม: ${task.payload.productName} (${refId})`
        : `ขอยกเลิกใบคืนสินค้า: ${task.payload.productName} (${refId})`;

      await updateDoc(docRef, {
        originalTitle: task.title, 
        title: newTitle, 
        originalType: task.type,
        originalStatus: task.status, 
        type: newType,
        status: 'pending_manager', 
        cancelReason: reason,
        cancelRequestedBy: userUid,
        cancelRequestedByName: userName,
        updatedAt: serverTimestamp()
      });

      await historyService.addLog('Claim/Return', 'RequestCancel', refId, `พนักงานขออนุมัติยกเลิกรายการ: ${reason}`, userUid);
      return true;
    } catch (error) { throw error; }
  },

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
            await updateDoc(doc(db, 'members', payload.customerUid), { walletBalance: increment(-refundAmount) });
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

    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'approved',
      handledBy: adminUid,
      updatedAt: serverTimestamp()
    });

    if (isReturn) {
      await updateDoc(doc(db, 'products', payload.sku), { stockQuantity: increment(qty) });
      const refundAmount = (payload.purchasePrice || 0) * qty;
      if (payload.customerUid && payload.customerUid !== 'Walk-in') {
        await updateDoc(doc(db, 'members', payload.customerUid), { walletBalance: increment(refundAmount) });
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