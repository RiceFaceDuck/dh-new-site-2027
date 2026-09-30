import { db } from './config';
import { 
  collection, query, where, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, limit, orderBy
} from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// ----------------------------------------------------------------------
// 🏷️ ประกาศตัวแปรกลุ่มงานของ "ผู้จัดการ" (Manager Task Types)
// ดึงแยกออกมาจาก todoService เพื่อลดภาระและจัดระเบียบ Clean Architecture
// ----------------------------------------------------------------------
export const MANAGER_TASK_TYPES = [
  'WHOLESALE_APPROVAL',
  'wholesale_request',
  'CLAIM_APPROVAL',
  'RETURN_APPROVAL',
  'EXCHANGE_APPROVAL',
  'CANCEL_CLAIM_APPROVAL',
  'CANCEL_RETURN_APPROVAL',
  'CANCEL_EXCHANGE_APPROVAL',
  'AD_APPROVAL',         // งานตรวจสอบ/อนุมัติ ฝากโฆษณาสินค้า
  'USER_SKU_APPROVAL',   // งานตรวจสอบ/อนุมัติ ฝากโฆษณาสินค้า (Legacy)
  'BILLBOARD_APPROVAL',  // งานตรวจสอบ/อนุมัติ ฝากแผ่นป้ายโฆษณา
  'APPROVE_PARTNER_AD',  // งานตรวจสอบ/อนุมัติ โฆษณาพาร์ทเนอร์
  'APPROVE_BILLBOARD_AD',// งานตรวจสอบ/อนุมัติ แผ่นป้ายโฆษณา
  'BUSINESS_CARD_AD_APPROVAL', // งานตรวจสอบ/อนุมัติ นามบัตรพาร์ทเนอร์
  'PARTNER_APPROVAL',    // งานตรวจสอบ/อนุมัติ Partner รับการสนับสนุน
  'ACCOUNT_APPROVAL',    // งานตรวจสอบ Account สมัครใหม่
  'WALLET_WITHDRAWAL',   // งานตรวจสอบ/อนุมัติ โอนเงินค้างระบบคืนให้ลูกค้า
  'STAFF_APPROVAL',      // งานตรวจสอบ/อนุมัติ พนักงานใหม่เข้าทำงาน
  'PRODUCT_DELETE_APPROVAL', // ขออนุมัติการลบสินค้า
  'CUSTOMER_DELETE_APPROVAL', // ขออนุมัติการลบลูกค้า
  'BILL_CANCEL_APPROVAL',    // ขออนุมัติการยกเลิกบิล
  'PRODUCT_KNOWLEDGE_APPROVAL', // ขออนุมัติเพิ่มข้อมูลรุ่น/พาร์ทที่รองรับ
  'WARRANTY_SETUP'           // งานตั้งค่าระยะเวลารับประกันสำหรับหมวดสินค้าใหม่
];

// ----------------------------------------------------------------------
// 🏷️ กลุ่มงาน Claim/Return/Exchange (Single Source of Truth: 'claims' collection)
// ----------------------------------------------------------------------
export const CLAIM_TASK_TYPES = [
  'CLAIM_APPROVAL',
  'RETURN_APPROVAL',
  'EXCHANGE_APPROVAL',
  'CANCEL_CLAIM_APPROVAL',
  'CANCEL_RETURN_APPROVAL',
  'CANCEL_EXCHANGE_APPROVAL'
];

export const managerTodoService = {
  // ----------------------------------------------------------------------
  // 📡 1. ดึงข้อมูลงานของผู้จัดการแบบ Real-time (ผสาน 'todos' และ 'claims')
  // ----------------------------------------------------------------------
  subscribeManagerApprovals: (callback) => {
    // 1. ดึงงานทั่วไปที่ไม่ใช่ Claim จาก 'todos'
    const todosRef = collection(db, getCollectionPath('todos'));
    const qTodos = query(
      todosRef,
      where('status', 'in', ['todo', 'pending', 'pending_manager', 'waiting_item', 'processing']),
      orderBy('createdAt', 'desc'),
      limit(2000)
    );

    // 2. ดึงงาน Claim/Return/Exchange/Cancel จาก 'claims' (Single Source of Truth)
    const claimsRef = collection(db, getCollectionPath('claims'));
    const qClaims = query(
      claimsRef,
      where('status', 'in', ['pending_manager', 'waiting_item', 'processing']),
      orderBy('createdAt', 'desc'),
      limit(500)
    );

    let currentTodos = [];
    let currentClaims = [];

    const getDocTime = (docItem) => {
      if (!docItem?.createdAt) return 0;
      if (typeof docItem.createdAt.toMillis === 'function') return docItem.createdAt.toMillis();
      if (typeof docItem.createdAt.toDate === 'function') return docItem.createdAt.toDate().getTime();
      if (docItem.createdAt instanceof Date) return docItem.createdAt.getTime();
      return new Date(docItem.createdAt).getTime() || 0;
    };

    const emitMerged = () => {
      // Deduplicate by doc ID: authoritative 'claims' records take precedence over shadow 'todos'
      const taskMap = new Map();

      // Filter todos for non-claim manager task types
      currentTodos.forEach(todo => {
        const typeToCheck = todo.type || todo.taskType;
        if (MANAGER_TASK_TYPES.includes(typeToCheck) && !CLAIM_TASK_TYPES.includes(typeToCheck)) {
          taskMap.set(todo.id, todo);
        }
      });

      // Add claim tasks from 'claims' collection
      currentClaims.forEach(claim => {
        const typeToCheck = claim.type || claim.taskType;
        if (!typeToCheck || CLAIM_TASK_TYPES.includes(typeToCheck)) {
          taskMap.set(claim.id, claim);
        }
      });

      const merged = Array.from(taskMap.values());
      merged.sort((a, b) => getDocTime(b) - getDocTime(a));
      callback(merged);
    };

    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      currentTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      emitMerged();
    }, (error) => {
      console.error("🔥 Error subscribing to manager todos:", error);
      callback([], error);
    });

    const unsubscribeClaims = onSnapshot(qClaims, (snapshot) => {
      currentClaims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      emitMerged();
    }, (error) => {
      console.error("🔥 Error subscribing to manager claims:", error);
      callback([], error);
    });

    return () => {
      if (typeof unsubscribeTodos === 'function') unsubscribeTodos();
      if (typeof unsubscribeClaims === 'function') unsubscribeClaims();
    };
  },

  // ----------------------------------------------------------------------
  // 📝 2. อัปเดตสถานะงาน / ยกเลิกงาน
  // ตรวจสอบว่าเป็น Claim task หรืออยู่ใน 'claims' collection หรือไม่
  // ----------------------------------------------------------------------
  updateTaskStatus: async (taskId, newStatus, payload = {}, taskType = null) => {
    try {
      if (!taskId) throw new Error("ไม่พบรหัสงาน (Task ID)");
      
      // Clean payload: remove any undefined values to prevent FirebaseError
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined)
      );

      const typeToCheck = taskType || payload.type || payload.taskType;
      const isClaimTask = typeToCheck && CLAIM_TASK_TYPES.includes(typeToCheck);

      // ตรวจสอบว่ามีเอกสารอยู่ใน 'claims' หรือไม่
      let existsInClaims = false;
      const claimRef = doc(db, getCollectionPath('claims'), taskId);
      if (isClaimTask) {
        existsInClaims = true;
      } else {
        try {
          const claimSnap = await getDoc(claimRef);
          existsInClaims = claimSnap.exists();
        } catch (_) {}
      }

      if (existsInClaims) {
        await updateDoc(claimRef, { 
          ...cleanPayload, 
          status: newStatus, 
          updatedAt: serverTimestamp() 
        });

        // ซิงก์เงาใน 'todos' ด้วยหากมีเอกสารเดิมหลงเหลืออยู่
        try {
          const todoRef = doc(db, getCollectionPath('todos'), taskId);
          const todoSnap = await getDoc(todoRef);
          if (todoSnap.exists()) {
            await updateDoc(todoRef, {
              ...cleanPayload,
              status: newStatus,
              updatedAt: serverTimestamp()
            });
          }
        } catch (_) {}
        return true;
      }

      // กรณีงานทั่วไป อัปเดตใน 'todos'
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      await updateDoc(taskRef, { 
        ...cleanPayload, 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      });
      return true;
    } catch (error) {
      console.error(`🔥 Error updating task [${taskId}]:`, error);
      throw error;
    }
  },

  // ----------------------------------------------------------------------
  // 🗑️ 3. ลบงานของผู้จัดการ
  // ----------------------------------------------------------------------
  deleteManagerTask: async (taskId) => {
    try {
      if (!taskId) throw new Error("ไม่พบรหัสงาน (Task ID) ที่ต้องการลบ");

      // ลบจาก 'claims' หากมีอยู่
      try {
        const claimRef = doc(db, getCollectionPath('claims'), taskId);
        const claimSnap = await getDoc(claimRef);
        if (claimSnap.exists()) {
          await deleteDoc(claimRef);
        }
      } catch (_) {}

      // ลบจาก 'todos'
      try {
        const taskRef = doc(db, getCollectionPath('todos'), taskId);
        await deleteDoc(taskRef);
      } catch (_) {}

      return true;
    } catch (error) {
      console.error(`🔥 Error deleting task [${taskId}]:`, error);
      throw error;
    }
  }
};