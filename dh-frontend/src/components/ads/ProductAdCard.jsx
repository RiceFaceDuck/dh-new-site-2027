 
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Store, ShoppingBag, Phone, X, MessageCircle, ShieldCheck, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { marketingService } from '../../firebase/marketingService';
import LazyImage from '../common/LazyImage';
import { getRenderableImageUrl } from '../../utils/imageUtils';
import { fetchAllActivePartners } from '../../firebase/partnerLocationService';
import { calculateDistance } from '../../utils/geoUtils';

const ProductAdCard = ({ ad }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [distanceText, setDistanceText] = useState(ad.formattedDistance || null);

  useEffect(() => {
    if (ad.formattedDistance) {
      setDistanceText(ad.formattedDistance);
      return;
    }
    if (ad.type === 'PRODUCT_LINK') return;

    let isMounted = true;
    const resolveDistance = async () => {
      try {
        const locStr = sessionStorage.getItem('dh_user_location');
        if (!locStr) return;
        const { lat, lng } = JSON.parse(locStr);
        if (!lat || !lng) return;

        const partners = await fetchAllActivePartners();
        const partnerId = ad.ownerId || ad.partnerId || (ad.id?.startsWith('AD-CARD-') ? ad.id.replace('AD-CARD-', '') : ad.id);
        const matched = partners.find(p => (p.id || p.partnerId || p.userId) === partnerId);

        if (matched && matched.latitude && matched.longitude && isMounted) {
          const distKm = calculateDistance(lat, lng, matched.latitude, matched.longitude);
          const formatted = distKm < 1 ? `${Math.round(distKm * 1000)} เมตร` : `${distKm.toFixed(1)} กม.`;
          setDistanceText(formatted);
        }
      } catch (e) {
        console.warn("Could not calculate distance for ad", e);
      }
    };

    resolveDistance();
    return () => { isMounted = false; };
  }, [ad]);

  // ==========================================
  // 👁️ 1. ระบบตรวจจับการมองเห็น (Real View Tracking)
  // ==========================================
  useEffect(() => {
    if (!cardRef.current || hasTrackedView || !ad?.id || ad.id === 'preview-mode') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const collectionName = ad._collection || (ad.type === 'PRODUCT_LINK' ? 'user_sku_ads' : 'partner_ads');
          marketingService.trackAdView(collectionName, ad.id, ad);
          setHasTrackedView(true);
          observer.disconnect(); 
        }
      },
      { threshold: 0.5 } 
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [ad, hasTrackedView]);

  // ==========================================
  // 🖱️ 2. ระบบจัดการการคลิกและเปิด Pop-up
  // ==========================================
  const openLink = (url) => {
    if (!url) return;
    let finalUrl = url;
    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('tel:')) finalUrl = 'https://' + finalUrl;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAdClick = (e) => {
    e.stopPropagation();

    if (ad?.id && ad.id !== 'preview-mode') {
      const collectionName = ad._collection || (ad.type === 'PRODUCT_LINK' ? 'user_sku_ads' : 'partner_ads');
      marketingService.trackAdClick(collectionName, ad.id, ad);
    }

    if (ad?.id === 'preview-mode') {
       setIsModalOpen(true);
       return;
    }

    if (ad?.type === 'BUSINESS_CARD') {
       navigate(`/store/${ad.ownerId || ad.partnerId || 'unknown'}`);
    } else if (ad?.targetUrl) {
       openLink(ad.targetUrl);
    } else {
       setIsModalOpen(true);
    }
  };

  const closeModal = (e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
  };

  if (!ad) return null;

  const rawImage = ad.imageUrl || ad.imageurl || ad.image || (ad.images && ad.images[0]) || ad.img || ad.picture || ad.photo || ad.storeImage || ad.avatar || ad.photoURL || ad.profileImage || (ad.storeProfile && ad.storeProfile.logoUrl) || '/logo.png';
  const safeImageUrl = getRenderableImageUrl(rawImage);

  const isProduct = ad.type === 'PRODUCT_LINK';

  // ==========================================
  // 🌟 3. UI ของ Modal Pop-up (Mobile First)
  // ==========================================
  const renderModal = () => {
    if (!isModalOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-9999 flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-xs sm:p-4 transition-all animate-in fade-in duration-300" onClick={closeModal}>
        
        {/* Modal Container */}
        <div 
          className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]" 
          onClick={e => e.stopPropagation()}
        >
          {/* Mobile Drag Handle (Visual only) */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 z-20">
            <div className="w-12 h-1.5 bg-white/40 rounded-full backdrop-blur-md"></div>
          </div>

          {/* Close Button */}
          <button onClick={closeModal} className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90">
            <X size={18} strokeWidth={2.5}/>
          </button>

          {/* 🏙️ Cover Image & Partner Info */}
          <div className="w-full h-44 sm:h-52 bg-slate-200 relative shrink-0">
            <LazyImage src={safeImageUrl} alt={ad.title} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
            
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
               <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg shrink-0 border border-white/20">
                 <LazyImage src={safeImageUrl} alt="Partner" className="w-full h-full object-contain rounded-xl" />
               </div>
               <div className="pb-1 text-white flex-1">
                 <div className="flex items-center gap-1.5 mb-1.5">
                   <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/90 backdrop-blur-xs border border-emerald-400/50 px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
                     <ShieldCheck size={12}/> Verified Partner
                   </span>
                 </div>
                 <h3 className="font-black text-lg leading-tight line-clamp-1 drop-shadow-md">
                   {ad.partnerName || ad.customerName || 'DH Partner'}
                 </h3>
               </div>
            </div>
          </div>

          {/* 📄 Content Area (Scrollable) */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
             
             {/* Title & Desc */}
             <div>
               <h4 className="font-bold text-slate-800 text-lg mb-2 leading-snug">{ad.title}</h4>
               {ad.description && (
                 <p className="text-sm text-slate-600 leading-relaxed bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                   {ad.description}
                 </p>
               )}
               {ad.price && (
                 <div className="mt-3 flex items-center gap-1.5 bg-emerald-50 w-max px-3 py-1.5 rounded-xl border border-emerald-100">
                   <span className="text-xs text-emerald-600 font-bold uppercase tracking-widest">ราคาโปรโมชั่น</span>
                   <span className="text-lg font-black text-emerald-700 tracking-tight">฿{Number(ad.price).toLocaleString()}</span>
                 </div>
               )}
             </div>

             {/* Trust Indicator */}
             <div className="flex items-start gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/50">
               <Navigation size={20} className="text-indigo-500 shrink-0 mt-0.5"/>
               <div>
                 <p className="text-xs font-bold text-indigo-900 mb-0.5">บริการและสินค้าได้รับการยืนยัน</p>
                 <p className="text-[11px] text-indigo-700/80 leading-relaxed">ข้อมูลการติดต่อได้รับการตรวจสอบจากระบบ DH มั่นใจ ปลอดภัย 100%</p>
               </div>
             </div>

             {/* 🎯 Action Buttons (ปุ่มติดต่อ) */}
             <div className="space-y-3 pt-2">
               {/* 📞 ปุ่มโทร (เด่นชัด) */}
               {ad.phone && (
                 <a href={`tel:${ad.phone}`} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm">
                   <Phone size={18}/> โทรติดต่อ: {ad.phone}
                 </a>
               )}
               
               {/* 💬 ปุ่ม FB Messenger */}
               {ad.messengerUrl && (
                 <button onClick={() => openLink(ad.messengerUrl)} className="w-full py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(24,119,242,0.3)] transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm">
                   <MessageCircle size={18}/> ทักแชท Facebook Messenger
                 </button>
               )}

               {/* 🔗 ปุ่มเปิดลิงก์สินค้า */}
               {ad.targetUrl && (
                 <button onClick={() => openLink(ad.targetUrl)} className="w-full py-4 bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm group">
                   {isProduct ? <ShoppingBag size={18}/> : <ExternalLink size={18}/>} 
                   {isProduct ? 'เข้าชมสินค้า / สั่งซื้อ' : 'ดูรายละเอียดเพิ่มเติม'}
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ==========================================
  // 🖼️ 4. หน้าตาของการ์ดโฆษณาบนหน้าเว็บปกติ
  // ==========================================
  return (
    <>
      <div 
        ref={cardRef}
        className="group relative flex flex-col h-full cursor-pointer bg-slate-100 p-2 md:p-3 rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-300 hover:shadow-premium-hover transition-all duration-300 animate-in fade-in"
      >
        {/* 🖼️ พื้นที่รูปภาพ */}
        <div 
          className="relative aspect-square w-full bg-white rounded-lg flex items-center justify-center overflow-hidden mb-2 cursor-pointer"
          onClick={handleAdClick}
        >
          <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-50 pointer-events-none"></div>
          <LazyImage 
            src={safeImageUrl} 
            alt={ad.title || 'Advertisement'} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
          />
          
          {/* 🏷️ ป้ายมุมบนซ้าย (ระยะทางสำหรับนามบัตรช่าง / Sponsored สำหรับสินค้า) */}
          {ad.isSponsoredAd && (
            isProduct ? (
              <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 bg-slate-800/90 backdrop-blur-xs px-2 py-1 rounded-md border border-slate-700/50 shadow-xs z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                <span className="text-[9px] md:text-[10px] font-bold text-white uppercase tracking-wider">
                  SPONSORED
                </span>
              </div>
            ) : (
              <div className="absolute top-1.5 left-1.5 max-w-[85%] flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-[0.1rem] border border-slate-200 shadow-2xs z-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] md:text-[11px] font-bold text-slate-800 tracking-tight truncate">
                  {distanceText ? `ห่างออกไป ${distanceText}` : 'ไม่ทราบระยะทาง'}
                </span>
              </div>
            )
          )}
        </div>

        {/* 📝 พื้นที่เนื้อหา */}
        <div className="flex flex-col grow px-1 cursor-pointer" onClick={handleAdClick}>
          <h3 
            className="text-sm md:text-base font-bold text-slate-800 leading-snug mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 break-words" 
            title={ad.title}
          >
            {ad.title}
          </h3>
          {(() => {
            const rawDisplayName = ad.partnerName || ad.customerName || 'DH Partner';
            const isTitleSameAsName = ad.title?.trim().toLowerCase() === rawDisplayName.trim().toLowerCase();
            const shopBio = ad.description || ad.services || ad.role || (isProduct ? 'สินค้าแนะนำ' : 'Official Partner');
            const displaySubtitle = isTitleSameAsName ? shopBio : (ad.description ? `${rawDisplayName} - ${ad.description}` : rawDisplayName);
            
            return (
              <div className="text-[11px] md:text-xs text-slate-600 leading-snug line-clamp-3 mb-2 flex items-start gap-1">
                {isProduct ? <ShoppingBag size={12} className="shrink-0 mt-0.5 text-slate-400"/> : <Store size={12} className="shrink-0 mt-0.5 text-slate-400"/>}
                <span className="break-words">{displaySubtitle || shopBio}</span>
              </div>
            );
          })()}

          {/* 💰 ปุ่ม Call to Action */}
          <div className="mt-auto flex flex-col pt-1">
            {isProduct && ad.price && (
              <div className="text-base md:text-lg font-bold text-slate-800 leading-none mb-2.5 h-5 flex items-center">
                ฿{Number(ad.price).toLocaleString()}
              </div>
            )}

            <button 
              className={`w-full py-2 rounded-md flex items-center justify-center transition-all duration-300 shadow-md z-20 text-xs md:text-sm font-bold active:scale-95 ${
                isProduct 
                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white uppercase tracking-wider' 
                  : 'bg-slate-800 text-white hover:bg-indigo-600 hover:shadow-indigo-500/30'
              }`}
            >
              {isProduct ? 'เข้าชมสินค้า' : 'ติดต่อทันที'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 🔮 Render Pop-up (ถูกแยกออกไปอยู่นอกสุดของ DOM เพื่อไม่ให้โดนบัง) */}
      {renderModal()}
    </>
  );
};

export default React.memo(ProductAdCard);