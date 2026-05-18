/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Store, Info, Youtube, X, Tag, MousePointerClick } from 'lucide-react';
import { doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';

const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "default-app-id";

const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 🚀 รับค่า wrapperClassName จาก ProductList เพื่อแก้ปัญหา Grid ว่างเปล่า
const ProductAdCard = ({ ad, wrapperClassName = "" }) => {
  const [showVideo, setShowVideo] = useState(false);
  
  // Ref สำหรับระบบตรวจจับการมองเห็น (Intersection Observer)
  const cardRef = useRef(null);
  const hasRecordedImpression = useRef(false);

  // 1. ตรวจสอบความถูกต้องและงบประมาณ (Smart Budget Checking)
  // หมายเหตุ: รองรับทั้ง Schema เก่าและใหม่ (link/targetUrl, partnerName/storeName)
  const targetUrl = ad?.targetUrl || ad?.link || '#';
  const sponsorName = ad?.partnerName || ad?.storeName || ad?.ownerName || 'Official Partner';
  const platform = ad?.platform || 'other';
  const cost = ad?.costPerImpression || 1;
  const maxImpressions = Math.floor((ad?.creditLimit || 0) / cost);

  // ถ้างบหมด หรือ สถานะไม่ใช่ active ให้ซ่อนการ์ดไปเลย (คืนพื้นที่ให้สินค้าปกติ)
  if (!ad || ad.status !== 'active' || (ad.impressions || 0) >= maxImpressions) {
    return null;
  }

  // 2. ระบบนับ Impression เมื่อลูกค้าเลื่อนมาเห็น (Intersection Observer)
  useEffect(() => {
    if (!cardRef.current || hasRecordedImpression.current) return;

    const observer = new IntersectionObserver((entries) => {
      // หากการ์ดโผล่เข้ามาในจอเกิน 50%
      if (entries[0].isIntersecting) {
        recordImpression();
        observer.disconnect(); // นับแค่ครั้งเดียวต่อการโหลด 1 ครั้ง
      }
    }, { threshold: 0.5 });

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [ad.id]);

  // ฟังก์ชันยิงข้อมูลบันทึกยอด Impression และหักแต้ม (Atomic Batch Update)
  const recordImpression = async () => {
    if (hasRecordedImpression.current) return;
    hasRecordedImpression.current = true;
    
    try {
      const batch = writeBatch(db);
      
      // อัปเดตยอดวิวที่ตัวโฆษณา
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads', ad.id);
      batch.update(adRef, { impressions: increment(1) });
      
      // หักแต้มที่บัญชีของเจ้าของโฆษณา (ตัดพร้อมกันทั้ง 3 ฟิลด์ให้ตรงกับ Memory System)
      if (ad.userId) {
        const userRef = doc(db, 'artifacts', appId, 'users', ad.userId);
        batch.update(userRef, {
          creditPoint: increment(-cost),
          'stats.creditBalance': increment(-cost),
          partnerCredit: increment(-cost)
        });
      }

      await batch.commit();
    } catch (error) {
      console.error("🔥 Error recording ad impression:", error);
    }
  };

  // 3. ฟังก์ชันบันทึกยอดการคลิก
  const handleAdClick = async (e) => {
    if (!showVideo) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
    
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'sponsored_ads', ad.id);
      await updateDoc(adRef, { clicks: increment(1) });
    } catch (err) {
      console.error("🔥 Error recording ad click:", err);
    }
  };

  // ================= UI STYLING =================
  const getPlatformStyle = (p) => {
    switch (p?.toLowerCase()) {
      case 'shopee': return { bg: 'bg-[#ee4d2d]', text: 'text-[#ee4d2d]', label: 'Shopee' };
      case 'lazada': return { bg: 'bg-[#0f146d]', text: 'text-[#0f146d]', label: 'Lazada' };
      case 'tiktok': return { bg: 'bg-black', text: 'text-black', label: 'TikTok Shop' };
      case 'facebook': return { bg: 'bg-[#1877F2]', text: 'text-[#1877F2]', label: 'Facebook' };
      case 'thisshop': return { bg: 'bg-[#E31E24]', text: 'text-[#E31E24]', label: 'ThisShop' };
      case 'lineshopping': return { bg: 'bg-[#06C755]', text: 'text-[#06C755]', label: 'LINE' };
      default: return { bg: 'bg-emerald-600', text: 'text-emerald-600', label: 'Official Partner' };
    }
  };

  const pStyle = getPlatformStyle(platform);

  return (
    <div className={wrapperClassName} ref={cardRef}>
      <div
        onClick={handleAdClick}
        className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-indigo-100/60 overflow-hidden relative cursor-pointer h-full"
        title={ad.title}
      >
        {/* ป้าย Sponsored มุมขวาบน */}
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-white/95 backdrop-blur-md text-[9px] font-bold px-2.5 py-1.5 rounded-full text-indigo-600 shadow-sm border border-indigo-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Info size={12} className="text-indigo-500" />
            <span>{ad.badgeText || 'ได้รับการสนับสนุน'}</span>
          </span>
        </div>

        {/* ป้ายแพลตฟอร์ม มุมซ้ายบน */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`${pStyle.bg} text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-md tracking-wide flex items-center gap-1`}>
            <Store size={12} /> {pStyle.label}
          </span>
        </div>

        {/* รูปภาพสินค้า 1:1 */}
        <div className="relative w-full aspect-square bg-slate-50 overflow-hidden flex items-center justify-center">
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title || 'Advertisement'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
              onError={(e) => { e.target.src = 'https://placehold.co/400x400/f8fafc/94a3b8?text=Ad+Image'; }}
            />
          ) : (
            <div className="text-slate-400 text-xs font-bold">ไม่มีรูปภาพโฆษณา</div>
          )}
          
          {/* ปุ่ม Play Video ถ้าใส่ลิงก์ Youtube มา */}
          {ad.youtubeUrl && extractYouTubeId(ad.youtubeUrl) && (
             <div 
               className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
               onClick={(e) => {
                  e.stopPropagation();
                  handleAdClick(e);
                  setShowVideo(true);
               }}
             >
                <div className="w-14 h-14 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                   <Youtube size={28} className="text-white ml-1" />
                </div>
             </div>
          )}
        </div>

        {/* รายละเอียดเนื้อหา */}
        <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-indigo-50/10 to-white">
          <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors leading-snug">
            {ad.title || 'สินค้าพิเศษจากพาร์ทเนอร์ของเรา'}
          </h3>
          
          {ad.description && (
             <p className="text-xs text-rose-500 font-medium line-clamp-1 mb-2">
               {ad.description}
             </p>
          )}

          {ad.price && (
            <div className="flex items-center gap-1 mb-2">
               <Tag size={12} className="text-emerald-500" />
               <span className="text-sm font-bold text-emerald-600">฿{Number(ad.price).toLocaleString()}</span>
            </div>
          )}

          <div className="mt-auto pt-3 flex flex-col gap-2.5 border-t border-slate-100">
             {ad.youtubeUrl && extractYouTubeId(ad.youtubeUrl) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAdClick(e); setShowVideo(true); }}
                  className="w-full py-2 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-xl transition-colors border border-red-100"
                >
                  <Youtube size={16} /> ชมวิดีโอรีวิว
                </button>
             )}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <Store size={14} className={pStyle.text} />
                <span className="truncate font-medium">{sponsorName}</span>
              </div>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors flex-shrink-0">
                 <ExternalLink size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal (Popup) */}
      {showVideo && ad.youtubeUrl && extractYouTubeId(ad.youtubeUrl) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
               <h3 className="text-white font-bold truncate flex-1 flex items-center gap-2">
                 <Youtube className="text-red-500"/> {ad.title}
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
                src={`https://www.youtube.com/embed/${extractYouTubeId(ad.youtubeUrl)}?autoplay=1`}
                title={ad.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full absolute inset-0"
              ></iframe>
            </div>
            
            <div className="p-5 bg-slate-900 border-t border-slate-800">
               <a 
                 href={targetUrl} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 onClick={() => handleAdClick()} 
                 className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
               >
                 <ExternalLink size={18} /> สั่งซื้อสินค้านี้ผ่าน {pStyle.label}
               </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAdCard;