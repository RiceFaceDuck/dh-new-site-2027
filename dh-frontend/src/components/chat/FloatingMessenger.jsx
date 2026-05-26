/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, X, MapPin, Phone, 
  Wrench, Loader2, Navigation, AlertCircle, Sparkles, ExternalLink, Headphones, Store, ShieldCheck
} from 'lucide-react';

// ใช้ Service ตรวจสอบพิกัด GPS
import { findNearestPartner, getUserCurrentLocation } from '../../firebase/partnerLocationService'; 

/**
 * 🎯 Smart Floating Messenger
 * อัปเกรด: 
 * 1. รองรับการสื่อสาร 2 ทาง (ติดต่อ Admin DH / ติดต่อ Partner)
 * 2. มี Event Listener ดักจับการเปิดแชทจากปุ่มโฆษณาหน้าเว็บ
 * 3. Premium Glassmorphism UI
 */
const FloatingMessenger = () => {
  // ================= State Management =================
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('menu'); // 'menu' | 'radar' | 'result' | 'partner_context'
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);

  // ================= 🧠 Smart Context Listener =================
  // ลูกเล่นใหม่: ดักจับคำสั่งจากภายนอก (เช่น กดปุ่มติดต่อจากการ์ดโฆษณา)
  useEffect(() => {
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

  // ซ่อน Tooltip อัตโนมัติหลังจาก 8 วินาที
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // ================= Core Logic =================
  const handleFindNearestPartner = async () => {
    setMode('radar');
    setLoading(true);
    setError(null);
    setPartner(null);

    try {
      const location = await getUserCurrentLocation();
      const nearest = await findNearestPartner(location.latitude, location.longitude, 30);
      
      // หน่วงเวลาจำลองเรดาร์ให้ผู้ใช้เห็นว่าระบบกำลังทำงาน 1.5 วิ
      setTimeout(() => {
        if (nearest) {
          setPartner(nearest);
          setMode('result');
        } else {
          setError("ขออภัยครับ ยังไม่มีร้านซ่อมพาร์ทเนอร์ ในรัศมีพื้นที่ของคุณในขณะนี้");
          setMode('menu');
        }
        setLoading(false);
      }, 1500);

    } catch (err) {
      console.error("Error locating partner:", err);
      if (err.message.includes("Permission Denied") || err.message.includes("ไม่อนุญาต")) {
        setError("กรุณาเปิด GPS บนอุปกรณ์ของคุณ เพื่อค้นหาร้านซ่อมใกล้เคียงครับ");
      } else {
        setError("เกิดข้อผิดพลาดในการค้นหาพิกัด กรุณาลองใหม่อีกครั้ง");
      }
      setLoading(false);
      setMode('menu');
    }
  };

  const toggleMessenger = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    setShowTooltip(false);
    
    // ถ้าปิด ให้รีเซ็ตกลับหน้าเมนูหลัง Animation จบ
    if (!nextState) {
        setTimeout(() => setMode('menu'), 300); 
    }
  };

  const handleContactClick = (phoneNum) => {
    if (!phoneNum) return;
    // (อนาคต: ฝังการเรียก API หัก Credit Point ตรงนี้ หากต้องการคิดเงินตอนกดโทร)
    window.location.href = `tel:${phoneNum}`;
  };

  // ================= RENDER =================
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
      {/* 🌟 กล่องหน้าต่างรายละเอียด (Glassmorphism Modal) */}
      <div 
        className={`pointer-events-auto mb-4 w-[320px] sm:w-[360px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'
        }`}
      >
        {/* Header Premium */}
        <div className={`p-5 text-white flex justify-between items-center relative overflow-hidden transition-colors duration-500 ${
          mode === 'partner_context' || mode === 'result' ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-indigo-600 to-[#0870B8]'
        }`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              {mode === 'partner_context' || mode === 'result' ? <Store size={22} className="text-white"/> : <Headphones size={22} className="text-white"/>}
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide">
                {mode === 'partner_context' || mode === 'result' ? 'ข้อมูลพาร์ทเนอร์' : 'ศูนย์ช่วยเหลือ DH'}
              </h3>
              <p className="text-[10px] text-white/80 font-medium uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_5px_rgba(110,231,183,0.8)]"></span>
                Online & Ready
              </p>
            </div>
          </div>
          <button onClick={toggleMessenger} className="p-2 hover:bg-white/20 rounded-full transition-all hover:rotate-90 relative z-10">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-5 bg-slate-50/50 min-h-[260px] flex flex-col relative">
          
          {/* ==========================================
              State 1: เมนูเริ่มต้น (DH Admin or Find Partner)
              ========================================== */}
          {mode === 'menu' && (
            <div className="space-y-3.5 animate-in fade-in duration-300">
               {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-medium p-3 rounded-xl flex items-start gap-2 mb-2 shadow-sm">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">คุณต้องการติดต่อเรื่องใด?</p>
              </div>
              
              <a 
                href="https://lin.ee/your-line-id" target="_blank" rel="noreferrer"
                className="w-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  <MessageCircle size={22} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">ติดต่อแอดมิน DH Notebook</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">สอบถามสั่งซื้อสินค้า / แจ้งเคลมประกัน</p>
                </div>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
              </a>

              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button 
                onClick={handleFindNearestPartner}
                className="w-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  <MapPin size={22} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition-colors">หาร้านซ่อมใกล้ฉัน</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">ค้นหาพาร์ทเนอร์ในพื้นที่ของคุณ (GPS)</p>
                </div>
              </button>
            </div>
          )}

          {/* ==========================================
              State 2: เรดาร์กำลังค้นหา (Radar Scanning)
              ========================================== */}
          {mode === 'radar' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in duration-300 my-auto py-6">
              <div className="relative flex items-center justify-center w-32 h-32">
                {/* Radar Waves */}
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping opacity-30"></div>
                <div className="absolute inset-4 border-2 border-emerald-500 rounded-full animate-ping opacity-20" style={{ animationDelay: '300ms' }}></div>
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-10"></div>
                
                {/* Center Core */}
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center z-10 shadow-lg border border-white">
                  <Navigation size={26} className="text-emerald-600 animate-pulse drop-shadow-sm" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 tracking-wide uppercase">กำลังสแกนหาพิกัด...</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">ระบบกำลังคำนวณระยะทางร้านที่ใกล้คุณที่สุด</p>
              </div>
            </div>
          )}

          {/* ==========================================
              State 3: แสดงข้อมูล Partner (จากเรดาร์ หรือ กดจากหน้าเว็บ)
              ========================================== */}
          {(mode === 'result' || mode === 'partner_context') && partner && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
              
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setMode('menu')} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 uppercase tracking-widest transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50">
                  ← กลับเมนูหลัก
                </button>
                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-200">
                  <ShieldCheck size={12}/> Verified Partner
                </div>
              </div>

              <div className="text-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden flex-1 flex flex-col justify-center">
                {/* Subtle BG Logo */}
                <Store className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-50 rotate-12 z-0" />
                
                <div className="relative z-10">
                  {mode === 'result' && (
                    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 border border-emerald-100">
                      <Sparkles size={12}/> ร้านซ่อมที่ใกล้คุณที่สุด
                    </div>
                  )}
                  
                  <h4 className="font-black text-xl text-slate-800 leading-tight mb-2">
                    {partner.storeName || 'DH Partner'}
                  </h4>
                  
                  {partner.formattedDistance && (
                    <div className="flex justify-center items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 w-max mx-auto px-3 py-1 rounded-lg">
                       <MapPin size={12} className="text-rose-500" /> ห่างจากคุณประมาณ <span className="font-bold text-emerald-600">{partner.formattedDistance}</span>
                    </div>
                  )}
                  
                  {partner.services && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">บริการของทางร้าน:</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {partner.services}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Button */}
              <button 
                onClick={() => handleContactClick(partner.phone)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2.5 active:scale-95 group mt-auto"
              >
                <Phone size={20} className="group-hover:animate-bounce"/> โทรติดต่อร้านนี้ ({partner.phone})
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          🌟 ปุ่มวงกลมลอย (Floating Button - Premium)
          ========================================== */}
      <div className="relative flex items-center pointer-events-auto">
        
        {/* Tooltip อัจฉริยะ */}
        <div 
          className={`absolute right-full mr-5 bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 whitespace-nowrap flex items-center gap-2.5 transition-all duration-500 ${
            showTooltip && !isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <p className="text-xs font-bold tracking-wide">ต้องการความช่วยเหลือ?</p>
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">ติดต่อแอดมิน หรือ หาร้านซ่อมใกล้คุณ</p>
          </div>
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-slate-800 border-r border-b border-slate-700 transform -rotate-45"></div>
        </div>

        {/* วงกลมหลัก */}
        <div className="relative group cursor-pointer" onClick={toggleMessenger}>
          {/* Ambient Glow */}
          <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
            isOpen ? 'bg-rose-500/30 scale-110' : 'bg-indigo-600/40 group-hover:bg-indigo-600/60 animate-pulse scale-125'
          }`}></div>
          
          <button 
            className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
              isOpen 
              ? 'bg-slate-800 rotate-90 scale-90 hover:bg-rose-500' 
              : 'bg-gradient-to-br from-indigo-500 via-[#0870B8] to-blue-600 hover:scale-110 hover:-translate-y-1 border border-white/20'
            }`}
          >
            {isOpen ? <X size={26} strokeWidth={2.5}/> : <MessageCircle size={28} strokeWidth={2.5} className="drop-shadow-md" />}
            
            {/* Notification Dot */}
            {!isOpen && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-bounce shadow-sm"></span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default FloatingMessenger;