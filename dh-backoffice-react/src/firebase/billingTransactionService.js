import { collection, doc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { db } from './config';

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

        if (userSnap && userSnap.exists()) {
            currentWallet = userSnap.data().creditPoints || 0;
            
            if (walletToUse > 0 && currentWallet < walletToUse) {
              throw new Error("ยอดเงินใน Wallet ไม่เพียงพอ");
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
        }

        let newOrderRef;
        if (orderData.id) {
          newOrderRef = doc(db, COLLECTION_NAME, orderData.id);
        } else {
          newOrderRef = doc(collection(db, COLLECTION_NAME));
        }
        
        newDocId = newOrderRef.id;

        if (statusLower === 'paid' || statusLower === 'pending') {
            const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const runNum = Math.floor(1000 + Math.random() * 9000);
            finalOrderId = `DH-${dateStr}-${runNum}`;
        }

        const finalOrderData = {
            ...orderData, 
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
            let newWalletBalance = currentWallet - walletToUse;
            let currentPoints = userSnap.data().stats?.rewardPoints || 0;
            let newPointsBalance = currentPoints + earnedPoints;

            transaction.update(userRef, { 
              'creditPoints': newWalletBalance, 
              'stats.rewardPoints': newPointsBalance, 
              updatedAt: serverTimestamp() 
            });

            if (walletToUse > 0) {
                transaction.set(doc(collection(db, 'credit_transactions')), {
                    transactionId: `TXW-${Date.now()}`, 
                    uid: customerUid, 
                    type: 'spend', 
                    amount: walletToUse, 
                    balanceAfter: newWalletBalance, 
                    referenceId: finalOrderId, 
                    note: 'ใช้ชำระค่าสินค้า', 
                    recordedBy: actorUid, 
                    timestamp: serverTimestamp()
                });
            }

            if (earnedPoints > 0) {
                transaction.set(doc(collection(db, 'point_transactions')), {
                    transactionId: `TXP-${Date.now()}`, 
                    uid: customerUid, 
                    type: 'earn', 
                    points: earnedPoints, 
                    balanceAfter: newPointsBalance, 
                    referenceId: finalOrderId, 
                    note: 'ได้รับจากการซื้อสินค้า', 
                    recordedBy: actorUid, 
                    timestamp: serverTimestamp()
                });
            }
        }

        const netForLog = orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || 0;
        transaction.set(doc(collection(db, 'history_logs')), {
            module: 'Billing', 
            action: 'Create', 
            targetId: finalOrderId, 
            details: `สร้างบิลใหม่ ยอดสุทธิ ฿${netForLog.toLocaleString()}`, 
            byUid: actorUid, 
            timestamp: serverTimestamp()
        });

      });
      
      return { id: newDocId, orderId: finalOrderId };
    } catch (error) { 
      throw error; 
    }
  }
};
