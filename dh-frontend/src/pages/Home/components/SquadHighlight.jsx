import React from 'react';
import { Link } from 'react-router-dom';
import PartnerCard from './PartnerCard';
import { useNearbyPartners } from '../hooks/useNearbyPartners';

const SquadHighlight = () => {
  const { partners, loading, locationError, requestLocation, config } = useNearbyPartners();

  // ถ้าโหลด config เสร็จแล้ว และปิดใช้งานอยู่ ให้ซ่อนทั้งแผงเลย
  if (!loading && config && !config.isActive) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-6 space-y-2 md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wider mb-1 uppercase">
            ผู้ให้บริการ บริเวณใกล้เคียง
          </h2>
          {locationError && (
            <p className="text-xs text-amber-600 flex items-center">
              <span>{locationError}</span>
              <button 
                onClick={() => requestLocation(false)} 
                className="ml-2 underline text-brand hover:text-brand-dark"
              >
                ลองค้นหาตำแหน่งอีกครั้ง
              </button>
            </p>
          )}
        </div>
        <Link to="/providers" className="text-brand hover:text-brand-accent font-semibold text-sm md:text-base transition-colors whitespace-nowrap">
          ดูช่างทั้งหมด
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          <span className="ml-3 text-slate-500">กำลังค้นหาร้านซ่อมใกล้คุณ...</span>
        </div>
      ) : partners.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Display partners limited by config in the hook */}
          {partners.map((partner) => (
            <PartnerCard key={partner.id || partner.userId} partner={partner} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-200">
          <p className="text-slate-500">ยังไม่มีผู้ให้บริการเปิดรับงานในขณะนี้</p>
        </div>
      )}
    </div>
  );
};

export default SquadHighlight;
