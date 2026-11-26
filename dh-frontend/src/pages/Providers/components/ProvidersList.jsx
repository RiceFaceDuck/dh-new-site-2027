import PartnerCard from '../../Home/components/PartnerCard';
import { ChevronLeft, ChevronRight, Search, MapPin, Star } from 'lucide-react';

const ProvidersList = ({
  loading,
  visiblePartners,
  currentPage = 1,
  totalPages = 1,
  startIndex = 0,
  endIndex = 0,
  goToPage,
  nextPage,
  prevPage,
  totalCount = 0,
  userLocation = null,
  hasActiveFilter = false,
  activeServiceLabel = null,
  onResetFilters
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-slate-200 border-t-brand" />
        <span className="ml-3 text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลช่าง...</span>
      </div>
    );
  }

  if (visiblePartners.length === 0) {
    return (
      <div className="bg-white p-8 sm:p-10 rounded-lg text-center border border-dashed border-slate-300 mt-2">
        <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-[#EDF4FB] text-brand flex items-center justify-center">
          <Search className="w-5 h-5" />
        </div>
        <h3 className="font-heading text-base font-bold text-slate-900 mb-1">
          ไม่พบร้านช่างที่ตรงกับเงื่อนไข
        </h3>
        <p className="text-sm text-slate-500 font-light mb-4">
          ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูร้านช่างที่เปิดให้บริการทั้งหมด
        </p>
        {hasActiveFilter && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-[44px] px-5 rounded-md bg-brand text-white font-heading text-sm font-semibold hover:bg-brand-dark transition-colors cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Results Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 text-xs sm:text-[13px] text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            พบผู้ให้บริการ <strong className="font-heading font-semibold text-slate-900">{totalCount}</strong> ร้าน
          </span>
          {totalCount > 0 && (
            <span className="text-slate-400">
              (แสดง {startIndex + 1} – {endIndex})
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11.5px] bg-white border border-slate-200 rounded-sm px-2 py-0.5 text-slate-600">
            {userLocation ? (
              <>
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>เรียงตามระยะทางใกล้สุด</span>
              </>
            ) : (
              <>
                <Star className="w-3 h-3 text-amber-500" />
                <span>เรียงตามคะแนนแนะนำ</span>
              </>
            )}
          </span>
          {activeServiceLabel && (
            <span className="inline-flex items-center text-[11.5px] bg-[#EDF4FB] border border-[#C9E0F5] rounded-sm px-2 py-0.5 text-[#054D80] font-medium">
              บริการ: {activeServiceLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilter && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="min-h-[34px] px-2.5 rounded-md border border-slate-300 bg-white text-[#054D80] text-xs font-medium hover:border-brand hover:bg-[#EDF4FB] transition-colors cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
          {totalPages > 1 && (
            <span className="font-heading text-xs font-semibold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-sm">
              หน้า {currentPage} / {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Partner Cards Grid (1 / 2 / 3 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {visiblePartners.map((partner) => (
          <PartnerCard key={partner.id || partner.userId} partner={partner} placement="providers_directory" />
        ))}
      </div>

      {/* Pagination Controls (15 items/page, Touch >= 44px on Mobile) */}
      {totalPages > 1 && (
        <nav
          aria-label="เปลี่ยนหน้าผู้ให้บริการ"
          className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="text-xs text-slate-500">
            แสดง <strong className="font-heading text-slate-900">{startIndex + 1} – {endIndex}</strong> จากทั้งหมด{' '}
            <strong className="font-heading text-slate-900">{totalCount}</strong> รายการ
          </div>

          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="min-h-[44px] sm:min-h-[36px] px-3 text-xs font-heading font-semibold rounded-md border border-slate-300 bg-white text-slate-800 hover:border-brand hover:text-brand hover:bg-[#EDF4FB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>ย้อนกลับ</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage && goToPage(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={`min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] text-xs font-heading font-semibold rounded-md border transition-colors cursor-pointer ${
                    page === currentPage
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-brand hover:text-brand hover:bg-[#EDF4FB]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="min-h-[44px] sm:min-h-[36px] px-3 text-xs font-heading font-semibold rounded-md border border-slate-300 bg-white text-slate-800 hover:border-brand hover:text-brand hover:bg-[#EDF4FB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>ถัดไป</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default ProvidersList;
