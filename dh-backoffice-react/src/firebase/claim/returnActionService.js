import { doc, updateDoc, serverTimestamp, arrayUnion, runTransaction, collection, increment } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const TODOS_COLLECTION = getCollectionPath('todos');

export const returnActionService = {
  approveRequest: async (task, adminUid, adminName) => {
    try {
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
    } catch (error) {
      console.error("🔥 Error in approveRequest:", error);
      throw error;
    }
  },

  markArrived: async (task, adminUid, adminName) => {
    try {
      const { payload, id: todoId } = task;
      
      await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
        status: 'processing',
        updatedAt: serverTimestamp()
      });

      // ... (rest unchanged)
      return true;
    } catch (error) {
      console.error("🔥 Error in markArrived:", error);
      throw error;
    }
  },

  completeRequest: async (task, adminUid, adminName) => {
    try {
      const { payload, id: todoId } = task;
      const qty = Number(payload.qty || 1);

      // 1. คืนเงินให้ลูกค้า (ถ้าไม่ใช่ลูกค้าทั่วไป)
      let refundAmount = (payload.purchasePrice || 0) * qty;
      const penalty = Number(payload.freebiePenaltyAmount) || 0;
      if (penalty > 0) {
        refundAmount = Math.max(0, refundAmount - penalty);
      }

      let finalNewStock = 0;
      let productData = null;

      await runTransaction(db, async (transaction) => {
        // 0. ดึงและตรวจสอบสถานะ To-do ก่อนเพื่อป้องกันการรันรายการซ้ำซ้อน (Idempotency check)
        const taskRef = doc(db, TODOS_COLLECTION, todoId);
        const taskSnap = await transaction.get(taskRef);
        if (taskSnap.exists()) {
          const taskData = taskSnap.data();
          if (taskData.status === 'completed') {
            throw new Error("ใบส่งคืนสินค้านี้ถูกอนุมัติเสร็จสิ้นไปแล้ว (Duplicate Request Prevention)");
          }
        }

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

        // 5. บันทึกกระเป๋าเงิน (Wallet) และดึงแต้มคืน ภายใต้ Transaction เดียวกัน เพื่อความปลอดภัย
        if (payload.customerUid && payload.customerUid !== 'Walk-in' && refundAmount > 0) {
          const userRef = doc(db, getCollectionPath('users'), payload.customerUid);
          
          // 5.1 🌟 อ่านข้อมูลสำหรับดึงแต้มสะสมคืน (Clawback Points) ตามสัดส่วนเงินที่คืนให้ลูกค้า
          const clawbackPoints = Math.floor(refundAmount / 100);
          let creditPreloadSnaps = null;
          
          if (clawbackPoints > 0) {
            const { getCreditPreloadRefs } = await import('../credit/creditActionService');
            const creditRefs = getCreditPreloadRefs(payload.customerUid, 'clawback', `RTN_${payload.returnId}`);
            
            // อ่านข้อมูลก่อนทำการเขียน (Firestore Rules: READS must happen before WRITES)
            const [txSnap, settingsSnap, userSnap, walletSnap, activePartnerSnap] = await Promise.all([
              transaction.get(creditRefs.txRef),
              transaction.get(creditRefs.settingsRef),
              transaction.get(creditRefs.userRef),
              transaction.get(creditRefs.walletRef),
              transaction.get(creditRefs.activePartnerRef)
            ]);
            creditPreloadSnaps = { txSnap, settingsSnap, userSnap, walletSnap, activePartnerSnap };
          }

          // 5.2 หักแต้มสะสม (Clawback)
          if (clawbackPoints > 0 && creditPreloadSnaps) {
            const { adjustUserCreditWithTransaction } = await import('../credit/creditActionService');
            await adjustUserCreditWithTransaction(
              transaction,
              payload.customerUid,
              clawbackPoints,
              'clawback',
              `ดึงแต้มคืนจากการรับคืนสินค้า (บิล ${payload.orderId || '-'}, สินค้า ${payload.sku})`,
              adminUid || 'System',
              `RTN_${payload.returnId}`,
              creditPreloadSnaps
            );
          }

          // 5.3 คืนเงินเข้า Wallet Cash (ใช้อัปเดตแบบอิสระ)
          transaction.update(userRef, {
            walletBalance: increment(refundAmount),
            updatedAt: serverTimestamp()
          });

          const walletTxRef = doc(collection(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions'));
          transaction.set(walletTxRef, {
            transactionId: `TXW_REF_${payload.returnId}`,
            type: 'REFUND',
            amount: refundAmount,
            status: 'SUCCESS',
            note: `คืนเงินเข้ากระเป๋า (รับคืนสินค้า ${payload.sku})`,
            operatorUid: adminUid || 'System',
            timestamp: serverTimestamp()
          });
        }
      });

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
    } catch (error) {
      console.error("🔥 Error in completeRequest transaction:", error);
      throw error;
    }
  },

  rejectRequest: async (task, reason, adminUid, adminName) => {
    try {
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
    } catch (error) {
      console.error("🔥 Error in rejectRequest:", error);
      throw error;
    }
  }
};
