import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import LazyImage from '../../../components/common/LazyImage';

const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/category/${category.type}`}
      className="group relative flex flex-row items-center p-3.5 md:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-brand/50 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 w-full overflow-hidden"
    >
      {/* Ambient hover glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div 
        className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center overflow-hidden p-2 group-hover:bg-white group-hover:border-brand/30 transition-all duration-300 shadow-2xs relative z-10" 
      >
        {category.imageUrl ? (
          <LazyImage 
            src={category.imageUrl} 
            alt={category.name} 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-blue-50/70 rounded-lg flex items-center justify-center group-hover:bg-brand/10 transition-colors">
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
        
        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center group-hover:bg-brand group-hover:border-brand transition-all duration-300 shrink-0 ml-2 shadow-2xs">
          <ChevronRight className="text-slate-400 group-hover:text-white transition-colors w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
