import { db } from '../config';
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
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); 
        const generatedInvoiceId = `INV-${yearMonth}-${randomStr}`;

        transaction.update(orderRef, {
          status: 'paid', 
          invoiceId: generatedInvoiceId, 
          paymentVerifiedAt: serverTimestamp(),
          paymentVerifiedBy: currentUser?.uid || 'Admin',
          updatedAt: serverTimestamp()
        });

        transaction.update(taskRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          actionBy: currentUser?.displayName || 'Admin'
        });

        const packTaskRef = doc(collection(db, 'todos')); 
        transaction.set(packTaskRef, {
          orderId,
          invoiceId: generatedInvoiceId, 
          type: 'PACKING_TASK', 
          title: `แพ็คสินค้า #${orderId.substring(0,8).toUpperCase()}`,
          status: 'todo',
          priority: 'High', 
          customerName: orderData.shippingAddress?.fullName || 'ไม่ระบุชื่อ',
          shippingAddress: orderData.shippingAddress || {},
          items: orderData.items || [], 
          createdAt: serverTimestamp()
        });

        transaction.set(logRef, {
          actionType: 'PAYMENT_VERIFIED',
          orderId, taskId, invoiceId: generatedInvoiceId,
          details: `ยืนยันยอดเงินสำเร็จ และสร้างใบสั่งแพ็ค ${generatedInvoiceId}`,
          createdBy: currentUser?.uid || 'System',
          createdAt: serverTimestamp()
        });

        if (userId) {
            const historyRef = doc(collection(db, `users/${userId}/historyLogs`));
            transaction.set(historyRef, {
                orderId, action: "PAYMENT_APPROVED",
                title: "ตรวจสอบยอดชำระเงินสำเร็จ",
                description: `กำลังเข้าสู่กระบวนการจัดเตรียมสินค้า (เอกสารอ้างอิง: ${generatedInvoiceId})`,
                createdAt: serverTimestamp()
            });
        }
        return { success: true, invoiceId: generatedInvoiceId };
      });
    } catch (error) {
      console.error("🔥 verifyPaymentSlip Error:", error);
      throw error;
    }
  }
};
