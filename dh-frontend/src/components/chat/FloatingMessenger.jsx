import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Headphones, MapPin, Store, Radar, ExternalLink, AlertCircle, Navigation } from 'lucide-react';
import { partnerService } from '../../firebase/partnerService';

const FloatingMessenger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('menu'); // 'menu' | 'radar' | 'result'
  const [isSearching, setIsSearching] = useState(false);
  const [partnerResult, setPartnerResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. ฟังก์ชันสแกนหาพาร์ทเนอร์ (GPS)
  const handleFindPartner = () => {
    setMode('radar');
    setIsSearching(true);
    setErrorMsg('');

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // 🚀 ค้นหาพาร์ทเนอร์ที่ใกล้ที่สุดผ่าน Service
            const nearest = await partnerService.findNearestPartner(latitude, longitude);
            
            // หน่วงเวลาจำลองการสแกนเรดาร์ให้ดูเท่ขึ้น (1.5 วินาที)
            setTimeout(() => {
              if (nearest) {
                setPartnerResult(nearest);
              } else {
                setPartnerResult(null);
                setErrorMsg('ขออภัย ไม่พบพาร์ทเนอร์ใกล้เคียงที่เปิดรับการสนับสนุนในขณะนี้');
              }
              setIsSearching(false);
              setMode('result');
            }, 1500);

          } catch (error) {
            console.error(error);
            setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            setIsSearching(false);
            setMode('result');
          }
        },
        (error) => {
          setIsSearching(false);
          setMode('result');
          setErrorMsg('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาเปิดการระบุตำแหน่ง (GPS) หรืออนุญาตในเบราว์เซอร์');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsSearching(false);
      setMode('result');
      setErrorMsg('อุปกรณ์ของคุณไม่รองรับการระบุตำแหน่ง');
    }
  };

  // 2. รีเซ็ตสถานะเมื่อปิดแชท
  const toggleMessenger = () => {
    if (isOpen) {
      setTimeout(() => {
        setMode('menu');
        setPartnerResult(null);
      }, 300);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end">
      
      {/* ==========================================
          🌟 Popup Menu (เมนูหลักแบบ Glassmorphism)
          ========================================== */}
      <div 
        className={`mb-4 overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div className="w-[300px] sm:w-[340px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0870B8] to-[#054D80] p-4 text-white flex justify-between items-center shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg leading-tight">ติดต่อสอบถาม</h3>
              <p className="text-white/80 text-xs">เลือกช่องทางการติดต่อที่สะดวก</p>
            </div>
            <button onClick={toggleMessenger} className="relative z-10 p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-2 min-h-[220px] flex flex-col justify-center">
            
            {/* โหมด 1: เมนูหลัก */}
            {mode === 'menu' && (
              <div className="space-y-2 p-2 animate-in fade-in duration-300">
                <a 
                  href="#" // TODO: ใส่ลิงก์ Line OA หรือ Facebook ของบริษัท
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F0F7FC] border border-transparent hover:border-[#0870B8]/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E6F0F9] text-[#0870B8] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Headphones size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#0870B8] transition-colors">ติดต่อแอดมิน (DH Official)</h4>
                    <p className="text-[11px] text-slate-500">สอบถามสินค้า, เคลม, แจ้งปัญหา</p>
                  </div>
                  <ExternalLink size={16} className="text-slate-300 group-hover:text-[#0870B8]" />
                </a>

                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-slate-100 w-full"></div>
                  <span className="absolute bg-white px-2 text-[10px] text-slate-400 font-medium">หรือ</span>
                </div>

                <button 
                  onClick={handleFindPartner}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                    <MapPin size={20} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">หาตัวแทนใกล้คุณ</h4>
                    <p className="text-[11px] text-slate-500">ค้นหาพาร์ทเนอร์ในพื้นที่ (ใช้ GPS)</p>
                  </div>
                  <ExternalLink size={16} className="text-slate-300 group-hover:text-emerald-600" />
                </button>
              </div>
            )}

            {/* โหมด 2: กำลังสแกนเรดาร์ (Radar Animation) */}
            {mode === 'radar' && (
              <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="relative w-20 h-20 flex items-center justify-center mt-2">
                  <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-40 scale-150"></div>
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-pulse scale-110"></div>
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center relative z-10 text-white shadow-lg">
                    <Radar size={28} className="animate-[spin_3s_linear_infinite]" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mt-4">กำลังสแกนพื้นที่...</h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">ระบบกำลังค้นหาตัวแทนพาร์ทเนอร์ที่ใกล้พิกัดของคุณมากที่สุด</p>
                </div>
              </div>
            )}

            {/* โหมด 3: แสดงผลลัพธ์พาร์ทเนอร์ */}
            {mode === 'result' && (
              <div className="p-4 flex flex-col items-center text-center space-y-3 animate-in fade-in duration-500">
                {partnerResult ? (
                  <>
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-1 shadow-sm border border-emerald-200">
                      <Store size={28} />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full mb-1 border border-amber-200 shadow-sm">พบตัวแทนใกล้คุณ!</span>
                      <h4 className="font-bold text-slate-800 text-base leading-tight mt-1 line-clamp-1">{partnerResult.storeName || partnerResult.contactName}</h4>
                      <p className="text-[11px] text-[#0870B8] font-bold mt-1 flex items-center justify-center gap-1 bg-[#f8fbff] px-2 py-1 rounded-md w-fit mx-auto border border-[#E6F0F9]">
                        <MapPin size={12} /> ห่างจากคุณ {partnerResult.distanceKm} กม.
                      </p>
                    </div>
                    
                    <div className="w-full flex gap-2 mt-2">
                      <button 
                        onClick={() => window.open(partnerResult.googleMapsUrl || partnerResult.mapsUrl, '_blank')}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 border border-slate-200"
                      >
                        <Navigation size={14} /> นำทาง
                      </button>
                      <button 
                        onClick={() => alert(`คุณสามารถติดต่อได้ที่: ${partnerResult.contactEmail || partnerResult.phone || 'ไม่ระบุ'}`)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle size={14} /> ติดต่อร้าน
                      </button>
                    </div>
                    <button onClick={() => setMode('menu')} className="text-[10px] text-slate-400 hover:text-slate-600 mt-2">กลับไปหน้าเมนู</button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-1 border border-slate-100">
                      <AlertCircle size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">ค้นหาไม่สำเร็จ</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-[220px]">{errorMsg}</p>
                    </div>
                    <button onClick={() => setMode('menu')} className="w-full bg-[#0870B8] hover:bg-[#054D80] text-white font-bold py-2.5 rounded-xl transition-all shadow-md mt-2 text-xs">
                      ติดต่อ DH Official แทน
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==========================================
          🌟 Main Floating Button (ปุ่มแชทลอยตัวหลัก)
          ========================================== */}
      <div className="relative group cursor-pointer" onClick={toggleMessenger}>
        {/* แสงเรืองรองด้านหลัง (Glow Effect) */}
        <div className={`absolute inset-0 rounded-full blur-md opacity-40 transition-opacity duration-300 pointer-events-none ${
          isOpen ? 'bg-red-500 opacity-20' : 'bg-[#0870B8] group-hover:opacity-60 animate-pulse'
        }`}></div>
        
        {/* ตัวปุ่มหลัก */}
        <button 
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform ${
            isOpen 
            ? 'bg-slate-800 rotate-90 scale-90 shadow-none hover:bg-rose-500' 
            : 'bg-gradient-to-tr from-[#054D80] to-[#0A85DA] hover:scale-110 hover:-translate-y-1'
          }`}
          aria-label="Open Messenger"
        >
          {isOpen ? <X size={26} /> : <MessageCircle size={28} className="drop-shadow-md" />}
          
          {/* Notification Dot (จุดแดงเตือนความจำ) */}
          {!isOpen && (
             <span className="absolute top-0 right-0 w-3.5 h-3.5 md:w-4 md:h-4 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingMessenger;