import { Search, MapPin, Navigation } from 'lucide-react';

const ProvidersFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  requestLocation, 
  userLocation, 
  locationError 
}) => {
  return (
    <div className="w-full bg-white rounded-[2px] shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12),0_2px_4px_-1px_rgba(15,23,42,0.06)] border border-slate-200/80 p-4 mb-6 sticky top-20 z-10">
      
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200/80 rounded-[2px] leading-5 bg-slate-50/60 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors duration-200 text-sm"
          placeholder="ค้นหาชื่อร้าน หรือ บริการ (เช่น ซ่อมบอร์ด, เปลี่ยนจอ)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GPS Toggle & Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => requestLocation(true)}
            className={`flex items-center px-4 py-2 rounded-[2px] text-sm font-medium transition-colors shrink-0 ${
              userLocation 
                ? 'bg-[#C8EFD4] text-slate-800 border border-[#B3E1C1]' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {userLocation ? (
              <>
                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                เรียงตามระยะทางแล้ว
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                เรียงตามร้านใกล้ฉัน
              </>
            )}
          </button>
          {!userLocation && (
            <span className="text-xs sm:text-sm font-medium text-orange-600 flex items-center">
              👈🏼 หาก ไม่ขึ้นระยะทาง ให้กดปุ่มนี้
            </span>
          )}
        </div>
        
        {locationError && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
            {locationError}
          </p>
        )}
      </div>

    </div>
  );
};

export default ProvidersFilterBar;
