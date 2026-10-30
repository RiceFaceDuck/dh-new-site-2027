import { useToast } from '../../../context/ToastContext';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { getRenderableImageUrl } from '../../../utils/imageUtils';
import { Phone, MapPin, Share2 } from 'lucide-react';
import useAdViewTracker from '../../../hooks/useAdViewTracker';
import { trackAdClick } from '../../../firebase/marketingAnalyticsService';

const StoreProfileHero = ({ partner }) => {
  const { showToast } = useToast();

  const rawAvatar = partner.storeImage || partner.storeProfile?.logoUrl || partner.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop';
  const avatar = getRenderableImageUrl(rawAvatar);
  const name = getCustomerDisplayName(partner, 'ช่างซ่อมอิสระ');
  const role = partner.services || partner.role || 'บริการซ่อมคอมพิวเตอร์และอุปกรณ์ไอที';
  const phone = partner.phone || partner.storeProfile?.phone || '';
  const partnerUid = partner.id || partner.userId;
  const adId = 'AD-CARD-' + partnerUid;

  // 👁️ ตรวจจับสายตาจริงสำหรับหน้าร้านพาร์ทเนอร์ (Store Profile Hero)
  const { ref: heroRef } = useAdViewTracker({
    adId,
    adCollection: 'partner_ads',
    adType: 'BUSINESS_CARD',
    ownerId: partnerUid || 'unknown',
    placement: 'store_profile_hero',
    threshold: 0.5,
    dwellTimeMs: 1000,
    enabled: Boolean(partnerUid),
    metadata: {
      partnerName: name,
      services: role
    }
  });

  // 📍 คำนวณลิงก์ Google Maps จาก mapsUrl, googleMapLink หรือพิกัด GPS (latitude, longitude)
  const lat = Number(partner.latitude ?? partner.storeProfile?.latitude ?? 0);
  const lng = Number(partner.longitude ?? partner.storeProfile?.longitude ?? 0);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  const coordsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '';

  const rawMapsUrl = (partner.mapsUrl || partner.googleMapLink || partner.googleMapsUrl || partner.storeProfile?.mapsUrl || partner.storeProfile?.googleMapLink || coordsUrl || '').trim();
  const mapsUrl = rawMapsUrl 
    ? (rawMapsUrl.startsWith('http') ? rawMapsUrl : `https://www.google.com/maps?q=${encodeURIComponent(rawMapsUrl)}`)
    : '';

  const handlePhoneClick = () => {
    if (partnerUid) {
      trackAdClick('partner_ads', adId, {
        type: 'BUSINESS_CARD',
        ownerId: partnerUid || 'unknown',
        placement: 'store_profile_hero',
        actionType: 'phone_call',
        targetUrl: phone ? `tel:${phone}` : ''
      }).catch(() => {});
    }
  };

  return (
    <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 relative z-10">
      <div ref={heroRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 lg:p-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 lg:gap-10">
          
          {/* Avatar Area */}
          <div className="relative group shrink-0">
            <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white transform transition-transform group-hover:scale-105 duration-300">
              <img src={avatar} alt={name} className="w-full h-full object-cover"  loading="lazy" />
            </div>

          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 w-full text-center md:text-left pt-2 md:pt-1 md:flex md:flex-col md:justify-between md:self-stretch">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                {name}
              </h1>
              <p className="text-brand font-medium text-sm md:text-base lg:text-lg mb-4">{role}</p>
            </div>
            
            {/* Action Buttons (มาชิดขอบล่างของการ์ดบน PC + ลดขนาด 20%) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-2 w-full mt-2 md:mt-auto md:max-w-md lg:max-w-lg">
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  title={`โทรติดต่อ: ${phone}`}
                  onClick={handlePhoneClick}
                  className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base md:text-xs lg:text-sm border-b-[3px] border-emerald-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all h-11 md:h-[38px] cursor-pointer w-1/2 mx-auto sm:w-full"
                >
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
                <a 
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Google MAP"
                  className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm sm:text-base md:text-xs lg:text-sm border-b-[3px] border-sky-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all h-11 md:h-[38px] cursor-pointer w-1/2 mx-auto sm:w-full"
                >
                  <span className="px-2 sm:px-3 py-1.5 truncate text-center flex-1">
                    <span className="md:hidden">Google MAP</span>
                    <span className="hidden md:inline">MAP</span>
                  </span>
                  <span className="h-full w-10 sm:w-11 md:w-9 bg-white text-sky-600 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%)] pl-2 shrink-0">
                    <MapPin size={14} className="group-hover:scale-110 transition-transform" />
                  </span>
                </a>
              )}
              <button 
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: name,
                      text: role,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('คัดลอกลิงก์ร้านค้าเรียบร้อยแล้ว', 'success');
                  }
                }}
                title="แชร์ร้านค้านี้"
                className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm sm:text-base md:text-xs lg:text-sm border-b-[3px] border-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all h-11 md:h-[38px] cursor-pointer w-1/2 mx-auto sm:w-full"
              >
                <span className="px-2 sm:px-3 py-1.5 truncate text-center flex-1">
                  <span className="md:hidden">แชร์ร้านค้านี้</span>
                  <span className="hidden md:inline">แชร์</span>
                </span>
                <span className="h-full w-10 sm:w-11 md:w-9 bg-white text-slate-700 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%)] pl-2 shrink-0">
                  <Share2 size={14} className="group-hover:scale-110 transition-transform" />
                </span>
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default StoreProfileHero;
