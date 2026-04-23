import React from 'react';
import { Home, Search, ShoppingCart, User } from 'lucide-react';

const BottomNav = () => {
  return (
    // ซ่อนในหน้าจอขนาด md (แท็บเล็ต/PC) ขึ้นไป แสดงเฉพาะจอมือถือ
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-6 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-between items-center">
        
        <button className="flex flex-col items-center p-2 text-emerald-600 transition-colors">
          <Home size={24} strokeWidth={2.5} />
          <span className="text-[10px] mt-1 font-bold">หน้าแรก</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-gray-400 hover:text-emerald-600 transition-colors">
          <Search size={24} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium">ค้นหา</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-gray-400 hover:text-emerald-600 transition-colors relative">
          <div className="relative">
            <ShoppingCart size={24} strokeWidth={2} />
            {/* Badge แจ้งเตือนจำนวนสินค้าในตะกร้า */}
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              0
            </span>
          </div>
          <span className="text-[10px] mt-1 font-medium">ตะกร้า</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-gray-400 hover:text-emerald-600 transition-colors">
          <User size={24} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium">โปรไฟล์</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;