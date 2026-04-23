import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  runTransaction, 
  getDoc, 
  increment 
} from 'firebase/firestore';
import { db, auth } from './config';
import { historyService } from './historyService';

const COLLECTION_NAME = 'orders';

export const billingService = {
  subscribeRecentOrders: (maxLimit = 100, callback) => {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('createdAt', 'desc'), 
      limit(maxLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(orders);
    }, (error) => {
      console.error("🔥 Error fetching orders:", error);
      callback([]);
    });

    return unsubscribe;
  },

  /**
   * ✨ Atomic Order Creation (Production Ready)
   * ตัดสต็อก (เช็ค Buffer), หัก Wallet, แจก Credit Points, สร้างบิล ใน Transaction เดียว!
   */
  createOrder: async (orderData, actorUid, actorName) => {
    try {
      let finalOrderId = orderData.orderId;
      let newDocId = null;

      await runTransaction(db, async (transaction) => {
        // ==========================================
        // 1. PHASE READS (อ่านข้อมูลเตรียมไว้ก่อน)
        // ==========================================
        const productRefs = [];
        const productSnaps = [];
        const statusLower = (orderData.orderStatus || orderData.status || '').toLowerCase();

        for (const item of orderData.items) {
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
        // 🚀 [อัปเกรด]: รองรับ Data Structure ทั้งจากหน้าบ้านและหลังบ้าน
        const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
        
        if (customerUid && customerUid !== 'WALK-IN') {
          userRef = doc(db, 'users', customerUid);
          userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            throw new Error("ไม่พบข้อมูลสมาชิกระบบ กรุณาตรวจสอบอีกครั้ง");
          }
        }

        // ==========================================
        // 2. PHASE VALIDATION (ตรวจสอบเงื่อนไขสต๊อกและ Wallet)
        // ==========================================
        const updates = [];
        productSnaps.forEach((snap, index) => {
          if (snap.exists()) {
            const currentStock = snap.data().stockQuantity || 0;
            const requiredQty = productRefs[index].item.qty;
            const itemBuffer = snap.data().bufferStock !== undefined ? snap.data().bufferStock : defaultBuffer;

            // ตรวจสอบ Buffer เฉพาะกรณีที่จะตัดสต๊อกเลย (Paid)
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
            currentWallet = userSnap.data().stats?.creditBalance || userSnap.data().partnerCredit || 0;
            
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

        // ==========================================
        // 3. PHASE WRITES (บันทึกข้อมูล)
        // ==========================================
        
        // ตัดสต๊อกเฉพาะเมื่อจ่ายเงินเลย (หน้า POS)
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

        // รันเลขบิลใหม่หากมีการชำระหรือค้างชำระ
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

        // อัปเดตสถิติยอดขาย (ถ้าชำระแล้ว)
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

        // จัดการ Wallet และ Points ลูกค้า
        if (customerUid && customerUid !== 'WALK-IN' && userRef) {
            let newWalletBalance = currentWallet - walletToUse;
            let currentPoints = userSnap.data().stats?.rewardPoints || 0;
            let newPointsBalance = currentPoints + earnedPoints;

            transaction.update(userRef, { 
              'stats.creditBalance': newWalletBalance, 
              'partnerCredit': newWalletBalance, 
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

        // บันทึก Audit Log
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
  },

  /**
   * ✨ Atomic Update Order Status
   * ตัดสต๊อกและแจกแต้ม "เมื่อพนักงานยืนยันยอดโอน (Paid)"
   */
  updateOrderStatus: async (orderId, newStatus, currentStatus, actorUid) => {
    try {
      // 🚀 [อัปเกรด]: ป้องกันกรณี Argument ถูกส่งมาขาดจาก todoService
      const actualActorUid = actorUid || (typeof currentStatus === 'string' && currentStatus.length > 15 ? currentStatus : 'system');
      const normalizedNewStatus = (newStatus || '').toLowerCase();

      await runTransaction(db, async (transaction) => {
          const docRef = doc(db, COLLECTION_NAME, orderId);
          const docSnap = await transaction.get(docRef);
          
          if (!docSnap.exists()) {
            throw new Error("Document does not exist!");
          }
          
          const orderData = docSnap.data();
          const normalizedCurrentStatus = (orderData.orderStatus || orderData.status || '').toLowerCase();

          // 🚀 [อัปเกรด]: จัดการสถานะแบบ Case-Insensitive (รองรับทั้งหน้าบ้านและหลังบ้าน)
          const isCancelling = normalizedNewStatus === 'cancelled' && normalizedCurrentStatus !== 'cancelled';
          const isConfirmingPayment = normalizedNewStatus === 'paid' && normalizedCurrentStatus !== 'paid';

          const productRefs = [];
          const productSnaps = [];
          let userRef = null;
          let userSnap = null;
          let settingsRef = null;
          let settingsSnap = null;
          let inventorySettingsRef = null;
          let inventorySettingsSnap = null;
          
          // ==========================================
          // 1. PHASE READS
          // ==========================================
          if (isCancelling || isConfirmingPayment) {
              for (const item of orderData.items) {
                  const itemIdentifier = item.id || item.sku;
                  if (item.isFreebie || !itemIdentifier) continue;
                  
                  const pRef = doc(db, 'products', itemIdentifier);
                  productRefs.push({ ref: pRef, qty: item.qty });
                  productSnaps.push(await transaction.get(pRef));
              }

              // 🚀 [อัปเกรด]: ดึง uid ได้จากทั้ง 2 ฟอร์แมต (หน้าบ้าน = customerInfo, หลังบ้าน = customer)
              const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
              if (customerUid && customerUid !== 'WALK-IN') {
                  userRef = doc(db, 'users', customerUid);
                  userSnap = await transaction.get(userRef);
              }
          }

          if (isCancelling) {
              const customerUid = orderData.customerInfo?.uid || orderData.customer?.uid;
              if (customerUid && customerUid !== 'WALK-IN') {
                  settingsRef = doc(db, 'settings', 'credit_config');
                  settingsSnap = await transaction.get(settingsRef);
              }
          }

          if (isConfirmingPayment) {
              inventorySettingsRef = doc(db, 'settings', 'inventory');
              inventorySettingsSnap = await transaction.get(inventorySettingsRef);
          }

          // ==========================================
          // 2. PHASE WRITES & VALIDATION
          // ==========================================
          let updates = { 
            orderStatus: normalizedNewStatus, // บังคับเป็นพิมพ์เล็กทั้งหมด
            status: normalizedNewStatus, 
            updatedAt: serverTimestamp() 
          };

          // อัปเดตเลขบิลถ้ารหัสเดิมเป็น TEMP
          if ((orderData.orderId || '').startsWith('TEMP-') && normalizedNewStatus === 'paid') {
             const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
             const runNum = Math.floor(1000 + Math.random() * 9000);
             updates.orderId = `DH-${dateStr}-${runNum}`;
          }

          // 🌟 กรณีพนักงานกดยืนยันการโอนเงิน (Paid)
          if (isConfirmingPayment) {
             const defaultBuffer = inventorySettingsSnap && inventorySettingsSnap.exists() 
                ? inventorySettingsSnap.data().defaultBufferStock || 0 
                : 0;
             
             // ตัดสต๊อก
             productSnaps.forEach((pSnap, index) => {
                 if (pSnap.exists()) {
                     const currentStock = pSnap.data().stockQuantity || 0;
                     const requiredQty = productRefs[index].qty;
                     const itemBuffer = pSnap.data().bufferStock !== undefined 
                        ? pSnap.data().bufferStock 
                        : defaultBuffer;

                     if ((currentStock - requiredQty) < itemBuffer) {
                         throw new Error(`สินค้า ${pSnap.data().sku} สต็อกคงเหลือไม่เพียงพอ (ติด Buffer ${itemBuffer} ชิ้น)`);
                     }
                     
                     transaction.update(productRefs[index].ref, { 
                       stockQuantity: currentStock - requiredQty, 
                       'stats.sold': increment(requiredQty) 
                     });
                 }
             });

             const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
             
             // เพิ่มสถิติยอดขาย
             if (totalSaleAmount > 0) {
                 const now = new Date();
                 const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                 const yyyyMMdd = `${yyyyMM}-${String(now.getDate()).padStart(2, '0')}`;
                 
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

             // แจกแต้ม
             if (userSnap && userSnap.exists()) {
                 const walletUsed = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
                 const amountForPoints = totalSaleAmount - walletUsed;
                 const POINTS_RATE = 100;
                 
                 if (amountForPoints > 0) {
                     const earnedPoints = Math.floor(amountForPoints / POINTS_RATE);
                     if (earnedPoints > 0) {
                         const currentPoints = userSnap.data().stats?.rewardPoints || 0;
                         const newPointsBalance = currentPoints + earnedPoints;

                         transaction.update(userRef, { 
                           'stats.rewardPoints': newPointsBalance, 
                           updatedAt: serverTimestamp() 
                         });
                         
                         transaction.set(doc(collection(db, 'point_transactions')), {
                             transactionId: `TXP-${Date.now()}`, 
                             uid: userSnap.id, 
                             type: 'earn', 
                             points: earnedPoints, 
                             balanceAfter: newPointsBalance, 
                             referenceId: orderId, 
                             note: 'ได้รับจากการซื้อสินค้า (ยืนยันยอดโอน)', 
                             recordedBy: actualActorUid, 
                             timestamp: serverTimestamp()
                         });
                         
                         updates.earnedPoints = earnedPoints; 
                     }
                 }
             }
          }

          // 🌟 กรณียกเลิกบิล (Cancelled)
          if (isCancelling) {
             // คืนสต๊อก
             productSnaps.forEach((pSnap, index) => {
                 if (pSnap.exists()) {
                     const currentStock = pSnap.data().stockQuantity || 0;
                     const qtyToReturn = productRefs[index].qty;
                     transaction.update(productRefs[index].ref, { 
                       stockQuantity: currentStock + qtyToReturn, 
                       'stats.sold': increment(-qtyToReturn) 
                     });
                 }
             });

             // หักสถิติยอดขายคืน
             if (normalizedCurrentStatus === 'paid') {
                 const createdAt = orderData.createdAt?.toDate() || new Date(); 
                 const yyyyMM = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
                 const yyyyMMdd = `${yyyyMM}-${String(createdAt.getDate()).padStart(2, '0')}`;
                 const totalSaleAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);

                 if (totalSaleAmount > 0) {
                     transaction.set(doc(db, 'sales_stats', yyyyMM), { 
                       totalSales: increment(-totalSaleAmount), 
                       orderCount: increment(-1), 
                       updatedAt: serverTimestamp() 
                     }, { merge: true });
                     
                     transaction.set(doc(db, 'sales_stats', yyyyMMdd), { 
                       totalSales: increment(-totalSaleAmount), 
                       orderCount: increment(-1), 
                       updatedAt: serverTimestamp() 
                     }, { merge: true });
                 }
             }

             // คืน Wallet / ยึด Point
             if (userSnap && userSnap.exists()) {
                 let refundAmount = 0;
                 if (normalizedCurrentStatus === 'paid') {
                     refundAmount = Number(orderData.summary?.finalTotal || orderData.finalTotal || orderData.netTotal || orderData.finalPayable || 0);
                 } else {
                     refundAmount = Number(orderData.summary?.walletUsed || orderData.walletUsedAmount || orderData.walletUsed || 0);
                 }
                 
                 const clawbackPoints = Number(orderData.earnedPoints || 0); 

                 if (refundAmount > 0 || clawbackPoints > 0) {
                     const currentWallet = userSnap.data().stats?.creditBalance || userSnap.data().partnerCredit || 0;
                     const currentPoints = userSnap.data().stats?.rewardPoints || 0;
                     
                     const newWalletBalance = currentWallet + refundAmount;
                     const newPointsBalance = Math.max(0, currentPoints - clawbackPoints);

                     transaction.update(userRef, { 
                       'stats.creditBalance': newWalletBalance, 
                       'partnerCredit': newWalletBalance, 
                       'stats.rewardPoints': newPointsBalance, 
                       updatedAt: serverTimestamp() 
                     });

                     if (refundAmount > 0 && settingsSnap && settingsSnap.exists()) {
                         const ledger = settingsSnap.data().ledger || { systemPoolMax: 1000000, totalAllocated: 0, status: 'SECURE' };
                         const newTotalAllocated = ledger.totalAllocated + refundAmount;
                         let newLedgerStatus = 'SECURE';
                         if (ledger.systemPoolMax > 0 && (newTotalAllocated / ledger.systemPoolMax) >= 0.9) newLedgerStatus = 'WARNING';
                         if (ledger.systemPoolMax > 0 && (newTotalAllocated / ledger.systemPoolMax) >= 1) newLedgerStatus = 'BREACHED';

                         transaction.set(settingsRef, { 
                           ledger: { ...ledger, totalAllocated: newTotalAllocated, status: newLedgerStatus, lastAuditTime: serverTimestamp() }, 
                           updatedAt: serverTimestamp() 
                         }, { merge: true });

                         transaction.set(doc(db, 'credit_transactions', `REF_${orderId}`), {
                             transactionId: `TXR-${Date.now()}`, 
                             uid: userSnap.id, 
                             type: 'refund', 
                             amount: refundAmount, 
                             balanceAfter: newWalletBalance, 
                             referenceId: orderId, 
                             note: 'คืนเงินเข้ากระเป๋าอัตโนมัติ (ยกเลิกบิล)', 
                             recordedBy: actualActorUid, 
                             timestamp: serverTimestamp()
                         });
                     }

                     if (clawbackPoints > 0) {
                         transaction.set(doc(db, 'point_transactions', `CB_${orderId}`), {
                             transactionId: `CB-${Date.now()}`, 
                             uid: userSnap.id, 
                             type: 'deduct', 
                             points: clawbackPoints, 
                             balanceAfter: newPointsBalance, 
                             referenceId: orderId, 
                             note: 'ดึงแต้มสะสมคืนอัตโนมัติ (ยกเลิกบิล)', 
                             recordedBy: actualActorUid, 
                             timestamp: serverTimestamp()
                         });
                     }
                 }
             }
          }

          transaction.update(docRef, updates);

          // บันทึก Log เปลี่ยนสถานะ
          let logMessage = `เปลี่ยนสถานะบิลเป็น: ${normalizedNewStatus}`;
          if (isCancelling) logMessage += ' (และปรับปรุงสต็อก/คืนเงิน/ดึงแต้ม กลับสู่ระบบเรียบร้อยแล้ว)';
          if (isConfirmingPayment) logMessage += ' (ตัดสต๊อกและเก็บสถิติเรียบร้อยแล้ว)';

          transaction.set(doc(collection(db, 'history_logs')), {
              module: 'Billing', 
              action: 'Update', 
              targetId: orderId, 
              details: logMessage, 
              byUid: actualActorUid, 
              timestamp: serverTimestamp()
          });

      });
      
      return orderId;
    } catch (error) { 
      console.error("🔥 Error updating order status:", error);
      throw error; 
    }
  },

  updatePrintCount: async (docId, currentCount) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await updateDoc(docRef, {
        printCount: increment(1), // ✨ ใช้ increment ป้องกัน Race Condition เวลากดปริ้นท์รัวๆ
        lastPrintedAt: serverTimestamp()
      });
      return true;
    } catch (error) { 
      console.error("🔥 Error updating print count:", error);
      return false; 
    }
  }
};