import CategoryCard from './CategoryCard';

const CategoryGrid = ({ categories, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse flex flex-row items-center p-3.5 md:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-200/80 rounded-xl shrink-0"></div>
            <div className="ml-3.5 md:ml-4 grow space-y-2.5">
              <div className="h-4 bg-slate-200/80 rounded-md w-3/4"></div>
              <div className="h-3 bg-slate-200/60 rounded-md w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-center text-sm shadow-xs">
        {error}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/90 text-sm shadow-xs">
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
