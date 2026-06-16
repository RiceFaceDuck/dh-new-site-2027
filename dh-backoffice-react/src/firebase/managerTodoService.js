/* eslint-disable */
import { db } from './config';
import { 
  collection, query, where, doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot 
} from 'firebase/firestore';

// ----------------------------------------------------------------------
// 🏷️ ประกาศตัวแปรกลุ่มงานของ "ผู้จัดการ" (Manager Task Types)
// ดึงแยกออกมาจาก todoService เพื่อลดภาระและจัดระเบียบ Clean Architecture
// ----------------------------------------------------------------------
export const MANAGER_TASK_TYPES = [
  'WHOLESALE_APPROVAL',
  'wholesale_request',
  'CLAIM_APPROVAL',
  'RETURN_APPROVAL',
  'CANCEL_CLAIM_APPROVAL',
  'CANCEL_RETURN_APPROVAL',
  'AD_APPROVAL',         // งานตรวจสอบ/อนุมัติ ฝากโฆษณาสินค้า
  'USER_SKU_APPROVAL',   // งานตรวจสอบ/อนุมัติ ฝากโฆษณาสินค้า (Legacy)
  'BILLBOARD_APPROVAL',  // งานตรวจสอบ/อนุมัติ ฝากแผ่นป้ายโฆษณา
  'PARTNER_APPROVAL',    // งานตรวจสอบ/อนุมัติ Partner รับการสนับสนุน
  'ACCOUNT_APPROVAL',    // งานตรวจสอบ Account สมัครใหม่
  'WALLET_WITHDRAWAL',   // งานตรวจสอบ/อนุมัติ โอนเงินค้างระบบคืนให้ลูกค้า
  'STAFF_APPROVAL',      // งานตรวจสอบ/อนุมัติ พนักงานใหม่เข้าทำงาน
  'PRODUCT_DELETE_APPROVAL', // ขออนุมัติการลบสินค้า
  'BILL_CANCEL_APPROVAL',    // ขออนุมัติการยกเลิกบิล
  'PRODUCT_KNOWLEDGE_APPROVAL' // ขออนุมัติเพิ่มข้อมูลรุ่น/พาร์ทที่รองรับ
];

export const managerTodoService = {
  // ----------------------------------------------------------------------
  // 📡 1. ดึงข้อมูลงานของผู้จัดการแบบ Real-time (แยกจากงานทั่วไป)
  // ----------------------------------------------------------------------
  subscribeManagerApprovals: (callback) => {
    // ดึงงานที่ยังไม่เสร็จ (todo หรือ pending) จาก Collection หลัก
    const todosRef = collection(db, 'todos');
    const q = query(
      todosRef,
      where('status', 'in', ['todo', 'pending'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 🚀 THE FIX: คัดกรองเฉพาะงานของผู้จัดการในระดับ Client 
      // (เพื่อหลีกเลี่ยงข้อจำกัด 'in' Query ที่รับได้แค่ 10 เงื่อนไขของ Firestore)
      const managerTodos = allTodos.filter(todo => {
        const typeToCheck = todo.type || todo.taskType;
        return MANAGER_TASK_TYPES.includes(typeToCheck);
      });

      callback(managerTodos);
    }, (error) => {
      console.error("🔥 Error subscribing to manager tasks:", error);
      callback([], error);
    });

    return unsubscribe;
  },

  // ----------------------------------------------------------------------
  // 📝 2. อัปเดตสถานะงาน / ยกเลิกงาน (แก้บั๊คที่นี่)
  // ----------------------------------------------------------------------
  updateTaskStatus: async (taskId, newStatus, payload = {}) => {
    try {
      if (!taskId) throw new Error("ไม่พบรหัสงาน (Task ID)");
      
      // Clean payload: remove any undefined values to prevent FirebaseError
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );
      
      const taskRef = doc(db, 'todos', taskId);
      await updateDoc(taskRef, { 
        ...cleanPayload, 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      });
      return true;
    } catch (error) {
      console.error(`🔥 Error updating task [${taskId}]:`, error);
      throw error; // ส่ง Error ให้ Component UI รับไปแสดงผลได้
    }
  },

  // ----------------------------------------------------------------------
  // 🗑️ 3. ลบงานของผู้จัดการ (แก้บั๊คที่นี่)
  // ----------------------------------------------------------------------
  deleteManagerTask: async (taskId) => {
    try {
      if (!taskId) throw new Error("ไม่พบรหัสงาน (Task ID) ที่ต้องการลบ");

      const taskRef = doc(db, 'todos', taskId);
      await deleteDoc(taskRef);
      return true;
    } catch (error) {
      console.error(`🔥 Error deleting task [${taskId}]:`, error);
      throw error;
    }
  }
};