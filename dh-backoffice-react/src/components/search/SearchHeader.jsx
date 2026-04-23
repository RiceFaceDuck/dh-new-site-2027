import React from 'react';
import { Search as SearchIcon, PlusCircle, X, RefreshCw, FilterX, HelpCircle, Keyboard } from 'lucide-react';

export default function SearchHeader({
  search1, setSearch1, search2, setSearch2, search3, setSearch3,
  loading, resetSearch, searchInputRef, setIsManualModalOpen, openReportModal
}) {
  return (
    <div className="bg-dh-surface px-4 md:px-5 py-3 border-b border-dh-border shrink-0 z-20 flex flex-col gap-3 shadow-[0_2px_10px_-4px_var(--dh-shadow-color)] relative transition-colors duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Icon Box ใช้สี Accent Theme */}
          <div className="bg-dh-accent p-2 rounded-xl text-white shadow-sm ring-1 ring-dh-accent/20">
            <SearchIcon size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg md:text-xl font-black text-dh-main tracking-tight leading-none mb-1">Product Search+</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-dh-muted">
              <span className="flex items-center gap-1"><Keyboard size={10}/> Zero-Read</span>
              <span className="w-1 h-1 rounded-full bg-dh-border"></span>
              <div className="flex items-center gap-1">
                <kbd className="bg-dh-base border border-dh-border rounded px-1 py-0.5 shadow-sm">Ctrl</kbd> + <kbd className="bg-dh-base border border-dh-border rounded px-1 py-0.5 shadow-sm">F</kbd>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-dh-muted hover:text-dh-main hover:bg-dh-base transition-colors px-2.5 py-1.5 rounded-lg"
          >
            <HelpCircle size={14} strokeWidth={2} /> <span className="hidden md:inline">คู่มือ</span>
          </button>
          <button 
            onClick={openReportModal}
            className="flex items-center gap-1.5 text-xs font-bold text-dh-accent bg-dh-accent-light hover:bg-dh-accent hover:text-white transition-all px-3 py-2 rounded-lg ring-1 ring-dh-accent/30 active:scale-95"
          >
            <PlusCircle size={14} strokeWidth={2.5} /> <span className="hidden md:inline">เพิ่มสินค้า</span><span className="md:hidden">แจ้งเพิ่ม</span>
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
          {/* ช่องค้นหา ปรับใช้ตัวแปร Theme ให้ดู Clean & Compact */}
          <div className="relative group flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border z-10 uppercase shadow-sm opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K1</div>
            <input 
              ref={searchInputRef} type="text" value={search1} onChange={e => setSearch1(e.target.value)}
              placeholder="คีย์เวิร์ดหลัก..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-xl py-2 pl-10 pr-8 outline-none focus:bg-dh-surface focus:border-dh-accent focus:ring-2 focus:ring-dh-accent/10 transition-all font-semibold text-xs shadow-sm"
            />
            {search1 && <button onClick={() => setSearch1('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
          </div>

          <div className="relative group flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border z-10 uppercase shadow-sm opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K2</div>
            <input 
              type="text" value={search2} onChange={e => setSearch2(e.target.value)}
              placeholder="กรองเพิ่มเติม..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-xl py-2 pl-10 pr-8 outline-none focus:bg-dh-surface focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 transition-all font-semibold text-xs shadow-sm"
            />
            {search2 && <button onClick={() => setSearch2('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
          </div>

          <div className="relative group flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dh-main font-bold text-[9px] bg-dh-surface px-1.5 py-0.5 rounded border border-dh-border z-10 uppercase shadow-sm opacity-60 group-focus-within:opacity-100 group-focus-within:border-dh-accent group-focus-within:text-dh-accent transition-colors">K3</div>
            <input 
              type="text" value={search3} onChange={e => setSearch3(e.target.value)}
              placeholder="เจาะจงเฉพาะ..."
              className="w-full bg-dh-base border border-dh-border text-dh-main rounded-xl py-2 pl-10 pr-8 outline-none focus:bg-dh-surface focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 transition-all font-semibold text-xs shadow-sm"
            />
            {search3 && <button onClick={() => setSearch3('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-dh-muted hover:text-red-500 p-1 rounded-md transition-colors"><X size={12} strokeWidth={2.5}/></button>}
            {loading && !search3 && <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-dh-accent animate-spin" size={14} />}
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden flex items-center ${search1 || search2 || search3 ? 'w-[75px] opacity-100 ml-1' : 'w-0 opacity-0 ml-0'}`}>
          <button onClick={resetSearch} className="flex items-center justify-center gap-1 w-full py-[7px] bg-dh-surface hover:bg-red-50 text-dh-muted hover:text-red-600 text-[11px] font-bold rounded-xl border border-dh-border hover:border-red-200 transition-colors whitespace-nowrap">
            <FilterX size={12} /> ล้างค่า
          </button>
        </div>
      </div>
    </div>
  );
}