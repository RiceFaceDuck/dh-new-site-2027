import { useState, useEffect } from 'react';
import { 
  Boxes, 
  Filter, 
  CalendarClock, 
  Search, 
  X, 
  CornerDownLeft, 
  FileUp, 
  AlertTriangle, 
  RefreshCw, 
  FileSpreadsheet, 
  HelpCircle, 
  Plus 
} from 'lucide-react';
import { gasStockService } from '../../firebase/gasStockService';

export default function InventoryHeader({
  searchTerm, setSearchTerm,
  filterCategory, setFilterCategory,
  salesPeriod, setSalesPeriod,
  categories = [],
  onAddProduct,
  onImportProduct,
  onExportProduct,
  onGuideOpen,
  onRecalculateStats,
  isRecalculating = false
}) {
  const CATEGORY_MAP = {
    'Panel': '💻',
    'Screen': '💻',
    'Battery': '🔋',
    'Keyboard': '⌨️',
    'Adapter': '🔌',
    'Hinge': '⛓️',
    'Cable': '🪢',
    'Cooling Fan': '❄️',
    'Speaker': '🔊',
    'Other': '📦'
  };

  const [pendingCount, setPendingCount] = useState(gasStockService.getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    return gasStockService.subscribe((count, isFlushing) => {
      setPendingCount(count);
      setIsSyncing(isFlushing);
      if (!isFlushing) setSyncProgress(0);
    });
  }, []);

  useEffect(() => {
    let timer;
    if (isSyncing) {
      setSyncProgress(0);
      timer = setInterval(() => {
        setSyncProgress(prev => (prev >= 99 ? 99 : prev + Math.max(1, Math.floor((100 - prev) / 15))));
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isSyncing]);

  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 dh-header-gradient px-3 md:px-4 py-2 shrink-0 z-40 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] relative transition-colors duration-300">
      {/* Title Area */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-xs rounded-lg flex items-center justify-center text-white border border-white/20 shrink-0 shadow-xs">
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
        <div className="flex items-center bg-white/10 border border-white/20 rounded-md px-3 py-1.5 h-[36px] focus-within:border-cyan-400 transition-colors backdrop-blur-xs">
          <Filter size={14} className="text-slate-300 mr-2 shrink-0" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-transparent outline-hidden text-white font-bold cursor-pointer w-full appearance-none pr-2 [&>option]:text-slate-900 dark:[&>option]:text-slate-100 dark:[&>option]:bg-slate-800"
          >
            <option value="All">ทุกหมวดหมู่</option>
            {categories.map((cat) => {
              const catType = cat.type || cat.name;
              const emoji = CATEGORY_MAP[catType] || '📦';
              return (
                <option key={cat.id || catType} value={catType}>
                  {emoji} {cat.name} {cat.type && cat.name !== cat.type ? `(${cat.type})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Sales Period Filter */}
        <div className="flex items-center bg-white/10 border border-white/20 rounded-md px-3 py-1.5 h-[36px] focus-within:border-cyan-400 transition-colors hidden sm:flex backdrop-blur-xs">
          <CalendarClock size={14} className="text-slate-300 mr-2 shrink-0" />
          <select 
            value={salesPeriod}
            onChange={(e) => setSalesPeriod(e.target.value)}
            className="text-xs bg-transparent outline-hidden text-white font-bold cursor-pointer w-full appearance-none pr-2 [&>option]:text-slate-900 dark:[&>option]:text-slate-100 dark:[&>option]:bg-slate-800"
          >
            <option value="7">สถิติ: 7 วัน</option>
            <option value="30">สถิติ: 30 วัน</option>
            <option value="90">สถิติ: 90 วัน</option>
            <option value="365">สถิติ: 1 ปี</option>
          </select>
        </div>

        {/* Search Box */}
        <div className="relative group flex-1 md:flex-none">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10 pointer-events-none">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="ค้นหาพิมพ์คำ..." 
            value={localSearch}
            onChange={(e) => {
              const val = e.target.value;
              setLocalSearch(val);
              setSearchTerm(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchTerm(localSearch);
              } else if (e.key === 'Escape') {
                setLocalSearch('');
                setSearchTerm('');
              }
            }}
            className="pl-9 pr-20 py-2 h-[36px] bg-white border border-slate-200 rounded-md w-full md:w-64 outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium text-xs text-slate-900 placeholder:text-slate-400 shadow-xs"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5 z-10">
            {localSearch && (
              <button 
                type="button" 
                onClick={() => {
                  setLocalSearch('');
                  setSearchTerm('');
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                title="ล้างข้อความ (หรือกด ESC)"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-300 rounded shadow-2xs select-none pointer-events-none">
              <CornerDownLeft size={10} className="stroke-[2.5]" />
              <span>Enter</span>
            </kbd>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={onImportProduct}
            className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 h-[36px] px-3 rounded-md hover:bg-white/20 transition-all font-bold text-xs shadow-xs backdrop-blur-xs"
          >
            <FileUp size={14} className="text-cyan-300" />
            <span className="hidden xl:inline">Import</span>
          </button>
          
          {/* GAS Backup Disabled Indicator */}
          <button 
            disabled={true}
            className="flex items-center justify-center gap-1.5 h-[36px] px-3 rounded-md transition-all font-bold text-xs shadow-xs backdrop-blur-xs border relative overflow-hidden bg-slate-800/50 text-slate-400 border-slate-600/50 cursor-not-allowed"
            title="🛑 ปิดการใช้งาน Backup ด้วย GAS (รออัปเกรดเป็นระบบ Cloud Functions)"
          >
            <div className="absolute inset-y-0 left-0 bg-slate-600/30 transition-all duration-150 ease-out" style={{ width: '0%' }}></div>
            <AlertTriangle size={14} className="relative z-10 text-amber-500/80" />
            <span className="hidden xl:inline relative z-10 flex items-center gap-1">
              <span>GAS Backup Disabled</span>
              <span className="text-[10px] bg-slate-700/80 px-1.5 py-0.5 rounded-sm text-slate-300 ml-1 border border-slate-600">0%</span>
            </span>
            <span className="xl:hidden relative z-10 text-[10px] bg-slate-700/80 px-1 rounded-sm">0%</span>
          </button>

          {/* Sync Button tied to onRecalculateStats */}
          {onRecalculateStats && (
            <button
              type="button"
              onClick={onRecalculateStats}
              disabled={isRecalculating}
              className="flex items-center justify-center gap-1.5 bg-white/10 text-white border border-white/20 h-[36px] px-2.5 rounded-md hover:bg-white/20 transition-all font-bold text-xs shadow-xs backdrop-blur-xs disabled:opacity-50"
              title="Sync ข้อมูลและคำนวณสถิติยอดเข้า/ยอดขาย/ของเสีย/ปรับยอดทั้งหมด"
            >
              <RefreshCw size={14} className={isRecalculating ? "animate-spin text-cyan-300" : "text-slate-200"} />
              <span className="hidden xl:inline">{isRecalculating ? "กำลัง Sync..." : "Sync"}</span>
            </button>
          )}

          <button 
            onClick={onExportProduct}
            className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 h-[36px] px-3 rounded-md hover:bg-white/20 transition-all font-bold text-xs shadow-xs backdrop-blur-xs"
          >
            <FileSpreadsheet size={14} />
            <span className="hidden xl:inline">Export</span>
          </button>
          
          <div className="w-px h-[24px] bg-white/20 self-center mx-1"></div>

          <button 
            onClick={onGuideOpen}
            className="flex items-center justify-center gap-2 bg-slate-700/50 text-white border border-white/20 h-[36px] px-3 rounded-md hover:bg-slate-700 transition-all font-bold text-xs shadow-xs backdrop-blur-xs"
            title="คู่มือการใช้งาน"
          >
            <HelpCircle size={14} />
            <span className="hidden xl:inline">คู่มือ</span>
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
