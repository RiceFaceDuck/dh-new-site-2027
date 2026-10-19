import { doc, deleteDoc, getDoc, runTransaction, serverTimestamp, collection, query, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { db } from './config';
import { gasHistoryService } from './gasHistoryService';
import { withToastError } from '../utils/safeAsync';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { syncRecentOrdersCatalog } from './orderSyncService';

const COLLECTION_NAME = getCollectionPath('orders');

export const billingDeleteService = {
  deleteOrderPermanently: async (orderId, actorUid) => {
    return withToastError((async () => {
      const docRef = doc(db, COLLECTION_NAME, orderId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("ไม่พบบิลนี้ในระบบ");

      const orderData = docSnap.data();
      const stat = (orderData.orderStatus || orderData.status || '').toLowerCase();

      if (stat === 'paid' || stat === 'approved' || stat === 'completed' || stat === 'cancelled' || stat === 'void') {
         throw new Error("ไม่อนุญาตให้ลบทิ้งบิลที่มีประวัติทางบัญชีแล้ว (อนุญาตให้ลบได้เฉพาะฉบับร่าง Draft เท่านั้น)");
      }

      const walletUsed = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
      const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;

      // 🌟 ดึง Todos ที่เกี่ยวข้องกับบิลนี้ "ก่อน" เข้า Transaction หรือก่อนทำการลบ (ตรวจทั้ง referenceId และ payload.orderId)
      let pendingTodoRefs = [];
      try {
          const todosRef = collection(db, getCollectionPath('todos'));
          const queries = [
              query(todosRef, where('orderId', '==', orderId)),
              query(todosRef, where('referenceId', '==', orderId)),
              query(todosRef, where('payload.orderId', '==', orderId))
          ];
          if (orderData.orderId && orderData.orderId !== orderId) {
              queries.push(query(todosRef, where('orderId', '==', orderData.orderId)));
              queries.push(query(todosRef, where('referenceId', '==', orderData.orderId)));
              queries.push(query(todosRef, where('payload.orderId', '==', orderData.orderId)));
          }
          const snapshots = await Promise.all(queries.map(q => getDocs(q)));
          const seenTodoIds = new Set();
          snapshots.forEach(snap => {
              snap.forEach(docSnap => {
                  if (!seenTodoIds.has(docSnap.id)) {
                      seenTodoIds.add(docSnap.id);
                      pendingTodoRefs.push(docSnap.ref);
                  }
              });
          });
      } catch (e) {
          console.error("🔥 Error querying related todos:", e);
      }

      // 🛡️ Wallet Refund Guard: Only refund wallet if it was actually deducted on the order
      const shouldRefundWallet = Boolean(orderData.isWalletDeducted) && walletUsed > 0 && customerUid && customerUid !== 'WALK-IN';
      if (shouldRefundWallet) {
         await runTransaction(db, async (transaction) => {
             const userRef = doc(db, getCollectionPath('users'), customerUid);
             const userSnap = await transaction.get(userRef);
             if (userSnap.exists()) {
                 const currentWallet = Number(userSnap.data()?.walletBalance || 0);
                 const balanceAfter = Math.round((currentWallet + walletUsed) * 100) / 100;
                 const txId = `TXW_REF_DEL_${orderId}`;

                 transaction.update(userRef, {
                     walletBalance: balanceAfter,
                     lastWalletTxId: txId,
                     updatedAt: serverTimestamp()
                 });

                 const walletTxRef = doc(db, getCollectionPath('users'), customerUid, 'wallet_transactions', txId);
                 transaction.set(walletTxRef, {
                     transactionId: txId,
                     type: 'REFUND',
                     amount: walletUsed,
                     balanceAfter: balanceAfter,
                     status: 'SUCCESS',
                     note: `คืนเงินอัตโนมัติ (ลบบิลร่างทิ้งถาวร ${orderId})`,
                     operatorUid: actorUid || 'system',
                     timestamp: serverTimestamp()
                 });
             }
             
             // 🎯 Auto-Cancel related pending todos INSIDE transaction
             if (pendingTodoRefs.length > 0) {
                 for (const tRef of pendingTodoRefs) {
                     transaction.update(tRef, {
                        status: 'cancelled',
                        handledBy: actorUid || 'system',
                        updatedAt: serverTimestamp(),
                        internalNote: 'Auto-cancelled due to order deletion.'
                     });
                 }
             }

             transaction.delete(docRef);
         });
      } else {
         // กรณีที่ลบธรรมดา ไม่ได้ใช้เงินในกระเป๋า (Draft Bill)
         if (pendingTodoRefs.length > 0) {
             const batch = writeBatch(db);
             for (const tRef of pendingTodoRefs) {
                 batch.update(tRef, {
                    status: 'cancelled',
                    handledBy: actorUid || 'system',
                    updatedAt: serverTimestamp(),
                    internalNote: 'Auto-cancelled due to order deletion.'
                 });
             }
             batch.delete(docRef);
             await batch.commit();
         } else {
             await deleteDoc(docRef);
         }
      }

      gasHistoryService.log({
          module: 'Billing',
          action: 'Delete',
          target: { id: orderId },
          details: { legacy_details: `ลบบิลถาวรออกจากระบบ (รหัสอ้างอิง: ${orderData.orderId || orderId})` },
          actorOverride: { uid: actorUid || 'system', name: 'Unknown', email: 'N/A' }
      });

      // ⚡ Refresh catalogs/recent_orders so deleted bill is removed from dashboard immediately
      syncRecentOrdersCatalog().catch(e => console.warn("[OrderSync] Delete sync error:", e));

      return true;
    })(), "เกิดข้อผิดพลาดในการลบบิล");
  }
};
