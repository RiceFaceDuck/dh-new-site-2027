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

        const isGood = payload.itemCondition === 'good';
        const isItemArrived = taskSnap.data()?.status === 'processing';
        const currentDefect = Number(productData.defectQuantity || 0);

        finalNewStock = isGood ? currentStock + qty : currentStock;
        let finalNewDefect = currentDefect;
        if (isGood) {
          if (isItemArrived) {
            finalNewDefect = Math.max(0, currentDefect - qty);
          }
        } else {
          if (!isItemArrived) {
            finalNewDefect = currentDefect + qty;
          }
        }

        const actionTag = isGood ? 'RETURN_RESTOCK_GOOD' : 'RETURN_DEFECT';

        // --- 2. WRITE OPERATIONS ---
        // 1. ปรับสต็อกสินค้าตามสภาพจริง
        transaction.update(pRef, { 
          stockQuantity: finalNewStock,
          defectQuantity: finalNewDefect
        });

        // 2. อัปเดตสถานะใบส่งคืนสินค้า
        transaction.update(taskRef, {
          status: 'completed',
          handledBy: adminUid || 'SYSTEM',
          handledByName: adminName || 'Manager',
          completedAt: serverTimestamp(),
          completedAtIso: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          'payload.itemCondition': payload.itemCondition || 'defective',
          'tags.action': actionTag
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

        // 5. บันทึก Transaction บัญชีคลัง (Ledger Transactions)
        const transRef = doc(collection(db, getCollectionPath('transactions')));
        transaction.set(transRef, {
          id: transRef.id,
          refId: payload.returnId || todoId,
          sku: payload.sku,
          quantityDelta: isGood ? qty : 0,
          defectDelta: isGood ? (isItemArrived ? -qty : 0) : (isItemArrived ? 0 : qty),
          financialDelta: {
            netTotal: -refundAmount,
            walletDelta: refundAmount,
            creditPointsDelta: 0
          },
          tags: {
            category: 'RETURN',
            action: actionTag,
            channel: 'BACKOFFICE_POS',
            sku: payload.sku,
            refId: payload.returnId || todoId
          },
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          createdBy: adminUid || 'SYSTEM',
          createdByName: adminName || 'Manager',
          reason: isGood ? 'Return good condition item restocked to inventory' : 'Return defective item quarantined',
          note: isGood 
            ? `รับคืนสินค้าสภาพดี ${payload.sku} จำนวน ${qty} ชิ้น เข้าสต็อกขาย (คืนเงิน ฿${refundAmount})` 
            : `รับคืนสินค้าชำรุด ${payload.sku} จำนวน ${qty} ชิ้น เข้าคลังชำรุด ไม่เพิ่มสต็อกขาย (คืนเงิน ฿${refundAmount})`
        });

        // 6. บันทึก Stock Receipts สำหรับของดี
        if (isGood) {
          const receiptRef = doc(collection(db, getCollectionPath('stock_receipts')));
          transaction.set(receiptRef, {
            sku: payload.sku,
            quantity: qty,
            source: 'return_good_item',
            reference: payload.returnId || todoId,
            createdBy: adminUid || 'Admin',
            createdByName: adminName || 'Admin',
            tags: {
              category: 'RETURN',
              action: 'RETURN_RESTOCK_GOOD',
              channel: 'BACKOFFICE_POS',
              sku: payload.sku,
              refId: payload.returnId || todoId
            },
            createdAt: serverTimestamp()
          });
        }
      });

      // 7. ซิงก์สต๊อกไป GAS เฉพาะเมื่อเป็นของดี (เพราะสต็อกขายเปลี่ยน)
      if (productData && payload.itemCondition === 'good') {
        gasStockService.queueUpdate({
            ...productData,
            sku: payload.sku,
            stockQuantity: finalNewStock
        });
        await gasStockService.forceSync();
      }

      const isGoodCondition = payload.itemCondition === 'good';
      const conditionLabel = isGoodCondition ? 'ของดี (ขายต่อได้)' : 'ของเสีย (ชำรุด)';
      const stockImpactLabel = isGoodCondition ? `[เพิ่มสต๊อกขายปกติ +${qty}]` : `[คงอยู่ในคลังสินค้าชำรุด]`;

      gasHistoryService.log({
        level: 'INFO',
        module: 'Return',
        action: 'Completed',
        target: { id: payload.returnId, type: 'Task' },
        details: {
          legacy_details: `คืนสินค้าสำเร็จ (${conditionLabel}) ${payload.sku} จำนวน ${qty} ชิ้น (คืนเงิน ฿${calculatedRefundAmount}) ${stockImpactLabel}${finalPenalty > 0 ? ` [หักค่าปรับของแถม: ฿${finalPenalty}]` : ''}`,
          financials: { refundAmount: calculatedRefundAmount, freebiePenalty: finalPenalty },
          itemCondition: payload.itemCondition || 'defective'
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
      });

      // ✨ บันทึกประวัติย่อยระดับ SKU
      setTimeout(() => {
        gasHistoryService.log({
          level: 'INFO',
          module: 'Return',
          action: 'SKU_RETURN',
          target: { id: payload.sku, type: 'Product' },
          details: {
            type: isGoodCondition ? 'รับคืนของดี' : 'รับคืนของเสีย',
            qtyChange: isGoodCondition ? qty : 0,
            reference: payload.returnId,
            legacy_details: isGoodCondition 
              ? `รับคืนสินค้าดีกลับเข้าสต็อกขายปกติ +${qty} ชิ้น (${payload.returnId})` 
              : `รับคืนสินค้าเสียเข้าคลังชำรุด ไม่เพิ่มสต็อกขาย (${payload.returnId})`
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
