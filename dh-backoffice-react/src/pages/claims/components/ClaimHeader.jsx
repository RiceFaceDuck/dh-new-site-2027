import React from 'react';
import { ShieldAlert, Calendar, Search, X } from 'lucide-react';

export default function ClaimHeader({ startDate, setStartDate, endDate, setEndDate, searchTerm, setSearchTerm }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 dh-header-gradient px-3 md:px-4 py-2 shrink-0 z-20 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] border-b border-dh-border sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white border border-white/20 shrink-0 shadow-sm">
          <ShieldAlert size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight leading-none text-white">
            Refund & Claim Dashboard
          </h2>
          <p className="text-slate-300 text-[10px] mt-0.5 font-bold flex items-center gap-2">
            ติดตามสถานะการแจ้งเคลม และ คืนสินค้า
            <span className="bg-white/10 border border-white/20 px-1.5 py-0.5 rounded text-[9px] uppercase font-black text-white shadow-sm">View Only</span>
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-2 w-full md:w-auto relative z-10">
        {/* Calendar */}
        <div className="bg-white border border-slate-200 h-[36px] px-3 rounded-md flex items-center gap-2 focus-within:ring-1 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-colors shrink-0 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold text-slate-900 dark:[color-scheme:dark]" />
          <span className="text-slate-400 text-[10px]">-</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold text-slate-900 dark:[color-scheme:dark]" />
          {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('')}} className="ml-1 text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5"/></button>}
        </div>

        {/* Search */}
        <div className="relative group w-full sm:w-64 shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="ค้นหาบิล, SKU, ลูกค้า..." 
            className="pl-9 pr-8 py-2 h-[36px] bg-white border border-slate-200 rounded-md w-full outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400 shadow-sm"
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 z-10"><X className="w-3.5 h-3.5"/></button>}
        </div>
      </div>
    </div>
  );
}
