import { db } from '../config';
import { doc, getDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, collection, writeBatch, arrayUnion, runTransaction } from 'firebase/firestore';
import { MANAGER_TASK_TYPES } from '../managerTodoService';
import { gasHistoryService } from '../gasHistoryService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { orderSyncService } from '../orderSyncService';

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
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(taskRef);
        if (!snap.exists()) throw new Error("ไม่พบรายการนี้");
        if (snap.data().status !== 'todo' && snap.data().status !== 'pending') throw new Error("รายการนี้ไม่ได้อยู่ในสถานะรอเริ่มต้น");
        transaction.update(taskRef, { status: 'in_progress', updatedAt: serverTimestamp() });
      });
  },

  completeTask: async (taskId) => {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(taskRef);
        if (!snap.exists()) throw new Error("ไม่พบรายการนี้");
        if (snap.data().status === 'completed' || snap.data().status === 'rejected') throw new Error("รายการนี้ถูกจัดการไปแล้ว");
        transaction.update(taskRef, { status: 'completed', completedAt: serverTimestamp() });
      });
  },

  rejectTask: async (taskId, reason = '') => {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(taskRef);
        if (!snap.exists()) throw new Error("ไม่พบรายการนี้");
        if (snap.data().status === 'completed' || snap.data().status === 'rejected') throw new Error("รายการนี้ถูกจัดการไปแล้ว");
        transaction.update(taskRef, { status: 'rejected', rejectReason: reason, completedAt: serverTimestamp() });
      });
  },

  acknowledgePromotionAlert: async (taskId, user) => {
    if (!user || !user.uid) throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
    const taskRef = doc(db, getCollectionPath('todos'), taskId);
    await updateDoc(taskRef, {
      [`acknowledgedBy.${user.uid}`]: {
        uid: user.uid,
        name: user.displayName || user.email || 'Staff',
        at: new Date().toISOString()
      },
      acknowledgedUsers: arrayUnion(user.uid),
      updatedAt: serverTimestamp()
    });
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

  requestCustomerTaxInfo: async (task, reason, currentUser, orderData) => {
    try {
      const batch = writeBatch(db);
      const targetOrderId = orderData?.id || orderData?.orderId || task.orderId || task.payload?.orderId;
      
      if (targetOrderId) {
        const orderRef = doc(db, getCollectionPath('orders'), targetOrderId);
        batch.set(orderRef, {
          taxInvoiceStatus: 'need_customer_info',
          taxInvoiceNeedInfo: true,
          taxInvoiceRequestReason: reason || 'ข้อมูลใบกำกับภาษีไม่ครบถ้วนหรือไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง',
          taxInvoiceRequestedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        const draftId = orderData?.draftOrderId || orderData?.originalDraftId || (task.orderId !== targetOrderId ? task.orderId : null);
        if (draftId && draftId !== targetOrderId) {
          const draftRef = doc(db, getCollectionPath('orders'), draftId);
          batch.set(draftRef, {
            taxInvoiceStatus: 'need_customer_info',
            taxInvoiceNeedInfo: true,
            taxInvoiceRequestReason: reason || 'ข้อมูลใบกำกับภาษีไม่ครบถ้วนหรือไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง',
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      if (task.id) {
        const taskRef = doc(db, getCollectionPath('todos'), task.id);
        batch.update(taskRef, {
          status: 'in_progress',
          taxInvoiceStatus: 'need_customer_info',
          customerNote: reason || '',
          staffUid: currentUser?.uid || 'Staff',
          staffNickname: currentUser?.displayName || 'พนักงาน',
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      try {
        await orderSyncService.syncRecentOrders();
      } catch (syncErr) {
        console.warn('Catalog sync warning:', syncErr);
      }

      return { success: true };
    } catch (error) {
      console.error('🔥 Error requesting customer tax info:', error);
      throw error;
    }
  },

  completeTaxInvoiceTask: async (task, fileUrl, currentUser, orderData) => {
    try {
      const batch = writeBatch(db);
      const rawOrderId = orderData?.id || orderData?.orderId || task.orderId || task.payload?.orderId;
      
      if (rawOrderId) {
        const orderRef = doc(db, getCollectionPath('orders'), rawOrderId);
        batch.set(orderRef, {
          taxInvoiceUrl: fileUrl,
          taxInvoiceStatus: 'issued',
          taxInvoiceNeedInfo: false,
          updatedAt: serverTimestamp()
        }, { merge: true });

        const altOrderId = orderData?.draftOrderId || orderData?.originalDraftId || (task.orderId !== rawOrderId ? task.orderId : null) || (orderData?.supersededBy);
        if (altOrderId && altOrderId !== rawOrderId) {
          const altRef = doc(db, getCollectionPath('orders'), altOrderId);
          batch.set(altRef, {
            taxInvoiceUrl: fileUrl,
            taxInvoiceStatus: 'issued',
            taxInvoiceNeedInfo: false,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      const taskRef = doc(db, getCollectionPath('todos'), task.id);
      batch.update(taskRef, {
        status: 'completed',
        taxInvoiceStatus: 'issued',
        taxInvoiceUrl: fileUrl,
        completedAt: serverTimestamp(),
        actionBy: currentUser?.uid || 'Admin'
      });

      const logRef = doc(collection(db, getCollectionPath('system_logs')));
      batch.set(logRef, {
          actionType: 'TAX_INVOICE_ISSUED',
          orderId: rawOrderId,
          taskId: task.id,
          details: 'ออกใบกำกับภาษีและอัปโหลดไฟล์สำเร็จ',
          createdBy: currentUser?.uid || 'System',
          createdAt: serverTimestamp()
      });

      if (task.userId) {
          gasHistoryService.log({
            module: 'Customer History',
            action: 'TAX_INVOICE_ISSUED',
            target: { id: rawOrderId },
            details: { legacy_details: 'ใบกำกับภาษีพร้อมดาวน์โหลด เจ้าหน้าที่ได้อัปโหลดใบกำกับภาษีเรียบร้อยแล้ว' },
            actorOverride: { uid: task.userId, name: 'System (For Customer)', email: 'N/A' }
          });
      }

      await batch.commit();

      try {
        await orderSyncService.syncRecentOrders();
      } catch (syncErr) {
        console.warn('Catalog sync warning:', syncErr);
      }

      return { success: true };
    } catch (error) {
      console.error('🔥 Error completing tax invoice:', error);
      throw error;
    }
  }
};
