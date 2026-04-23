import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft, Building2 } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // เมื่อ Login สำเร็จ App.jsx จะตรวจจับสถานะและพับหน้าต่างนี้ลงอัตโนมัติ
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('คุณได้ยกเลิกการเข้าระบบก่อนทำรายการเสร็จ');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dh-bg-base flex items-center justify-center p-4 relative overflow-hidden text-dh-main selection:bg-dh-accent-light selection:text-dh-accent transition-colors duration-300">
      
      {/* 🎨 Gimmick: Background Decorations เพื่อความหรูหรามีมิติ */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-dh-accent rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full bg-dh-bg-surface rounded-3xl shadow-dh-elevated border border-dh-border p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-dh-accent-light border border-dh-accent/20 text-dh-accent text-[10px] font-black uppercase tracking-widest shadow-sm">
            <ShieldCheck size={12} className="mr-1.5" /> Staff & Admin Portal
          </div>
          
          <div className="w-20 h-20 bg-dh-bg-base rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-dh-border group transition-all">
            <Building2 size={36} className="text-dh-main group-hover:scale-110 transition-transform duration-300" />
          </div>
          
          <h1 className="text-3xl font-black text-dh-main tracking-tight leading-none mb-2">DH Notebook</h1>
          <p className="text-dh-muted text-sm font-bold tracking-wide uppercase">Management System</p>
        </div>

        {/* 🚨 Gimmick: ข้อความเตือนดักทางลูกค้า (Visual Barrier) */}
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-700 dark:text-orange-400 font-bold leading-tight">พื้นที่เฉพาะพนักงาน</p>
            <p className="text-[11px] text-orange-600/80 dark:text-orange-400/80 mt-1 font-medium leading-relaxed">
              ระบบนี้สงวนสิทธิ์ไว้สำหรับพนักงานและผู้บริหารเท่านั้น หากคุณเป็นลูกค้า กรุณาใช้หน้าเว็บไซต์หลัก
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
          </div>
        )}

        {/* Google Login Button */}
        <div className="space-y-5">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-dh-bg-base border border-dh-border rounded-xl font-bold text-dh-main hover:bg-dh-bg-surface hover:border-dh-accent/50 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 size={22} className="animate-spin text-dh-accent" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-sm tracking-wide">เข้าสู่ระบบด้วยบัญชีองค์กร</span>
              </>
            )}
          </button>
          
          <div className="pt-4 border-t border-dh-border/50 text-center">
            {/* ทางออกสำหรับลูกค้าที่หลงเข้ามา */}
            <a 
              href="https://dh-notebook-frontend.web.app" 
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-dh-muted hover:text-dh-accent transition-colors py-2 px-4 rounded-lg hover:bg-dh-accent-light"
            >
              <ArrowLeft size={14} /> สำหรับลูกค้าทั่วไป กลับสู่หน้าเว็บหลัก
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}