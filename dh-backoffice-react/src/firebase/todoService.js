import { db } from './config';
import { 
  collection, query, where, orderBy, limit, getDocs, doc, updateDoc, 
  addDoc, deleteDoc, serverTimestamp, onSnapshot, runTransaction 
} from 'firebase/firestore';

export const todoService = {
  
  // 📥 1. ระบบ Subscribe งาน (ประหยัด Reads กรองจาก Server)
  subscribePendingTodos: (callback, onError) => {
    const q = query(
      collection(db, 'todos'),
      where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager'])
    );
    
    return onSnapshot(q, (snapshot) => {
      const pendingTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || a.requestedAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || b.requestedAt?.toMillis() || 0;
            return timeB - timeA;
        });
      callback(pendingTodos);
    }, (error) => {
      console.error("🔥 Snapshot Error (Pending Todos):", error);
      if (onError) onError(error);
    });
  },

  // 📥 2. ระบบ Subscribe ของผู้จัดการ
  subscribeManagerApprovals: (callback, onError) => {
    const q = query(
      collection(db, 'todos'),
      where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager'])
    ); 
    
    return onSnapshot(q, (snapshot) => {
      const allPending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const managerTodos = allPending
        .filter(t => 
            ['WHOLESALE_APPROVAL', 'wholesale_request', 'CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL'].includes(t.type)
        )
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || a.requestedAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || b.requestedAt?.toMillis() || 0;
            return timeB - timeA;
        });
      callback(managerTodos);
    }, (error) => {
      console.error("🔥 Snapshot Error (Manager):", error);
      if (onError) onError(error);
    });
  },

  // 🗑️ [ฟังก์ชันใหม่!] ลบงานที่ค้าง/กำพร้า (แก้ไขปัญหา H-627089)
  deleteTask: async (taskId) => {
    try {
      const taskRef = doc(db, 'todos', taskId);
      await deleteDoc(taskRef);
      return { success: true };
    } catch (error) {
      console.error("🔥 Error deleting ghost task:", error);
      throw error;
    }
  },

  // 📥 3. ยืนยันสลิปโอนเงิน (ออก Invoice & แจกงานแพ็ค)
  verifyPaymentSlip: async (taskId, orderId, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs')); 

        const orderDoc = await transaction.get(orderRef);
        // 🛡️ ตรงนี้คือจุดที่ทำให้เกิด Error "ไม่พบออเดอร์"
        if (!orderDoc.exists()) throw new Error("ไม่พบข้อมูลคำสั่งซื้อในระบบ (ออเดอร์อาจถูกลบไปแล้ว)");
        
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
  },

  // 📥 4. อนุมัติราคาส่ง 
  approveWholesaleRequest: async (taskId, orderId, newTotals, currentUser) => {
    try {
      return await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, 'todos', taskId);
        const orderRef = doc(db, 'orders', orderId);
        const logRef = doc(collection(db, 'system_logs'));

        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("ไม่พบออเดอร์ในระบบ (ข้อมูลอาจไม่สมบูรณ์)");
        
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
            const historyRef = doc(collection(db, `users/${userId}/historyLogs`));
            transaction.set(historyRef, {
                orderId, action: "WHOLESALE_APPROVED",
                title: "คำขอราคาส่งได้รับการอนุมัติ!",
                description: `ออเดอร์ #${orderId.slice(-6)} อัปเดตราคาใหม่แล้ว`,
                amount: newTotals.netTotal,
                createdAt: serverTimestamp()
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
             // 🛡️ จุดสำคัญ: ถ้าไม่มี Order ให้โยน Error เฉพาะทางเพื่อให้ UI จับได้
             if (!orderDoc.exists()) throw new Error("ไม่พบข้อมูลออเดอร์ที่เกี่ยวข้อง (Orphaned Task)");
             
             const userId = orderDoc.data().userId;
             
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
  },

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
      await updateDoc(taskRef, { status: 'rejected', rejectReason: reason, completedAt: serverTimestamp() });
  },

  createManualTask: async (taskForm, user) => {
      await addDoc(collection(db, 'todos'), {
          ...taskForm,
          status: 'todo',
          createdAt: serverTimestamp(),
          createdBy: user?.uid || 'Admin'
      });
  }
};