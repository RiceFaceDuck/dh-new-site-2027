import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  // State สำหรับจัดการการซ่อน/แสดง Navbar อัตโนมัติ
  const [isVisible, setIsVisible] = useState(true);
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
        
        {/* 1. Logo (เรียบง่าย เล็กกระชับ) */}
        <Link to="/" className="flex items-center group cursor-pointer">
          <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tighter">
            DH<span className="text-red-600 text-[10px] md:text-[11px] block -mt-1.5 md:-mt-2 tracking-widest font-bold">NOTEBOOK</span>
          </div>
        </Link>

        {/* 2. Search Bar (โค้งมน บางเบา) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group">
          <input
            type="text"
            placeholder="ค้นหาอะไหล่, รุ่น, หรือ SKU..."
            className="w-full py-2 pl-5 pr-10 rounded-full border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50/50 hover:bg-white text-sm transition-colors"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 p-1 rounded-full transition-colors">
            <Search size={18} strokeWidth={2} />
          </button>
        </div>

        {/* 3. Action Icons (ใช้เส้นบางสุด) */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="relative cursor-pointer text-gray-600 hover:text-emerald-600 transition-colors">
            <ShoppingCart size={22} strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
              0
            </span>
          </div>

          <Link to="/profile" className="flex items-center space-x-2 cursor-pointer text-gray-600 hover:text-emerald-600 transition-colors group">
            <div className="bg-gray-50 border border-gray-100 p-1.5 rounded-full group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
              <User size={18} strokeWidth={1.5} />
            </div>
            <span className="hidden md:block text-xs font-semibold">บัญชีของฉัน</span>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Navbar;