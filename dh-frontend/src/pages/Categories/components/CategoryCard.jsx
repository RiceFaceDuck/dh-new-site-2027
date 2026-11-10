import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import LazyImage from '../../../components/common/LazyImage';

const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/category/${category.type}`}
      className="group relative flex flex-row items-center p-3.5 md:p-4 bg-white rounded-[2px] border border-slate-200/80 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.12),0_2px_4px_-1px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_32px_-4px_rgba(15,23,42,0.16),0_6px_12px_-2px_rgba(15,23,42,0.08)] hover:border-brand/40 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 w-full overflow-hidden"
    >
      {/* Ambient hover glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div 
        className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-[2px] bg-slate-50/70 border border-slate-100 flex items-center justify-center overflow-hidden p-2 group-hover:bg-white group-hover:border-slate-200 transition-all duration-300 relative z-10" 
      >
        {category.imageUrl ? (
          <LazyImage 
            src={category.imageUrl} 
            alt={category.name} 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-blue-50/60 rounded-[2px] flex items-center justify-center group-hover:bg-brand/10 transition-colors">
            <Package className="w-6 h-6 md:w-8 md:h-8 text-blue-500 group-hover:text-brand group-hover:scale-110 transition-all duration-300" strokeWidth={1.75} />
          </div>
        )}
      </div>
      
      <div className="ml-3.5 md:ml-4 grow flex justify-between items-center relative z-10">
        <div>
          <h3 className="text-slate-900 font-bold text-sm md:text-base leading-snug group-hover:text-brand transition-colors">
            {category.name}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">คลิกเพื่อดูอะไหล่</p>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-slate-100/50 border border-transparent flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all duration-300 shrink-0 ml-2 group-hover:shadow-sm">
          <ChevronRight className="text-slate-400 group-hover:text-white transition-colors w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
