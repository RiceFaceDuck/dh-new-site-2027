import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// ==========================================
// 🧠 Smart Cache (ป้องกัน Quota Leak 5 นาที)
// ==========================================
let orderCountCache = {};
let orderCountFetchTime = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 นาที

/**
 * ล้างแคชตัวนับออเดอร์
 */
export const clearOrderCountCache = (uid = null) => {
  if (uid) {
    delete orderCountCache[uid];
    delete orderCountFetchTime[uid];
  } else {
    orderCountCache = {};
    orderCountFetchTime = {};
  }
};

/**
 * ⚡ Hook: ดึงจำนวนออเดอร์ที่แท้จริงของผู้ใช้ (Zero Quota Leak)
 * - ดึงจาก user.stats.totalOrders ก่อนเป็นอันดับแรก (0 Read)
 * - หากไม่มี ใช้ getCountFromServer ดึงเฉพาะตัวเลขรวม (1 Read ต่อ 5 นาที)
 * @param {Object} user - ข้อมูลผู้ใช้
 * @returns {{ count: number, loading: boolean }}
 */
export const useUserOrderCount = (user) => {
  const uid = user?.uid;
  const initialCount = Number(user?.stats?.totalOrders || 0);

  const [orderCount, setOrderCount] = useState(() => {
    if (initialCount > 0) return initialCount;
    if (uid && orderCountCache[uid] !== undefined) return orderCountCache[uid];
    return 0;
  });

  const [loading, setLoading] = useState(() => {
    if (initialCount > 0) return false;
    if (uid && orderCountCache[uid] !== undefined) return false;
    return !!uid;
  });

  useEffect(() => {
    if (!uid) {
      setOrderCount(0);
      setLoading(false);
      return;
    }

    // 1. ถ้ามีสถิติที่ระบุในโปรไฟล์แล้วและมากกว่า 0 ใช้ค่านั้นทันที (0 Read)
    if (initialCount > 0) {
      setOrderCount(initialCount);
      orderCountCache[uid] = initialCount;
      orderCountFetchTime[uid] = Date.now();
      setLoading(false);
      return;
    }

    // 2. ถ้ามีแคชและยังไม่หมดอายุ ให้ใช้ของเดิม (0 Read)
    const now = Date.now();
    if (orderCountCache[uid] !== undefined && (now - (orderCountFetchTime[uid] || 0) < CACHE_TTL_MS)) {
      setOrderCount(orderCountCache[uid]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    // 3. ยิงนับเฉพาะตัวเลขรวมจาก Firestore (ใช้เพียง 1 Read)
    const fetchCount = async () => {
      try {
        const q = query(
          collection(db, getCollectionPath('orders')),
          where('userId', '==', uid)
        );
        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;

        if (isMounted) {
          orderCountCache[uid] = count;
          orderCountFetchTime[uid] = Date.now();
          setOrderCount(count);
          setLoading(false);
        }
      } catch (err) {
        console.warn('⚠️ [useUserOrderCount] Error counting orders, using fallback:', err.message);
        if (isMounted) {
          setOrderCount(initialCount);
          setLoading(false);
        }
      }
    };

    fetchCount();

    return () => {
      isMounted = false;
    };
  }, [uid, initialCount]);

  return { count: orderCount, loading };
};
