import { useRef, useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Navigation, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const ProvidersFilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedService = 'all',
  setSelectedService,
  serviceFilters = [],
  serviceCounts = {},
  requestLocation,
  userLocation,
  locationError
}) => {
  const chipsScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncScrollCue = useCallback(() => {
    const el = chipsScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(maxScroll > 6 && el.scrollLeft < maxScroll - 6);
  }, []);

  useEffect(() => {
    syncScrollCue();
    window.addEventListener('resize', syncScrollCue);
    return () => window.removeEventListener('resize', syncScrollCue);
  }, [syncScrollCue, serviceFilters.length]);

  const scrollChipsBy = (delta) => {
    const el = chipsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section
      aria-label="ค้นหาและกรองผู้ให้บริการ"
      className="w-full bg-white rounded-lg border border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.05)] p-3 sm:p-4 mb-4 sm:mb-5 flex flex-col gap-2.5 sm:gap-3"
    >
      {/* Top Row: Search Input + GPS Sort Button (Single Row on Tablet/PC, Stacked on Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full h-11 sm:h-[42px] pl-9 pr-9 border border-slate-300 rounded-md bg-[#F6F8FB] text-base sm:text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-light focus:outline-hidden focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
            placeholder="ค้นหาชื่อร้าน, พื้นที่ หรืออาการซ่อม (เช่น ซ่อมบอร์ด, เปลี่ยนจอ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="ล้างคำค้นหา"
              className="absolute inset-y-0 right-2 my-auto w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => requestLocation(true)}
          aria-pressed={Boolean(userLocation)}
          className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[42px] px-4 rounded-md font-heading text-[13.5px] sm:text-[13px] font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
            userLocation
              ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:bg-[#D1FAE5]'
              : 'bg-[#EDF4FB] text-[#054D80] border-[#BFDBFE] hover:bg-[#DCEBFA] hover:border-brand'
          }`}
        >
          {userLocation ? (
            <>
              <MapPin className="w-4 h-4 shrink-0" />
              <span>เรียงตามระยะทางแล้ว</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 shrink-0" />
              <span>เรียงตามร้านใกล้ฉัน</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Row: Quick Service Chips (Mobile Edge-Fade + Scroll Cue, No Native Scrollbar) */}
      <div className="pt-2.5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="relative flex-1 min-w-0">
          {/* Left Edge Fade + Cue Button (Mobile/Scrollable) */}
          <div
            className={`sm:hidden absolute left-0 top-0 bottom-0 w-10 z-10 flex items-center justify-start bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none transition-opacity duration-150 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => scrollChipsBy(-140)}
              aria-label="เลื่อนตัวกรองไปทางซ้าย"
              className={`w-7 h-7 rounded-md border border-slate-300 bg-white text-[#132642] shadow-xs flex items-center justify-center ${
                canScrollLeft ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Service Chips Strip */}
          <div
            ref={chipsScrollRef}
            onScroll={syncScrollCue}
            role="group"
            aria-label="กรองตามประเภทบริการ"
            className="flex items-center gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible hide-scrollbar scroll-smooth pr-8 sm:pr-0 py-0.5 sm:py-0"
          >
            {serviceFilters.map((filter) => {
              const isActive = selectedService === filter.id;
              const count = serviceCounts[filter.id];
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelectedService && setSelectedService(filter.id)}
                  className={`inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[34px] px-3 rounded-md border text-[12.5px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#132642] text-white border-[#132642] font-medium'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#93C5FD] hover:text-[#054D80] hover:bg-[#EDF4FB]'
                  }`}
                >
                  <span>{filter.label}</span>
                  {typeof count === 'number' && (
                    <span
                      className={`font-heading text-[11px] px-1.5 py-0.2 rounded-xs ${
                        isActive ? 'bg-white/20 text-slate-100' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Edge Fade + Cue Button (Mobile/Scrollable) */}
          <div
            className={`sm:hidden absolute right-0 top-0 bottom-0 w-11 z-10 flex items-center justify-end bg-gradient-to-l from-white via-white/92 to-transparent pointer-events-none transition-opacity duration-150 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => scrollChipsBy(140)}
              aria-label="เลื่อนดูบริการเพิ่มเติม"
              className={`w-7 h-7 rounded-md border border-slate-300 bg-white text-[#132642] shadow-xs flex items-center justify-center ${
                canScrollRight ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle GPS Hint when Location Not Enabled */}
        {!userLocation && (
          <div className="inline-flex items-center gap-1.5 text-[11.5px] sm:text-xs text-[#B45309] shrink-0">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>กด "เรียงตามร้านใกล้ฉัน" เพื่อแสดงระยะทางจริง</span>
          </div>
        )}
      </div>

      {/* Location Error (Only for non-permission hardware/timeout errors) */}
      {locationError && (
        <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 w-fit">
          {locationError}
        </p>
      )}
    </section>
  );
};

export default ProvidersFilterBar;
