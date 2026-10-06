import { doc, updateDoc, serverTimestamp, runTransaction, collection, increment } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const CLAIMS_COLLECTION = getCollectionPath('claims');

export const cancelActionService = {
  approveCancel: async (task, adminUid, adminName) => {
    try {
      const { payload, type, id: todoId } = task;
      const qty = Number(payload.qty || 1);
      const isCancelReturn = type === 'CANCEL_RETURN_APPROVAL';
      const isSwapSku = !isCancelReturn && (payload.isSwapSku || type === 'CANCEL_EXCHANGE_APPROVAL' || task.originalType === 'EXCHANGE_APPROVAL' || !!payload.swapSku);
      
      const isCompleted = task.originalStatus === 'completed';
      const isProcessing = task.originalStatus === 'processing';
      const hasArrived = isProcessing || isCompleted;

      // Swap financial calculations
      const originalPrice = isSwapSku ? Number(payload.originalPricePerUnit || 0) : 0;
      const swapPrice = isSwapSku ? Number(payload.swapPricePerUnit || 0) : 0;
      const refundAmountSwap = originalPrice * qty;
      const chargeAmountSwap = swapPrice * qty;
      const netDifference = chargeAmountSwap - refundAmountSwap;

      // Return financial calculations
      let refundAmountReturn = (payload.purchasePrice || 0) * qty;
      const penalty = Number(payload.freebiePenaltyAmount) || 0;
      if (penalty > 0) {
        refundAmountReturn = Math.max(0, refundAmountReturn - penalty);
      }

      let syncSku = null;
      let syncProductData = null;
      let syncStock = null;
      let finalNewStock = null;

      await runTransaction(db, async (transaction) => {
        // --- 1. READ OPERATIONS (Must be done before writes) ---
        
        // 0. Task
        const taskRef = doc(db, CLAIMS_COLLECTION, todoId);
        const taskSnap = await transaction.get(taskRef);
        if (taskSnap.exists()) {
          const taskData = taskSnap.data();
          if (taskData.status === 'cancelled') {
            throw new Error("ใบคำขอยกเลิกนี้ถูกดำเนินการไปแล้ว (Duplicate Request Prevention)");
          }
        }

        // 1. Defective/Original SKU Product
        let productData = null;
        const pRef = doc(db, getCollectionPath('products'), payload.sku);
        let pSnap = null;
        if ((!isCancelReturn && hasArrived) || isCompleted) {
           pSnap = await transaction.get(pRef);
           if (pSnap.exists()) {
               productData = pSnap.data();
           }
        }

        // 2. Replacement/Swap SKU Product (if swap completed)
        let swapRef = null;
        let swapSnap = null;
        let swapProductData = null;
        if (isSwapSku && isCompleted && payload.swapSku) {
           swapRef = doc(db, getCollectionPath('products'), payload.swapSku);
           swapSnap = await transaction.get(swapRef);
           if (swapSnap.exists()) {
               swapProductData = swapSnap.data();
           }
        }

        // 3. Original Order
        let orderSnap = null;
        let orderRef = null;
        if (isCompleted && payload.orderDocId) {
           orderRef = doc(db, getCollectionPath('orders'), payload.orderDocId);
           orderSnap = await transaction.get(orderRef);
        }

        // 4. Linked New POS Order (if swap completed)
        let newOrderRef = null;
        let newOrderSnap = null;
        const linkedNewOrderId = payload.newOrderId;
        if (isSwapSku && isCompleted && linkedNewOrderId) {
           newOrderRef = doc(db, getCollectionPath('orders'), linkedNewOrderId);
           newOrderSnap = await transaction.get(newOrderRef);
        }

        // 5. User Wallet & Points Reversal
        const hasCustomer = payload.customerUid && payload.customerUid !== 'Walk-in' && payload.customerUid !== 'WALK-IN';
        let userRef = null;
        let userSnap = null;
        let creditPreloadSnaps = null;
        const pointsToRestore = (isCompleted && hasCustomer && isCancelReturn && refundAmountReturn > 0) ? Math.floor(refundAmountReturn / 100) : 0;

        if (isCompleted && hasCustomer) {
           userRef = doc(db, getCollectionPath('users'), payload.customerUid);
           userSnap = await transaction.get(userRef);
           
           if (userSnap.exists()) {
               const currentWallet = Number(userSnap.data().walletBalance || 0);
               // For Return: customer must have enough balance to clawback refund
               if (isCancelReturn && refundAmountReturn > 0 && currentWallet < refundAmountReturn) {
                   throw new Error(`ไม่สามารถยกเลิกใบคืนสินค้านี้ได้ เนื่องจากลูกค้าได้นำเงินคืน (Wallet) จำนวน ${refundAmountReturn} บาท ไปใช้แล้ว (ยอดคงเหลือ ${currentWallet} บาท) กรุณาทวงเงินลูกค้านอกระบบ`);
               }
               // For Swap: if customer received a net refund, they must have enough balance to reverse
               if (isSwapSku && netDifference < 0) {
                   const refundToClawback = Math.abs(netDifference);
                   if (currentWallet < refundToClawback) {
                       throw new Error(`ไม่สามารถยกเลิกใบสลับรุ่นนี้ได้ เนื่องจากลูกค้าได้นำเงินส่วนต่างที่คืนไป (Wallet) จำนวน ${refundToClawback} บาท ไปใช้แล้ว (ยอดคงเหลือ ${currentWallet} บาท) กรุณาทวงเงินลูกค้านอกระบบ`);
                   }
               }
           }

           if (pointsToRestore > 0) {
             const { getCreditPreloadRefs } = await import('../credit/creditActionService');
             const creditRefs = getCreditPreloadRefs(payload.customerUid, 'deposit', `CB_RTN_${payload.returnId || Date.now()}`);
             const [txSnap, settingsSnap, userSnapCredit, walletSnap, activePartnerSnap] = await Promise.all([
               transaction.get(creditRefs.txRef),
               transaction.get(creditRefs.settingsRef),
               transaction.get(creditRefs.userRef),
               transaction.get(creditRefs.walletRef),
               transaction.get(creditRefs.activePartnerRef)
             ]);
             creditPreloadSnaps = { txSnap, settingsSnap, userSnap: userSnapCredit, walletSnap, activePartnerSnap };
           }
        }

        // --- WRITE OPERATIONS ---

        const isGood = payload.itemCondition === 'good';

        // 1. จัดการสต๊อกของเสีย (Defect Stock) กรณีเคลมที่ยังไม่เสร็จสิ้นแต่อยู่ระหว่างตรวจสอบ
        if (!isCancelReturn && !isCompleted && hasArrived && pSnap?.exists()) {
           const currentDefect = Number(productData.defectQuantity || 0);
           transaction.update(pRef, { defectQuantity: Math.max(0, currentDefect - qty) });
        }

        // 2. จัดการสต๊อกของดีและของเสีย หากรายการ completed ไปแล้ว
        if (isCompleted) {
           if (isCancelReturn && pSnap?.exists()) {
               if (isGood) {
                 // ยกเลิกการคืนสินค้าสภาพดี: ดึงสต๊อกขายกลับ (-qty)
                 const currentStock = Number(productData.stockQuantity || 0);
                 if (currentStock < qty) {
                     throw new Error(`สินค้า ${productData.sku} สต็อกคงเหลือไม่เพียงพอสำหรับยกเลิกการคืนสินค้า (คงเหลือ ${currentStock} ชิ้น, ต้องการหักคืน ${qty} ชิ้น)`);
                 }
                 finalNewStock = currentStock - qty;
                 transaction.update(pRef, { stockQuantity: finalNewStock });
                 syncSku = payload.sku;
                 syncProductData = productData;
                 syncStock = finalNewStock;
               } else {
                 // ยกเลิกการคืนสินค้าชำรุด: ดึงออกจากคลังชำรุด (-qty)
                 const currentDefect = Number(productData.defectQuantity || 0);
                 transaction.update(pRef, { defectQuantity: Math.max(0, currentDefect - qty) });
               }
           } else if (isSwapSku && swapSnap?.exists()) {
               // ยกเลิกการสลับรุ่น: คืนสต๊อกของตัวใหม่ที่ตัดไป (swapSku) กลับเข้าคลัง (+qty)
               const currentSwapStock = Number(swapProductData.stockQuantity || 0);
               finalNewStock = currentSwapStock + qty;
               transaction.update(swapRef, { 
                   stockQuantity: finalNewStock,
                   'stats.sold': increment(-qty)
               });
               syncSku = payload.swapSku;
               syncProductData = swapProductData;
               syncStock = finalNewStock;

               // คืนสภาพสินค้าเดิม (payload.sku)
               if (pSnap?.exists()) {
                 if (isGood) {
                   const curOrigStock = Number(productData.stockQuantity || 0);
                   transaction.update(pRef, { stockQuantity: Math.max(0, curOrigStock - qty) });
                 } else {
                   const curOrigDefect = Number(productData.defectQuantity || 0);
                   transaction.update(pRef, { defectQuantity: Math.max(0, curOrigDefect - qty) });
                 }
               }
           } else if (!isSwapSku && pSnap?.exists()) {
               // ยกเลิกการเคลมปกติ: 
               // ตัวใหม่ที่เบิกไป คืนสต็อก (+qty)
               // ตัวเดิม: ถ้าของดี ดึงสต็อกขายคืน (-qty) net = 0, ถ้าของเสีย ดึงออกจาก defect (-qty)
               const currentStock = Number(productData.stockQuantity || 0);
               const currentDefect = Number(productData.defectQuantity || 0);
               
               if (isGood) {
                 // ของดี: net สต็อกขายเท่าเดิม
                 finalNewStock = currentStock;
                 transaction.update(pRef, { 
                     stockQuantity: finalNewStock,
                     defectQuantity: currentDefect,
                     'stats.sold': increment(-qty)
                 });
               } else {
                 // ของเสีย: คืนสต็อกขายตัวใหม่ (+qty), ดึงของเดิมออกจาก defect (-qty)
                 finalNewStock = currentStock + qty;
                 transaction.update(pRef, { 
                     stockQuantity: finalNewStock,
                     defectQuantity: Math.max(0, currentDefect - qty),
                     'stats.sold': increment(-qty)
                 });
               }
               syncSku = payload.sku;
               syncProductData = productData;
               syncStock = finalNewStock;
           }
        }

        // 3. ปรับปรุงข้อมูลใน Orders
        if (isCompleted) {
           // เอาออกจากประวัติบิลเดิม
           if (orderSnap?.exists()) {
               const orderData = orderSnap.data();
               if (orderData.refundsAndClaims) {
                   const filteredRC = orderData.refundsAndClaims.filter(rc => 
                       rc.id !== payload.returnId && 
                       rc.id !== payload.claimId && 
                       rc.id !== payload.exchangeId
                   );
                   transaction.update(orderRef, { refundsAndClaims: filteredRC });
               }
           }

           // ยกเลิกบิล Order ใหม่ของ Swap SKU (ถ้ามี)
           if (newOrderSnap?.exists()) {
               transaction.update(newOrderRef, {
                   status: 'cancelled',
                   orderStatus: 'cancelled',
                   cancelReason: `ยกเลิกการเปลี่ยนสินค้า (EXC) (${payload.claimId || payload.exchangeId || '-'})`,
                   updatedAt: serverTimestamp()
               });
           }
        }

        // 4. จัดการกระเป๋าเงิน (User Wallet)
        if (isCompleted && userRef && userSnap?.exists()) {
           const currentWallet = Number(userSnap.data()?.walletBalance || 0);

           if (isCancelReturn && refundAmountReturn > 0) {
               const balanceAfter = Math.max(0, Math.round((currentWallet - refundAmountReturn) * 100) / 100);
               const txId = `TXW_CB_RTN_${payload.returnId || Date.now()}`;

               transaction.update(userRef, {
                 walletBalance: balanceAfter,
                 lastWalletTxId: txId,
                 updatedAt: serverTimestamp()
               });

               const walletTxRef = doc(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions', txId);
               transaction.set(walletTxRef, {
                 transactionId: txId,
                 type: 'SPEND',
                 amount: refundAmountReturn,
                 balanceAfter: balanceAfter,
                 status: 'SUCCESS',
                 note: `ดึงยอดเงินคืนเนื่องจากผู้จัดการยกเลิกการคืนสินค้า${penalty > 0 ? ' (หักลบค่าปรับของแถม)' : ''}`,
                 operatorUid: adminUid || 'System',
                 timestamp: serverTimestamp()
               });

               // คืนแต้มสะสมที่เคยถูกริบไปตอนคืนสินค้า (Clawback Reversal)
               if (pointsToRestore > 0 && creditPreloadSnaps) {
                 const { adjustUserCreditWithTransaction } = await import('../credit/creditActionService');
                 await adjustUserCreditWithTransaction(
                   transaction,
                   payload.customerUid,
                   pointsToRestore,
                   'deposit',
                   `คืนแต้มสะสมเนื่องจากยกเลิกการคืนสินค้า (รหัสส่งคืน ${payload.returnId || '-'}, สินค้า ${payload.sku || '-'})`,
                   adminUid || 'System',
                   `CB_RTN_${payload.returnId || Date.now()}`,
                   creditPreloadSnaps
                 );
               }
           } else if (isSwapSku) {
               if (netDifference > 0) {
                   // ลูกค้าเคยจ่ายส่วนต่างเพิ่ม -> คืนเงินส่วนต่างเข้ากระเป๋า
                   const balanceAfter = Math.round((currentWallet + netDifference) * 100) / 100;
                   const txId = `TXW_REF_SWAP_${payload.claimId || payload.exchangeId || Date.now()}`;

                   transaction.update(userRef, {
                     walletBalance: balanceAfter,
                     lastWalletTxId: txId,
                     updatedAt: serverTimestamp()
                   });

                   const walletTxRef = doc(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions', txId);
                   transaction.set(walletTxRef, {
                     transactionId: txId,
                     type: 'REFUND',
                     amount: netDifference,
                     balanceAfter: balanceAfter,
                     status: 'SUCCESS',
                     note: `คืนเงินส่วนต่างจากการยกเลิกการเปลี่ยนสินค้า (EXC) (${payload.claimId || payload.exchangeId || '-'})`,
                     operatorUid: adminUid || 'System',
                     timestamp: serverTimestamp()
                   });
               } else if (netDifference < 0) {
                   // ลูกค้าเคยได้รับเงินทอนคืน -> ดึงเงินส่วนต่างกลับคืน
                   const refundToClawback = Math.abs(netDifference);
                   const balanceAfter = Math.max(0, Math.round((currentWallet - refundToClawback) * 100) / 100);
                   const txId = `TXW_CB_SWAP_${payload.claimId || payload.exchangeId || Date.now()}`;

                   transaction.update(userRef, {
                     walletBalance: balanceAfter,
                     lastWalletTxId: txId,
                     updatedAt: serverTimestamp()
                   });

                   const walletTxRef = doc(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions', txId);
                   transaction.set(walletTxRef, {
                     transactionId: txId,
                     type: 'SPEND',
                     amount: refundToClawback,
                     balanceAfter: balanceAfter,
                     status: 'SUCCESS',
                     note: `ดึงยอดเงินส่วนต่างคืนเนื่องจากยกเลิกการเปลี่ยนสินค้า (EXC) (${payload.claimId || payload.exchangeId || '-'})`,
                     operatorUid: adminUid || 'System',
                     timestamp: serverTimestamp()
                   });
               }
           }
        }

        // 5. อัปเดต Claim Task status เป็น cancelled
        transaction.update(taskRef, {
           status: 'cancelled', 
           handledBy: adminUid,
           updatedAt: serverTimestamp()
        });
      });

      // 6. ซิงก์สต๊อกไป GAS ด้วยค่าใหม่ที่คำนวณอย่างถูกต้อง
      if (syncProductData && syncSku && syncStock !== null) {
          gasStockService.queueUpdate({
              ...syncProductData,
              sku: syncSku,
              stockQuantity: syncStock
          });
          await gasStockService.forceSync();
      }

      const refId = payload.returnId || payload.claimId;
      gasHistoryService.log({
        level: 'WARN',
        module: 'Claim/Return',
        action: 'CancelApproved',
        target: { id: refId, type: 'Task' },
        details: {
          legacy_details: `ผู้จัดการอนุมัติการยกเลิกรายการ และปรับปรุงข้อมูลเรียบร้อย`,
          payload: payload
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
      });
      return true;
    } catch (error) {
      console.error("🔥 Error in approveCancel transaction:", error);
      throw error;
    }
  },

  rejectCancel: async (task, reason, adminUid, adminName) => {
    try {
      await updateDoc(doc(db, CLAIMS_COLLECTION, task.id), {
        title: task.originalTitle || task.title, 
        type: task.originalType, 
        status: task.originalStatus, 
        rejectCancelReason: reason,
        updatedAt: serverTimestamp()
      });
      
      const refId = task.payload.returnId || task.payload.claimId || task.payload.exchangeId;
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
        actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
      });
      return true;
    } catch (error) {
      console.error("🔥 Error in rejectCancel:", error);
      throw error;
    }
  }
};
