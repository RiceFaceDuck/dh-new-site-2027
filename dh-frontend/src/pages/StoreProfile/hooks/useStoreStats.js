import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { trackStoreView } from '../../../firebase/marketingAnalyticsService';

/**
 * Custom Hook สำหรับบริหารจัดการสถิติยอดวิว (All-time Views) และการกดไลก์ (Likes)
 * ตามหลัก Calm UI, Two-Tier Buffering, MRC 1,000ms Dwell-Time, และ Clean Architecture
 * 
 * @param {Object} partner ข้อมูลพาร์ทเนอร์
 * @param {string} partner.id รหัสพาร์ทเนอร์
 * @param {number} [partner.likeCount] ยอดไลก์สะสม
 * @param {number} [partner.viewCount] ยอดวิวสะสม
 */
export const useStoreStats = (partner) => {
  const partnerId = partner?.id || partner?.userId;
  
  // 1. Initial State จาก Props พร้อม Null Guard
  const initialLikes = Math.max(0, Number(partner?.likeCount || partner?.likes || 0));
  const initialViews = Math.max(0, Number(partner?.viewCount || partner?.views || 0));

  const [likeCount, setLikeCount] = useState(initialLikes);
  const [viewCount, setViewCount] = useState(initialViews);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Sync state เมื่อ partner props เปลี่ยน
  useEffect(() => {
    if (partner) {
      setLikeCount(Math.max(0, Number(partner.likeCount || partner.likes || 0)));
      setViewCount(Math.max(0, Number(partner.viewCount || partner.views || 0)));
    }
  }, [partner?.id, partner?.likeCount, partner?.viewCount]);

  // 2. เช็คสถานะการกดไลก์ในเครื่องของผู้ใช้ (Local Storage Key)
  useEffect(() => {
    if (!partnerId) return;
    try {
      const storageKey = `dh_store_liked_${partnerId}`;
      const savedLike = localStorage.getItem(storageKey);
      setIsLiked(Boolean(savedLike === 'true'));
    } catch (e) {
      // LocalStorage access guard
    }
  }, [partnerId]);

  // 3. ระบบนับยอดวิวแบบ Organic (MRC Standard: Continuous 1,000ms Dwell Time + 5-Minute Cooldown Guard)
  // Architecture Note: Telemetry pipeline routes via trackStoreView.
  // Direct client writes such as updateDoc(partnerRef, { viewCount: increment(1) }) are eliminated to prevent single-document contention.
  const viewProcessedRef = useRef(false);
  const dwellTimerRef = useRef(null);

  useEffect(() => {
    if (!partnerId || viewProcessedRef.current) return;

    try {
      const sessionKey = `dh_store_viewed_${partnerId}`;
      const lastViewed = sessionStorage.getItem(sessionKey);
      const now = Date.now();

      // 5-minute session deduplication cooldown
      if (lastViewed && (now - parseInt(lastViewed, 10)) < 300000) {
        return;
      }

      // Continuous 1,000ms dwell-time timer (MRC/IAB Standard)
      dwellTimerRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem(sessionKey, Date.now().toString());
          viewProcessedRef.current = true;

          // Optimistic UI Update ทันที
          setViewCount((prev) => prev + 1);

          // ส่งยอดวิวเข้า In-Memory Telemetry Buffer (2 นาที) และ GA4 store_profile_view
          trackStoreView({
            storeId: partnerId,
            partnerName: partner?.storeName || partner?.name || partner?.displayName || '',
            ownerId: partnerId,
            source: 'store_profile'
          }).catch((err) => {
            console.debug('[useStoreStats] trackStoreView error:', err?.message);
          });
        } catch (storageErr) {
          // SessionStorage error guard
        }
      }, 1000);
    } catch (e) {
      // SessionStorage error guard
    }

    return () => {
      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };
  }, [partnerId, partner?.name, partner?.storeName, partner?.displayName]);

  // 4. ฟังก์ชัน Toggle Like (กดไลก์ / ยกเลิกไลก์)
  const toggleLike = useCallback(async () => {
    if (!partnerId || isLiking) return;

    setIsLiking(true);
    const nextLiked = !isLiked;
    const delta = nextLiked ? 1 : -1;
    const nextCount = Math.max(0, likeCount + delta);

    // Optimistic UI Update ทันที
    setIsLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      const storageKey = `dh_store_liked_${partnerId}`;
      if (nextLiked) {
        localStorage.setItem(storageKey, 'true');
      } else {
        localStorage.removeItem(storageKey);
      }

      // ส่งอัปเดตลง Firestore
      const partnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
      await updateDoc(partnerRef, {
        likeCount: increment(delta)
      }).catch((err) => {
        console.debug('[useStoreStats] Firestore likeCount increment deferred/fallback:', err.message);
      });
    } catch (err) {
      console.debug('[useStoreStats] Local storage or update error:', err);
    } finally {
      setIsLiking(false);
    }
  }, [partnerId, isLiked, likeCount, isLiking]);

  return {
    likeCount,
    viewCount,
    isLiked,
    isLiking,
    toggleLike
  };
};

export default useStoreStats;
