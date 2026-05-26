/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Store, ShoppingBag, Tag, Sparkles } from 'lucide-react';

// 🚀 นำเข้า Marketing Service ตัวใหม่ที่มีระบบ Buffer ลดการอ่านเขียน DB
import { marketingService } from '../../../firebase/marketingService';

/**
 * 🎯 BusinessCardAdWidget
 * Component สำหรับแสดงผลโฆษณาประเภท นามบัตร(1:1) และ สินค้า(1:1)
 * ถูกเรียกใช้งานผ่าน useAdInjection.js เพื่อนำไปแทรกใน Product Grid
 */
const BusinessCardAdWidget = ({ ad }) => {
  const cardRef = useRef(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // ==========================================
  // 👁️ 1. ระบบตรวจจับการมองเห็น (Intersection Observer)
  // ==========================================
  useEffect(() => {
    // ถ้าไม่มีข้อมูล หรือเคยนับ View ไปแล้วในรอบการโหลดนี้ ให้ข้ามไป
    if (!cardRef.current || hasTrackedView || !ad?.id || ad.id === 'preview-mode') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // ถ้ารูปภาพปรากฏบนหน้าจอเกิน 50%
        if (entries[0].isIntersecting) {
          // 🚀 ส่งสัญญาณไปที่ Buffer ใน marketingService
          marketingService.trackAdView('partner_ads', ad.id);
          setHasTrackedView(true);
          observer.disconnect(); // เลิกติดตามทันที เพื่อลดภาระเบราว์เซอร์
        }
      },
      { threshold: 0.5 } // 50% Visibility
    );

    observer.observe(cardRef.current);

    return () => {
      if (observer) observer.disconnect();
    };
  }, [ad, hasTrackedView]);

  // ==========================================
  // 🖱️ 2. ระบบตรวจจับการคลิก (Click Tracking)
  // ==========================================
  const handleAdClick = (e) => {
    e.preventDefault();
    
    if (ad?.id && ad.id !== 'preview-mode') {
      // 🚀 ส่งสัญญาณคลิกไปที่ Buffer (จะบังคับ Flush ลง DB ทันทีใน Service)
      marketingService.trackAdClick('partner_ads', ad.id);
    }

    if (ad?.targetUrl) {
      // เปิดลิงก์เป้าหมายใน Tab ใหม่
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ป้องกันการ Render ถ้าไม่มีข้อมูล
  if (!ad) return null;

  const isProduct = ad.type === 'PRODUCT_LINK';
  const isBusiness = ad.type === 'BUSINESS_CARD';

  return (
    <div 
      ref={cardRef}
      onClick={handleAdClick}
      className="group relative flex flex-col h-full bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-slate-100 hover:ring-indigo-100/80 transform hover:-translate-y-1"
    >
      
      {/* 🏷️ Premium Sponsored Badge */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 bg-slate-900/60 backdrop-blur-md border border-white/20 rounded text-white shadow-sm">
        <Sparkles size={8} className="text-amber-400" />
        <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Sponsored</span>
      </div>

      {/* 🖼️ Image Section (1:1 Aspect Ratio) */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <img 
          src={ad.imageUrl} 
          alt={ad.title || 'Advertisement'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Subtle Gradient Overlay for elegant contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Platform Badge (Optional) */}
        {ad.platform && ad.platform !== 'other' && (
          <div className={`absolute bottom-2 left-2 z-10 text-[9px] font-bold text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-sm ${
            ad.platform === 'shopee' ? 'bg-[#EE4D2D]' : 
            ad.platform === 'lazada' ? 'bg-[#0F146D]' : 
            ad.platform === 'tiktok' ? 'bg-black' : 
            ad.platform === 'facebook' ? 'bg-[#1877F2]' : 
            'bg-indigo-500'
          }`}>
            {ad.platform}
          </div>
        )}
      </div>

      {/* 📝 Content Section */}
      <div className="p-3.5 flex flex-col flex-grow justify-between bg-gradient-to-b from-white to-slate-50/30">
        
        <div className="space-y-1">
          {/* Partner Name Indicator */}
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            {isProduct ? <Store size={10}/> : <ExternalLink size={10}/>}
            <span className="truncate">{ad.partnerName || 'DH Partner'}</span>
          </div>

          {/* Ad Title */}
          <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
            {ad.title}
          </h3>

          {/* Business Description */}
          {isBusiness && ad.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {ad.description}
            </p>
          )}
        </div>

        {/* 💰 Footer / Action Section */}
        <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between">
          
          {/* Product Price */}
          {isProduct && ad.price ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-medium">฿</span>
              <span className="text-base font-black text-emerald-600 tracking-tight">
                {Number(ad.price).toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">
              คลิกเพื่อดูรายละเอียด
            </div>
          )}

          {/* Interactive Arrow Icon */}
          <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
            <ExternalLink size={12} className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BusinessCardAdWidget;