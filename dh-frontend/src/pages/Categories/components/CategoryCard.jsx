import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import LazyImage from '../../../components/common/LazyImage';

const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/category/${category.type}`}
      className="group relative flex flex-row items-center px-3.5 py-2 md:px-4 md:py-2 bg-white rounded-[0.2rem] border border-slate-200/80 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12),0_2px_4px_-1px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_32px_-4px_rgba(15,23,42,0.16),0_6px_12px_-2px_rgba(15,23,42,0.08)] hover:border-brand/40 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 w-full overflow-hidden"
    >
      {/* Ambient hover glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Image / Icon container: Maximized image size without affecting card/button dimensions */}
      <div 
        className="shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-hidden relative z-10" 
      >
        {category.imageUrl ? (
          <LazyImage 
            src={category.imageUrl} 
            alt={category.name} 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <Package className="w-10 h-10 md:w-12 md:h-12 text-blue-500 group-hover:text-brand group-hover:scale-110 transition-all duration-300" strokeWidth={1.75} />
        )}
      </div>
      
      {/* Title: Centered, larger, with letter spacing; Subtitle removed */}
      <div className="ml-2 md:ml-3 grow flex items-center justify-center text-center relative z-10 min-w-0 px-1">
        <h3 className="text-slate-900 font-bold text-base md:text-lg tracking-wide group-hover:text-brand transition-colors truncate">
          {category.name}
        </h3>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-slate-100/50 border border-transparent flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300 shrink-0 ml-2 group-hover:shadow-sm">
        <ChevronRight className="text-slate-400 group-hover:text-white transition-colors w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
};

export default CategoryCard;
