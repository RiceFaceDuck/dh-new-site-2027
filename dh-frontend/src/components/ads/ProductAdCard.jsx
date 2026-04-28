import React from 'react';
import { ExternalLink, Store, Info } from 'lucide-react';

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
const ProductAdCard = ({ ad }) => {
  if (!ad) return null;

  const { imageUrl, title, link, platform, storeName, badgeText } = ad;

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

  return (
    <a
      href={link || '#'}
      target="_blank"
      rel="noopener noreferrer"
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
      </div>

      {/* พื้นที่เนื้อหาและรายละเอียด */}
      <div className="p-3 flex flex-col flex-grow bg-gradient-to-b from-amber-50/30 to-white">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors leading-snug">
          {title || 'สินค้าฝากโฆษณา (Partner)'}
        </h3>

        {/* ส่วน Footer ของการ์ด (ชื่อร้าน และ ไอคอนออกข้างนอก) */}
        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Store size={14} className={pStyle.text} />
            <span className="truncate font-medium">{storeName || 'ร้านค้าพาร์ทเนอร์'}</span>
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 group-hover:bg-amber-100 transition-colors flex-shrink-0">
             <ExternalLink size={12} className="text-gray-400 group-hover:text-amber-600" />
          </div>
        </div>
      </div>
    </a>
  );
};

export default ProductAdCard;