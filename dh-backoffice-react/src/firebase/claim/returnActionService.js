import { doc, updateDoc, serverTimestamp, arrayUnion, runTransaction, collection, increment } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const CLAIMS_COLLECTION = getCollectionPath('claims');

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

      await updateDoc(doc(db, CLAIMS_COLLECTION, todoId), updates);

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
      
      await updateDoc(doc(db, CLAIMS_COLLECTION, todoId), {
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

      let finalNewStock = 0;
      let productData = null;
      let calculatedRefundAmount = 0;
      let finalPenalty = 0;

      await runTransaction(db, async (transaction) => {
        // --- 1. READ OPERATIONS (All reads must be executed before writes) ---
        // 0. ดึงและตรวจสอบสถานะ Claim Task
        const taskRef = doc(db, CLAIMS_COLLECTION, todoId);
        const taskSnap = await transaction.get(taskRef);
        if (taskSnap.exists()) {
          const taskData = taskSnap.data();
          if (taskData.status === 'completed') {
            throw new Error("ใบส่งคืนสินค้านี้ถูกอนุมัติเสร็จสิ้นไปแล้ว (Duplicate Request Prevention)");
          }
        }

        // 1. ดึงข้อมูลสต๊อกสินค้า
        const pRef = doc(db, getCollectionPath('products'), payload.sku);
        const pSnap = await transaction.get(pRef);
        if (!pSnap.exists()) {
          throw new Error(`ไม่พบสินค้า SKU: ${payload.sku} ในระบบ`);
        }
        productData = pSnap.data();
        const currentStock = Number(productData.stockQuantity || 0);
        finalNewStock = currentStock + qty;

        // 2. ดึงข้อมูล Order เดิมเพื่อตรวจสอบราคาซื้อจริงและเพดานเงินคืน
        let orderRef = null;
        let orderSnap = null;
        let unitPrice = Number(payload.purchasePrice || 0);
        let maxRefundable = Infinity;

        if (payload.orderDocId) {
          orderRef = doc(db, getCollectionPath('orders'), payload.orderDocId);
          orderSnap = await transaction.get(orderRef);
          if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            // ตรวจสอบราคาจริงของสินค้านั้นหลังหักส่วนลดรายการ/โปรโมชั่น
            const matchedItem = (orderData.items || []).find(it => it.sku === payload.sku);
            if (matchedItem) {
              const itemEffectivePrice = Number(matchedItem.priceAfterDiscount ?? matchedItem.effectivePrice ?? matchedItem.priceAtPurchase ?? matchedItem.price ?? unitPrice);
              if (itemEffectivePrice > 0) {
                unitPrice = itemEffectivePrice;
              }
            }

            // คำนวณเพดานยอดเงินคืนสูงสุด ไม่เกินยอดบิลจริง และหักยอดที่เคยคืนไปแล้ว
            const orderFinalTotal = Number(orderData.finalTotal ?? orderData.totals?.finalTotal ?? 0);
            const pastReturns = (orderData.refundsAndClaims || []).filter(rc => rc.type === 'Return');
            const totalPastRefunded = pastReturns.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
            maxRefundable = Math.max(0, orderFinalTotal - totalPastRefunded);
          }
        }

        // คำนวณยอดเงินคืนสุทธิที่จำกัดเพดาน
        let refundAmount = unitPrice * qty;
        finalPenalty = Number(payload.freebiePenaltyAmount) || 0;
        if (finalPenalty > 0) {
          refundAmount = Math.max(0, refundAmount - finalPenalty);
        }
        if (Number.isFinite(maxRefundable)) {
          refundAmount = Math.min(refundAmount, maxRefundable);
        }
        calculatedRefundAmount = refundAmount;

        // 3. อ่านข้อมูลสำหรับดึงแต้มสะสมคืน (Clawback Points) ล่วงหน้า
        const hasCustomer = payload.customerUid && payload.customerUid !== 'Walk-in' && payload.customerUid !== 'WALK-IN';
        const clawbackPoints = (hasCustomer && refundAmount > 0) ? Math.floor(refundAmount / 100) : 0;
        let creditPreloadSnaps = null;
        if (clawbackPoints > 0) {
          const { getCreditPreloadRefs } = await import('../credit/creditActionService');
          const creditRefs = getCreditPreloadRefs(payload.customerUid, 'clawback', `RTN_${payload.returnId}`);
          const [txSnap, settingsSnap, userSnap, walletSnap, activePartnerSnap] = await Promise.all([
            transaction.get(creditRefs.txRef),
            transaction.get(creditRefs.settingsRef),
            transaction.get(creditRefs.userRef),
            transaction.get(creditRefs.walletRef),
            transaction.get(creditRefs.activePartnerRef)
          ]);
          creditPreloadSnaps = { txSnap, settingsSnap, userSnap, walletSnap, activePartnerSnap };
        }

        const userRef = (hasCustomer && refundAmount > 0) ? doc(db, getCollectionPath('users'), payload.customerUid) : null;
        let returnUserSnap = creditPreloadSnaps?.userSnap || null;
        if (userRef && !returnUserSnap) {
          returnUserSnap = await transaction.get(userRef);
        }

        // --- 2. WRITE OPERATIONS ---
        // 1. เพิ่มสต๊อกกลับเข้าคลัง
        transaction.update(pRef, { stockQuantity: finalNewStock });

        // 2. อัปเดตสถานะใบส่งคืนสินค้า
        transaction.update(taskRef, {
          status: 'completed',
          updatedAt: serverTimestamp()
        });

        // 3. บันทึกประวัติลงใน Order เดิม
        if (orderRef && orderSnap?.exists()) {
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

        // 4. บันทึกกระเป๋าเงิน (Wallet) และดึงแต้มคืน
        if (hasCustomer && refundAmount > 0 && userRef) {
          // 4.1 หักแต้มสะสม (Clawback)
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

          // 4.2 คืนเงินเข้า Wallet Cash
          const currentWallet = Number(returnUserSnap?.data()?.walletBalance || 0);
          const balanceAfter = Math.round((currentWallet + refundAmount) * 100) / 100;
          const txId = `TXW_REF_${payload.returnId}`;

          transaction.update(userRef, {
            walletBalance: balanceAfter,
            lastWalletTxId: txId,
            updatedAt: serverTimestamp()
          });

          const walletTxRef = doc(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions', txId);
          transaction.set(walletTxRef, {
            transactionId: txId,
            type: 'REFUND',
            amount: refundAmount,
            balanceAfter: balanceAfter,
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
          legacy_details: `คืนสินค้าสำเร็จ ${payload.sku} จำนวน ${qty} ชิ้น (คืนเงิน ฿${calculatedRefundAmount})${finalPenalty > 0 ? ` [หักค่าปรับของแถม: ฿${finalPenalty}]` : ''}`,
          financials: { refundAmount: calculatedRefundAmount, freebiePenalty: finalPenalty }
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
      await updateDoc(doc(db, CLAIMS_COLLECTION, task.id), {
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
