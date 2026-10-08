import { useCategories } from './hooks/useCategories';
import CategoryGrid from './components/CategoryGrid';
import { Info, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import LazyFeaturedSection from './components/LazyFeaturedSection';

const CategoriesMain = () => {
  const { categories, loading, error } = useCategories();

  return (
    <div className="w-full bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/70 min-h-screen pb-36 md:pb-20 animate-fade-in">
      {/* Formal Header Banner - Modern Glass & Elevation */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <nav className="flex items-center text-xs md:text-sm text-slate-500 mb-1.5 md:mb-2">
                <Link to="/" className="hover:text-brand font-medium transition-colors">หน้าหลัก</Link>
                <span className="mx-2 text-slate-300">/</span>
                <span className="text-slate-800 font-semibold">หมวดหมู่อะไหล่</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                หมวดหมู่อะไหล่ทั้งหมด
              </h1>
              <p className="text-slate-600 mt-1 text-xs md:text-sm">เลือกหมวดหมู่เพื่อค้นหาอะไหล่และอุปกรณ์ที่คุณต้องการอย่างแม่นยำ</p>
            </div>
            
            {/* Guide Section (In-App Documentation) */}
            <div 
              className="bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/70 rounded-2xl p-3.5 flex items-start max-w-full md:max-w-sm shadow-xs"
            >
              <HelpCircle className="text-blue-600 w-5 h-5 shrink-0 mt-0.5 mr-2.5" />
              <div>
                <h4 className="text-xs md:text-sm font-bold text-blue-950">คำแนะนำการใช้งาน</h4>
                <p className="text-[11px] md:text-xs text-blue-800/90 mt-1 leading-snug">
                  คลิกที่หมวดหมู่เพื่อดูสินค้าย่อย ระบบจดจำข้อมูลเพื่อความรวดเร็ว หากต้องการใช้โมเดลเครื่อง ค้นหาได้ที่หน้าแรก
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
        {/* Formal Notification / Tip */}
        <div 
          className="mb-5 md:mb-6 flex items-start md:items-center bg-white border border-slate-200/90 rounded-2xl p-3.5 md:p-4 shadow-xs"
        >
          <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-200/60 mr-3 shrink-0">
            <Info className="text-amber-600 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <p className="text-xs md:text-sm text-slate-600 leading-snug">
            คุณสามารถใช้ <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">Part Number (PN)</span> ของอะไหล่ที่อยู่บนสติ๊กเกอร์ นำไปค้นหาในช่องด้านบนสุดเพื่อช่วยเพิ่มความแม่นยำในการค้นหา
          </p>
        </div>

        <CategoryGrid categories={categories} loading={loading} error={error} />
        
        {/* ========================================================
            Section: Lazy Featured Products (โหลดเมื่อเลื่อนจอถึงเท่านั้น เพื่อประหยัดโควต้า 100%)
            ======================================================== */}
        <LazyFeaturedSection />
      </div>
    </div>
  );
};

export default CategoriesMain;
