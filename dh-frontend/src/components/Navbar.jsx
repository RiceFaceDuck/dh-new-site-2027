import { useState, useEffect } from 'react';
import { Search, ShoppingCart, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useNavbarScroll } from '../hooks/useNavbarScroll';
import { useNavbarAuth } from '../hooks/useNavbarAuth';

// 🌟 Pure UI Subcomponents (สกัดตามหลัก SRP และลดความซับซ้อนของ Navbar)
const NavAvatar = ({ photoURL, navAvatarError, setNavAvatarError, email, getInitial }) => (
  <div className="relative">
    {photoURL && !navAvatarError ? (
      <img 
        src={photoURL} 
        alt="Profile" 
        className="w-8 h-8 rounded-full object-contain border border-slate-200" 
        loading="lazy" 
        referrerPolicy="no-referrer"
        onError={() => setNavAvatarError(true)}
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-linear-to-br from-brand-light to-white text-brand flex items-center justify-center font-bold text-sm border border-brand-light">
        {getInitial(email)}
      </div>
    )}
  </div>
);

const CartBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-xs transition-transform duration-300 scale-110 animate-bounce">
      {count > 99 ? '99+' : count}
    </span>
  );
};

const Navbar = () => {
  const { cartTotalQty } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [navAvatarError, setNavAvatarError] = useState(false);

  // 🌟 Custom Hooks สกัด Logic ออกจาก Component UI
  const {
    currentUser,
    loading,
    getInitial,
  } = useNavbarAuth();

  useEffect(() => {
    setNavAvatarError(false);
  }, [currentUser?.photoURL]);

  // 🔍 ซิงค์คำค้นหาใน Navbar กับ URL query เมื่ออยู่ที่หน้า /search
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || '';
      setSearchQuery(q);
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);

  const { isVisible } = useNavbarScroll();

  // ค้นหาสินค้า
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else if (location.pathname === '/search') {
      navigate('/search');
    }
  };

  return (
    <header 
      className={`bg-brand-dark border-b border-white/10 sticky top-0 z-50 transition-all duration-300 shadow-md ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center h-16 md:h-20">
          
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center group">
              <img 
                loading="lazy" 
                src="/logo.jpg" 
                alt="DH Notebook Logo" 
                className="h-10 md:h-12 w-auto object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </Link>
          </div>

          {/* Search Bar (Middle - Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full group">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาอะไหล่, รหัสสินค้า, หรือรุ่นโน๊ตบุ๊ค..." 
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 px-5 py-2.5 rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-brand focus:bg-white transition-all duration-300 text-sm placeholder-slate-400 group-hover:border-slate-400"
              />
              <button type="submit" aria-label="ค้นหาสินค้า" className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand text-white p-1.5 rounded-md hover:bg-brand-dark transition-colors shadow-xs">
                <Search size={16} strokeWidth={2.5} />
              </button>
            </form>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 md:space-x-5">
            
            {/* Search Icon (Mobile Only) */}
            <button 
              onClick={() => navigate('/search')}
              onMouseEnter={() => import('../pages/SearchPage')}
              aria-label="เปิดหน้าค้นหาบนมือถือ"
              className="md:hidden text-slate-300 hover:text-white p-2"
            >
              <Search size={22} strokeWidth={1.5} />
            </button>

            {/* Shopping Cart Button */}
            <div 
              role="button"
              tabIndex={0}
              aria-label="ดูตะกร้าสินค้า"
              className="relative cursor-pointer text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-md focus:outline-hidden focus:ring-2 focus:ring-brand"
              onClick={() => navigate('/cart')}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/cart'); }}
              onMouseEnter={() => import('../pages/Cart')}
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              <CartBadge count={cartTotalQty} />
            </div>

            <div className="h-6 w-px bg-white/20 hidden md:block mx-1"></div>

            {/* 🌟 User Profile / Auth Area (Desktop Only: md ขึ้นไป ส่วนมือถือใช้แถบเมนู BottomNav ด้านล่าง) 🌟 */}
            <div className="relative hidden md:block">
              {loading ? (
                // 🌀 กำลังตรวจสอบสถานะ: แสดง Skeleton สวยงาม ป้องกัน Flash เข้าสู่ระบบ
                <div className="w-20 sm:w-28 h-8 sm:h-9 bg-white/10 rounded-md animate-pulse border border-white/10" />
              ) : (
                <>
                  {!currentUser ? (
                    // 🔴 ยังไม่ล็อกอิน: แสดงปุ่มเข้าสู่ระบบ
                    <button 
                      onClick={() => navigate('/profile')}
                      onMouseEnter={() => import('../pages/Profile')}
                      className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-md transition-all shadow-xs hover:shadow-sm active:scale-95"
                    >
                      <User size={18} />
                      <span>เข้าสู่ระบบ</span>
                    </button>
                  ) : (
                    // 🟢 ล็อกอินแล้ว: แสดง Avatar และกดเพื่อไปหน้าโปรไฟล์ทันที
                    <button 
                      type="button"
                      aria-label="ไปยังหน้าโปรไฟล์ผู้ใช้งาน"
                      onClick={() => navigate('/profile')}
                      onMouseEnter={() => import('../pages/Profile')}
                      className="flex items-center gap-2.5 p-1.5 pr-3 rounded-md border border-white/20 hover:border-brand-accent hover:bg-white/10 shadow-xs transition-all duration-300 cursor-pointer active:scale-95"
                    >
                      <NavAvatar 
                        photoURL={currentUser.photoURL}
                        navAvatarError={navAvatarError}
                        setNavAvatarError={setNavAvatarError}
                        email={currentUser.email}
                        getInitial={getInitial}
                      />
                      
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-white truncate max-w-[100px] leading-none mb-0.5">
                          {currentUser.displayName || 'พาร์ทเนอร์'}
                        </span>
                        <span className="text-[10px] text-brand-light font-medium leading-none">Online</span>
                      </div>
                    </button>
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
