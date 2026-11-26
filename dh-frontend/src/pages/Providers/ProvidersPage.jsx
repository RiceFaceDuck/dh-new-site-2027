import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, X, MapPin, Search } from 'lucide-react';
import { useProvidersList, PROVIDER_SERVICE_FILTERS } from './hooks/useProvidersList';
import ProvidersFilterBar from './components/ProvidersFilterBar';
import ProvidersList from './components/ProvidersList';

const ProvidersPage = () => {
  const {
    loading,
    visiblePartners,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    searchTerm,
    setSearchTerm,
    selectedService,
    setSelectedService,
    serviceCounts,
    resetFilters,
    userLocation,
    locationError,
    requestLocation,
    totalCount,
    allPartnersCount
  } = useProvidersList();

  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!showGuide) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowGuide(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGuide]);

  const activeServiceObj = PROVIDER_SERVICE_FILTERS.find((f) => f.id === selectedService);
  const hasActiveFilter = Boolean(searchTerm.trim() || selectedService !== 'all');

  return (
    <div className="w-full min-h-screen pb-24 md:pb-16 animate-fade-in">
      {/* Page Header (Precision Parts Cabinet — Matched with /categories & Flush under Navbar) */}
      <section className="bg-white border-b border-slate-200 -mt-4 md:-mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 md:py-5 mb-5 md:mb-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-3.5 md:gap-4">
          <div>
            <nav aria-label="เส้นทางหน้าเว็บ" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
              <Link to="/" className="hover:text-brand transition-colors">
                หน้าหลัก
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-brand font-medium">ค้นหาช่างและผู้ให้บริการ</span>
            </nav>

            <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              ค้นหาช่างและผู้ให้บริการ
            </h1>

            <p className="text-slate-500 font-light mt-1.5 text-xs md:text-[13.5px] leading-relaxed">
              รวมร้านซ่อมโน้ตบุ๊คและพาร์ทเนอร์ใกล้คุณ กรองตามอาการซ่อมหรือเรียงตามระยะทาง GPS ได้ทันที
            </p>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-2.5 shrink-0">
            {!loading && (
              <div
                aria-label="จำนวนผู้ให้บริการที่เปิดรับงาน"
                className="inline-flex items-center gap-2 bg-[#EDF4FB] text-[#054D80] border border-[#C9E0F5] rounded-md px-3 py-1.5 font-heading text-xs md:text-[12.5px] font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>พร้อมให้บริการ {allPartnersCount} ร้าน</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 bg-white text-[#054D80] border border-slate-300 rounded-md font-heading text-xs md:text-[12.5px] font-medium hover:border-brand hover:text-brand hover:bg-[#EDF4FB] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>วิธีใช้งาน</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {/* Unified Filter Bar (Search + GPS + Quick Service Chips) */}
        <ProvidersFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          serviceFilters={PROVIDER_SERVICE_FILTERS}
          serviceCounts={serviceCounts}
          requestLocation={requestLocation}
          userLocation={userLocation}
          locationError={locationError}
        />

        {/* Directory List & Pagination */}
        <ProvidersList
          loading={loading}
          visiblePartners={visiblePartners}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          goToPage={goToPage}
          nextPage={nextPage}
          prevPage={prevPage}
          totalCount={totalCount}
          userLocation={userLocation}
          hasActiveFilter={hasActiveFilter}
          activeServiceLabel={selectedService !== 'all' ? activeServiceObj?.label : null}
          onResetFilters={resetFilters}
        />
      </div>

      {/* In-App Guide Modal (Classic Curve 8px) */}
      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="วิธีใช้งานหน้าค้นหาช่าง"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
        >
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-slate-900">วิธีใช้งานหน้าค้นหาช่าง</h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="ปิดหน้าต่าง"
                className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F6F8FB] p-4 space-y-3">
              <div className="flex items-start gap-3 bg-white p-3 rounded-md border border-slate-200">
                <div className="w-9 h-9 rounded-md bg-[#EDF4FB] text-brand flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-slate-900 text-sm">1. หาร้านใกล้บ้านด้วย GPS</h4>
                  <p className="text-xs text-slate-500 font-light mt-0.5 leading-relaxed">
                    กดปุ่ม "เรียงตามร้านใกล้ฉัน" และอนุญาตพิกัด ระบบจะแสดงระยะทางและนำร้านใกล้ที่สุดขึ้นมาให้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-md border border-slate-200">
                <div className="w-9 h-9 rounded-md bg-[#EDF4FB] text-brand flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-slate-900 text-sm">2. กดเลือกอาการซ่อมหรือพิมพ์ค้นหา</h4>
                  <p className="text-xs text-slate-500 font-light mt-0.5 leading-relaxed">
                    แตะปุ่มกรองไวๆ เช่น "ซ่อมบอร์ด", "เปลี่ยนจอ", "MacBook" หรือพิมพ์ชื่อร้าน/พื้นที่ในช่องค้นหา
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full h-11 bg-brand text-white font-heading text-sm font-semibold rounded-md hover:bg-brand-dark transition-colors cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvidersPage;
