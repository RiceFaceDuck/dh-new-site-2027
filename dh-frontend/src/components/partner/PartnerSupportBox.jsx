import { useState } from 'react';
import { Phone, CheckCircle2, MapPin, Award, Store } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useNearestPartner } from './hooks/useNearestPartner';
import useAdViewTracker from '../../hooks/useAdViewTracker';
import { trackAdClick } from '../../firebase/marketingAnalyticsService';

// ==========================================
// 🧩 Sub-Components (SRP)
// ==========================================

const PartnerServiceBadges = ({ servicesText }) => {
  if (!servicesText) return null;
  const servicesList = Array.isArray(servicesText)
    ? servicesText.map(s => String(s).trim()).filter(Boolean)
    : typeof servicesText === 'string'
      ? servicesText.split(',').map(s => s.trim()).filter(Boolean)
      : [];
  if (servicesList.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1">
      {servicesList.slice(0, 2).map((service, idx) => (
        <span key={idx} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] border border-emerald-100 truncate">
          <CheckCircle2 size={9} className="text-emerald-500 shrink-0" />
          {service}
        </span>
      ))}
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="w-full bg-white border border-slate-200 animate-pulse flex flex-row items-stretch rounded-[2px] my-4 sm:my-6 overflow-hidden h-[142px] sm:h-[150px] shadow-xs">
    <div className="h-full aspect-square bg-slate-100 shrink-0 border-r border-slate-100"></div>
    <div className="flex-1 p-2 sm:p-2.5 flex flex-col justify-between min-w-0">
      <div className="space-y-1.5">
        <div className="h-4 w-1/2 bg-slate-100 rounded-[2px]"></div>
        <div className="h-5 w-3/4 bg-slate-100 rounded-[2px]"></div>
        <div className="h-3 w-1/3 bg-slate-100 rounded-[2px]"></div>
      </div>
      <div className="h-8 w-full bg-slate-100 rounded-[2px]"></div>
    </div>
  </div>
);

// ==========================================
// 📦 Main Component
// ==========================================

const PartnerSupportBox = () => {
  const { partner, loading, error } = useNearestPartner();
  const { showToast } = useToast();
  const [imgFailed, setImgFailed] = useState(false);

  const partnerUid = partner?.id || partner?.userId;
  const adId = 'AD-CARD-' + partnerUid;

  // 👁️ ระบบตรวจจับสายตาจริง (IntersectionObserver + Dwell Time 1s + Anti-Fraud 5m)
  const { ref: boxRef } = useAdViewTracker({
    adId,
    adCollection: 'partner_ads',
    adType: 'BUSINESS_CARD',
    ownerId: partnerUid || 'unknown',
    placement: 'product_detail_nearest_partner',
    threshold: 0.5,
    dwellTimeMs: 1000,
    enabled: Boolean(partnerUid),
    metadata: {
      storeName: partner?.storeName,
      services: partner?.services
    }
  });

  const handleContactClick = () => {
    if (!partner) return;
    if (partnerUid) {
      trackAdClick('partner_ads', adId, {
        type: 'BUSINESS_CARD',
        ownerId: partnerUid || 'unknown',
        placement: 'product_detail_nearest_partner',
        actionType: 'phone_call',
        targetUrl: partner.phone ? `tel:${partner.phone}` : ''
      }).catch(() => {});
    }
    if (partner.phone) {
      window.location.href = `tel:${partner.phone}`;
    } else {
      showToast('ร้านค้านี้ยังไม่ได้ระบุเบอร์โทรศัพท์ติดต่อ', 'info');
    }
  };

  const handleLineClick = () => {
    if (!partner) return;
    if (partnerUid) {
      trackAdClick('partner_ads', adId, {
        type: 'BUSINESS_CARD',
        ownerId: partnerUid || 'unknown',
        placement: 'product_detail_nearest_partner',
        actionType: 'line_chat',
        targetUrl: partner.lineUrl || ''
      }).catch(() => {});
    }
    if (partner.lineUrl) {
      window.open(partner.lineUrl, '_blank');
    } else {
      showToast('ร้านค้านี้ยังไม่ได้ระบุลิงก์ LINE ติดต่อ', 'info');
    }
  };

  const handleMessengerClick = () => {
    if (!partner) return;
    if (partnerUid) {
      trackAdClick('partner_ads', adId, {
        type: 'BUSINESS_CARD',
        ownerId: partnerUid || 'unknown',
        placement: 'product_detail_nearest_partner',
        actionType: 'facebook_chat',
        targetUrl: partner.messengerUrl || ''
      }).catch(() => {});
    }
    if (partner.messengerUrl) {
      window.open(partner.messengerUrl, '_blank');
    } else {
      showToast('ร้านค้านี้ยังไม่ได้ระบุลิงก์ Messenger ติดต่อ', 'info');
    }
  };

  if (loading) return <SkeletonLoader />;
  if (error || !partner) return null; 

  const photoUrl = partner.storeImage || 
                   partner.imageUrl || 
                   partner.fallbackAdImage || 
                   (partner.galleryImages && partner.galleryImages[0]) || 
                   partner.storeLogoUrl || 
                   partner.profileImage;

  const hasValidPhoto = Boolean(photoUrl && photoUrl !== '/logo.png' && !imgFailed);

  return (
    <div 
      ref={boxRef} 
      className="bg-white border border-slate-200/90 shadow-sm rounded-[2px] overflow-hidden flex flex-row items-stretch h-[142px] sm:h-[150px] group hover:shadow-md transition-all duration-300 my-4 sm:my-6"
    >
      {/* 🖼️ ฝั่งซ้าย: ภาพร้านค้าเต็มความสูง สัดส่วน 1:1 เต็มเฟรม */}
      <div className="h-full aspect-square relative shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center border-r border-slate-100">
        {hasValidPhoto ? (
          <img 
            src={photoUrl} 
            alt={partner.storeName || "Shop Profile"} 
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-3 text-slate-400 select-none">
            <Store size={28} className="text-slate-300 mb-1" />
            <span className="text-[9px] font-bold text-slate-400 text-center leading-tight">ร้านพาร์ทเนอร์</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute bottom-1.5 left-1.5 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-[2px] text-slate-900 flex items-center gap-1 shadow-md border border-white/50">
          <Award size={10} className="text-amber-500 shrink-0" />
          <span className="font-bold text-[7px] uppercase tracking-wider text-slate-800">Verified</span>
        </div>
      </div>

      {/* 🔴 ฝั่งขวา: รายละเอียดร้านชัดเจน ขยายขนาดให้อ่านง่าย */}
      <div className="flex-1 min-w-0 pt-1.5 pb-2 px-2.5 sm:pt-2 sm:pb-2.5 sm:px-3 flex flex-col justify-between">
        
        <div className="min-w-0 space-y-1">
          {/* Row 1: ป้ายสายรุ้ง "ผู้ให้บริการ ใกล้คุณ" (ปรับความหนาให้อ่านสบายตา ไม่หนาเกินไป) */}
          <div className="inline-flex max-w-full">
            <div className="p-[1px] rounded-[2px] bg-linear-to-r from-violet-500 via-pink-500 via-amber-400 via-emerald-400 to-cyan-500 shadow-xs max-w-full">
              <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xs px-1.5 py-[1px] rounded-[2px] max-w-full">
                <MapPin size={10} className="text-violet-600 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 tracking-tight truncate">
                  ผู้ให้บริการ ใกล้คุณ {partner.formattedDistance && (
                    <span className="text-violet-700 font-bold ml-0.5">{partner.formattedDistance}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: ชื่อร้าน และ รายละเอียดร้าน (ขยายตัวหนังสือให้อ่านง่าย มองเห็นได้ดี) */}
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-snug truncate group-hover:text-indigo-700 transition-colors duration-300">
              {partner.storeName}
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-600 font-normal line-clamp-2 leading-relaxed mt-0.5" title={partner.description || partner.richDescription || partner.services}>
              {partner.description || partner.richDescription || partner.services || "บริการตรวจเช็คและซ่อมด่วน"}
            </p>
          </div>
        </div>

        {/* Row 3: ปุ่มติดต่อ อยู่ในแถวเดียวเสมอ ไม่ตกบรรทัด */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 shrink-0">
          <button 
            onClick={handleContactClick}
            className="flex-1 min-w-0 px-2.5 py-1.5 bg-linear-to-r from-[#0870B8] to-[#0A85D9] hover:from-[#065A96] hover:to-[#0870B8] text-white font-bold rounded-[2px] shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 border border-[#0870B8]/20 cursor-pointer"
          >
            <Phone size={13} className="shrink-0" /> 
            <span className="tracking-wide text-[11px] sm:text-xs font-bold whitespace-nowrap">โทรติดต่อทันที</span>
          </button>

          <button 
            onClick={handleLineClick} 
            className={`w-7 h-7 sm:w-8 sm:h-8 text-white rounded-[2px] flex items-center justify-center shadow-xs hover:shadow-md active:scale-95 transition-all shrink-0 cursor-pointer ${partner.lineUrl ? 'bg-[#06C755] hover:bg-[#05b34c]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            title={partner.lineUrl ? "ติดต่อผ่าน LINE" : "ยังไม่มีข้อมูล LINE"}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.302.079.771.038 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.573-3.843 2.573-5.992z"/>
            </svg>
          </button>

          <button 
            onClick={handleMessengerClick} 
            className={`w-7 h-7 sm:w-8 sm:h-8 text-white rounded-[2px] flex items-center justify-center shadow-xs hover:shadow-md active:scale-95 transition-all shrink-0 cursor-pointer ${partner.messengerUrl ? 'bg-[#0084FF] hover:bg-[#0073e6]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            title={partner.messengerUrl ? "ติดต่อผ่าน Messenger" : "ยังไม่มีข้อมูล Messenger"}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.888-3.259-6.558 6.963z"/>
            </svg>
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default PartnerSupportBox;
