import React from 'react';
import { ExternalLink, Store, Info, Youtube, X } from 'lucide-react';
import { useState } from 'react';
import { trackAdClick } from '../../firebase/creditService';

/**
 * ProductAdCard - คอมโพเนนต์สำหรับการ์ดโฆษณา (อัตราส่วน 1:1)
 * สำหรับแทรกใน ProductList
 * * @param {Object} ad - ข้อมูลโฆษณา 
 * รูปแบบข้อมูลที่รองรับ:
 * {
 * id: "ad-001",
 * title: "สินค้าตัวอย่าง ชื่อยาว...",
 * imageUrl: "https://...", // รูป 1:1
 * link: "https://shopee.co.th/...", // ลิงก์ปลายทาง
 * platform: "shopee" | "lazada" | "tiktok" | "other", // เพื่อแสดงสี/ป้ายกำกับ
 * storeName: "ชื่อร้านค้า",
 * badgeText: "ผู้สนับสนุน" // ตัวเลือกเสริม
 * }
 */

const extractYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const ProductAdCard = ({ ad }) => {
  const [showVideo, setShowVideo] = useState(false);
  if (!ad) return null;

  const { imageUrl, title, link, platform, storeName, badgeText, youtubeUrl } = ad;

  // ฟังก์ชันกำหนดสไตล์ตาม Platform
  const getPlatformStyle = (p) => {
    switch (p?.toLowerCase()) {
      case 'shopee':
        return { bg: 'bg-[#ee4d2d]', text: 'text-[#ee4d2d]', label: 'Shopee' };
      case 'lazada':
        return { bg: 'bg-[#0f146d]', text: 'text-[#0f146d]', label: 'Lazada' };
      case 'tiktok':
        return { bg: 'bg-black', text: 'text-black', label: 'TikTok Shop' };
      default:
        return { bg: 'bg-gray-700', text: 'text-gray-700', label: 'Sponsored' };
    }
  };

  const pStyle = getPlatformStyle(platform);

  const handleClick = (e) => {
    if (ad?.partnerId) {
      trackAdClick(ad.partnerId);
    }
  };

  return (
        <>
      <div
        onClick={(e) => {
           if (!showVideo) {
              handleClick(e);
              window.open(link, '_blank', 'noopener,noreferrer');
           }
        }}
        className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-amber-100 overflow-hidden relative cursor-pointer h-full"
        title={title}
      >
        {/* ป้ายมุมขวาบน (Badge ผู้สนับสนุน) */}
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-white/90 backdrop-blur-sm text-[10px] font-medium px-2 py-1 rounded-md text-amber-700 shadow-sm border border-amber-200/50 flex items-center gap-1">
            <Info size={10} className="text-amber-500" />
            <span>{badgeText || 'ได้รับการสนับสนุน'}</span>
          </span>
        </div>

        {/* ป้ายมุมซ้ายบน (Platform Tag) */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`${pStyle.bg} text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm tracking-wide`}
          >
            {pStyle.label}
          </span>
        </div>

        {/* พื้นที่รูปภาพ อัตราส่วน 1:1 */}
        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Advertisement'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Ad+Image'; // Fallback Image
              }}
            />
          ) : (
            <div className="text-gray-400 text-xs">ไม่มีรูปภาพโฆษณา</div>
          )}
          
          {/* ปุ่ม YouTube Play (ถ้ามีลิงก์) */}
          {youtubeUrl && extractYouTubeId(youtubeUrl) && (
             <div 
               className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
               onClick={(e) => {
                  e.stopPropagation();
                  handleClick(e);
                  setShowVideo(true);
               }}
             >
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                   <Youtube size={24} className="text-white" />
                </div>
             </div>
          )}
        </div>

        {/* พื้นที่เนื้อหาและรายละเอียด */}
        <div className="p-3 flex flex-col flex-grow bg-gradient-to-b from-amber-50/30 to-white">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors leading-snug">
            {title || 'สินค้าฝากโฆษณา (Partner)'}
          </h3>

          {/* ส่วน Footer ของการ์ด (ชื่อร้าน และ ไอคอนออกข้างนอก) */}
          <div className="mt-auto pt-2 flex flex-col gap-2 border-t border-gray-100">
             {youtubeUrl && extractYouTubeId(youtubeUrl) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleClick(e); setShowVideo(true); }}
                  className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg transition-colors border border-red-100"
                >
                  <Youtube size={14} /> ดู Video Review
                </button>
             )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <Store size={14} className={pStyle.text} />
                <span className="truncate font-medium">{storeName || 'ร้านค้าพาร์ทเนอร์'}</span>
              </div>
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 group-hover:bg-amber-100 transition-colors flex-shrink-0">
                 <ExternalLink size={12} className="text-gray-400 group-hover:text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && youtubeUrl && extractYouTubeId(youtubeUrl) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
               <h3 className="text-white font-bold truncate flex-1">{title}</h3>
               <button 
                 onClick={(e) => { e.stopPropagation(); setShowVideo(false); }}
                 className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500 rounded-full transition-colors ml-4 shrink-0"
               >
                 <X size={18} />
               </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${extractYouTubeId(youtubeUrl)}?autoplay=1`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800">
               <a 
                 href={link} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
               >
                  <ExternalLink size={18} /> ไปยังหน้าสั่งซื้อสินค้า
               </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductAdCard;