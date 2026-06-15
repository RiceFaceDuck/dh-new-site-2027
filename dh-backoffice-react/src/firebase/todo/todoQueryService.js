import { db } from '../config';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { MANAGER_TASK_TYPES } from '../managerTodoService';

export const todoQueryService = {
  // 📥 1. ระบบ Subscribe งาน "ส่วนกลาง" (ประหยัด Reads กรองจาก Server)
  subscribePendingTodos: (callback, onError) => {
    try {
      const q = query(
        collection(db, 'todos'),
        where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager'])
      );
      
      return onSnapshot(q, (snapshot) => {
        const pendingTodos = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          // 🚀 [อัปเกรด-ความปลอดภัย] คัดกรองงานขยะ และกรองงานของผู้จัดการออกไป เพื่อให้กระดานส่วนกลางสะอาด
          .filter(t => {
              const currentType = t.type || t.taskType;
              if (!currentType) return false; // สกัดกั้น: งานที่ไม่มี Type (งานขยะ)
              return !MANAGER_TASK_TYPES.includes(currentType);
          })
          .sort((a, b) => {
              const timeA = a.createdAt?.toMillis() || a.requestedAt?.toMillis() || 0;
              const timeB = b.createdAt?.toMillis() || b.requestedAt?.toMillis() || 0;
              return timeB - timeA;
          });
        callback(pendingTodos);
      }, (error) => {
        console.error("🔥 Snapshot Error (Pending Todos):", error);
        if (onError) onError(new Error("เกิดปัญหาการเชื่อมต่อ ดึงรายการงานส่วนกลางไม่สำเร็จ"));
      });
    } catch (err) {
      console.error("🔥 Query Setup Error (Pending Todos):", err);
      if (onError) onError(new Error("การตั้งค่าดึงข้อมูลผิดพลาด"));
      return () => {}; // คืนค่าฟังก์ชันว่างเพื่อไม่ให้เกิด Error
    }
  },

  getCompletedTodos: async (limitCount = 50, dateRange = null) => {
      let qArgs = [
          collection(db, 'todos'),
          where('status', 'in', ['completed', 'rejected', 'cancelled'])
      ];

      if (dateRange?.start) {
          const start = new Date(dateRange.start); 
          start.setHours(0, 0, 0, 0);
          qArgs.push(where('completedAt', '>=', start));
      }
      if (dateRange?.end) {
          const end = new Date(dateRange.end); 
          end.setHours(23, 59, 59, 999);
          qArgs.push(where('completedAt', '<=', end));
      }

      qArgs.push(orderBy('completedAt', 'desc'));
      qArgs.push(limit(limitCount));

      const q = query(...qArgs);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
