import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

const Navbar = () => {
  // State สำหรับจัดการการซ่อน/แสดง Navbar อัตโนมัติ
  const [isVisible, setIsVisible] = useState(true);
  const { cartTotalQty } = useCart();
  const navigate = useNavigate();
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // ถ้าเลื่อนลงและเลื่อนไปมากกว่า 50px ให้ซ่อน Navbar
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        // ถ้าเลื่อนขึ้นให้แสดง Navbar
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header 
      // อัปเกรด Glassmorphism และเส้นขอบให้ดูคมขึ้น (Tech Dashboard Style)
      className={`bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* 1. Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="DH Notebook Logo" className="h-8 w-auto object-contain" />
            </Link>
          </div>

          {/* 2. Search Bar (Desktop) - อัปเกรดทรงเหลี่ยมมน (rounded-md) ให้อารมณ์หน้าต่าง Command */}
          <div className="hidden md:flex items-center relative w-full max-w-md mx-8 group">
            <input 
              type="text" 
              placeholder="ค้นหาสินค้า (SKU, ชื่อ)..." 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/80 p-1.5 rounded-sm transition-colors">
              <Search size={18} strokeWidth={2} />
            </button>
          </div>

          {/* 3. Action Icons */}
          <div className="flex items-center space-x-4 md:space-x-6">
            
            {/* ปุ่มตะกร้า - เปลี่ยนปุ่มและ Badge เป็น rounded-md / rounded-sm */}
            <div 
              className="relative cursor-pointer text-slate-600 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-100 rounded-md"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              {cartTotalQty > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-sm w-4 h-4 flex items-center justify-center border border-white shadow-sm">
                  {cartTotalQty > 99 ? '99+' : cartTotalQty}
                </span>
              )}
            </div>

            {/* ปุ่มโปรไฟล์ - เปลี่ยนเป็นทรงเหลี่ยมมน */}
            <Link to="/profile" className="flex items-center space-x-2 cursor-pointer text-slate-600 hover:text-emerald-600 transition-colors group">
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-md group-hover:bg-emerald-50/50 group-hover:border-emerald-300 transition-all shadow-sm">
                <User size={20} strokeWidth={1.5} className="text-slate-500 group-hover:text-emerald-600" />
              </div>
              <span className="hidden md:block font-semibold text-sm">เข้าสู่ระบบ</span>
            </Link>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;