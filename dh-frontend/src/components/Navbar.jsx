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
      className={`bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-between">
        
        {/* 1. Logo (ขนาดเล็กตาม Request) ใช้รูปจริง */}
        <Link to="/" className="flex items-center group cursor-pointer transition-transform hover:scale-105">
          <img src="/logo.png" alt="DH Notebook Logo" className="h-6 sm:h-8 object-contain" />
        </Link>

        {/* 2. Search Bar (โค้งมน ดูสะอาดตา) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group">
          <input
            type="text"
            placeholder="ค้นหาอะไหล่, รุ่น, หรือ SKU..."
            className="w-full py-2.5 pl-5 pr-12 rounded-full border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 hover:bg-white text-sm transition-all shadow-sm"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition-colors">
            <Search size={18} strokeWidth={2} />
          </button>
        </div>

        {/* 3. Action Icons */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <div 
            className="relative cursor-pointer text-slate-600 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={22} strokeWidth={1.5} />
            {cartTotalQty > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-sm">
                {cartTotalQty > 99 ? '99+' : cartTotalQty}
              </span>
            )}
          </div>

          <Link to="/profile" className="flex items-center space-x-2 cursor-pointer text-slate-600 hover:text-emerald-600 transition-colors group">
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-full group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors shadow-sm">
              <User size={18} strokeWidth={1.5} />
            </div>
            <span className="hidden md:block text-xs font-bold tracking-wide">บัญชีของฉัน</span>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Navbar;