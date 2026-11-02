import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { safeJsonParse } from 'dh-shared';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'web_traffic';
const CACHE_KEY = 'dh_web_traffic_cache';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 ชั่วโมง (Two-Tier Quota Discipline)

/**
 * Service สำหรับดึงสถิติผู้เข้าชมเว็บไซต์ฝั่ง Storefront (หน้าร้าน)
 * มีระบบ Cache ใน SessionStorage ป้องกันการอ่าน Firestore เกินจำเป็น
 */
export const webTrafficClientService = {
  /**
   * ดึงยอดผู้เข้าชมเว็บไซต์ All-Time
   * @returns {Promise<number>} ยอดผู้เข้าชมทั้งหมด (ถ้ามีปัญหา fallback เป็น 0)
   */
  getAllTimeVisitors: async () => {
    // 1. อ่านจาก Session Storage ก่อน เพื่อประหยัด Quota Read (Warm Cache: 0 Read)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = safeJsonParse(cached);
        const isExpired = Date.now() - (parsedCache?.timestamp || 0) > CACHE_EXPIRY_MS;

        if (!isExpired && typeof parsedCache?.data?.allTime === 'number') {
          return parsedCache.data.allTime;
        }
      }
    } catch (e) {
      console.warn('⚠️ ไม่สามารถอ่าน web traffic cache ได้:', e);
    }

    // 2. ถ้าไม่มี Cache หรือ Cache หมดอายุ ให้ดึงจาก Firestore (Cold Start: 1 Read)
    try {
      const docRef = doc(db, getCollectionPath(COLLECTION_NAME), DOC_ID);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        const allTime = typeof data?.allTime === 'number' 
          ? data.allTime 
          : parseInt(data?.allTime || '0', 10) || 0;

        // บันทึกลง Session Storage พร้อม timestamp
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: { ...data, allTime }
          }));
        } catch (storageErr) {
          console.warn('⚠️ ไม่สามารถบันทึก web traffic ลง cache ได้:', storageErr);
        }

        return allTime;
      }
      return 0;
    } catch (error) {
      console.error('🔥 Error fetching web traffic all-time stats:', error);
      return 0;
    }
  }
};
