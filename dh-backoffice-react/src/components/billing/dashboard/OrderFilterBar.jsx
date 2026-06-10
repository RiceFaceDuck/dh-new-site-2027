import React from 'react';
import { Search, CalendarDays, RefreshCw } from 'lucide-react';

export default function OrderFilterBar({ filter, setFilter, searchQuery, setSearchQuery, dateRange, setDateRange, totalSales, headerTitle, headerAction }) {
    const handleQuickDate = (days) => {
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
        setSearchQuery('');
        setDateRange({ start: '', end: '' });
    };

    return (
        <div className="flex flex-col gap-3 pb-3">
            {/* 🔝 Row 1: Title | Quick Dates | Date Range | Action */}
            <div className="flex flex-col xl:flex-row gap-3 w-full items-center justify-between border-b border-[var(--dh-border)] pb-3">
                
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
                    <div className="flex items-center gap-1.5 bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md p-1 shadow-inner h-[40px] overflow-x-auto custom-scrollbar shrink-0 w-full sm:w-auto">
                        <button 
                            onClick={() => handleQuickDate('today')}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive('today') ? 'bg-[var(--dh-text-main)] text-[var(--dh-bg-surface)] shadow-sm' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-surface)]'}`}
                        >
                            วันนี้
                        </button>
                        <button 
                            onClick={() => handleQuickDate('yesterday')}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive('yesterday') ? 'bg-[var(--dh-text-main)] text-[var(--dh-bg-surface)] shadow-sm' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-surface)]'}`}
                        >
                            เมื่อวาน
                        </button>
                        <button 
                            onClick={() => handleQuickDate(7)}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive(7) ? 'bg-[var(--dh-text-main)] text-[var(--dh-bg-surface)] shadow-sm' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-surface)]'}`}
                        >
                            7 วัน
                        </button>
                        <button 
                            onClick={() => handleQuickDate(30)}
                            className={`px-3 py-1 text-[11px] font-black rounded-md transition-all whitespace-nowrap ${isQuickDateActive(30) ? 'bg-[var(--dh-text-main)] text-[var(--dh-bg-surface)] shadow-sm' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-surface)]'}`}
                        >
                            30 วัน
                        </button>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-3 py-1 shadow-inner h-[40px] shrink-0 w-full sm:w-auto justify-center">
                        <span className="text-[11px] font-bold text-[var(--dh-text-muted)]">ตั้งแต่:</span>
                        <input 
                            type="date" 
                            value={dateRange?.start || ''} 
                            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent border-none outline-none text-[13px] font-bold text-[var(--dh-text-main)] w-[110px]"
                        />
                        <span className="text-[11px] font-bold text-[var(--dh-text-muted)] border-l border-[var(--dh-border)] pl-2">ถึง:</span>
                        <input 
                            type="date" 
                            value={dateRange?.end || ''} 
                            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent border-none outline-none text-[13px] font-bold text-[var(--dh-text-main)] w-[110px]"
                        />
                    </div>
                    
                    {/* Reset Button */}
                    <button 
                        onClick={handleReset} 
                        title="ล้างการกรองทั้งหมด" 
                        className="h-[40px] w-[40px] flex items-center justify-center bg-[var(--dh-bg-surface)] hover:bg-[var(--dh-accent-light)] text-[var(--dh-text-muted)] hover:text-[var(--dh-accent)] border border-[var(--dh-border)] hover:border-[var(--dh-accent)] rounded-md transition-all shadow-sm group shrink-0"
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
                    <div className="flex bg-[var(--dh-bg-base)] rounded-md p-1 border border-[var(--dh-border)] w-full sm:w-auto shadow-inner overflow-x-auto custom-scrollbar shrink-0">
                        {['All', 'Paid', 'Draft', 'Cancelled'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f)} 
                                className={`whitespace-nowrap px-4 py-2 text-[13px] font-black rounded-md transition-all duration-300 ${
                                    filter === f 
                                        ? 'bg-[var(--dh-text-main)] text-[var(--dh-bg-surface)] shadow-md transform scale-100' 
                                        : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-surface)]/50 transform scale-95 hover:scale-100'
                                }`}
                            >
                                {f === 'All' ? 'ทั้งหมด' : f === 'Paid' ? 'ชำระแล้ว' : f === 'Draft' ? 'บิลร่าง' : 'ยกเลิก (Void)'}
                            </button>
                        ))}
                    </div>

                    {/* Search Box */}
                    <div className="relative w-full sm:w-[300px] shrink-0 group h-[40px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--dh-text-muted)] group-focus-within:text-[var(--dh-accent)] transition-colors duration-300" size={16} strokeWidth={2.5}/>
                        <input 
                            id="search-bill-input" 
                            type="text" 
                            placeholder="พิมพ์ค้นหาเลขบิล, ลูกค้า..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            className="w-full h-full pl-10 pr-10 bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md text-[13px] outline-none focus:border-[var(--dh-accent)] focus:ring-1 focus:ring-[var(--dh-accent-light)] transition-all duration-300 text-[var(--dh-text-main)] placeholder-[var(--dh-text-muted)] font-bold shadow-inner" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 border border-[var(--dh-border)] rounded text-[10px] font-black text-[var(--dh-text-muted)] bg-[var(--dh-bg-surface)] shadow-sm">/</span>
                        </div>
                    </div>
                </div>

                {/* Right: Total Sales Badge */}
                <div className="flex items-center ml-auto sm:ml-0 shrink-0 w-full sm:w-auto justify-end mt-2 xl:mt-0">
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-md border border-emerald-500/20 shadow-sm dh-glow">
                        <span className="text-[11px] font-black uppercase tracking-wider">ยอดขาย:</span>
                        <span className="text-[14px] font-black">฿{(totalSales || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
