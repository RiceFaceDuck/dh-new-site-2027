import { useState, useEffect, useCallback } from 'react';
import { updateStoreLikeCount } from '../services/partnerProfileService';

/**
 * Custom Hook for managing store like count and user like status.
 * Clean Architecture & SRP: Decoupled from view count logic.
 * 
 * @param {Object} partner Store partner document
 * @returns {{
 *   likeCount: number,
 *   isLiked: boolean,
 *   isLikeLoading: boolean,
 *   handleToggleLike: () => Promise<void>,
 *   isLiking: boolean,
 *   toggleLike: () => Promise<void>
 * }}
 */
export const useStoreLikes = (partner) => {
  const partnerId = partner?.id || partner?.userId;

  const initialLikes = Math.max(0, Number(partner?.likeCount || partner?.likes || 0));
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Sync state when partner prop changes
  useEffect(() => {
    if (partner) {
      setLikeCount(Math.max(0, Number(partner.likeCount || partner.likes || 0)));
    }
  }, [partner?.id, partner?.userId, partner?.likeCount, partner?.likes]);

  // Check stored like status from localStorage
  useEffect(() => {
    if (!partnerId) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storageKey = `dh_store_liked_${partnerId}`;
        const savedLike = localStorage.getItem(storageKey);
        setIsLiked(Boolean(savedLike === 'true'));
      }
    } catch (e) {
      // LocalStorage access guard for private browsing / restricted mode
    }
  }, [partnerId]);

  // Toggle like handler with optimistic UI update and concurrency guard
  const handleToggleLike = useCallback(async () => {
    if (!partnerId || isLikeLoading) return;

    setIsLikeLoading(true);
    const nextLiked = !isLiked;
    const delta = nextLiked ? 1 : -1;
    const nextCount = Math.max(0, likeCount + delta);

    // Optimistic UI update immediately
    setIsLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      const storageKey = `dh_store_liked_${partnerId}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        if (nextLiked) {
          localStorage.setItem(storageKey, 'true');
        } else {
          localStorage.removeItem(storageKey);
        }
      }

      await updateStoreLikeCount(partnerId, delta);
    } catch (err) {
      console.debug('[useStoreLikes] updateStoreLikeCount deferred/fallback:', err?.message);
    } finally {
      setIsLikeLoading(false);
    }
  }, [partnerId, isLiked, likeCount, isLikeLoading]);

  return {
    likeCount,
    isLiked,
    isLikeLoading,
    handleToggleLike,
    // Backward compatibility aliases
    isLiking: isLikeLoading,
    toggleLike: handleToggleLike
  };
};

export default useStoreLikes;
