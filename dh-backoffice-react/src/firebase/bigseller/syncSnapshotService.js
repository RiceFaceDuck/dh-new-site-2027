import { db } from '../config';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';

export const syncSnapshotService = {
  saveSnapshot: async (changes, uid, userName) => {
    try {
      // สร้าง Transaction ID: DET-YYYYMMDD-HHMMSS
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const txId = `DET-${datePart}-${timePart}`;

      // 1. บันทึกประวัติและข้อมูลเชิงลึก (Detailed Data) ลง Google Sheets ผ่าน GAS History (0 Writes โควต้า)
      const { gasHistoryService } = await import('../gasHistoryService');
      gasHistoryService.log({
        level: 'INFO',
        module: 'INVENTORY_SYNC',
        action: 'DETECT_SNAPSHOT',
        target: { id: txId },
        actorOverride: {
          uid: uid || 'System',
          name: userName || 'System'
        },
        details: {
          summary: {
            increased: changes.increased?.length || 0,
            decreased: changes.decreased?.length || 0,
            priceChanged: changes.priceChanged?.length || 0,
            otherChanged: changes.otherChanged?.length || 0
          },
          // ส่งข้อมูลฉบับเต็มไปเก็บให้ Analyst ใช้งานใน Google Sheets
          increased: changes.increased || [],
          decreased: changes.decreased || [],
          priceChanged: changes.priceChanged || [],
          otherChanged: changes.otherChanged || []
        }
      });

      // 2. บันทึก Snapshot ล่าสุดไว้ที่ system_counters เพื่อให้แผงซ้ายดึงไปเทียบง่ายๆ (ใช้แค่ 1 Read)
      const lastSnapshotRef = doc(db, 'system_counters', 'last_detect_snapshot');
      await setDoc(lastSnapshotRef, {
        transactionId: txId,
        timestamp: serverTimestamp(),
        changes: changes // เก็บ data ไว้เปรียบเทียบ
      });

      return txId;
    } catch (err) {
      console.error("Failed to save snapshot", err);
      throw err;
    }
  },

  getLatestSnapshot: async () => {
    try {
      const docRef = doc(db, 'system_counters', 'last_detect_snapshot');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      console.error("Failed to get snapshot", err);
      return null;
    }
  }
};
