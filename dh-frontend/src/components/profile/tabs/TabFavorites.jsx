import React from 'react';
import { Heart, ShoppingCart } from 'lucide-react';

const TabFavorites = () => (
  <div className="animate-in fade-in duration-500">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Heart size={22} className="text-emerald-600 fill-emerald-100" /> สินค้าที่ถูกใจ
      </h2>
      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
        1 รายการ
      </span>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* ตัวอย่างสินค้าที่ถูกใจ */}
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full relative">
        <button className="absolute top-2 right-2 z-10 text-red-500 bg-white p-1.5 rounded-full shadow-sm border border-gray-100 hover:scale-110 transition-transform">
          <Heart size={16} className="fill-red-500" />
        </button>
        <div className="aspect-square mb-3 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center mix-blend-multiply p-2">
          <img src="https://via.placeholder.com/200x200?text=Product" alt="Fav Product" className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
        </div>
        <div className="flex-1 flex flex-col">
          <p className="text-[9px] text-gray-400 mb-1 font-medium">SKU: MB-89201</p>
          <h3 className="text-xs font-semibold text-gray-700 line-clamp-2 mb-2 group-hover:text-emerald-600">เมนบอร์ดโน๊ตบุ๊ค รุ่นตัวอย่าง</h3>
          <div className="mt-auto pt-2 border-t border-gray-50">
            <span className="text-sm font-bold text-red-600 block mb-2">฿3,500</span>
            <button className="w-full bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
              <ShoppingCart size={14} /> ใส่ตะกร้า
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TabFavorites;