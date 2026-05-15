import React from 'react';
import { 
  CheckCircle2, PackageSearch, Filter, 
  Megaphone, UserCheck 
} from 'lucide-react';

/**
 * TodoFilters Component
 * รับผิดชอบ: สลับมุมมอง Tab หลัก (รออนุมัติ/ปฏิบัติการ) และกรองประเภทงานย่อย (Filter)
 */
export default function TodoFilters({ 
  activeTab, 
  setActiveTab, 
  filterType, 
  setFilterType, 
  todos = [],
  setSearchQuery = () => {} // รับ SearchQuery มาเพื่อเคลียร์ค่าตอนเปลี่ยน Tab
}) {
  
  // ฟังก์ชันสลับแท็บ พร้อมเคลียร์ Filter และช่องค้นหา
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterType('ALL');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
      
      {/* 🔹 แท็บมุมมองหลัก (Main Tabs) */}
      <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-full md:w-auto border border-dh-border shrink-0">
        <button 
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 outline-none ${
            activeTab === 'approvals' 
              ? 'bg-white text-dh-accent shadow-sm' 
              : 'text-dh-muted hover:text-dh-main'
          }`}
          onClick={() => handleTabChange('approvals')}
        >
          <CheckCircle2 className="w-4 h-4" />
          รอการอนุมัติ 
          {activeTab === 'approvals' && todos.length > 0 && (
            <span className="bg-orange-100 text-dh-accent px-2 py-0.5 rounded-full text-xs ml-1">
              {todos.length}
            </span>
          )}
        </button>

        <button 
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 outline-none ${
            activeTab === 'tasks' 
              ? 'bg-white text-dh-main shadow-sm' 
              : 'text-dh-muted hover:text-dh-main'
          }`}
          onClick={() => handleTabChange('tasks')}
        >
          <PackageSearch className="w-4 h-4" />
          งานปฏิบัติการ
          {activeTab === 'tasks' && todos.length > 0 && (
            <span className="bg-slate-100 text-dh-main px-2 py-0.5 rounded-full text-xs ml-1">
              {todos.length}
            </span>
          )}
        </button>
      </div>

      {/* 🔹 ตัวกรองประเภทงานย่อย (Sub Filters) */}
      <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        <div className="flex items-center gap-2 text-sm font-medium text-dh-muted mr-2 shrink-0">
          <Filter className="w-4 h-4" /> กรอง:
        </div>
        
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border outline-none shrink-0 ${
            filterType === 'ALL' 
              ? 'bg-dh-main text-white border-dh-main' 
              : 'bg-white text-dh-muted border-dh-border hover:bg-slate-50'
          }`}
        >
          ทั้งหมด
        </button>

        {/* กรองสำหรับ "งานปฏิบัติการ" */}
        {activeTab === 'tasks' ? (
          <>
            <button
              onClick={() => setFilterType('PAYMENT')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border outline-none shrink-0 ${
                filterType === 'PAYMENT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
            >
              ตรวจสลิป
            </button>
            <button
              onClick={() => setFilterType('TAX_INVOICE')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border outline-none shrink-0 ${
                filterType === 'TAX_INVOICE' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'
              }`}
            >
              ออกใบกำกับภาษี
            </button>
          </>
        ) : (
          /* กรองสำหรับ "รอการอนุมัติ" (ผู้จัดการ) */
          <>
            <button
              onClick={() => setFilterType('RETAIL')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border outline-none shrink-0 ${
                filterType === 'RETAIL' ? 'bg-dh-main text-white border-dh-main' : 'bg-white text-dh-muted border-dh-border hover:bg-slate-50'
              }`}
            >
              ลูกค้าปลีก
            </button>
            <button
              onClick={() => setFilterType('DEALER')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border outline-none shrink-0 ${
                filterType === 'DEALER' ? 'bg-dh-main text-white border-dh-main' : 'bg-white text-dh-muted border-dh-border hover:bg-slate-50'
              }`}
            >
              ลูกค้าส่ง
            </button>
            <button
              onClick={() => setFilterType('ADS')}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border outline-none shrink-0 ${
                filterType === 'ADS' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <Megaphone size={12} /> ฝากโฆษณา
            </button>
            <button
              onClick={() => setFilterType('PARTNER')}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border outline-none shrink-0 ${
                filterType === 'PARTNER' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
              }`}
            >
              <UserCheck size={12} /> พาร์ทเนอร์
            </button>
          </>
        )}
      </div>

    </div>
  );
}