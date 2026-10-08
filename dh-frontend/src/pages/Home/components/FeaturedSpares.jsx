import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import ProductList from '../../../components/ProductList';

const FeaturedSpares = ({ products, loading, error, isSlowConnection }) => {
  const skeletonCount = isSlowConnection ? 4 : 8;

  return (
    <div className="w-full relative group/featured">
      {/* Decorative Blur Background Element */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-fuchsia-400/20 rounded-full blur-[60px] pointer-events-none group-hover/featured:bg-fuchsia-400/30 transition-all duration-700"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 relative z-10 gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              FEATURED SPARES
            </h2>
            {isSlowConnection && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] md:text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                LITE MODE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isSlowConnection ? 'เปิดใช้งานโหมดประหยัดข้อมูลเนื่องจากความเร็วอินเทอร์เน็ตต่ำ' : 'อะไหล่ยอดนิยมที่ช่างและร้านค้าเลือกใช้งานมากที่สุด'}
          </p>
        </div>
        
        <Link 
          to="/categories"
          onMouseEnter={() => import('../../Categories/CategoriesMain')}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-brand font-bold text-sm rounded-full shadow-xs hover:shadow-md border border-slate-200/90 hover:border-brand/40 transition-all duration-300 active:scale-95"
        >
          ดูทั้งหมด
          <ArrowRight size={16} className="text-brand group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-2.5 md:p-3 border border-slate-200/80 flex flex-col shadow-xs animate-pulse h-full">
              <div className="w-full aspect-square bg-slate-100 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded-sm w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-100 rounded-sm w-1/2 mb-auto"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-full mt-4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-8 rounded-2xl text-center border border-red-100 shadow-xs relative z-10 flex flex-col items-center justify-center">
          <RefreshCw size={32} className="mb-3 text-red-400" />
          <p className="font-black text-lg mb-1">พบข้อผิดพลาดในการโหลดข้อมูล</p>
          <p className="text-sm font-medium opacity-80">{error}</p>
        </div>
      ) : products && products.length > 0 ? (
        <div className="relative z-10">
          <ProductList products={products} />
        </div>
      ) : (
        <div className="bg-white text-slate-500 p-10 rounded-3xl text-center border-2 border-dashed border-slate-200 relative z-10 flex flex-col items-center justify-center shadow-xs">
          <Sparkles size={40} className="mb-4 text-slate-300" />
          <p className="text-lg font-black tracking-wide text-slate-700">ยังไม่มีสินค้าแนะนำในขณะนี้</p>
          <p className="text-sm mt-1">แวะมาดูใหม่ในภายหลังนะ!</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedSpares;
