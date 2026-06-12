import React, { useMemo, useState } from 'react';
import { Inbox, Star, Bookmark, Send, Edit3, MailOpen, Copy, Check } from 'lucide-react';

export default function EmailSidebar({ 
  activeTab, 
  setActiveTab, 
  unreadCount, 
  setSearchQuery, 
  setSearchInput, 
  handleBackToList, 
  setIsComposing, 
  setSelectedEmailId,
  emails
}) {
  const [copied, setCopied] = useState(false);

  const companyEmail = useMemo(() => {
    if (!emails || emails.length === 0) return 'dh1notebook@gmail.com';
    const toMap = {};
    emails.forEach(e => {
      if (e.to) {
        const match = e.to.match(/<([^>]+)>/) || e.to.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (match) {
          const email = match[1].toLowerCase();
          toMap[email] = (toMap[email] || 0) + 1;
        }
      }
    });
    const sorted = Object.entries(toMap).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'dh1notebook@gmail.com';
  }, [emails]);

  const handleCopy = () => {
    navigator.clipboard.writeText(companyEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  
  const renderTab = (id, icon, label, count = 0) => (
    <button 
      onClick={() => { setActiveTab(id); setSearchQuery(''); setSearchInput(''); handleBackToList(); }}
      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-sm font-bold transition-colors ${
        activeTab === id
          ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' 
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm dark:bg-slate-600">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );

  return (
    <div className="w-64 border-r border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col hidden md:flex shrink-0">
      <div className="p-4">
        <button 
          onClick={() => { setIsComposing(true); setSelectedEmailId(null); }}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2.5 px-4 rounded-md font-bold shadow-sm transition-all active:scale-95"
        >
          <Edit3 size={18} />
          <span>เขียนอีเมล</span>
        </button>
      </div>
      
      <nav className="flex-1 px-3 space-y-1">
        {renderTab('inbox', <Inbox size={18} />, 'กล่องจดหมาย', unreadCount)}
        {renderTab('read', <MailOpen size={18} />, 'อ่านแล้ว')}
        {renderTab('starred', <Star size={18} />, 'ติดดาว')}
        {renderTab('important', <Bookmark size={18} />, 'สำคัญ')}
        {renderTab('sent', <Send size={18} />, 'ส่งแล้ว')}
      </nav>

      {/* Active Email Display */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mt-auto">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">บัญชีอีเมลที่ทำงานอยู่</p>
        <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-2 shadow-sm">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={companyEmail}>
            {companyEmail}
          </span>
          <button 
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 hover:text-blue-600 transition-colors shrink-0"
            title="คัดลอกอีเมล"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
