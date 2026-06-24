import React from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';

const ProvidersFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  requestLocation, 
  userLocation, 
  locationError 
}) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 sticky top-20 z-10">
      
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand transition-colors duration-200"
          placeholder="ค้นหาชื่อร้าน หรือ บริการ (เช่น ซ่อมบอร์ด, เปลี่ยนจอ)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GPS Toggle & Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center">
          <button
            onClick={() => requestLocation(true)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
