import { useState, useEffect } from 'react';
import { Search, RefreshCw, X, CornerDownLeft, Calendar } from 'lucide-react';

export default function OrderFilterBar({ 
    filter, 
    setFilter, 
    searchQuery, 
    setSearchQuery, 
    dateRange, 
    setDateRange, 
    totalSales, 
    headerTitle, 
    headerAction 
}) {
    const [tempQuery, setTempQuery] = useState(searchQuery || '');
    const [showCustomDate, setShowCustomDate] = useState(false);

    // Keep tempQuery synced if searchQuery changes externally
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

    // Helper format date to YYYY-MM-DD
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSelectDateRange = (e) => {
        const val = e.target.value;
        if (val === 'all') {
            setShowCustomDate(false);
            setDateRange({ start: '', end: '' });
            return;
        }

        if (val === 'custom') {
            setShowCustomDate(true);
            return;
        }

        setShowCustomDate(false);
        const today = new Date();
        const endStr = formatDate(today);
        const startObj = new Date(today);

        if (val === 'yesterday') {
            startObj.setDate(today.getDate() - 1);
            const yesterdayStr = formatDate(startObj);
            setDateRange({ start: yesterdayStr, end: yesterdayStr });
            return;
        }

        if (val === 'today') {
            // start is today
        } else {
            const days = Number(val);
            startObj.setDate(today.getDate() - days);
        }

        setDateRange({ start: formatDate(startObj), end: endStr });
    };

    const getCurrentRangeKey = () => {
        if (!dateRange?.start && !dateRange?.end) return 'all';
        const today = new Date();
        const todayStr = formatDate(today);
        const yesterdayObj = new Date(today);
        yesterdayObj.setDate(today.getDate() - 1);
        const yesterdayStr = formatDate(yesterdayObj);

        if (dateRange.start === yesterdayStr && dateRange.end === yesterdayStr) return 'yesterday';
        if (dateRange.start === todayStr && dateRange.end === todayStr) return 'today';

        const sevenDaysObj = new Date(today);
        sevenDaysObj.setDate(today.getDate() - 7);
        if (dateRange.start === formatDate(sevenDaysObj) && dateRange.end === todayStr) return '7';

        const thirtyDaysObj = new Date(today);
        thirtyDaysObj.setDate(today.getDate() - 30);
        if (dateRange.start === formatDate(thirtyDaysObj) && dateRange.end === todayStr) return '30';

        return 'custom';
    };

    const handleReset = () => {
        setFilter('All');
        setTempQuery('');
        setSearchQuery('');
        setDateRange({ start: '', end: '' });
        setShowCustomDate(false);
    };

    const statusTabs = [
        { key: 'All', label: 'ทั้งหมด' },
        { key: 'Paid', label: 'ชำระแล้ว' },
        { key: 'Draft', label: 'บิลร่าง' },
        { key: 'Cancelled', label: 'ยกเลิก (Void)' }
    ];

    const currentRangeKey = getCurrentRangeKey();

    return (
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 w-full">
            {/* ฝั่งซ้าย: Header Title + Status Tabs */}
            <div className="flex items-center gap-3 shrink-0">
                {headerTitle}
                <div className="hidden xl:block h-6 w-px bg-white/20 mx-1" />
                <div className="flex bg-black/25 backdrop-blur-xs rounded-lg p-0.5 border border-white/15 shadow-inner shrink-0">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(prev => (prev === tab.key && tab.key !== 'All') ? 'All' : tab.key)}
                            className={`whitespace-nowrap px-3 py-1 text-xs font-black rounded-md transition-all duration-200 cursor-pointer ${
                                filter === tab.key
                                    ? 'bg-white text-blue-900 shadow-md transform scale-100'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ตรงกลาง: ช่องค้นหาบิล */}
            <div className="relative flex-1 min-w-[200px] max-w-[550px] h-[36px] my-auto">
                <button
                    type="button"
                    onClick={handleSearchSubmit}
                    title="กด Enter เพื่อค้นหา"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200 z-10 cursor-pointer"
                >
                    <Search size={15} strokeWidth={2.5} />
                </button>
                <input
                    id="search-bill-input"
                    type="text"
                    placeholder="ค้นหาเลขบิล, SKU, สินค้า, S/N, ลูกค้า..."
                    value={tempQuery}
                    onChange={(e) => setTempQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full pl-9 pr-16 bg-white/10 focus:bg-white border border-white/20 focus:border-cyan-400 rounded-lg text-xs text-white focus:text-slate-900 placeholder:text-white/50 focus:placeholder:text-slate-400 font-medium outline-hidden transition-all duration-200 shadow-inner"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                    {tempQuery ? (
                        <>
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                title="ล้างคำค้นหา"
                                className="p-1 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 rounded-xs transition-colors cursor-pointer"
                            >
                                <X size={13} strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                onClick={handleSearchSubmit}
                                title="กดเพื่อค้นหา"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 border border-cyan-400/50 rounded-xs text-[10px] font-black text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs transition-colors cursor-pointer"
                            >
                                <span>Enter</span>
                                <CornerDownLeft size={9} strokeWidth={3} />
                            </button>
                        </>
                    ) : (
                        <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-white/20 rounded-xs text-[10px] font-black text-white/50 bg-black/20 pointer-events-none">
                            /
                        </span>
                    )}
                </div>
            </div>

            {/* ฝั่งขวา: เลือกช่วงวันที่ + ปุ่มรีเฟรช + Header Actions */}
            <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
                <div className="relative shrink-0 h-[36px]">
                    <select
                        value={currentRangeKey}
                        onChange={handleSelectDateRange}
                        className="h-full pl-8 pr-3 bg-black/25 hover:bg-black/35 text-white border border-white/20 rounded-lg text-xs font-bold outline-hidden cursor-pointer shadow-inner appearance-none"
                    >
                        <option value="all" className="bg-slate-900 text-white">📅 วันที่ทั้งหมด</option>
                        <option value="today" className="bg-slate-900 text-white">⚡ วันนี้</option>
                        <option value="yesterday" className="bg-slate-900 text-white">⏪ เมื่อวาน</option>
                        <option value="7" className="bg-slate-900 text-white">📊 7 วันที่ผ่านมา</option>
                        <option value="30" className="bg-slate-900 text-white">📈 30 วันที่ผ่านมา</option>
                        <option value="custom" className="bg-slate-900 text-white">⚙️ กำหนดช่วงวันที่...</option>
                    </select>
                    <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
                </div>

                {(showCustomDate || currentRangeKey === 'custom') && (
                    <div className="flex items-center gap-1 bg-black/30 border border-white/20 rounded-lg px-2 h-[36px]">
                        <input
                            type="date"
                            value={dateRange?.start || ''}
                            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent border-none outline-hidden text-[11px] font-bold text-white w-[100px] cursor-pointer color-scheme-dark"
                        />
                        <span className="text-[10px] text-white/40 font-bold">-</span>
                        <input
                            type="date"
                            value={dateRange?.end || ''}
                            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent border-none outline-hidden text-[11px] font-bold text-white w-[100px] cursor-pointer color-scheme-dark"
                        />
                    </div>
                )}

                <button
                    onClick={handleReset}
                    title="ล้างการกรองทั้งหมด"
                    className="h-[36px] w-[36px] flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 rounded-lg transition-all shadow-xs group cursor-pointer shrink-0"
                >
                    <RefreshCw size={14} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>

                <div className="shrink-0">
                    {headerAction}
                </div>
            </div>
        </div>
    );
}
