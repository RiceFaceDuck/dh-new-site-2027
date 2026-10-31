import React from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, ShoppingBag, Phone, X, MessageCircle, ShieldCheck, Navigation } from 'lucide-react';
import LazyImage from '../common/LazyImage';

/**
 * 🌟 ProductAdModal (Mobile-First Ad Details Modal)
 * Extracted from ProductAdCard for SRP & Clean Architecture.
 * UI Border Radius 0.1 (rounded-[2px]) on containers/cards; button radii preserved.
 */
const ProductAdModal = ({
  isOpen,
  onClose,
  ad,
  safeImageUrl,
  isProduct = false,
  openLink
}) => {
  if (!isOpen || !ad) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-xs sm:p-4 transition-all animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="w-full max-w-md bg-slate-50 rounded-t-[2px] sm:rounded-[2px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle (Visual only) */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 z-20">
          <div className="w-12 h-1.5 bg-white/40 rounded-full backdrop-blur-md"></div>
        </div>

        {/* Close Button (Button radius preserved) */}
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2.5}/>
        </button>

        {/* 🏙️ Cover Image & Partner Info */}
        <div className="w-full h-44 sm:h-52 bg-slate-200 relative shrink-0">
          <LazyImage src={safeImageUrl} alt={ad.title || 'Ad Cover'} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
          
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            <div className="w-16 h-16 bg-white rounded-[2px] p-1 shadow-lg shrink-0 border border-white/20">
              <LazyImage src={safeImageUrl} alt="Partner" className="w-full h-full object-contain rounded-[2px]" />
            </div>
            <div className="pb-1 text-white flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/90 backdrop-blur-xs border border-emerald-400/50 px-2 py-0.5 rounded-[2px] shadow-xs flex items-center gap-1">
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
              <p className="text-sm text-slate-600 leading-relaxed bg-white p-3.5 rounded-[2px] border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                {ad.description}
              </p>
            )}
            {ad.price && (
              <div className="mt-3 flex items-center gap-1.5 bg-emerald-50 w-max px-3 py-1.5 rounded-[2px] border border-emerald-100">
                <span className="text-xs text-emerald-600 font-bold uppercase tracking-widest">ราคาโปรโมชั่น</span>
                <span className="text-lg font-black text-emerald-700 tracking-tight">฿{Number(ad.price).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Trust Indicator */}
          <div className="flex items-start gap-3 bg-indigo-50/50 p-3.5 rounded-[2px] border border-indigo-100/50">
            <Navigation size={20} className="text-indigo-500 shrink-0 mt-0.5"/>
            <div>
              <p className="text-xs font-bold text-indigo-900 mb-0.5">บริการและสินค้าได้รับการยืนยัน</p>
              <p className="text-[11px] text-indigo-700/80 leading-relaxed">ข้อมูลการติดต่อได้รับการตรวจสอบจากระบบ DH มั่นใจ ปลอดภัย 100%</p>
            </div>
          </div>

          {/* 🎯 Action Buttons (Button styling preserved) */}
          <div className="space-y-3 pt-2">
            {ad.phone && (
              <a 
                href={`tel:${ad.phone}`} 
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm"
              >
                <Phone size={18}/> โทรติดต่อ: {ad.phone}
              </a>
            )}
            
            {ad.messengerUrl && (
              <button 
                type="button"
                onClick={() => openLink && openLink(ad.messengerUrl)} 
                className="w-full py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(24,119,242,0.3)] transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm"
              >
                <MessageCircle size={18}/> ทักแชท Facebook Messenger
              </button>
            )}

            {ad.targetUrl && (
              <button 
                type="button"
                onClick={() => openLink && openLink(ad.targetUrl)} 
                className="w-full py-4 bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2.5 active:scale-95 text-sm group"
              >
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

export default React.memo(ProductAdModal);
