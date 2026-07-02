import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { doc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';

export const todoPaymentService = {
  // 📥 3. ยืนยันสลิปโอนเงิน (ออก Invoice & แจกงานแพ็ค)
  verifyPaymentSlip: async (taskId, orderId, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
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
        const counterRef = doc(db, 'counters', 'receipt_sequence');
        const counterDoc = await transaction.get(counterRef);

        let currentSeq = 1;
        if (counterDoc.exists()) {
           const data = counterDoc.data();
           currentSeq = (data[yearStr] || 0) + 1;
        }
        
        const generatedOrderId = `DH-${yearStr}${String(currentSeq).padStart(4, '0')}`;

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

        // 🔄 Sync Stock to Google Sheets (GAS)
        // Since frontend deducted stock but didn't push to GAS, we do it here upon approval.
        if (orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            if (!item.sku) continue;
            const pRef = doc(db, 'products', item.sku);
            const pSnap = await transaction.get(pRef);
            if (pSnap.exists()) {
              gasStockService.queueUpdate({ 
                ...pSnap.data(),
                sku: item.sku, 
                stockQuantity: pSnap.data().stockQuantity 
              });
            }
          }
          await gasStockService.forceSync();
        }

        return { success: true, invoiceId: generatedOrderId };
      });
    } catch (error) {
      console.error("🔥 verifyPaymentSlip Error:", error);
      throw error;
    }
  }
};
