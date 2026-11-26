import { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useNavbarScroll } from '../hooks/useNavbarScroll';
import { useNavbarAuth } from '../hooks/useNavbarAuth';

// Pure UI Subcomponents (SRP)
const NavAvatar = ({ photoURL, navAvatarError, setNavAvatarError, email, getInitial }) => (
  <div className="relative shrink-0">
    {photoURL && !navAvatarError ? (
      <img
        src={photoURL}
        alt="Profile"
        className="w-7 h-7 rounded-full bg-white p-0.5 object-contain border border-white/30"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setNavAvatarError(true)}
      />
    ) : (
      <div className="w-7 h-7 rounded-full bg-white text-brand flex items-center justify-center font-heading font-bold text-xs">
        {getInitial(email)}
      </div>
    )}
  </div>
);

const CartBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-[#132642] font-heading text-[11px] font-bold rounded-full min-w-[19px] h-[19px] px-1 flex items-center justify-center border-2 border-[#132642] leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
};

const NavbarSearchForm = ({
  searchQuery,
  setSearchQuery,
  onSubmit,
  onClear,
  isMobile = false
}) => (
  <form onSubmit={onSubmit} className="relative w-full flex items-center">
    <Search
      size={16}
      strokeWidth={2}
      className="absolute left-3 text-slate-400 pointer-events-none"
    />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="ค้นหาอะไหล่, รหัส Part Number (PN), หรือรุ่นโน้ตบุ๊ค..."
      className={`w-full bg-white border-2 border-transparent focus:border-[#38BDF8] text-slate-900 placeholder:text-slate-400 placeholder:font-light rounded-md focus:outline-hidden transition-colors ${
        isMobile
          ? 'h-[40px] pl-9 pr-[88px] text-[15px]'
          : 'h-[42px] pl-9 pr-[104px] text-sm'
      }`}
    />
    {searchQuery && (
      <button
        type="button"
        onClick={onClear}
        aria-label="ล้างคำค้นหา"
        className={`absolute w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer ${
          isMobile ? 'right-[64px]' : 'right-[76px]'
        }`}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    )}
    <button
      type="submit"
      aria-label="ค้นหาสินค้า"
      className={`absolute right-1 bg-brand hover:bg-brand-dark text-white font-heading font-medium rounded-sm transition-colors cursor-pointer ${
        isMobile ? 'h-[32px] px-3 text-xs' : 'h-[34px] px-3.5 text-[13px]'
      }`}
    >
      ค้นหา
    </button>
  </form>
);

const Navbar = () => {
  const { cartTotalQty } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [navAvatarError, setNavAvatarError] = useState(false);

  const { currentUser, loading, getInitial } = useNavbarAuth();

  useEffect(() => {
    setNavAvatarError(false);
  }, [currentUser?.photoURL]);

  // ซิงค์คำค้นหาใน Navbar กับ URL query เมื่ออยู่ที่หน้า /search
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      setSearchQuery(params.get('q') || '');
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);

  const { isVisible } = useNavbarScroll();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else if (location.pathname === '/search') {
      navigate('/search');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (location.pathname === '/search') {
      navigate('/search');
    }
  };

  return (
    <header
      className={`bg-brand-dark border-b border-white/10 sticky top-0 z-50 transition-transform duration-300 shadow-[0_2px_10px_rgba(15,23,42,0.18)] ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3 md:gap-5 py-2.5 md:py-3">
          {/* Left: Brand Logo + Title & Subtitle */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 md:w-[38px] md:h-[38px] rounded-md bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img
                loading="lazy"
                src="/logo.png"
                alt="DH-Servicehub Logo"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.target.src = '/logo.jpg';
                }}
              />
            </div>
            <div className="text-left leading-tight">
              <strong className="block font-heading text-[15px] md:text-[15.5px] font-bold text-white tracking-normal">
                DH-Servicehub
              </strong>
              <span className="hidden lg:block text-[11px] text-slate-400 font-light mt-0.5">
                ศูนย์อะไหล่โน้ตบุ๊คสำหรับช่างและร้านค้า
              </span>
            </div>
          </Link>

          {/* Center: Search Bar (Tablet & Desktop) */}
          <div className="hidden md:flex flex-1 max-w-[580px] mx-auto">
            <NavbarSearchForm
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSubmit={handleSearchSubmit}
              onClear={handleClearSearch}
            />
          </div>

          {/* Right: Cart Button + User Pill */}
          <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
            <button
              type="button"
              aria-label="ดูตะกร้าสินค้า"
              onClick={() => navigate('/cart')}
              onMouseEnter={() => import('../pages/Cart')}
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-md bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white flex items-center justify-center transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#38BDF8] cursor-pointer"
            >
              <ShoppingCart size={19} strokeWidth={1.9} />
              <CartBadge count={cartTotalQty} />
            </button>

            {/* User Profile / Auth Pill (Desktop/Tablet md+) */}
            <div className="hidden md:block">
              {loading ? (
                <div className="w-28 h-9 bg-white/10 rounded-full animate-pulse border border-white/10" />
              ) : !currentUser ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  onMouseEnter={() => import('../pages/Profile')}
                  className="inline-flex items-center gap-2 h-10 px-4 bg-brand hover:bg-brand-dark text-white font-heading text-sm font-medium rounded-md transition-colors shadow-xs cursor-pointer"
                >
                  <User size={16} />
                  <span>เข้าสู่ระบบ</span>
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="ไปยังหน้าโปรไฟล์ผู้ใช้งาน"
                  onClick={() => navigate('/profile')}
                  onMouseEnter={() => import('../pages/Profile')}
                  className="flex items-center gap-2 py-1 pl-1.5 pr-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 transition-colors cursor-pointer"
                >
                  <NavAvatar
                    photoURL={currentUser.photoURL}
                    navAvatarError={navAvatarError}
                    setNavAvatarError={setNavAvatarError}
                    email={currentUser.email}
                    getInitial={getInitial}
                  />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium text-white truncate max-w-[110px]">
                      {currentUser.displayName || 'พาร์ทเนอร์'}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Online
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Full-Width Search Row (Matches Simulator Mobile Navbar) */}
        <div className="md:hidden pb-2.5">
          <NavbarSearchForm
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSubmit={handleSearchSubmit}
            onClear={handleClearSearch}
            isMobile
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
