import CustomerRow from './CustomerRow';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomerTable({
  filteredCustomers = [],
  paginatedCustomers,
  totalCustomersCount,
  currentPage = 1,
  totalPages = 1,
  onNextPage,
  onPrevPage,
  onGoToPage,
  visibleCount,
  onScroll,
  loading,
  selectedCustomer,
  onSelectCustomer
}) {
  // 📐 สูตรปรับตรงตามดีไซน์ Production (10 คอลัมน์ แยก Role 90px และ Tier 90px ชัดเจน พร้อม gap-4)
  const gridLayout = "grid grid-cols-[130px_minmax(180px,1.5fr)_110px_100px_90px_90px_100px_90px_100px_110px] gap-4 w-full";

  // ใช้ paginatedCustomers (21 คน) หากระบุมา หรือ Fallback ไป filteredCustomers
  const customersToRender = paginatedCustomers || filteredCustomers.slice(0, visibleCount || 21);
  const totalItems = totalCustomersCount !== undefined ? totalCustomersCount : filteredCustomers.length;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * 21 + 1;
  const endItem = Math.min(currentPage * 21, totalItems);

  return (
    <div className="flex-1 overflow-hidden bg-white flex flex-col border-t border-slate-200">
      
      {/* 📜 ส่วนตารางที่สามารถ Scroll ซ้าย-ขวา และ บน-ล่าง ได้ */}
      <div 
        className="flex-1 overflow-auto scrollbar-thin relative flex flex-col justify-between"
        onScroll={onScroll}
      >
        <div className="min-w-[1180px] flex flex-col min-h-full">
          
          {/* 👑 Table Header (แถวบนสุด - ปักหมุดไว้ด้านบนเสมอ) */}
          <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
            <div className={`px-4 py-3.5 text-[13px] font-bold text-slate-700 uppercase tracking-wider ${gridLayout}`}>
              <div className="flex items-center gap-1 whitespace-nowrap">
                Customer ID <span className="text-indigo-600 font-bold">({totalItems.toLocaleString()})</span>
              </div>
              <div className="flex items-center">Profile</div>
              <div className="flex items-center">Phone</div>
              <div className="flex items-center">Logistic</div>
              <div className="flex items-center justify-center">Role</div>
              <div className="flex items-center justify-center">Tier</div>
              <div className="text-right">DH ค้างยอด</div>
              <div className="text-right">Points</div>
              <div className="text-center">บิลล่าสุด</div>
              <div className="text-right">30D Paid Out</div>
            </div>
          </div>
          
          {/* 📝 Table Body */}
          <div className="flex-1 bg-white pb-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
                <Loader2 size={28} className="animate-spin text-indigo-500" />
                <p className="font-bold text-sm tracking-wide">กำลังเชื่อมต่อฐานข้อมูล...</p>
              </div>
            ) : customersToRender.length > 0 ? (
              <div className="flex flex-col">
                {customersToRender.map(customer => {
                  const currentSelectedId = selectedCustomer?.uid || selectedCustomer?.id;
                  const customerId = customer?.uid || customer?.id;
                  return (
                    <CustomerRow
                      key={customerId}
                      customer={customer}
                      isSelected={currentSelectedId === customerId}
                      onSelect={onSelectCustomer}
                      gridLayout={gridLayout}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3 shadow-xs">
                  <Search className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-700 font-bold">ไม่พบข้อมูลลูกค้า</p>
                <p className="text-xs mt-1 font-medium">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 📄 Pagination Bar (แถบควบคุมเปลี่ยนหน้าแบบ 21 รายชื่อ/หน้า) */}
      {!loading && totalItems > 0 && (
        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">
            แสดง <span className="text-indigo-600 font-bold">{startItem} - {endItem}</span> จากทั้งหมด <span className="text-slate-800 font-bold">{totalItems.toLocaleString()}</span> รายชื่อ
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevPage}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              title="หน้าก่อนหน้า"
            >
              <ChevronLeft size={14} />
              <span>ย้อนกลับ</span>
            </button>

            <div className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700">
              หน้า <span className="text-indigo-600">{currentPage}</span> / {totalPages}
            </div>

            <button
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              title="หน้าถัดไป"
            >
              <span>ถัดไป</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}