import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

/**
 * Custom Hook สำหรับบริหารจัดการสถิติยอดวิว (All-time Views) และการกดไลก์ (Likes)
 * ตามหลัก Calm UI, Two-Tier Buffering, และ Clean Architecture
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

  // 3. ระบบนับยอดวิวแบบ Organic (Session-Guarded Counter)
  const viewProcessedRef = useRef(false);

  useEffect(() => {
    if (!partnerId || viewProcessedRef.current) return;

    try {
      const sessionKey = `dh_store_viewed_${partnerId}`;
      const alreadyViewed = sessionStorage.getItem(sessionKey);

      if (!alreadyViewed) {
        // บันทึก Session Lock เพื่อไม่ให้นับซ้ำเมื่อรีเฟรชหน้า
        sessionStorage.setItem(sessionKey, '1');
        viewProcessedRef.current = true;

        // อัปเดตหน้าจอทันที (Optimistic View Count)
        setViewCount((prev) => prev + 1);

        // ส่งอัปเดตไปยัง Firestore อย่างปลอดภัย (Catch error เงียบ ไม่รบกวนหน้าเว็บ)
        const partnerRef = doc(db, getCollectionPath('ActivePartners'), partnerId);
        updateDoc(partnerRef, {
          viewCount: increment(1)
        }).catch((err) => {
          // Graceful fallback: ถ้า Rules ยังไม่อนุญาตในโหมดพัฒนา ตัวเลขจะยังคงแสดงบนจอได้อย่างราบรื่น
          console.debug('[useStoreStats] Firestore viewCount increment deferred/fallback:', err.message);
        });
      }
    } catch (e) {
      // SessionStorage error guard
    }
  }, [partnerId]);

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
