import React from 'react';
import CustomerRow from './CustomerRow';
import { Loader2 } from 'lucide-react';

export default function CustomerTable({
  filteredCustomers,
  visibleCount,
  onScroll,
  loading,
  selectedCustomer,
  onSelectCustomer
}) {
  return (
    <div className="flex-1 overflow-hidden bg-dh-surface">
      <div 
        className="h-full overflow-y-auto scrollbar-thin"
        onScroll={onScroll}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-dh-muted space-y-3">
            <Loader2 size={32} className="animate-spin text-dh-accent" />
            <p className="font-medium animate-pulse text-sm">กำลังโหลดข้อมูลลูกค้า...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1">
            {filteredCustomers.slice(0, visibleCount).map(customer => {
              const currentSelectedId = selectedCustomer?.uid || selectedCustomer?.id;
              const customerId = customer?.uid || customer?.id;
              
              return (
                <CustomerRow
                  key={customerId}
                  customer={customer}
                  isSelected={currentSelectedId === customerId}
                  onSelect={onSelectCustomer}
                />
              );
            })}
            
            {/* โหลดเพิ่มเติม - Loading indicator (แสดงตอนที่เลื่อนลงมาสุด) */}
            {visibleCount < filteredCustomers.length && (
              <div className="py-6 flex justify-center items-center">
                <Loader2 size={20} className="animate-spin text-dh-accent/60" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-dh-muted p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-dh-main font-semibold">ไม่พบข้อมูลลูกค้า</p>
            <p className="text-sm">ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง</p>
          </div>
        )}
      </div>
    </div>
  );
}