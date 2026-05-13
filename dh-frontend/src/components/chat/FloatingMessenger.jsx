/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, X, MapPin, Phone, 
  Wrench, Loader2, Navigation, AlertCircle, Sparkles, ExternalLink, Headphones
} from 'lucide-react';

// ใช้ Service ใหม่ที่เราเพิ่งสร้างเพื่อความแม่นยำและประหยัด Reads
import { findNearestPartner, getUserCurrentLocation } from '../../firebase/partnerLocationService'; 

const FloatingMessenger = () => {
  // ================= State Management =================
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('menu'); // 'menu' | 'radar' | 'result'
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);

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
        setError("กรุณาเปิด GPS เพื่อค้นหาร้านซ่อมใกล้คุณครับ");
      } else {
        setError("เกิดข้อผิดพลาดในการค้นหาพิกัด");
      }
      setLoading(false);
      setMode('menu');
    }
  };

  const toggleMessenger = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    setShowTooltip(false);
    
    // ถ้าปิด ให้รีเซ็ตกลับหน้าเมนู
    if (!nextState) {
        setTimeout(() => setMode('menu'), 300); // รอให้ transition เสร็จก่อน
    }
  };

  const handleContactClick = () => {
    if (!partner) return;
    console.log(`[Action] ลูกค้ากดติดต่อร้าน: ${partner.storeName} (รอเชื่อมระบบหัก Credit Point)`);
    window.location.href = `tel:${partner.phone}`;
  };

  // ================= RENDER =================
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
      {/* 🌟 กล่องหน้าต่างรายละเอียด (โชว์เมื่อ isOpen = true) */}
      <div 
        className={`pointer-events-auto mb-4 w-[320px] sm:w-[360px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0870B8] to-[#0A85DA] p-4 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Headphones size={20} className="text-white"/>
            </div>
            <div>
              <h3 className="font-bold text-sm">บริการช่วยเหลือ</h3>
              <p className="text-[10px] text-blue-100 opacity-90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ออนไลน์พร้อมให้บริการ
              </p>
            </div>
          </div>
          <button onClick={toggleMessenger} className="p-1 hover:bg-white/20 rounded-full transition-colors relative z-10"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-5 bg-slate-50 min-h-[250px] flex flex-col">
          
          {/* State 1: เมนูเริ่มต้น */}
          {mode === 'menu' && (
            <div className="space-y-3 animate-in fade-in duration-300">
               {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2 mb-4">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <p className="text-sm font-bold text-slate-700 mb-2">คุณต้องการติดต่อเรื่องใด?</p>
              
              <button 
                onClick={handleFindNearestPartner}
                className="w-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Wrench size={18} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition-colors">หาร้านซ่อมใกล้ฉัน</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">ค้นหาพาร์ทเนอร์ในพื้นที่ของคุณ</p>
                </div>
              </button>

              <a 
                href="https://lin.ee/your-line-id" target="_blank" rel="noreferrer"
                className="w-full bg-white hover:bg-[#00B900]/5 border border-slate-200 hover:border-[#00B900]/30 p-4 rounded-2xl flex items-center gap-4 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-full bg-[#00B900]/10 text-[#00B900] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MessageCircle size={18} />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-sm text-slate-800 group-hover:text-[#00B900] transition-colors">ติดต่อแอดมิน DH</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">สอบถามเรื่องสินค้า / เคลมประกัน</p>
                </div>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-[#00B900]" />
              </a>
            </div>
          )}

          {/* State 2: เรดาร์กำลังค้นหา */}
          {mode === 'radar' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in duration-300 my-auto py-8">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 bg-emerald-400 rounded-full blur-xl animate-ping opacity-20"></div>
                <div className="absolute w-16 h-16 border-2 border-emerald-500 rounded-full animate-ping opacity-40"></div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center z-10 shadow-lg">
                  <Navigation size={24} className="text-emerald-600 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">กำลังสแกนหาพิกัด...</p>
                <p className="text-xs text-slate-400 mt-1">ค้นหาร้านที่ใกล้คุณที่สุด</p>
              </div>
            </div>
          )}

          {/* State 3: เจอพาร์ทเนอร์แล้ว */}
          {mode === 'result' && partner && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setMode('menu')} className="text-xs text-slate-400 hover:text-[#0870B8] flex items-center gap-1">
                   กลับ
                </button>
              </div>

              <div className="text-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0"></div>
                
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full mb-3 border border-emerald-200 relative z-10">
                  <Sparkles size={12}/> ร้านที่ใกล้ที่สุด
                </div>
                
                <h4 className="font-extrabold text-lg text-slate-800 leading-tight relative z-10">
                  {partner.storeName}
                </h4>
                
                <div className="flex justify-center items-center gap-1 mt-2 text-xs text-slate-500 font-medium">
                   <MapPin size={12} className="text-rose-500" /> ห่างจากคุณเพียง <span className="font-bold text-[#0870B8]">{partner.formattedDistance}</span>
                </div>
                
                {partner.services && (
                  <div className="mt-3 pt-3 border-t border-slate-50 text-left">
                    <p className="text-xs text-slate-400 mb-1">รับบริการ:</p>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2">{partner.services}</p>
                  </div>
                )}
              </div>

              <button 
                onClick={handleContactClick}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Phone size={18} className="animate-bounce"/> โทรติดต่อร้านนี้
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-1">
                * พาร์ทเนอร์นี้ได้รับการยืนยันจาก DH Notebook แล้ว
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 🌟 ปุ่มวงกลมลอย (Floating Button) */}
      <div className="relative flex items-center pointer-events-auto">
        
        {/* Tooltip */}
        <div 
          className={`absolute right-full mr-4 bg-white text-slate-700 px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 whitespace-nowrap flex items-center gap-2 transition-all duration-500 ${
            showTooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <p className="text-sm font-bold">หาร้านซ่อมใกล้คุณไหม?</p>
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-r border-b border-slate-100 transform -rotate-45"></div>
        </div>

        {/* วงกลมหลัก */}
        <div className="relative group cursor-pointer" onClick={toggleMessenger}>
          <div className={`absolute inset-0 rounded-full blur-md opacity-40 transition-opacity duration-300 pointer-events-none ${
            isOpen ? 'bg-rose-500 opacity-20' : 'bg-[#0870B8] group-hover:opacity-60 animate-pulse'
          }`}></div>
          
          <button 
            className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform ${
              isOpen 
              ? 'bg-slate-800 rotate-90 scale-90 shadow-none hover:bg-rose-500' 
              : 'bg-gradient-to-tr from-[#054D80] to-[#0A85DA] hover:scale-110 hover:-translate-y-1'
            }`}
          >
            {isOpen ? <X size={26} /> : <MessageCircle size={28} className="drop-shadow-md" />}
            
            {/* Notification Dot */}
            {!isOpen && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-bounce"></span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default FloatingMessenger;