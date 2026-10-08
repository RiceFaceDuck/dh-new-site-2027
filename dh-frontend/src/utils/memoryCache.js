/**
 * Smart In-Memory Cache Utility for SWR (Stale-While-Revalidate)
 * ช่วยประหยัด Firebase Reads และเพิ่มความเร็ว UX (0ms Loading)
 */

const cacheStore = new Map();
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 นาที

export const memoryCache = {
  /**
   * ดึงข้อมูลจาก Cache หากมีและยังไม่หมดอายุ หากไม่มีให้ Fetch ใหม่
   * @param {string} key - Cache Key (เช่น 'category-notebook')
   * @param {Function} fetchFn - ฟังก์ชันที่จะดึงข้อมูลจริง (ต้องคืนค่า Promise)
   * @param {number} cacheTime - ระยะเวลาที่จะ Cache (milliseconds)
   * @param {Function} [onRevalidate] - Callback เมื่อมีข้อมูลใหม่จากการ Revalidate ในพื้นหลัง
   * @returns {Promise<any>}
   */
  getOrFetch: async (key, fetchFn, cacheTime = DEFAULT_CACHE_TIME, onRevalidate = null) => {
    const now = Date.now();
    const cachedItem = cacheStore.get(key);

    if (cachedItem) {
      const isExpired = now - cachedItem.timestamp > cacheTime;
      
      if (!isExpired) {
        // 🛡️ Zero-Phantom-Quota Guard:
        // รัน Background Revalidate เฉพาะกรณีที่มี onRevalidate callback ต่อเข้ากับ UI state เท่านั้น
        // หากไม่มี callback รับค่า จะไม่ยิงดึงข้อมูลทิ้งฟรีเพื่อรักษาโควต้าให้อยู่ในระดับสูงสุด
        const shouldRevalidate = typeof onRevalidate === 'function' && (now - cachedItem.timestamp > cacheTime / 2);
        if (shouldRevalidate) {
          fetchFn().then(newData => {
            if (newData) {
              cacheStore.set(key, { data: newData, timestamp: Date.now() });
              try {
                onRevalidate(newData);
              } catch (cbErr) {
                console.warn('[Cache] onRevalidate error:', cbErr);
              }
            }
          }).catch(err => {
            console.warn(`[Cache] Background revalidate failed for ${key}:`, err);
          });
        }
        
        return cachedItem.data;
      }
    }

    // Cache Miss หรือ Expired - ต้องดึงใหม่
    try {
      const freshData = await fetchFn();
      cacheStore.set(key, { data: freshData, timestamp: now });
      return freshData;
    } catch (error) {
      if (cachedItem && cachedItem.data) {
        console.warn(`[Cache] Fetch failed for ${key}, using expired cache.`);
        return cachedItem.data;
      }
      throw error;
    }
  },

  clear: (key) => {
    if (key) {
      cacheStore.delete(key);
    } else {
      cacheStore.clear();
    }
  }
};
