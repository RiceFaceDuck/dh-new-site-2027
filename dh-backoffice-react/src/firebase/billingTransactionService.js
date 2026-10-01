import { collection, doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { gasStockService } from './gasStockService';
import { gasHistoryService } from './gasHistoryService';
import { getCreditPreloadRefs, adjustUserCreditWithTransaction } from './credit/creditActionService';
import { calculateEarnedPoints, getUserTier } from './credit/creditFormatService';
import { withToastError } from '../utils/safeAsync';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { syncRecentOrdersCatalog } from './orderSyncService';

const COLLECTION_NAME = getCollectionPath('orders');
const POINTS_RATE = 100;

// ==========================================
// 🛡️ Helper: Data Fetching (READS)
// ==========================================
async function fetchDependencies(transaction, orderData, statusLower) {
  const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
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

    if (orderData.appliedPromotions && Array.isArray(orderData.appliedPromotions)) {
      for (const promo of orderData.appliedPromotions) {
          if (promo.id) promoFreebieSnaps.push({ type: 'promo', ref: doc(db, getCollectionPath('promotions'), promo.id), snap: await transaction.get(doc(db, getCollectionPath('promotions'), promo.id)) });
      }
    }
    if (orderData.appliedFreebies && Array.isArray(orderData.appliedFreebies)) {
      for (const freebie of orderData.appliedFreebies) {
          if (freebie.id) promoFreebieSnaps.push({ type: 'freebie', ref: doc(db, getCollectionPath('freebies'), freebie.id), snap: await transaction.get(doc(db, getCollectionPath('freebies'), freebie.id)) });
      }
    }
  }

  return { productSnaps, productRefs, settingsSnap, userSnap, counterSnap, terminalId, yearStr, customerUid, promoFreebieSnaps };
}

async function fetchCreditPreloads(transaction, customerUid, finalOrderId, statusLower) {
  if (customerUid && customerUid !== 'WALK-IN' && statusLower === 'paid') {
    const creditRefs = getCreditPreloadRefs(customerUid, 'earn', `TXP_${finalOrderId}`);
    const snaps = await Promise.all([
      creditRefs.txRef ? transaction.get(creditRefs.txRef) : Promise.resolve(null),
      transaction.get(creditRefs.settingsRef),
      transaction.get(creditRefs.userRef),
      transaction.get(creditRefs.walletRef),
      transaction.get(creditRefs.activePartnerRef)
    ]);
    return { txSnap: snaps[0], settingsSnap: snaps[1], userSnap: snaps[2], walletSnap: snaps[3], activePartnerSnap: snaps[4] };
  }
  return null;
}

// ==========================================
// 🛡️ Helper: Validations & Calculations
// ==========================================
function validateStock(productSnaps, productRefs, defaultBuffer, actorName, statusLower) {
  const updates = [];
  productSnaps.forEach((snap, index) => {
    if (snap.exists()) {
      const currentStock = snap.data().stockQuantity || 0;
      const requiredQty = productRefs[index].totalQty || productRefs[index].item?.qty || 1;
      const isPosOrder = (actorName === 'POS' || actorName === 'POS_OFFLINE_SYNC');
      const itemBuffer = snap.data().bufferStock !== undefined ? snap.data().bufferStock : defaultBuffer;
      const checkLimit = isPosOrder ? 0 : itemBuffer;

      if ((currentStock - requiredQty) < checkLimit && statusLower === 'paid') {
        const skuLabel = snap.data().sku || productRefs[index].itemIdentifier;
        throw new Error(isPosOrder 
          ? `สินค้า ${skuLabel} สต็อกคงเหลือไม่เพียงพอ (คงเหลือ ${currentStock} ชิ้น, ต้องการ ${requiredQty} ชิ้น)`
          : `สินค้า ${skuLabel} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น, คงเหลือ ${currentStock} ชิ้น, ต้องการ ${requiredQty} ชิ้น)`);
      }
      updates.push({ ref: productRefs[index].ref, newQty: currentStock - requiredQty, soldInc: requiredQty, originalSnap: snap });
    }
  });
  return updates;
}

async function calculateSecureTotal(orderData, productSnaps, statusLower) {
  const { calculateNetTotal, calculateVat } = await import('dh-shared');
  
  const verifiedItems = (orderData.items || []).map((item) => {
    const dbProduct = productSnaps.find(snap => snap.id === (item.id || item.sku))?.data();
    const isWholesale = orderData.priceMode === 'wholesale';
    const securePrice = dbProduct 
      ? (isWholesale 
          ? (dbProduct.Price || dbProduct.retailPrice || item.price || 0) 
          : (dbProduct.retailPrice || dbProduct.Price || item.price || 0))
      : (item.price || 0);
    const secureName = dbProduct ? dbProduct.name : (item.name || item.itemName || 'Unknown Item');
    
    if (item.isFreebie) return { ...item, nameAtPurchase: item.itemName || secureName, priceAtPurchase: 0 };
    return { ...item, retailPrice: securePrice, priceAtPurchase: securePrice, nameAtPurchase: secureName };
  });

  const shippingCost = Number(orderData.summary?.shippingFee ?? orderData.shippingFee ?? 0);
  const rawVatType = (orderData.summary?.vatType || orderData.vatType || '').toLowerCase();
  const isVatOnShipping = Boolean(orderData.vatOnShipping ?? orderData.summary?.vatOnShipping ?? false);
  const isExcludedVat = rawVatType === 'excluded';

  // When vatOnShipping is false and vatType is 'excluded', shippingCost must NOT be part of the taxable base
  const taxableShippingCost = (!isVatOnShipping && isExcludedVat) ? 0 : shippingCost;

  const calculatedPrices = calculateNetTotal({
    items: verifiedItems,
    shippingCost: taxableShippingCost,
    otherFeeAmount: Number(orderData.summary?.otherFeeAmount ?? orderData.otherFeeAmount ?? 0),
    discountAmount: Number(
      orderData.summary?.manualDiscount ?? 
      orderData.summary?.promoDiscount ?? 
      orderData.summary?.discount ?? 
      orderData.discountTotal ?? 
      (Number(orderData.overallDiscount || 0) + Number(orderData.promoDiscount || 0))
    ),
    promotions: orderData.appliedPromotions || []
  });

  let vatTypeMapped = 'ไม่มี VAT';
  if (rawVatType === 'included') vatTypeMapped = 'รวม VAT';
  if (rawVatType === 'excluded') vatTypeMapped = 'แยก VAT';
  
  const vatResult = calculateVat(calculatedPrices.netTotal, vatTypeMapped);
  const finalSecureNetTotal = (!isVatOnShipping && isExcludedVat)
    ? Math.round((vatResult.finalTotal + shippingCost) * 100) / 100
    : vatResult.finalTotal;

  const reportedNetTotal = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0);
  if (statusLower === 'paid' && Math.abs(finalSecureNetTotal - reportedNetTotal) > 2) {
    console.warn("POS Price mismatch detected. Using secure server-side price.");
  }
  return { finalSecureNetTotal, verifiedItems };
}

function calculateWalletAndPoints(orderData, userSnap, finalSecureNetTotal, statusLower, creditPreloadSnaps = null) {
  let walletToUse = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
  if (Number.isNaN(walletToUse) || walletToUse < 0) walletToUse = 0;
  
  // ✅ [SECURITY FIX] ป้องกันการใส่ตัวเลข walletUsed มาเกินยอดบิลจริงๆ (ป้องกันหัก Wallet ลูกค้าหมดกระเป๋า)
  walletToUse = Math.min(walletToUse, finalSecureNetTotal);
  
  // 1. ดึงแต้มจากระบบตะกร้าออนไลน์ก่อน ถ้ามีการคำนวณไว้
  let earnedPoints = Number(orderData.pendingCredits || 0);
  
  if (userSnap && userSnap.exists()) {
    const currentWallet = Number(userSnap.data().walletBalance || 0);
    if (walletToUse > 0 && currentWallet < walletToUse) {
      throw new Error("ยอดเงินค้างในระบบ (Wallet) ไม่เพียงพอ");
    }
    
    // 2. ถ้าไม่มี ค่อยคำนวณเอง (กรณีมาจาก POS สร้างบิลเอง)
    if (statusLower === 'paid' && earnedPoints <= 0) {
      const amountForPoints = finalSecureNetTotal - walletToUse;
      if (amountForPoints > 0) {
        const settingsSnap = creditPreloadSnaps?.settingsSnap;
        if (settingsSnap && settingsSnap.exists()) {
            const settingsData = settingsSnap.data() || {};
            const creditConfig = settingsData.config || settingsData.creditConfig || settingsData;
            const userData = userSnap.data() || {};
            const userTotalAccumulatedPoints = userData.totalAccumulatedPoints || 0;
            
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
      const statusLower = (orderData.orderStatus || orderData.status || '').toLowerCase();

      try {
        await runTransaction(db, async (transaction) => {
          successfulUpdates = []; 
          logsToPost = [];
          
          // 1. Fetch Dependencies (READS)
          const deps = await fetchDependencies(transaction, orderData, statusLower);
          const { productSnaps, productRefs, settingsSnap, userSnap, counterSnap, terminalId, yearStr, customerUid, promoFreebieSnaps } = deps;
          
          // 2. Generate Order ID
          if (statusLower === 'paid' || statusLower === 'approved') {
            const currentSeq = (counterSnap?.exists() ? counterSnap.data()[yearStr] || 0 : 0) + 1;
            const paddedSeq = String(currentSeq).padStart(4, '0');
            finalOrderId = `DH-${yearStr.slice(2)}-${paddedSeq}`;
          } else if (!finalOrderId || (!finalOrderId.startsWith('DH-') && !finalOrderId.startsWith('TEMP-'))) {
            finalOrderId = `DH-TEMP-${Math.floor(1000 + Math.random() * 9000)}`;
          }

          const creditPreloadSnaps = await fetchCreditPreloads(transaction, customerUid, finalOrderId, statusLower);
          
          // 3. Validate & Calculate Logic
          const defaultBuffer = settingsSnap.exists() ? settingsSnap.data().defaultBufferStock || 0 : 0;
          const updates = validateStock(productSnaps, productRefs, defaultBuffer, actorName, statusLower);
          const { finalSecureNetTotal, verifiedItems } = await calculateSecureTotal(orderData, productSnaps, statusLower);
          const { walletToUse, earnedPoints } = calculateWalletAndPoints(orderData, userSnap, finalSecureNetTotal, statusLower, creditPreloadSnaps);

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
            
            // 🎯 Deduct Promo/Freebie Quota Securely
            for (const item of promoFreebieSnaps) {
                if (item.snap && item.snap.exists()) {
                    const data = item.snap.data();
                    if (data.quotaLimit && data.quotaLimit > 0) {
                        const currentUsed = data.quotaUsed || 0;
                        const qtyToDeduct = item.type === 'freebie' ? ((orderData.appliedFreebies || []).find(f => f.id === item.snap.id)?.qty || 1) : 1;
                        if (currentUsed + qtyToDeduct > data.quotaLimit) {
                            throw new Error(`สร้างบิลไม่สำเร็จ: สิทธิ์${item.type === 'promo' ? 'โปรโมชัน' : 'ของแถม'} "${data.title || data.name || item.snap.id}" เต็มแล้ว (เหลือ 0 สิทธิ์)`);
                        }
                    }
                    transaction.update(item.ref, { quotaUsed: increment(item.type === 'freebie' ? ((orderData.appliedFreebies || []).find(f => f.id === item.snap.id)?.qty || 1) : 1) });
                }
            }
          }

          const newOrderRef = doc(db, COLLECTION_NAME, finalOrderId);
          newDocId = newOrderRef.id;

          // 🧹 If upgrading a temp draft (orderData.id) to a final order (finalOrderId), delete old temp draft doc from Firestore
          if (orderData.id && orderData.id !== finalOrderId) {
            const oldDraftRef = doc(db, COLLECTION_NAME, orderData.id);
            transaction.delete(oldDraftRef);
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
          
          transaction.set(newOrderRef, {
            ...dataToSave, items: verifiedItems, orderId: finalOrderId, earnedPoints, walletUsedAmount: walletToUse, 
            isStockDeducted: (statusLower === 'paid' || statusLower === 'approved'), updatedAt: serverTimestamp(), 
            createdBy: actorUid, creatorName: actorName, finalTotal: finalSecureNetTotal, netTotal: finalSecureNetTotal,
            ...(earnedPoints > 0 ? { pointsAwarded: true, pendingCredits: 0 } : {}),
            ...(orderData.id ? {} : { createdAt: serverTimestamp() })
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
            if (walletToUse > 0) {
              const currentWallet = Number(userSnap.data()?.walletBalance || 0);
              const balanceAfter = Math.max(0, Math.round((currentWallet - walletToUse) * 100) / 100);
              const txId = `TXW_POS_${finalOrderId}`;
              const walletTxRef = doc(db, getCollectionPath('users'), customerUid, 'wallet_transactions', txId);

              transaction.update(userRef, { 
                walletBalance: balanceAfter, 
                lastWalletTxId: txId,
                updatedAt: serverTimestamp() 
              });
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
            if (earnedPoints > 0) {
              await adjustUserCreditWithTransaction(transaction, customerUid, earnedPoints, 'earn', 'ได้รับจากการซื้อสินค้า', actorUid, `TXP_${finalOrderId}`, creditPreloadSnaps);
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

      return { id: newDocId, orderId: finalOrderId };
    })(), "เกิดข้อผิดพลาดในการสร้างบิล");
  }
};
