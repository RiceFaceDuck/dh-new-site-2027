import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, LogOut, Wallet, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { logoutUser } from '../firebase/authService';

const Navbar = () => {
  // State ดั้งเดิม
  const [isVisible, setIsVisible] = useState(true);
  const { cartTotalQty } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [lastScrollY, setLastScrollY] = useState(0);

  // 🌟 State ใหม่สำหรับจัดการ Auth & Dropdown
  const [currentUser, setCurrentUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. ตรวจสอบสถานะการ Login แบบ Real-time
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. จัดการการซ่อน/แสดง Navbar เมื่อ Scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
        setIsDropdownOpen(false); // ปิด dropdown เวลาเลื่อนจอลง
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 3. ระบบปิด Dropdown เมื่อคลิกพื้นที่อื่น (Click-Outside)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // ดึงตัวอักษรตัวแรกของอีเมลมาทำเป็น Avatar ถ้าไม่มีรูป
  const getInitial = (email) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header 
      className={`bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 transition-all duration-300 shadow-sm ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Top utility bar (Optional - สามารถลบได้ถ้าไม่ใช้ แต่ใส่ไว้ให้ดู Premium) */}
      <div className="bg-slate-900 text-slate-300 text-[10px] md:text-xs py-1.5 px-4 flex justify-between items-center hidden sm:flex">
        <div className="flex gap-4">
          <span className="hover:text-white cursor-pointer transition-colors">ฝ่ายบริการลูกค้า</span>
          <span className="hover:text-white cursor-pointer transition-colors">ติดตามสถานะการจัดส่ง</span>
        </div>
        <div className="flex gap-4">
          <span className="text-emerald-400 font-medium">✨ พาร์ทเนอร์รับเครดิตเงินคืนสูงสุด 5%</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo Section */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-md group-hover:scale-105 transition-transform duration-300">
                DH
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold text-slate-800 leading-tight">Notebook</span>
                <span className="text-[10px] text-emerald-600 font-medium tracking-wider">ECOSYSTEM</span>
              </div>
            </Link>
          </div>

          {/* Search Bar (Middle - Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full group">
              <input 
                type="text" 
                placeholder="ค้นหาอะไหล่, รหัสสินค้า, หรือรุ่นโน๊ตบุ๊ค..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-5 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white transition-all duration-300 text-sm placeholder-slate-400 group-hover:border-slate-300"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 text-white p-1.5 rounded-full hover:bg-emerald-600 transition-colors shadow-sm">
                <Search size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 md:space-x-5">
            
            {/* Search Icon (Mobile Only) */}
            <button className="md:hidden text-slate-600 hover:text-emerald-600 p-2">
              <Search size={22} strokeWidth={1.5} />
            </button>

            {/* Shopping Cart Button */}
            <div 
              className="relative cursor-pointer text-slate-600 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-50 rounded-xl"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              {cartTotalQty > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm animate-fade-in">
                  {cartTotalQty > 99 ? '99+' : cartTotalQty}
                </span>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

            {/* 🌟 User Profile / Auth Area 🌟 */}
            <div className="relative" ref={dropdownRef}>
              {!currentUser ? (
                // 🔴 ยังไม่ล็อกอิน: แสดงปุ่มเข้าสู่ระบบ
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0870B8] hover:bg-[#065a96] text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                </button>
              ) : (
                // 🟢 ล็อกอินแล้ว: แสดง Avatar และ Dropdown
                <>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full border transition-all duration-300 ${
                      isDropdownOpen ? 'bg-slate-50 border-emerald-200 shadow-inner' : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <div className="relative">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
                          {getInitial(currentUser.email)}
                        </div>
                      )}
                      {/* 🔴 Gimmick: Notification Dot เต้นเบาๆ */}
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                      </span>
                    </div>
                    
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[100px] leading-none mb-0.5">
                        {currentUser.displayName || 'พาร์ทเนอร์'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium leading-none">Online</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 🔽 Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform origin-top-right transition-all animate-fade-in z-50">
                      
                      {/* Header Info */}
                      <div className="p-4 bg-slate-50/80 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-800 truncate">{currentUser.displayName || 'ผู้ใช้งาน DH Notebook'}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                      </div>
                      
                      {/* Menu Links */}
                      <div className="p-2 space-y-1">
                        <Link 
                          to="/profile?tab=overview" 
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${location.search.includes('tab=overview') || !location.search ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}
                        >
                          <LayoutDashboard size={18} className={location.search.includes('tab=overview') || !location.search ? 'text-emerald-600' : 'text-slate-400'} /> 
                          แดชบอร์ดส่วนตัว
                        </Link>
                        
                        <Link 
                          to="/profile?tab=wallet" 
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${location.search.includes('tab=wallet') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}
                        >
                          <Wallet size={18} className={location.search.includes('tab=wallet') ? 'text-emerald-600' : 'text-slate-400'} /> 
                          เครดิต & กระเป๋าเงิน
                          {/* 🔴 Badge ย้ำเตือนในเมนู */}
                          <span className="ml-auto bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">มีรายการรอรับ</span>
                        </Link>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          ออกจากระบบ
                          <LogOut size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;