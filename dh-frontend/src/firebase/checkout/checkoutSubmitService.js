import { db } from '../config';
import { doc, collection, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';
import { earnPendingCredit } from '../walletService';
import { getCreditSettings, calculateEarnedPoints } from '../creditService';

export const submitOrder = async (user, cartItems, checkoutState, totals, slipUrl = null, saveProfile = false) => {
  if (!user || !user.uid) throw new Error("กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ");
  if (!cartItems || cartItems.length === 0) throw new Error("ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าก่อน");

  const orderRef = doc(collection(db, "orders")); 
  const userRef = doc(db, "users", user.uid);
  const counterRef = doc(db, "system_counters", "orders");

  return await runTransaction(db, async (transaction) => {
    
    const userDoc = await transaction.get(userRef);
    const counterDoc = await transaction.get(counterRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const systemPoolRef = doc(db, 'system_accounts', 'DH_CREDIT_POOL');
    const sysSnap = await transaction.get(systemPoolRef);

    const useWallet = checkoutState?.useWallet || 0;
    
    if (useWallet > 0 && (userData.walletBalance || 0) < useWallet) {
      throw new Error("ยอดเงินใน Wallet ของคุณไม่เพียงพอ");
    }
    if (useWallet > 0 && (userData.walletBalance || 0) < useWallet) {
      throw new Error("ยอดเงินใน Wallet ของคุณไม่เพียงพอ");
    }

    const appliedPromos = checkoutState?.appliedPromotions?.map(p => `✅ ${p.name || 'โปรโมชั่น'}`) || [];

    const orderData = {
      orderId: orderRef.id,
      userId: user.uid,
      items: cartItems,
      shippingAddress: checkoutState?.customerData || null,
      taxInvoice: checkoutState?.taxData || null,
      paymentMethod: checkoutState?.paymentMethod || "transfer",
      paymentSlipUrl: slipUrl,
      status: slipUrl ? "pending_payment_verification" : "pending_payment", 
      totals: totals,
      calculationLog: {
        promotions: appliedPromos, 
        freebies: checkoutState?.qualifiedFreebies || [],
        discountCode: checkoutState?.discountCode || null,
        discountAmount: checkoutState?.discountAmount || 0,
        usedWallet: useWallet,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.set(orderRef, orderData);

    if (useWallet > 0 || saveProfile) {
      const userUpdateData = {};
      
      if (useWallet > 0) userUpdateData.walletBalance = (userData.walletBalance || 0) - useWallet;
      
      if (saveProfile && checkoutState?.customerData) {
        userUpdateData.shippingAddress = checkoutState.customerData;
      }
      
      transaction.update(userRef, userUpdateData);
    }

    if (slipUrl) {
      const todoRef = doc(collection(db, "todos"));
      transaction.set(todoRef, {
        type: "verify_slip",
        status: "pending",
        title: `ตรวจสอบการชำระเงิน: ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()}`,
        orderId: orderRef.id,
        userId: user.uid,
        customerName: checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป",
        amount: totals?.netTotal || 0,
        slipUrl: slipUrl,
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }

    if (checkoutState?.taxData) {
      const taxTodoRef = doc(collection(db, "todos"));
      transaction.set(taxTodoRef, {
        type: "issue_tax_invoice",
        status: "pending",
        title: `ออกใบกำกับภาษี: ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()}`,
        orderId: orderRef.id,
        userId: user.uid,
        customerName: checkoutState.taxData.name || checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป",
        payload: {
          taxInvoice: checkoutState.taxData,
          orderId: orderRef.id
        },
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }

    const historyRef = doc(collection(db, `users/${user.uid}/historyLogs`));
    transaction.set(historyRef, {
      orderId: orderRef.id,
      action: "PLACE_ORDER",
      title: "สั่งซื้อสินค้าสำเร็จ",
      description: slipUrl ? `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอตรวจสอบการชำระเงิน` : `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอการชำระเงิน`,
      amount: totals?.netTotal || 0,
      createdAt: serverTimestamp()
    });

    return { success: true, orderId: orderRef.id, message: "สร้างคำสั่งซื้อสำเร็จ", netTotal: totals?.netTotal || 0 };
  }).then(async (result) => {
    if (result.success && result.netTotal > 0) {
      try {
        const config = await getCreditSettings();
        const earnedPoints = calculateEarnedPoints(result.netTotal, config);
        if (earnedPoints > 0) {
          await earnPendingCredit(user.uid, earnedPoints, result.orderId);
        }
      } catch (err) {
        console.error("🔥 System Error [earnPendingCredit fallback]:", err);
      }
    }
    return result;
  });
};
