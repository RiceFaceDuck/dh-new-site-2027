import { collection, doc, updateDoc, serverTimestamp, getDocs, query, where, runTransaction, limit } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const CLAIMS_COLLECTION = getCollectionPath('claims');

const getItemCategory = (item) => {
  let cat = item.category || item.category1 || item.type || '';
  if (!cat && item.sku) {
    const skuUpper = item.sku.toUpperCase();
    if (skuUpper.startsWith('FADE') || skuUpper.startsWith('FAN')) cat = 'FAN';
    else if (skuUpper.startsWith('SCR') || skuUpper.startsWith('PANEL')) cat = 'Panel';
    else if (skuUpper.startsWith('BAT')) cat = 'Battery';
    else if (skuUpper.startsWith('ADAP') || skuUpper.startsWith('CHARGER')) cat = 'Adapter';
    else if (skuUpper.startsWith('KEY') || skuUpper.startsWith('KB')) cat = 'Keyboard';
  }
  return cat;
};

export const claimRequestService = {
  // ==========================================
  // 🛠️ 1. ส่งคำร้องขอเคลมสินค้า (Claim)
  // ==========================================
  requestClaim: async (bill, item, claimForm, userUid, userName) => {
    try {
      // 🛡️ Security Check: ป้องกันการแจ้งเคลมซ้ำซ้อนสำหรับสินค้านี้ในบิลนี้
      const q = query(
        collection(db, CLAIMS_COLLECTION),
        where("referenceId", "==", bill.orderId || '-'),
        where("type", "in", ["CLAIM_APPROVAL", "EXCHANGE_APPROVAL"]),
        limit(10)
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

      const claimId = await runTransaction(db, async (transaction) => {
        const date = new Date();
        const yearMonth = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const { getRandomShard } = await import('dh-shared/src/utils/counterUtils');
        const shardId = getRandomShard(5);
        const counterRef = doc(db, getCollectionPath('counters'), `claim_sequence_${shardId}`);
        const counterDoc = await transaction.get(counterRef);

        let currentSeq = 1;
        if (counterDoc.exists()) {
           const data = counterDoc.data();
           currentSeq = (data[yearMonth] || 0) + 1;
        }

        const isSwap = !!claimForm.isSwapSku;
        const prefix = isSwap ? 'EXC' : 'CLM';
        const generatedId = `${prefix}-${yearMonth}-${shardId}-${String(currentSeq).padStart(4, '0')}`;

        transaction.set(counterRef, {
           [yearMonth]: currentSeq,
           updatedAt: serverTimestamp()
        }, { merge: true });

        const payload = {
          claimId: generatedId, 
          exchangeId: isSwap ? generatedId : null,
          orderId: bill.orderId || '',
          orderDocId: bill.id || '', 
          customerUid: bill.customer?.uid || 'Walk-in', 
          customerName: bill.customer?.name || 'ลูกค้าทั่วไป',
          sku: item.sku || '', 
          productName: item.name || '', 
          category: getItemCategory(item),
          purchaseDate: claimForm.warrantyDate || null,
          symptomCode: claimForm.reasonCode || '', 
          symptomDetails: claimForm.details || '', 
          trackingNo: claimForm.tracking || '',
          qty: claimForm.qty || 1, 
          status: claimForm.currentStatus || 'pending_manager', 
          actionType: claimForm.actionType || (isSwap ? 'เปลี่ยนสินค้า (EXC)' : 'เคลม/ซ่อม'), 
          inspectorName: claimForm.inspectorName || null,
          images: claimForm.images || [], 
          
          // ✅ [SECURITY FIX] เพิ่มข้อมูลสำหรับการเปลี่ยนสินค้า (Swap SKU)
          originalPricePerUnit: item.pricePerUnit || item.price || 0,
          isSwapSku: isSwap,
          swapSku: claimForm.swapSku || null,
          swapProductName: claimForm.swapProductName || null,
          swapPricePerUnit: claimForm.swapPricePerUnit || 0,
          newWarrantyDays: claimForm.newWarrantyDays || null,
          freebiePenaltyAmount: claimForm.freebiePenaltyAmount || 0,
          freebiesStatus: claimForm.freebiesStatus || null,

          requestedBy: userUid || '', 
          requestedByName: userName || ''
        };

        const newClaimRef = doc(collection(db, CLAIMS_COLLECTION));
        
        transaction.set(newClaimRef, {
          customerUid: bill.customer?.uid || 'Walk-in',
          type: isSwap ? "EXCHANGE_APPROVAL" : "CLAIM_APPROVAL",
          title: isSwap 
            ? `ขออนุมัติเปลี่ยนสินค้า: ${item.name || 'Unknown'} ➔ ${claimForm.swapProductName || claimForm.swapSku || ''} (${generatedId})`
            : `ขออนุมัติเคลม: ${item.name || 'Unknown'} (${generatedId})`,
          description: `บิลอ้างอิง: ${bill.orderId || '-'}\nอาการเสีย: ${claimForm.reasonCode || '-'}\nรายละเอียด: ${claimForm.details || '-'}\nการกระทำ: ${payload.actionType || '-'}\nจำนวน: ${payload.qty} ชิ้น`,
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

        return generatedId;
      });

      gasHistoryService.log({
        level: 'INFO',
        module: 'Claim',
        action: 'Request',
        target: { id: claimId, type: 'Task' },
        details: {
          legacy_details: `พนักงาน ${userName} ทำรายการแจ้งเคลมสินค้า ${item.sku} รหัส ${claimId} (รออนุมัติ)`
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
        collection(db, CLAIMS_COLLECTION),
        where("referenceId", "==", bill.orderId || '-'),
        where("type", "==", "RETURN_APPROVAL"),
        limit(10)
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

      const returnId = await runTransaction(db, async (transaction) => {
        const date = new Date();
        const yearMonth = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const { getRandomShard } = await import('dh-shared/src/utils/counterUtils');
        const shardId = getRandomShard(5);
        const counterRef = doc(db, getCollectionPath('counters'), `return_sequence_${shardId}`);
        const counterDoc = await transaction.get(counterRef);

        let currentSeq = 1;
        if (counterDoc.exists()) {
           const data = counterDoc.data();
           currentSeq = (data[yearMonth] || 0) + 1;
        }

        const generatedId = `RTN-${yearMonth}-${shardId}-${String(currentSeq).padStart(4, '0')}`;

        transaction.set(counterRef, {
           [yearMonth]: currentSeq,
           updatedAt: serverTimestamp()
        }, { merge: true });

        const payload = {
          returnId: generatedId, 
          orderId: bill.orderId || '',
          orderDocId: bill.id || '', 
          customerUid: bill.customer?.uid || 'Walk-in', 
          customerName: bill.customer?.name || 'ลูกค้าทั่วไป',
          sku: item.sku || '', 
          productName: item.name || '', 
          category: getItemCategory(item),
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

        const newClaimRef = doc(collection(db, CLAIMS_COLLECTION));
        
        transaction.set(newClaimRef, {
          customerUid: bill.customer?.uid || 'Walk-in',
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

        return generatedId;
      });

      gasHistoryService.log({
        level: 'INFO',
        module: 'Return',
        action: 'Request',
        target: { id: returnId, type: 'Task' },
        details: {
          legacy_details: `พนักงาน ${userName} ทำรายการแจ้งคืนสินค้า ${item.sku} รหัส ${returnId} (รออนุมัติ)`
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
      const docRef = doc(db, CLAIMS_COLLECTION, task.id);
      
      const newType = task.type === 'CLAIM_APPROVAL' 
        ? 'CANCEL_CLAIM_APPROVAL' 
        : (task.type === 'EXCHANGE_APPROVAL' ? 'CANCEL_EXCHANGE_APPROVAL' : 'CANCEL_RETURN_APPROVAL');
      const refId = task.payload.returnId || task.payload.claimId || task.payload.exchangeId;

      const newTitle = task.type === 'CLAIM_APPROVAL' 
        ? `ขอยกเลิกใบเคลม: ${task.payload.productName} (${refId})`
        : (task.type === 'EXCHANGE_APPROVAL'
          ? `ขอยกเลิกใบเปลี่ยนสินค้า: ${task.payload.productName} (${refId})`
          : `ขอยกเลิกใบคืนสินค้า: ${task.payload.productName} (${refId})`);

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
