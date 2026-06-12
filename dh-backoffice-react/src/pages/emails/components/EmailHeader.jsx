import React from 'react';
import { Search, CheckSquare, RefreshCw } from 'lucide-react';

export default function EmailHeader({
  isComposing,
  selectedEmailId,
  activeTab,
  unreadCount,
  searchInput,
  setSearchInput,
  handleSearch,
  markAllAsRead,
  isMarkingAllAsRead,
  refreshEmails,
  isLoadingEmails
}) {
  return (
    <header className="h-16 border-b border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 z-10 shrink-0 gap-4 relative">
      
      <div className="flex-1 max-w-xl">
        {!isComposing && !selectedEmailId && (
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ค้นหาในอีเมล..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-slate-300 focus:bg-white dark:focus:border-slate-600 dark:focus:bg-slate-900 rounded-md outline-none text-sm font-medium transition-all"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchInput && (
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded-md font-bold transition-colors">
                ค้นหา
              </button>
            )}
          </form>
        )}
        {(isComposing || selectedEmailId) && (
          <h1 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            {isComposing ? 'เขียนอีเมลใหม่' : 'อ่านอีเมล'}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isComposing && !selectedEmailId && activeTab === 'inbox' && unreadCount > 0 && (
           <button 
             onClick={markAllAsRead}
             disabled={isMarkingAllAsRead}
             className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-70 disabled:cursor-wait"
           >
             {isMarkingAllAsRead ? (
               <>
                 <RefreshCw size={14} className="animate-spin" />
                 กำลังดำเนินการ ใช้เวลาประมาณ 1 นาที...
               </>
             ) : (
               <>
                 <CheckSquare size={14} /> อ่านทั้งหมด
               </>
             )}
           </button>
        )}
        <button 
          onClick={refreshEmails}
          disabled={isLoadingEmails}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
          title="รีเฟรช"
        >
          <RefreshCw size={18} className={isLoadingEmails ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  );
}
