import React from 'react';
import { Search as SearchIcon, PlusCircle, X, RefreshCw, FilterX, HelpCircle, Keyboard } from 'lucide-react';

export default function SearchHeader({
  search1, setSearch1, search2, setSearch2, search3, setSearch3,
  loading, resetSearch, searchInputRef, setIsManualModalOpen, openReportModal
}) {
  return (
    <div className="dh-header-gradient px-3 md:px-4 py-2 border-b border-dh-border shrink-0 z-20 flex flex-col gap-2 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] relative transition-colors duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          {/* Icon Box ใช้สีขาวเพื่อความโดดเด่น */}
          <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-lg text-white shadow-sm ring-1 ring-white/20">
            <SearchIcon size={16} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-base md:text-lg font-black text-white tracking-tight leading-none mb-0.5">Product Search<span className="text-cyan-400">+</span></h1>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300">
              <span className="flex items-center gap-1"><Keyboard size={10}/> Zero-Read</span>
              <span className="w-1 h-1 rounded-full bg-slate-500"></span>
              <div className="flex items-center gap-1">
                <kbd className="bg-slate-800 border border-slate-600 rounded px-1 py-0.5 shadow-sm text-white">Ctrl</kbd> + <kbd className="bg-slate-800 border border-slate-600 rounded px-1 py-0.5 shadow-sm text-white">F</kbd>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors px-2 py-1.5 rounded-md"
          >
            <HelpCircle size={14} strokeWidth={2} /> <span className="hidden md:inline">คู่มือ</span>
          </button>
          <button 
            onClick={openReportModal}
            className="flex items-center gap-1 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-all px-2.5 py-1.5 rounded-md ring-1 ring-cyan-400/50 shadow-lg active:scale-95"
          >
            <PlusCircle size={14} strokeWidth={2.5} /> <span className="hidden md:inline">แจ้งเพิ่มสินค้า ยังไม่มีขาย</span><span className="md:hidden">แจ้งเพิ่ม</span>
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 flex-1">
          {/* ช่องค้นหา ปรับใช้ตัวแปร Theme ให้ดู Clean & Compact */}
          <div className="relative group flex-1">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border z-10 uppercase shadow-sm opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K1</div>
            <input 
              id="search-input-k1"
              ref={searchInputRef} type="text" value={search1} onChange={e => setSearch1(e.target.value)}
              placeholder="คีย์เวิร์ดหลัก..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-md py-1.5 pl-9 pr-7 outline-none focus:bg-dh-surface focus:border-dh-accent focus:ring-1 focus:ring-dh-accent/10 transition-all font-semibold text-xs shadow-sm"
            />
            {search1 && <button onClick={() => setSearch1('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
          </div>

          <div className="relative group flex-1">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border z-10 uppercase shadow-sm opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K2</div>
            <input 
              type="text" value={search2} onChange={e => setSearch2(e.target.value)}
              placeholder="กรองเพิ่มเติม..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-md py-1.5 pl-9 pr-7 outline-none focus:bg-dh-surface focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/10 transition-all font-semibold text-xs shadow-sm"
            />
            {search2 && <button onClick={() => setSearch2('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
          </div>

          <div className="relative group flex-1">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border z-10 uppercase shadow-sm opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K3</div>
            <input 
              type="text" value={search3} onChange={e => setSearch3(e.target.value)}
              placeholder="เจาะจงเฉพาะ..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-md py-1.5 pl-9 pr-7 outline-none focus:bg-dh-surface focus:border-pink-500 focus:ring-1 focus:ring-pink-500/10 transition-all font-semibold text-xs shadow-sm"
            />
            {search3 && <button onClick={() => setSearch3('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
            {loading && !search3 && <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-dh-accent animate-spin" size={14} />}
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden flex items-center ${search1 || search2 || search3 ? 'w-[70px] opacity-100 ml-1' : 'w-0 opacity-0 ml-0'}`}>
          <button onClick={resetSearch} className="flex items-center justify-center gap-1 w-full py-[5px] bg-white/10 hover:bg-red-500 text-slate-300 hover:text-white text-[10px] font-bold rounded-md border border-white/20 hover:border-red-400 transition-colors whitespace-nowrap backdrop-blur-sm">
            <FilterX size={12} /> ล้างค่า
          </button>
        </div>
      </div>
    </div>
  );
}