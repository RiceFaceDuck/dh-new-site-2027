import React from 'react';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { getRenderableImageUrl } from '../../../utils/imageUtils';
import StoreLikeButton from './StoreLikeButton';
import StoreViewBadge from './StoreViewBadge';
import StoreActionButtons from './StoreActionButtons';
import { useStoreStats } from '../hooks/useStoreStats';

const StoreProfileHero = ({ partner }) => {
  const rawAvatar = partner?.storeImage || partner?.storeProfile?.logoUrl || partner?.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop';
  const avatar = getRenderableImageUrl(rawAvatar);
  const name = getCustomerDisplayName(partner, 'ช่างซ่อมอิสระ');
  const role = partner?.services || partner?.role || 'บริการซ่อมคอมพิวเตอร์และอุปกรณ์ไอที';

  // 💖 สถิติยอดวิว (All-time & Today) และการกดไลก์ (Likes)
  const {
    likeCount,
    viewCount,
    todayViewCount,
    isLiked,
    isLiking,
    toggleLike
  } = useStoreStats(partner);

  return (
    <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 relative z-10">
      <div className="relative bg-white rounded-[2px] shadow-sm border border-slate-100 p-6 md:p-8 lg:p-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 lg:gap-10">
        
        {/* Avatar Area */}
        <div className="relative group shrink-0">
          <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 aspect-square rounded-[2px] overflow-hidden border border-slate-100 shadow-sm bg-white transform transition-transform group-hover:scale-105 duration-300">
            <img src={avatar} alt={name} className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0 w-full text-center md:text-left pt-2 md:pt-1 md:flex md:flex-col md:justify-between md:self-stretch">
          {/* Mobile Stats Bar (3 บรรทัดแยกอิสระ: 1. ยอดวิว, 2. ถูกใจ X, 3. ปุ่มหัวใจ) */}
          <div className="md:hidden flex flex-col items-center justify-center gap-1.5 mb-3.5">
            <StoreViewBadge viewCount={viewCount} todayViewCount={todayViewCount} />
            <StoreLikeButton
              likeCount={likeCount}
              isLiked={isLiked}
              isLiking={isLiking}
              onToggleLike={toggleLike}
              layout="vertical-stacked"
            />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
              {name}
            </h1>
            <p className="text-brand font-medium text-sm md:text-base lg:text-lg mb-4">{role}</p>
          </div>
          
          {/* Action Buttons & Stats Row */}
          <div className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-center md:justify-between gap-3 w-full mt-2 md:mt-auto">
            <StoreActionButtons partner={partner} />

            {/* ฝั่งขวาสุดบน PC: สถิติยอดวิวและปุ่มกดถูกใจ ชิดขวาสุดตาม R2 */}
            <div className="hidden md:flex items-center gap-2.5 ml-auto shrink-0">
              <StoreViewBadge viewCount={viewCount} todayViewCount={todayViewCount} />
              <StoreLikeButton
                likeCount={likeCount}
                isLiked={isLiked}
                isLiking={isLiking}
                onToggleLike={toggleLike}
                layout="horizontal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfileHero;
