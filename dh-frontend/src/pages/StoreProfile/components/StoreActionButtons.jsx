import React from 'react';
import { useToast } from '../../../context/ToastContext';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { Phone, MapPin, Share2 } from 'lucide-react';
import { trackAdClick } from '../../../firebase/marketingAnalyticsService';
import { resolveMapsUrl } from '../utils/storeUrlUtils';

const StoreActionButtons = ({ partner }) => {
  const { showToast } = useToast();
  const name = getCustomerDisplayName(partner, 'ช่างซ่อมอิสระ');
  const role = partner?.services || partner?.role || 'บริการซ่อมคอมพิวเตอร์และอุปกรณ์ไอที';
  const phone = partner?.phone || partner?.storeProfile?.phone || '';
  const partnerUid = partner?.id || partner?.userId;
  const adId = partnerUid ? 'AD-CARD-' + partnerUid : null;
  const mapsUrl = resolveMapsUrl(partner);

  const handlePhoneClick = () => {
    if (partnerUid && adId) {
      trackAdClick('partner_ads', adId, {
        type: 'BUSINESS_CARD',
        ownerId: partnerUid,
        placement: 'store_profile_hero',
        actionType: 'phone_call',
        targetUrl: phone ? `tel:${phone}` : ''
      }).catch(() => {});
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: name, text: role, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      if (showToast) showToast('คัดลอกลิงก์ร้านค้าเรียบร้อยแล้ว', 'success');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-2 w-full md:w-auto md:max-w-md lg:max-w-lg md:min-w-[340px] lg:min-w-[380px]">
      {phone && (
        <a href={`tel:${phone}`} title={`โทรติดต่อ: ${phone}`} onClick={handlePhoneClick}
          className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base md:text-xs lg:text-sm border-b-[3px] border-emerald-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all h-11 md:h-[38px] cursor-pointer w-1/2 mx-auto sm:w-full">
          <span className="px-2 sm:px-3 py-1.5 truncate text-center flex-1">
            <span className="md:hidden">โทรติดต่อร้าน</span>
            <span className="hidden md:inline">โทร</span>
          </span>
          <span className="h-full w-10 sm:w-11 md:w-9 bg-white text-emerald-600 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%)] pl-2 shrink-0">
            <Phone size={14} className="group-hover:scale-110 transition-transform" />
          </span>
        </a>
      )}
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" title="Google MAP"
          className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm sm:text-base md:text-xs lg:text-sm border-b-[3px] border-sky-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all h-11 md:h-[38px] cursor-pointer w-1/2 mx-auto sm:w-full">
          <span className="px-2 sm:px-3 py-1.5 truncate text-center flex-1">
            <span className="md:hidden">Google MAP</span>
            <span className="hidden md:inline">MAP</span>
          </span>
          <span className="h-full w-10 sm:w-11 md:w-9 bg-white text-sky-600 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%)] pl-2 shrink-0">
            <MapPin size={14} className="group-hover:scale-110 transition-transform" />
          </span>
        </a>
      )}
      <button type="button" onClick={handleShare} title="แชร์ร้านค้านี้"
        className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm sm:text-base md:text-xs lg:text-sm border-b-[3px] border-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all h-11 md:h-[38px] cursor-pointer w-1/2 mx-auto sm:w-full">
        <span className="px-2 sm:px-3 py-1.5 truncate text-center flex-1">
          <span className="md:hidden">แชร์ร้านค้านี้</span>
          <span className="hidden md:inline">แชร์</span>
        </span>
        <span className="h-full w-10 sm:w-11 md:w-9 bg-white text-slate-700 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%)] pl-2 shrink-0">
          <Share2 size={14} className="group-hover:scale-110 transition-transform" />
        </span>
      </button>
    </div>
  );
};

export default React.memo(StoreActionButtons);
