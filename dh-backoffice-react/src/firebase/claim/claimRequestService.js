import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';
import { historyService } from '../historyService';

const TODOS_COLLECTION = 'todos';

export const claimRequestService = {
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
  }
};
