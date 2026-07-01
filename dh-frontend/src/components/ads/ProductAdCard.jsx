/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Store, ShoppingBag, Phone, X, MessageCircle, ShieldCheck, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { marketingService } from '../../firebase/marketingService';

const ProductAdCard = ({ ad }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================
  // 👁️ 1. ระบบตรวจจับการมองเห็น (Real View Tracking)
  // ==========================================
  useEffect(() => {
    if (!cardRef.current || hasTrackedView || !ad?.id || ad.id === 'preview-mode') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const collectionName = ad._collection || (ad.type === 'PRODUCT_LINK' ? 'user_sku_ads' : 'partner_ads');
          marketingService.trackAdView(collectionName, ad.id);
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
      marketingService.trackAdClick(collectionName, ad.id);
    }

    if (ad?.id === 'preview-mode') {
       setIsModalOpen(true);
       return;
    }

    if (ad?.type === 'BUSINESS_CARD') {
       navigate(`/store/${ad.ownerId || ad.partnerId || 'unknown'}`);
    } else if (ad?.type === 'PRODUCT_LINK') {
       if (ad.targetUrl) openLink(ad.targetUrl);
       navigate(`/ad/product/${ad.id}`);
    } else {
       setIsModalOpen(true);
    }
  };

  const closeModal = (e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
  };

  if (!ad) return null;

  const isProduct = ad.type === 'PRODUCT_LINK';

  // ==========================================
  // 🌟 3. UI ของ Modal Pop-up (Mobile First)
  // ==========================================
  const renderModal = () => {
    if (!isModalOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-sm sm:p-4 transition-all animate-in fade-in duration-300" onClick={closeModal}>
        
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
                 <button onClick={() => openLink(ad.targetUrl)} className="w-full py-4 bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm group">
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
        className="group relative flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-slate-100 hover:ring-indigo-100 transform hover:-translate-y-1"
      >
        {/* 🏷️ ป้าย Sponsored */}
        {ad.isSponsoredAd && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 bg-slate-900/60 backdrop-blur-md border border-white/20 rounded text-md shadow-sm">
            <span className="text-[8px] font-black text-white uppercase tracking-widest mt-0.5">Sponsored</span>
          </div>
        )}

        {/* 🖼️ พื้นที่รูปภาพ */}
        <div 
          className="relative aspect-square w-full overflow-hidden bg-slate-50 cursor-pointer"
          onClick={handleAdClick}
        >
          <img 
            src={ad.imageUrl} 
            alt={ad.title || 'Advertisement'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* 📝 พื้นที่เนื้อหา */}
        <div className="p-3.5 flex flex-col flex-grow justify-between bg-gradient-to-b from-white to-slate-50/30 cursor-pointer" onClick={handleAdClick}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {isProduct ? <ShoppingBag size={10}/> : <Store size={10}/>}
              <span className="truncate">{ad.partnerName || ad.customerName || 'DH Partner'}</span>
            </div>

            <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
              {ad.title}
            </h3>

            {ad.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {ad.description}
              </p>
            )}
            
            {/* ❌ เอาเบอร์โทรออกจากการ์ดหลัก เพื่อให้ต้องคลิกเข้ามาดูใน Pop-up เท่านั้น */}
          </div>

          {/* 💰 ปุ่ม Call to Action */}
          <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between">
            {isProduct && ad.price ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium">฿</span>
                <span className="text-base font-black text-emerald-600 tracking-tight">
                  {Number(ad.price).toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500"/> Verified
              </div>
            )}

            {/* 🚀 ปุ่มเปลี่ยนเป็น "เข้าชมสินค้า" หรือ "ติดต่อร้านค้า" */}
            <button 
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors group/btn"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isProduct ? 'เข้าชมสินค้า' : 'ติดต่อร้านค้า'}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 🔮 Render Pop-up (ถูกแยกออกไปอยู่นอกสุดของ DOM เพื่อไม่ให้โดนบัง) */}
      {renderModal()}
    </>
  );
};

export default ProductAdCard;