import { collection, doc, addDoc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';

const TODOS_COLLECTION = 'todos';

export const claimRequestService = {
  // ==========================================
  // 🛠️ 1. ส่งคำร้องขอเคลมสินค้า (Claim)
  // ==========================================
  requestClaim: async (bill, item, claimForm, userUid, userName) => {
    try {
      // 🛡️ Security Check: ป้องกันการแจ้งเคลมซ้ำซ้อนสำหรับสินค้านี้ในบิลนี้
      const q = query(
        collection(db, TODOS_COLLECTION),
        where("referenceId", "==", bill.orderId || '-'),
        where("type", "==", "CLAIM_APPROVAL")
      );
      const snapshot = await getDocs(q);
      const existingClaims = snapshot.docs.map(d => d.data());
      
      const hasDuplicate = existingClaims.some(c => 
        c.payload?.sku === item.sku && 
        ['pending_manager', 'approved', 'processing'].includes(c.status)
      );

      if (hasDuplicate) {
        throw new Error(`สินค้านี้ (${item.sku}) มีรายการเคลมที่กำลังดำเนินการอยู่แล้วในระบบ`);
      }

      const claimId = claimForm.transactionId; // ใช้ transactionId จาก Form

      const payload = {
        claimId: claimId || '', 
        orderId: bill.orderId || '',
        orderDocId: bill.id || '', 
        customerUid: bill.customer?.uid || 'Walk-in', 
        customerName: bill.customer?.name || 'ลูกค้าทั่วไป',
        sku: item.sku || '', 
        productName: item.name || '', 
        category: item.category || item.category1 || '',
        purchaseDate: claimForm.warrantyDate || null,
        symptomCode: claimForm.reasonCode || '', 
        symptomDetails: claimForm.details || '', 
        trackingNo: claimForm.tracking || '',
        qty: claimForm.qty || 1, 
        status: claimForm.currentStatus || 'pending_manager', 
        actionType: claimForm.actionType || 'เคลม/ซ่อม', 
        inspectorName: claimForm.inspectorName || null,
        images: claimForm.images || [], 
        requestedBy: userUid || '', 
        requestedByName: userName || ''
      };

      await addDoc(collection(db, TODOS_COLLECTION), {
        type: "CLAIM_APPROVAL",
        title: `ขออนุมัติเคลม: ${item.name || 'Unknown'} (${claimId || 'N/A'})`,
        description: `บิลอ้างอิง: ${bill.orderId || '-'}\nอาการเสีย: ${claimForm.reasonCode || '-'}\nรายละเอียด: ${claimForm.details || '-'}\nการกระทำ: ${claimForm.actionType || '-'}\nจำนวน: ${payload.qty} ชิ้น`,
        priority: "High", 
        status: "pending_manager",
        referenceType: "Order", 
        referenceId: bill.orderId || '-',
        payload: payload, 
        createdByUid: userUid || '', 
        handledBy: null,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      });

      gasHistoryService.log({
        level: 'INFO',
        module: 'Claim',
        action: 'Request',
        target: { id: claimId, type: 'Task' },
        details: {
          legacy_details: `พนักงาน ${userName} ทำรายการแจ้งเคลมสินค้า ${item.sku} รหัส ${claimId} (รออนุมัติ)`,
          payload: payload
        },
        actorOverride: { uid: userUid, name: userName, email: 'N/A' }
      });
      return claimId;
    } catch (error) { throw error; }
  },

  // ==========================================
  // 📦 2. ส่งคำร้องขอคืนสินค้า (Return)
  // ==========================================
  requestReturn: async (bill, item, returnForm, userUid, userName) => {
    try {
      // 🛡️ Security Check: ป้องกันการแจ้งคืนซ้ำซ้อนสำหรับสินค้านี้ในบิลนี้
      const q = query(
        collection(db, TODOS_COLLECTION),
        where("referenceId", "==", bill.orderId || '-'),
        where("type", "==", "RETURN_APPROVAL")
      );
      const snapshot = await getDocs(q);
      const existingReturns = snapshot.docs.map(d => d.data());
      
      const hasDuplicate = existingReturns.some(r => 
        r.payload?.sku === item.sku && 
        ['pending_manager', 'approved', 'processing'].includes(r.status)
      );

      if (hasDuplicate) {
        throw new Error(`สินค้านี้ (${item.sku}) มีรายการขอคืนเงินที่กำลังดำเนินการอยู่แล้วในระบบ`);
      }

      const returnId = returnForm.transactionId;

      const payload = {
        returnId: returnId || '', 
        orderId: bill.orderId || '',
        orderDocId: bill.id || '', 
        customerUid: bill.customer?.uid || 'Walk-in', 
        customerName: bill.customer?.name || 'ลูกค้าทั่วไป',
        sku: item.sku || '', 
        productName: item.name || '', 
        category: item.category || item.category1 || '',
        purchasePrice: item.pricePerUnit || item.price || 0, 
        purchaseDate: returnForm.warrantyDate || null,
        returnReason: returnForm.reasonCode || '', 
        returnDetails: returnForm.details || '', 
        trackingNo: returnForm.tracking || '',
        qty: returnForm.qty || 1, 
        status: returnForm.currentStatus || 'pending_manager', 
        actionType: returnForm.actionType || 'คืนเงิน/คืนสินค้า', 
        inspectorName: returnForm.inspectorName || null,
        images: returnForm.images || [], 
        requestedBy: userUid || '', 
        requestedByName: userName || ''
      };

      await addDoc(collection(db, TODOS_COLLECTION), {
        type: "RETURN_APPROVAL",
        title: `ขออนุมัติคืนสินค้า: ${item.sku || 'Unknown'} (ยอด ฿${((payload.purchasePrice || 0) * (payload.qty || 1)).toLocaleString()})`,
        description: `บิลอ้างอิง: ${bill.orderId || '-'}\nเหตุผลการคืน: ${returnForm.reasonCode || '-'}\nรายละเอียด: ${returnForm.details || '-'}\nการกระทำ: ${returnForm.actionType || '-'}\nจำนวน: ${payload.qty} ชิ้น`,
        priority: "Critical", 
        status: "pending_manager",
        referenceType: "Order", 
        referenceId: bill.orderId || '-',
        payload: payload, 
        createdByUid: userUid || '', 
        handledBy: null,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      });

      gasHistoryService.log({
        level: 'INFO',
        module: 'Return',
        action: 'Request',
        target: { id: returnId, type: 'Task' },
        details: {
          legacy_details: `พนักงาน ${userName} ทำรายการแจ้งคืนสินค้า ${item.sku} (รออนุมัติ)`,
          payload: payload
        },
        actorOverride: { uid: userUid, name: userName, email: 'N/A' }
      });
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

      gasHistoryService.log({
        level: 'WARN',
        module: 'Claim/Return',
        action: 'RequestCancel',
        target: { id: refId, type: 'Task' },
        details: {
          legacy_details: `พนักงานขออนุมัติยกเลิกรายการ: ${reason}`,
          reason: reason,
          task_id: task.id
        },
        actorOverride: { uid: userUid, name: userName, email: 'N/A' }
      });
      return true;
    } catch (error) { throw error; }
  }
};
