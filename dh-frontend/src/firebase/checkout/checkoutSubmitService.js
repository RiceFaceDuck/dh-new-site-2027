import { db } from '../config';
import { doc, collection, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { getCreditSettings, calculateEarnedPoints } from '../credit/creditActionService';
import { appendPaymentVerificationTodo, appendTaxInvoiceTodo } from '../todo/todoActionService';
import { calculateNetTotal, parseFirebaseError } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';

// 🚀 THE FIX (Anti-Spam): Rate Limiting Cache (In-Memory) ป้องกันการรัวคลิก
const requestCache = new Map();

export const submitOrder = async (user, cartItems, checkoutState, totals, slipUrl = null, saveProfile = false) => {
  if (!user || !user.uid) throw new Error("กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ");
  
  // Rate Limit Check (15 วินาทีต่อ 1 ออเดอร์)
  const now = Date.now();
  const lastRequest = requestCache.get(user.uid) || 0;
  if (now - lastRequest < 15000) {
    throw new Error("คุณทำรายการถี่เกินไป กรุณารอสักครู่ (Anti-Spam Protection)");
  }
  requestCache.set(user.uid, now);

  if (!cartItems || cartItems.length === 0) {
    requestCache.delete(user.uid); // Reset if failed validation
    throw new Error("ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าก่อน");
  }

  const creditConfig = await getCreditSettings();

  const orderRef = doc(collection(db, getCollectionPath('orders'))); 
  const userRef = doc(db, getCollectionPath('users'), user.uid);
  const counterRef = doc(db, getCollectionPath('system_counters'), 'orders');

  try {
    return await runTransaction(db, async (transaction) => {
      
      // 1. Setup Reads (Must do all reads before writes in a transaction)
    const userDoc = await transaction.get(userRef);
    const counterDoc = await transaction.get(counterRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const systemPoolRef = doc(db, getCollectionPath('system_accounts'), 'DH_CREDIT_POOL');
    const sysSnap = await transaction.get(systemPoolRef);

    // [SECURITY & CONCURRENCY] Read all products to check stock and real prices
    const productRefs = [];
    const productSnaps = [];
    for (const item of cartItems) {
      const itemIdentifier = item.id || item.sku;
      if (!itemIdentifier) continue;
      
      const pRef = doc(db, getCollectionPath('products'), itemIdentifier);
      productRefs.push({ ref: pRef, item: item });
      productSnaps.push(await transaction.get(pRef));
    }

    // [SECURITY] Read Promotions to validate in real-time
    const promoSnaps = [];
    if (checkoutState?.appliedPromotions?.length > 0) {
      for (const promo of checkoutState.appliedPromotions) {
        if (promo.id) {
          const promoRef = doc(db, getCollectionPath('promotions'), promo.id);
          promoSnaps.push({ snap: await transaction.get(promoRef), name: promo.name || 'โปรโมชัน' });
        }
      }
    }

    // 2. Validations
    const useWallet = Number(checkoutState?.useWallet || 0);
    if (useWallet < 0) {
      throw new Error("จำนวนเงิน Wallet ไม่ถูกต้อง (Negative Bypass Attempt Detected)");
    }
    if (useWallet > 0 && Number(userData.walletBalance || 0) < useWallet) {
      throw new Error("ยอดเงินค้างในระบบ (Wallet) ของคุณไม่เพียงพอ");
    }

    // Validate Promotions
    promoSnaps.forEach(({ snap, name }) => {
      if (!snap.exists()) throw new Error(`โปรโมชัน ${name} ถูกลบออกจากระบบแล้ว`);
      const promoData = snap.data();
      if (promoData.deletedAt || !promoData.isActive) throw new Error(`โปรโมชัน ${name} ถูกปิดใช้งานแล้ว`);
      if (promoData.quotaLimit && promoData.quotaLimit > 0) {
        if ((promoData.quotaUsed || 0) >= promoData.quotaLimit) {
          throw new Error(`โปรโมชัน ${name} สิทธิ์เต็มแล้ว`);
        }
      }
      const now = new Date();
      if (promoData.startDate && new Date(promoData.startDate) > now) throw new Error(`โปรโมชัน ${name} ยังไม่เริ่ม`);
      if (promoData.endDate && new Date(promoData.endDate) < now) throw new Error(`โปรโมชัน ${name} หมดอายุแล้ว`);
    });

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
      otherFeeAmount: checkoutState?.insuranceCost || 0,
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
        const itemBuffer = snap.data().bufferStock !== undefined ? snap.data().bufferStock : 0;
        const requiredQty = productRefs[index].item.qty;
        
        if ((currentStock - requiredQty) < itemBuffer) {
          throw new Error(`สินค้า ${snap.data().sku} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
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

    const earnedPoints = calculateEarnedPoints(finalNetTotal - useWallet, creditConfig, verifiedItems, Number(userData.totalAccumulatedPoints || userData.creditPoints || 0));

    const orderData = {
      orderId: orderRef.id,
      userId: user.uid,
      customer: {
        uid: user.uid,
        accountName: getCustomerDisplayName(userData, getCustomerDisplayName(user, 'ไม่พบ field ในระบบ')),
        firstName: userData.nickname || userData.firstName || '',
        phone: userData.phone || user.phoneNumber || '',
        address: userData.shippingAddress?.address || ''
      },
      items: verifiedItems,
      shippingAddress: checkoutState?.customerData || null,
      shippingMethod: checkoutState?.shippingMethod || "standard",
      taxInvoice: checkoutState?.taxData || null,
      paymentMethod: checkoutState?.paymentMethod || "transfer",
      paymentSlipUrl: slipUrl,
      status: slipUrl ? "pending_payment_verification" : "pending_payment", 
      orderStatus: slipUrl ? "pending_payment_verification" : "pending_payment",
      totals: {
        ...totals,
        netTotal: finalNetTotal, // Use secure price
        subtotal: calculatedPrices.subtotal,
        insuranceCost: checkoutState?.insuranceCost || 0
      },
      calculationLog: {
        promotions: appliedPromos, 
        freebies: checkoutState?.qualifiedFreebies || [],
        discountCode: checkoutState?.discountCode || null,
        discountAmount: calculatedPrices.discountAmount,
        usedWallet: useWallet,
      },
      appliedPromotions: checkoutState?.appliedPromotions || [],
      appliedFreebies: checkoutState?.qualifiedFreebies || [],
      pendingCredits: earnedPoints > 0 ? earnedPoints : 0,
      pointsAwarded: false,
      isStockDeducted: true,
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

    if (useWallet > 0) {
      // ✅ [SECURITY] Deduct strictly from walletBalance, NEVER from creditPoints
      transaction.update(userRef, {
        walletBalance: increment(-useWallet),
        updatedAt: serverTimestamp()
      });
      
      const walletTxRef = doc(collection(db, getCollectionPath('users'), user.uid, 'wallet_transactions'));
      transaction.set(walletTxRef, {
        transactionId: `TXW-${orderRef.id}`,
        type: 'SPEND',
        amount: useWallet,
        status: 'SUCCESS',
        note: `ใช้ยอดค้างในระบบสำหรับออเดอร์ ${orderRef.id}`,
        timestamp: serverTimestamp()
      });
    }
    
    if (saveProfile && checkoutState?.customerData) {
      transaction.update(userRef, { 
        shippingAddress: checkoutState.customerData,
        'stats.lastOrderDate': serverTimestamp(),
        'stats.lastPurchaseDate': serverTimestamp()
      });
    } else {
      transaction.update(userRef, { 
        'stats.lastOrderDate': serverTimestamp(),
        'stats.lastPurchaseDate': serverTimestamp()
      });
    }

    // Delegate Todo creation to SRP Service
    const payableAmount = Math.max(0, finalNetTotal - useWallet);
    appendPaymentVerificationTodo(transaction, orderRef.id, user, checkoutState, { netTotal: payableAmount }, slipUrl);
    appendTaxInvoiceTodo(transaction, orderRef.id, user, checkoutState);

    const historyRef = doc(collection(db, getCollectionPath('users'), user.uid, 'historyLogs'));
    transaction.set(historyRef, {
      orderId: orderRef.id,
      action: "PLACE_ORDER",
      title: "สั่งซื้อสินค้าสำเร็จ",
      description: slipUrl ? `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอตรวจสอบการชำระเงิน` : `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอการชำระเงิน`,
      amount: finalNetTotal,
      createdAt: serverTimestamp()
    });

    // ✅ [CONCURRENCY FIX] Lock Promo/Freebie Quota immediately upon checkout to prevent overselling
    (appliedPromos || []).forEach(p => p.id && transaction.update(doc(db, getCollectionPath('promotions'), p.id), { quotaUsed: increment(1) }));
    (checkoutState?.qualifiedFreebies || []).forEach(f => f.id && transaction.update(doc(db, getCollectionPath('freebies'), f.id), { quotaUsed: increment(f.qty || 1) }));


      return { success: true, orderId: orderRef.id, message: "สร้างคำสั่งซื้อสำเร็จ", netTotal: finalNetTotal };
    });
  } catch (error) {
    console.error("🔥 Error in submitOrder Transaction:", error);
    // Rethrow to let the frontend handle the UI error message, using the new Global Error Parser
    throw new Error(parseFirebaseError(error, "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง"));
  }
};
