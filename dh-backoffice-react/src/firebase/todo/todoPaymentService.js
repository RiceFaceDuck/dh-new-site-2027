import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { doc, collection, serverTimestamp, runTransaction, increment } from 'firebase/firestore';

export const todoPaymentService = {
  // 📥 3. ยืนยันสลิปโอนเงิน (ออก Invoice & แจกงานแพ็ค)
  verifyPaymentSlip: async (taskId, orderId, currentUser) => {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs')); 

        const orderDoc = await transaction.get(orderRef);
        
        // ✨ UX UPGRADE: จัดการงานกำพร้าอัตโนมัติ (Auto-clean Orphaned Task)
        if (!orderDoc.exists()) {
          transaction.update(taskRef, {
            status: 'cancelled',
            rejectReason: 'ระบบปิดงานอัตโนมัติ: ไม่พบข้อมูลออเดอร์ต้นทาง (ออเดอร์อาจถูกลบทิ้งไปแล้ว)',
            completedAt: serverTimestamp(),
            actionBy: 'System Auto-Clean'
          });
          return { success: false, orphanedCleared: true, message: "ไม่พบข้อมูลคำสั่งซื้อในระบบ ระบบได้ทำการเคลียร์รายการที่ค้างอยู่นี้ออกให้แล้วครับ" };
        }
        
        const orderData = orderDoc.data();
        const userId = orderData.userId;

        if (orderData.status === 'paid' || orderData.paymentStatus === 'VERIFIED') {
            throw new Error("⚠️ ออเดอร์นี้ได้รับการยืนยันชำระเงินไปแล้วครับ");
        }

        const date = new Date();
        const yearMonth = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const yearStr = date.getFullYear().toString();
        
        // --- ระบบออกเลขบิลแบบรันตามลำดับ (Sequential Running Number) ---
        const { getRandomShard } = await import('dh-shared/src/utils/counterUtils');
        const shardId = getRandomShard(5);
        const counterRef = doc(db, 'counters', `receipt_sequence_${shardId}`);
        const counterDoc = await transaction.get(counterRef);

        let currentSeq = 1;
        if (counterDoc.exists()) {
           const data = counterDoc.data();
           currentSeq = (data[yearStr] || 0) + 1;
        }
        
        const seqStr = String(currentSeq);
        const paddedSeq = seqStr.length >= 5 ? seqStr : seqStr.padStart(4, '0');
        const generatedOrderId = `DH-${yearStr}-${shardId}-${paddedSeq}`;

        // --- 2.5 PRELOAD PRODUCTS FOR STOCK DEDUCTION ---
        const isStockAlreadyDeducted = !!orderData.isStockDeducted;
        const productSnapsToUpdate = [];
        if (!isStockAlreadyDeducted && orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            const itemIdentifier = item.id || item.sku;
            if (item.isFreebie || !itemIdentifier) continue;
            const pRef = doc(db, 'products', itemIdentifier);
            const pSnap = await transaction.get(pRef);
            if (pSnap.exists()) {
              productSnapsToUpdate.push({ ref: pRef, snap: pSnap, item: item, noDeduct: false });
            }
          }
        } else if (orderData.items && Array.isArray(orderData.items)) {
           for (const item of orderData.items) {
             if (!item.sku) continue;
             const pRef = doc(db, 'products', item.sku);
             const pSnap = await transaction.get(pRef);
             if (pSnap.exists()) {
               productSnapsToUpdate.push({ ref: pRef, snap: pSnap, item: item, noDeduct: true });
             }
           }
        }

        // --- 3. EXECUTE ALL WRITES ---
        // อัปเดต counter ในระบบ
        transaction.set(counterRef, { 
           [yearStr]: currentSeq, 
           updatedAt: serverTimestamp() 
        }, { merge: true });

        transaction.update(orderRef, {
          status: 'paid', 
          orderStatus: 'paid',
          orderId: generatedOrderId, 
          invoiceId: generatedOrderId, 
          paymentVerifiedAt: serverTimestamp(),
          paymentVerifiedBy: currentUser?.uid || 'Admin',
          isStockDeducted: true,
          updatedAt: serverTimestamp()
        });

        transaction.update(taskRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          actionBy: currentUser?.displayName || 'Admin'
        });

        // ❌ Stock Deduction is REMOVED from here. It will happen when "Print Bill" is clicked!

        const packTaskRef = doc(collection(db, 'todos')); 
        transaction.set(packTaskRef, {
          orderId: orderId, // The firestore doc id
          displayOrderId: generatedOrderId, 
          type: 'PACKING_TASK', 
          title: `แพ็คสินค้า #${generatedOrderId}`,
          status: 'todo',
          priority: 'High', 
          customerName: orderData.shippingAddress?.fullName || 'ไม่ระบุชื่อ',
          shippingAddress: orderData.shippingAddress || {},
          items: orderData.items || [], 
          createdAt: serverTimestamp()
        });

        transaction.set(logRef, {
          actionType: 'PAYMENT_VERIFIED',
          orderId, taskId, invoiceId: generatedOrderId,
          details: `ยืนยันยอดเงินสำเร็จ และสร้างใบสั่งแพ็ค ${generatedOrderId}`,
          createdBy: currentUser?.uid || 'System',
          createdAt: serverTimestamp()
        });

        if (userId) {
            // Replaced direct Firestore write with GAS History Logger
            gasHistoryService.log({
                module: 'Customer History',
                action: 'PAYMENT_APPROVED',
                target: { id: orderId },
                details: { 
                  legacy_details: `ตรวจสอบยอดชำระเงินสำเร็จ. กำลังเข้าสู่กระบวนการจัดเตรียมสินค้า (เอกสารอ้างอิง: ${generatedOrderId})`
                },
                actorOverride: { uid: userId, name: 'System (For Customer)', email: 'N/A' }
            });
        }

        const localStockUpdates = [];
        for (const data of productSnapsToUpdate) {
            const pSnap = data.snap;
            if (data.noDeduct) {
               localStockUpdates.push({
                  sku: data.item.sku,
                  name: pSnap.data().name,
                  oldStock: pSnap.data().stockQuantity,
                  newStock: pSnap.data().stockQuantity,
                  productData: pSnap.data()
               });
            } else {
               const currentStock = pSnap.data().stockQuantity || 0;
               const requiredQty = data.item.qty || data.item.quantity || 1;
               const newQty = Math.max(0, currentStock - requiredQty);
               transaction.update(data.ref, {
                  stockQuantity: newQty,
                  'stats.sold': increment(requiredQty)
               });
               localStockUpdates.push({
                  sku: data.item.sku,
                  name: pSnap.data().name,
                  oldStock: currentStock,
                  newStock: newQty,
                  productData: pSnap.data()
               });
            }
        }

        return { success: true, invoiceId: generatedOrderId, stockUpdates: localStockUpdates };
      }, { maxAttempts: 15 });

      // --- Post-Transaction execution: Sync to Google Sheets & Log history ---
      if (result && result.stockUpdates && result.stockUpdates.length > 0) {
        for (const update of result.stockUpdates) {
          // Push update to GAS queue
          gasStockService.queueUpdate({
            ...update.productData,
            sku: update.sku,
            stockQuantity: update.newStock
          });

          // Log product stock change to History Logs so that it shows on the History page
          if (update.oldStock !== update.newStock) {
            gasHistoryService.log({
              level: 'WARN',
              module: 'Inventory',
              action: 'Update',
              target: { id: update.sku, name: update.name, type: 'Product' },
              details: {
                legacy_details: `แก้ไขข้อมูลสินค้า: ${update.name}`,
                changes: {
                  stockQuantity: { 
                    from: update.oldStock,
                    to: update.newStock 
                  }
                }
              }
            });
          }
        }
        await gasStockService.forceSync();
      }

      return result;
    } catch (error) {
      console.error("🔥 verifyPaymentSlip Error:", error);
      throw error;
    }
  }
};
