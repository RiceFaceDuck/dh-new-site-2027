import { db } from '../config';
import { doc, updateDoc, deleteDoc, addDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { MANAGER_TASK_TYPES } from '../managerTodoService';
import { gasHistoryService } from '../gasHistoryService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const todoActionService = {
  // 🗑️ ลบงานที่ค้าง/กำพร้า
  deleteTask: async (taskId) => {
    try {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      await deleteDoc(taskRef);
      return { success: true };
    } catch (error) {
      console.error("🔥 Error deleting ghost task:", error);
      throw error;
    }
  },

  startTask: async (taskId) => {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      await updateDoc(taskRef, { status: 'in_progress', updatedAt: serverTimestamp() });
  },

  completeTask: async (taskId) => {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      await updateDoc(taskRef, { status: 'completed', completedAt: serverTimestamp() });
  },

  rejectTask: async (taskId, reason = '') => {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
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

      await addDoc(collection(db, getCollectionPath('todos')), {
          ...taskForm,
          status: 'todo',
          createdAt: serverTimestamp(),
          createdBy: user?.uid || 'Admin'
      });
  },

  updateTodoTrackingNo: async (taskId, trackingNo) => {
    try {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      await updateDoc(taskRef, {
        'payload.trackingNo': trackingNo
      });
      return { success: true };
    } catch (err) {
      console.error("🔥 Error updating tracking no:", err);
      throw err;
    }
  },

  completeTaxInvoiceTask: async (task, fileUrl, currentUser) => {
    try {
      const batch = writeBatch(db);
      
      const orderRef = doc(db, getCollectionPath('orders'), task.payload.orderId);
      batch.update(orderRef, {
        taxInvoiceUrl: fileUrl,
        taxInvoiceStatus: 'issued',
        updatedAt: serverTimestamp()
      });

      const taskRef = doc(db, getCollectionPath('todos'), task.id);
      batch.update(taskRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        actionBy: currentUser?.uid || 'Admin'
      });

      const logRef = doc(collection(db, 'system_logs'));
      batch.set(logRef, {
          actionType: 'TAX_INVOICE_ISSUED',
          orderId: task.payload.orderId,
          taskId: task.id,
          details: `ออกใบกำกับภาษีและอัปโหลดไฟล์สำเร็จ`,
          createdBy: currentUser?.uid || 'System',
          createdAt: serverTimestamp()
      });

      if (task.userId) {
          gasHistoryService.log({
            module: 'Customer History',
            action: 'TAX_INVOICE_ISSUED',
            target: { id: task.payload.orderId },
            details: { legacy_details: `ใบกำกับภาษีพร้อมดาวน์โหลด เจ้าหน้าที่ได้อัปโหลดใบกำกับภาษีสำหรับออเดอร์ #${task.payload.orderId.slice(-6).toUpperCase()} เรียบร้อยแล้ว` },
            actorOverride: { uid: task.userId, name: 'System (For Customer)', email: 'N/A' }
          });
      }

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("🔥 Error completing tax invoice:", error);
      throw error;
    }
  }
};
