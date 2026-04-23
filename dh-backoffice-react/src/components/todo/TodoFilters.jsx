import React from 'react';
import { Inbox, PackageSearch, ListFilter } from 'lucide-react';

/**
 * TodoFilters Component
 * รับผิดชอบ: สลับมุมมอง Tab หลัก (Inbox/Sourcing) และกรองประเภทงาน (Filter)
 */
export default function TodoFilters({ activeTab, setActiveTab, filterType, setFilterType }) {
  const filters = [
    { id: 'ALL', label: 'ทั้งหมด' },
    { id: 'WHOLESALE_APPROVAL', label: 'ราคาส่ง B2B' },
    { id: 'PAYMENT_VERIFICATION', label: 'ตรวจสอบสลิป' },
    { id: 'MANUAL_TASK', label: 'งานทั่วไป' }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-dh-border mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      
      {/* แท็บมุมมองหลัก */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg shrink-0">
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all outline-none ${
            activeTab === 'approvals' 
              ? 'bg-white dark:bg-slate-800 text-dh-main shadow-sm' 
              : 'text-dh-muted hover:text-dh-main'
          }`}
        >
          <Inbox size={16} /> Inbox งาน
        </button>
        <button 
          onClick={() => setActiveTab('sourcing')}
          className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all outline-none ${
            activeTab === 'sourcing' 
              ? 'bg-white dark:bg-slate-800 text-dh-main shadow-sm' 
              : 'text-dh-muted hover:text-dh-main'
          }`}
        >
          <PackageSearch size={16} /> สินค้าที่ต้องจัดหา
        </button>
      </div>

      {/* ตัวกรองประเภทงาน (แสดงเฉพาะในหน้า Inbox) */}
      {activeTab === 'approvals' && (
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 xl:pb-0 px-2 xl:px-0">
          <ListFilter size={16} className="text-dh-muted shrink-0" />
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap outline-none ${
                filterType === f.id 
                  ? 'bg-dh-accent text-white shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      
    </div>
  );
}