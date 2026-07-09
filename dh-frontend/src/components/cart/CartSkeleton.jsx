import React from 'react';

const CartSkeleton = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 min-h-[80vh] animate-in fade-in duration-500 relative">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-md"></div>
        <div className="h-5 w-24 bg-slate-200 animate-pulse rounded-md"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden">
              <div className="w-full sm:w-28 h-28 bg-slate-100 rounded-xl animate-pulse shrink-0"></div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="h-5 w-3/4 bg-slate-200 animate-pulse rounded-md mb-2"></div>
                  <div className="h-4 w-1/2 bg-slate-200 animate-pulse rounded-md"></div>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div className="h-6 w-24 bg-slate-200 animate-pulse rounded-md"></div>
                  <div className="h-10 w-28 bg-slate-200 animate-pulse rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
          <div className="h-16 w-full bg-slate-100 animate-pulse rounded-xl mt-4"></div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 h-[400px] flex flex-col">
            <div className="h-6 w-32 bg-slate-200 animate-pulse rounded-md mb-6"></div>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between"><div className="h-4 w-20 bg-slate-100 animate-pulse rounded"></div><div className="h-4 w-16 bg-slate-100 animate-pulse rounded"></div></div>
              <div className="flex justify-between"><div className="h-4 w-24 bg-slate-100 animate-pulse rounded"></div><div className="h-4 w-12 bg-slate-100 animate-pulse rounded"></div></div>
            </div>
            <div className="border-t border-slate-100 py-4 mt-auto mb-4">
              <div className="flex justify-between items-center"><div className="h-6 w-20 bg-slate-200 animate-pulse rounded-md"></div><div className="h-8 w-24 bg-slate-200 animate-pulse rounded-md"></div></div>
            </div>
            <div className="h-12 w-full bg-emerald-100 animate-pulse rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSkeleton;
