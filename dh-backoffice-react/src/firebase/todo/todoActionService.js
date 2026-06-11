import { db } from '../config';
import { doc, updateDoc, deleteDoc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { MANAGER_TASK_TYPES } from '../managerTodoService';

export const todoActionService = {
  // 🗑️ ลบงานที่ค้าง/กำพร้า
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
      // 🚀 [อัปเกรด-ความปลอดภัย] สกัดกั้นการสร้างงานของผู้จัดการผ่าน Manual Form ทั่วไป
      const typeToCheck = taskForm.type || taskForm.taskType;
      
      if (!typeToCheck) {
          throw new Error("ข้อมูลไม่สมบูรณ์: กรุณาระบุประเภทของงานให้ชัดเจน");
      }
      
      if (MANAGER_TASK_TYPES.includes(typeToCheck)) {
          console.error(`🚨 Security Alert: ตรวจพบความพยายามสร้างงานสงวนสิทธิ์ (${typeToCheck})`);
          throw new Error(`ไม่อนุญาตให้สร้างงานประเภท "${typeToCheck}" โดยพลการ โปรดใช้ระบบคำร้องเฉพาะของงานนั้นๆ ครับ`);
      }

      await addDoc(collection(db, 'todos'), {
          ...taskForm,
          status: 'todo',
          createdAt: serverTimestamp(),
          createdBy: user?.uid || 'Admin'
      });
  }
};
