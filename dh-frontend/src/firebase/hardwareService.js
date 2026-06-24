import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 🚀 [SRP] Service สำหรับจัดการข้อมูล Hardware Scan โดยเฉพาะ
export const hardwareService = {
  /**
   * บันทึกข้อมูลสแกนฮาร์ดแวร์ลงใน Profile ของลูกค้า
   * @param {string} appId - รหัสแอปพลิเคชัน
   * @param {string} uid - User ID ของลูกค้าที่ล็อกอิน
   * @param {Object} scanData - ข้อมูลฮาร์ดแวร์ที่ดึงมาได้
   */
  saveScan: async (appId, uid, scanData) => {
    try {
      // 💡 ประหยัด Reads: เราทำการ Write อย่างเดียวแบบ AddDoc ไม่ต้องดึงข้อมูลเก่ามาเช็ค
      const scansRef = collection(db, 'artifacts', appId, 'users', uid, 'hardware_scans');
      const docRef = await addDoc(scansRef, {
        ...scanData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("🔥 [hardwareService] Error saving hardware scan:", error);
      throw error;
    }
  }
};
