import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-3.5 md:mb-4 gap-2.5">
        <div>
          <h2 className="font-heading text-lg md:text-xl font-bold text-slate-900 leading-tight">
            ผู้ให้บริการ บริเวณใกล้เคียง
          </h2>
          <p className="text-xs md:text-[13px] text-slate-500 font-light mt-0.5">
            ร้านซ่อมโน้ตบุ๊คและพาร์ทเนอร์ที่เปิดรับงานใกล้ตำแหน่งของคุณ
          </p>
          {locationError && (
            <p className="text-xs text-amber-600 flex items-center mt-1">
              <span>{locationError}</span>
              <button
                type="button"
                onClick={() => requestLocation(false)}
                className="ml-2 underline text-brand hover:text-brand-dark cursor-pointer"
              >
                ลองค้นหาตำแหน่งอีกครั้ง
              </button>
            </p>
          )}
        </div>
        <Link
          to="/providers"
          className="group inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:border-brand text-slate-900 hover:text-brand font-heading font-medium text-[13px] rounded-md border border-slate-300 transition-colors active:scale-95 whitespace-nowrap"
        >
          <span>ดูช่างทั้งหมด</span>
          <ArrowRight size={15} className="text-brand group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3.5 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-md border border-slate-200 overflow-hidden flex h-[132px] shadow-xs"
            >
              <div className="w-[108px] md:w-[124px] h-full bg-slate-200 shrink-0"></div>
              <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded-sm w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded-sm w-full"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-slate-100 rounded-sm w-20"></div>
                  <div className="h-7 bg-slate-200 rounded-sm w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : partners.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3.5">
          {partners.map((partner) => (
            <PartnerCard key={partner.id || partner.userId} partner={partner} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-md text-center border border-dashed border-slate-300">
          <p className="text-sm text-slate-500">ยังไม่มีผู้ให้บริการเปิดรับงานในขณะนี้</p>
        </div>
      )}
    </div>
  );
};

export default SquadHighlight;
