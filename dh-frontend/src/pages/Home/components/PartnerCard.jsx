import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { trackAdClick } from '../../../firebase/credit/creditActionService';
import { squadConfigService } from '../../../firebase/squadConfigService';

const PartnerCard = ({ partner }) => {
  // Use storeProfile data if available, fallback to partner root level data
  const avatar = partner.storeImage || partner.storeProfile?.logoUrl || partner.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop';
  const name = partner.storeName || partner.name || 'ช่างซ่อมอิสระ';
  const role = partner.services || partner.role || 'ช่างซ่อมคอมพิวเตอร์';

  const handleClick = async () => {
    try {
      const { logClick } = await import('../../../firebase/marketingAnalyticsService');
      await logClick('AD-CARD-' + (partner.id || partner.userId));
    } catch (e) {
      console.error("Failed to track click", e);
    }
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm p-4 rounded-2xl flex items-center space-x-4 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:border-indigo-100">
      
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
        <img src={avatar} alt={name} className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover shadow-sm bg-slate-50 border border-slate-100/50" />
        
        {/* Pulsing Status Dot */}
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-1">
        <h3 className="text-sm md:text-base font-black text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{name}</h3>
        <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-1" title={role}>{role}</p>
        
        {/* Distance Display */}
        {partner.formattedDistance ? (
          <div className="flex items-center text-[11px] md:text-xs mb-3 font-bold bg-gradient-to-r from-indigo-50 to-emerald-50 text-indigo-700 px-2.5 py-1 rounded-full w-max border border-indigo-100/50 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            ห่างออกไป {partner.formattedDistance}
          </div>
        ) : (
          <div className="flex items-center text-[11px] md:text-xs mb-3 font-bold bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full w-max border border-slate-200 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            ไม่ทราบระยะทาง
          </div>
        )}
        
        <Link onClick={handleClick} to={`/store/${partner.id || partner.userId}`} className="px-4 py-2 md:px-5 md:py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs md:text-sm hover:bg-indigo-600 transition-all duration-300 w-max shadow-md hover:shadow-indigo-500/30 flex items-center gap-2">
          View Profile
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default PartnerCard;
