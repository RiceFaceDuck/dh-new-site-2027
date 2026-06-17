import React from 'react';
import { PackageSearch, Filter, LayoutList, Receipt, ReceiptText, ShieldAlert, Tags } from 'lucide-react';

const TodoPageFilterBar = ({ 
  searchQuery, 
  setSearchQuery, 
  filterType, 
  setFilterType, 
  displayCount 
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg shadow-md ring-1 ring-slate-900/5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-3 transition-all duration-300 relative z-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="relative w-full sm:max-w-md flex items-center gap-2">
              <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PackageSearch className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                      type="text" 
                      placeholder="ค้นหา (ชื่อลูกค้า, Order ID, หัวข้องาน)..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dh-accent)]/50 w-full bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 transition-all font-medium"
                  />
              </div>
              {(searchQuery || filterType !== 'ALL') && (
                  <button 
                      onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
                      className="text-xs text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 px-3 py-2 rounded-md whitespace-nowrap transition-all font-bold"
                  >
                      ล้างค่า
                  </button>
              )}
          </div>
          {searchQuery && (
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-md whitespace-nowrap self-end sm:self-auto border border-blue-100">
                  พบ {displayCount} รายการ
              </span>
          )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider shrink-0">
            <Filter className="w-3.5 h-3.5" /> จัดกลุ่ม:
          </div>
          
          <button onClick={() => setFilterType('ALL')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${filterType === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            <LayoutList size={14} className="inline mr-1" /> ทั้งหมด
          </button>
          <button onClick={() => setFilterType('PAYMENT')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${filterType === 'PAYMENT' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
            <Receipt size={14} className="inline mr-1" /> ตรวจสลิป
          </button>
          <button onClick={() => setFilterType('TAX_INVOICE')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${filterType === 'TAX_INVOICE' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}>
            <ReceiptText size={14} className="inline mr-1" /> ใบกำกับภาษี
          </button>
          <button onClick={() => setFilterType('CLAIM')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${filterType === 'CLAIM' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}>
            <ShieldAlert size={14} className="inline mr-1" /> เคลม/คืน
          </button>
          <button onClick={() => setFilterType('WHOLESALE')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${filterType === 'WHOLESALE' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}>
            <Tags size={14} className="inline mr-1" /> ขอราคาส่ง
          </button>
      </div>
    </div>
  );
};

export default TodoPageFilterBar;
