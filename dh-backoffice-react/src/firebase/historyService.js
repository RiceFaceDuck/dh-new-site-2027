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

  // ✨ ดึงประวัติมาแสดงผลแบบ Pagination (ดึงจาก Google Drive แทน Firestore)
  getRecentLogs: async (maxLimit = 50, lastDocRef = null, moduleFilter = 'all', actionFilter = 'all', keyword = '') => {
    try {
      // Since we moved to Google Drive, pagination by reference (lastDocRef) works differently.
      // For now, we will fetch the latest logs based on limits and filters.
      // Note: GAS currently supports dateStr, module, level, keyword, limit.
      
      const moduleParam = moduleFilter === 'all' ? 'ALL' : moduleFilter;
      const logs = await gasHistoryService.getLogs({
        module: moduleParam,
        keyword: keyword || '',
        limit: maxLimit
      });

      // Format logs to match the old UI structure where possible
      const formattedLogs = logs.map((log, index) => ({
        id: log.client_timestamp + '_' + index,
        module: log.module,
        action: log.action,
        timestamp: { toDate: () => new Date(log.client_timestamp) }, // Mock Firestore Timestamp
        actorName: log.actor?.name || 'System',
        targetId: log.target?.id || '-',
        details: log.details?.legacy_details || JSON.stringify(log.details || {}),
        ...log
      }));
      
      // If we got fewer than maxLimit, we've likely hit the end of the recent logs.
      const lastDoc = formattedLogs.length >= maxLimit ? 'has_more' : null;
      
      return { logs: formattedLogs, lastDoc };
    } catch (error) {
      console.error("🔥 Error fetching history from Drive:", error);
      return { logs: [], lastDoc: null };
    }
  }
};