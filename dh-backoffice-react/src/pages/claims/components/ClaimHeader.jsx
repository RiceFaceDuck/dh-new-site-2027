import React from 'react';
import { ShieldAlert, Calendar, Search, X } from 'lucide-react';

export default function ClaimHeader({ startDate, setStartDate, endDate, setEndDate, searchTerm, setSearchTerm }) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
      <div>
        <h2 className="text-2xl font-black text-dh-main flex items-center gap-2 tracking-tight">
          <ShieldAlert className="w-6 h-6 text-dh-accent" /> Refund & Claim Dashboard
        </h2>
        <p className="text-[12px] text-dh-muted font-medium mt-1 ml-8 flex items-center gap-2">
          ติดตามสถานะการแจ้งเคลม และ คืนสินค้า
          <span className="bg-dh-surface border border-dh-border px-1.5 py-0.5 rounded text-[9px] uppercase font-black text-dh-main shadow-sm">View Only</span>
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
        {/* Calendar */}
        <div className="bg-dh-surface h-9 px-3 rounded-lg border border-dh-border flex items-center gap-2 focus-within:border-dh-accent transition-colors shrink-0">
          <Calendar className="w-4 h-4 text-dh-muted" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent outline-none text-[12px] font-bold text-dh-main dark:[color-scheme:dark]" />
          <span className="text-dh-muted text-[10px]">-</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent outline-none text-[12px] font-bold text-dh-main dark:[color-scheme:dark]" />
          {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('')}} className="ml-1 text-dh-muted hover:text-red-500"><X className="w-3.5 h-3.5"/></button>}
        </div>

        {/* Search */}
        <div className="bg-dh-surface h-9 px-3 rounded-lg border border-dh-border flex items-center gap-2 focus-within:border-dh-accent transition-colors w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-dh-muted" />
          <input 
            type="text" placeholder="ค้นหาบิล, SKU, ลูกค้า..." 
            className="bg-transparent outline-none text-[12px] font-bold text-dh-main w-full placeholder:text-dh-muted/50"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="text-dh-muted hover:text-red-500"><X className="w-3.5 h-3.5"/></button>}
        </div>
      </div>
    </div>
  );
}
