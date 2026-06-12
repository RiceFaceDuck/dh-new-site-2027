import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Clock, Reply, AlertCircle } from 'lucide-react';
import { fetchEmailDetail, markAsRead } from '../../../firebase/gmailService';
import EmailReplyForm from './EmailReplyForm';

export default function EmailDetail({ id, onBack }) {
  const [email, setEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    const loadEmail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchEmailDetail(id);
        setEmail(data);
        
        // If unread, mark as read
        if (data.isUnread) {
          await markAsRead(id);
        }
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลดเนื้อหาอีเมลได้");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadEmail();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">กำลังเปิดอ่าน...</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
        <p className="text-red-500 font-bold">{error || 'ไม่พบข้อมูล'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md font-bold text-slate-800 dark:text-slate-200">กลับ</button>
      </div>
    );
  }

  // Extract necessary parts directly from the simplified GAS API structure
  const subject = email.subject || '(ไม่มีหัวข้อ)';
  const from = email.from || 'ไม่ทราบชื่อผู้ส่ง';
  const to = email.to || 'ไม่ระบุ';
  const dateStr = email.date || '';
  const bodyContent = email.body || '';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header Actions */}
      <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 gap-4">
        <button 
          onClick={onBack}
          className="p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-slate-700 dark:text-slate-300">ย้อนกลับ</div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Email Header */}
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 leading-snug">{subject}</h2>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 border border-slate-300 dark:border-slate-600">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-[15px] truncate">{from}</p>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium truncate">ถึง: {to}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[13px] font-medium shrink-0 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg">
                <Clock size={14} />
                <span>{new Date(dateStr).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-6 md:p-8 text-slate-800 dark:text-slate-300 prose prose-slate dark:prose-invert max-w-none">
            {bodyContent ? (
              <div dangerouslySetInnerHTML={{ __line: bodyContent, __html: bodyContent }} />
            ) : (
              <p className="text-slate-400 italic">ไม่มีเนื้อหาหรือเนื้อหาถูกลบ</p>
            )}
          </div>

          {/* Action Bar */}
          {!isReplying && (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setIsReplying(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-md font-bold transition-all shadow-sm active:scale-95"
              >
                <Reply size={18} />
                <span>ตอบกลับ (Reply)</span>
              </button>
            </div>
          )}
        </div>

        {isReplying && (
          <div className="max-w-4xl mx-auto mt-6">
            <EmailReplyForm 
              originalEmail={email} 
              onCancel={() => setIsReplying(false)} 
              onSuccess={() => setIsReplying(false)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
