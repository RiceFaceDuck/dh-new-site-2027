import { useState } from 'react';
import { useCategories } from './hooks/useCategories';
import CategoryGrid from './components/CategoryGrid';
import CategoryModal from './components/CategoryModal';
import { LayoutGrid, ChevronRight, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LazyFeaturedSection from './components/LazyFeaturedSection';

const CategoriesMain = () => {
  const { categories, loading, error } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/70 min-h-screen pb-36 md:pb-20 animate-fade-in">
      {/* Formal Header Banner - Modern Glass & Elevation */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center text-xs md:text-sm text-slate-500 mb-1.5 md:mb-2">
                <Link to="/" className="hover:text-brand font-medium transition-colors">หน้าหลัก</Link>
                <span className="mx-2 text-slate-300">/</span>
                <span className="text-slate-800 font-semibold">หมวดหมู่อะไหล่</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                หมวดหมู่อะไหล่ทั้งหมด
              </h1>
              <p className="text-slate-600 mt-2 text-xs md:text-sm leading-relaxed max-w-3xl">
                คุณสามารถใช้ <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">Part Number (PN)</span> หรือชื่อรุ่น เพื่อค้นหาอะไหล่ได้ทันที
              </p>
            </div>

            {/* 🔍 Search Input ในหน้าหมวดหมู่ (ทั้งมือถือและจอคอม) */}
            <div className="w-full md:w-80 shrink-0">
              <form onSubmit={handleSearchSubmit} className="relative w-full group">
                <input 
                  type="text" 
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="ค้นหาอะไหล่, รหัส PN, หรือรุ่น..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-4 pr-11 py-2.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand/40 focus:border-brand focus:bg-white transition-all text-xs sm:text-sm placeholder-slate-400 group-hover:border-slate-300 shadow-2xs"
                />
                <button 
                  type="submit" 
                  aria-label="ค้นหาสินค้า" 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand text-white p-1.5 rounded-lg hover:bg-brand-dark transition-all active:scale-95 shadow-2xs"
                >
                  <Search size={15} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
        {/* Mobile View: ปุ่มกดเลือกหมวดหมู่แบบกะทัดรัด (กดแล้วเปิด Popup กลางจอ) */}
        <div className="block md:hidden mb-6">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-400 active:scale-[0.99] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  เลือกหมวดหมู่อะไหล่
                </div>
                <p className="text-xs text-slate-500">
                  {categories?.length ? `มี ${categories.length} หมวดหมู่พร้อมใช้งาน` : 'แตะเพื่อเลือกหมวดหมู่'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-100/80">
              <span>เลือกหมวด</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Desktop View: Grid 4 คอลัมน์เดิม 100% สเกล PC คงไว้เหมือนเดิม */}
        <div className="hidden md:block">
          <CategoryGrid categories={categories} loading={loading} error={error} />
        </div>

        {/* Modal Popup สำหรับเลือกหมวดหมู่บนมือถือ */}
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          categories={categories || []}
        />
        
        {/* ========================================================
            Section: Lazy Featured Products (โหลดเมื่อเลื่อนจอถึงเท่านั้น เพื่อประหยัดโควต้า 100%)
            ======================================================== */}
        <LazyFeaturedSection />
      </div>
    </div>
  );
};

export default CategoriesMain;
