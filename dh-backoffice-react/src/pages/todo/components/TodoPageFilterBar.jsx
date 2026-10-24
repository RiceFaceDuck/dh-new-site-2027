import { PackageSearch, Filter } from 'lucide-react';

const TodoPageFilterBar = ({ 
  searchQuery, 
  setSearchQuery, 
  filterType, 
  setFilterType, 
  displayCount,
  counts = {}
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

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 hide-scrollbar w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> ตัวกรอง
          </div>
          
          {/* 1. ทั้งหมด */}
          <button 
            type="button"
            onClick={() => setFilterType('ALL')} 
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap border shrink-0 cursor-pointer ${
              filterType === 'ALL' 
                ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/20 dark:bg-slate-700 dark:border-slate-600' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>ทั้งหมด</span>
            {counts.all !== undefined && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                filterType === 'ALL' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {counts.all}
              </span>
            )}
          </button>

          {/* 2. ยังไม่ดำเนินการ */}
          <button 
            type="button"
            onClick={() => setFilterType('PENDING')} 
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap border shrink-0 cursor-pointer ${
              filterType === 'PENDING' 
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20' 
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-slate-800 dark:text-amber-400 dark:border-slate-700 dark:hover:bg-amber-950/20'
            }`}
          >
            <span>ยังไม่ดำเนินการ</span>
            {counts.pending !== undefined && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                filterType === 'PENDING' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                {counts.pending}
              </span>
            )}
          </button>

          {/* 3. เสร็จแล้ว */}
          <button 
            type="button"
            onClick={() => setFilterType('COMPLETED')} 
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap border shrink-0 cursor-pointer ${
              filterType === 'COMPLETED' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20' 
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-slate-800 dark:text-emerald-400 dark:border-slate-700 dark:hover:bg-emerald-950/20'
            }`}
          >
            <span>เสร็จแล้ว</span>
            {counts.completed !== undefined && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                filterType === 'COMPLETED' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                {counts.completed}
              </span>
            )}
          </button>
      </div>
    </div>
  );
};

export default TodoPageFilterBar;
