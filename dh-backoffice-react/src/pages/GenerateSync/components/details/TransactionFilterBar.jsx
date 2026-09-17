import React from 'react';
import { Search, Filter, User, Calendar, Layers, FileText } from 'lucide-react';

export default function TransactionFilterBar({
  searchQuery,
  setSearchQuery,
  selectedEventType,
  setSelectedEventType,
  selectedCustomer,
  setSelectedCustomer,
  uniqueCustomers,
  timeFilter,
  setTimeFilter,
  viewMode,
  setViewMode
}) {
  return (
    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
      
      {/* Search Input */}
      <div className="relative flex-1 min-w-[190px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="เธเนเธเธซเธฒ เน€เธฅเธเธเธดเธฅ, เน€เธฅเธเน€เธเธฅเธก, SKU, เธเธทเนเธญเธชเธดเธเธเนเธฒ, เธฅเธนเธเธเนเธฒ..."
          className="w-full pl-9 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-200 dark:bg-slate-700 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
          >
            โ•
          </button>
        )}
      </div>

      {/* Time Scope Filter */}
      <div className="relative flex items-center min-w-[150px] shrink-0">
        <Calendar size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
        >
          <option value="since_reset">โฑ๏ธ เธฃเธญเธเธเธดเธเธเนเธเธฑเธเธเธธเธเธฑเธ</option>
          <option value="today">๐“… เน€เธเธเธฒเธฐเธงเธฑเธเธเธตเน</option>
          <option value="all">๐ เธเธฃเธฐเธงเธฑเธ•เธดเธ—เธฑเนเธเธซเธกเธ” (All)</option>
        </select>
      </div>

      {/* Event Category Filter */}
      <div className="relative flex items-center min-w-[145px] shrink-0">
        <Filter size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value)}
          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
        >
          <option value="all">โก เน€เธซเธ•เธธเธเธฒเธฃเธ“เน: เธ—เธฑเนเธเธซเธกเธ”</option>
          <option value="sale">๐’ เธเธฒเธขเธชเธดเธเธเนเธฒ (Order)</option>
          <option value="claim">๐” เน€เธเธฅเธกเธชเธดเธเธเนเธฒ (Claim)</option>
          <option value="adjust">๐ ๏ธ เธเธฃเธฑเธเธชเธ•เนเธญเธ (Count)</option>
          <option value="price">๐ก เน€เธเธฅเธตเนเธขเธเธฃเธฒเธเธฒ (Price)</option>
        </select>
      </div>

      {/* Customer Filter */}
      <div className="relative flex items-center min-w-[155px] shrink-0">
        <User size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
        >
          <option value="all">๐‘ค เธฅเธนเธเธเนเธฒ: เธ—เธฑเนเธเธซเธกเธ”</option>
          {uniqueCustomers.map(cust => (
            <option key={cust} value={cust}>{cust}</option>
          ))}
        </select>
      </div>

      {/* Divider on XL screens */}
      <div className="hidden xl:block h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

      {/* View Mode Toggle Pills */}
      <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 self-start xl:self-auto">
        <button
          onClick={() => setViewMode('grouped')}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-[11px] cursor-pointer ${
            viewMode === 'grouped'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold ring-1 ring-indigo-200 dark:ring-indigo-800'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers size={13} />
          <span>เธเธฑเธ”เธเธฅเธธเนเธกเธ•เธฒเธกเน€เธฅเธเธเธดเธฅ</span>
        </button>
        <button
          onClick={() => setViewMode('itemized')}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-[11px] cursor-pointer ${
            viewMode === 'itemized'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold ring-1 ring-indigo-200 dark:ring-indigo-800'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={13} />
          <span>เนเธชเธ”เธเนเธขเธเธเธดเนเธ</span>
        </button>
      </div>
    </div>
  );
}
