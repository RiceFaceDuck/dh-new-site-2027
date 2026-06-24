import { doc, deleteDoc, getDoc, runTransaction, serverTimestamp, collection, increment } from 'firebase/firestore';
import { db } from './config';
import { gasHistoryService } from './gasHistoryService';

const COLLECTION_NAME = 'orders';

export const billingDeleteService = {
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
                 const { adjustUserCreditWithTransaction } = await import('./credit/creditActionService');
                 await adjustUserCreditWithTransaction(
                     transaction,
                     customerUid,
                     walletUsed,
                     'deposit',
                     'คืนเงินอัตโนมัติ (ลบบิลร่างทิ้งถาวร)',
                     actorUid || 'system',
                     `REF_DEL_${orderId}`
                 );
             }
             transaction.delete(docRef);
         });
      } else {
         await deleteDoc(docRef);
      }

      gasHistoryService.log({
          module: 'Billing',
          action: 'Delete',
          target: { id: orderId },
          details: { legacy_details: `ลบบิลถาวรออกจากระบบ (รหัสอ้างอิง: ${orderData.orderId || orderId})` },
          actorOverride: { uid: actorUid || 'system', name: 'Unknown', email: 'N/A' }
      });

      return true;
    } catch (error) {
      console.error("🔥 Error deleting order:", error);
      throw error;
    }
  }
};
