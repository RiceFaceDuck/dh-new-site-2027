import React, { useState } from 'react';
import { X, Mail, Link as LinkIcon, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { saveGmailCredentials } from '../../../firebase/gmailService';

export default function EmailSetupModal({ isOpen, onClose }) {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!webAppUrl.trim() || !webAppUrl.includes('script.google.com/macros/s/')) {
      setError('กรุณาระบุ Web App URL ของ Google Apps Script ให้ถูกต้อง');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      await saveGmailCredentials(webAppUrl.trim());
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">ตั้งค่าระบบบัญชีอีเมลบริษัท</h2>
              <p className="text-xs text-slate-500 font-medium">เชื่อมต่อกับ Google Apps Script (GAS)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex gap-3 text-sm text-emerald-800 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              การทำงานผ่าน Google Apps Script ทำให้ระบบปลอดภัย 100% ประหยัดค่าใช้จ่าย และพนักงานสามารถอ่าน/ตอบอีเมลได้ <b>โดยไม่ต้องล็อกอิน Google ด้วยตนเอง</b>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                Google Apps Script Web App URL
              </label>
              <textarea
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/XXXXX/exec"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white text-sm transition-all resize-none break-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 animate-in zoom-in">
              <ShieldCheck size={32} />
              <span>บันทึกการตั้งค่าสำเร็จ! พนักงานสามารถใช้งาน Email ได้แล้ว</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleConnect}
            disabled={isLoading || success}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LinkIcon className="w-5 h-5" />}
            {isLoading ? 'กำลังเชื่อมต่อ...' : 'บันทึกลิงก์ (Save URL)'}
          </button>
        </div>

      </div>
    </div>
  );
}
