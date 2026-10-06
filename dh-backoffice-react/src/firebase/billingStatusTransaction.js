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
import { syncRecentOrdersCatalog } from './orderSyncService';

const COLLECTION_NAME = getCollectionPath('orders');

export const billingStatusTransaction = {
  updateOrderStatus: async (orderId, newStatus, currentStatus, actorUid) => {
    return withToastError((async () => {
      const actualActorUid = actorUid || (typeof currentStatus === 'string' && currentStatus.length > 15 ? currentStatus : 'system');
      const normalizedNewStatus = (newStatus || '').toLowerCase();

      // 🌟 ดึง Todos ที่รออนุมัติ (pending_manager) ที่เกี่ยวข้องกับบิลนี้ "ก่อน" เข้า Transaction
      let pendingTodoRefs = [];
      if (normalizedNewStatus === 'cancelled') {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const todosRef = collection(db, getCollectionPath('todos'));
        const q = query(todosRef, where('referenceId', '==', orderId), where('status', '==', 'pending_manager'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          querySnapshot.forEach(docSnap => pendingTodoRefs.push(docSnap.ref));
        }
      }

      const result = await runTransaction(db, async (transaction) => {
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
          let inventorySettingsSnap = null;
          
          if (isCancelling || isConfirmingPayment) {
              const aggregatedProductMap = new Map();
              for (const item of (orderData.items || [])) {
                  const itemIdentifier = item.id || item.sku;
                  if (item.isFreebie || !itemIdentifier) continue;
                  const qty = Math.max(1, Number(item.qty || 1));
                  if (aggregatedProductMap.has(itemIdentifier)) {
                      aggregatedProductMap.get(itemIdentifier).qty += qty;
                  } else {
                      aggregatedProductMap.set(itemIdentifier, {
                          ref: doc(db, getCollectionPath('products'), itemIdentifier),
                          itemIdentifier,
                          qty
                      });
                  }
              }

              for (const prod of aggregatedProductMap.values()) {
                  productRefs.push(prod);
                  productSnaps.push(await transaction.get(prod.ref));
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
          
          let earnedPoints = Number(orderData.pendingCredits || 0);
          if (earnedPoints <= 0 && amountForPoints > 0) {
              earnedPoints = Math.floor(amountForPoints / 100); // เช็คขั้นต่ำเพื่อเปิดทางไปสู่การ Preload settings
          }

          let clawbackPoints = 0; 
          if (orderData.pointsAwarded) {
              clawbackPoints = Number(orderData.pendingCredits || orderData.earnedPoints || 0);
          } else if (orderData.pendingCredits && orderData.pendingCredits > 0 && normalizedCurrentStatus !== 'received') {
              clawbackPoints = 0; 
          }
          
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
              inventorySettingsSnap = await transaction.get(doc(db, getCollectionPath('settings'), 'inventory'));
          }

          let updates = { 
            orderStatus: normalizedNewStatus, 
            status: normalizedNewStatus, 
            updatedAt: serverTimestamp() 
          };

          const needsNewOrderId = !/^DH-\d{2}-\d+/.test(currentOrderId);

          if (needsNewOrderId && (normalizedNewStatus === 'paid' || normalizedNewStatus === 'approved' || normalizedNewStatus === 'completed')) {
             const terminalId = 'O1'; // Default fallback 
             const yearStr = new Date().getFullYear().toString();
             const counterRef = doc(db, getCollectionPath('counters'), `receipt_sequence_global`);
             const counterSnap = await transaction.get(counterRef);
             let currentSeq = 1;
             if (counterSnap.exists()) currentSeq = (counterSnap.data()[yearStr] || 0) + 1;
             
             transaction.set(counterRef, { [yearStr]: currentSeq, updatedAt: serverTimestamp() }, { merge: true });
             const seqStr = String(currentSeq);
             const paddedSeq = seqStr.length >= 5 ? seqStr : seqStr.padStart(4, '0');
             updates.orderId = `DH-${yearStr.slice(2)}-${paddedSeq}`;
          }

          if (isConfirmingPayment) {
             const canBypassBuffer = Boolean(orderData?.canBypassBuffer || orderData?.canBypassBufferStock || orderData?.actorName === 'POS');
             handleStockDeduction(transaction, db, productRefs, productSnaps, inventorySettingsSnap, canBypassBuffer);

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

              // 🎯 ATOMIC REFUND TODO: Create Manual Refund To-do inside transaction
              const manualRefundAmt = (totalSaleAmount - walletUsed);
              if (manualRefundAmt > 0 && normalizedCurrentStatus === 'paid') {
                const refundTodoRef = doc(collection(db, getCollectionPath('todos')));
                const cUid = orderData.customer?.uid || orderData.customerInfo?.uid || 'Unknown';
                const cName = orderData.customer?.name || orderData.customer?.displayName || 'ลูกค้า';
                transaction.set(refundTodoRef, {
                  id: refundTodoRef.id,
                  type: 'REFUND_MANUAL',
                  status: 'pending_manager',
                  title: `รอโอนเงินคืนลูกค้า (ยกเลิกบิล ${orderId})`,
                  description: `บิล ${orderId} ถูกยกเลิก แต่มีการจ่ายผ่านเงินสด/โอนเงิน โปรดโอนเงินคืนลูกค้าจำนวน ฿${manualRefundAmt.toLocaleString()} และแนบสลิป`,
                  referenceId: orderId,
                  customerUid: cUid,
                  customerName: cName,
                  payload: {
                    orderId: orderId,
                    refundAmount: manualRefundAmt,
                    walletRefunded: walletUsed
                  },
                  priority: 'high',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }
           }

           // 🎯 Auto-Cancel related pending todos INSIDE transaction
           if (isCancelling && pendingTodoRefs.length > 0) {
               for (const tRef of pendingTodoRefs) {
                   transaction.update(tRef, {
                      status: 'cancelled',
                      updatedAt: serverTimestamp(),
                      handledBy: actualActorUid,
                      internalNote: 'Auto-cancelled due to order cancellation.'
                   });
               }
           }

          transaction.update(docRef, updates);
          
          // Return necessary data for outside-transaction side-effects
          return {
              manualRefundAmount: isCancelling ? (totalSaleAmount - walletUsed) : 0,
              customerUid: orderData.customer?.uid || orderData.customerInfo?.uid || 'Unknown',
              customerName: orderData.customer?.name || orderData.customer?.displayName || 'ลูกค้า',
              walletUsed,
              normalizedCurrentStatus
          };
      }, { maxAttempts: 15 });

      let logMessage = `เปลี่ยนสถานะบิลเป็น: ${normalizedNewStatus}`;
      if (normalizedNewStatus === 'cancelled') {
        logMessage += ' (และปรับปรุงสต็อก/คืนเงิน/ดึงแต้ม/ยกเลิกคำร้อง กลับสู่ระบบเรียบร้อยแล้ว)';
      }
      if (normalizedNewStatus === 'paid') logMessage += ' (ตัดสต๊อกและเก็บสถิติเรียบร้อยแล้ว)';

      await historyService.addLog('Billing', 'Update', orderId, logMessage, actorUid);

      // ⚡ Background Cache Sync: Refresh catalogs/recent_orders without blocking UI
      syncRecentOrdersCatalog().catch(e => console.warn("[OrderSync] Background catalog sync error:", e));

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
      
      // ⚡ Background Cache Sync
      syncRecentOrdersCatalog().catch(e => console.warn("[OrderSync] Background catalog sync error:", e));

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
      
      // ⚡ Background Cache Sync
      syncRecentOrdersCatalog().catch(e => console.warn("[OrderSync] Background catalog sync error:", e));

      return orderId;
    })(), "เกิดข้อผิดพลาดในการอัปเดตสถานะส่งมอบ");
  }
};
