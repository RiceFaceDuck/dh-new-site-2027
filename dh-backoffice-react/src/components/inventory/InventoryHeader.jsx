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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-dh-surface p-5 rounded-2xl shadow-dh-card border border-dh-border relative overflow-hidden">
      
      {/* Title Area */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-dh-accent-light rounded-xl flex items-center justify-center text-dh-accent border border-dh-accent/20 shrink-0">
          <Boxes size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-none text-dh-main">Inventory</h1>
          <p className="text-dh-muted text-xs mt-1 font-medium">ระบบจัดการคลังสินค้า สต๊อก และราคาขาย</p>
        </div>
      </div>
      
      {/* Tools Area (Search, Filters, Buttons) */}
      <div className="flex flex-wrap items-center gap-3 relative z-10">
        
        {/* Filter Category พร้อม Emoji นำสายตา */}
        <div className="flex items-center bg-dh-base border border-dh-border rounded-xl px-3 py-1.5 h-[40px] focus-within:border-dh-accent transition-colors">
          <Filter size={14} className="text-dh-muted mr-2 shrink-0" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-transparent outline-none text-dh-main font-bold cursor-pointer w-full appearance-none pr-2"
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
        <div className="flex items-center bg-dh-base border border-dh-border rounded-xl px-3 py-1.5 h-[40px] focus-within:border-dh-accent transition-colors hidden sm:flex">
          <CalendarClock size={14} className="text-dh-muted mr-2 shrink-0" />
          <select 
            value={salesPeriod}
            onChange={(e) => setSalesPeriod(e.target.value)}
            className="text-xs bg-transparent outline-none text-dh-main font-bold cursor-pointer w-full appearance-none pr-2"
          >
            <option value="7">สถิติ: 7 วัน</option>
            <option value="30">สถิติ: 30 วัน</option>
            <option value="90">สถิติ: 90 วัน</option>
            <option value="365">สถิติ: 1 ปี</option>
          </select>
        </div>

        {/* Search Box */}
        <div className="relative group flex-1 md:flex-none">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dh-muted group-focus-within:text-dh-accent transition-colors">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="ค้นหา SKU, ชื่อรุ่น, Tags..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 h-[40px] bg-dh-base border border-dh-border rounded-xl w-full md:w-56 outline-none focus:ring-1 focus:ring-dh-accent focus:border-dh-accent transition-all font-medium text-xs text-dh-main placeholder:text-dh-muted"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={onImportProduct}
            className="flex items-center justify-center gap-2 bg-dh-base text-dh-main border border-dh-border h-[40px] px-3 rounded-xl hover:bg-dh-border transition-all font-bold text-xs shadow-sm"
          >
            <FileUp size={14} className="text-blue-500" />
            <span className="hidden xl:inline">Import</span>
          </button>
          <button 
            onClick={onExportProduct}
            className="flex items-center justify-center gap-2 bg-dh-base text-dh-main border border-dh-border h-[40px] px-3 rounded-xl hover:bg-dh-border transition-all font-bold text-xs shadow-sm"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden xl:inline">Export</span>
          </button>
          <button 
            onClick={onAddProduct}
            className="flex items-center justify-center gap-2 bg-dh-accent text-white h-[40px] px-4 rounded-xl hover:bg-dh-accent-hover transition-all font-bold shadow-sm active:scale-95 text-xs"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">เพิ่มสินค้าใหม่</span>
          </button>
        </div>

      </div>
    </div>
  );
}
