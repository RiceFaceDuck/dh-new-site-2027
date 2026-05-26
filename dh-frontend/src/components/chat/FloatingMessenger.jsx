/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, X, MapPin, Phone, 
  Loader2, Navigation, AlertCircle, Sparkles, ExternalLink, Headphones, Store, ShieldCheck
} from 'lucide-react';
import { findNearestPartner, getUserCurrentLocation } from '../../firebase/partnerLocationService'; 

const FloatingMessenger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('menu'); 
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    // รับสัญญาณเมื่อคลิกนามบัตรจากหน้าเว็บ
    const handleOpenPartnerChat = (event) => {
      const partnerData = event.detail?.partner;
      if (partnerData) {
        setPartner(partnerData);
        setMode('partner_context');
        setIsOpen(true);
        setShowTooltip(false);
      }
    };
    window.addEventListener('open_partner_chat', handleOpenPartnerChat);
    return () => window.removeEventListener('open_partner_chat', handleOpenPartnerChat);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleFindNearestPartner = async () => {
    setMode('radar');
    setLoading(true);
    setError(null);
    setPartner(null);

    try {
      const location = await getUserCurrentLocation();
      const nearest = await findNearestPartner(location.latitude, location.longitude, 30);
      
      setTimeout(() => {
        if (nearest) {
          setPartner(nearest);
          setMode('result');
        } else {
          setError("ยังไม่มีร้านพาร์ทเนอร์ ในรัศมีพื้นที่ของคุณครับ");
          setMode('menu');
        }
        setLoading(false);
      }, 1500);
    } catch (err) {
      if (err.message.includes("Permission")) setError("กรุณาเปิด GPS บนอุปกรณ์เพื่อค้นหาร้านใกล้เคียง");
      else setError("เกิดข้อผิดพลาดในการค้นหาพิกัด");
      setLoading(false);
      setMode('menu');
    }
  };

  const toggleMessenger = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    setShowTooltip(false);
    if (!nextState) setTimeout(() => setMode('menu'), 300); 
  };

  // 🚀 ระบบเปิดลิงก์อัตโนมัติ (เติม https:// ให้ทันทีถ้าไม่มี เพื่อแก้บั๊ก m.me)
  const openLink = (url) => {
    if (!url) return;
    let finalUrl = url;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
      <div className={`pointer-events-auto mb-4 w-[320px] sm:w-[360px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}>
        
        <div className={`p-5 text-white flex justify-between items-center relative overflow-hidden transition-colors duration-500 ${mode === 'partner_context' || mode === 'result' ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-indigo-600 to-[#0870B8]'}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              {mode === 'partner_context' || mode === 'result' ? <Store size={22}/> : <Headphones size={22}/>}
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide">{mode === 'partner_context' || mode === 'result' ? 'ข้อมูลพาร์ทเนอร์' : 'ศูนย์ช่วยเหลือ DH'}</h3>
              <p className="text-[10px] text-white/80 font-medium uppercase tracking-widest flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_5px_rgba(110,231,183,0.8)]"></span>Online & Ready</p>
            </div>
          </div>
          <button onClick={toggleMessenger} className="p-2 hover:bg-white/20 rounded-full transition-all hover:rotate-90 relative z-10"><X size={20} strokeWidth={2.5} /></button>
        </div>

        <div className="p-5 bg-slate-50/50 min-h-[260px] flex flex-col relative">
          
          {/* ==================== MENU MODE ==================== */}
          {mode === 'menu' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
               {error && (<div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-medium p-3 rounded-xl flex items-start gap-2 shadow-sm"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span></div>)}
              <div className="flex items-center justify-between mb-2 px-1"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">คุณต้องการติดต่อเรื่องใด?</p></div>
              <a href="https://lin.ee/your-line-id" target="_blank" rel="noreferrer" className="w-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 shadow-inner"><MessageCircle size={22} /></div>
                <div className="text-left flex-1"><h4 className="font-bold text-sm text-slate-800">ติดต่อแอดมิน DH Notebook</h4><p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">สอบถามสั่งซื้อสินค้า / เคลมประกัน</p></div><ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
              </a>
              <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or</span><div className="flex-grow border-t border-slate-200"></div></div>
              <button onClick={handleFindNearestPartner} className="w-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 shadow-inner"><MapPin size={22} /></div>
                <div className="text-left flex-1"><h4 className="font-bold text-sm text-slate-800">หาร้านซ่อมใกล้ฉัน</h4><p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">ค้นหาพาร์ทเนอร์ผ่านระบบ GPS</p></div>
              </button>
            </div>
          )}

          {/* ==================== RADAR MODE ==================== */}
          {mode === 'radar' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in duration-300 py-6">
              <div className="relative flex items-center justify-center w-32 h-32">
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-30"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center z-10 shadow-lg border border-white"><Navigation size={26} className="text-emerald-600 animate-pulse drop-shadow-sm" /></div>
              </div>
              <div><p className="text-sm font-black text-slate-700 uppercase">กำลังสแกนหาพิกัด...</p><p className="text-xs text-slate-500 mt-1 font-medium">ระบบกำลังคำนวณระยะทาง</p></div>
            </div>
          )}

          {/* ==================== RESULT MODE ==================== */}
          {(mode === 'result' || mode === 'partner_context') && partner && (
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
                  {partner.formattedDistance && (<div className="flex justify-center items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 w-max mx-auto px-3 py-1 rounded-lg"><MapPin size={12} className="text-rose-500" /> ห่างจากคุณ <span className="font-bold text-emerald-600">{partner.formattedDistance}</span></div>)}
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

              {/* 🚀 ปุ่มโทร และ ปุ่ม FB Messenger */}
              <div className="flex flex-col gap-2 mt-auto">
                {/* ปุ่มแชท FB (ดึงจาก Store Data โดยตรง) */}
                {(partner.messengerUrl || partner.facebookMapLink) && (
                  <button onClick={() => openLink(partner.messengerUrl || partner.facebookMapLink)} className="w-full py-3.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(24,119,242,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">
                    <MessageCircle size={18}/> ทักแชท Facebook Messenger
                  </button>
                )}
                
                {/* ปุ่มโทรศัพท์ */}
                {partner.phone && (
                  <button onClick={() => window.location.href = `tel:${partner.phone}`} className="w-full py-3.5 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 text-sm">
                    <Phone size={18}/> โทร: {partner.phone}
                  </button>
                )}
                
                {/* ลิงก์ทั่วไป (Website/Shopee/Map) */}
                {partner.targetUrl && partner.targetUrl !== partner.messengerUrl && (
                  <button onClick={() => openLink(partner.targetUrl)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
                    <ExternalLink size={14}/> ดูข้อมูลเพิ่มเติม
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex items-center pointer-events-auto">
        <div className={`absolute right-full mr-5 bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 whitespace-nowrap flex items-center gap-2.5 transition-all duration-500 ${showTooltip && !isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
          <div><p className="text-xs font-bold tracking-wide">ต้องการความช่วยเหลือ?</p><p className="text-[9px] text-slate-400 mt-0.5">ติดต่อแอดมิน หรือ หาร้านซ่อมใกล้คุณ</p></div><div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-800 border-r border-b border-slate-700 transform -rotate-45"></div>
        </div>

        <div className="relative group cursor-pointer" onClick={toggleMessenger}>
          <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 pointer-events-none ${isOpen ? 'bg-rose-500/30 scale-110' : 'bg-indigo-600/40 group-hover:bg-indigo-600/60 animate-pulse scale-125'}`}></div>
          <button className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 transform ${isOpen ? 'bg-slate-800 rotate-90 scale-90 hover:bg-rose-500' : 'bg-gradient-to-br from-indigo-500 via-[#0870B8] to-blue-600 hover:scale-110 hover:-translate-y-1'}`}>
            {isOpen ? <X size={26} strokeWidth={2.5}/> : <MessageCircle size={28} strokeWidth={2.5} />}
            {!isOpen && <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-bounce shadow-sm"></span>}
          </button>
        </div>
      </div>
    </div>
  );
};
export default FloatingMessenger;