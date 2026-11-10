import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { resolveMapsUrl } from '../utils/storeUrlUtils';

const StoreLocationCard = ({ partner = {} }) => {
  const mapsUrl = resolveMapsUrl(partner);
  const lat = Number(partner.latitude ?? partner.storeProfile?.latitude ?? 0);
  const lng = Number(partner.longitude ?? partner.storeProfile?.longitude ?? 0);
  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  if (!partner.address && !partner.landmarks && !hasCoords && !mapsUrl) {
    return null;
  }

  return (
    <div className="bg-white rounded-[2px] shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12),0_2px_4px_-1px_rgba(15,23,42,0.06)] border border-slate-200/80 p-6 md:p-8">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        ตำแหน่งที่ตั้งร้าน
      </h3>
      {partner.address && (
        <div className="mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase">ที่อยู่ร้าน</p>
          <p className="text-sm text-slate-700">{partner.address}</p>
        </div>
      )}
      {partner.landmarks && (
        <div className="mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase">จุดสังเกต</p>
          <p className="text-sm text-slate-700">{partner.landmarks}</p>
        </div>
      )}
      {mapsUrl && (
        <div className="pt-1">
          <a 
            href={mapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
          >
            <MapPin size={14} className="text-rose-500" />
            <span>เปิดดูตำแหน่งบน Google Maps</span>
            <ExternalLink size={12} className="text-sky-500" />
          </a>
        </div>
      )}
    </div>
  );
};

export default React.memo(StoreLocationCard);
