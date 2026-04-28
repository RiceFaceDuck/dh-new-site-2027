import React, { useState } from 'react';
import { MessageCircle, X, Headphones, MapPin, Store, Radar, ExternalLink, AlertCircle } from 'lucide-react';
import { findNearestPartner } from '../../firebase/partnerService';

const FloatingMessenger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('menu'); // 'menu' | 'radar' | 'result'
  const [isSearching, setIsSearching] = useState(false);
  const [partnerResult, setPartnerResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ฟังก์ชันสแกนหาพาร์ทเนอร์
  const handleFindPartner = () => {
    setMode('radar');
    setIsSearching(true);
    setErrorMsg('');

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const nearest = await findNearestPartner(latitude, longitude);
            if (nearest) {
              setPartnerResult(nearest);
            } else {
              setPartnerResult(null);
              setErrorMsg('ขออภัย ไม่พบพาร์ทเนอร์ที่เปิดรับการสนับสนุนในระยะนี้');
            }
          } catch (error) {
            setErrorMsg('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
          } finally {
            setIsSearching(false);
            setMode('result');
          }
        },
        (error) => {
          setIsSearching(false);
          setMode('result');
          setErrorMsg('ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาเปิดการระบุตำแหน่ง (GPS)');
        }
      );
    } else {
      setIsSearching(false);
      setMode('result');
      setErrorMsg('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
    }
  };

  // รีเซ็ตสถานะเมื่อปิด
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
      
      {/* Popup Menu (แสดงเมื่อคลิกเปิด) */}
      <div 
        className={`mb-4 overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <div className="w-[300px] md:w-[340px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0870B8] to-[#054D80] p-4 text-white flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-bold text-lg leading-tight">ติดต่อสอบถาม</h3>
              <p className="text-white/80 text-xs">เลือกช่องทางการติดต่อที่สะดวก</p>
            </div>
            <button onClick={toggleMessenger} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-2">
            
            {/* โหมดเมนูหลัก */}
            {mode === 'menu' && (
              <div className="space-y-2 p-2">
                {/* ปุ่มติดต่อ DH */}
                <a 
                  href="#" // เปลี่ยนเป็นลิงก์ Line OA หรือ Facebook ของบริษัท
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F0F7FC] border border-transparent hover:border-[#0870B8]/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E6F0F9] text-[#0870B8] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Headphones size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-[#0870B8] transition-colors">ติดต่อ DH Official</h4>
                    <p className="text-xs text-gray-500">สอบถามสินค้า, เคลม, แอดมินหลัก</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-300 group-hover:text-[#0870B8]" />
                </a>

                <div className="relative flex items-center justify-center py-2">
                  <div className="border-t border-gray-100 w-full"></div>
                  <span className="absolute bg-white/0 px-2 text-[10px] text-gray-400 font-medium">หรือ</span>
                </div>

                {/* ปุ่มหา Partner */}
                <button 
                  onClick={handleFindPartner}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                    <MapPin size={20} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full animate-ping"></span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-amber-700 transition-colors">หาตัวแทนใกล้คุณ</h4>
                    <p className="text-xs text-gray-500">ค้นหาพาร์ทเนอร์ที่ใกล้ที่สุด (เปิด GPS)</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-300 group-hover:text-amber-600" />
                </button>
              </div>
            )}

            {/* โหมดกำลังสแกนเรดาร์ */}
            {mode === 'radar' && (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-200 rounded-full animate-ping opacity-50 scale-150"></div>
                  <div className="absolute inset-0 bg-amber-100 rounded-full animate-pulse scale-110"></div>
                  <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center relative z-10 text-white shadow-lg">
                    <Radar size={32} className="animate-spin-slow" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">กำลังสแกนพื้นที่...</h4>
                  <p className="text-xs text-gray-500 mt-1">กรุณาอนุญาตให้ระบบเข้าถึงตำแหน่งของคุณ</p>
                </div>
              </div>
            )}

            {/* โหมดแสดงผลลัพธ์ */}
            {mode === 'result' && (
              <div className="p-4 flex flex-col items-center text-center space-y-4 animate-fade-in">
                {partnerResult ? (
                  <>
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-1">
                      <Store size={28} />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full mb-1">พบตัวแทนใกล้คุณ!</span>
                      <h4 className="font-bold text-gray-800 text-lg leading-tight">{partnerResult.storeName || partnerResult.contactName}</h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <MapPin size={12} /> ห่างจากคุณประมาณ {partnerResult.distanceKm} กม.
                      </p>
                      {partnerResult.services && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg mt-3 text-left border border-gray-100 line-clamp-2">
                          "{partnerResult.services}"
                        </p>
                      )}
                    </div>
                    <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                      <MessageCircle size={18} /> พูดคุยกับพาร์ทเนอร์
                    </button>
                    <button onClick={() => setMode('menu')} className="text-xs text-gray-400 hover:text-gray-600 underline">
                      กลับไปหน้าเมนู
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-1">
                      <AlertCircle size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">ค้นหาไม่สำเร็จ</h4>
                      <p className="text-xs text-gray-500 mt-1">{errorMsg}</p>
                    </div>
                    <button onClick={() => setMode('menu')} className="w-full bg-[#0870B8] hover:bg-[#054D80] text-white font-medium py-2.5 rounded-xl transition-all shadow-md mt-2">
                      ติดต่อ DH Official แทน
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Floating Button */}
      <div className="relative group cursor-pointer" onClick={toggleMessenger}>
        {/* แสงเรืองรองด้านหลัง */}
        <div className={`absolute inset-0 rounded-full blur-md opacity-40 transition-opacity duration-300 ${
          isOpen ? 'bg-red-500 opacity-20' : 'bg-[#0870B8] group-hover:opacity-60 animate-pulse'
        }`}></div>
        
        {/* ตัวปุ่ม */}
        <button 
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform ${
            isOpen 
            ? 'bg-gray-800 rotate-90 scale-90 shadow-none' 
            : 'bg-gradient-to-tr from-[#054D80] to-[#0A85DA] hover:scale-105'
          }`}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={30} className="drop-shadow-md" />}
          
          {/* Notification Dot หลอกๆ เพื่อเรียกร้องความสนใจ */}
          {!isOpen && (
             <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingMessenger;