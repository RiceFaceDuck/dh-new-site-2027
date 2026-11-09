import { useStoreViews } from './useStoreViews';
import { useStoreLikes } from './useStoreLikes';

/**
 * Facade Hook for Store Profile stats (views and likes).
 * Follows Clean Architecture & SRP: Delegates view tracking to useStoreViews
 * and like management to useStoreLikes, while maintaining 100% backward compatibility.
 * 
 * @param {Object} partner Store partner document
 * @returns {{
 *   viewCount: number,
 *   todayViewCount: number,
 *   likeCount: number,
 *   isLiked: boolean,
 *   isLikeLoading: boolean,
 *   isLiking: boolean,
 *   handleToggleLike: () => Promise<void>,
 *   toggleLike: () => Promise<void>
 * }}
 */
export const useStoreStats = (partner) => {
  const { allTime: viewCount, today: todayViewCount } = useStoreViews(partner);
  const {
    likeCount,
    isLiked,
    isLikeLoading,
    handleToggleLike,
    isLiking,
    toggleLike
  } = useStoreLikes(partner);

  return {
    viewCount,
    todayViewCount,
    likeCount,
    isLiked,
    isLikeLoading,
    isLiking: isLiking ?? isLikeLoading,
    handleToggleLike,
    toggleLike: toggleLike ?? handleToggleLike
  };
};

export default useStoreStats;
