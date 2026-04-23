import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

const SETTINGS_DOC = 'warranty';

// 💡 ค่าเริ่มต้น หากเพิ่งรันระบบครั้งแรก
const DEFAULT_WARRANTY = {
  categories: {
    'Panel': { claimDays: 180, returnDays: 7 },
    'Keyboard': { claimDays: 90, returnDays: 7 },
    'Battery': { claimDays: 180, returnDays: 7 },
    'Adapter': { claimDays: 180, returnDays: 7 },
    'General': { claimDays: 30, returnDays: 7 } // หมวดหมู่อื่นๆ
  },
  skus: {} // เก็บ SKU พิเศษ เช่น "SKU-999": { claimDays: 365, returnDays: 15 }
};

export const warrantyService = {
  // ==========================================
  // 📥 ดึงข้อมูลกติกาประกัน (อ่าน 1 ครั้ง ได้ข้อมูลทั้งหมด)
  // ==========================================
  getWarrantySettings: async () => {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          categories: { ...DEFAULT_WARRANTY.categories, ...(data.categories || {}) },
          skus: data.skus || {}
        };
      }
      return DEFAULT_WARRANTY;
    } catch (error) {
      console.error("🔥 Error fetching warranty settings:", error);
      return DEFAULT_WARRANTY;
    }
  },

  // ==========================================
  // 📤 บันทึกข้อมูลกติกาประกัน
  // ==========================================
  updateWarrantySettings: async (newData, managerUid) => {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC);
      await setDoc(docRef, {
        ...newData,
        updatedAt: serverTimestamp(),
        updatedBy: managerUid
      });
      
      // บันทึก History ของผู้จัดการ
      await historyService.addLog('Manager', 'UpdateWarranty', 'System', 'อัปเดตตั้งค่าระยะเวลาประกันสินค้า', managerUid);
      
      return true;
    } catch (error) {
      console.error("🔥 Error updating warranty settings:", error);
      throw error;
    }
  }
};