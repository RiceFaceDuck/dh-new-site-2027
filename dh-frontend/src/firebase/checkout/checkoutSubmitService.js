import { db } from '../config';
import { doc, collection, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { earnPendingCredit } from '../walletService';
import { getCreditSettings, calculateEarnedPoints } from '../creditService';
import { appendPaymentVerificationTodo, appendTaxInvoiceTodo } from '../todo/todoActionService';
import { calculateNetTotal } from 'dh-shared';

export const submitOrder = async (user, cartItems, checkoutState, totals, slipUrl = null, saveProfile = false) => {
  if (!user || !user.uid) throw new Error("กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ");
  if (!cartItems || cartItems.length === 0) throw new Error("ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าก่อน");

  const orderRef = doc(collection(db, "orders")); 
  const userRef = doc(db, "users", user.uid);
  const counterRef = doc(db, "system_counters", "orders");

  return await runTransaction(db, async (transaction) => {
    
    // 1. Setup Reads (Must do all reads before writes in a transaction)
    const userDoc = await transaction.get(userRef);
    const counterDoc = await transaction.get(counterRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const systemPoolRef = doc(db, 'system_accounts', 'DH_CREDIT_POOL');
    const sysSnap = await transaction.get(systemPoolRef);

    // [SECURITY & CONCURRENCY] Read all products to check stock and real prices
    const productRefs = [];
    const productSnaps = [];
    for (const item of cartItems) {
      const itemIdentifier = item.id || item.sku;
      if (item.isFreebie || !itemIdentifier) continue;
      
      const pRef = doc(db, 'products', itemIdentifier);
      productRefs.push({ ref: pRef, item: item });
      productSnaps.push(await transaction.get(pRef));
    }

    // 2. Validations
    const useWallet = checkoutState?.useWallet || 0;
    if (useWallet > 0 && (userData.walletBalance || 0) < useWallet) {
      throw new Error("ยอดเงินใน Wallet ของคุณไม่เพียงพอ");
    }

    // [SECURITY] Calculate exact net total using dh-shared PriceEngine
    // Re-hydrate cart items with REAL DB prices
    const verifiedItems = cartItems.map((item) => {
      if (item.isFreebie) return item;
      const dbProduct = productSnaps.find(snap => snap.id === (item.id || item.sku))?.data();
      if (!dbProduct) throw new Error(`ไม่พบสินค้า ${item.name} ในระบบ`);
      return { ...item, retailPrice: dbProduct.retailPrice || dbProduct.Price || item.retailPrice };
    });

    const calculatedPrices = calculateNetTotal({
      items: verifiedItems,
      shippingCost: checkoutState?.shippingCost || 0,
      discountAmount: checkoutState?.discountAmount || 0,
      promotions: checkoutState?.appliedPromotions || []
    });

    const finalNetTotal = calculatedPrices.netTotal;
    
    // Safety check: ensure frontend total isn't wildly different from backend calculation
    // A small difference might be due to rounding, but let's be strict.
    if (Math.abs(finalNetTotal - (totals?.netTotal || 0)) > 1) {
      console.warn("Price mismatch detected. Falling back to secure server-side price.", finalNetTotal, totals?.netTotal);
    }

    // [CONCURRENCY] Check Stock limits
    const stockUpdates = [];
    productSnaps.forEach((snap, index) => {
      if (snap.exists()) {
        const currentStock = snap.data().stockQuantity || 0;
        const requiredQty = productRefs[index].item.qty;
        
        if (currentStock < requiredQty) {
          throw new Error(`สินค้า ${snap.data().sku} สต็อกคงเหลือไม่เพียงพอ (เหลือ ${currentStock} ชิ้น)`);
        }
        stockUpdates.push({ 
          ref: productRefs[index].ref, 
          newQty: currentStock - requiredQty, 
          soldInc: requiredQty 
        });
      }
    });

    // 3. Writes
    const appliedPromos = checkoutState?.appliedPromotions?.map(p => `✅ ${p.name || 'โปรโมชั่น'}`) || [];

    const orderData = {
      orderId: orderRef.id,
      userId: user.uid,
      items: verifiedItems,
      shippingAddress: checkoutState?.customerData || null,
      taxInvoice: checkoutState?.taxData || null,
      paymentMethod: checkoutState?.paymentMethod || "transfer",
      paymentSlipUrl: slipUrl,
      status: slipUrl ? "pending_payment_verification" : "pending_payment", 
      totals: {
        ...totals,
        netTotal: finalNetTotal, // Use secure price
        subtotal: calculatedPrices.subtotal,
      },
      calculationLog: {
        promotions: appliedPromos, 
        freebies: checkoutState?.qualifiedFreebies || [],
        discountCode: checkoutState?.discountCode || null,
        discountAmount: calculatedPrices.discountAmount,
        usedWallet: useWallet,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.set(orderRef, orderData);

    // Apply Stock Deductions
    stockUpdates.forEach(u => {
      transaction.update(u.ref, { 
        stockQuantity: u.newQty, 
        'stats.sold': increment(u.soldInc || 0) 
      });
    });

    if (useWallet > 0 || saveProfile) {
      const userUpdateData = {};
      if (useWallet > 0) userUpdateData.walletBalance = (userData.walletBalance || 0) - useWallet;
      if (saveProfile && checkoutState?.customerData) {
        userUpdateData.shippingAddress = checkoutState.customerData;
      }
      transaction.update(userRef, userUpdateData);
    }

    // Delegate Todo creation to SRP Service
    appendPaymentVerificationTodo(transaction, orderRef.id, user, checkoutState, { netTotal: finalNetTotal }, slipUrl);
    appendTaxInvoiceTodo(transaction, orderRef.id, user, checkoutState);

    const historyRef = doc(collection(db, `users/${user.uid}/historyLogs`));
    transaction.set(historyRef, {
      orderId: orderRef.id,
      action: "PLACE_ORDER",
      title: "สั่งซื้อสินค้าสำเร็จ",
      description: slipUrl ? `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอตรวจสอบการชำระเงิน` : `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอการชำระเงิน`,
      amount: finalNetTotal,
      createdAt: serverTimestamp()
    });

    return { success: true, orderId: orderRef.id, message: "สร้างคำสั่งซื้อสำเร็จ", netTotal: finalNetTotal };
  }).then(async (result) => {
    if (result.success && result.netTotal > 0) {
      try {
        const config = await getCreditSettings();
        const earnedPoints = calculateEarnedPoints(result.netTotal, config, cartItems);
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
