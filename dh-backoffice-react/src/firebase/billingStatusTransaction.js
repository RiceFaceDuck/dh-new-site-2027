import { doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { handleStockDeduction, handleStockReturn } from './billing/statusStockHandler';
import { handleSalesStatsUpdate } from './billing/statusSalesHandler';
import { handleWalletRefundAndClawback, handlePointsEarned } from './billing/statusWalletHandler';
import { handlePromoFreebieReversal } from './billing/statusPromoHandler';
import { getCreditPreloadRefs } from './credit/creditActionService';
import { withToastError } from '../utils/safeAsync';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = 'orders';

export const billingStatusTransaction = {
  updateOrderStatus: async (orderId, newStatus, currentStatus, actorUid) => {
    return withToastError((async () => {
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
                  const pRef = doc(db, getCollectionPath('products'), itemIdentifier);
                  productRefs.push({ ref: pRef, qty: item.qty });
                  productSnaps.push(await transaction.get(pRef));
              }

              const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
              if (customerUid && customerUid !== 'WALK-IN') {
                  userRef = doc(db, getCollectionPath('users'), customerUid);
                  userSnap = await transaction.get(userRef);
              }
          }

          if (isCancelling) {
              const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
              if (customerUid && customerUid !== 'WALK-IN') {
                  settingsRef = doc(db, getCollectionPath('settings'), 'credit_config');
                  settingsSnap = await transaction.get(settingsRef);
              }
          }

          let promoFreebieSnaps = [];
          if (isCancelling || isConfirmingPayment) {
              if (orderData.appliedPromotions && Array.isArray(orderData.appliedPromotions)) {
                  for (const promo of orderData.appliedPromotions) {
                      if (promo.id) promoFreebieSnaps.push({ type: 'promo', ref: doc(db, getCollectionPath('promotions'), promo.id), snap: await transaction.get(doc(db, getCollectionPath('promotions'), promo.id)) });
                  }
              } else if (orderData.appliedPromotion && orderData.appliedPromotion.id) {
                  promoFreebieSnaps.push({ type: 'promo', ref: doc(db, getCollectionPath('promotions'), orderData.appliedPromotion.id), snap: await transaction.get(doc(db, getCollectionPath('promotions'), orderData.appliedPromotion.id)) });
              }

              if (orderData.appliedFreebies && Array.isArray(orderData.appliedFreebies)) {
                  for (const freebie of orderData.appliedFreebies) {
                      if (freebie.id) promoFreebieSnaps.push({ type: 'freebie', ref: doc(db, getCollectionPath('freebies'), freebie.id), snap: await transaction.get(doc(db, getCollectionPath('freebies'), freebie.id)) });
                  }
              }
          }

          const currentOrderId = orderData.orderId || orderId || '';
          
          let creditPreloadSnaps = null;
          const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
          const walletUsed = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
          const amountForPoints = totalSaleAmount - walletUsed;
          let earnedPoints = 0;
          if (amountForPoints > 0) earnedPoints = Math.floor(amountForPoints / 100);

          let clawbackPoints = Number(orderData.earnedPoints || 0); 
          if (orderData.pendingCredits && orderData.pendingCredits > 0 && normalizedCurrentStatus !== 'received') clawbackPoints = 0; 
          
          const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
          if (customerUid && customerUid !== 'WALK-IN') {
              let typeForPreload = null;
              let refForPreload = null;

              if (isConfirmingPayment && earnedPoints > 0) {
                  typeForPreload = 'earn';
                  refForPreload = `TXP_${currentOrderId || orderId}`;
              } else if (isCancelling && clawbackPoints > 0) {
                  typeForPreload = 'clawback';
                  refForPreload = `CB_${currentOrderId || orderId}`;
              }

              if (typeForPreload) {
                  const creditRefs = getCreditPreloadRefs(customerUid, typeForPreload, refForPreload);
                  const [txSnap, settingsSnap2, userSnap2, walletSnap, activePartnerSnap] = await Promise.all([
                      creditRefs.txRef ? transaction.get(creditRefs.txRef) : Promise.resolve(null),
                      transaction.get(creditRefs.settingsRef),
                      transaction.get(creditRefs.userRef),
                      transaction.get(creditRefs.walletRef),
                      transaction.get(creditRefs.activePartnerRef)
                  ]);
                  creditPreloadSnaps = { txSnap, settingsSnap: settingsSnap2, userSnap: userSnap2, walletSnap, activePartnerSnap };
              }
          }

          if (isConfirmingPayment) {
              inventorySettingsRef = doc(db, getCollectionPath('settings'), 'inventory');
              inventorySettingsSnap = await transaction.get(inventorySettingsRef);
          }

          let updates = { 
            orderStatus: normalizedNewStatus, 
            status: normalizedNewStatus, 
            updatedAt: serverTimestamp() 
          };

          const needsNewOrderId = !currentOrderId.startsWith('DH-');

          if (needsNewOrderId && (normalizedNewStatus === 'paid' || normalizedNewStatus === 'approved' || normalizedNewStatus === 'completed')) {
             const yearStr = new Date().getFullYear().toString();
             const { getRandomShard } = await import('dh-shared/src/utils/counterUtils');
             const shardId = getRandomShard(5);
             const counterRef = doc(db, 'counters', `receipt_sequence_${shardId}`);
             const counterSnap = await transaction.get(counterRef);
             let currentSeq = 1;
             if (counterSnap.exists()) currentSeq = (counterSnap.data()[yearStr] || 0) + 1;
             
             transaction.set(counterRef, { [yearStr]: currentSeq, updatedAt: serverTimestamp() }, { merge: true });
             const seqStr = String(currentSeq);
             const paddedSeq = seqStr.length >= 5 ? seqStr : seqStr.padStart(4, '0');
             updates.orderId = `DH-${shardId}-${yearStr.slice(2)}-${paddedSeq}`;
          }

          if (isConfirmingPayment) {
             handleStockDeduction(transaction, db, productRefs, productSnaps, inventorySettingsSnap);

             // 🎯 Deduct Promo/Freebie Quota on Approved/Paid (with Edge Case Lock)
             for (const item of promoFreebieSnaps) {
                 if (item.snap && item.snap.exists()) {
                     const data = item.snap.data();
                     if (data.quotaLimit && data.quotaLimit > 0) {
                         const currentUsed = data.quotaUsed || 0;
                         const qtyToDeduct = item.type === 'freebie' ? ((orderData.appliedFreebies || []).find(f => f.id === item.snap.id)?.qty || 1) : 1;
                         if (currentUsed + qtyToDeduct > data.quotaLimit) {
                             throw new Error(`ไม่อนุมัติบิล: สิทธิ์${item.type === 'promo' ? 'โปรโมชัน' : 'ของแถม'} "${data.title || data.name || item.snap.id}" เต็มแล้ว (มีบิลอื่นแย่งสิทธิ์ไปแล้ว) กรุณายกเลิกบิลนี้`);
                         }
                     }
                     transaction.update(item.ref, { quotaUsed: increment(item.type === 'freebie' ? ((orderData.appliedFreebies || []).find(f => f.id === item.snap.id)?.qty || 1) : 1) });
                 }
             }

             const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
             handleSalesStatsUpdate(transaction, db, totalSaleAmount, orderData, false);

             if (userSnap && userSnap.exists()) {
                 await handlePointsEarned(transaction, db, orderId, totalSaleAmount, orderData, userSnap, userRef, actualActorUid, updates, creditPreloadSnaps);
             }
             
             updates.isStockDeducted = true;
          }

          if (isCancelling) {
             if (orderData.isStockDeducted || normalizedCurrentStatus === 'paid') {
                 handleStockReturn(transaction, db, productRefs, productSnaps);
             }
             if (normalizedCurrentStatus === 'paid') {
                 const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
                 handleSalesStatsUpdate(transaction, db, totalSaleAmount, orderData, true);
             }

             if (userSnap && userSnap.exists()) {
                 await handleWalletRefundAndClawback(
                     transaction, db, orderId, orderData, userSnap, userRef, 
                     settingsSnap, settingsRef, actualActorUid, normalizedCurrentStatus, updates, creditPreloadSnaps
                 );
             }
             
             await handlePromoFreebieReversal(transaction, db, orderData, promoFreebieSnaps);
          }

          transaction.update(docRef, updates);
      }, { maxAttempts: 15 });

      let logMessage = `เปลี่ยนสถานะบิลเป็น: ${normalizedNewStatus}`;
      if (normalizedNewStatus === 'cancelled') {
        logMessage += ' (และปรับปรุงสต็อก/คืนเงิน/ดึงแต้ม กลับสู่ระบบเรียบร้อยแล้ว)';
        
        // 🎯 Auto-Cancel related pending todos
        try {
          const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
          const todosRef = collection(db, getCollectionPath('todos'));
          const q = query(todosRef, where('referenceId', '==', currentOrderId || orderId), where('status', '==', 'pending_manager'));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const batch = writeBatch(db);
            querySnapshot.forEach((todoDoc) => {
              batch.update(todoDoc.ref, { 
                status: 'cancelled', 
                updatedAt: serverTimestamp(),
                internalNote: 'Auto-cancelled due to order cancellation.'
              });
            });
            await batch.commit();
            console.log(`Auto-cancelled ${querySnapshot.size} todos for order ${currentOrderId || orderId}`);
          }
        } catch (todoErr) {
          console.error("🔥 Error auto-cancelling todos:", todoErr);
        }
      }
      if (normalizedNewStatus === 'paid') logMessage += ' (ตัดสต๊อกและเก็บสถิติเรียบร้อยแล้ว)';

      await historyService.addLog('Billing', 'Update', orderId, logMessage, actorUid);
      
      return orderId;
    })(), "เกิดข้อผิดพลาดในการอัปเดตสถานะบิล");
  },

  markOrderAsShipped: async (orderId, trackingNumber, courier, actorUid) => {
    return withToastError((async () => {
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
      }, { maxAttempts: 15 });

      await historyService.addLog('Billing', 'Update', orderId, `อัปเดตสถานะเป็น "จัดส่งแล้ว" (ขนส่ง: ${courier}, เลขพัสดุ: ${trackingNumber})`, actualActorUid);
      return orderId;
    })(), "เกิดข้อผิดพลาดในการบันทึกข้อมูลจัดส่ง");
  },

  markOrderAsCompleted: async (orderId, actorUid) => {
    return withToastError((async () => {
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
      }, { maxAttempts: 15 });

      await historyService.addLog('Billing', 'Update', orderId, `อัปเดตสถานะเป็น "ส่งมอบสินค้าสำเร็จ" (รับหน้าร้าน)`, actualActorUid);
      return orderId;
    })(), "เกิดข้อผิดพลาดในการอัปเดตสถานะส่งมอบ");
  }
};
