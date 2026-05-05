import { db } from './config';
import { 
  collection, query, where, orderBy, limit, getDocs, doc, updateDoc, 
  addDoc, serverTimestamp, onSnapshot, runTransaction 
} from 'firebase/firestore';
import { historyService } from './historyService';

export const todoService = {
  // 📥 1. ระบบ Subscribe งาน (อัปเกรด: กัน Missing Index)
  subscribePendingTodos: (callback, onError) => {
    // ดึงงานทั้งหมดที่ยังไม่เสร็จ (ลดการเกิด error Composite Index)
    const todosRef = collection(db, 'todos'); // อ้างอิง Collection ให้ตรงกับ checkoutService.js
    
    return onSnapshot(todosRef, (snapshot) => {
      const allTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // กรองและเรียงลำดับฝั่ง Client เพื่อความเร็วและเสถียรภาพ
      const pendingTodos = allTodos
        .filter(t => ['todo', 'in_progress', 'pending'].includes(t.status))
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || a.requestedAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || b.requestedAt?.toMillis() || 0;
            return timeB - timeA;
        });

      callback(pendingTodos);
    }, (error) => {
      console.error("Snapshot Error:", error);
      if (onError) onError(error);
    });
  },

  // 📥 2. ระบบ Subscribe ของผู้จัดการ (อัปเกรด: กรองเฉพาะราคาส่ง)
  subscribeManagerApprovals: (callback, onError) => {
    const todosRef = collection(db, 'todos'); 
    
    return onSnapshot(todosRef, (snapshot) => {
      const allTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const managerTodos = allTodos
        .filter(t => 
            ['WHOLESALE_APPROVAL', 'wholesale_request'].includes(t.type) && 
            ['todo', 'in_progress', 'pending'].includes(t.status)
        )
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || a.requestedAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || b.requestedAt?.toMillis() || 0;
            return timeB - timeA;
        });

      callback(managerTodos);
    }, (error) => {
      console.error("Snapshot Error:", error);
      if (onError) onError(error);
    });
  },

  // 📥 3. ยืนยันสลิปโอนเงิน (ของเดิมจากต้นฉบับ ไม่แตะต้อง Logic สำคัญ)
  verifyPaymentSlip: async (taskId, orderId, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId); // แก้ Collection ให้สอดคล้องกัน
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs')); 

        // 9.1 อัปเดต Order เป็นจ่ายแล้ว
        transaction.update(orderRef, {
          status: 'paid',
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 9.2 ปิดงานตรวจสลิป
        transaction.update(taskRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          actionBy: currentUser?.displayName || 'Staff'
        });

        // 9.3 สร้างงานใหม่ให้ฝ่ายจัดแพ็ค
        const packTaskRef = doc(collection(db, 'todos'));
        transaction.set(packTaskRef, {
          orderId,
          type: 'PACKING',
          title: `จัดเตรียมสินค้าและแพ็ค (Order #${orderId.substring(0,8).toUpperCase()})`,
          status: 'todo',
          priority: 'Normal',
          createdAt: serverTimestamp()
        });

        // 9.4 บันทึกประวัติ (Audit Trail)
        transaction.set(logRef, {
          actionType: 'PAYMENT_VERIFIED',
          orderId: orderId,
          taskId: taskId,
          details: `ยืนยันสลิปโอนเงินถูกต้อง และส่งต่อให้แผนกแพ็คสินค้า`,
          createdBy: currentUser?.uid || 'System',
          createdAt: serverTimestamp()
        });

        // 9.5 บันทึก History ให้ลูกค้าเห็นหน้าเว็บ
        const userOrderDoc = await transaction.get(orderRef);
        if (userOrderDoc.exists() && userOrderDoc.data().userId) {
            const historyRef = doc(collection(db, `users/${userOrderDoc.data().userId}/historyLogs`));
            transaction.set(historyRef, {
                orderId: orderId,
                action: "PAYMENT_APPROVED",
                title: "ตรวจสอบยอดชำระเงินสำเร็จ",
                description: `ออเดอร์ #${orderId.slice(-6)} กำลังเข้าสู่กระบวนการจัดเตรียมสินค้า`,
                createdAt: serverTimestamp()
            });
        }

        return { success: true };
      });
    } catch (error) {
      console.error("verifyPaymentSlip Error:", error);
      throw error;
    }
  },

  // 📥 4. [สร้างใหม่] ฟังก์ชันอนุมัติราคาส่ง ด้วยระบบ Transaction
  approveWholesaleRequest: async (taskId, orderId, newTotals, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs'));

        // อ่านข้อมูล Order เพื่อดึง userId
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("ไม่พบออเดอร์ในระบบ");
        const userId = orderDoc.data().userId;

        // 1. อัปเดต Order: เปลี่ยนราคาใหม่ และเปลี่ยนสถานะรอชำระเงิน
        transaction.update(orderRef, {
          totals: newTotals,
          status: 'pending_payment',
          updatedAt: serverTimestamp(),
          wholesaleApprovedBy: currentUser?.uid || 'Manager'
        });

        // 2. ปิดงานขอราคาส่ง
        transaction.update(taskRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          actionBy: currentUser?.displayName || 'Manager',
          finalApprovedTotals: newTotals // เก็บข้อมูลราคาที่อนุมัติ
        });

        // 3. บันทึก Audit Trail กลาง
        transaction.set(logRef, {
          actionType: 'WHOLESALE_APPROVED',
          orderId: orderId,
          taskId: taskId,
          details: `อนุมัติราคาส่งสำเร็จ ยอดสุทธิใหม่: ฿${newTotals.netTotal}`,
          createdBy: currentUser?.uid || 'Manager',
          createdAt: serverTimestamp()
        });

        // 4. แจ้งเตือนลูกค้าผ่าน History Log (สำคัญมาก เพื่อให้หน้าระบบ History ของลูกค้าเปลี่ยน)
        if (userId) {
            const historyRef = doc(collection(db, `users/${userId}/historyLogs`));
            transaction.set(historyRef, {
                orderId: orderId,
                action: "WHOLESALE_APPROVED",
                title: "คำขอราคาส่งได้รับการอนุมัติ!",
                description: `ออเดอร์ #${orderId.slice(-6)} ได้รับการอัปเดตราคาใหม่แล้ว กรุณาดำเนินการชำระเงิน`,
                amount: newTotals.netTotal,
                createdAt: serverTimestamp()
            });
        }

        return { success: true };
      });
    } catch (error) {
      console.error("approveWholesale Error:", error);
      throw new Error("เกิดข้อผิดพลาดในการอนุมัติราคาส่ง กรุณาลองใหม่");
    }
  }
};