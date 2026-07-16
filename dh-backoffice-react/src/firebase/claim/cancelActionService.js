import { doc, updateDoc, serverTimestamp, runTransaction, collection, increment } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const TODOS_COLLECTION = 'todos';

export const cancelActionService = {
  approveCancel: async (task, adminUid, adminName) => {
    try {
      const { payload, type, id: todoId } = task;
      const qty = Number(payload.qty || 1);
      const isCancelReturn = type === 'CANCEL_RETURN_APPROVAL';
      
      const isCompleted = task.originalStatus === 'completed';
      const isProcessing = task.originalStatus === 'processing';
      const hasArrived = isProcessing || isCompleted;

      let finalNewStock = null;
      let productData = null;

      await runTransaction(db, async (transaction) => {
        // --- READ OPERATIONS (Must be done before writes) ---
        
        // 0. Task
        const taskRef = doc(db, TODOS_COLLECTION, todoId);
        const taskSnap = await transaction.get(taskRef);
        if (taskSnap.exists()) {
          const taskData = taskSnap.data();
          if (taskData.status === 'cancelled') {
            throw new Error("ใบคำขอยกเลิกนี้ถูกดำเนินการไปแล้ว (Duplicate Request Prevention)");
          }
        }

        // 1 & 2. Product
        const pRef = doc(db, getCollectionPath('products'), payload.sku);
        let pSnap = null;
        if ((!isCancelReturn && hasArrived) || isCompleted) {
           pSnap = await transaction.get(pRef);
           if (pSnap.exists()) {
               productData = pSnap.data();
           }
        }

        // 3. Order
        let orderSnap = null;
        let orderRef = null;
        if (isCompleted && payload.orderDocId) {
           orderRef = doc(db, getCollectionPath('orders'), payload.orderDocId);
           orderSnap = await transaction.get(orderRef);
        }

        // 4. User Wallet (NEW)
        let refundAmount = (payload.purchasePrice || 0) * qty;
        const penalty = Number(payload.freebiePenaltyAmount) || 0;
        if (penalty > 0) {
          refundAmount = Math.max(0, refundAmount - penalty);
        }
        
        const needsWalletDeduction = isCompleted && isCancelReturn && payload.customerUid && payload.customerUid !== 'Walk-in' && refundAmount > 0;
        let userRef = null;
        let userSnap = null;
        
        if (needsWalletDeduction) {
           userRef = doc(db, getCollectionPath('users'), payload.customerUid);
           userSnap = await transaction.get(userRef);
           
           if (userSnap.exists()) {
               const currentWallet = Number(userSnap.data().walletBalance || 0);
               if (currentWallet < refundAmount) {
                   throw new Error(`ไม่สามารถยกเลิกใบคืนสินค้านี้ได้ เนื่องจากลูกค้าได้นำเงินคืน (Wallet) จำนวน ${refundAmount} บาท ไปใช้แล้ว (ยอดคงเหลือ ${currentWallet} บาท) กรุณาทวงเงินลูกค้านอกระบบ`);
               }
           }
        }

        // --- WRITE OPERATIONS ---

        // 1. จัดการสต๊อกของเสีย (Defect Stock)
        if (!isCancelReturn && hasArrived && pSnap?.exists()) {
           const currentDefect = productData.defectQuantity || 0;
           transaction.update(pRef, { defectQuantity: Math.max(0, currentDefect - qty) });
        }

        // 2. หากเป็นการยกเลิกรายการที่ 'completed' ไปแล้ว ต้องดึงสต๊อกและเงินคืน
        if (isCompleted && pSnap?.exists()) {
           const currentStock = Number(productData.stockQuantity || 0);

           if (isCancelReturn) {
               // ยกเลิกการคืนสินค้า: ดึงสต๊อกกลับ (-qty)
               if (currentStock < qty) {
                   throw new Error(`สินค้า ${productData.sku} สต็อกคงเหลือไม่เพียงพอสำหรับยกเลิกการคืนสินค้า (คงเหลือ ${currentStock} ชิ้น, ต้องการหักคืน ${qty} ชิ้น)`);
               }
               finalNewStock = currentStock - qty;
           } else {
               // ยกเลิกการเคลม: เอาสต๊อกที่เบิกให้ลูกค้าไปแล้ว (+qty) คืนกลับมา
               finalNewStock = currentStock + qty;
           }

           transaction.update(pRef, { stockQuantity: finalNewStock });

           // เอาออกจากประวัติ order
           if (orderSnap?.exists()) {
               const orderData = orderSnap.data();
               if (orderData.refundsAndClaims) {
                   const filteredRC = orderData.refundsAndClaims.filter(rc => rc.id !== payload.returnId && rc.id !== payload.claimId);
                   transaction.update(orderRef, { refundsAndClaims: filteredRC });
               }
           }
        }

        // 3. อัปเดต Todo status
        transaction.update(taskRef, {
           status: 'cancelled', 
           handledBy: adminUid,
           updatedAt: serverTimestamp()
        });

        // 4. ดึงเงินคืนลูกค้ากลับ (กระเป๋าเงิน Wallet Cash) ภายใต้ Transaction เดียวกัน
        if (needsWalletDeduction && userSnap?.exists()) {
            transaction.update(userRef, {
              walletBalance: increment(-refundAmount),
              updatedAt: serverTimestamp()
            });

            const walletTxRef = doc(collection(db, getCollectionPath('users'), payload.customerUid, 'wallet_transactions'));
            transaction.set(walletTxRef, {
              transactionId: `TXW_CB_${payload.returnId || Date.now()}`,
              type: 'SPEND',
              amount: refundAmount,
              status: 'SUCCESS',
              note: `ดึงยอดเงินคืนเนื่องจากผู้จัดการยกเลิกการคืนสินค้า${penalty > 0 ? ' (หักลบค่าปรับของแถม)' : ''}`,
              operatorUid: adminUid || 'System',
              timestamp: serverTimestamp()
            });
        }
      });

      // 5. ซิงก์สต๊อกไป GAS ด้วยค่าใหม่ที่คำนวณอย่างถูกต้อง
      if (productData && finalNewStock !== null) {
          gasStockService.queueUpdate({
              ...productData,
              sku: payload.sku,
              stockQuantity: finalNewStock
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
      await updateDoc(doc(db, TODOS_COLLECTION, task.id), {
        title: task.originalTitle || task.title, 
        type: task.originalType, 
        status: task.originalStatus, 
        rejectCancelReason: reason,
        updatedAt: serverTimestamp()
      });
      
      const refId = task.payload.returnId || task.payload.claimId;
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
