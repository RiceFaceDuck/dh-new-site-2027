/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { ExternalLink, Store, Info, Youtube, X, Tag } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { trackAdClick, consumeAdCredit } from '../../firebase/creditService';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

// 🧠 Smart In-Memory Cache: ลดจำนวนการอ่าน Database (Reads) สแกนเครดิตแค่ 2 นาทีครั้ง
const creditCache = {};
const CACHE_TTL = 1000 * 60 * 2; 

const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 🚀 รับค่า wrapperClassName จาก ProductList เพื่อแก้ปัญหา Grid ว่างเปล่า
const ProductAdCard = ({ ad, wrapperClassName = "" }) => {
  const [showVideo, setShowVideo] = useState(false);
  
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyAdVisibility = async () => {
      // 1. เช็คสถานะโฆษณา (ต้องเป็น APPROVED และเปิดสวิตช์)
      if (!ad || (ad.status !== 'APPROVED' && ad.status !== 'approved') || ad.isActive !== true) {
        if(isMounted) { setIsAdVisible(false); setIsVerifying(false); }
        return;
      }

      const ownerId = ad.ownerUid || ad.partnerId;
      if (!ownerId) {
        if(isMounted) { setIsAdVisible(false); setIsVerifying(false); }
        return;
      }

      const now = Date.now();
      
      // 2. เช็ค Cache ก่อนดึงใหม่
      if (creditCache[ownerId] && (now - creditCache[ownerId].timestamp < CACHE_TTL)) {
         if (creditCache[ownerId].balance > 0) {
            if(isMounted) setIsAdVisible(true);
         } else {
            if(isMounted) setIsAdVisible(false);
         }
         if(isMounted) setIsVerifying(false);
         return;
      }

      try {
        // 3. 🎯 เจาะเข้า "ตู้เซฟกระเป๋าเงิน (Wallet)" ใน Sandbox โดยตรงเพื่อความชัวร์ที่สุด
        const walletRef = doc(db, 'artifacts', appId, 'users', ownerId, 'wallet', 'default');
        const walletSnap = await getDoc(walletRef);
        
        let currentCredit = 0;
        
        if (walletSnap.exists() && walletSnap.data().balance !== undefined) {
          currentCredit = Number(walletSnap.data().balance);
        } else {
          // Fallback เช็คจาก Profile
          const profileRef = doc(db, 'artifacts', appId, 'users', ownerId);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            currentCredit = Number(profileSnap.data().creditPoints || profileSnap.data().creditPoint || profileSnap.data().stats?.creditBalance || 0);
          }
        }
        
        // 4. บันทึก Cache
        creditCache[ownerId] = { balance: currentCredit, timestamp: now };

        if (currentCredit > 0) {
          if(isMounted) setIsAdVisible(true);
        } else {
          if(isMounted) setIsAdVisible(false);
        }
      } catch (error) {
        console.error("🔥 Error verifying ad credit visibility:", error);
        if(isMounted) setIsAdVisible(false);
      } finally {
        if(isMounted) setIsVerifying(false);
      }
    };

    verifyAdVisibility();

    return () => { isMounted = false; };
  }, [ad]);

  // 🛑 หากระบบซ่อนการ์ด มันจะ Return Null "ทั้งก้อน" ทำให้ Grid ของ ProductList ไม่เกิดช่องโหว่แหว่งๆ
  if (isVerifying || !isAdVisible) return null;

  const { imageUrl, title, link, platform, storeName, badgeText, youtubeUrl, price } = ad;

  const getPlatformStyle = (p) => {
    switch (p?.toLowerCase()) {
      case 'shopee': return { bg: 'bg-[#ee4d2d]', text: 'text-[#ee4d2d]', label: 'Shopee' };
      case 'lazada': return { bg: 'bg-[#0f146d]', text: 'text-[#0f146d]', label: 'Lazada' };
      case 'tiktok': return { bg: 'bg-black', text: 'text-black', label: 'TikTok Shop' };
      default: return { bg: 'bg-emerald-600', text: 'text-emerald-600', label: 'Official Partner' };
    }
  };

  const pStyle = getPlatformStyle(platform);

  const handleClick = (e) => {
    const targetId = ad.ownerUid || ad.partnerId;
    if (targetId) {
      trackAdClick(targetId).catch(e => console.error(e)); 
      consumeAdCredit(targetId, 1, `CLICK_AD_${ad.skuId || ad.id}`).catch(err => console.error(err));
    }
  };

  return (
    <div className={wrapperClassName}>
      <div
        onClick={(e) => {
           if (!showVideo) {
              handleClick(e);
              window.open(link, '_blank', 'noopener,noreferrer');
           }
        }}
        className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-amber-100/50 overflow-hidden relative cursor-pointer h-full"
        title={title}
      >
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-white/95 backdrop-blur-md text-[9px] font-bold px-2.5 py-1.5 rounded-full text-amber-600 shadow-md border border-amber-200/60 flex items-center gap-1.5 uppercase tracking-wider">
            <Info size={12} className="text-amber-500 animate-pulse" />
            <span>{badgeText || 'Sponsored'}</span>
          </span>
        </div>

        <div className="absolute top-3 left-3 z-10">
          <span className={`${pStyle.bg} text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-md tracking-wide flex items-center gap-1`}>
            <Store size={12} /> {pStyle.label}
          </span>
        </div>

        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Advertisement'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
              onError={(e) => { e.target.src = 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Ad+Image'; }}
            />
          ) : (
            <div className="text-gray-400 text-xs font-bold">ไม่มีรูปภาพโฆษณา</div>
          )}
          
          {youtubeUrl && extractYouTubeId(youtubeUrl) && (
             <div 
               className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
               onClick={(e) => {
                  e.stopPropagation();
                  handleClick(e);
                  setShowVideo(true);
               }}
             >
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                   <Youtube size={28} className="text-white ml-1" />
                </div>
             </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-amber-50/20 to-white">
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors leading-snug">
            {title || 'สินค้าพิเศษจากพาร์ทเนอร์ของเรา'}
          </h3>

          {price && (
            <div className="flex items-center gap-1 mb-2">
               <Tag size={12} className="text-emerald-500" />
               <span className="text-sm font-bold text-emerald-600">฿{Number(price).toLocaleString()}</span>
            </div>
          )}

          <div className="mt-auto pt-3 flex flex-col gap-2.5 border-t border-gray-100">
             {youtubeUrl && extractYouTubeId(youtubeUrl) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleClick(e); setShowVideo(true); }}
                  className="w-full py-2 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-xl transition-colors border border-red-100"
                >
                  <Youtube size={16} /> ชมวิดีโอรีวิว
                </button>
             )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <Store size={14} className={pStyle.text} />
                <span className="truncate font-medium">{storeName || ad.ownerName || 'Official Partner'}</span>
              </div>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors flex-shrink-0">
                 <ExternalLink size={14} className="text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showVideo && youtubeUrl && extractYouTubeId(youtubeUrl) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
               <h3 className="text-white font-bold truncate flex-1 flex items-center gap-2">
                 <Youtube className="text-red-500"/> {title}
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
                src={`https://www.youtube.com/embed/${extractYouTubeId(youtubeUrl)}?autoplay=1`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full absolute inset-0"
              ></iframe>
            </div>
            
            <div className="p-5 bg-slate-900 border-t border-slate-800">
               <a 
                 href={link} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 onClick={() => handleClick()} 
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