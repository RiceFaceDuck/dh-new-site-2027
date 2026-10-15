import { memo } from 'react';
import { Search as SearchIcon, PlusCircle, X, RefreshCw, FilterX, HelpCircle, Keyboard } from 'lucide-react';

function SearchHeader({
  search1, setSearch1, search2, setSearch2, search3, setSearch3,
  stockFilter, setStockFilter,
  loading, resetSearch, forceSync, searchInputRef, openReportModal, openGuideModal
}) {
  return (
    <div className="dh-header-gradient px-3 md:px-4 py-2 border-b border-dh-border shrink-0 z-20 flex flex-col gap-2 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] relative transition-colors duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          {/* Icon Box ใช้สีขาวเพื่อความโดดเด่น */}
          <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-lg text-white shadow-xs ring-1 ring-white/20">
            <SearchIcon size={16} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-base md:text-lg font-black text-white tracking-tight leading-none mb-0.5">Product Search<span className="text-cyan-400">+</span></h1>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300">
              <span className="flex items-center gap-1"><Keyboard size={10}/> Zero-Read</span>
              <span className="w-1 h-1 rounded-full bg-slate-500"></span>
              <div className="flex items-center gap-1">
                <kbd className="bg-slate-800 border border-slate-600 rounded-sm px-1 py-0.5 shadow-xs text-white">Ctrl</kbd> + <kbd className="bg-slate-800 border border-slate-600 rounded-sm px-1 py-0.5 shadow-xs text-white">F</kbd>
              </div>
            </div>
          </div>

          {/* Guide / Manual Button */}
          <button 
            onClick={openGuideModal} 
            className="ml-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 p-1.5 rounded-lg transition-all border-2 border-slate-600 shadow-xs dh-active-press group" 
            title="คู่มือการใช้งาน"
          >
            <HelpCircle size={15} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick Filters */}
          <div className="hidden md:flex bg-slate-900/60 p-1 rounded-lg backdrop-blur-xs shadow-inner border border-slate-700/80 text-[10px] font-black gap-1">
            <button onClick={() => setStockFilter('ALL')} className={`px-2.5 py-1 rounded-sm border-2 transition-all cursor-pointer ${stockFilter === 'ALL' ? 'bg-blue-600 border-blue-400 text-white shadow-sm' : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white'}`}>ทั้งหมด</button>
            <button onClick={() => setStockFilter('IN_STOCK')} className={`px-2.5 py-1 rounded-sm border-2 transition-all cursor-pointer ${stockFilter === 'IN_STOCK' ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm' : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white'}`}>มีของ</button>
            <button onClick={() => setStockFilter('LOW_STOCK')} className={`px-2.5 py-1 rounded-sm border-2 transition-all cursor-pointer ${stockFilter === 'LOW_STOCK' ? 'bg-amber-600 border-amber-400 text-white shadow-sm' : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white'}`}>ใกล้หมด</button>
            <button onClick={() => setStockFilter('OUT_OF_STOCK')} className={`px-2.5 py-1 rounded-sm border-2 transition-all cursor-pointer ${stockFilter === 'OUT_OF_STOCK' ? 'bg-rose-600 border-rose-400 text-white shadow-sm' : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white'}`}>หมด</button>
          </div>

          {/* Sync Button */}
          <button 
            onClick={forceSync}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-black text-white bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 transition-all px-2.5 py-1.5 rounded-md disabled:opacity-50 shadow-xs cursor-pointer"
            title="รีเฟรชข้อมูลจากระบบหลังบ้าน (Sync)"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>

          <button 
            onClick={openReportModal}
            className="flex items-center gap-1.5 text-xs font-black text-white bg-cyan-600 hover:bg-cyan-500 transition-all px-3 py-1.5 rounded-md border-2 border-cyan-400 shadow-md active:scale-95 ml-1 cursor-pointer"
          >
            <PlusCircle size={14} strokeWidth={2.5} /> <span className="hidden lg:inline">แจ้งเพิ่มสินค้า ยังไม่มีขาย</span><span className="lg:hidden">แจ้งเพิ่ม</span>
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex flex-col md:flex-row gap-2 flex-1 w-full">
          {/* ช่องค้นหา ปรับ Layout ให้ยืดหยุ่นขึ้น ไม่อึดอัด */}
          <div className="relative group flex-1 min-w-[120px]">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded-sm border border-dh-border z-10 uppercase shadow-xs opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K1</div>
            <input 
              id="search-input-k1"
              ref={searchInputRef} type="text" value={search1} onChange={e => setSearch1(e.target.value)}
              placeholder="ค้นหาหลัก..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-md py-1.5 pl-[38px] pr-7 outline-hidden focus:bg-dh-surface focus:border-dh-accent focus:ring-1 focus:ring-dh-accent/10 transition-all font-semibold text-xs shadow-xs"
            />
            {search1 && <button onClick={() => setSearch1('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
          </div>

          <div className="relative group flex-1 min-w-[120px]">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded-sm border border-dh-border z-10 uppercase shadow-xs opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K2</div>
            <input 
              type="text" value={search2} onChange={e => setSearch2(e.target.value)}
              placeholder="กรองเพิ่ม..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-md py-1.5 pl-[38px] pr-7 outline-hidden focus:bg-dh-surface focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/10 transition-all font-semibold text-xs shadow-xs"
            />
            {search2 && <button onClick={() => setSearch2('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
          </div>

          <div className="relative group flex-[0.8] min-w-[100px]">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded-sm border border-dh-border z-10 uppercase shadow-xs opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K3</div>
            <input 
              type="text" value={search3} onChange={e => setSearch3(e.target.value)}
              placeholder="เจาะจง..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-md py-1.5 pl-[38px] pr-7 outline-hidden focus:bg-dh-surface focus:border-pink-500 focus:ring-1 focus:ring-pink-500/10 transition-all font-semibold text-xs shadow-xs"
            />
            {search3 && <button onClick={() => setSearch3('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
            {loading && !search3 && <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-dh-accent animate-spin" size={14} />}
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden flex items-center ${search1 || search2 || search3 ? 'w-[75px] opacity-100 ml-1' : 'w-0 opacity-0 ml-0'}`}>
          <button onClick={resetSearch} className="flex items-center justify-center gap-1 w-full py-[5px] bg-slate-800 hover:bg-rose-600 text-white text-[10px] font-black rounded-md border-2 border-slate-600 hover:border-rose-400 transition-colors whitespace-nowrap shadow-xs cursor-pointer">
            <FilterX size={12} /> ล้างค่า
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SearchHeader);