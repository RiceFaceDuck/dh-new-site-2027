import { PackageSearch, Filter, LayoutList, Receipt, ReceiptText, ShieldAlert, Tags } from 'lucide-react';

const TodoPageFilterBar = ({ 
  searchQuery, 
  setSearchQuery, 
  filterType, 
  setFilterType, 
  displayCount 
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-sm ring-1 ring-slate-900/5 border border-white/50 dark:border-slate-700/80 flex flex-col gap-4 transition-all duration-500 relative z-0">
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="relative w-full flex items-center gap-2 group">
              <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110 group-focus-within:text-blue-500">
                      <PackageSearch className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                  </div>
                  <input 
                      type="text" 
                      placeholder="ค้นหางาน..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 transition-all shadow-inner"
                  />
              </div>
              {(searchQuery || filterType !== 'ALL') && (
                  <button 
                      onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
                      className="text-[10px] text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 px-3 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 font-bold active:scale-95 shrink-0"
                  >
                      ล้าง
                  </button>
              )}
          </div>
          {searchQuery && (
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap self-start border border-blue-100 shadow-sm animate-in zoom-in duration-300">
                  พบ {displayCount} รายการ
              </span>
          )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> จัดกลุ่มงาน
          </div>
          
          <button onClick={() => setFilterType('ALL')} className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${filterType === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:shadow-sm'}`}>
            ทั้งหมด
          </button>
          <button onClick={() => setFilterType('PAYMENT')} className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${filterType === 'PAYMENT' ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:shadow-sm'}`}>
            ตรวจสลิป
          </button>
          <button onClick={() => setFilterType('TAX_INVOICE')} className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${filterType === 'TAX_INVOICE' ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-600/20' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50 hover:shadow-sm'}`}>
            ใบกำกับภาษี
          </button>
          <button onClick={() => setFilterType('CLAIM')} className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${filterType === 'CLAIM' ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-600/20' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:shadow-sm'}`}>
            เคลม/คืน
          </button>
          <button onClick={() => setFilterType('WHOLESALE')} className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${filterType === 'WHOLESALE' ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-600/20' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50 hover:shadow-sm'}`}>
            ขอราคาส่ง
          </button>
          <button onClick={() => setFilterType('STORE_ADS')} className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${filterType === 'STORE_ADS' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:shadow-sm'}`}>
            อนุมัติร้าน/โฆษณา
          </button>
      </div>
    </div>
  );
};

export default TodoPageFilterBar;
