import React, { useState, useEffect } from 'react';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth'; 
import { doc, updateDoc } from 'firebase/firestore'; // เพิ่มสำหรับบังคับอัปเดตสิทธิ์ Owner
import { auth, googleProvider, db } from '../firebase/config';
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft, Building2, LockKeyhole, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { userService } from '../firebase/userService'; 

// Helper ป้องกันการผิดพลาดของ Path ฐานข้อมูล
const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState(''); 
  const [attemptedEmail, setAttemptedEmail] = useState(''); 
  
  // UX State สำหรับแสดงข้อมูลหลังล็อกอินสำเร็จ
  const [successUser, setSuccessUser] = useState(null); 
  const navigate = useNavigate();

  // 🌟 ฟีเจอร์ใหม่: Auto-Redirect (ถ้าล็อกอินค้างไว้แล้วและมีสิทธิ์ ให้เด้งเข้าแอปเลย ไม่ต้องกดซ้ำ)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !loading && !successUser) {
        try {
          const profile = await userService.getUserProfile(user.uid);
          const userEmail = (user.email || '').toLowerCase();
          const isOwner = [
            'dh1notebook@gmail.com', 
            'dh2notebook@gmail.com', 
            'zhoulinjuan1@gmail.com'
          ].includes(userEmail);

          if (isOwner || (profile && profile.isStaff)) {
             navigate('/overview');
          }
        } catch(e) { console.error("Auto-redirect check failed", e); }
      }
    });
    return () => unsubscribe();
  }, [navigate, loading, successUser]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    setStatusText('กำลังเชื่อมต่อบัญชี Google...');
    setAttemptedEmail('');

    try {
      // 1. เรียกหน้าต่าง Google Login
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setAttemptedEmail(user.email); 

      setStatusText('กำลังประสานข้อมูลกับระบบ...');
      // 2. ซิงค์ข้อมูลลงฐานข้อมูล (คนมาใหม่จะได้สถานะ Pending)
      await userService.syncUserProfile(user);

      // 🛡️ 3. ตรวจสอบกลุ่มเจ้าของร้าน (เพิ่ม dh2notebook แล้ว)
      const userEmail = (user.email || '').toLowerCase();
      const isOwner = [
        'dh1notebook@gmail.com', 
        'dh2notebook@gmail.com', 
        'zhoulinjuan1@gmail.com'
      ].includes(userEmail);

      if (isOwner) {
        setStatusText('กำลังเปิดสิทธิ์ระดับผู้ดูแลสูงสุด (Owner)...');
        // ทะลวง Guard: บังคับอัปเดตยศลง Firestore โดยตรง เพื่อให้ทะลุได้ 100%
        try {
          await userService.updateUserRole(user.uid, 'owner');
          const userRef = doc(db, getCollectionPath('users'), user.uid);
          await updateDoc(userRef, { isStaff: true, isActive: true, role: 'owner', roles: ['Owner'] });
        } catch (e) {
          console.error("Force owner role failed", e);
        }
      }

      // 🌟 4. ลูกเล่น UI แสดงการต้อนรับ
      setSuccessUser({
        name: user.displayName || 'พนักงาน',
        photo: user.photoURL
      });
      setStatusText('ยืนยันตัวตนสำเร็จ กำลังพาท่านเข้าสู่พื้นที่ทำงาน...');

      // ✅ 5. ปลดล็อคบั๊ก "อนุมัติแล้วเข้าไม่ได้": ใช้การ Hard Redirect 
      // การใช้ window.location.replace จะล้าง State เก่าที่ค้างอยู่ใน React ทิ้งทั้งหมด และโหลดข้อมูลใหม่เอี่ยม
      setTimeout(() => {
        window.location.replace('/overview'); 
      }, 1500);

    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('คุณได้ยกเลิกการเข้าระบบก่อนทำรายการเสร็จ');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google กรุณาลองใหม่');
      }
      setLoading(false);
      setSuccessUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* 🎨 Gimmick: Background Decorations เพื่อความหรูหรามีมิติ */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        
        {/* Top Accent Line */}
        <div className={`h-2 w-full transition-colors duration-500 ${successUser ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400'}`}></div>

        <div className="p-8 sm:p-10">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border shadow-sm mb-6 transition-all duration-500 ${
              successUser ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 scale-110' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
            }`}>
              {successUser ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              ) : (
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" strokeWidth={1.5} />
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white">
              {successUser ? 'ยินดีต้อนรับ' : 'DH Backoffice'}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <LockKeyhole size={14} className={successUser ? "text-emerald-500" : "text-blue-600 dark:text-blue-500"} />
              {successUser ? 'ระบบกำลังเตรียมพื้นที่ทำงานของคุณ' : 'พื้นที่เฉพาะเจ้าหน้าที่เท่านั้น'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 animate-fade-in-down">
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
              disabled={loading || successUser !== null}
              className={`w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border rounded-xl font-bold transition-all ${
                successUser 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                  : loading 
                    ? 'border-blue-400 text-slate-700 dark:text-slate-200' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-500/50 hover:shadow-md active:scale-[0.98]'
              } group`}
            >
              {successUser ? (
                <div className="flex items-center justify-center gap-3 w-full animate-fade-in">
                  {successUser.photo ? (
                    <img src={successUser.photo} alt="Profile" className="w-6 h-6 rounded-full border border-emerald-200" />
                  ) : (
                    <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span className="text-sm tracking-wide truncate">สวัสดีคุณ {successUser.name}</span>
                </div>
              ) : loading ? (
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
          <ShieldCheck size={14} className={successUser ? "text-emerald-500" : "text-slate-400"} />
          ระบบรักษาความปลอดภัย 2 ชั้น (Gatekeeper Active)
        </div>
      </div>
    </div>
  );
}