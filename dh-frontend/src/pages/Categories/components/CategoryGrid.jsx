import CategoryCard from './CategoryCard';

const CategoryGrid = ({ categories, loading, error, compact = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3.5">
        {[...Array(compact ? 6 : 8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 p-3 bg-white rounded-md border border-slate-200 shadow-xs"
          >
            <div className="w-10 h-10 md:w-[46px] md:h-[46px] bg-slate-200/80 rounded-md shrink-0"></div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-4 bg-slate-200/80 rounded-sm w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded-sm w-1/2"></div>
            </div>
            <div className="hidden lg:block w-7 h-7 rounded-full bg-slate-100 shrink-0"></div>
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
      <div className="p-8 md:p-10 text-center text-slate-500 bg-white rounded-md border border-dashed border-slate-300 text-sm">
        ไม่มีหมวดหมู่ในกลุ่มนี้
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3.5">
      {categories.map((cat) => (
        <CategoryCard key={cat.id || cat.type} category={cat} compact={compact} />
      ))}
    </div>
  );
};

export default CategoryGrid;
