/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Headphones, Store } from 'lucide-react';
import { findNearestPartner } from '../../firebase/partnerLocationService'; 
import { useGeolocation } from '../../hooks/useGeolocation';
import MessengerMenu from './MessengerMenu';
import MessengerRadar from './MessengerRadar';
import MessengerResult from './MessengerResult';

const FloatingMessenger = () => {
  const { getUserCurrentLocation } = useGeolocation();
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
    <div className="fixed bottom-[85px] md:bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
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
          {mode === 'menu' && (
            <MessengerMenu error={error} handleFindNearestPartner={handleFindNearestPartner} />
          )}

          {mode === 'radar' && (
            <MessengerRadar />
          )}

          {(mode === 'result' || mode === 'partner_context') && (
            <MessengerResult partner={partner} setMode={setMode} openLink={openLink} />
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