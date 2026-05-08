import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth'; 
import { auth, googleProvider } from '../firebase/config';
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft, Building2, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { userService } from '../firebase/userService'; 

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState(''); 
  const [attemptedEmail, setAttemptedEmail] = useState(''); 
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    setStatusText('กำลังเชื่อมต่อบัญชี Google...');
    setAttemptedEmail('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setAttemptedEmail(user.email); 

      setStatusText('กำลังอัปเดตและลงทะเบียนเข้าสู่ระบบ...');
      // 2. ซิงค์ข้อมูลลงฐานข้อมูล (ผู้ใช้ใหม่จะได้สถานะ Pending เข้าสู่ระบบ)
      await userService.syncUserProfile(user);

      // 🛡️ Fallback ตรวจสอบเจ้าของร้าน
      const userEmail = (user.email || '').toLowerCase();
      const isOwner = userEmail === 'dh1notebook@gmail.com' || userEmail === 'zhoulinjuan1@gmail.com';

      if (isOwner) {
        try { await userService.updateUserRole(user.uid, 'admin'); } catch (e) {}
      }

      // ✅ แก้ไข: อนุญาตให้ Login ผ่านเข้าไปได้เลย แล้วให้ AdminLayout แสดงหน้าต่าง "รออนุมัติ" แทนการเตะออก
      setStatusText('เข้าสู่ระบบสำเร็จ กำลังพาท่านเข้าสู่ระบบ...');
      setTimeout(() => {
        navigate('/overview');
      }, 800);

    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('คุณได้ยกเลิกการเข้าระบบก่อนทำรายการเสร็จ');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google กรุณาลองใหม่');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* 🎨 Gimmick: Background Decorations เพื่อความหรูหรามีมิติ */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        
        {/* Top Accent Line */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400"></div>

        <div className="p-8 sm:p-10">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm mb-6 transition-colors">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white">
              DH Backoffice
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <LockKeyhole size={14} className="text-blue-600 dark:text-blue-500" />
              พื้นที่เฉพาะเจ้าหน้าที่เท่านั้น
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium leading-relaxed">{error}</p>
                  {attemptedEmail && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 font-semibold">
                      อีเมลของคุณ: {attemptedEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Action Section */}
          <div className="space-y-5">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border ${loading ? 'border-blue-400' : 'border-slate-200 dark:border-slate-700'} rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-500/50 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed group`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3 w-full">
                  <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-sm text-blue-600 dark:text-blue-400 tracking-wide truncate">{statusText}</span>
                </div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm tracking-wide">เข้าสู่ระบบด้วยบัญชีองค์กร</span>
                </>
              )}
            </button>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              {/* ทางออกสำหรับลูกค้าที่หลงเข้ามา */}
              <a 
                href="https://dh-notebook-frontend.web.app" 
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                กลับไปยังหน้าเว็บไซต์หลักสำหรับลูกค้า
              </a>
            </div>
          </div>
        </div>
        
        {/* Security Badge Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors">
          <ShieldCheck size={14} className="text-emerald-500" />
          ระบบรักษาความปลอดภัย 2 ชั้น (Gatekeeper Active)
        </div>
      </div>
    </div>
  );
}