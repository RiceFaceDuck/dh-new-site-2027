import React, { useState } from 'react';
import { Mail, RefreshCw, AlertCircle, Inbox, Send, Edit3, Lock, Star, Bookmark, Search, CheckSquare } from 'lucide-react';
import { useGmail } from './hooks/useGmail';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import EmailReplyForm from './components/EmailReplyForm';

export default function EmailMain() {
  const { 
    isConfigured, isInitializing, unreadCount, emails, isLoadingEmails, 
    isLoadingMore, hasMore, activeTab, setActiveTab, searchQuery, 
    setSearchQuery, refreshEmails, loadMore, error,
    markAllAsRead, toggleStar, toggleImportant
  } = useGmail();
  
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleSelectEmail = (id) => {
    setSelectedEmailId(id);
    setIsComposing(false);
  };

  const handleBackToList = () => {
    setSelectedEmailId(null);
    setIsComposing(false);
    refreshEmails();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setSelectedEmailId(null);
    setIsComposing(false);
  };

  if (isInitializing) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 h-full">
        <div className="flex flex-col items-center animate-pulse">
          <Mail className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">กำลังเตรียมระบบอีเมล...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-80px)]">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock className="h-10 w-10 text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">ระบบยังไม่พร้อมใช้งาน</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
            ผู้ดูแลระบบ (Admin) ยังไม่ได้ทำการเชื่อมต่อกุญแจ Gmail ของบริษัท <br/>
            กรุณาแจ้งแอดมินให้เข้าไปตั้งค่าที่เมนู "แผงควบคุมระดับผู้บริหาร" ก่อนครับ
          </p>
        </div>
      </div>
    );
  }

  const renderTab = (id, icon, label, count = 0) => (
    <button 
      onClick={() => { setActiveTab(id); setSearchQuery(''); setSearchInput(''); handleBackToList(); }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
        activeTab === id && !searchQuery
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
          : 'text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {count > 0 && (
        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-white dark:bg-slate-900">
      {/* Sidebar Filters */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col hidden md:flex shrink-0">
        <div className="p-4">
          <button 
            onClick={() => { setIsComposing(true); setSelectedEmailId(null); }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <Edit3 size={18} />
            <span>เขียนอีเมล</span>
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {renderTab('inbox', <Inbox size={18} />, 'กล่องจดหมาย', unreadCount)}
          {renderTab('starred', <Star size={18} />, 'ติดดาว')}
          {renderTab('important', <Bookmark size={18} />, 'สำคัญ')}
          {renderTab('sent', <Send size={18} />, 'ส่งแล้ว')}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Top Header / Search Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 shrink-0 gap-4">
          
          <div className="flex-1 max-w-xl">
            {!isComposing && !selectedEmailId && (
              <form onSubmit={handleSearch} className="relative">
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ค้นหาในอีเมล..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none text-sm font-medium transition-all"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {searchInput && (
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-blue-600 text-white px-2 py-1 rounded-lg font-bold">ค้นหา</button>
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
                 className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
               >
                 <CheckSquare size={14} /> อ่านทั้งหมด
               </button>
            )}
            <button 
              onClick={refreshEmails}
              disabled={isLoadingEmails}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              title="รีเฟรช"
            >
              <RefreshCw size={18} className={isLoadingEmails ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-900/50">
          {error && !selectedEmailId && !isComposing && (
             <div className="m-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
               <AlertCircle size={16} />
               <span>{error}</span>
             </div>
          )}

          {isComposing ? (
            <div className="p-6 h-full overflow-y-auto">
              <EmailReplyForm onCancel={handleBackToList} onSuccess={handleBackToList} isNew />
            </div>
          ) : selectedEmailId ? (
            <EmailDetail id={selectedEmailId} onBack={handleBackToList} />
          ) : (
            <EmailList 
              emails={emails} 
              isLoading={isLoadingEmails} 
              onSelect={handleSelectEmail} 
              activeTab={activeTab}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onToggleStar={toggleStar}
              onToggleImportant={toggleImportant}
            />
          )}
        </div>
      </div>
    </div>
  );
}
