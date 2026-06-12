import React from 'react';
import { Mail, Clock, Star, Bookmark, Loader2 } from 'lucide-react';

export default function EmailList({ emails, isLoading, onSelect, activeTab, isLoadingMore, hasMore, onLoadMore, onToggleStar, onToggleImportant }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">กำลังโหลดข้อมูลอีเมล...</p>
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="font-bold text-slate-500 dark:text-slate-400">ไม่มีอีเมลในหมวดหมู่นี้</p>
      </div>
    );
  }

  const formatSender = (fromStr) => {
    const match = fromStr.match(/^([^<]+)/);
    if (match && match[1].trim() !== '') return match[1].replace(/"/g, '').trim();
    return fromStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const sortedEmails = [...emails].sort((a, b) => {
    if (activeTab === 'inbox') {
      if (a.isUnread && !b.isUnread) return -1;
      if (!a.isUnread && b.isUnread) return 1;
    }
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3">
      <div className="flex flex-col gap-1.5 max-w-4xl mx-auto">
        {sortedEmails.map((email) => {
          const isUnread = email.isUnread && activeTab !== 'sent';
          
          return (
            <div 
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={`flex items-start gap-3 p-4 rounded-md cursor-pointer transition-all group relative overflow-hidden ${
                isUnread 
                  ? 'bg-white dark:bg-slate-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 dark:ring-slate-600 z-10' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 opacity-90 hover:opacity-100'
              }`}
            >
              {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500 rounded-l-md"></div>}
              {/* Badges/Icons (Star, Important) */}
              <div className="flex flex-col gap-2 pt-1 shrink-0 px-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleStar(email.id, email.isStarred); }}
                  className="hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star 
                    size={18} 
                    className={email.isStarred ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600 hover:text-amber-400"} 
                  />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleImportant(email.id, email.isImportant); }}
                  className="hover:scale-110 transition-transform focus:outline-none"
                >
                  <Bookmark 
                    size={18} 
                    className={email.isImportant ? "text-rose-400 fill-rose-400" : "text-slate-300 dark:text-slate-600 hover:text-rose-400"} 
                  />
                </button>
              </div>

              <div className="w-10 h-10 ml-1 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-lg shrink-0 border border-slate-300 dark:border-slate-600">
                {formatSender(email.from).charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm truncate pr-4 ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                    {activeTab === 'sent' ? `ถึง: ${formatSender(email.to || email.from)}` : formatSender(email.from)}
                  </span>
                  <span className={`text-xs whitespace-nowrap shrink-0 flex items-center gap-1 ${isUnread ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                    <Clock size={12} />
                    {formatDate(email.date)}
                  </span>
                </div>
                <h4 className={`text-sm mb-1 truncate ${isUnread ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                  {email.subject}
                </h4>
                <p className="text-[13px] text-slate-500 dark:text-slate-500 truncate font-medium">
                  {email.snippet}
                </p>
              </div>
              
              {isUnread && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-sm shadow-blue-500/40"></div>
              )}
            </div>
          );
        })}

        {/* Load More Button */}
        {hasMore && (
          <div className="pt-4 pb-8 flex justify-center">
            <button 
              onClick={(e) => { e.stopPropagation(); onLoadMore(); }}
              disabled={isLoadingMore}
              className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
              {isLoadingMore ? 'กำลังโหลดเพิ่ม...' : 'โหลดเพิ่มเติม'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
