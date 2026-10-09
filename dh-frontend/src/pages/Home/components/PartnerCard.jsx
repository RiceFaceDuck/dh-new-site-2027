import React from 'react';
import { Link } from 'react-router-dom';
import { logClick } from '../../../firebase/marketingAnalyticsService';
import LazyImage from '../../../components/common/LazyImage';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { getRenderableImageUrl } from '../../../utils/imageUtils';

const PartnerCard = ({ partner }) => {
  // Use storeProfile data if available, fallback to partner root level data
  const rawAvatar = partner.storeImage || partner.storeProfile?.logoUrl || partner.avatar || partner.photoURL || partner.profileImage || partner.profilePicture || partner.logo || partner.photo || null;
  const avatar = getRenderableImageUrl(rawAvatar, 400);
  const name = getCustomerDisplayName(partner, 'ช่างซ่อมอิสระ');
  const role = partner.services || partner.role || 'ช่างซ่อมคอมพิวเตอร์';

  const handleClick = async () => {
    try {
      await logClick('AD-CARD-' + (partner.id || partner.userId));
    } catch (e) {
      console.error("Failed to track click", e);
    }
  };

  return (
    <div className="group relative bg-white p-3 md:p-3.5 rounded-2xl flex items-center space-x-3 md:space-x-4 border border-slate-200 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200">
      
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/20 to-emerald-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
        <LazyImage src={avatar} alt={name} className="relative w-[105px] h-[105px] sm:w-[115px] sm:h-[115px] md:w-[125px] md:h-[125px] rounded-xl object-cover shadow-xs bg-slate-50 border border-slate-100/50" />
        
        {/* Pulsing Status Dot */}
        <div className="absolute bottom-1 right-1 flex h-4 w-4 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs"></span>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <h3 className="text-sm md:text-base font-black text-slate-800 leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors truncate">{name}</h3>
        <p className="text-xs text-slate-500 font-medium mb-1.5 line-clamp-1" title={role}>{role}</p>
        
        {/* Distance Display */}
        {partner.formattedDistance ? (
          <div className="inline-flex items-center text-[11px] md:text-xs mb-2 font-bold bg-linear-to-r from-indigo-50 to-emerald-50 text-indigo-700 px-2.5 py-1 rounded-full w-fit max-w-full border border-indigo-100/50 shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">ห่างออกไป {partner.formattedDistance}</span>
          </div>
        ) : (
          <div className="inline-flex items-center text-[11px] md:text-xs mb-2 font-bold bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full w-fit max-w-full border border-slate-200 shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">ไม่ทราบระยะทาง</span>
          </div>
        )}
        
        <Link onClick={handleClick} to={`/store/${partner.id || partner.userId}`} className="px-3.5 py-1.5 md:px-4 md:py-2 bg-slate-800 text-white rounded-xl font-bold text-xs md:text-sm hover:bg-indigo-600 active:scale-95 transition-all duration-300 w-fit max-w-full shadow-md hover:shadow-indigo-500/30 flex items-center justify-center gap-1.5 md:gap-2">
          <span>View Profile</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default React.memo(PartnerCard);
