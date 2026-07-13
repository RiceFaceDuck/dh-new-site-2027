import { doc, updateDoc, serverTimestamp, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

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

    // ... (rest unchanged)
    return true;
  },

  markArrived: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    
    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'processing',
      updatedAt: serverTimestamp()
    });

    // ... (rest unchanged)
    return true;
  },

  completeRequest: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    const qty = Number(payload.qty || 1);

    // 1. คืนเงินให้ลูกค้า (ถ้าไม่ใช่ลูกค้าทั่วไป) - ทำนอก transaction หลัก
    let refundAmount = (payload.purchasePrice || 0) * qty;
    const penalty = Number(payload.freebiePenaltyAmount) || 0;
    if (penalty > 0) {
      refundAmount = Math.max(0, refundAmount - penalty);
    }

    let finalNewStock = 0;
    let productData = null;

    await runTransaction(db, async (transaction) => {
      // 2. เพิ่มสต๊อกกลับเข้าคลัง
      const pRef = doc(db, getCollectionPath('products'), payload.sku);
      const pSnap = await transaction.get(pRef);
      if (!pSnap.exists()) {
        throw new Error(`ไม่พบสินค้า SKU: ${payload.sku} ในระบบ`);
      }

      productData = pSnap.data();
      const currentStock = Number(productData.stockQuantity || 0);
      finalNewStock = currentStock + qty;

      transaction.update(pRef, { stockQuantity: finalNewStock });

      // 3. อัปเดตสถานะ To-do เป็น completed
      transaction.update(doc(db, TODOS_COLLECTION, todoId), {
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      // 4. บันทึกประวัติบิล
      if (payload.orderDocId) {
        const orderRef = doc(db, getCollectionPath('orders'), payload.orderDocId);
        transaction.update(orderRef, {
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
    });

    // 5. บันทึกกระเป๋าเงิน (Wallet) นอก Transaction หลักของสต๊อก
    if (payload.customerUid && payload.customerUid !== 'Walk-in' && refundAmount > 0) {
      const { doc, updateDoc, collection, setDoc, serverTimestamp, increment } = await import('firebase/firestore');
      
      const userRef = doc(db, getCollectionPath('users'), payload.customerUid);
      await updateDoc(userRef, {
        walletBalance: increment(refundAmount),
        updatedAt: serverTimestamp()
      });

      const walletTxRef = doc(collection(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions'));
      await setDoc(walletTxRef, {
        transactionId: `TXW_REF_${payload.returnId}`,
        type: 'REFUND',
        amount: refundAmount,
        status: 'SUCCESS',
        note: `คืนเงินเข้ากระเป๋า (รับคืนสินค้า ${payload.sku})`,
        operatorUid: adminUid || 'System',
        timestamp: serverTimestamp()
      });
    }

    // 6. ซิงก์สต๊อกไป GAS ด้วยสต๊อกคงเหลือจริงที่คำนวณสำเร็จ
    if (productData) {
      gasStockService.queueUpdate({
          ...productData,
          sku: payload.sku,
          stockQuantity: finalNewStock
      });
      await gasStockService.forceSync();
    }

    gasHistoryService.log({
      level: 'INFO',
      module: 'Return',
      action: 'Completed',
      target: { id: payload.returnId, type: 'Task' },
      details: {
        legacy_details: `คืนสินค้าสำเร็จ ${payload.sku} จำนวน ${qty} ชิ้น (คืนเงิน ฿${refundAmount})${penalty > 0 ? ` [หักค่าปรับของแถม: ฿${penalty}]` : ''}`,
        financials: { refundAmount, freebiePenalty: penalty }
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });

    // ✨ บันทึกประวัติย่อยระดับ SKU สำหรับการรับของดีกลับเข้าสต๊อก
    setTimeout(() => {
      gasHistoryService.log({
        level: 'INFO',
        module: 'Return',
        action: 'SKU_RETURN',
        target: { id: payload.sku, type: 'Product' },
        details: {
          type: 'รับคืน',
          qtyChange: qty,
          reference: payload.returnId,
          legacy_details: `รับคืนสินค้ากลับเข้าสต๊อก (${payload.returnId})`
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager' }
      });
    }, 0);

    return true;
  },

  rejectRequest: async (task, reason, adminUid, adminName) => {
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
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  }
};
