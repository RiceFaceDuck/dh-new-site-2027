import { doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { handleStockDeduction, handleStockReturn } from './billing/statusStockHandler';
import { handleSalesStatsUpdate } from './billing/statusSalesHandler';
import { handleWalletRefundAndClawback, handlePointsEarned } from './billing/statusWalletHandler';
import { handlePromoFreebieReversal } from './billing/statusPromoHandler';

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
          const isConfirmingPayment = (normalizedNewStatus === 'paid' || normalizedNewStatus === 'approved' || normalizedNewStatus === 'completed') && !orderData.isStockDeducted;

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

          const currentOrderId = orderData.orderId || orderId || '';
          const needsNewOrderId = !currentOrderId.startsWith('DH-');

          if (needsNewOrderId && (normalizedNewStatus === 'paid' || normalizedNewStatus === 'approved' || normalizedNewStatus === 'completed')) {
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

             // 🎯 Deduct Promo/Freebie Quota on Approved/Paid
             if (orderData.appliedPromotions && Array.isArray(orderData.appliedPromotions)) {
                 orderData.appliedPromotions.forEach(promo => {
                     if (promo.id) transaction.update(doc(db, 'promotions', promo.id), { quotaUsed: increment(1) });
                 });
             } else if (orderData.appliedPromotion && orderData.appliedPromotion.id) {
                 transaction.update(doc(db, 'promotions', orderData.appliedPromotion.id), { quotaUsed: increment(1) });
             }

             if (orderData.appliedFreebies && Array.isArray(orderData.appliedFreebies)) {
                 orderData.appliedFreebies.forEach(freebie => {
                     if (freebie.id) transaction.update(doc(db, 'freebies', freebie.id), { quotaUsed: increment(freebie.qty || 1) });
                 });
             }

             const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
             handleSalesStatsUpdate(transaction, db, totalSaleAmount, orderData, false);

             if (userSnap && userSnap.exists()) {
                 await handlePointsEarned(transaction, db, orderId, totalSaleAmount, orderData, userSnap, userRef, actualActorUid, updates);
             }
             
             updates.isStockDeducted = true;
          }

          if (isCancelling) {
             if (normalizedCurrentStatus === 'paid') {
                 handleStockReturn(transaction, db, productRefs, productSnaps);
                 const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
                 handleSalesStatsUpdate(transaction, db, totalSaleAmount, orderData, true);
             }

             if (userSnap && userSnap.exists()) {
                 await handleWalletRefundAndClawback(
                     transaction, db, orderId, orderData, userSnap, userRef, 
                     settingsSnap, settingsRef, actualActorUid, normalizedCurrentStatus, updates
                 );
             }
             
             await handlePromoFreebieReversal(transaction, db, orderData);
          }

          transaction.update(docRef, updates);
      });

      let logMessage = `เปลี่ยนสถานะบิลเป็น: ${normalizedNewStatus}`;
      if (normalizedNewStatus === 'cancelled') logMessage += ' (และปรับปรุงสต็อก/คืนเงิน/ดึงแต้ม กลับสู่ระบบเรียบร้อยแล้ว)';
      if (normalizedNewStatus === 'paid') logMessage += ' (ตัดสต๊อกและเก็บสถิติเรียบร้อยแล้ว)';

      await historyService.addLog('Billing', 'Update', orderId, logMessage, actorUid);
      
      return orderId;
    } catch (error) { 
      console.error("🔥 Error updating order status:", error);
      throw error; 
    }
  },

  markOrderAsShipped: async (orderId, trackingNumber, courier, actorUid) => {
    try {
      const actualActorUid = actorUid || 'system';
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, COLLECTION_NAME, orderId);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("Document does not exist!");
        
        transaction.update(docRef, {
          status: 'shipped',
          orderStatus: 'shipped',
          trackingNumber: trackingNumber || null,
          shippingMethod: courier || docSnap.data().shippingMethod || null,
          shippedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await historyService.addLog('Billing', 'Update', orderId, `อัปเดตสถานะเป็น "จัดส่งแล้ว" (ขนส่ง: ${courier}, เลขพัสดุ: ${trackingNumber})`, actualActorUid);
      return orderId;
    } catch (error) {
      console.error("🔥 Error marking order as shipped:", error);
      throw error;
    }
  },

  markOrderAsCompleted: async (orderId, actorUid) => {
    try {
      const actualActorUid = actorUid || 'system';
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, COLLECTION_NAME, orderId);
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) throw new Error("Document does not exist!");
        
        transaction.update(docRef, {
          status: 'completed',
          orderStatus: 'completed',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await historyService.addLog('Billing', 'Update', orderId, `อัปเดตสถานะเป็น "ส่งมอบสินค้าสำเร็จ" (รับหน้าร้าน)`, actualActorUid);
      return orderId;
    } catch (error) {
      console.error("🔥 Error marking order as completed:", error);
      throw error;
    }
  }
};
