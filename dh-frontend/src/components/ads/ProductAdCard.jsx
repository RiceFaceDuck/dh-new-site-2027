/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Store, Info, Youtube, X, Tag, MousePointerClick, TrendingUp } from 'lucide-react';
import { marketingService } from '../../firebase/marketingService';

// ฟังก์ชันสกัด ID วิดีโอ YouTube
const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const ProductAdCard = ({ ad, wrapperClassName = "" }) => {
  const [showVideo, setShowVideo] = useState(false);
  
  // Ref สำหรับระบบตรวจจับการมองเห็น (Intersection Observer)
  const cardRef = useRef(null);
  const hasRecordedImpression = useRef(false);

  // 1. Map ข้อมูลให้รองรับทั้ง Schema เก่าและใหม่
  const name = ad?.name || ad?.title || 'Sponsored Product';
  const price = ad?.price || 0;
  const imageUrl = ad?.imageUrl || null;
  const sponsorName = ad?.ownerName || ad?.storeName || ad?.partnerName || 'Official Partner';
  const cost = ad?.costPerImpression || 1; // สมมติว่าตั้งค่าหัก 1 แต้มต่อคลิก (แก้ตาม Global Settings ได้)

  // ดึงลิงก์หลัก (Primary Link) เพื่อให้ปุ่มคลิกทำงาน
  const links = ad?.links || {};
  const primaryLink = links.shopee || links.lazada || links.tiktok || ad?.targetUrl || '#';
  const youtubeLink = links.youtube || ad?.youtubeUrl || null;
  
  // ใช้ฟังก์ชันฉลาดจาก Service ตรวจจับสีและ Platform
  const platformName = marketingService.detectPlatform(primaryLink);

  // ถ้างบหมด หรือ สถานะไม่ใช่ active ให้ซ่อนการ์ดไปเลย
  if (!ad || ad.status !== 'active') {
    return null;
  }

  // 2. ระบบนับ Impression เมื่อลูกค้าเลื่อนมาเห็น (Intersection Observer)
  useEffect(() => {
    if (!cardRef.current || hasRecordedImpression.current) return;

    const observer = new IntersectionObserver((entries) => {
      // หากการ์ดโผล่เข้ามาในจอเกิน 50%
      if (entries[0].isIntersecting) {
        // 🚀 ส่งเข้า Memory Queue ของ Marketing Service (ไม่เปลือง Reads/Writes)
        marketingService.logImpression(ad.id);
        hasRecordedImpression.current = true;
        observer.disconnect(); // นับแค่ครั้งเดียวต่อการโหลดหน้าเว็บ
      }
    }, { threshold: 0.5 });

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [ad.id]);

  // 3. ฟังก์ชันบันทึกยอดการคลิก และตัดเครดิตทันที
  const handleAdClick = (e, customUrl = null) => {
    e?.stopPropagation();
    const target = customUrl || primaryLink;

    if (target && target !== '#') {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
    
    // 🚀 ยิง Transaction หักเครดิตผ่าน Service
    marketingService.logClickAndDeductCredit(ad.id, ad.ownerUid || ad.userId, cost);
  };

  // ================= UI STYLING =================
  const getPlatformStyle = (p) => {
    switch (p?.toLowerCase()) {
      case 'shopee': return { bg: 'bg-[#ee4d2d]', text: 'text-[#ee4d2d]', label: 'Shopee' };
      case 'lazada': return { bg: 'bg-[#0f146d]', text: 'text-[#0f146d]', label: 'Lazada' };
      case 'tiktok': return { bg: 'bg-black', text: 'text-black', label: 'TikTok Shop' };
      case 'facebook': return { bg: 'bg-[#1877F2]', text: 'text-[#1877F2]', label: 'Facebook' };
      case 'lineshopping': return { bg: 'bg-[#06C755]', text: 'text-[#06C755]', label: 'LINE' };
      default: return { bg: 'bg-emerald-600', text: 'text-emerald-600', label: 'Partner' };
    }
  };

  const pStyle = getPlatformStyle(platformName);

  return (
    <div className={wrapperClassName} ref={cardRef}>
      <div
        onClick={(e) => handleAdClick(e)}
        className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-blue-100 overflow-hidden relative cursor-pointer h-full"
        title={name}
      >
        {/* ป้าย Sponsored มุมขวาบน (แอบเนียนๆ แต่ดูพรีเมียม) */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
          <span className="bg-white/90 backdrop-blur-md text-[9px] font-black px-2 py-1 rounded-md text-blue-600 shadow-sm border border-blue-100 flex items-center gap-1 uppercase tracking-wider">
            <Info size={10} className="text-blue-500" /> Sponsored
          </span>
        </div>

        {/* รูปภาพสินค้า 1:1 */}
        <div className="relative w-full aspect-square bg-slate-50 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
              onError={(e) => { e.target.src = 'https://placehold.co/400x400/f8fafc/94a3b8?text=Ad+Image'; }}
            />
          ) : (
            <div className="text-slate-400 text-xs font-bold">ไม่มีรูปภาพโฆษณา</div>
          )}
          
          {/* ปุ่ม Play Video ถ้าใส่ลิงก์ Youtube มา */}
          {youtubeLink && extractYouTubeId(youtubeLink) && (
             <div 
               className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
               onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(true);
                  // แจ้งเก็บบันทึกคลิกด้วยเมื่อดูวิดีโอ
                  marketingService.logClickAndDeductCredit(ad.id, ad.ownerUid || ad.userId, cost);
               }}
             >
                <div className="w-14 h-14 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                   <Youtube size={28} className="text-white ml-1" />
                </div>
             </div>
          )}
        </div>

        {/* รายละเอียดเนื้อหา */}
        <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-blue-50/30 to-white">
          <div className="mb-2">
             <div className="flex items-center gap-1.5 mb-1.5">
               <Store size={12} className="text-gray-400" />
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">{sponsorName}</span>
             </div>
             <h3 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
               {name}
             </h3>
          </div>
          
          <div className="flex items-center gap-1.5 mt-auto">
             <span className="text-base font-black text-emerald-600">฿{Number(price).toLocaleString()}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 gap-2">
             {/* ปุ่มช้อปปิ้ง แพลตฟอร์ม */}
             <button 
               onClick={(e) => handleAdClick(e)}
               className={`w-full py-1.5 flex items-center justify-center gap-1.5 ${pStyle.bg} bg-opacity-10 hover:bg-opacity-20 ${pStyle.text} text-[11px] font-black rounded-lg transition-colors border border-current`}
             >
               ดูสินค้าที่ {pStyle.label} <ExternalLink size={12} />
             </button>
          </div>
        </div>
      </div>

      {/* Video Modal (Popup) */}
      {showVideo && youtubeLink && extractYouTubeId(youtubeLink) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
               <h3 className="text-white font-bold text-sm truncate flex-1 flex items-center gap-2">
                 <Youtube className="text-red-500"/> {name}
               </h3>
               <button 
                 onClick={(e) => { e.stopPropagation(); setShowVideo(false); }}
                 className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500 rounded-full transition-colors ml-4 shrink-0"
               >
                 <X size={18} />
               </button>
            </div>
            
            <div className="aspect-video w-full bg-black relative">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${extractYouTubeId(youtubeLink)}?autoplay=1`}
                title={name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full absolute inset-0"
              ></iframe>
            </div>
            
            <div className="p-5 bg-slate-900 border-t border-slate-800 flex justify-end">
               <a 
                 href={primaryLink} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 onClick={() => handleAdClick()} 
                 className={`px-6 py-2.5 flex items-center justify-center gap-2 ${pStyle.bg} text-white font-bold text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-1`}
               >
                 <ExternalLink size={16} /> ซื้อผ่าน {pStyle.label}
               </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAdCard;