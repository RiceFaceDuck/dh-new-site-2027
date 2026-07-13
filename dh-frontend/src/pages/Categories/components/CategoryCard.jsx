import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import LazyImage from '../../../components/common/LazyImage';

const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/category/${category.type}`}
      className="group flex flex-row items-center p-3 md:p-4 bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 w-full"
      style={{ borderRadius: '4px' }} // Formal, slight rounding
    >
      <div 
        className="shrink-0 w-14 h-14 md:w-16 md:h-16 bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-2" 
        style={{ borderRadius: '2px' }}
      >
        {category.imageUrl ? (
          <LazyImage 
            src={category.imageUrl} 
            alt={category.name} 
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-blue-50/50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <Package className="w-6 h-6 md:w-8 md:h-8 text-blue-300 group-hover:text-blue-500 group-hover:scale-105 transition-all duration-300" strokeWidth={1.5} />
          </div>
        )}
      </div>
      
      <div className="ml-3 md:ml-4 grow flex justify-between items-center">
        <div>
          <h3 className="text-slate-800 font-semibold text-sm md:text-base leading-tight group-hover:text-blue-700 transition-colors">
            {category.name}
          </h3>
          <p className="text-slate-500 text-[11px] md:text-xs mt-1">คลิกเพื่อดูอะไหล่</p>
        </div>
        <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors w-5 h-5 shrink-0" />
      </div>
    </Link>
  );
};

export default CategoryCard;
