/* eslint-disable react/prop-types */
import React from 'react';
import { Eye, ExternalLink, Image as ImageIcon, CreditCard, ShoppingBag, MonitorPlay } from 'lucide-react';
import ProductAdCard from '../../../ads/ProductAdCard';

const AdPreviewCard = ({ formData, storeData }) => {

  // 📐 คำนวณ Aspect Ratio สำหรับ Billboard
  let billboardAspectClass = 'aspect-video'; // Default 16:9
  if (formData.type === 'BILLBOARD') {
    if (formData.billboardRatio === '1:1') billboardAspectClass = 'aspect-square';
    if (formData.billboardRatio === '9:16') billboardAspectClass = 'aspect-[9/16]';
  }

  // 🏷️ ไอคอนและสีตามประเภทโฆษณา
  const getTypeConfig = () => {
    switch (formData.type) {
      case 'BUSINESS_CARD': return { icon: <CreditCard size={14}/>, text: 'Business Card Ad', color: 'text-indigo-600', bg: 'bg-indigo-50' };
      case 'PRODUCT_LINK': return { icon: <ShoppingBag size={14}/>, text: 'Product Link Ad', color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'BILLBOARD': return { icon: <MonitorPlay size={14}/>, text: `Billboard Ad (${formData.billboardRatio || '16:9'})`, color: 'text-rose-600', bg: 'bg-rose-50' };
      default: return { icon: <Eye size={14}/>, text: 'Ad Preview', color: 'text-slate-600', bg: 'bg-slate-50' };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <div className="w-full bg-slate-50/50 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 sm:p-8 flex flex-col items-center justify-center sticky top-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
      
      {/* 🔴 Live Indicator Badge */}
      <div className="flex items-center justify-between w-full max-w-sm mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100">
           <span className="relative flex h-2.5 w-2.5">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
           </span>
           <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest mt-0.5">Live Preview</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white shadow-sm ${typeConfig.bg} ${typeConfig.color}`}>
           {typeConfig.icon}
           <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{typeConfig.text}</span>
        </div>
      </div>
      
      {/* 🖼️ Preview Container */}
      <div className={`w-full flex justify-center transition-all duration-500`}>
        
        {/* ==========================================
            รูปแบบ 1: นามบัตร หรือ สินค้า (1:1 Grid)
            ========================================== */}
        {(formData.type === 'BUSINESS_CARD' || formData.type === 'PRODUCT_LINK') && (
          <div className="w-full max-w-[280px] pointer-events-none transform origin-top shadow-xl rounded-2xl bg-white ring-1 ring-slate-900/5 transition-all hover:scale-[1.02] duration-300">
            <ProductAdCard 
              ad={{
                id: 'preview-mode',
                type: formData.type,
                title: formData.title || (formData.type === 'BUSINESS_CARD' ? 'ชื่อธุรกิจ / หัวข้อโฆษณา' : 'ชื่อสินค้าจำลองที่น่าสนใจ'),
                description: formData.description || 'คำอธิบายจุดเด่น หรือข้อความดึงดูดลูกค้า',
                imageUrl: formData.imageUrl || `https://placehold.co/400x400/f8fafc/94a3b8?text=1:1+${formData.type === 'BUSINESS_CARD' ? 'Business+Card' : 'Product'}`,
                platform: formData.platform || 'other',
                partnerName: storeData?.storeName || 'DH Partner',
                targetUrl: '#',
                price: formData.price || null,
                isSponsoredAd: true // Force to show sponsored tag
              }}
            />
          </div>
        )}

        {/* ==========================================
            รูปแบบ 2: แผ่นป้ายโฆษณา (Billboard Dynamic Ratio)
            ========================================== */}
        {formData.type === 'BILLBOARD' && (
          <div className={`w-full ${formData.billboardRatio === '9:16' ? 'max-w-[280px]' : 'max-w-full'} pointer-events-none shadow-xl rounded-2xl bg-slate-100 ring-1 ring-slate-900/5 flex items-center justify-center relative group overflow-hidden transition-all duration-500 ${billboardAspectClass}`}>
            
            {formData.imageUrl ? (
              <>
                <img src={formData.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Billboard Preview" />
                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent p-5 sm:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-1 drop-shadow-md">
                      {formData.title || 'ข้อความป้ายแบนเนอร์โฆษณา'}
                    </h3>
                    <p className="text-blue-300 text-xs sm:text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                      <ExternalLink size={14}/> คลิกเพื่อไปยังหน้าโปรโมชั่น
                    </p>
                </div>
              </>
            ) : (
              // Empty State for Billboard
              <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
                  <ImageIcon size={32} className="text-slate-300"/>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">พื้นที่โฆษณา {formData.billboardRatio || '16:9'}</div>
                <div className="text-[10px] mt-1 text-slate-400 max-w-[200px]">กรุณาอัปโหลดรูปภาพเพื่อดูตัวอย่างการแสดงผลจริง</div>
              </div>
            )}
            
            {/* Sponsored Tag (Top Right) */}
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-2 py-1 rounded tracking-widest uppercase">
               Sponsored
            </div>
          </div>
        )}

      </div>
      
      <div className="mt-8 pt-5 border-t border-slate-200/60 w-full text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          * รูปแบบการแสดงผลจริงอาจถูกปรับย่อขยายอัตโนมัติ เพื่อให้พอดีกับหน้าจอมือถือหรือคอมพิวเตอร์ของลูกค้า
        </p>
      </div>
    </div>
  );
};

export default AdPreviewCard;