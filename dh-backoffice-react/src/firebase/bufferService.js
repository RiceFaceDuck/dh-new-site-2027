import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

export const bufferService = {
  async getBufferConfig() {
    try {
      const invSnap = await getDoc(doc(db, 'settings', 'inventory'));
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
      await setDoc(doc(db, 'settings', 'inventory'), { defaultBufferStock: bufferStock }, { merge: true });
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
