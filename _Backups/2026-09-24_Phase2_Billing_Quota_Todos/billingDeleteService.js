import { doc, deleteDoc, getDoc, runTransaction, serverTimestamp, collection, query, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { db } from './config';
import { gasHistoryService } from './gasHistoryService';
import { withToastError } from '../utils/safeAsync';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = getCollectionPath('orders');

export const billingDeleteService = {
  deleteOrderPermanently: async (orderId, actorUid) => {
    return withToastError((async () => {
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

      // 🌟 ดึง Todos ที่เกี่ยวข้องกับบิลนี้ "ก่อน" เข้า Transaction หรือก่อนทำการลบ
      let pendingTodoRefs = [];
      try {
          const todosRef = collection(db, getCollectionPath('todos'));
          const q = query(todosRef, where('referenceId', '==', orderId));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              querySnapshot.forEach(docSnap => pendingTodoRefs.push(docSnap.ref));
          }
      } catch (e) {
          console.error("🔥 Error querying related todos:", e);
      }

      if (walletUsed > 0 && customerUid && customerUid !== 'WALK-IN') {
         await runTransaction(db, async (transaction) => {
             const userRef = doc(db, getCollectionPath('users'), customerUid);
             const userSnap = await transaction.get(userRef);
             if (userSnap.exists()) {
                 transaction.update(userRef, {
                     walletBalance: increment(walletUsed),
                     updatedAt: serverTimestamp()
                 });

                 const walletTxRef = doc(collection(db, getCollectionPath('users'), customerUid, 'wallet_transactions'));
                 transaction.set(walletTxRef, {
                     transactionId: `TXW_REF_DEL_${orderId}`,
                     type: 'REFUND',
                     amount: walletUsed,
                     status: 'SUCCESS',
                     note: 'คืนเงินอัตโนมัติ (ลบบิลร่างทิ้งถาวร)',
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

      return true;
    })(), "เกิดข้อผิดพลาดในการลบบิล");
  }
};
