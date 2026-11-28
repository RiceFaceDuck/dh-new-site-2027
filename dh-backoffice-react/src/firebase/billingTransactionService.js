import { collection, doc, serverTimestamp, runTransaction, increment, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { gasStockService } from './gasStockService';
import { gasHistoryService } from './gasHistoryService';
import { getCreditPreloadRefs, adjustUserCreditWithTransaction } from './credit/creditActionService';
import { calculateEarnedPoints, getUserTier, fetchAndCacheRoleTiers } from './credit/creditFormatService';
import { unwrapCreditConfig } from 'dh-shared/src/utils/creditUtils';
import { withToastError } from '../utils/safeAsync';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { resolveEffectiveBuffer } from 'dh-shared';
import { syncRecentOrdersCatalog } from './orderSyncService';
import { syncCustomerToDirectoryChunk } from '../pages/Customers/services/customerCacheService';

const COLLECTION_NAME = getCollectionPath('orders');
const POINTS_RATE = 100;

// ==========================================
// 🛡️ Helper: Data Fetching (READS)
// ==========================================
async function fetchDependencies(transaction, orderData, statusLower) {
  const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid || orderData.customer?.id || null;
  const oldDraftDocId = orderData.docId || orderData.id || null;
  let oldDraftSnap = null;
  if (oldDraftDocId) {
    oldDraftSnap = await transaction.get(doc(db, COLLECTION_NAME, oldDraftDocId));
  }
  const oldDraftData = oldDraftSnap?.exists() ? oldDraftSnap.data() : null;
  const alreadyStockDeducted = Boolean(oldDraftData?.isStockDeducted || orderData.isStockDeducted);

  const prevQtyMap = new Map();
  if (alreadyStockDeducted) {
    const prevItems = Array.isArray(oldDraftData?.items) && oldDraftData.items.length > 0
      ? oldDraftData.items
      : (Array.isArray(orderData.originalDeductedItems) ? orderData.originalDeductedItems : []);
    for (const prevItem of prevItems) {
      const prevId = prevItem.id || prevItem.sku;
      if (!prevId) continue;
      const pQty = Math.max(1, Number(prevItem.qty || prevItem.quantity || 1));
      prevQtyMap.set(prevId, (prevQtyMap.get(prevId) || 0) + pQty);
    }
  }

  const aggregatedProductMap = new Map();
  for (const item of (orderData.items || [])) {
    const itemIdentifier = item.id || item.sku; 
    if (itemIdentifier) {
      const qty = Math.max(1, Number(item.qty || 1));
      if (aggregatedProductMap.has(itemIdentifier)) {
        aggregatedProductMap.get(itemIdentifier).totalQty += qty;
      } else {
        aggregatedProductMap.set(itemIdentifier, {
          ref: doc(db, getCollectionPath('products'), itemIdentifier),
          itemIdentifier,
          totalQty: qty,
          item
        });
      }
    }
  }
  if (alreadyStockDeducted) {
    for (const [prevId] of prevQtyMap.entries()) {
      if (!aggregatedProductMap.has(prevId)) {
        aggregatedProductMap.set(prevId, {
          ref: doc(db, getCollectionPath('products'), prevId),
          itemIdentifier: prevId,
          totalQty: 0,
          item: { sku: prevId, qty: 0 }
        });
      }
    }
  }

  const productRefs = Array.from(aggregatedProductMap.values());
  const productSnaps = await Promise.all(productRefs.map(p => transaction.get(p.ref)));
  const settingsSnap = await transaction.get(doc(db, getCollectionPath('settings'), 'inventory'));
  
  let userSnap = null;
  if (customerUid && customerUid !== 'WALK-IN') {
    userSnap = await transaction.get(doc(db, getCollectionPath('users'), customerUid));
    if (!userSnap.exists()) throw new Error("ไม่พบข้อมูลสมาชิกระบบ กรุณาตรวจสอบอีกครั้ง");
  }

  const terminalId = orderData.terminalId || 'O1'; // ใช้ O1 เป็น default หรือที่ส่งมา
  const yearStr = new Date().getFullYear().toString();
  const counterRef = doc(db, getCollectionPath('counters'), `receipt_sequence_global`);
  
  let counterSnap = null;
  let promoFreebieSnaps = [];
  if (statusLower === 'paid' || statusLower === 'approved') {
    counterSnap = await transaction.get(counterRef);

    const promosList = Array.isArray(orderData.appliedPromotions) 
      ? orderData.appliedPromotions 
      : (orderData.appliedPromotion && orderData.appliedPromotion.id ? [orderData.appliedPromotion] : []);
    for (const promo of promosList) {
      if (promo.id) promoFreebieSnaps.push({ type: 'promo', ref: doc(db, getCollectionPath('promotions'), promo.id), snap: await transaction.get(doc(db, getCollectionPath('promotions'), promo.id)) });
    }
    if (orderData.appliedFreebies && Array.isArray(orderData.appliedFreebies)) {
      for (const freebie of orderData.appliedFreebies) {
          if (freebie.id) promoFreebieSnaps.push({ type: 'freebie', ref: doc(db, getCollectionPath('freebies'), freebie.id), snap: await transaction.get(doc(db, getCollectionPath('freebies'), freebie.id)) });
      }
    }
  }

  return { productSnaps, productRefs, settingsSnap, userSnap, counterSnap, terminalId, yearStr, customerUid, promoFreebieSnaps, oldDraftData, alreadyStockDeducted, prevQtyMap };
}

async function fetchCreditPreloads(transaction, customerUid, finalOrderId, statusLower, existingUserSnap = null) {
  if (customerUid && customerUid !== 'WALK-IN' && (statusLower === 'paid' || statusLower === 'approved')) {
    const creditRefs = getCreditPreloadRefs(customerUid, 'earn', `TXP_${finalOrderId}`);
    const snaps = await Promise.all([
      creditRefs.txRef ? transaction.get(creditRefs.txRef) : Promise.resolve(null),
      transaction.get(creditRefs.settingsRef),
      existingUserSnap ? Promise.resolve(existingUserSnap) : transaction.get(creditRefs.userRef),
      // creditRefs.walletRef removed (Phase 4 Quota Optimization)
      transaction.get(creditRefs.activePartnerRef)
    ]);
    return { txSnap: snaps[0], settingsSnap: snaps[1], userSnap: snaps[2], activePartnerSnap: snaps[3] };
  }
  return null;
}

// ==========================================
// 🛡️ Helper: Validations & Calculations
// ==========================================
function validateStock(productSnaps, productRefs, defaultBuffer, actorName, statusLower, canBypass = false, alreadyStockDeducted = false, prevQtyMap = null) {
  const updates = [];
  productSnaps.forEach((snap, index) => {
    if (snap.exists()) {
      const currentStock = snap.data().stockQuantity || 0;
      const requiredQty = Number(productRefs[index].totalQty ?? productRefs[index].item?.qty ?? 0);
      const prevQty = alreadyStockDeducted && prevQtyMap ? (prevQtyMap.get(productRefs[index].itemIdentifier) || 0) : 0;
      const deltaQty = requiredQty - prevQty;
      if (deltaQty === 0) return;

      const isPosOrder = (actorName === 'POS' || actorName === 'POS_OFFLINE_SYNC');
      const bypassAllowed = isPosOrder || Boolean(canBypass);
      const itemBuffer = resolveEffectiveBuffer(snap.data().bufferStock, defaultBuffer);
      const checkLimit = bypassAllowed ? 0 : itemBuffer;

      if (deltaQty > 0 && (currentStock - deltaQty) < checkLimit && statusLower === 'paid') {
        const skuLabel = snap.data().sku || productRefs[index].itemIdentifier;
        throw new Error(bypassAllowed 
          ? `สินค้า ${skuLabel} สต็อกคงเหลือไม่เพียงพอ (คงเหลือ ${currentStock} ชิ้น, ต้องการเพิ่ม ${deltaQty} ชิ้น)`
          : `สินค้า ${skuLabel} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น, คงเหลือ ${currentStock} ชิ้น, ต้องการเพิ่ม ${deltaQty} ชิ้น)`);
      }
      updates.push({ ref: productRefs[index].ref, newQty: currentStock - deltaQty, soldInc: deltaQty, originalSnap: snap });
    }
  });
  return updates;
}

async function calculateSecureTotal(orderData, productSnaps, statusLower) {
  const { calculateNetTotal, calculateVat } = await import('dh-shared');
  
  const verifiedItems = (orderData.items || []).map((item) => {
    const dbProduct = productSnaps.find(snap => snap.id === (item.id || item.sku))?.data();
    const isWholesale = orderData.priceMode === 'wholesale';
    const dbSecurePrice = dbProduct 
      ? (isWholesale 
          ? (dbProduct.Price || dbProduct.retailPrice || item.price || 0) 
          : (dbProduct.retailPrice || dbProduct.Price || item.price || 0))
      : (item.price || 0);
    const secureName = dbProduct ? dbProduct.name : (item.name || item.itemName || 'Unknown Item');
    
    if (item.isFreebie) return { ...item, nameAtPurchase: item.itemName || secureName, priceAtPurchase: 0, price: 0, discount: 0 };
    // Respect cashier-edited unit price in Backoffice POS while retaining dbReferencePrice for audit
    const hasValidItemPrice = item.price !== undefined && item.price !== null && Number.isFinite(Number(item.price)) && Number(item.price) >= 0;
    const effectivePrice = hasValidItemPrice ? Math.max(0, Number(item.price)) : Math.max(0, Number(dbSecurePrice || 0));
    const cleanDiscount = Math.min(effectivePrice, Math.max(0, Number(item.discount || 0)));
    const baseWholesale = Number(item.baseWholesale ?? dbProduct?.Price ?? dbProduct?.retailPrice ?? effectivePrice);
    const baseRetail = Number(item.baseRetail ?? dbProduct?.retailPrice ?? dbProduct?.Price ?? effectivePrice);
    return {
      ...item,
      price: effectivePrice,
      discount: cleanDiscount,
      retailPrice: effectivePrice,
      priceAtPurchase: effectivePrice,
      dbReferencePrice: dbSecurePrice,
      baseWholesale,
      baseRetail,
      nameAtPurchase: secureName
    };
  });

  const shippingCost = Number(orderData.summary?.shippingFee ?? orderData.shippingFee ?? 0);
  const otherFeeAmount = Number(orderData.summary?.otherFeeAmount ?? orderData.otherFeeAmount ?? 0);
  const rawVatType = (orderData.summary?.vatType || orderData.vatType || '').toLowerCase();
  const isVatOnShipping = Boolean(orderData.vatOnShipping ?? orderData.summary?.vatOnShipping ?? false);
  const isExcludedVat = rawVatType === 'excluded';

  // When vatOnShipping is false, shippingCost must NOT be part of the taxable base
  const taxableShippingCost = (!isVatOnShipping) ? 0 : shippingCost;

  const manualBillDiscount = Number(orderData.summary?.manualDiscount ?? orderData.overallDiscount ?? 0);
  const promoList = Array.isArray(orderData.appliedPromotions) ? orderData.appliedPromotions : (orderData.appliedPromotion ? [orderData.appliedPromotion] : []);
  const hasDynamicPromos = promoList.length > 0;

  // 🛡️ Double-Discount Prevention:
  // 1) priceEngine.calculateItemTotal now deducts item.discount per line, so discountAmount MUST NOT re-include itemDiscounts.
  // 2) If dynamic promotions are passed, calculateNetTotal recalculates totalPromoDiscount, so pass only manualBillDiscount.
  const discountToPass = hasDynamicPromos 
    ? manualBillDiscount
    : (manualBillDiscount + Number(orderData.promoDiscount || 0));

  const calculatedPrices = calculateNetTotal({
    items: verifiedItems,
    shippingCost: taxableShippingCost,
    otherFeeAmount: 0, // 🛡️ Post-Tax/Shipping: do not include in taxable base for calculateVat
    discountAmount: discountToPass,
    promotions: orderData.appliedPromotions || []
  });

  let vatTypeMapped = 'ไม่มี VAT';
  if (rawVatType === 'included') vatTypeMapped = 'รวม VAT';
  if (rawVatType === 'excluded') vatTypeMapped = 'แยก VAT';
  
  const vatResult = calculateVat(calculatedPrices.netTotal, vatTypeMapped);
  // 🛡️ Shipping Fee Integrity: When shipping is not taxed, it was excluded from calculateNetTotal, so it must always be added back to finalTotal across all VAT modes
  const baseSecureNetTotal = (!isVatOnShipping)
    ? Math.round((vatResult.finalTotal + shippingCost) * 100) / 100
    : vatResult.finalTotal;
  // 🎯 Post-Tax/Shipping Adjustment: ยอดอื่นๆ (+/-) คิดท้ายสุด
  const finalSecureNetTotal = Math.max(0, Math.round((baseSecureNetTotal + otherFeeAmount) * 100) / 100);

  const reportedNetTotal = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0);
  if (statusLower === 'paid' && Math.abs(finalSecureNetTotal - reportedNetTotal) > 2) {
    console.warn("POS Price mismatch detected. Using secure server-side price.");
  }
  return { 
    finalSecureNetTotal, 
    verifiedItems,
    calculatedSubtotal: calculatedPrices.subtotal || 0,
    effectiveTotalDiscount: calculatedPrices.discountAmount || 0,
    calculatedShipping: shippingCost || 0,
    calculatedVat: vatResult.vatAmount || 0
  };
}

function calculateWalletAndPoints(orderData, userSnap, finalSecureNetTotal, statusLower, creditPreloadSnaps = null, alreadyWalletDeducted = false) {
  let walletToUse = Number(orderData.summary?.walletUsed ?? orderData.walletUsedAmount ?? orderData.walletUsed ?? orderData.calculationLog?.usedWallet ?? 0);
  if (Number.isNaN(walletToUse) || walletToUse < 0) walletToUse = 0;
  
  // ✅ [SECURITY FIX] ป้องกันการใส่ตัวเลข walletUsed มาเกินยอดบิลจริงๆ (ป้องกันหัก Wallet ลูกค้าหมดกระเป๋า)
  walletToUse = Math.min(walletToUse, finalSecureNetTotal);
  
  // 1. ดึงแต้มจากระบบตะกร้าออนไลน์ก่อน ถ้ามีการคำนวณไว้
  const amountForPoints = Math.max(0, finalSecureNetTotal - walletToUse);
  let earnedPoints = Number(orderData.pendingCredits || 0);
  if (earnedPoints >= amountForPoints && amountForPoints > 0) {
    earnedPoints = 0;
  }
  
  if (userSnap && userSnap.exists()) {
    const currentWallet = Number(userSnap.data().walletBalance || 0);
    if (walletToUse > 0 && !alreadyWalletDeducted && currentWallet < walletToUse) {
      throw new Error("ยอดเงินค้างในระบบ (Wallet) ไม่เพียงพอ");
    }
    
    // 2. ถ้าไม่มี ค่อยคำนวณเอง (กรณีมาจาก POS สร้างบิลเอง)
    if ((statusLower === 'paid' || statusLower === 'approved') && earnedPoints <= 0) {
      // ใช้ amountForPoints จากด้านบน (Math.max(0, finalSecureNetTotal - walletToUse))
      if (amountForPoints > 0) {
        const settingsSnap = creditPreloadSnaps?.settingsSnap;
        if (settingsSnap && settingsSnap.exists()) {
            const settingsData = settingsSnap.data() || {};
            const creditConfig = unwrapCreditConfig(settingsSnap.data());
            const userData = userSnap.data() || {};
            const userTotalAccumulatedPoints = Number(userData.totalAccumulatedPoints ?? userData.creditPoints ?? 0);
            
            // คำนวณแต้มด้วย Tier Multiplier อย่างถูกต้อง
            earnedPoints = calculateEarnedPoints(amountForPoints, creditConfig, orderData.items || [], userTotalAccumulatedPoints);
        } else {
            // Fallback
            earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
        }
      }
    }
  }
  return { walletToUse, earnedPoints };
}

// ==========================================
// 🚀 Main Service
// ==========================================
export const billingTransactionService = {
  createOrder: async (orderData, actorUid, actorName) => {
    return withToastError((async () => {
      let finalOrderId = orderData.orderId;
      let newDocId = null;
      let successfulUpdates = [];
      let logsToPost = [];
      let updatedCreditPoints = null;
      const statusLower = (orderData.orderStatus || orderData.status || '').toLowerCase();
      const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid || orderData.customer?.id || null;
      // ⚡ Preload Role Tier Config into memory cache (0 reads if already cached)
      if (customerUid && customerUid !== 'WALK-IN' && (statusLower === 'paid' || statusLower === 'approved')) {
        await fetchAndCacheRoleTiers().catch(() => {});
      }

      try {
        await runTransaction(db, async (transaction) => {
          successfulUpdates = []; 
          logsToPost = [];
          
          // 1. Fetch Dependencies (READS)
          const deps = await fetchDependencies(transaction, orderData, statusLower);
          const { productSnaps, productRefs, settingsSnap, userSnap, counterSnap, terminalId, yearStr, promoFreebieSnaps, oldDraftData, alreadyStockDeducted, prevQtyMap } = deps;
          
          // 2. Generate Order ID
          if (statusLower === 'paid' || statusLower === 'approved') {
            const currentSeq = (counterSnap?.exists() ? counterSnap.data()[yearStr] || 0 : 0) + 1;
            const paddedSeq = String(currentSeq).padStart(4, '0');
            finalOrderId = `DH-${yearStr.slice(2)}-${paddedSeq}`;
          } else if (!finalOrderId || (!finalOrderId.startsWith('DH-') && !finalOrderId.startsWith('TEMP-'))) {
            const rand4 = Math.floor(1000 + Math.random() * 9000);
            finalOrderId = `DH-TEMP-${rand4}`;
          }

          const creditPreloadSnaps = await fetchCreditPreloads(transaction, customerUid, finalOrderId, statusLower, userSnap);
          
          // 3. Validate & Calculate Logic
          const defaultBuffer = settingsSnap.exists() ? (settingsSnap.data().defaultBufferStock ?? 2) : 2;
          const canBypassBuffer = Boolean(
            orderData?.canBypassBuffer ||
            orderData?.canBypassBufferStock ||
            orderData?.channel === 'pos' ||
            orderData?.source === 'pos'
          );
          const alreadyWalletDeducted = Boolean(
            oldDraftData?.isWalletDeducted ||
            orderData.isWalletDeducted ||
            (oldDraftData?.isWebOrder && Number(oldDraftData?.calculationLog?.usedWallet || oldDraftData?.walletUsed || 0) > 0)
          );
          const alreadyQuotaDeducted = Boolean(
            oldDraftData?.isPromoQuotaDeducted ||
            oldDraftData?.isWebOrder ||
            orderData.isPromoQuotaDeducted
          );
          const prevPromoIds = new Set(
            (Array.isArray(oldDraftData?.appliedPromotions) ? oldDraftData.appliedPromotions : [])
              .map(p => p?.id)
              .filter(Boolean)
          );
          const prevFreebieQtyMap = new Map();
          const prevFreebieList = Array.isArray(oldDraftData?.appliedFreebies) && oldDraftData.appliedFreebies.length > 0
            ? oldDraftData.appliedFreebies
            : (Array.isArray(oldDraftData?.calculationLog?.freebies) ? oldDraftData.calculationLog.freebies : []);
          prevFreebieList.forEach(f => {
            if (f?.id) {
              prevFreebieQtyMap.set(f.id, Number(f.calculatedQty || f.qty || 1));
            }
          });

          const updates = validateStock(productSnaps, productRefs, defaultBuffer, actorName, statusLower, canBypassBuffer, alreadyStockDeducted, prevQtyMap);
          const { 
            finalSecureNetTotal, 
            verifiedItems,
            calculatedSubtotal,
            effectiveTotalDiscount,
            calculatedShipping,
            calculatedVat
          } = await calculateSecureTotal(orderData, productSnaps, statusLower);
          const { walletToUse, earnedPoints } = calculateWalletAndPoints(orderData, userSnap, finalSecureNetTotal, statusLower, creditPreloadSnaps, alreadyWalletDeducted);

          // 4. Perform Updates (WRITES)
          if (statusLower === 'paid') {
            updates.forEach(u => {
              transaction.update(u.ref, { stockQuantity: u.newQty, 'stats.sold': increment(u.soldInc || 0) });
              successfulUpdates.push({ ...u.originalSnap.data(), sku: u.ref.id, stockQuantity: u.newQty });
              
              logsToPost.push({
                inventorySync: {
                  level: 'INFO',
                  module: 'INVENTORY_SYNC',
                  action: 'DETECT_SNAPSHOT',
                  target: { id: 'DET-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + new Date().toTimeString().slice(0, 8).replace(/:/g, '') },
                  actorOverride: { uid: actorUid, name: 'System/Staff' },
                  details: { summary: { decreased: 1 }, decreased: [{ sku: u.ref.id, diff: -u.soldInc }] }
                },
                billing: {
                  level: 'INFO',
                  module: 'Billing',
                  action: 'SALE',
                  actor: { uid: actorUid, name: 'System/Staff' },
                  target: { id: u.ref.id, name: u.originalSnap.data()?.name || 'Unknown', type: 'Product' },
                  details: { type: 'ขายออก', qtyChange: -u.soldInc, reference: 'PLACEHOLDER_ORDER_ID', legacy_details: 'PLACEHOLDER_DETAILS' }
                }
              });
            });
            
            // 🎯 Deduct Promo/Freebie Quota Securely (with web-order double-deduction guard)
            for (const item of promoFreebieSnaps) {
                if (item.snap && item.snap.exists()) {
                    if (item.type === 'promo' && alreadyQuotaDeducted && prevPromoIds.has(item.snap.id)) {
                        continue;
                    }
                    const requestedQty = item.type === 'freebie'
                        ? Number((orderData.appliedFreebies || []).find(f => f.id === item.snap.id)?.qty || 1)
                        : 1;
                    const prevDeductedQty = (item.type === 'freebie' && alreadyQuotaDeducted)
                        ? (prevFreebieQtyMap.get(item.snap.id) || 0)
                        : 0;
                    const qtyToDeduct = requestedQty - prevDeductedQty;
                    if (qtyToDeduct <= 0) continue;

                    const data = item.snap.data();
                    if (data.quotaLimit && data.quotaLimit > 0) {
                        const currentUsed = data.quotaUsed || 0;
                        if (currentUsed + qtyToDeduct > data.quotaLimit) {
                            throw new Error(`สร้างบิลไม่สำเร็จ: สิทธิ์${item.type === 'promo' ? 'โปรโมชัน' : 'ของแถม'} "${data.title || data.name || item.snap.id}" เต็มแล้ว (เหลือ 0 สิทธิ์)`);
                        }
                    }
                    transaction.update(item.ref, { quotaUsed: increment(qtyToDeduct) });
                }
            }
          }

          const newOrderRef = doc(db, COLLECTION_NAME, finalOrderId);
          newDocId = newOrderRef.id;

          // 🧹 If upgrading a temp draft to a final order (finalOrderId), mark old temp draft doc as superseded (prevents permission-denied errors on checkout)
          const oldDraftDocId = orderData.docId || orderData.id;
          if (oldDraftDocId && oldDraftDocId !== finalOrderId && String(oldDraftDocId).startsWith('DH-TEMP-')) {
            const oldDraftRef = doc(db, COLLECTION_NAME, oldDraftDocId);
            transaction.set(oldDraftRef, {
              status: 'superseded',
              orderStatus: 'superseded',
              isDraft: false,
              isVoid: true,
              supersededBy: finalOrderId,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } else if (orderData.id && orderData.id !== finalOrderId) {
            const oldDraftRef = doc(db, COLLECTION_NAME, orderData.id);
            transaction.set(oldDraftRef, {
              status: 'superseded',
              orderStatus: 'superseded',
              isDraft: false,
              isVoid: true,
              supersededBy: finalOrderId,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }

          if (statusLower === 'paid' || statusLower === 'approved') {
            transaction.set(doc(db, getCollectionPath('counters'), `receipt_sequence_global`), { [yearStr]: (counterSnap?.data()?.[yearStr] || 0) + 1, updatedAt: serverTimestamp() }, { merge: true });
          }

          const dataToSave = { ...orderData };
          if (userSnap && userSnap.exists()) {
            const uData = userSnap.data() || {};
            if (dataToSave.customer) {
              dataToSave.customer.role = uData.role || uData.rank || 'Customer';
              dataToSave.customer.rank = uData.rank || uData.role || 'Customer';
              dataToSave.customer.tier = getUserTier(Number(uData.totalAccumulatedPoints || uData.creditPoints || 0))?.name || 'Member';
            }
          }
          if (dataToSave.customer) dataToSave.customer.displayName = dataToSave.customer.displayName || dataToSave.customer.accountName || '';
          if (dataToSave.customerInfo) dataToSave.customerInfo.displayName = dataToSave.customerInfo.displayName || dataToSave.customerInfo.accountName || '';
          if (dataToSave.summary) { dataToSave.summary.finalTotal = finalSecureNetTotal; dataToSave.summary.netTotal = finalSecureNetTotal; }
          
          // 📦 Extract unique item SKUs for direct Firestore indexing & search
          const itemSkus = Array.from(new Set(
            (verifiedItems || [])
              .map(i => String(i.sku || i.id || '').trim().toUpperCase())
              .filter(Boolean)
          ));

          const isPaidOrApproved = (statusLower === 'paid' || statusLower === 'approved');
          const shouldDeductWalletNow = isPaidOrApproved && walletToUse > 0 && !alreadyWalletDeducted;
          const isWalletDeducted = alreadyWalletDeducted || shouldDeductWalletNow;
          const validCustomerUid = (customerUid && customerUid !== 'WALK-IN') ? customerUid : null;

          const isWebOrder = Boolean(dataToSave.isWebOrder || orderData.isWebOrder || dataToSave.channel === 'storefront' || orderData.channel === 'storefront');
          const channel = dataToSave.channel || orderData.channel || (isWebOrder ? 'storefront' : 'pos');
          const source = dataToSave.source || orderData.source || (isWebOrder ? 'storefront' : 'pos');

          transaction.set(newOrderRef, {
            ...dataToSave, 
            userId: validCustomerUid || dataToSave.userId || null,
            customerId: validCustomerUid || dataToSave.customerId || null,
            isWebOrder,
            channel,
            source,
            items: verifiedItems, 
            itemSkus,
            orderId: finalOrderId, 
            orderStatus: isPaidOrApproved ? (statusLower === 'approved' ? 'approved' : 'paid') : (dataToSave.orderStatus || 'Draft'),
            status: isPaidOrApproved ? (statusLower === 'approved' ? 'approved' : 'paid') : (dataToSave.status || 'Draft'),
            paymentStatus: isPaidOrApproved ? 'paid' : (dataToSave.paymentStatus || 'unpaid'),
            fulfillmentStatus: isPaidOrApproved 
              ? ((dataToSave.fulfillmentType === 'StorePickup' || dataToSave.shippingMethod === 'pickup') ? 'ready_for_pickup' : 'pending_packing')
              : (dataToSave.fulfillmentStatus || 'pending_payment_verification'),
            earnedPoints, 
            walletUsedAmount: walletToUse, 
            isStockDeducted: isPaidOrApproved || alreadyStockDeducted, 
            isPromoQuotaDeducted: isPaidOrApproved || alreadyQuotaDeducted,
            isWalletDeducted: isWalletDeducted,
            updatedAt: serverTimestamp(), 
            createdBy: actorUid || dataToSave.createdBy, 
            creatorName: actorName || dataToSave.creatorName, 
            staffNickname: actorName || dataToSave.staffNickname || 'พนักงาน',
            staffUid: actorUid || dataToSave.staffUid || null,
            draftOrderId: (oldDraftDocId && oldDraftDocId !== finalOrderId) ? oldDraftDocId : (dataToSave.draftOrderId || null),
            originalDraftId: (oldDraftDocId && oldDraftDocId !== finalOrderId) ? oldDraftDocId : (dataToSave.originalDraftId || null),
            finalTotal: finalSecureNetTotal, 
            netTotal: finalSecureNetTotal,
            totals: {
              subtotal: calculatedSubtotal,
              discount: effectiveTotalDiscount,
              shipping: calculatedShipping,
              vat: calculatedVat,
              netTotal: finalSecureNetTotal,
              grandTotal: finalSecureNetTotal
            },
            ...(earnedPoints > 0 && isPaidOrApproved ? { pointsAwarded: true, pendingCredits: 0 } : {}),
            createdAt: orderData.createdAt || serverTimestamp()
          }, { merge: true });

          if (statusLower === 'paid') {
            const now = new Date();
            const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const yyyyMMdd = `${yyyyMM}-${String(now.getDate()).padStart(2, '0')}`;
            transaction.set(doc(db, getCollectionPath('sales_stats'), yyyyMM), { totalSales: increment(finalSecureNetTotal), orderCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
            transaction.set(doc(db, getCollectionPath('sales_stats'), yyyyMMdd), { date: yyyyMMdd, totalSales: increment(finalSecureNetTotal), orderCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
          }

          if (customerUid && customerUid !== 'WALK-IN' && userSnap?.exists()) {
            const userRef = doc(db, getCollectionPath('users'), customerUid);
            const customerUpdates = {
              lastOrderDate: serverTimestamp(),
              lastOrderId: finalOrderId,
              updatedAt: serverTimestamp()
            };

            // 🛡️ Deduct Wallet ONLY when order is Paid or Approved and not already deducted on Storefront
            if (shouldDeductWalletNow) {
              const currentWallet = Number(userSnap.data()?.walletBalance || 0);
              const balanceAfter = Math.max(0, Math.round((currentWallet - walletToUse) * 100) / 100);
              const txId = `TXW_POS_${finalOrderId}`;
              const walletTxRef = doc(db, getCollectionPath('users'), customerUid, 'wallet_transactions', txId);

              customerUpdates.walletBalance = balanceAfter;
              customerUpdates.lastWalletTxId = txId;

              transaction.set(walletTxRef, {
                transactionId: txId, 
                type: 'SPEND', 
                amount: walletToUse, 
                balanceAfter: balanceAfter,
                status: 'SUCCESS',
                note: `หักจาก DH ค้างยอดสำหรับชำระค่าสินค้า (บิล ${finalOrderId})`, 
                operatorUid: actorUid || 'System', 
                timestamp: serverTimestamp()
              });
            }

            transaction.update(userRef, customerUpdates);

            if (earnedPoints > 0 && isPaidOrApproved) {
              const creditRes = await adjustUserCreditWithTransaction(transaction, customerUid, earnedPoints, 'earn', 'ได้รับจากการซื้อสินค้า', actorUid, `TXP_${finalOrderId}`, creditPreloadSnaps);
              if (creditRes && typeof creditRes.newBalance === 'number') updatedCreditPoints = creditRes.newBalance;
            }
          }
        });
      } catch (error) {
        console.error("🔥 Error in billingTransactionService createOrder runTransaction:", error);
        throw error;
      }
      
      // 5. Post-Transaction Effects
      if (successfulUpdates.length > 0) {
        successfulUpdates.forEach(p => gasStockService.queueUpdate(p));
        await gasStockService.forceSync();
      }

      if (logsToPost.length > 0) {
        logsToPost.forEach(log => {
          const billingLog = { ...log.billing };
          const sku = billingLog.target?.id || '';
          billingLog.details.sku = sku;
          billingLog.details.reference = finalOrderId;
          billingLog.details.legacy_details = sku ? `[${sku}] ขายออกบิล ${finalOrderId}` : `ขายออกบิล ${finalOrderId}`;
          
          gasHistoryService.log(log.inventorySync);
          gasHistoryService.log(billingLog);
        });
      }

      await historyService.addLog('Billing', 'Create', finalOrderId, `สร้างบิลใหม่ ยอดสุทธิ ฿${(orderData.finalTotal || 0).toLocaleString()}`, actorUid);

      // ⚡ Background Cache Sync: Refresh catalogs/recent_orders so new order appears on dashboard immediately
      syncRecentOrdersCatalog(finalOrderId).catch(e => console.warn("[OrderSync] Background catalog sync error:", e));

      // ⚡ Real-time Customer Directory Sync: Update customer's lastOrderDate immediately
      if (customerUid && customerUid !== 'WALK-IN') {
        const customerPayload = {
          uid: customerUid,
          id: customerUid,
          phone: orderData.customer?.phone || orderData.customerInfo?.phone || '',
          name: orderData.customer?.accountName || orderData.customer?.name || '',
          lastOrderDate: Date.now(),
          ...(updatedCreditPoints !== null ? { creditPoints: updatedCreditPoints, points: updatedCreditPoints } : {})
        };
        syncCustomerToDirectoryChunk(customerPayload, 'upsert').catch(e => 
          console.warn("[CustomerSync] Background customer last order sync warning:", e)
        );
      }

      // 🧹 Best-effort cleanup of old temp draft (silently ignores if cashier lacks delete permissions)
      const oldDraftDocId = orderData.docId || orderData.id;
      if (oldDraftDocId && oldDraftDocId !== finalOrderId && String(oldDraftDocId).startsWith('DH-TEMP-')) {
        (async () => {
          try {
            const oldDraftRef = doc(db, COLLECTION_NAME, oldDraftDocId);
            await updateDoc(oldDraftRef, { status: 'draft', orderStatus: 'draft' }).catch(() => {});
            await deleteDoc(oldDraftRef).catch(() => {});
          } catch (_) {}
        })();
      }

      return { id: newDocId, orderId: finalOrderId };
    })(), "เกิดข้อผิดพลาดในการสร้างบิล");
  }
};
