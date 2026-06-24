import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import ProductList from '../../../components/ProductList';

const FeaturedSpares = ({ products, loading, error }) => {
  return (
    <div className="w-full relative group/featured">
      {/* Decorative Blur Background Element */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-fuchsia-400/20 rounded-full blur-[60px] pointer-events-none group-hover/featured:bg-fuchsia-400/30 transition-all duration-700"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 relative z-10 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            FEATURED SPARES
          </h2>
        </div>
        
        <Link 
          to="/categories" 
          className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-full shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300"
        >
          ดูทั้งหมด
          <ArrowRight size={16} className="text-fuchsia-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 h-[350px] flex flex-col shadow-sm animate-pulse">
              <div className="w-full aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2 mb-auto"></div>
              <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl w-full mt-4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-8 rounded-2xl text-center border border-red-100 shadow-sm relative z-10 flex flex-col items-center justify-center">
          <RefreshCw size={32} className="mb-3 text-red-400" />
          <p className="font-black text-lg mb-1">พบข้อผิดพลาดในการโหลดข้อมูล</p>
          <p className="text-sm font-medium opacity-80">{error}</p>
        </div>
      ) : products && products.length > 0 ? (
        <div className="relative z-10">
          <ProductList products={products} />
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 p-10 rounded-3xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700 relative z-10 flex flex-col items-center justify-center">
          <Sparkles size={40} className="mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-black tracking-wide">ยังไม่มีสินค้าแนะนำในขณะนี้</p>
          <p className="text-sm mt-1">แวะมาดูใหม่ในภายหลังนะ!</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedSpares;
