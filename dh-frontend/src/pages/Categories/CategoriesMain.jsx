import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from './hooks/useCategories';
import CategoryGrid from './components/CategoryGrid';
import CategoryModal from './components/CategoryModal';
import LazyFeaturedSection from './components/LazyFeaturedSection';
import { CATEGORY_GROUPS, getCategoryMeta } from './utils/categoryIcons';

const MOBILE_INITIAL_LIMIT = 6;

const CategoriesMain = () => {
  const { categories, loading, error } = useCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('all');

  // Client-side group filter (0 extra Firestore reads)
  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    if (activeGroup === 'all') return categories;
    return categories.filter((cat) => getCategoryMeta(cat).group === activeGroup);
  }, [categories, activeGroup]);

  const shouldTruncateMobile =
    activeGroup === 'all' && filteredCategories.length > MOBILE_INITIAL_LIMIT;
  const mobileVisibleCategories = shouldTruncateMobile
    ? filteredCategories.slice(0, MOBILE_INITIAL_LIMIT)
    : filteredCategories;
  const hiddenMobileCount = Math.max(0, filteredCategories.length - MOBILE_INITIAL_LIMIT);

  return (
    <div className="w-full min-h-screen pb-24 md:pb-16 animate-fade-in">
      {/* Page Header: Matte White + Hairline Bottom Border + 4-Group Filter Pills */}
      <section className="bg-white border-b border-slate-200 -mt-4 md:-mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 md:py-5 mb-5 md:mb-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
              <Link to="/" className="hover:text-brand transition-colors">
                หน้าหลัก
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-brand font-medium">หมวดหมู่อะไหล่</span>
            </nav>

            <h1 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              หมวดหมู่อะไหล่ทั้งหมด
            </h1>

            <p className="text-slate-500 font-light mt-1.5 text-xs md:text-[13.5px] leading-relaxed flex items-center flex-wrap gap-1.5">
              <span>เลือกตามประเภทชิ้นส่วน หรือค้นหาด้วย</span>
              <span className="font-heading text-[11.5px] font-semibold bg-[#EDF4FB] text-[#054D80] border border-[#C9E0F5] px-1.5 py-0.5 rounded-sm">
                Part Number (PN)
              </span>
              <span>หรือรุ่นเครื่องได้ที่แถบด้านบนทันที</span>
            </p>
          </div>

          {/* 4-Group Filter Pills (Client-Side, Zero Extra Reads) */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-0.5 lg:pb-0 shrink-0">
            {CATEGORY_GROUPS.map((group) => {
              const isActive = activeGroup === group.id;
              const label =
                group.id === 'all' && categories.length > 0
                  ? `${group.label} (${categories.length})`
                  : group.label;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={`text-[12.5px] md:text-[13px] px-3 py-1.5 rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#132642] text-white border-[#132642] font-medium'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header Row + 2-Column Compact Grid (Shows 6 Categories Immediately) */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-2.5">
            <strong className="font-heading text-[15px] text-slate-900">
              เลือกตามหมวดหมู่
            </strong>
            {categories.length > 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="font-heading text-xs font-medium text-brand bg-[#EDF4FB] px-2.5 py-1.5 rounded-md active:scale-95 transition-transform"
              >
                ดูครบ {categories.length} หมวด
              </button>
            )}
          </div>

          <CategoryGrid
            categories={mobileVisibleCategories}
            loading={loading}
            error={error}
            compact
          />

          {shouldTruncateMobile && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2.5 w-full h-11 bg-white border border-dashed border-slate-400 rounded-md flex items-center justify-center gap-1.5 font-heading text-[13px] font-medium text-[#132642] active:scale-[0.99] transition-transform"
            >
              <span>+ ดูอีก {hiddenMobileCount} หมวดหมู่ทั้งหมด</span>
            </button>
          )}
        </div>

        {/* Tablet & Desktop Grid (3 Cols Tablet / 4 Cols PC) */}
        <div className="hidden md:block">
          <CategoryGrid
            categories={filteredCategories}
            loading={loading}
            error={error}
          />
        </div>

        {/* Modal Popup สำหรับเลือกหมวดหมู่ทั้งหมดบนมือถือ */}
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          categories={categories || []}
        />

        {/* Lazy Featured Products (โหลดเมื่อเลื่อนจอถึงเท่านั้น เพื่อประหยัดโควต้า 100%) */}
        <LazyFeaturedSection />
      </div>
    </div>
  );
};

export default CategoriesMain;
