import { 
  collection, doc, addDoc, updateDoc, deleteDoc, 
  serverTimestamp, runTransaction, getDoc, increment 
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'orders';

export const billingUpdateService = {
  updateOrderStatus: async (orderId, newStatus, currentStatus, actorUid) => {
    try {
      const actualActorUid = actorUid || (typeof currentStatus === 'string' && currentStatus.length > 15 ? currentStatus : 'system');
      const normalizedNewStatus = (newStatus || '').toLowerCase();

      await runTransaction(db, async (transaction) => {
          const docRef = doc(db, COLLECTION_NAME, orderId);
          const docSnap = await transaction.get(docRef);
          
          if (!docSnap.exists()) {
            throw new Error("Document does not exist!");
          }
          
          const orderData = docSnap.data();
          const normalizedCurrentStatus = (orderData.orderStatus || orderData.status || '').toLowerCase();

          const isCancelling = normalizedNewStatus === 'cancelled' && normalizedCurrentStatus !== 'cancelled';
          const isConfirmingPayment = normalizedNewStatus === 'paid' && normalizedCurrentStatus !== 'paid';

          if (isCancelling && (normalizedCurrentStatus === 'approved' || normalizedCurrentStatus === 'completed')) {
              throw new Error("ไม่อนุญาตให้ยกเลิกบิลที่อนุมัติหรือเสร็จสิ้นไปแล้ว");
          }

          const productRefs = [];
          const productSnaps = [];
          let userRef = null;
          let userSnap = null;
          let settingsRef = null;
          let settingsSnap = null;
          let inventorySettingsRef = null;
          let inventorySettingsSnap = null;
          
          if (isCancelling || isConfirmingPayment) {
              for (const item of (orderData.items || [])) {
                  const itemIdentifier = item.id || item.sku;
                  if (item.isFreebie || !itemIdentifier) continue;
                  
                  const pRef = doc(db, 'products', itemIdentifier);
                  productRefs.push({ ref: pRef, qty: item.qty });
                  productSnaps.push(await transaction.get(pRef));
              }

              const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
              if (customerUid && customerUid !== 'WALK-IN') {
                  userRef = doc(db, 'users', customerUid);
                  userSnap = await transaction.get(userRef);
              }
          }

          if (isCancelling) {
              const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
              if (customerUid && customerUid !== 'WALK-IN') {
                  settingsRef = doc(db, 'settings', 'credit_config');
                  settingsSnap = await transaction.get(settingsRef);
              }
          }

          if (isConfirmingPayment) {
              inventorySettingsRef = doc(db, 'settings', 'inventory');
              inventorySettingsSnap = await transaction.get(inventorySettingsRef);
          }

          let updates = { 
            orderStatus: normalizedNewStatus, 
            status: normalizedNewStatus, 
            updatedAt: serverTimestamp() 
          };

          if ((orderData.orderId || '').startsWith('TEMP-') && normalizedNewStatus === 'paid') {
             const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
             const runNum = Math.floor(1000 + Math.random() * 9000);
             updates.orderId = `DH-${dateStr}-${runNum}`;
          }

          if (isConfirmingPayment) {
             const defaultBuffer = inventorySettingsSnap && inventorySettingsSnap.exists() 
                ? inventorySettingsSnap.data().defaultBufferStock || 0 
                : 0;
             
             productSnaps.forEach((pSnap, index) => {
                 if (pSnap.exists()) {
                     const currentStock = pSnap.data().stockQuantity || 0;
                     const requiredQty = productRefs[index].qty;
                     const itemBuffer = pSnap.data().bufferStock !== undefined 
                        ? pSnap.data().bufferStock 
                        : defaultBuffer;

                     if ((currentStock - requiredQty) < itemBuffer) {
                         throw new Error(`สินค้า ${pSnap.data().sku} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
                     }
                     
                     transaction.update(productRefs[index].ref, { 
                       stockQuantity: currentStock - requiredQty, 
                       'stats.sold': increment(requiredQty) 
                     });
                 }
             });

             const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
             
             if (totalSaleAmount > 0) {
                 const now = new Date();
                 const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                 const yyyyMMdd = `${yyyyMM}-${String(now.getDate()).padStart(2, '0')}`;
                 
                 transaction.set(doc(db, 'sales_stats', yyyyMM), { 
                   totalSales: increment(totalSaleAmount), 
                   orderCount: increment(1), 
                   updatedAt: serverTimestamp() 
                 }, { merge: true });
                 
                 transaction.set(doc(db, 'sales_stats', yyyyMMdd), { 
                   date: yyyyMMdd, 
                   totalSales: increment(totalSaleAmount), 
                   orderCount: increment(1), 
                   updatedAt: serverTimestamp() 
                 }, { merge: true });
             }

             if (userSnap && userSnap.exists()) {
                 const walletUsed = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
                 const amountForPoints = totalSaleAmount - walletUsed;
                 const POINTS_RATE = 100;
                 
                 if (amountForPoints > 0) {
                     const earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
                     if (earnedPoints > 0) {
                         const currentPoints = userSnap.data().stats?.rewardPoints || 0;
                         const newPointsBalance = currentPoints + earnedPoints;

                         transaction.update(userRef, { 
                           'stats.rewardPoints': newPointsBalance, 
                           updatedAt: serverTimestamp() 
                         });
                         
                         transaction.set(doc(collection(db, 'point_transactions')), {
                             transactionId: `TXP-${Date.now()}`, 
                             uid: userSnap.id, 
                             type: 'earn', 
                             points: earnedPoints, 
                             balanceAfter: newPointsBalance, 
                             referenceId: orderId, 
                             note: 'ได้รับจากการซื้อสินค้า (ยืนยันยอดโอน)', 
                             recordedBy: actualActorUid, 
                             timestamp: serverTimestamp()
                         });
                         
                         updates.earnedPoints = earnedPoints; 
                     }
                 }
             }
          }

          if (isCancelling) {
             if (normalizedCurrentStatus === 'paid') {
                 productSnaps.forEach((pSnap, index) => {
                     if (pSnap.exists()) {
                         const currentStock = pSnap.data().stockQuantity || 0;
                         const qtyToReturn = productRefs[index].qty;
                         transaction.update(productRefs[index].ref, { 
                           stockQuantity: currentStock + qtyToReturn, 
                           'stats.sold': increment(-qtyToReturn) 
                         });
                     }
                 });
             }

             if (normalizedCurrentStatus === 'paid') {
                 const createdAt = orderData.createdAt?.toDate() || new Date(); 
                 const yyyyMM = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
                 const yyyyMMdd = `${yyyyMM}-${String(createdAt.getDate()).padStart(2, '0')}`;
                 const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);

                 if (totalSaleAmount > 0) {
                     transaction.set(doc(db, 'sales_stats', yyyyMM), { 
                       totalSales: increment(-totalSaleAmount), 
                       orderCount: increment(-1), 
                       updatedAt: serverTimestamp() 
                     }, { merge: true });
                     
                     transaction.set(doc(db, 'sales_stats', yyyyMMdd), { 
                       date: yyyyMMdd, 
                       totalSales: increment(-totalSaleAmount), 
                       orderCount: increment(-1), 
                       updatedAt: serverTimestamp() 
                     }, { merge: true });
                 }
             }

             if (userSnap && userSnap.exists()) {
                 let refundAmount = 0;
                 if (normalizedCurrentStatus === 'paid') {
                     refundAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
                 } else {
                     refundAmount = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
                 }
                 
                 let clawbackPoints = Number(orderData.earnedPoints || 0); 
                 let cancelledPending = 0;
                 if (orderData.pendingCredits && orderData.pendingCredits > 0 && orderData.status !== 'received') {
                     cancelledPending = orderData.pendingCredits;
                     clawbackPoints = 0; 
                     updates.pendingCredits = 0; 
                 }

                 if (refundAmount > 0 || clawbackPoints > 0 || cancelledPending > 0) {
                     const currentWallet = userSnap.data().creditPoints || 0;
                     const currentPoints = userSnap.data().stats?.rewardPoints || 0;
                     
                     const newWalletBalance = currentWallet + refundAmount;
                     const newPointsBalance = Math.max(0, currentPoints - clawbackPoints);

                     transaction.update(userRef, { 
                       'creditPoints': newWalletBalance, 
                       'stats.rewardPoints': newPointsBalance, 
                       updatedAt: serverTimestamp() 
                     });

                     if (refundAmount > 0 && settingsSnap && settingsSnap.exists()) {
                         const ledger = settingsSnap.data().ledger || { systemPoolMax: 1000000, totalAllocated: 0, status: 'SECURE' };
                         const newTotalAllocated = ledger.totalAllocated + refundAmount;
                         let newLedgerStatus = 'SECURE';
                         if (ledger.systemPoolMax > 0 && (newTotalAllocated / ledger.systemPoolMax) >= 0.9) newLedgerStatus = 'WARNING';
                         if (ledger.systemPoolMax > 0 && (newTotalAllocated / ledger.systemPoolMax) >= 1) newLedgerStatus = 'BREACHED';

                         transaction.set(settingsRef, { 
                           ledger: { ...ledger, totalAllocated: newTotalAllocated, status: newLedgerStatus, lastAuditTime: serverTimestamp() }, 
                           updatedAt: serverTimestamp() 
                         }, { merge: true });

                         transaction.set(doc(db, 'credit_transactions', `REF_${orderId}`), {
                             transactionId: `TXR-${Date.now()}`, 
                             uid: userSnap.id, 
                             type: 'refund', 
                             amount: refundAmount, 
                             balanceAfter: newWalletBalance, 
                             referenceId: orderId, 
                             note: 'คืนเงินเข้ากระเป๋าอัตโนมัติ (ยกเลิกบิล)', 
                             recordedBy: actualActorUid, 
                             timestamp: serverTimestamp()
                         });
                     }

                     if (clawbackPoints > 0) {
                         transaction.set(doc(db, 'point_transactions', `CB_${orderId}`), {
                             transactionId: `CB-${Date.now()}`, 
                             uid: userSnap.id, 
                             type: 'deduct', 
                             points: clawbackPoints, 
                             balanceAfter: newPointsBalance, 
                             referenceId: orderId, 
                             note: 'ดึงแต้มสะสมคืนอัตโนมัติ (ยกเลิกบิล)', 
                             recordedBy: actualActorUid, 
                             timestamp: serverTimestamp()
                         });
                     }
                 }
             }
          }

          transaction.update(docRef, updates);

          let logMessage = `เปลี่ยนสถานะบิลเป็น: ${normalizedNewStatus}`;
          if (isCancelling) logMessage += ' (และปรับปรุงสต็อก/คืนเงิน/ดึงแต้ม กลับสู่ระบบเรียบร้อยแล้ว)';
          if (isConfirmingPayment) logMessage += ' (ตัดสต๊อกและเก็บสถิติเรียบร้อยแล้ว)';

          transaction.set(doc(collection(db, 'history_logs')), {
              module: 'Billing', 
              action: 'Update', 
              targetId: orderId, 
              details: logMessage, 
              byUid: actualActorUid, 
              timestamp: serverTimestamp()
          });

      });
      
      return orderId;
    } catch (error) { 
      console.error("🔥 Error updating order status:", error);
      throw error; 
    }
  },

  updatePrintCount: async (docId, currentCount) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await updateDoc(docRef, {
        printCount: increment(1), 
        lastPrintedAt: serverTimestamp()
      });
      return true;
    } catch (error) { 
      console.error("🔥 Error updating print count:", error);
      return false; 
    }
  },

  deleteOrderPermanently: async (orderId, actorUid) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, orderId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("ไม่พบบิลนี้ในระบบ");

      const orderData = docSnap.data();
      const stat = (orderData.orderStatus || orderData.status || '').toLowerCase();

      if (stat === 'paid' || stat === 'approved' || stat === 'completed') {
         throw new Error("ไม่อนุญาตให้ลบทิ้งบิลที่ชำระเงินหรือดำเนินการเสร็จสิ้นแล้ว");
      }

      const walletUsed = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
      const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;

      if (walletUsed > 0 && customerUid && customerUid !== 'WALK-IN') {
         await runTransaction(db, async (transaction) => {
             const userRef = doc(db, 'users', customerUid);
             const userSnap = await transaction.get(userRef);
             if (userSnap.exists()) {
                 const currentWallet = userSnap.data().creditPoints || 0;
                 const newWalletBalance = currentWallet + walletUsed;
                 
                 transaction.update(userRef, {
                   'creditPoints': newWalletBalance
                 });

                 transaction.set(doc(collection(db, 'credit_transactions')), {
                     transactionId: `TXR-${Date.now()}`,
                     uid: customerUid,
                     type: 'refund',
                     amount: walletUsed,
                     balanceAfter: newWalletBalance,
                     referenceId: orderId,
                     note: 'คืนเงินอัตโนมัติ (ลบบิลร่างทิ้งถาวร)',
                     recordedBy: actorUid || 'system',
                     timestamp: serverTimestamp()
                 });
             }
             transaction.delete(docRef);
         });
      } else {
         await deleteDoc(docRef);
      }

      await addDoc(collection(db, 'history_logs'), {
          module: 'Billing',
          action: 'Delete',
          targetId: orderId,
          details: `ลบบิลถาวรออกจากระบบ (รหัสอ้างอิง: ${orderData.orderId || orderId})`,
          byUid: actorUid || 'system',
          timestamp: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error("🔥 Error deleting order:", error);
      throw error;
    }
  }
};
