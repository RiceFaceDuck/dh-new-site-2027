import React, { useState, useEffect } from 'react';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import { partnerService } from '../../firebase/partnerService';

const TopPartnerBanner = () => {
  const [partner, setPartner] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPartner = async () => {
      try {
        // 🚀 เรียกใช้ผ่าน partnerService object ที่เรา export มาแล้ว
        const activePartners = await partnerService.getActivePartners();
        if (isMounted && activePartners && activePartners.length > 0) {
           const randomIndex = Math.floor(Math.random() * activePartners.length);
           setPartner(activePartners[randomIndex]);
        }
      } catch (error) {
        console.error("Error loading top partner:", error);
      }
    };
    fetchPartner();
    return () => { isMounted = false; };
  }, []);

  if (!partner || !isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-[#0870B8] to-cyan-600 text-white relative z-[60] animate-in slide-in-from-top-full duration-500">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="bg-white/20 p-1.5 rounded-full flex-shrink-0">
             <Megaphone size={14} className="text-white animate-pulse" />
          </span>
          <p className="text-[10px] sm:text-xs font-medium truncate">
            <span className="font-bold opacity-80 uppercase tracking-wider mr-2 hidden sm:inline">Partner Recommendation:</span>
            แวะชมร้าน <span className="font-bold">{partner.storeName || partner.partnerName}</span> ตัวแทนใกล้บ้านคุณ
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
           {partner.googleMapsUrl && (
             <button 
               onClick={() => window.open(partner.googleMapsUrl, '_blank')}
               className="text-[10px] sm:text-xs font-bold bg-white text-[#0870B8] px-3 py-1 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
             >
               ดูแผนที่ <ArrowRight size={12} />
             </button>
           )}
           <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white transition-colors p-1">
             <X size={16} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default TopPartnerBanner;