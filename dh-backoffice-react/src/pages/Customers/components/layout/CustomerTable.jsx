import React from 'react';
import CustomerRow from './CustomerRow';
import { Loader2, Search } from 'lucide-react';

export default function CustomerTable({
  filteredCustomers,
  visibleCount,
  onScroll,
  loading,
  selectedCustomer,
  onSelectCustomer
}) {
  // 📐 สูตรปรับใหม่: ขยายรหัสลูกค้า (110px), ลดชื่อลง (minmax 180px) และจัดสมดุลคอลัมน์อื่นๆ
  const gridLayout = "grid grid-cols-[110px_minmax(180px,1.5fr)_110px_110px_90px_100px_90px_100px_110px] gap-4 w-full";

  return (
    <div className="flex-1 overflow-hidden bg-white flex flex-col border-t border-slate-200">
      
      {/* 📜 ส่วนตารางที่สามารถ Scroll ซ้าย-ขวา และ บน-ล่าง ได้ */}
      <div 
        className="flex-1 overflow-auto scrollbar-thin relative"
        onScroll={onScroll}
      >
        <div className="min-w-[1080px] flex flex-col min-h-full">
          
          {/* 👑 Table Header (แถวบนสุด - ปักหมุดไว้ด้านบนเสมอ) */}
          <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className={`${gridLayout} px-4 py-3 text-[10.5px] font-black text-slate-500 uppercase tracking-widest`}>
              <div className="truncate">รหัสลูกค้า</div>
              <div className="truncate">ชื่อ-นามสกุล / บัญชี</div>
              <div className="truncate">เบอร์โทรศัพท์</div>
              <div className="truncate">ขนส่งประจำ</div>
              <div className="text-center truncate">ระดับ</div>
              <div className="text-right truncate">Wallet</div>
              <div className="text-right truncate">Points</div>
              <div className="text-center truncate">สั่งล่าสุด</div>
              <div className="text-right truncate">ยอด 30 วัน</div>
            </div>
          </div>

          {/* 📝 Table Body (รายชื่อลูกค้า) */}
          <div className="flex-1 bg-white pb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
                <Loader2 size={28} className="animate-spin text-indigo-500" />
                <p className="font-bold text-sm tracking-wide">กำลังเชื่อมต่อฐานข้อมูล...</p>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div className="flex flex-col">
                {filteredCustomers.slice(0, visibleCount).map(customer => {
                  const currentSelectedId = selectedCustomer?.uid || selectedCustomer?.id;
                  const customerId = customer?.uid || customer?.id;
                  return (
                    <CustomerRow
                      key={customerId}
                      customer={customer}
                      isSelected={currentSelectedId === customerId}
                      onSelect={onSelectCustomer}
                      gridLayout={gridLayout} // ส่งสูตร Layout ไปให้แถวใช้งาน
                    />
                  );
                })}
                
                {/* Loader กรณีเลื่อนลงมาสุดแล้วกำลังโหลดเพิ่ม */}
                {visibleCount < filteredCustomers.length && (
                  <div className="py-6 flex justify-center items-center">
                    <Loader2 size={20} className="animate-spin text-indigo-400" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3 shadow-sm">
                  <Search className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-700 font-bold">ไม่พบข้อมูลลูกค้า</p>
                <p className="text-xs mt-1 font-medium">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}