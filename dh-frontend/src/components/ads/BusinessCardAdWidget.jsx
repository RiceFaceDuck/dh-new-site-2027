/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Store, ShoppingBag, Phone, X, MessageCircle, ShieldCheck, Navigation, Sparkles } from 'lucide-react';
import { marketingService } from '../../../firebase/marketingService';

const BusinessCardAdWidget = ({ ad }) => {
  const cardRef = useRef(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!cardRef.current || hasTrackedView || !ad?.id || ad.id === 'preview-mode') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          marketingService.trackAdView('partner_ads', ad.id);
          setHasTrackedView(true);
          observer.disconnect(); 
        }
      },
      { threshold: 0.5 } 
    );

    observer.observe(cardRef.current);
    return () => { if (observer) observer.disconnect(); };
  }, [ad, hasTrackedView]);

  const handleAdClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (ad?.id && ad.id !== 'preview-mode') {
      marketingService.trackAdClick('partner_ads', ad.id);
    }

    setIsModalOpen(true);
  };

  const closeModal = (e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
  };

  const openLink = (url) => {
    if (!url) return;
    let finalUrl = url;
    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('tel:')) finalUrl = 'https://' + finalUrl;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  if (!ad) return null;

  const isBusiness = ad.type === 'BUSINESS_CARD';

  // ==========================================
  // 🌟 UI ของ Modal Pop-up (Mobile First)
  // ==========================================
  const renderModal = () => {
    if (!isModalOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all animate-in fade-in duration-300" onClick={closeModal}>
        
        <div 
          className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]" 
          onClick={e => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 z-20">
            <div className="w-12 h-1.5 bg-white/40 rounded-full backdrop-blur-md"></div>
          </div>

          <button onClick={closeModal} className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90">
            <X size={18} strokeWidth={2.5}/>
          </button>

          {/* 🏙️ Cover Image & Partner Info */}
          <div className="w-full h-44 sm:h-52 bg-slate-200 relative shrink-0">
            <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
            
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
               <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-lg shrink-0 border border-white/20">
                 <img src={ad.imageUrl} className="w-full h-full object-cover rounded-xl" />
               </div>
               <div className="pb-1 text-white flex-1">
                 <div className="flex items-center gap-1.5 mb-1.5">
                   <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/50 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                     <ShieldCheck size={12}/> Verified Partner
                   </span>
                 </div>
                 <h3 className="font-black text-lg leading-tight line-clamp-1 drop-shadow-md">
                   {ad.partnerName || 'DH Partner'}
                 </h3>
               </div>
            </div>
          </div>

          {/* 📄 Content Area */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
             
             <div>
               <h4 className="font-bold text-slate-800 text-lg mb-2 leading-snug">{ad.title}</h4>
               {ad.description && (
                 <p className="text-sm text-slate-600 leading-relaxed bg-white p-3.5 rounded-2xl border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                   {ad.description}
                 </p>
               )}
             </div>

             <div className="flex items-start gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/50">
               <Navigation size={20} className="text-indigo-500 shrink-0 mt-0.5"/>
               <div>
                 <p className="text-xs font-bold text-indigo-900 mb-0.5">บริการโดยพาร์ทเนอร์ที่ผ่านการตรวจสอบ</p>
                 <p className="text-[11px] text-indigo-700/80 leading-relaxed">ข้อมูลการติดต่อได้รับการยืนยันตัวตนจากระบบ DH เรียบร้อยแล้ว มั่นใจได้ 100%</p>
               </div>
             </div>

             {/* 🎯 Action Buttons */}
             <div className="space-y-3 pt-2">
               {ad.phone && (
                 <a href={`tel:${ad.phone}`} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm">
                   <Phone size={18}/> โทรติดต่อร้าน: {ad.phone}
                 </a>
               )}
               
               {ad.messengerUrl && (
                 <button onClick={() => openLink(ad.messengerUrl)} className="w-full py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(24,119,242,0.3)] transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm">
                   <MessageCircle size={18}/> ทักแชท Facebook Messenger
                 </button>
               )}

               {ad.targetUrl && (
                 <button onClick={() => openLink(ad.targetUrl)} className="w-full py-4 bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm group">
                   <Store size={18}/> ดูรายละเอียดเพิ่มเติม
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div 
        ref={cardRef}
        onClick={handleAdClick}
        className="group relative flex flex-col h-full bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-slate-100 hover:ring-indigo-100/80 transform hover:-translate-y-1"
      >
        
        {/* 🏷️ Premium Sponsored Badge */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 bg-slate-900/60 backdrop-blur-md border border-white/20 rounded text-white shadow-sm">
          <Sparkles size={8} className="text-amber-400" />
          <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Sponsored</span>
        </div>

        {/* 🖼️ Image Section */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
          <img 
            src={ad.imageUrl} 
            alt={ad.title || 'Advertisement'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* 📝 Content Section */}
        <div className="p-3.5 flex flex-col flex-grow justify-between bg-gradient-to-b from-white to-slate-50/30">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              <Store size={10}/>
              <span className="truncate">{ad.partnerName || 'DH Partner'}</span>
            </div>

            <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
              {ad.title}
            </h3>

            {isBusiness && ad.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {ad.description}
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500"/> Verified
            </div>
            
            <button className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors group/btn">
              <span className="text-[10px] font-bold uppercase tracking-wider">ติดต่อร้านค้า</span>
            </button>
          </div>

        </div>
      </div>

      {renderModal()}
    </>
  );
};

export default BusinessCardAdWidget;