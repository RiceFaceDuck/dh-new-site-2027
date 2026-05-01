import { db } from './config';
import { 
  collection, query, where, orderBy, limit, getDocs, doc, updateDoc, 
  addDoc, serverTimestamp, onSnapshot, runTransaction 
} from 'firebase/firestore';

export const todoService = {
  // 📥 1. ระบบ Subscribe งาน 
  subscribePendingTodos: (callback, onError) => {
    const q = query(
      collection(db, 'tasks'),
      where('status', 'in', ['todo', 'in_progress', 'pending']),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(todos);
    }, (error) => {
      console.error("Snapshot Error:", error);
      if (onError) onError(error);
    });
  },

  // 📥 2. ระบบ Subscribe ของผู้จัดการ
  subscribeManagerApprovals: (callback, onError) => {
    const q = query(
      collection(db, 'tasks'),
      where('type', 'in', ['WHOLESALE_APPROVAL', 'wholesale_request']),
      where('status', 'in', ['todo', 'in_progress', 'pending']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(todos);
    }, (error) => {
      console.error("Manager Snapshot Error:", error);
      if (onError) onError(error);
    });
  },

  // ✅ 3. อนุมัติงาน (General Resolve + Wholesale) 
  // 🌟 [อัปเกรด: เพิ่มระบบบันทึก Audit Log ลงใน Transaction]
  resolveTodo: async (todo, resolutionData, currentUser) => {
    try {
      const taskRef = doc(db, 'tasks', todo.id);
      
      if (todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'wholesale_request') {
        const orderId = todo.orderId || todo.payload?.orderId;
        if (!orderId) throw new Error("ไม่พบ Order ID");

        await runTransaction(db, async (transaction) => {
          const orderRef = doc(db, 'orders', orderId);
          const logRef = doc(collection(db, 'system_logs')); // 📝 เตรียมพื้นที่เขียน Log
          
          // 3.1 อัปเดต Order หน้าบ้าน
          transaction.update(orderRef, {
            finalTotalAmount: resolutionData.approvedPrice,
            shippingFee: resolutionData.approvedShipping,
            manualPromo: resolutionData.manualPromo || 0,
            freebies: resolutionData.freebies || '',
            status: 'awaiting_payment',
            managerApprovedBy: currentUser?.displayName || 'Manager',
            managerApprovedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          // 3.2 ปิดงานใน Todo
          transaction.update(taskRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            actionBy: currentUser?.displayName || 'Manager',
            resolution: resolutionData
          });

          // 3.3 บันทึกประวัติ (Audit Trail)
          transaction.set(logRef, {
            actionType: 'WHOLESALE_APPROVED',
            orderId: orderId,
            taskId: todo.id,
            details: `อนุมัติราคาส่งที่ ฿${resolutionData.approvedPrice.toLocaleString()}`,
            actionByUid: currentUser?.uid || 'system',
            actionByName: currentUser?.displayName || 'Manager',
            timestamp: serverTimestamp()
          });
        });
      } else {
        // งาน Manual ทั่วไป ไม่ต้องบันทึก Log แยกลง system_logs ให้เปลือง Reads
        await updateDoc(taskRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          actionBy: currentUser?.displayName || 'Staff',
          resolution: resolutionData
        });
      }
      return true;
    } catch (error) {
      console.error("Resolve Error:", error);
      throw error;
    }
  },

  // ❌ 4. ปฏิเสธงาน
  rejectTodo: async (todoId, reason, currentUser) => {
    try {
      const taskRef = doc(db, 'tasks', todoId);
      await updateDoc(taskRef, {
        status: 'rejected',
        rejectReason: reason,
        completedAt: serverTimestamp(),
        actionBy: currentUser?.displayName || 'Staff'
      });
    } catch (error) {
      throw error;
    }
  },

  // 📝 5. สร้างงานใหม่
  createManualTodo: async (taskData, currentUser) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...taskData,
        type: 'MANUAL_TASK',
        status: 'todo',
        createdBy: currentUser?.uid,
        creatorName: currentUser?.displayName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  },

  // 📜 6. ประวัติการทำงานใน Todo
  getCompletedTodos: async (limitCount = 30) => {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('status', 'in', ['completed', 'rejected']),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("History Error:", error);
      return [];
    }
  },

  // 🔄 7. ดึงงานกลับมา
  recallTodo: async (todo, currentUser) => {
    try {
      const taskRef = doc(db, 'tasks', todo.id);
      await updateDoc(taskRef, {
        status: 'todo',
        recalledAt: serverTimestamp(),
        recalledBy: currentUser?.displayName
      });
    } catch (error) {
      throw error;
    }
  },

  // 📦 8. ดึงงานทั่วไป 
  getActiveTasks: async (taskType = 'ALL') => {
    try {
      let q;
      if (taskType === 'ALL') {
        q = query(collection(db, 'tasks'), where('status', 'in', ['todo', 'in_progress']), orderBy('createdAt', 'asc'), limit(50));
      } else {
        q = query(collection(db, 'tasks'), where('type', '==', taskType), where('status', 'in', ['todo', 'in_progress']), orderBy('createdAt', 'asc'), limit(50));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { throw error; }
  },

  // 🚀 9. ตรวจสลิปและส่งไปแผนกแพ็ค
  // 🌟 [อัปเกรด: เพิ่มระบบบันทึก Audit Log ลงใน Transaction]
  verifyPaymentAndSendToPack: async (taskId, orderId, currentUser) => {
    try {
      await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'tasks', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs')); // 📝 เตรียมพื้นที่เขียน Log

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
        const packTaskRef = doc(collection(db, 'tasks'));
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
          actionByUid: currentUser?.uid || 'system',
          actionByName: currentUser?.displayName || 'Staff',
          timestamp: serverTimestamp()
        });
      });
    } catch (error) {
      throw error;
    }
  }
};