import { db } from './config';
import { 
  collection, query, where, orderBy, limit, getDocs, doc, updateDoc, 
  addDoc, serverTimestamp, onSnapshot, runTransaction, getCountFromServer 
} from 'firebase/firestore';

export const todoService = {

  // 📥 1. ระบบ Subscribe งาน (อัปเกรด: ประหยัด Reads โดยกรองจาก Server)
  subscribePendingTodos: (callback, onError) => {
    // 🚀 ฉลาดขึ้น: สั่ง Firebase ส่งมาเฉพาะงานที่ยังไม่เสร็จ (ไม่ต้องดึงงานที่เสร็จแล้วมาให้เปลือง Reads)
    const q = query(
      collection(db, 'todos'),
      where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager'])
    );
    
    return onSnapshot(q, (snapshot) => {
      const pendingTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
            // จัดเรียงฝั่ง Client เพื่อป้องกัน Error Index ใน Firebase
            const timeA = a.createdAt?.toMillis() || a.requestedAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || b.requestedAt?.toMillis() || 0;
            return timeB - timeA; // ใหม่ล่าสุดขึ้นก่อน
        });

      callback(pendingTodos);
    }, (error) => {
      console.error("🔥 Todo Subscribe Error:", error);
      if (onError) onError(error);
    });
  },

  // 📥 2. ระบบ Subscribe ของผู้จัดการ (อัปเกรด: กรองเฉพาะสถานะรอดำเนินการ)
  subscribeManagerApprovals: (callback, onError) => {
    const q = query(
      collection(db, 'todos'),
      where('status', 'in', ['todo', 'pending', 'pending_manager'])
    );

    return onSnapshot(q, (snapshot) => {
      // ดึงมาแล้วค่อยมากรอง Type บนเบราว์เซอร์ (ข้อจำกัด Firebase ใช้ 'in' ได้ฟิลด์เดียว)
      const managerTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(t => ['WHOLESALE_APPROVAL', 'PAYMENT_VERIFICATION', 'STAFF_APPROVAL', 'KNOWLEDGE_UPDATE_APPROVAL'].includes(t.type))
        .sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || a.requestedAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || b.requestedAt?.toMillis() || 0;
            return timeB - timeA;
        });

      callback(managerTodos);
    }, (error) => {
      console.error("🔥 Manager Subscribe Error:", error);
      if (onError) onError(error);
    });
  },

  // ✨ ลูกเล่นใหม่: ดึงตัวเลขแจ้งเตือน (Badge) โดยไม่เสียโควต้า Reads ของ Document
  getPendingBadgeCount: async () => {
    try {
      const q = query(
        collection(db, 'todos'), 
        where('status', 'in', ['todo', 'pending_manager'])
      );
      // getCountFromServer จะให้เซิร์ฟเวอร์นับให้ โดยเสียโควต้าแค่นิดเดียว (1 Read ต่อการนับ 1000 รายการ)
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error("🔥 Error getting badge count:", error);
      return 0;
    }
  },

  // 📦 3. จัดการสถานะงานทั่วไป
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

  // 📝 4. สร้างงานใหม่แบบ Manual
  createManualTask: async (taskData) => {
    try {
      const docRef = await addDoc(collection(db, 'todos'), {
        ...taskData,
        type: 'MANUAL_TASK',
        status: 'todo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("🔥 Error creating task:", error);
      throw error;
    }
  },

  // 🔍 5. ประวัติงานที่ทำเสร็จแล้ว
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

  // 💰 6. Transaction: อนุมัติราคาส่ง (รับประกันข้อมูลไม่ทับซ้อน)
  approveWholesaleRequest: async (taskId, productsToUpdate) => {
    const taskRef = doc(db, 'todos', taskId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const taskDoc = await transaction.get(taskRef);
        if (!taskDoc.exists()) throw new Error("ไม่พบรายการคำขอนี้");
        if (taskDoc.data().status === 'completed') throw new Error("รายการนี้ถูกอนุมัติไปแล้ว");

        // 1. อัปเดตราคาสินค้า (จำลอง - ต้องส่ง Ref ของ Products มาด้วยถ้าระบบจริง)
        for (const item of productsToUpdate) {
            const productRef = doc(db, 'products', item.productId);
            transaction.update(productRef, {
                wholesalePrice: item.newWholesalePrice,
                wholesaleQty: item.newWholesaleQty,
                updatedAt: serverTimestamp()
            });
        }

        // 2. ปิดงาน
        transaction.update(taskRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            approvedProducts: productsToUpdate
        });
      });
      return { success: true };
    } catch (error) {
      console.error("🔥 Transaction Error (Wholesale):", error);
      throw error;
    }
  },

  // 🧾 7. Transaction: ยืนยันสลิปโอนเงิน (รับประกันข้อมูลไม่ทับซ้อน)
  verifyPaymentSlip: async (taskId, orderId) => {
    const taskRef = doc(db, 'todos', taskId);
    const orderRef = doc(db, 'orders', orderId); // สมมติว่าเก็บออเดอร์ไว้ที่ collection 'orders'

    try {
      await runTransaction(db, async (transaction) => {
        const taskDoc = await transaction.get(taskRef);
        if (!taskDoc.exists()) throw new Error("ไม่พบรายการตรวจสอบยอดเงิน");
        if (taskDoc.data().status === 'completed') throw new Error("สลิปนี้ถูกตรวจสอบไปแล้ว");

        // 1. อัปเดตสถานะออเดอร์ให้เป็น "จ่ายเงินแล้ว/รอดำเนินการ"
        transaction.update(orderRef, {
            paymentStatus: 'VERIFIED',
            status: 'PROCESSING',
            updatedAt: serverTimestamp()
        });

        // 2. ปิดงานตรวจสอบสลิป
        transaction.update(taskRef, {
            status: 'completed',
            completedAt: serverTimestamp()
        });
      });
      return { success: true };
    } catch (error) {
      console.error("🔥 Transaction Error (Payment):", error);
      throw error;
    }
  }

};