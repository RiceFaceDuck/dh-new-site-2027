import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const bufferService = {
  async getBufferConfig() {
    try {
      const invSnap = await getDoc(doc(db, getCollectionPath('settings'), 'inventory'));
      if (invSnap.exists()) {
        return invSnap.data();
      }
      return null;
    } catch (error) {
      console.error("🔥 Error fetching buffer config:", error);
      throw error;
    }
  },

  async updateBufferConfig(bufferStock, diffMsg, uid) {
    try {
      const numStock = parseInt(bufferStock, 10);
      if (isNaN(numStock) || numStock < 0) {
        return { success: false, message: 'จำนวนบัฟเฟอร์ต้องเป็นตัวเลขถ้วนไม่ติดลบ' };
      }
      await setDoc(doc(db, getCollectionPath('settings'), 'inventory'), { defaultBufferStock: numStock }, { merge: true });
      if (diffMsg && uid) {
        await historyService.addLog(
          'SystemConfig', 
          'Update', 
          'inventory', 
          `อัปเดตบัฟเฟอร์กลางเป็น ${bufferStock} ชิ้น | ${diffMsg}`, 
          uid
        );
      }
      return { success: true };
    } catch (error) {
      console.error("🔥 Error updating buffer config:", error);
      return { success: false, message: error.message };
    }
  }
};
