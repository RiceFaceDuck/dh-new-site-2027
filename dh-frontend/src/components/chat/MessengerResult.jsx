import React, { useState } from 'react';
import { ShieldCheck, Store, MapPin, MessageCircle, Phone, ExternalLink, Sparkles, Compass } from 'lucide-react';

const MessengerResult = ({ partner, setMode, openLink, onFindOtherPartner, totalPartners = 0, partnerIndex = 0 }) => {
  const [imgError, setImgError] = useState(false);
  if (!partner) return null;

  const photoUrl = !imgError && (
    partner.storeImage || 
    partner.imageUrl || 
    partner.storeLogoUrl || 
    partner.profileImage || 
    partner.image || 
    partner.avatar || 
    partner.photoURL ||
    (partner.galleryImages && partner.galleryImages[0])
  );
  
  return (
    <div className="space-y-3.5 animate-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => setMode('menu')} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-2 py-1 rounded-lg">← กลับเมนูหลัก</button>
        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-widest"><ShieldCheck size={12}/> Verified</div>
      </div>

      <div className="text-center p-2 relative flex-1 flex flex-col justify-center">
        <div className="relative z-10">
          
          {/* 🌟 ภาพโปรไฟล์ ขนาดเล็ก */}
          <div className="flex justify-center mb-2.5">
            <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-emerald-500/20 shadow-xs bg-emerald-50 flex items-center justify-center shrink-0">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={partner.storeName || 'Partner'} 
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <Store size={22} className="text-emerald-600" />
              )}
            </div>
          </div>

          <h4 className="font-black text-xl text-slate-800 leading-tight mb-1.5">
            {partner.storeName || partner.partnerName || partner.customerName || 'DH Partner'}
          </h4>

          {/* 🌟 ความเด่น "ห่างจากคุณ X XX" ขยายใหญ่ 1 ระดับ (text-sm) + วิบวับเล็กน้อย (Sparkles + pulse) + ไร้ขอบ/Shapes */}
          {partner.formattedDistance && (
            <div className="flex justify-center items-center gap-1.5 text-sm font-semibold text-slate-600 my-1">
              <MapPin size={15} className="text-rose-500 shrink-0" />
              <span>ห่างจากคุณ</span>
              <span className="font-black text-emerald-600 inline-flex items-center gap-1 tracking-wide">
                {partner.formattedDistance}
                <Sparkles size={14} className="text-amber-400 animate-pulse shrink-0" />
              </span>
            </div>
          )}

          {partner.services && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">บริการของทางร้าน:</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{partner.services}</p>
            </div>
          )}
          {partner.description && (
            <div className="mt-2 text-left">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{partner.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto pt-2">
        {(partner.messengerUrl || partner.facebookMapLink) && (
          <button 
            onClick={() => openLink(partner.messengerUrl || partner.facebookMapLink)} 
            className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-extrabold rounded-xl border-t border-white/25 border-b-[3px] border-b-[#0e56b4] shadow-[0_3px_6px_rgba(24,119,242,0.25)] active:translate-y-[2px] active:border-b transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <MessageCircle size={16}/> Messenger
          </button>
        )}
        
        {partner.phone && (
          <button 
            onClick={() => window.location.href = `tel:${partner.phone}`} 
            className="w-full py-2.5 px-4 bg-white hover:bg-emerald-50/80 text-emerald-700 font-extrabold rounded-xl border border-emerald-500 border-b-[3px] border-b-emerald-600 shadow-[0_2px_4px_rgba(16,185,129,0.15)] active:translate-y-[2px] active:border-b transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Phone size={16}/> โทรปรึกษาเดี๋ยวนี้
          </button>
        )}

        {/* 🌟 ปุ่มค้นหาร้านอื่น */}
        {onFindOtherPartner && (
          <button 
            onClick={onFindOtherPartner}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/90 text-slate-700 font-bold rounded-xl border border-slate-300/80 border-b-[3px] border-b-slate-400/80 shadow-[0_2px_4px_rgba(0,0,0,0.06)] active:translate-y-[2px] active:border-b transition-all flex items-center justify-center gap-1.5 text-[11px] cursor-pointer"
          >
            <Compass size={14} className="text-teal-600" />
            <span>ค้นหาร้านอื่น {totalPartners > 1 ? `(${partnerIndex + 1}/${totalPartners})` : ''}</span>
          </button>
        )}
        
        {partner.targetUrl && partner.targetUrl !== partner.messengerUrl && (
          <button onClick={() => openLink(partner.targetUrl)} className="w-full py-1.5 text-slate-500 hover:text-slate-700 font-medium transition-all flex items-center justify-center gap-1.5 text-[11px]">
            <ExternalLink size={12}/> ดูข้อมูลเพิ่มเติม
          </button>
        )}
      </div>
    </div>
  );
};

export default MessengerResult;
