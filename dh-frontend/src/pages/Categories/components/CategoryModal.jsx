import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LayoutGrid, Package, Search } from 'lucide-react';
import LazyImage from '../../../components/common/LazyImage';

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
    return cat.name?.toLowerCase().includes(searchTerm.toLowerCase().trim());
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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                เลือกหมวดหมู่อะไหล่
              </h3>
              <p className="text-xs text-slate-500">
                ทั้งหมด {categories.length} หมวดหมู่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors active:scale-95"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar inside Modal (helps when category count is high) */}
        {categories.length > 6 && (
          <div className="px-4 pt-3 pb-1 border-b border-slate-100/80 bg-white">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อหมวดหมู่..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-100/80 border border-slate-200/80 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Items Grid */}
        <div className="overflow-y-auto p-3.5 sm:p-4 overscroll-contain">
          {filteredCategories.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs sm:text-sm">
              ไม่พบหมวดหมู่ที่ตรงกับ "{searchTerm}"
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id || cat.type}
                  type="button"
                  onClick={() => handleSelect(cat.type)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:bg-blue-50/30 active:scale-95 transition-all text-center shadow-2xs group"
                >
                  <div className="w-13 h-13 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center overflow-hidden p-2 group-hover:scale-105 transition-transform duration-200 mb-2">
                    {cat.imageUrl ? (
                      <LazyImage
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-blue-500" strokeWidth={1.75} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    แตะเพื่อดูอะไหล่
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
