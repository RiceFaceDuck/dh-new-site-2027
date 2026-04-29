import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ShieldCheck, Star, Loader2, Store } from 'lucide-react';
import { partnerService } from '../../firebase/partnerService';

const PartnerSupportBox = () => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPartner = async () => {
      try {
        // 🚀 เรียกใช้ผ่าน partnerService object
        const activePartners = await partnerService.getActivePartners();
        if (isMounted && activePartners && activePartners.length > 0) {
           const randomIndex = Math.floor(Math.random() * activePartners.length);
           setPartner(activePartners[randomIndex]);
        }
      } catch (error) {
        console.error("Error loading partner support:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPartner();
    return () => { isMounted = false; };
  }, []);

  if (loading) return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-center animate-pulse mt-4">
      <Loader2 className="animate-spin text-slate-300 w-5 h-5 mr-2" />
      <span className="text-xs font-tech text-slate-400 uppercase">Searching Local Partners...</span>
    </div>
  );

  if (!partner) return null;

  return (
    <div className="mt-6 bg-white border border-[#0870B8]/20 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#0870B8]/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-150 duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
             <Store size={14} className="text-[#0870B8]" />
             Partner Support
           </h4>
           <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
             <ShieldCheck size={12} /> DH Verified
           </span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
             <img src={partner.storeLogo || '/logo.png'} alt="store" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Shop' }} />
          </div>
          <div className="flex-1 min-w-0">
             <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{partner.storeName || partner.partnerName}</h3>
             {partner.address && <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate"><MapPin size={10}/> {partner.address}</p>}
             <div className="flex items-center gap-1 mt-1.5">
               <div className="flex text-amber-400"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
               <span className="text-[10px] font-bold text-slate-400 ml-1">พาร์ทเนอร์แนะนำ</span>
             </div>
          </div>
        </div>
        {(partner.googleMapsUrl || partner.mapsUrl) && (
          <button 
            onClick={() => window.open(partner.googleMapsUrl || partner.mapsUrl, '_blank')}
            className="w-full mt-4 py-2 bg-[#f8fbff] hover:bg-[#E6F0F9] border border-[#0870B8]/20 text-[#0870B8] text-[11px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Navigation size={12} /> นำทางไปร้านค้า
          </button>
        )}
      </div>
    </div>
  );
};

export default PartnerSupportBox;