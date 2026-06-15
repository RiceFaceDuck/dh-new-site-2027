import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft } from 'lucide-react';

const CartEmptyState = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-center animate-in fade-in duration-500">
      <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative group overflow-hidden">
        <ShoppingBag size={48} className="text-emerald-500 opacity-80 group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <h2 className="text-2xl font-black text-gray-800 mb-3">ตะกร้าสินค้าว่างเปล่า</h2>
      <p className="text-sm text-gray-500 mb-8">คุณยังไม่มีสินค้าในตะกร้า ลองดูสินค้าที่น่าสนใจในร้านของเราสิ!</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm hover:shadow active:scale-95">
        <ChevronLeft size={18} /> เลือกซื้อสินค้าต่อ
      </Link>
    </div>
  );
};

export default CartEmptyState;
