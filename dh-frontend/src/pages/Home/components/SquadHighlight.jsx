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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md border border-slate-200 p-3 md:p-3.5 flex items-center space-x-3 md:space-x-4 h-full">
              <div className="w-[105px] h-[105px] sm:w-[115px] sm:h-[115px] md:w-[125px] md:h-[125px] bg-slate-200 rounded-xl shrink-0"></div>
              <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded-sm w-1/2 mb-3"></div>
                <div className="h-6 bg-slate-200 rounded-full w-24 mb-3"></div>
                <div className="h-8 bg-slate-200 rounded-xl w-28"></div>
              </div>
            </div>
          ))}
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
