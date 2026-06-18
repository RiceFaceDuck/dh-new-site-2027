import { doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from './config';
import { gasHistoryService } from './gasHistoryService';
import { handleStockDeduction, handleStockReturn } from './billing/statusStockHandler';
import { handleSalesStatsUpdate } from './billing/statusSalesHandler';
import { handleWalletRefundAndClawback, handlePointsEarned } from './billing/statusWalletHandler';

const COLLECTION_NAME = 'orders';

export const billingStatusTransaction = {
  updateOrderStatus: async (orderId, newStatus, currentStatus, actorUid) => {
    try {
      const actualActorUid = actorUid || (typeof currentStatus === 'string' && currentStatus.length > 15 ? currentStatus : 'system');
      const normalizedNewStatus = (newStatus || '').toLowerCase();

      await runTransaction(db, async (transaction) => {
          const docRef = doc(db, COLLECTION_NAME, orderId);
          const docSnap = await transaction.get(docRef);
          
          if (!docSnap.exists()) throw new Error("Document does not exist!");
          
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

          if ((orderData.orderId || '').startsWith('TEMP-') && (normalizedNewStatus === 'paid' || normalizedNewStatus === 'approved')) {
             const yearStr = new Date().getFullYear().toString();
             const counterRef = doc(db, 'counters', 'receipt_sequence');
             const counterSnap = await transaction.get(counterRef);
             let currentSeq = 1;
             if (counterSnap.exists()) currentSeq = (counterSnap.data()[yearStr] || 0) + 1;
             
             transaction.set(counterRef, { [yearStr]: currentSeq, updatedAt: serverTimestamp() }, { merge: true });
             updates.orderId = `DH-${yearStr}${String(currentSeq).padStart(4, '0')}`;
          }

          if (isConfirmingPayment) {
             handleStockDeduction(transaction, db, productRefs, productSnaps, inventorySettingsSnap);

             const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
             handleSalesStatsUpdate(transaction, db, totalSaleAmount, orderData, false);

             if (userSnap && userSnap.exists()) {
                 handlePointsEarned(transaction, db, orderId, totalSaleAmount, orderData, userSnap, userRef, actualActorUid, updates);
             }
          }

          if (isCancelling) {
             if (normalizedCurrentStatus === 'paid') {
                 handleStockReturn(transaction, db, productRefs, productSnaps);
                 const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
                 handleSalesStatsUpdate(transaction, db, totalSaleAmount, orderData, true);
             }

             if (userSnap && userSnap.exists()) {
                 handleWalletRefundAndClawback(
                     transaction, db, orderId, orderData, userSnap, userRef, 
                     settingsSnap, settingsRef, actualActorUid, normalizedCurrentStatus, updates
                 );
             }
          }

          transaction.update(docRef, updates);
      });

      let logMessage = `เปลี่ยนสถานะบิลเป็น: ${normalizedNewStatus}`;
      if (normalizedNewStatus === 'cancelled') logMessage += ' (และปรับปรุงสต็อก/คืนเงิน/ดึงแต้ม กลับสู่ระบบเรียบร้อยแล้ว)';
      if (normalizedNewStatus === 'paid') logMessage += ' (ตัดสต๊อกและเก็บสถิติเรียบร้อยแล้ว)';

      gasHistoryService.log({
          module: 'Billing', 
          action: 'Update', 
          target: { id: orderId },
          details: { 
            legacy_details: logMessage,
            status_change: { from: currentStatus, to: normalizedNewStatus }
          }
      });
      
      return orderId;
    } catch (error) { 
      console.error("🔥 Error updating order status:", error);
      throw error; 
    }
  }
};
