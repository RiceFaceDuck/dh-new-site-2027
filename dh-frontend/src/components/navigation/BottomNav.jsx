import React from 'react';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

const BottomNav = () => {
  const location = useLocation();
  const { cartTotalQty } = useCart();

  // ฟังก์ชันเช็คว่าหน้าปัจจุบันตรงกับเมนูไหน
  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'หน้าแรก', icon: Home },
    { path: '/search', label: 'ค้นหา', icon: Search },
    { path: '/cart', label: 'ตะกร้า', icon: ShoppingCart, badge: cartTotalQty },
    { path: '/profile', label: 'โปรไฟล์', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe">
      <div className="flex justify-around items-center h-[60px] px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {/* เส้นขีดเรืองแสงด้านบนเมื่อ Active (Tech Aesthetic) */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-emerald-500 rounded-b-sm shadow-[0_2px_8px_rgba(16,185,129,0.5)]"></div>
              )}
              
              {/* ไอคอนและ Badge ตะกร้า */}
              <div className="relative mt-1">
                <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-bold rounded-sm min-w-[16px] h-4 px-1 flex items-center justify-center border border-white shadow-sm font-tech">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;