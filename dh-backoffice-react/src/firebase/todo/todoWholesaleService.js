import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService.js';
import { doc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';

export const todoWholesaleService = {
  // 📥 4. อนุมัติราคาส่ง 
  approveWholesaleRequest: async (taskId, orderId, newTotals, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs'));

        const orderDoc = await transaction.get(orderRef);
        
        // ✨ UX UPGRADE: จัดการงานกำพร้าอัตโนมัติ
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

        transaction.update(orderRef, {
          totals: newTotals,
          status: 'pending_payment',
          updatedAt: serverTimestamp(),
          wholesaleApprovedBy: currentUser?.uid || 'Manager'
        });

        transaction.update(taskRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          actionBy: currentUser?.displayName || 'Manager',
          finalApprovedTotals: newTotals 
        });

        transaction.set(logRef, {
          actionType: 'WHOLESALE_APPROVED',
          orderId, taskId,
          details: `อนุมัติราคาส่งสำเร็จ ยอดสุทธิใหม่: ฿${newTotals.netTotal}`,
          createdBy: currentUser?.uid || 'Manager',
          createdAt: serverTimestamp()
        });

        if (userId) {
            gasHistoryService.log({
                module: 'Customer History',
                action: 'WHOLESALE_APPROVED',
                target: { id: orderId },
                details: { 
                  legacy_details: `คำขอราคาส่งได้รับการอนุมัติ! ออเดอร์ #${orderId.slice(-6)} อัปเดตราคาใหม่แล้ว`,
                  amount: newTotals.netTotal
                },
                actorOverride: { uid: userId, name: 'System (For Customer)', email: 'N/A' }
            });
        }
        return { success: true };
      });
    } catch (error) {
      console.error("🔥 approveWholesale Error:", error);
      throw error;
    }
  },

  // ❌ 5. ปฏิเสธการขอราคาส่ง
  rejectWholesale: async (taskId, orderId, reason = 'ไม่ระบุเหตุผล', currentUser) => {
      try {
          return await runTransaction(db, async (transaction) => {
              const taskRef = doc(db, 'todos', taskId);
              const orderRef = doc(db, 'orders', orderId);
              
              const orderDoc = await transaction.get(orderRef);
              
              // ✨ UX UPGRADE: จัดการงานกำพร้าอัตโนมัติ แทนการ Throw Error ให้ระบบพัง
              if (!orderDoc.exists()) {
                  transaction.update(taskRef, {
                      status: 'cancelled',
                      rejectReason: 'ระบบปิดงานอัตโนมัติ: ไม่พบข้อมูลออเดอร์ต้นทาง (ออเดอร์อาจถูกลบทิ้งไปแล้ว)',
                      completedAt: serverTimestamp(),
                      actionBy: 'System Auto-Clean'
                  });
                  return { success: false, orphanedCleared: true, message: "ไม่พบข้อมูลออเดอร์ที่เกี่ยวข้อง (ออเดอร์นี้อาจถูกลบไปแล้ว)\n\nระบบได้ทำการเคลียร์งานที่ค้างอยู่นี้ออกจากกระดานให้เรียบร้อยแล้วครับ" };
              }
              
              transaction.update(taskRef, {
                  status: 'rejected',
                  rejectReason: reason,
                  completedAt: serverTimestamp(),
                  actionBy: currentUser?.displayName || 'Admin'
              });

              transaction.update(orderRef, {
                  status: 'pending_payment',
                  wholesaleRejected: true,
                  updatedAt: serverTimestamp()
              });

              return { success: true };
          });
      } catch(err) {
          console.error("🔥 rejectWholesale Error:", err);
          throw err;
      }
  }
};
