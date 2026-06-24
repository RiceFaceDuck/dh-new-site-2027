import React from 'react';
import CategoryCard from './CategoryCard';

const CategoryGrid = ({ categories, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse flex flex-row items-center p-3 md:p-4 bg-white border border-slate-100 shadow-sm" style={{ borderRadius: '4px' }}>
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-200 flex-shrink-0" style={{ borderRadius: '2px' }}></div>
            <div className="ml-3 md:ml-4 flex-grow space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-red-50 text-red-600 border border-red-200 text-center text-sm" style={{ borderRadius: '4px' }}>
        {error}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-6 md:p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 text-sm" style={{ borderRadius: '4px' }}>
        ไม่มีหมวดหมู่เปิดใช้งานในขณะนี้
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
};

export default CategoryGrid;
