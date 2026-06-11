import React, { useState } from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import { sendEmail } from '../../../firebase/gmailService';

export default function EmailReplyForm({ originalEmail = null, onCancel, onSuccess, isNew = false }) {
  const [to, setTo] = useState(
    isNew ? '' : (originalEmail?.from || '')
  );
  
  const originalSubject = originalEmail?.subject || '';
  const [subject, setSubject] = useState(
    isNew ? '' : (originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`)
  );
  
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!to || !subject || !body) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const threadId = originalEmail?.threadId || null;
      await sendEmail(to, subject, body.replace(/\n/g, '<br/>'), threadId); // Basic HTML format
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการส่งอีเมล');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="h-14 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-900/50">
        <h3 className="font-black text-slate-800 dark:text-white">
          {isNew ? 'เขียนอีเมลใหม่' : 'ตอบกลับอีเมล'}
        </h3>
        <button 
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSend} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">ถึง (To)</label>
            <input 
              type="text" 
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">หัวข้อ (Subject)</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="หัวข้ออีเมล..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">ข้อความ</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="พิมพ์ข้อความตอบกลับที่นี่..."
              rows={8}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm resize-y custom-scrollbar text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit"
            disabled={isSending}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={16} />
            )}
            <span>ส่งอีเมล</span>
          </button>
        </div>
      </form>
    </div>
  );
}
