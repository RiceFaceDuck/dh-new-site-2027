import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CategorySvgIcon } from '../utils/categoryIcons';

const CategoryCard = ({ category, compact = false }) => {
  const itemCount =
    typeof category.count === 'number'
      ? category.count
      : typeof category.productCount === 'number'
        ? category.productCount
        : null;

  return (
    <Link
      to={`/category/${category.type}`}
      className={`group relative flex items-center bg-white rounded-md border border-slate-200 text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:border-[#93C5FD] hover:shadow-[0_8px_20px_-6px_rgba(8,112,184,0.16)] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 w-full ${
        compact ? 'p-2.5 gap-2.5 min-h-[58px]' : 'p-3 md:p-3.5 gap-2.5 md:gap-3.5'
      }`}
    >
      {/* Technical SVG Icon Box (12-Category Parts Cabinet Signature) */}
      <div
        className={`rounded-md bg-[#EDF4FB] text-brand group-hover:bg-brand group-hover:text-white flex items-center justify-center shrink-0 transition-colors duration-150 ${
          compact ? 'w-9 h-9' : 'w-10 h-10 md:w-[46px] md:h-[46px]'
        }`}
      >
        <CategorySvgIcon category={category} />
      </div>

      {/* Left-aligned Full Name (No Mid-Word Truncation) */}
      <div className="flex-1 min-w-0">
        <h3
          className={`font-heading font-semibold text-slate-900 group-hover:text-brand transition-colors leading-snug line-clamp-2 break-words ${
            compact ? 'text-[12.5px]' : 'text-[13.5px] md:text-[14.5px]'
          }`}
        >
          {category.name}
        </h3>
        {itemCount !== null && (
          <p className="text-[11px] md:text-xs text-slate-500 font-light mt-0.5">
            {itemCount.toLocaleString()} รายการพร้อมส่ง
          </p>
        )}
      </div>

      {/* Circular Arrow Indicator (Desktop Only) */}
      {!compact && (
        <div className="hidden lg:flex w-7 h-7 rounded-full bg-slate-100 text-slate-400 group-hover:bg-brand group-hover:text-white items-center justify-center shrink-0 transition-colors duration-150">
          <ChevronRight size={15} strokeWidth={2.2} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </Link>
  );
};

export default CategoryCard;
