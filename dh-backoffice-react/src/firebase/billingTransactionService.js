import { collection, doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { gasStockService } from './gasStockService';
import { gasHistoryService } from './gasHistoryService';
import { getCreditPreloadRefs, adjustUserCreditWithTransaction } from './credit/creditActionService';
import { withToastError } from '../utils/safeAsync';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = 'orders';
const POINTS_RATE = 100;

// ==========================================
// 🛡️ Helper: Data Fetching (READS)
// ==========================================
async function fetchDependencies(transaction, orderData, statusLower) {
  const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
  const productRefs = [];
  
  for (const item of (orderData.items || [])) {
    const itemIdentifier = item.id || item.sku; 
    if (itemIdentifier) {
      productRefs.push({ ref: doc(db, getCollectionPath('products'), itemIdentifier), item });
    }
  }

  const productSnaps = await Promise.all(productRefs.map(p => transaction.get(p.ref)));
  const settingsSnap = await transaction.get(doc(db, getCollectionPath('settings'), 'inventory'));
  
  let userSnap = null;
  if (customerUid && customerUid !== 'WALK-IN') {
    userSnap = await transaction.get(doc(db, getCollectionPath('users'), customerUid));
    if (!userSnap.exists()) throw new Error("ไม่พบข้อมูลสมาชิกระบบ กรุณาตรวจสอบอีกครั้ง");
  }

  const { getRandomShard } = await import('dh-shared/src/utils/counterUtils');
  const shardId = getRandomShard(5);
  const yearStr = new Date().getFullYear().toString();
  const counterRef = doc(db, 'counters', `receipt_sequence_${shardId}`);
  
  let counterSnap = null;
  if (statusLower === 'paid' || statusLower === 'approved') {
    counterSnap = await transaction.get(counterRef);
  }

  return { productSnaps, productRefs, settingsSnap, userSnap, counterSnap, shardId, yearStr, customerUid };
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
      const requiredQty = productRefs[index].item.qty;
      const isPosOrder = (actorName === 'POS' || actorName === 'POS_OFFLINE_SYNC');
      const itemBuffer = snap.data().bufferStock !== undefined ? snap.data().bufferStock : defaultBuffer;
      const checkLimit = isPosOrder ? 0 : itemBuffer;

      if ((currentStock - requiredQty) < checkLimit && statusLower === 'paid') {
        throw new Error(isPosOrder 
          ? `สินค้า ${snap.data().sku} สต็อกคงเหลือไม่เพียงพอ (คงเหลือ ${currentStock} ชิ้น)`
          : `สินค้า ${snap.data().sku} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
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

  const calculatedPrices = calculateNetTotal({
    items: verifiedItems,
    shippingCost: Number(orderData.summary?.shippingFee ?? orderData.shippingFee ?? 0),
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
  if ((orderData.summary?.vatType || orderData.vatType) === 'included') vatTypeMapped = 'รวม VAT';
  if ((orderData.summary?.vatType || orderData.vatType) === 'excluded') vatTypeMapped = 'แยก VAT';
  
  const vatResult = calculateVat(calculatedPrices.netTotal, vatTypeMapped);
  const finalSecureNetTotal = vatResult.finalTotal;

  const reportedNetTotal = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0);
  if (statusLower === 'paid' && Math.abs(finalSecureNetTotal - reportedNetTotal) > 2) {
    console.warn("POS Price mismatch detected. Using secure server-side price.");
  }
  return { finalSecureNetTotal, verifiedItems };
}

function calculateWalletAndPoints(orderData, userSnap, finalSecureNetTotal, statusLower) {
  let walletToUse = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
  if (Number.isNaN(walletToUse) || walletToUse < 0) walletToUse = 0;
  
  let earnedPoints = 0;
  if (userSnap && userSnap.exists()) {
    const currentWallet = Number(userSnap.data().walletBalance || 0);
    if (walletToUse > 0 && currentWallet < walletToUse) {
      throw new Error("ยอดเงินค้างในระบบ (Wallet) ไม่เพียงพอ");
    }
    if (statusLower === 'paid') {
      const amountForPoints = finalSecureNetTotal - walletToUse;
      if (amountForPoints > 0) earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
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
      const statusLower = (orderData.orderStatus || orderData.status || '').toLowerCase();

      await runTransaction(db, async (transaction) => {
        successfulUpdates = []; 
        
        // 1. Fetch Dependencies (READS)
        const deps = await fetchDependencies(transaction, orderData, statusLower);
        const { productSnaps, productRefs, settingsSnap, userSnap, counterSnap, shardId, yearStr, customerUid } = deps;
        
        // 2. Generate Order ID
        if (statusLower === 'paid' || statusLower === 'approved') {
          const currentSeq = (counterSnap?.exists() ? counterSnap.data()[yearStr] || 0 : 0) + 1;
          const paddedSeq = String(currentSeq).padStart(4, '0');
          finalOrderId = `DH-${shardId}-${yearStr.slice(2)}-${paddedSeq}`;
        } else if (!finalOrderId || (!finalOrderId.startsWith('TEMP-') && !finalOrderId.startsWith('DH-'))) {
          finalOrderId = `TEMP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        const creditPreloadSnaps = await fetchCreditPreloads(transaction, customerUid, finalOrderId, statusLower);
        
        // 3. Validate & Calculate Logic
        const defaultBuffer = settingsSnap.exists() ? settingsSnap.data().defaultBufferStock || 0 : 0;
        const updates = validateStock(productSnaps, productRefs, defaultBuffer, actorName, statusLower);
        const { finalSecureNetTotal, verifiedItems } = await calculateSecureTotal(orderData, productSnaps, statusLower);
        const { walletToUse, earnedPoints } = calculateWalletAndPoints(orderData, userSnap, finalSecureNetTotal, statusLower);

        // 4. Perform Updates (WRITES)
        if (statusLower === 'paid') {
          updates.forEach(u => {
            transaction.update(u.ref, { stockQuantity: u.newQty, 'stats.sold': increment(u.soldInc || 0) });
            successfulUpdates.push({ ...u.originalSnap.data(), sku: u.ref.id, stockQuantity: u.newQty });
            
            setTimeout(() => {
              gasHistoryService.log({ level: 'INFO', module: 'INVENTORY_SYNC', action: 'DETECT_SNAPSHOT', target: { id: 'DET-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + new Date().toTimeString().slice(0, 8).replace(/:/g, '') }, actorOverride: { uid: actorUid, name: 'System/Staff' }, details: { summary: { decreased: 1 }, decreased: [{ sku: u.ref.id, diff: -u.soldInc }] } }); gasHistoryService.log({
                level: 'INFO', module: 'Billing', action: 'SALE',
                actor: { uid: actorUid, name: 'System/Staff' },
                target: { id: u.ref.id, name: u.originalSnap.data()?.name || 'Unknown', type: 'Product' },
                details: { type: 'ขายออก', qtyChange: -u.soldInc, reference: finalOrderId, legacy_details: `ขายออกบิล ${finalOrderId}` }
              });
            }, 0);
          });
          
          (orderData.appliedPromotions || []).forEach(p => p.id && transaction.update(doc(db, getCollectionPath('promotions'), p.id), { quotaUsed: increment(1) }));
          (orderData.appliedFreebies || []).forEach(f => f.id && transaction.update(doc(db, getCollectionPath('freebies'), f.id), { quotaUsed: increment(f.qty || 1) }));
        }

        const newOrderRef = doc(db, COLLECTION_NAME, finalOrderId);
        newDocId = newOrderRef.id;

        if (statusLower === 'paid' || statusLower === 'approved') {
          transaction.set(doc(db, 'counters', `receipt_sequence_${shardId}`), { [yearStr]: (counterSnap?.data()?.[yearStr] || 0) + 1, updatedAt: serverTimestamp() }, { merge: true });
        }

        const dataToSave = { ...orderData };
        if (dataToSave.customer) dataToSave.customer.displayName = dataToSave.customer.displayName || dataToSave.customer.accountName || '';
        if (dataToSave.customerInfo) dataToSave.customerInfo.displayName = dataToSave.customerInfo.displayName || dataToSave.customerInfo.accountName || '';
        if (dataToSave.summary) { dataToSave.summary.finalTotal = finalSecureNetTotal; dataToSave.summary.netTotal = finalSecureNetTotal; }
        
        transaction.set(newOrderRef, {
          ...dataToSave, items: verifiedItems, orderId: finalOrderId, earnedPoints, walletUsedAmount: walletToUse, 
          isStockDeducted: (statusLower === 'paid' || statusLower === 'approved'), updatedAt: serverTimestamp(), 
          createdBy: actorUid, creatorName: actorName, finalTotal: finalSecureNetTotal, netTotal: finalSecureNetTotal,
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
            transaction.update(userRef, { walletBalance: increment(-walletToUse), updatedAt: serverTimestamp() });
            transaction.set(doc(collection(db, getCollectionPath('users'), customerUid, 'wallet_transactions')), {
              transactionId: `TXW_POS_${finalOrderId}`, type: 'SPEND_POS', amount: walletToUse, status: 'SUCCESS',
              note: 'หักจาก DH ค้างยอดสำหรับชำระค่าสินค้า', operatorUid: actorUid || 'System', timestamp: serverTimestamp()
            });
          }
          if (earnedPoints > 0) {
            await adjustUserCreditWithTransaction(transaction, customerUid, earnedPoints, 'earn', 'ได้รับจากการซื้อสินค้า', actorUid, `TXP_${finalOrderId}`, creditPreloadSnaps);
          }
        }
      });
      
      // 5. Post-Transaction Effects
      if (successfulUpdates.length > 0) {
        successfulUpdates.forEach(p => gasStockService.queueUpdate(p));
        await gasStockService.forceSync();
      }
      await historyService.addLog('Billing', 'Create', finalOrderId, `สร้างบิลใหม่ ยอดสุทธิ ฿${(orderData.finalTotal || 0).toLocaleString()}`, actorUid);

      return { id: newDocId, orderId: finalOrderId };
    })(), "เกิดข้อผิดพลาดในการสร้างบิล");
  }
};
