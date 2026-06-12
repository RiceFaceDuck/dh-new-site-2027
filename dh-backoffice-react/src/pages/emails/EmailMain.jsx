import React, { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useGmail } from './hooks/useGmail';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import EmailReplyForm from './components/EmailReplyForm';
import EmailSidebar from './components/EmailSidebar';
import EmailHeader from './components/EmailHeader';

export default function EmailMain() {
  const { 
    isConfigured, isInitializing, unreadCount, emails, isLoadingEmails, 
    isLoadingMore, hasMore, activeTab, setActiveTab, searchQuery, 
    setSearchQuery, refreshEmails, loadMore, error,
    markAllAsRead, isMarkingAllAsRead, toggleStar, toggleImportant
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
          <Mail className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-500 font-medium">กำลังเตรียมระบบอีเมล...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-80px)]">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 text-center border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-200 dark:border-slate-600">
            <Lock className="h-8 w-8 text-slate-500 dark:text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">ระบบยังไม่พร้อมใช้งาน</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-sm">
            ผู้ดูแลระบบ (Admin) ยังไม่ได้ทำการเชื่อมต่อกุญแจ Gmail ของบริษัท <br/>
            กรุณาแจ้งแอดมินให้เข้าไปตั้งค่าที่เมนู "แผงควบคุมระดับผู้บริหาร" ก่อนครับ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-white dark:bg-slate-900 font-sans">
      
      <EmailSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        setSearchQuery={setSearchQuery}
        setSearchInput={setSearchInput}
        handleBackToList={handleBackToList}
        setIsComposing={setIsComposing}
        setSelectedEmailId={setSelectedEmailId}
        emails={emails}
      />

      <div className="flex-1 flex flex-col relative min-w-0">
        
        <EmailHeader 
          isComposing={isComposing}
          selectedEmailId={selectedEmailId}
          activeTab={activeTab}
          unreadCount={unreadCount}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearch={handleSearch}
          markAllAsRead={markAllAsRead}
          isMarkingAllAsRead={isMarkingAllAsRead}
          refreshEmails={refreshEmails}
          isLoadingEmails={isLoadingEmails}
        />

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-900/50">
          {error && !selectedEmailId && !isComposing && (
             <div className="m-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm">
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
