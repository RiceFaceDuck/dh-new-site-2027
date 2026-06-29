import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, CheckCircle2 } from 'lucide-react';
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
    <div className="flex flex-wrap gap-1.5 mt-2">
      {servicesList.map((service, idx) => (
        <span key={idx} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded border border-emerald-100 line-clamp-1">
          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
          {service}
        </span>
      ))}
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="w-full bg-white border-y border-slate-200 animate-pulse flex overflow-hidden shadow-sm -mx-6 md:-mx-10 -mt-4 md:-mt-6 mb-0 h-48 sm:h-56 md:h-48">
    <div className="w-1/3 bg-slate-200 h-full"></div>
    <div className="w-2/3 p-4 flex flex-col justify-between">
      <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
      <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
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
    <div className="-mx-6 md:-mx-10 -mt-4 md:-mt-6 mb-0 bg-white border-b border-slate-200 shadow-sm relative overflow-hidden flex flex-col sm:flex-row group">
      
      {/* 🖼️ ฝั่งซ้าย/บน: ภาพร้านค้า */}
      <div className="w-full sm:w-[40%] md:w-[35%] relative h-48 sm:h-auto overflow-hidden bg-slate-50 flex shrink-0 items-center justify-center sm:border-r border-slate-200">
        <img 
          src={partner.storeImage || partner.fallbackAdImage || partner.storeLogoUrl || partner.profileImage || "/logo.png"} 
          alt="Shop Profile" 
          className={`w-full h-full ${partner.storeImage || partner.fallbackAdImage || partner.storeLogoUrl || partner.profileImage ? 'object-cover' : 'object-contain p-6 opacity-30'} transition-transform duration-700 group-hover:scale-105`}
        />
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded text-white flex items-center gap-1 shadow-sm">
           <ShieldCheck size={12} className="text-emerald-400" />
           <span className="font-bold text-[9px] uppercase tracking-wider">DH Verified</span>
        </div>
      </div>

      {/* 🔴 ฝั่งขวา/ล่าง: ข้อมูลไฮไลท์และปุ่มติดต่อ */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center bg-white relative z-10 overflow-hidden">
         
         <div className="flex flex-col gap-2">
           {/* Row 1: เจอร้านซ่อมใกล้คุณ */}
           <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
             เจอร้านซ่อมใกล้คุณ <span className="text-[#0870B8]">{partner.formattedDistance}</span>
           </h3>
           
           {/* Row 2: ชื่อร้าน */}
           <div>
             <h2 className="text-2xl sm:text-3xl font-black leading-tight line-clamp-2 tracking-wide" style={{ color: '#E53935', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.2)' }}>
               {partner.storeName}
             </h2>
           </div>

           {/* Row 3: บริการ */}
           <div className="mt-0">
             <PartnerServiceBadges servicesText={partner.services} />
           </div>
         </div>

         {/* Row 4: ปุ่มติดต่อ */}
         <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 mt-4">
            <button 
              onClick={handleContactClick}
              className="w-auto px-6 bg-[#0870B8] hover:bg-[#065A96] text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Phone size={18} className="animate-pulse shrink-0" /> 
              <span className="tracking-wide text-sm sm:text-base">โทรติดต่อร้าน ทันที</span>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => partner.lineUrl ? window.open(partner.lineUrl, '_blank') : alert('คุณยังไม่ได้เพิ่มลิงก์ LINE ในหน้าตั้งค่าร้านค้าครับ')} 
                className={`w-11 h-11 sm:w-12 sm:h-12 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all ${partner.lineUrl ? 'bg-[#06C755] hover:bg-[#05b34c]' : 'bg-slate-300 cursor-not-allowed'}`}
                title={partner.lineUrl ? "ติดต่อผ่าน LINE" : "ยังไม่มีข้อมูล LINE"}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.302.079.771.038 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.573-3.843 2.573-5.992z"/>
                </svg>
              </button>

              <button 
                onClick={() => partner.messengerUrl ? window.open(partner.messengerUrl, '_blank') : alert('คุณยังไม่ได้เพิ่มลิงก์ Messenger ในหน้าตั้งค่าร้านค้าครับ')} 
                className={`w-11 h-11 sm:w-12 sm:h-12 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all ${partner.messengerUrl ? 'bg-[#0084FF] hover:bg-[#0073e6]' : 'bg-slate-300 cursor-not-allowed'}`}
                title={partner.messengerUrl ? "ติดต่อผ่าน Messenger" : "ยังไม่มีข้อมูล Messenger"}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
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