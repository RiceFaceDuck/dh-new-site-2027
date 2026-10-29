import PartnerCard from '../../Home/components/PartnerCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  totalCount = 0
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
        <span className="ml-3 text-slate-500 font-medium">กำลังโหลดข้อมูลช่าง...</span>
      </div>
    );
  }

  if (visiblePartners.length === 0) {
    return (
      <div className="bg-slate-50 p-10 rounded-2xl text-center border border-slate-200 mt-4">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่พบร้านค้าที่ตรงกับเงื่อนไข</h3>
        <p className="text-sm text-slate-500">ลองเปลี่ยนคำค้นหา หรือขยายขอบเขตการค้นหาดูอีกครั้ง</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1 text-sm text-slate-500 font-medium">
        <div>
          พบผู้ให้บริการทั้งหมด <span className="font-bold text-slate-700">{totalCount}</span> รายการ
          {totalCount > 0 && (
            <span className="text-slate-400 ml-1.5 text-xs">
              (แสดง {startIndex + 1} - {endIndex} จากทั้งหมด {totalCount} รายการ)
            </span>
          )}
        </div>
        {totalPages > 1 && (
          <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md w-fit">
            หน้า {currentPage} / {totalPages}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {visiblePartners.map((partner) => (
          <PartnerCard key={partner.id || partner.userId} partner={partner} placement="providers_directory" />
        ))}
      </div>

      {/* Pagination Controls (เริ่มต้น 15 ร้านต่อหน้า ถ้ามีเพิ่มกดเปลี่ยนหน้า) */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            แสดง <span className="font-bold text-slate-700">{startIndex + 1} - {endIndex}</span> จากทั้งหมด <span className="font-bold text-slate-700">{totalCount}</span> รายการ
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-xs font-bold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs transition-all active:scale-95 flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>ย้อนกลับ</span>
            </button>

            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage && goToPage(page)}
                  className={`w-8 h-8 text-xs font-bold rounded-md border transition-all ${
                    page === currentPage
                      ? 'bg-brand text-white border-brand shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-bold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed shadow-2xs transition-all active:scale-95 flex items-center gap-1"
            >
              <span>ถัดไป</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvidersList;
