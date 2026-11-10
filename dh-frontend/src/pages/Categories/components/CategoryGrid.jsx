import CategoryCard from './CategoryCard';

const CategoryGrid = ({ categories, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse flex flex-row items-center px-3.5 py-2 md:px-4 md:py-2 bg-white rounded-[0.2rem] border border-slate-200 shadow-xs">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200/80 rounded-[0.2rem] shrink-0"></div>
            <div className="ml-2 md:ml-3 grow flex items-center justify-center px-2">
              <div className="h-5 bg-slate-200/80 rounded-md w-2/3"></div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0 ml-2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-red-50 text-red-600 rounded-md border border-red-200 text-center text-sm shadow-xs">
        {error}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center text-slate-500 bg-white rounded-md border border-slate-200 text-sm shadow-xs">
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
