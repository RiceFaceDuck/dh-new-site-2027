import { collection, addDoc, getDocs, query, orderBy, limit, startAfter, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from './config.js';

const COLLECTION_NAME = 'history_logs';

export const historyService = {
  // ✨ บันทึก Audit Log (ปรับให้เก็บชื่อและอีเมล ลงไปเลย ไม่ต้องไปดึงตาราง User ใหม่ตอนแสดงผล)
  addLog: async (arg1, arg2, arg3, arg4, arg5) => {
    try {
      const currentUser = auth.currentUser;
      const actorUid = currentUser?.uid || 'System';
      const actorName = currentUser?.displayName || 'Unknown User';
      const actorEmail = currentUser?.email || '';

      let logData = { timestamp: serverTimestamp() };

      if (arg4 !== undefined) {
        logData = {
          ...logData,
          module: arg1,
          action: arg2,
          targetId: arg3,
          details: arg4,
          actionBy: arg5 || actorUid,
          performedBy: arg5 || actorUid,
          actorName: actorName,
          actorEmail: actorEmail // บันทึกอีเมลลง DB
        };
      } else {
        logData = {
          ...logData,
          action: arg1,
          details: arg2,
          actionBy: arg3 || actorUid,
          module: 'System',
          targetId: arg2?.sku || arg2?.todoId || '-',
          performedBy: arg3 || actorUid,
          actorName: actorName,
          actorEmail: actorEmail // บันทึกอีเมลลง DB
        };
      }

      await addDoc(collection(db, COLLECTION_NAME), logData);
    } catch (error) {
      console.error("🔥 Error adding history log: ", error);
    }
  },

  // ✨ ดึงประวัติมาแสดงผลแบบ Pagination (รองรับ Server-side Filtering)
  getRecentLogs: async (maxLimit = 50, lastDocRef = null, moduleFilter = 'all', actionFilter = 'all') => {
    try {
      let constraints = [];
      
      if (moduleFilter !== 'all') {
        constraints.push(where('module', '==', moduleFilter));
      }
      
      if (actionFilter !== 'all') {
        constraints.push(where('action', '==', actionFilter));
      }
      
      constraints.push(orderBy('timestamp', 'desc'));
      
      if (lastDocRef) {
        constraints.push(startAfter(lastDocRef));
      }
      
      constraints.push(limit(maxLimit));

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      return { logs, lastDoc };
    } catch (error) {
      console.error("🔥 Error fetching history:", error);
      return { logs: [], lastDoc: null };
    }
  }
};