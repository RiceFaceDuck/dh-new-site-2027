import { collection, addDoc, getDocs, query, orderBy, limit, startAfter, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from './config.js';
import { gasHistoryService } from './gasHistoryService.js';

const COLLECTION_NAME = 'history_logs';

export const historyService = {
  // ✨ บันทึก Audit Log (Forwarded to GAS)
  addLog: async (arg1, arg2, arg3, arg4, arg5) => {
    let module = 'System';
    let action = '';
    let targetId = '-';
    let detailsStr = '';
    
    // Mapping legacy arguments to new structure
    if (arg4 !== undefined) {
      module = arg1;
      action = arg2;
      targetId = arg3;
      detailsStr = arg4;
    } else {
      action = arg1;
      detailsStr = arg2;
      targetId = arg2?.sku || arg2?.todoId || '-';
    }

    gasHistoryService.log({
      level: 'INFO',
      module: module,
      action: action,
      target: { id: targetId },
      details: { legacy_details: detailsStr }
    });
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