import { db } from './config';
import { 
  collection, query, where, orderBy, limit, getDocs, doc, updateDoc, 
  addDoc, serverTimestamp, onSnapshot, runTransaction 
} from 'firebase/firestore';
import { historyService } from './historyService';

export const todoService = {
  // 📥 1. ระบบ Subscribe งาน (ใช้ 'todos' แทน 'tasks')
  subscribePendingTodos: (callback, onError) => {
    const todosRef = collection(db, 'todos');
    
    return onSnapshot(todosRef, (snapshot) => {
      const allTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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

  // 📥 2. ระบบ Subscribe ของผู้จัดการ
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

  // 📥 3. ยืนยันสลิปโอนเงิน (อัปเกรด: ออก Invoice & ส่งงานแพ็คลง 'todos')
  verifyPaymentSlip: async (taskId, orderId, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs')); 

        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("ไม่พบข้อมูลคำสั่งซื้อ");
        
        const orderData = orderDoc.data();
        const userId = orderData.userId;

        // 🌟 จำลองการสร้าง Invoice ID 
        const date = new Date();
        const yearMonth = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); 
        const generatedInvoiceId = `INV-${yearMonth}-${randomStr}`;

        // 9.1 อัปเดต Order เป็นจ่ายแล้ว 
        transaction.update(orderRef, {
          status: 'paid', 
          invoiceId: generatedInvoiceId, 
          paymentVerifiedAt: serverTimestamp(),
          paymentVerifiedBy: currentUser?.uid || 'Admin',
          updatedAt: serverTimestamp()
        });

        // 9.2 ปิดงานตรวจสลิป
        transaction.update(taskRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          actionBy: currentUser?.displayName || 'Admin'
        });

        // 9.3 🌟 สร้างงานให้ฝ่ายแพ็คสินค้าลงคิว 'todos' 
        const packTaskRef = doc(collection(db, 'todos')); 
        transaction.set(packTaskRef, {
          orderId: orderId,
          invoiceId: generatedInvoiceId, 
          type: 'PACKING_TASK', 
          title: `แพ็คสินค้า #${orderId.substring(0,8).toUpperCase()}`,
          status: 'todo',
          priority: 'High', 
          customerName: orderData.shippingAddress?.fullName || 'ไม่ระบุชื่อ',
          shippingAddress: orderData.shippingAddress || {},
          items: orderData.items || [], 
          requestedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });

        // 9.4 บันทึกประวัติส่วนกลาง
        transaction.set(logRef, {
          actionType: 'PAYMENT_VERIFIED',
          orderId: orderId,
          taskId: taskId,
          invoiceId: generatedInvoiceId,
          details: `ยืนยันยอดเงินสำเร็จ และสร้างใบสั่งแพ็ค ${generatedInvoiceId}`,
          createdBy: currentUser?.uid || 'System',
          createdAt: serverTimestamp()
        });

        // 9.5 แจ้งลูกค้าหน้าเว็บ
        if (userId) {
            const historyRef = doc(collection(db, `users/${userId}/historyLogs`));
            transaction.set(historyRef, {
                orderId: orderId,
                action: "PAYMENT_APPROVED",
                title: "ตรวจสอบยอดชำระเงินสำเร็จ",
                description: `กำลังเข้าสู่กระบวนการจัดเตรียมสินค้า (เอกสารอ้างอิง: ${generatedInvoiceId})`,
                createdAt: serverTimestamp()
            });
        }

        return { success: true, invoiceId: generatedInvoiceId };
      });
    } catch (error) {
      console.error("verifyPaymentSlip Error:", error);
      throw error;
    }
  },

  // 📥 4. อนุมัติราคาส่ง 
  approveWholesaleRequest: async (taskId, orderId, newTotals, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs'));

        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("ไม่พบออเดอร์ในระบบ");
        const userId = orderDoc.data().userId;

        // อัปเดตราคาใหม่และเปลี่ยนสถานะ
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
          orderId: orderId,
          taskId: taskId,
          details: `อนุมัติราคาส่งสำเร็จ ยอดสุทธิใหม่: ฿${newTotals.netTotal}`,
          createdBy: currentUser?.uid || 'Manager',
          createdAt: serverTimestamp()
        });

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
  },

  // 📥 5. ปฏิเสธการขอราคาส่ง
  rejectWholesale: async (taskId, orderId) => {
     try {
         return await runTransaction(db, async (transaction) => {
             const taskRef = doc(db, 'todos', taskId);
             const orderRef = doc(db, 'orders', orderId);
             
             transaction.update(taskRef, {
                 status: 'rejected',
                 completedAt: serverTimestamp()
             });

             // คืนสถานะกลับเป็นรอยืนยัน หรือยกเลิก (ขึ้นอยู่กับ Business Logic, เบื้องต้นให้ตีกลับเป็นรอชำระราคาปกติ)
             transaction.update(orderRef, {
                 status: 'pending_payment',
                 updatedAt: serverTimestamp()
             });

             return { success: true };
         });
     } catch(err) {
         console.error(err);
         throw err;
     }
  },

  // ฟังก์ชันดั้งเดิม (คงไว้เพื่อไม่ให้ระบบพัง)
  getCompletedTodos: async (limitCount = 50) => {
      const q = query(
          collection(db, 'todos'),
          where('status', 'in', ['completed', 'rejected']),
          orderBy('completedAt', 'desc'),
          limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  startTask: async (taskId) => {
      const taskRef = doc(db, 'todos', taskId);
      await updateDoc(taskRef, { status: 'in_progress', updatedAt: serverTimestamp() });
  },

  completeTask: async (taskId) => {
      const taskRef = doc(db, 'todos', taskId);
      await updateDoc(taskRef, { status: 'completed', completedAt: serverTimestamp() });
  },

  rejectTask: async (taskId, reason = '') => {
      const taskRef = doc(db, 'todos', taskId);
      await updateDoc(taskRef, { status: 'rejected', reason: reason, completedAt: serverTimestamp() });
  },

  createManualTask: async (taskData, currentUser) => {
      const newTask = {
          ...taskData,
          status: 'todo',
          createdAt: serverTimestamp(),
          createdBy: currentUser?.uid || 'Admin'
      }
      await addDoc(collection(db, 'todos'), newTask);
  }
};