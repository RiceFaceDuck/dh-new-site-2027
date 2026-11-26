import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LayoutGrid, Search } from 'lucide-react';
import { CategorySvgIcon } from '../utils/categoryIcons';

const CategoryModal = ({ isOpen, onClose, categories = [] }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((cat) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      cat.name?.toLowerCase().includes(q) ||
      cat.type?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (categoryType) => {
    onClose();
    navigate(`/category/${categoryType}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[84vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#EDF4FB] text-brand flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-[15px] font-bold text-slate-900 leading-tight">
                หมวดหมู่อะไหล่ทั้งหมด ({categories.length})
              </h3>
              <p className="text-xs text-slate-500">
                เลือกหมวดหมู่ที่ต้องการดูรายการอะไหล่
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center transition-colors active:scale-95"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar inside Modal */}
        {categories.length > 6 && (
          <div className="px-3.5 py-2.5 border-b border-slate-100 bg-white">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="พิมพ์ชื่อหมวดหมู่ เช่น จอ, พัดลม, สายแพ..."
                className="w-full h-10 pl-9 pr-8 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:border-brand focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Items Grid (2 Columns with New Technical SVG Icons) */}
        <div className="overflow-y-auto p-3.5 overscroll-contain">
          {filteredCategories.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              ไม่พบหมวดหมู่ที่ตรงกับ &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id || cat.type}
                  type="button"
                  onClick={() => handleSelect(cat.type)}
                  className="flex items-center gap-2.5 p-2.5 min-h-[56px] rounded-md border border-slate-200 bg-white hover:border-[#93C5FD] hover:bg-[#F8FBFF] active:scale-[0.98] transition-all text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] group"
                >
                  <div className="w-9 h-9 rounded-md bg-[#EDF4FB] text-brand group-hover:bg-brand group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <CategorySvgIcon category={cat} />
                  </div>
                  <span className="font-heading text-xs font-semibold text-slate-900 group-hover:text-brand leading-snug line-clamp-2 break-words">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
