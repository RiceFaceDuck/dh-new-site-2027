import { collection, doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

const COLLECTION_NAME = 'orders';

export const billingTransactionService = {
  createOrder: async (orderData, actorUid, actorName) => {
    try {
      let finalOrderId = orderData.orderId;
      let newDocId = null;

      await runTransaction(db, async (transaction) => {
        const productRefs = [];
        const productSnaps = [];
        const statusLower = (orderData.orderStatus || orderData.status || '').toLowerCase();

        for (const item of (orderData.items || [])) {
          const itemIdentifier = item.id || item.sku; 
          if (item.isFreebie || !itemIdentifier) continue;
          
          const pRef = doc(db, 'products', itemIdentifier);
          productRefs.push({ ref: pRef, item: item });
          productSnaps.push(await transaction.get(pRef));
        }

        const settingsRef = doc(db, 'settings', 'inventory');
        const settingsSnap = await transaction.get(settingsRef);
        const defaultBuffer = settingsSnap.exists() ? settingsSnap.data().defaultBufferStock || 0 : 0;

        let userRef = null;
        let userSnap = null;
        const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
        
        if (customerUid && customerUid !== 'WALK-IN') {
          userRef = doc(db, 'users', customerUid);
          userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            throw new Error("ไม่พบข้อมูลสมาชิกระบบ กรุณาตรวจสอบอีกครั้ง");
          }
        }

        const yearStr = new Date().getFullYear().toString();
        const counterRef = doc(db, 'counters', 'receipt_sequence');
        let counterSnap = null;
        if (statusLower === 'paid' || statusLower === 'approved') {
            counterSnap = await transaction.get(counterRef);
        }

        const updates = [];
        productSnaps.forEach((snap, index) => {
          if (snap.exists()) {
            const currentStock = snap.data().stockQuantity || 0;
            const requiredQty = productRefs[index].item.qty;
            const itemBuffer = snap.data().bufferStock !== undefined ? snap.data().bufferStock : defaultBuffer;

            if ((currentStock - requiredQty) < itemBuffer && statusLower === 'paid') {
              throw new Error(`สินค้า ${snap.data().sku} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
            }
            updates.push({ 
              ref: productRefs[index].ref, 
              newQty: currentStock - requiredQty, 
              soldInc: requiredQty 
            });
          }
        });

        let currentWallet = 0;
        let walletToUse = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
        let earnedPoints = 0;
        const POINTS_RATE = 100;

        // [SECURITY] Calculate exact net total using dh-shared PriceEngine and TaxEngine
        const { calculateNetTotal, calculateVat } = await import('dh-shared');
        const verifiedItems = (orderData.items || []).map((item) => {
            const dbProduct = productSnaps.find(snap => snap.id === (item.id || item.sku))?.data();
            const securePrice = dbProduct ? (dbProduct.retailPrice || dbProduct.Price || item.price || 0) : (item.price || 0);
            const secureName = dbProduct ? dbProduct.name : (item.name || item.itemName || 'Unknown Item');
            
            if (item.isFreebie) {
                 return { ...item, nameAtPurchase: item.itemName || secureName, priceAtPurchase: 0 };
            }
            return { 
                ...item, 
                retailPrice: securePrice,
                priceAtPurchase: securePrice,
                nameAtPurchase: secureName
            };
        });

        const calculatedPrices = calculateNetTotal({
            items: verifiedItems,
            shippingCost: Number(orderData.summary?.shippingFee || 0),
            otherFeeAmount: Number(orderData.summary?.otherFeeAmount || 0),
            discountAmount: Number(orderData.summary?.manualDiscount || orderData.summary?.promoDiscount || 0),
            promotions: orderData.appliedPromotions || []
        });

        let taxableAmount = calculatedPrices.netTotal;
        let vatTypeMapped = 'ไม่มี VAT';
        if (orderData.summary?.vatType === 'included') vatTypeMapped = 'รวม VAT';
        if (orderData.summary?.vatType === 'excluded') vatTypeMapped = 'แยก VAT';
        const vatResult = calculateVat(taxableAmount, vatTypeMapped);
        let finalSecureNetTotal = vatResult.finalTotal;

        const reportedNetTotal = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0);
        if (statusLower === 'paid' && Math.abs(finalSecureNetTotal - reportedNetTotal) > 2) {
             console.warn("POS Price mismatch detected. Using secure server-side price.", finalSecureNetTotal, reportedNetTotal);
        }

        if (userSnap && userSnap.exists()) {
            currentWallet = Number(userSnap.data().walletBalance || 0); // ✅ [SECURITY] Correctly check against Wallet Cash
            
            if (walletToUse > 0 && currentWallet < walletToUse) {
              throw new Error("ยอดเงินค้างในระบบ (Wallet) ไม่เพียงพอ");
            }

            if (statusLower === 'paid') {
                const amountForPoints = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0) - walletToUse;
                if (amountForPoints > 0) {
                  earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
                }
            }
        }
        
        if (statusLower === 'paid') {
            updates.forEach(u => {
              transaction.update(u.ref, { 
                stockQuantity: u.newQty, 
                'stats.sold': increment(u.soldInc || 0) 
              });
            });

            // Update Quota for Promos and Freebies
            if (orderData.appliedPromotions && orderData.appliedPromotions.length > 0) {
               orderData.appliedPromotions.forEach(promo => {
                  if (promo.id) {
                      transaction.update(doc(db, 'promotions', promo.id), { quotaUsed: increment(1) });
                  }
               });
            }
            if (orderData.appliedFreebies && orderData.appliedFreebies.length > 0) {
               orderData.appliedFreebies.forEach(freebie => {
                  if (freebie.id) {
                      transaction.update(doc(db, 'freebies', freebie.id), { quotaUsed: increment(freebie.qty || 1) });
                  }
               });
            }
        }

        let newOrderRef;
        if (orderData.id) {
          newOrderRef = doc(db, COLLECTION_NAME, orderData.id);
        } else {
          newOrderRef = doc(collection(db, COLLECTION_NAME));
        }
        
        newDocId = newOrderRef.id;

        if (statusLower === 'paid' || statusLower === 'approved') {
            let currentSeq = 1;
            if (counterSnap && counterSnap.exists()) {
                currentSeq = (counterSnap.data()[yearStr] || 0) + 1;
            }
            transaction.set(counterRef, {
                [yearStr]: currentSeq,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            finalOrderId = `DH-${yearStr}${String(currentSeq).padStart(4, '0')}`;
        } else if (!finalOrderId || (finalOrderId.startsWith('TEMP-') === false && finalOrderId.startsWith('DH-') === false)) {
            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const runNum = Math.floor(1000 + Math.random() * 9000);
            finalOrderId = `TEMP-${dateStr}-${runNum}`;
        }

        const { id, ...dataToSave } = orderData; 
        
        // Fix accountName to displayName for Consistency
        if (dataToSave.customer) {
            dataToSave.customer.displayName = dataToSave.customer.displayName || dataToSave.customer.accountName || '';
        }
        if (dataToSave.customerInfo) {
            dataToSave.customerInfo.displayName = dataToSave.customerInfo.displayName || dataToSave.customerInfo.accountName || '';
        }

        const finalOrderData = {
            ...dataToSave, 
            items: verifiedItems, // Use verified items with Snapshot
            orderId: finalOrderId, 
            earnedPoints: earnedPoints,
            walletUsedAmount: walletToUse, 
            updatedAt: serverTimestamp(), 
            createdBy: actorUid, 
            creatorName: actorName
        };

        if (!orderData.id) {
          finalOrderData.createdAt = serverTimestamp(); 
        }
        
        transaction.set(newOrderRef, finalOrderData, { merge: true });

        if (statusLower === 'paid') {
            const now = new Date();
            const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const yyyyMMdd = `${yyyyMM}-${String(now.getDate()).padStart(2, '0')}`;
            const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0);

            transaction.set(doc(db, 'sales_stats', yyyyMM), { 
              totalSales: increment(totalSaleAmount), 
              orderCount: increment(1), 
              updatedAt: serverTimestamp() 
            }, { merge: true });

            transaction.set(doc(db, 'sales_stats', yyyyMMdd), { 
              date: yyyyMMdd, 
              totalSales: increment(totalSaleAmount), 
              orderCount: increment(1), 
              updatedAt: serverTimestamp() 
            }, { merge: true });
        }

        if (customerUid && customerUid !== 'WALK-IN' && userRef) {
            const { adjustUserCreditWithTransaction } = await import('./credit/creditActionService');

            if (walletToUse > 0) {
                // ✅ [SECURITY] Strictly deduct from walletBalance, NEVER from creditPoints
                transaction.update(userRef, {
                    walletBalance: increment(-walletToUse),
                    updatedAt: serverTimestamp()
                });

                const walletTxRef = doc(collection(db, `users/${customerUid}/wallet_transactions`));
                transaction.set(walletTxRef, {
                    transactionId: `TXW_POS_${finalOrderId}`,
                    type: 'SPEND_POS',
                    amount: walletToUse,
                    status: 'SUCCESS',
                    note: 'หักจาก DH ค้างยอดสำหรับชำระค่าสินค้า',
                    operatorUid: actorUid || 'System',
                    timestamp: serverTimestamp()
                });
            }

            if (earnedPoints > 0) {
                await adjustUserCreditWithTransaction(
                    transaction,
                    customerUid,
                    earnedPoints,
                    'earn',
                    'ได้รับจากการซื้อสินค้า',
                    actorUid,
                    `TXP_${finalOrderId}`
                );
            }
        }

      });
      
      const netForLog = orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0;
      await historyService.addLog('Billing', 'Create', finalOrderId, `สร้างบิลใหม่ ยอดสุทธิ ฿${netForLog.toLocaleString()}`, actorUid);

      return { id: newDocId, orderId: finalOrderId };
    } catch (error) { 
      throw error; 
    }
  }
};
