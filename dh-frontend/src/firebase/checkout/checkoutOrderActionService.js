import { db } from '../config';
import { doc, collection, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const confirmOrderReceipt = async (orderId, userId) => {
  if (!orderId || !userId) throw new Error("ข้อมูลไม่ครบถ้วน");

  const orderRef = doc(db, getCollectionPath('orders'), orderId);
  const userRef = doc(db, getCollectionPath('users'), userId);
  try {
    return await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error("ไม่พบคำสั่งซื้อ");
      
      const orderData = orderDoc.data();
      if (orderData.userId !== userId) throw new Error("ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้");
      if (orderData.status === "received") throw new Error("คำสั่งซื้อนี้ถูกยืนยันการรับสินค้าไปแล้ว");

      transaction.update(orderRef, {
        status: "received",
        orderStatus: "received",
        receivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pendingCredits: 0 
      });
    });
  } catch (error) {
    console.error("🔥 Error in confirmOrderReceipt:", error);
    throw error;
  }
};

export const cancelOrder = async (orderId, userId) => {
  if (!orderId || !userId) throw new Error("ข้อมูลไม่ครบถ้วน");

  const orderRef = doc(db, getCollectionPath('orders'), orderId);
  const userRef = doc(db, getCollectionPath('users'), userId);
  const historyRef = doc(collection(db, getCollectionPath('users'), userId, 'historyLogs'));

  try {
    return await runTransaction(db, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) throw new Error("ไม่พบคำสั่งซื้อ");
      
      const orderData = orderDoc.data();
      if (orderData.userId !== userId) throw new Error("ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้");
      
      if (['paid', 'processing', 'shipped', 'completed', 'received', 'approved'].includes(orderData.status?.toLowerCase())) {
          throw new Error("คำสั่งซื้อนี้ดำเนินการไปแล้ว ไม่สามารถยกเลิกได้");
      }

      if (orderData.status === 'cancelled') {
          throw new Error("คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว");
      }

      // 🔥 FIX: Refund Wallet
      const useWallet = Number(orderData.calculationLog?.usedWallet || orderData.walletUsedAmount || 0);
      if (useWallet > 0) {
        transaction.set(userRef, {
          walletBalance: increment(useWallet),
          updatedAt: serverTimestamp()
        }, { merge: true });
        const walletTxRef = doc(collection(db, getCollectionPath('users'), userId, 'wallet_transactions'));
        transaction.set(walletTxRef, {
          transactionId: `TXW-REF-${orderId}`,
          type: 'REFUND',
          amount: useWallet,
          status: 'SUCCESS',
          note: `คืนยอดเงินจากการยกเลิกออเดอร์ ${orderId}`,
          timestamp: serverTimestamp()
        });
      }

      // 🔥 FIX: Prepare Reads for Quotas to prevent negative values (Read before Write)
      const promoUpdates = [];
      if (orderData.appliedPromotions) {
        for (const p of orderData.appliedPromotions) {
          if (p.id) {
            const pRef = doc(db, getCollectionPath('promotions'), p.id);
            const pSnap = await transaction.get(pRef);
            if (pSnap.exists()) {
               const currentQuota = Number(pSnap.data().quotaUsed || 0);
               promoUpdates.push({ ref: pRef, newQuota: Math.max(0, currentQuota - 1) });
            }
          }
        }
      }
      
      const freebieUpdates = [];
      if (orderData.appliedFreebies) {
        for (const f of orderData.appliedFreebies) {
          if (f.id) {
            const fRef = doc(db, getCollectionPath('freebies'), f.id);
            const fSnap = await transaction.get(fRef);
            if (fSnap.exists()) {
               const currentQuota = Number(fSnap.data().quotaUsed || 0);
               freebieUpdates.push({ ref: fRef, newQuota: Math.max(0, currentQuota - (f.qty || 1)) });
            }
          }
        }
      }

      // --- EXECUTE WRITES ---

      // 🔥 FIX: Return Stock (Using set with merge: true to avoid crashes if product was deleted)
      if (orderData.isStockDeducted && orderData.items) {
        orderData.items.forEach(item => {
          const itemIdentifier = item.id || item.sku;
          if (!itemIdentifier) return;
          const pRef = doc(db, getCollectionPath('products'), itemIdentifier);
          transaction.set(pRef, {
            stockQuantity: increment(item.qty || item.quantity || 1),
            'stats.sold': increment(-(item.qty || item.quantity || 1))
          }, { merge: true });
        });
      }

      // 🔥 FIX: Return Quotas Safely (Clamped to >= 0)
      promoUpdates.forEach(update => {
         transaction.update(update.ref, { quotaUsed: update.newQuota });
      });
      freebieUpdates.forEach(update => {
         transaction.update(update.ref, { quotaUsed: update.newQuota });
      });

      transaction.update(orderRef, {
        status: "cancelled", orderStatus: "Cancelled",
        updatedAt: serverTimestamp(),
        cancelledBy: userId,
        cancelledAt: serverTimestamp(),
        isStockDeducted: false
      });
      
      transaction.set(historyRef, {
          orderId: orderId,
          action: 'CANCEL_ORDER',
          title: 'ยกเลิกคำสั่งซื้อ',
          description: `ผู้ใช้ยกเลิกคำสั่งซื้อรหัส #${orderId.slice(-6).toUpperCase()}`,
          amount: orderData.totals?.netTotal || 0,
          createdAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("🔥 Error in cancelOrder:", error);
    throw error;
  }
};
