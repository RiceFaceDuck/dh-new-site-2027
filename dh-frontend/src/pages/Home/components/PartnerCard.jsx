import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { trackAdClick } from '../../../firebase/marketingAnalyticsService';
import LazyImage from '../../../components/common/LazyImage';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { getRenderableImageUrl } from '../../../utils/imageUtils';
import useAdViewTracker from '../../../hooks/useAdViewTracker';

const PartnerCard = ({ partner, placement = 'home_squad_highlight' }) => {
  // Use storeProfile data if available, fallback to partner root level data
  const rawAvatar =
    partner.storeImage ||
    partner.storeProfile?.logoUrl ||
    partner.avatar ||
    partner.photoURL ||
    partner.profileImage ||
    partner.profilePicture ||
    partner.logo ||
    partner.photo ||
    null;
  const avatar = getRenderableImageUrl(rawAvatar, 400);
  const name = getCustomerDisplayName(partner, 'ช่างซ่อมอิสระ');
  const role = partner.services || partner.role || 'ช่างซ่อมคอมพิวเตอร์';
  const partnerUid = partner.id || partner.userId;
  const adId = 'AD-CARD-' + partnerUid;

  // 👁️ ระบบตรวจจับสายตาจริง (IntersectionObserver + Dwell Time 1s + Anti-Fraud 5m)
  const { ref: cardRef } = useAdViewTracker({
    adId,
    adCollection: 'partner_ads',
    adType: 'BUSINESS_CARD',
    ownerId: partnerUid || 'unknown',
    placement,
    threshold: 0.5,
    dwellTimeMs: 1000,
    enabled: Boolean(partnerUid),
    metadata: {
      partnerName: name,
      services: role
    }
  });

  // 🛡️ Distance Sanitizer: ป้องกันตัวอักษรเพี้ยน (Mojibake) และบังคับคำนวณระยะทางมาตรฐานเสมอ
  const getDisplayDistance = () => {
    if (typeof partner.distanceKm === 'number' && !isNaN(partner.distanceKm)) {
      return partner.distanceKm < 1
        ? `${Math.round(partner.distanceKm * 1000)} เมตร`
        : `${Math.floor(partner.distanceKm)} กม.`;
    }
    if (!partner.formattedDistance) return null;
    const str = String(partner.formattedDistance);
    const numMatch = str.match(/\d+(\.\d+)?/);
    if (numMatch) {
      const num = parseFloat(numMatch[0]);
      if (str.includes('เมตร')) {
        return `${Math.round(num)} เมตร`;
      }
      return `${Math.floor(num)} กม.`;
    }
    return str;
  };
  const displayDistance = getDisplayDistance();

  const handleClick = async () => {
    try {
      await trackAdClick('partner_ads', adId, {
        type: 'BUSINESS_CARD',
        ownerId: partnerUid || 'unknown',
        placement
      });
    } catch (e) {
      console.error('Failed to track click', e);
    }
  };

  return (
    <Link
      ref={cardRef}
      to={`/store/${partner.id || partner.userId}`}
      onClick={handleClick}
      className="group relative bg-white border border-slate-200 rounded-md flex overflow-hidden h-[132px] shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:border-[#93C5FD] hover:shadow-[0_8px_20px_-6px_rgba(8,112,184,0.16)] hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
    >
      {/* Left Full-Height Store Photo */}
      <div className="w-[108px] lg:w-[124px] h-full shrink-0 bg-slate-100 relative overflow-hidden">
        <LazyImage
          src={avatar}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0 p-2.5 md:p-3 flex flex-col text-left">
        <h3 className="font-heading text-sm font-bold text-slate-900 leading-snug group-hover:text-brand transition-colors truncate">
          {name}
        </h3>
        <p
          className="text-[11.5px] text-slate-500 font-light leading-snug line-clamp-2 mt-1 break-words"
          title={role}
        >
          {role}
        </p>

        {/* Bottom Row: Distance + Contact CTA */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {displayDistance ? (
            <span className="inline-flex items-center gap-1 font-heading text-[11px] font-semibold text-[#1E1B4B] bg-[#EEF2FF] px-2 py-0.5 rounded-sm truncate max-w-[60%]">
              <MapPin size={11} className="text-emerald-600 shrink-0" />
              <span className="truncate">เดินทาง {displayDistance}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-heading text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm truncate max-w-[60%]">
              <MapPin size={11} className="text-slate-400 shrink-0" />
              <span className="truncate">ไม่ทราบระยะทาง</span>
            </span>
          )}

          <span className="font-heading text-[11.5px] font-medium bg-[#132642] group-hover:bg-brand text-white px-2.5 py-1 rounded-sm shrink-0 transition-colors">
            ติดต่อช่าง
          </span>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(PartnerCard);
