import { useState, useEffect } from 'react';
import { Search, RefreshCw, X, CornerDownLeft } from 'lucide-react';

export default function OrderFilterBar({ filter, setFilter, searchQuery, setSearchQuery, dateRange, setDateRange, totalSales, headerTitle, headerAction }) {
    const [tempQuery, setTempQuery] = useState(searchQuery || '');

    // Keep tempQuery synced if searchQuery changes externally (e.g. reset)
    useEffect(() => {
        setTempQuery(searchQuery || '');
    }, [searchQuery]);

    const handleSearchSubmit = () => {
        setSearchQuery(tempQuery.trim());
    };

    const handleClearSearch = () => {
        setTempQuery('');
        setSearchQuery('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchSubmit();
        }
    };

    const handleQuickDate = (days) => {
        if (isQuickDateActive(days)) {
            // Toggle off if already active
            setDateRange({ start: '', end: '' });
            return;
        }

        const today = new Date();
        const end = today.toISOString().split('T')[0];
        
        let startObj = new Date(today);
        if (days === 'yesterday') {
            startObj.setDate(today.getDate() - 1);
            const yesterdayStr = startObj.toISOString().split('T')[0];
            setDateRange({ start: yesterdayStr, end: yesterdayStr });
            return;
        } else if (days === 'today') {
            // Do nothing to startObj, it's today
        } else {
            startObj.setDate(today.getDate() - days);
        }
        
        const start = startObj.toISOString().split('T')[0];
        setDateRange({ start, end });
    };

    const isQuickDateActive = (days) => {
        if (!dateRange?.start || !dateRange?.end) return false;
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        
        let startObj = new Date(today);
        if (days === 'yesterday') {
            startObj.setDate(today.getDate() - 1);
            const yesterdayStr = startObj.toISOString().split('T')[0];
            return dateRange.start === yesterdayStr && dateRange.end === yesterdayStr;
        } else if (days === 'today') {
            return dateRange.start === end && dateRange.end === end;
        } else {
            startObj.setDate(today.getDate() - days);
        }
        
        const start = startObj.toISOString().split('T')[0];
        return dateRange.start === start && dateRange.end === end;
    };

    const handleReset = () => {
        setFilter('All');
        setTempQuery('');
        setSearchQuery('');
        setDateRange({ start: '', end: '' });
    };

    return (
        <div className="flex flex-col gap-3 pb-3">
            {/* 🔝 Row 1: Title | Quick Dates | Date Range | Action */}
            <div className="flex flex-col xl:flex-row gap-3 w-full items-center justify-between border-b border-(--dh-border) pb-3">
                
                {/* Left: Title & Action (Mobile) */}
                <div className="shrink-0 mr-auto xl:mr-4 w-full xl:w-auto flex justify-between xl:justify-start items-center">
                    {headerTitle}
                    <div className="xl:hidden">
                        {headerAction}
                    </div>
                </div>

                {/* Center: Quick Dates & Date Range */}
                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto xl:mr-auto xl:ml-8 items-center">
                    
                    {/* Quick Date Filters */}
                    <div className="flex items-center gap-1.5 bg-(--dh-bg-base) border border-(--dh-border) rounded-md p-1 shadow-inner h-[40px] overflow-x-auto custom-scrollbar shrink-0 w-full sm:w-auto">
                        <button 
                            onClick={() => handleQuickDate('today')}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive('today') ? 'bg-(--dh-text-main) text-(--dh-bg-surface) shadow-xs' : 'text-(--dh-text-muted) hover:text-(--dh-text-main) hover:bg-(--dh-bg-surface)'}`}
                        >
                            วันนี้
                        </button>
                        <button 
                            onClick={() => handleQuickDate('yesterday')}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive('yesterday') ? 'bg-(--dh-text-main) text-(--dh-bg-surface) shadow-xs' : 'text-(--dh-text-muted) hover:text-(--dh-text-main) hover:bg-(--dh-bg-surface)'}`}
                        >
                            เมื่อวาน
                        </button>
                        <button 
                            onClick={() => handleQuickDate(7)}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive(7) ? 'bg-(--dh-text-main) text-(--dh-bg-surface) shadow-xs' : 'text-(--dh-text-muted) hover:text-(--dh-text-main) hover:bg-(--dh-bg-surface)'}`}
                        >
                            7 วัน
                        </button>
                        <button 
                            onClick={() => handleQuickDate(30)}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive(30) ? 'bg-(--dh-text-main) text-(--dh-bg-surface) shadow-xs' : 'text-(--dh-text-muted) hover:text-(--dh-text-main) hover:bg-(--dh-bg-surface)'}`}
                        >
                            30 วัน
                        </button>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-(--dh-bg-base) border border-(--dh-border) rounded-md px-3 py-1 shadow-inner h-[40px] shrink-0 w-full sm:w-auto justify-center">
                        <span className="text-[11px] font-bold text-(--dh-text-muted)">ตั้งแต่:</span>
                        <input 
                            type="date" 
                            value={dateRange?.start || ''} 
                            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent border-none outline-hidden text-[13px] font-bold text-(--dh-text-main) w-[110px]"
                        />
                        <span className="text-[11px] font-bold text-(--dh-text-muted) border-l border-(--dh-border) pl-2">ถึง:</span>
                        <input 
                            type="date" 
                            value={dateRange?.end || ''} 
                            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent border-none outline-hidden text-[13px] font-bold text-(--dh-text-main) w-[110px]"
                        />
                    </div>
                    
                    {/* Reset Button */}
                    <button 
                        onClick={handleReset} 
                        title="ล้างการกรองทั้งหมด" 
                        className="h-[40px] w-[40px] flex items-center justify-center bg-(--dh-bg-surface) hover:bg-(--dh-accent-light) text-(--dh-text-muted) hover:text-(--dh-accent) border border-(--dh-border) hover:border-(--dh-accent) rounded-md transition-all shadow-xs group shrink-0"
                    >
                        <RefreshCw size={16} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>

                {/* Right: Action (Desktop) */}
                <div className="hidden xl:block shrink-0 ml-4">
                    {headerAction}
                </div>
            </div>

            {/* 📅 Row 2: Status Tabs | Search Box | Total Sales */}
            <div className="flex flex-col xl:flex-row gap-3 w-full items-center justify-between">
                
                {/* Left: Status Tabs & Search Box */}
                <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-center">
                    {/* Status Tabs */}
                    <div className="flex bg-(--dh-bg-base) rounded-md p-1 border border-(--dh-border) w-full sm:w-auto shadow-inner overflow-x-auto custom-scrollbar shrink-0">
                        {['All', 'Paid', 'Draft', 'Cancelled'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(prev => (prev === f && f !== 'All') ? 'All' : f)} 
                                className={`whitespace-nowrap px-4 py-2 text-[13px] font-black rounded-md transition-all duration-300 ${
                                    filter === f 
                                        ? 'bg-(--dh-text-main) text-(--dh-bg-surface) shadow-md transform scale-100' 
                                        : 'text-(--dh-text-muted) hover:text-(--dh-text-main) hover:bg-(--dh-bg-surface)/50 transform scale-95 hover:scale-100'
                                }`}
                            >
                                {f === 'All' ? 'ทั้งหมด' : f === 'Paid' ? 'ชำระแล้ว' : f === 'Draft' ? 'บิลร่าง' : 'ยกเลิก (Void)'}
                            </button>
                        ))}
                    </div>

                    {/* Search Box */}
                    <div className="relative w-full sm:w-[360px] shrink-0 group h-[40px]">
                        <button 
                            type="button" 
                            onClick={handleSearchSubmit} 
                            title="กด Enter เพื่อค้นหา"
                            className="absolute left-1 top-1/2 -translate-y-1/2 p-2.5 text-(--dh-text-muted) hover:text-(--dh-accent) transition-colors duration-200 z-10"
                        >
                            <Search size={16} strokeWidth={2.5}/>
                        </button>
                        <input 
                            id="search-bill-input" 
                            type="text" 
                            placeholder="ค้นหาเลขบิล, SKU, สินค้า, S/N, ลูกค้า, เลขพัสดุ (กด Enter)..." 
                            value={tempQuery} 
                            onChange={e => setTempQuery(e.target.value)} 
                            onKeyDown={handleKeyDown}
                            className="w-full h-full pl-10 pr-20 bg-(--dh-bg-base) border border-(--dh-border) rounded-md text-[13px] outline-hidden focus:border-(--dh-accent) focus:ring-1 focus:ring-(--dh-accent-light) transition-all duration-300 text-(--dh-text-main) placeholder-(--dh-text-muted) font-bold shadow-inner" 
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                            {tempQuery ? (
                                <>
                                    <button 
                                        type="button"
                                        onClick={handleClearSearch}
                                        title="ล้างคำค้นหา"
                                        className="p-1 hover:bg-rose-500/10 text-(--dh-text-muted) hover:text-rose-500 rounded-sm transition-colors"
                                    >
                                        <X size={14} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSearchSubmit}
                                        title="กดเพื่อค้นหา"
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-(--dh-accent)/40 rounded-sm text-[10px] font-black text-white bg-(--dh-accent) hover:bg-(--dh-accent-hover) shadow-xs transition-colors cursor-pointer"
                                    >
                                        <span>Enter</span>
                                        <CornerDownLeft size={10} strokeWidth={3} />
                                    </button>
                                </>
                            ) : (
                                <span className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 border border-(--dh-border) rounded-sm text-[10px] font-black text-(--dh-text-muted) bg-(--dh-bg-surface) shadow-xs pointer-events-none">/</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Total Sales Badge */}
                <div className="flex items-center ml-auto sm:ml-0 shrink-0 w-full sm:w-auto justify-end mt-2 xl:mt-0">
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-md border border-emerald-500/20 shadow-xs dh-glow">
                        <span className="text-[11px] font-black uppercase tracking-wider">ยอดขาย:</span>
                        <span className="text-[14px] font-black">฿{(totalSales || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
