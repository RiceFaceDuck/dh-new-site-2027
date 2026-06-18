import React from 'react';
import { ShieldCheck, Store, MapPin, MessageCircle, Phone, ExternalLink } from 'lucide-react';

const MessengerResult = ({ partner, setMode, openLink }) => {
  if (!partner) return null;
  
  return (
    <div className="space-y-4 animate-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => setMode('menu')} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-2 py-1 rounded-lg">← กลับเมนูหลัก</button>
        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-widest"><ShieldCheck size={12}/> Verified</div>
      </div>

      <div className="text-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden flex-1 flex flex-col justify-center">
        <Store className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 rotate-12 z-0" />
        <div className="relative z-10">
          <h4 className="font-black text-xl text-slate-800 leading-tight mb-2">
            {partner.storeName || partner.partnerName || partner.customerName || 'DH Partner'}
          </h4>
          {partner.formattedDistance && (
            <div className="flex justify-center items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 w-max mx-auto px-3 py-1 rounded-lg">
              <MapPin size={12} className="text-rose-500" /> ห่างจากคุณ <span className="font-bold text-emerald-600">{partner.formattedDistance}</span>
            </div>
          )}
          {partner.services && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">บริการของทางร้าน:</p>
              <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">{partner.services}</p>
            </div>
          )}
          {partner.description && (
            <div className="mt-2 text-left">
              <p className="text-xs text-slate-600 font-medium bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">{partner.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        {(partner.messengerUrl || partner.facebookMapLink) && (
          <button onClick={() => openLink(partner.messengerUrl || partner.facebookMapLink)} className="w-full py-3.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(24,119,242,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">
            <MessageCircle size={18}/> ทักแชท Facebook Messenger
          </button>
        )}
        
        {partner.phone && (
          <button onClick={() => window.location.href = `tel:${partner.phone}`} className="w-full py-3.5 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">
            <Phone size={18}/> โทร: {partner.phone}
          </button>
        )}
        
        {partner.targetUrl && partner.targetUrl !== partner.messengerUrl && (
          <button onClick={() => openLink(partner.targetUrl)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
            <ExternalLink size={14}/> ดูข้อมูลเพิ่มเติม
          </button>
        )}
      </div>
    </div>
  );
};

export default MessengerResult;
