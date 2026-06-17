import { db } from '../config';
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';

export const confirmOrderReceipt = async (orderId, userId) => {
  if (!orderId || !userId) throw new Error("ข้อมูลไม่ครบถ้วน");

  const orderRef = doc(db, "orders", orderId);
  const userRef = doc(db, "users", userId);
  const txRef = doc(collection(db, "credit_transactions"));

  return await runTransaction(db, async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists()) throw new Error("ไม่พบคำสั่งซื้อ");
    
    const orderData = orderDoc.data();
    if (orderData.userId !== userId) throw new Error("ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้");
    if (orderData.status === "received") throw new Error("คำสั่งซื้อนี้ถูกยืนยันการรับสินค้าไปแล้ว");

    const userDoc = await transaction.get(userRef);
    const currentPoints = userDoc.exists() ? (userDoc.data().points || 0) : 0;
    const earnedPoints = orderData.pendingCredits || 0;
    const newBalance = currentPoints + earnedPoints;

    transaction.update(orderRef, {
      status: "received",
      receivedAt: serverTimestamp(),
      pendingCredits: 0 
    });

    if (earnedPoints > 0) {
      transaction.update(userRef, {
        points: newBalance,
        updatedAt: serverTimestamp()
      });

      transaction.set(txRef, {
        transactionId: `TX-${Date.now()}`,
        uid: userId,
        type: 'earn',
        amount: earnedPoints,
        balanceAfter: newBalance,
        referenceId: orderId,
        note: 'ได้รับจากการสั่งซื้อสินค้า (ยืนยันรับสินค้า)',
        recordedBy: userId,
        timestamp: serverTimestamp()
      });
    }
  });
};

export const cancelOrder = async (orderId, userId) => {
  if (!orderId || !userId) throw new Error("ข้อมูลไม่ครบถ้วน");

  const orderRef = doc(db, "orders", orderId);
  const historyRef = doc(collection(db, `users/${userId}/historyLogs`));

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

    transaction.update(orderRef, {
      status: "cancelled", orderStatus: "Cancelled",
      updatedAt: serverTimestamp(),
      cancelledBy: userId,
      cancelledAt: serverTimestamp()
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
};
