import React from 'react';
import { Home, Search, ShoppingCart, User } from 'lucide-react';

const BottomNav = () => {
  return (
    // ซ่อนในหน้าจอขนาด md (แท็บเล็ต/PC) ขึ้นไป แสดงเฉพาะจอมือถือ เพิ่ม blur ให้ดูทันสมัย
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 px-6 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe">
      <div className="flex justify-between items-center">
        
        <button className="flex flex-col items-center p-2 text-emerald-600 transition-all scale-105">
          <Home size={24} strokeWidth={2.5} />
          <span className="text-[10px] mt-1 font-bold tracking-wide">หน้าแรก</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-slate-400 hover:text-emerald-600 transition-colors active:scale-95">
          <Search size={24} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">ค้นหา</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-slate-400 hover:text-emerald-600 transition-colors relative active:scale-95">
          <div className="relative">
            <ShoppingCart size={24} strokeWidth={2} />
            {/* Badge แจ้งเตือนจำนวนสินค้าในตะกร้า */}
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
              0
            </span>
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-wide">ตะกร้า</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-slate-400 hover:text-emerald-600 transition-colors active:scale-95">
          <User size={24} strokeWidth={2} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">โปรไฟล์</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;