import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/category/${category.type}`}
      className="group flex flex-row items-center p-3 md:p-4 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 w-full"
      style={{ borderRadius: '4px' }} // Formal, slight rounding
    >
      <div 
        className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-2" 
        style={{ borderRadius: '2px' }}
      >
        {category.imageUrl ? (
          <img 
            src={category.imageUrl} 
            alt={category.name} 
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-8 h-8 bg-slate-200 rounded-sm"></div>
        )}
      </div>
      
      <div className="ml-3 md:ml-4 flex-grow flex justify-between items-center">
        <div>
          <h3 className="text-slate-800 font-semibold text-sm md:text-base leading-tight group-hover:text-blue-700 transition-colors">
            {category.name}
          </h3>
          <p className="text-slate-500 text-[11px] md:text-xs mt-1">คลิกเพื่อดูอะไหล่</p>
        </div>
        <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors w-5 h-5 flex-shrink-0" />
      </div>
    </Link>
  );
};

export default CategoryCard;
