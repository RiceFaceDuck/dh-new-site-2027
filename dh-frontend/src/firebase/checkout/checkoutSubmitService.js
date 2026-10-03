import { db } from '../config';
import { doc, collection, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { getCreditSettings, calculateEarnedPoints } from '../credit/creditActionService';
import { getUserTier } from '../credit/creditFormatService';
import { appendPaymentVerificationTodo, appendTaxInvoiceTodo } from '../todo/todoActionService';
import { calculateNetTotal, parseFirebaseError, resolveEffectiveBuffer, isStockAvailableForSale } from 'dh-shared';
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

  try {
    return await runTransaction(db, async (transaction) => {
      
      // 1. Setup Reads (Must do all reads before writes in a transaction)
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const systemPoolRef = doc(db, getCollectionPath('system_accounts'), 'DH_CREDIT_POOL');
    const sysSnap = await transaction.get(systemPoolRef);

    const inventorySettingsRef = doc(db, getCollectionPath('settings'), 'inventory');
    const inventorySettingsSnap = await transaction.get(inventorySettingsRef);
    const globalBuffer = inventorySettingsSnap.exists() ? (inventorySettingsSnap.data().defaultBufferStock ?? 2) : 2;

    // [SECURITY & CONCURRENCY] Read all products to check stock and real prices
    // Support variant products by mapping to parentId if present
    const productDocMap = new Map();
    for (const item of cartItems) {
      const targetDocId = item.parentId || item.id || item.sku;
      if (!targetDocId) continue;
      
      if (!productDocMap.has(targetDocId)) {
        const pRef = doc(db, getCollectionPath('products'), targetDocId);
        const pSnap = await transaction.get(pRef);
        productDocMap.set(targetDocId, { ref: pRef, snap: pSnap, items: [] });
      }
      productDocMap.get(targetDocId).items.push(item);
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

    // [SECURITY] Read Freebies to validate in real-time
    const freebieSnaps = [];
    if (checkoutState?.qualifiedFreebies?.length > 0) {
      for (const freebie of checkoutState.qualifiedFreebies) {
        if (freebie.id) {
          const freebieRef = doc(db, getCollectionPath('freebies'), freebie.id);
          freebieSnaps.push({ snap: await transaction.get(freebieRef), name: freebie.name || 'ของแถม', requestedQty: freebie.qty || 1 });
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

    // Validate Freebies
    freebieSnaps.forEach(({ snap, name, requestedQty }) => {
      if (!snap.exists()) throw new Error(`ของแถม ${name} ถูกลบออกจากระบบแล้ว`);
      const data = snap.data();
      if (data.deletedAt || !data.isActive) throw new Error(`ของแถม ${name} ถูกปิดใช้งานแล้ว`);
      if (data.quotaLimit && data.quotaLimit > 0) {
        if ((data.quotaUsed || 0) + requestedQty > data.quotaLimit) {
          throw new Error(`ของแถม ${name} สิทธิ์เต็มแล้ว`);
        }
      }
    });

    // [SECURITY] Calculate exact net total using dh-shared PriceEngine
    // Re-hydrate cart items with REAL DB prices (supporting both main products and variants)
    const verifiedItems = cartItems.map((item) => {
      if (item.isFreebie) return item;
      const targetDocId = item.parentId || item.id || item.sku;
      const entry = productDocMap.get(targetDocId);
      const dbProduct = entry?.snap?.exists() ? entry.snap.data() : null;
      if (!dbProduct) throw new Error(`ไม่พบสินค้า ${item.name} ในระบบ`);
      
      let resolvedPrice = dbProduct.retailPrice || dbProduct.Price || item.retailPrice || 0;
      if (dbProduct.salePrice && Number(dbProduct.salePrice) > 0 && Number(dbProduct.salePrice) < resolvedPrice) {
        resolvedPrice = Number(dbProduct.salePrice);
      }
      if (Array.isArray(dbProduct.variants)) {
        const matchedVariant = dbProduct.variants.find(v => 
          (item.id && (v.sku === item.id || v.id === item.id)) ||
          (item.sku && (v.sku === item.sku || v.id === item.sku)) ||
          (item.variantAttributes && v.attributes && 
           JSON.stringify(v.attributes) === JSON.stringify(item.variantAttributes))
        );
        if (matchedVariant) {
          const varBasePrice = matchedVariant.retailPrice || matchedVariant.price || resolvedPrice;
          resolvedPrice = (matchedVariant.salePrice && Number(matchedVariant.salePrice) > 0 && Number(matchedVariant.salePrice) < varBasePrice)
            ? Number(matchedVariant.salePrice)
            : varBasePrice;
        }
      }
      return { ...item, retailPrice: resolvedPrice, price: resolvedPrice };
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

    // [CONCURRENCY] Check Stock limits for each unique product doc
    const stockUpdates = [];
    for (const [targetDocId, entry] of productDocMap.entries()) {
      if (!entry.snap.exists()) {
        throw new Error(`ไม่พบข้อมูลสต็อกสินค้า ID: ${targetDocId}`);
      }
      
      const pData = entry.snap.data();
      let currentParentStock = pData.stockQuantity || 0;
      let totalSoldInc = 0;
      let updatedVariants = Array.isArray(pData.variants) ? pData.variants.map(v => ({ ...v })) : null;
      let hasVariantStockDeduction = false;

      for (const item of entry.items) {
        const requiredQty = item.qty || item.quantity || 1;
        totalSoldInc += requiredQty;

        // If this item is a variant, check and deduct variant stock inside child variants array
        if (updatedVariants) {
          const vIdx = updatedVariants.findIndex(v => 
            (item.id && (v.sku === item.id || v.id === item.id)) ||
            (item.sku && (v.sku === item.sku || v.id === item.sku)) ||
            (item.variantAttributes && v.attributes && 
             JSON.stringify(v.attributes) === JSON.stringify(item.variantAttributes))
          );
          if (vIdx !== -1) {
            const v = updatedVariants[vIdx];
            const vStock = v.stockQuantity || 0;
            const vBuffer = resolveEffectiveBuffer(v.bufferStock, resolveEffectiveBuffer(pData.bufferStock, globalBuffer));
            if (!isStockAvailableForSale(vStock, vBuffer, requiredQty)) {
              throw new Error(`ตัวเลือกสินค้า ${v.sku || item.name} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${vBuffer} ชิ้น)`);
            }
            updatedVariants[vIdx].stockQuantity = vStock - requiredQty;
            hasVariantStockDeduction = true;
          }
        }

        // Also check parent stock
        const itemBuffer = resolveEffectiveBuffer(pData.bufferStock, globalBuffer);
        if (!isStockAvailableForSale(currentParentStock, itemBuffer, requiredQty)) {
          throw new Error(`สินค้า ${pData.sku || pData.name} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
        }
        currentParentStock -= requiredQty;
      }

      const updatePayload = {
        stockQuantity: currentParentStock,
        'stats.sold': increment(totalSoldInc || 0),
        lastOrderId: orderRef.id
      };
      if (hasVariantStockDeduction && updatedVariants) {
        updatePayload.variants = updatedVariants;
      }
      stockUpdates.push({
        ref: entry.ref,
        payload: updatePayload
      });
    }

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
        address: userData.shippingAddress?.address || '',
        role: userData.role || userData.rank || 'Customer',
        rank: userData.rank || userData.role || 'Customer',
        tier: getUserTier(Number(userData.totalAccumulatedPoints || userData.creditPoints || 0), creditConfig?.tiers)?.name || 'Member'
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

    // Apply Stock Deductions (including variant array updates if applicable)
    stockUpdates.forEach(u => {
      transaction.update(u.ref, u.payload);
    });

    const currentWalletBalance = Number(userData.walletBalance || 0);
    const balanceAfter = Math.round((currentWalletBalance - useWallet) * 100) / 100;
    const txId = `TXW-${orderRef.id}`;

    const userUpdatePayload = {
      'stats.lastOrderDate': serverTimestamp(),
      'stats.lastPurchaseDate': serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (saveProfile && checkoutState?.customerData) {
      userUpdatePayload.shippingAddress = checkoutState.customerData;
    }

    if (useWallet > 0) {
      userUpdatePayload.walletBalance = balanceAfter;
      userUpdatePayload.lastWalletTxId = txId;

      const walletTxRef = doc(db, getCollectionPath('users'), user.uid, 'wallet_transactions', txId);
      transaction.set(walletTxRef, {
        transactionId: txId,
        type: 'SPEND',
        amount: useWallet,
        balanceAfter: balanceAfter,
        status: 'SUCCESS',
        note: `ใช้ยอดค้างในระบบสำหรับออเดอร์ ${orderRef.id}`,
        timestamp: serverTimestamp()
      });
    }

    transaction.update(userRef, userUpdatePayload);

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
    (checkoutState?.appliedPromotions || []).forEach(p => p.id && transaction.update(doc(db, getCollectionPath('promotions'), p.id), { quotaUsed: increment(1) }));
    (checkoutState?.qualifiedFreebies || []).forEach(f => f.id && transaction.update(doc(db, getCollectionPath('freebies'), f.id), { quotaUsed: increment(f.qty || 1) }));


      return { success: true, orderId: orderRef.id, message: "สร้างคำสั่งซื้อสำเร็จ", netTotal: finalNetTotal };
    });
  } catch (error) {
    console.error("🔥 Error in submitOrder Transaction:", error);
    // Rethrow to let the frontend handle the UI error message, using the new Global Error Parser
    throw new Error(parseFirebaseError(error, "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง"));
  }
};
