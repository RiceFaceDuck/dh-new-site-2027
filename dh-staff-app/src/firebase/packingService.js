import { collection, query, where, doc, writeBatch, serverTimestamp, onSnapshot, limit } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils.js';

export const packingService = {
  /**
   * Subscribe to packing tasks that are not yet completed
   * @param {function} callback - Function to handle the updated data
   * @param {function} errorCallback - Function to handle errors
   * @returns {function} Unsubscribe function
   */
  subscribeToActiveTasks: (callback, errorCallback) => {
    const q = query(
      collection(db, getCollectionPath('todos')),
      where('type', '==', 'PACKING_TASK'),
      where('status', 'in', ['todo', 'in_progress', 'pending']),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // เรียงลำดับจากเก่าไปใหม่ (ใครจ่ายเงินก่อน ควรได้แพ็คของก่อน)
      fetchedTasks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeA - timeB; 
      });

      callback(fetchedTasks);
    }, (error) => {
      console.error("Error fetching packing tasks:", error);
      if (errorCallback) errorCallback(error);
    });
  },

  /**
   * Start packing a task
   * @param {string} taskId - The ID of the task
   */
  startPacking: async (taskId) => {
    try {
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      const batch = writeBatch(db);
      
      batch.update(taskRef, { 
        status: 'in_progress', 
        updatedAt: serverTimestamp() 
      });
      
      await batch.commit();
    } catch (error) {
      console.error("🔥 Error starting packing task:", error);
      throw error;
    }
  },

  /**
   * Complete a packing task and update order status
   * @param {string} taskId - The ID of the task
   * @param {string} orderId - The ID of the related order
   * @param {string} trackingNumber - The tracking number
   */
  completePacking: async (taskId, orderId, trackingNumber) => {
    try {
      const batch = writeBatch(db);
      
      // 1. ปิดคิวงานใน To-do
      const taskRef = doc(db, getCollectionPath('todos'), taskId);
      batch.update(taskRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        trackingNumber: trackingNumber
      });

      // 2. อัปเดตสถานะออเดอร์ให้ลูกค้าเห็นว่าจัดส่งแล้ว
      if (orderId) {
        const orderRef = doc(db, getCollectionPath('orders'), orderId);
        batch.update(orderRef, {
          status: 'shipped',
          trackingNumber: trackingNumber,
          shippedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error("🔥 Error completing packing task:", error);
      throw error;
    }
  }
};
