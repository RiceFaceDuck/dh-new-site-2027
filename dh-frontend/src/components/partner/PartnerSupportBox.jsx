import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, CheckCircle2, MapPin, Award } from 'lucide-react';
import { findNearestPartner } from '../../firebase/partnerLocationService';
import { useGeolocation } from '../../hooks/useGeolocation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// ==========================================
// 🧩 Sub-Components (SRP)
// ==========================================

const PartnerServiceBadges = ({ servicesText }) => {
  if (!servicesText) return null;
  const servicesList = servicesText.split(',').map(s => s.trim()).filter(Boolean);
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {servicesList.map((service, idx) => (
        <span key={idx} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 line-clamp-1">
          <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
          {service}
        </span>
      ))}
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="w-full bg-white border border-slate-200 animate-pulse flex flex-row items-center rounded-2xl my-4 sm:my-6 p-2 sm:p-2.5 gap-3 sm:gap-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
    <div className="w-[120px] sm:w-[140px] md:w-[150px] aspect-square bg-slate-100 rounded-xl shrink-0"></div>
    <div className="flex-1 py-1 pr-1 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-3 w-1/3 bg-slate-100 rounded"></div>
        <div className="h-5 w-3/4 bg-slate-100 rounded"></div>
      </div>
      <div className="h-9 w-full bg-slate-100 rounded-lg mt-6"></div>
    </div>
  </div>
);

// ==========================================
// 📦 Main Component
// ==========================================

const PartnerSupportBox = () => {
  const { getUserCurrentLocation } = useGeolocation();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setLoading(true);
        const location = await getUserCurrentLocation();
        const nearest = await findNearestPartner(location.latitude, location.longitude, 30);
        
        if (nearest) {
          // 🚀 [THE FIX] ดึงรูปภาพจาก partner_ads (เหมือนหน้าสินค้า/โฮมเพจ) เพื่อให้รองรับร้านค้าเก่าที่เซฟข้อมูลไว้ก่อนอัปเดตระบบ
          try {
            const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
            const adId = `AD-CARD-${nearest.partnerId || nearest.id}`;
            const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'partner_ads', adId);
            const adSnap = await getDoc(adRef);
            
            if (adSnap.exists()) {
              const adData = adSnap.data();
              if (adData.imageUrl) nearest.fallbackAdImage = adData.imageUrl;
              if (!nearest.lineUrl && adData.lineUrl) nearest.lineUrl = adData.lineUrl;
              if (!nearest.messengerUrl && adData.messengerUrl) nearest.messengerUrl = adData.messengerUrl;
            }
          } catch (imgError) {
            console.error("Failed to fetch fallback ad image:", imgError);
          }

          setPartner(nearest);
        } else {
          setError("No partners nearby"); 
        }
      } catch (err) {
        console.error("Partner Box - Location Error:", err);
        setError("Location permission denied");
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, []);

  const handleContactClick = () => {
    if (!partner) return;
    window.location.href = `tel:${partner.phone}`;
  };

  if (loading) return <SkeletonLoader />;
  if (error || !partner) return null; 

  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-2xl relative flex flex-row items-center group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 my-4 sm:my-6 p-2 sm:p-2.5 gap-3 sm:gap-4">
      
      {/* 🖼️ ฝั่งซ้าย: ภาพร้านค้า (สัดส่วน 1:1) */}
      <div className="w-[120px] sm:w-[140px] md:w-[150px] aspect-square relative shrink-0 overflow-hidden bg-slate-100 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
        <img 
          src={partner.storeImage || partner.fallbackAdImage || partner.storeLogoUrl || partner.profileImage || "/logo.png"} 
          alt="Shop Profile" 
          className={`absolute inset-0 w-full h-full ${partner.storeImage || partner.fallbackAdImage || partner.storeLogoUrl || partner.profileImage ? 'object-cover' : 'object-contain p-4 opacity-30'} transition-transform duration-700 group-hover:scale-105`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-1.5 left-1.5 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded text-slate-900 flex items-center gap-1 shadow-md border border-white/50">
           <Award size={10} className="text-amber-500 shrink-0" />
           <span className="font-bold text-[7px] uppercase tracking-wider text-slate-800">Verified</span>
        </div>
      </div>

      {/* 🔴 ฝั่งขวา: ข้อมูลไฮไลท์และปุ่มติดต่อ */}
      <div className="flex-1 py-1 pr-1 flex flex-col justify-center">
         
         <div className="flex flex-col gap-1">
           {/* Row 1: ชื่อร้าน และ ระยะทาง */}
           <div>
             <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] font-bold mb-1">
               <MapPin size={10} />
               ร้านซ่อมใกล้คุณ <span className="text-slate-500 font-semibold">{partner.formattedDistance}</span>
             </div>
             <h2 className="text-lg sm:text-xl font-black text-slate-800 leading-tight line-clamp-2 tracking-tight group-hover:text-indigo-700 transition-colors duration-300">
               {partner.storeName}
             </h2>
             <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold mt-1">
               <ShieldCheck size={12} className="text-emerald-500 shrink-0" /> 
               ยืนยันตัวตนแล้ว
             </div>
           </div>

           {/* Row 2: บริการ */}
           <div className="mt-1">
             <PartnerServiceBadges servicesText={partner.services} />
           </div>
         </div>

         {/* Row 3: ปุ่มติดต่อ */}
         <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100/80">
            <button 
              onClick={handleContactClick}
              className="flex-1 min-w-[120px] px-3 bg-gradient-to-r from-[#0870B8] to-[#0A85D9] hover:from-[#065A96] hover:to-[#0870B8] text-white font-bold py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-[#0870B8]/20"
            >
              <Phone size={14} className="animate-pulse shrink-0" /> 
              <span className="tracking-wide text-xs whitespace-nowrap">โทรติดต่อทันที</span>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => partner.lineUrl ? window.open(partner.lineUrl, '_blank') : alert('คุณยังไม่ได้เพิ่มลิงก์ LINE ในหน้าตั้งค่าร้านค้าครับ')} 
                className={`w-9 h-9 text-white rounded-lg flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 transition-all ${partner.lineUrl ? 'bg-[#06C755] hover:bg-[#05b34c]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                title={partner.lineUrl ? "ติดต่อผ่าน LINE" : "ยังไม่มีข้อมูล LINE"}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.302.079.771.038 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.573-3.843 2.573-5.992z"/>
                </svg>
              </button>

              <button 
                onClick={() => partner.messengerUrl ? window.open(partner.messengerUrl, '_blank') : alert('คุณยังไม่ได้เพิ่มลิงก์ Messenger ในหน้าตั้งค่าร้านค้าครับ')} 
                className={`w-9 h-9 text-white rounded-lg flex items-center justify-center shadow-sm hover:shadow-md active:scale-95 transition-all ${partner.messengerUrl ? 'bg-[#0084FF] hover:bg-[#0073e6]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                title={partner.messengerUrl ? "ติดต่อผ่าน Messenger" : "ยังไม่มีข้อมูล Messenger"}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.888-3.259-6.558 6.963z"/>
                </svg>
              </button>
            </div>
         </div>
         
      </div>
    </div>
  );
};

export default PartnerSupportBox;