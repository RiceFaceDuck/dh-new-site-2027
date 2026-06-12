import React from 'react';
import { Search, Filter, Plus, FileSpreadsheet, FileUp, Boxes, CalendarClock } from 'lucide-react';

export default function InventoryHeader({
  searchTerm, setSearchTerm,
  filterCategory, setFilterCategory,
  salesPeriod, setSalesPeriod,
  onAddProduct,
  onImportProduct,
  onExportProduct
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 dh-header-gradient px-3 md:px-4 py-2 shrink-0 z-20 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] relative transition-colors duration-300">
      {/* Title Area */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white border border-white/20 shrink-0 shadow-sm">
          <Boxes size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none text-white">Inventory</h1>
          <p className="text-slate-300 text-[10px] mt-0.5 font-bold">ระบบจัดการคลังสินค้า สต๊อก และราคาขาย</p>
        </div>
      </div>
      
      {/* Tools Area (Search, Filters, Buttons) */}
      <div className="flex flex-wrap items-center gap-3 relative z-10">
        
        {/* Filter Category พร้อม Emoji นำสายตา */}
        <div className="flex items-center bg-white/10 border border-white/20 rounded-md px-3 py-1.5 h-[36px] focus-within:border-cyan-400 transition-colors backdrop-blur-sm">
          <Filter size={14} className="text-slate-300 mr-2 shrink-0" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-transparent outline-none text-white font-bold cursor-pointer w-full appearance-none pr-2 [&>option]:text-slate-900"
          >
            <option value="All">ทุกหมวดหมู่</option>
            <option value="Screen">💻 Screen (จอ)</option>
            <option value="Battery">🔋 Battery</option>
            <option value="Keyboard">⌨️ Keyboard</option>
            <option value="Adapter">🔌 Adapter</option>
            <option value="Hinge">⛓️ Hinge (บานพับ)</option>
          </select>
        </div>

        {/* Sales Period Filter */}
        <div className="flex items-center bg-white/10 border border-white/20 rounded-md px-3 py-1.5 h-[36px] focus-within:border-cyan-400 transition-colors hidden sm:flex backdrop-blur-sm">
          <CalendarClock size={14} className="text-slate-300 mr-2 shrink-0" />
          <select 
            value={salesPeriod}
            onChange={(e) => setSalesPeriod(e.target.value)}
            className="text-xs bg-transparent outline-none text-white font-bold cursor-pointer w-full appearance-none pr-2 [&>option]:text-slate-900"
          >
            <option value="7">สถิติ: 7 วัน</option>
            <option value="30">สถิติ: 30 วัน</option>
            <option value="90">สถิติ: 90 วัน</option>
            <option value="365">สถิติ: 1 ปี</option>
          </select>
        </div>

        {/* Search Box */}
        <div className="relative group flex-1 md:flex-none">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="ค้นหา SKU, ชื่อรุ่น, Tags..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 h-[36px] bg-white border border-slate-200 rounded-md w-full md:w-56 outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={onImportProduct}
            className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 h-[36px] px-3 rounded-md hover:bg-white/20 transition-all font-bold text-xs shadow-sm backdrop-blur-sm"
          >
            <FileUp size={14} className="text-cyan-300" />
            <span className="hidden xl:inline">Import</span>
          </button>
          <button 
            onClick={onExportProduct}
            className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 h-[36px] px-3 rounded-md hover:bg-white/20 transition-all font-bold text-xs shadow-sm backdrop-blur-sm"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden xl:inline">Export</span>
          </button>
          <button 
            onClick={onAddProduct}
            className="flex items-center justify-center gap-2 bg-cyan-600 text-white h-[36px] px-4 rounded-md hover:bg-cyan-500 transition-all font-bold shadow-lg active:scale-95 text-xs ring-1 ring-cyan-400/50"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">เพิ่มสินค้าใหม่</span>
          </button>
        </div>

      </div>
    </div>
  );
}
