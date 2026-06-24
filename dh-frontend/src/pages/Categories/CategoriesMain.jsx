import React from 'react';
import { useCategories } from './hooks/useCategories';
import CategoryGrid from './components/CategoryGrid';
import { Info, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CategoriesMain = () => {
  const { categories, loading, error } = useCategories();

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-16 animate-fade-in">
      {/* Formal Header Banner - Mobile First Padding */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <nav className="flex text-xs md:text-sm text-slate-500 mb-1 md:mb-2">
                <Link to="/" className="hover:text-blue-600 transition-colors">หน้าหลัก</Link>
                <span className="mx-2">/</span>
                <span className="text-slate-800 font-medium">หมวดหมู่อะไหล่</span>
              </nav>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">หมวดหมู่อะไหล่ทั้งหมด</h1>
              <p className="text-slate-600 mt-1 text-xs md:text-sm">เลือกหมวดหมู่เพื่อค้นหาอะไหล่และอุปกรณ์ที่คุณต้องการ</p>
            </div>
            
            {/* Guide Section (In-App Documentation) */}
            <div 
              className="bg-blue-50/80 border border-blue-100 p-3 flex items-start max-w-full md:max-w-sm mt-2 md:mt-0"
              style={{ borderRadius: '4px' }}
            >
              <HelpCircle className="text-blue-600 w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5 mr-2" />
              <div>
                <h4 className="text-xs md:text-sm font-semibold text-blue-900">คำแนะนำการใช้งาน</h4>
                <p className="text-[11px] md:text-xs text-blue-800 mt-1 leading-snug">
                  คลิกที่หมวดหมู่เพื่อดูสินค้าย่อย ระบบจดจำข้อมูลเพื่อความรวดเร็ว หากต้องการใช้โมเดลเครื่อง ค้นหาได้ที่หน้าแรก
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Formal Notification / Tip */}
        <div 
          className="mb-4 md:mb-6 flex items-start md:items-center bg-white border border-slate-200 p-3 shadow-sm"
          style={{ borderRadius: '4px' }}
        >
          <Info className="text-slate-400 w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 mt-0.5 md:mt-0 flex-shrink-0" />
          <p className="text-xs md:text-sm text-slate-600 leading-snug">
            คุณสามารถใช้ <span className="font-semibold text-slate-700">Part Number (PN)</span> ของอะไหล่ที่อยู่บนสติ๊กเกอร์ นำไปค้นหาในช่องด้านบนสุดเพื่อความแม่นยำ 100%
          </p>
        </div>

        <CategoryGrid categories={categories} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default CategoriesMain;
