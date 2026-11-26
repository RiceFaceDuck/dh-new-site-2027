import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import ProductList from '../../../components/ProductList';

const FeaturedSpares = ({ products, loading, error, isSlowConnection }) => {
  const skeletonCount = isSlowConnection ? 4 : 8;

  return (
    <div className="w-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-3.5 md:mb-4 gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg md:text-xl font-bold text-slate-900 leading-tight">
              สินค้าวางจำหน่าย
            </h2>
            {isSlowConnection && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] md:text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                LITE MODE
              </span>
            )}
          </div>
          <p className="text-xs md:text-[13px] text-slate-500 font-light mt-0.5">
            {isSlowConnection
              ? 'เปิดใช้งานโหมดประหยัดข้อมูลเนื่องจากความเร็วอินเทอร์เน็ตต่ำ'
              : 'อะไหล่ยอดนิยมที่ช่างและร้านค้าเลือกใช้งานมากที่สุด'}
          </p>
        </div>

        <Link
          to="/categories"
          onMouseEnter={() => import('../../Categories/CategoriesMain')}
          className="group inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:border-brand text-slate-900 hover:text-brand font-heading font-medium text-[13px] rounded-md border border-slate-300 transition-colors active:scale-95 whitespace-nowrap"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight size={15} className="text-brand group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-3.5">
          {[...Array(skeletonCount)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-md p-2.5 border border-slate-200 flex flex-col shadow-xs animate-pulse h-full"
            >
              <div className="w-full aspect-square bg-slate-100 rounded-sm mb-3"></div>
              <div className="h-3 bg-slate-100 rounded-sm w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded-sm w-5/6 mb-auto"></div>
              <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
                <div className="h-5 bg-slate-100 rounded-sm w-16"></div>
                <div className="h-7 bg-slate-100 rounded-md w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-md text-center border border-red-200 shadow-xs flex flex-col items-center justify-center">
          <RefreshCw size={28} className="mb-2.5 text-red-400" />
          <p className="font-heading font-bold text-base mb-1">พบข้อผิดพลาดในการโหลดข้อมูล</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      ) : products && products.length > 0 ? (
        <div>
          <ProductList products={products} />
        </div>
      ) : (
        <div className="bg-white text-slate-500 p-10 rounded-md text-center border border-dashed border-slate-300 flex flex-col items-center justify-center">
          <Sparkles size={36} className="mb-3 text-slate-300" />
          <p className="font-heading text-base font-bold text-slate-700">ยังไม่มีสินค้าแนะนำในขณะนี้</p>
          <p className="text-sm mt-1 font-light">แวะมาดูใหม่ในภายหลังนะคะ</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedSpares;
