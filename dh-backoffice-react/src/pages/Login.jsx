import React, { useState, useEffect } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'; 
import { doc, updateDoc } from 'firebase/firestore'; 
import { auth, googleProvider, db } from '../firebase/config';
import { 
    ShieldCheck, AlertCircle, Loader2, ArrowLeft, Building2, 
    LockKeyhole, CheckCircle2, UserPlus, LogIn, ChevronLeft, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { userService } from '../firebase/userService'; 
import { todoService } from '../firebase/todoService'; // ✅ เรียกใช้ระบบ Todo

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
  
  // UX States
  const [isRegisterMode, setIsRegisterMode] = useState(false); // ✅ สลับโหมดฟอร์ม
  const [successUser, setSuccessUser] = useState(null); 
  const navigate = useNavigate();

  // Registration Form State
  const [regForm, setRegForm] = useState({
      name: '',
      gender: 'unspecified',
      startDate: '',
      position: 'staff'
  });

  // 🌟 ฟีเจอร์: Auto-Redirect (ถ้าล็อกอินค้างไว้แล้วและมีสิทธิ์ ให้เด้งเข้าแอปเลย ไม่ต้องกดซ้ำ)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !loading && !successUser) {
        try {
          const profile = await userService.getUserProfile(user.uid);
          
          // 🛑 ดักจับกรณีเป็น Pending ห้ามให้เข้าแอป
          if (profile?.role === 'pending_approval' || profile?.role === 'pending') {
              signOut(auth); // บังคับเตะออกเพื่อไม่ให้ค้างสถานะ
              return;
          }

          const userEmail = (user.email || '').toLowerCase();
          const isOwner = [
            'dh1notebook@gmail.com', 
            'dh2notebook@gmail.com', 
            'zhoulinjuan1@gmail.com'
          ].includes(userEmail);

          if (isOwner || (profile && profile.isStaff) || (profile && ['admin', 'manager', 'staff', 'packer'].includes(profile.role))) {
              navigate('/overview');
          }
        } catch(e) { console.error("Auto-redirect check failed", e); }
      }
    });
    return () => unsubscribe();
  }, [navigate, loading, successUser]);

  // ==========================================
  // 🔐 1. โหมดเข้าสู่ระบบ (LOGIN)
  // ==========================================
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    setStatusText('กำลังเชื่อมต่อบัญชี Google...');
    setAttemptedEmail('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setAttemptedEmail(user.email); 

      setStatusText('กำลังตรวจสอบข้อมูลในระบบ...');
      const profile = await userService.syncUserProfile(user);

      // 🛑 ตรวจสอบว่าพนักงานรายนี้รออนุมัติอยู่หรือไม่?
      if (profile?.role === 'pending_approval' || profile?.role === 'pending') {
          await signOut(auth); // เตะออกเพื่อความปลอดภัย
          setError('บัญชีของคุณอยู่ระหว่างรอการตรวจสอบและอนุมัติจากผู้จัดการ กรุณารอสักครู่');
          setLoading(false);
          return;
      }

      // 🛡️ ตรวจสอบกลุ่มเจ้าของร้าน
      const userEmail = (user.email || '').toLowerCase();
      const isOwner = [
        'dh1notebook@gmail.com', 
        'dh2notebook@gmail.com', 
        'zhoulinjuan1@gmail.com'
      ].includes(userEmail);

      if (isOwner) {
        setStatusText('กำลังเปิดสิทธิ์ระดับผู้ดูแลสูงสุด (Owner)...');
        try {
          await userService.updateUserRole(user.uid, 'owner');
          const userRef = doc(db, getCollectionPath('users'), user.uid);
          await updateDoc(userRef, { isStaff: true, isActive: true, role: 'owner', roles: ['Owner'] });
        } catch (e) { console.error("Force owner role failed", e); }
      } else if (!profile?.isStaff && !['admin', 'manager', 'staff', 'packer'].includes(profile?.role)) {
          // กรณีมีบัญชีแต่ไม่มีสิทธิ์เป็นพนักงาน
          await signOut(auth);
          setError('บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ Backoffice หากคุณเป็นพนักงานใหม่ กรุณาลงทะเบียนพนักงานด้านล่าง');
          setLoading(false);
          return;
      }

      setSuccessUser({ name: user.displayName || 'พนักงาน', photo: user.photoURL, isPending: false });
      setStatusText('ยืนยันตัวตนสำเร็จ กำลังพาท่านเข้าสู่พื้นที่ทำงาน...');

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

  // ==========================================
  // 📝 2. โหมดลงทะเบียนพนักงานใหม่ (REGISTER)
  // ==========================================
  const handleStaffRegistration = async (e) => {
      e.preventDefault();
      
      // Basic Validation
      if (!regForm.name || !regForm.startDate) {
          setError('กรุณากรอกข้อมูล ชื่อ-นามสกุล และวันเริ่มงานให้ครบถ้วน');
          return;
      }

      setError('');
      setLoading(true);
      setStatusText('กำลังเชื่อมต่อบัญชี Google ของคุณ...');

      try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          setAttemptedEmail(user.email);

          // เช็คว่ามีบัญชีแล้วหรือยัง
          const existingProfile = await userService.getUserProfile(user.uid);
          if (existingProfile && existingProfile.role && existingProfile.role !== 'user') {
              if (existingProfile.role === 'pending_approval' || existingProfile.role === 'pending') {
                  setSuccessUser({ name: existingProfile.displayName || user.displayName, photo: user.photoURL, isPending: true });
                  await signOut(auth);
                  return;
              } else {
                  // ถ้าเป็นพนักงานอยู่แล้ว ให้เข้าสู่ระบบเลย
                  window.location.replace('/overview');
                  return;
              }
          }

          setStatusText('กำลังส่งคำร้องขอเข้าทำงานไปยังผู้จัดการ...');
          
          // 1. ลงทะเบียนเป็นสถานะ Pending
          await userService.registerPendingStaff(user.uid, user.email, regForm);
          
          // 2. สร้าง To-do ให้ผู้จัดการอนุมัติ
          await todoService.createStaffApprovalTask({
              uid: user.uid,
              email: user.email,
              ...regForm
          });

          setSuccessUser({ name: regForm.name, photo: user.photoURL, isPending: true });
          
          // เตะออกจากระบบ Auth ป้องกันไม่ให้แอบเข้าแอปโดยไม่ตั้งใจ
          await signOut(auth);

      } catch (err) {
          console.error("Registration Error:", err);
          if (err.code === 'auth/popup-closed-by-user') {
            setError('คุณได้ยกเลิกการเข้าระบบก่อนทำรายการเสร็จ');
          } else {
            setError('ไม่สามารถลงทะเบียนได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
          }
          setLoading(false);
          setSuccessUser(null);
      }
  };

  const handleFormChange = (e) => {
      setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* 🎨 Gimmick: Background Decorations เพื่อความหรูหรามีมิติ */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className={`w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 transform ${isRegisterMode ? 'scale-[1.02]' : 'scale-100'}`}>
        
        {/* Top Accent Line */}
        <div className={`h-2 w-full transition-colors duration-500 ${successUser ? (successUser.isPending ? 'bg-amber-500' : 'bg-emerald-500') : isRegisterMode ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400'}`}></div>

        <div className="p-8 sm:p-10 relative overflow-hidden">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border shadow-sm mb-6 transition-all duration-500 ${
              successUser 
                ? successUser.isPending 
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 scale-110' 
                    : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 scale-110' 
                : isRegisterMode
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              {successUser ? (
                  successUser.isPending 
                  ? <CheckCircle2 className="w-8 h-8 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                  : <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
              ) : isRegisterMode ? (
                  <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
              ) : (
                  <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" strokeWidth={1.5} />
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white transition-all">
              {successUser 
                  ? (successUser.isPending ? 'ส่งคำขอสำเร็จ' : 'ยินดีต้อนรับ') 
                  : isRegisterMode ? 'ลงทะเบียนพนักงาน' : 'DH Backoffice'
              }
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 transition-all">
              {successUser ? (
                  successUser.isPending 
                  ? <AlertCircle size={14} className="text-amber-500" />
                  : <LockKeyhole size={14} className="text-emerald-500" />
              ) : (
                  <LockKeyhole size={14} className={isRegisterMode ? "text-indigo-500" : "text-blue-600 dark:text-blue-500"} />
              )}
              {successUser 
                  ? (successUser.isPending ? 'กรุณารอผู้จัดการอนุมัติสิทธิ์เข้าใช้งาน' : 'ระบบกำลังเตรียมพื้นที่ทำงานของคุณ') 
                  : isRegisterMode ? 'กรอกข้อมูลเพื่อขอสิทธิ์เข้าใช้งานระบบ' : 'พื้นที่เฉพาะเจ้าหน้าที่และผู้จัดการเท่านั้น'
              }
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
                      บัญชีอ้างอิง: {attemptedEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 🌟 ACTION SECTION: LOGIN OR REGISTER */}
          {/* ========================================== */}
          <div className="relative">
            {successUser ? (
                // --- SUCCESS STATE ---
                <div className="animate-fade-in text-center p-4">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {successUser.photo ? (
                            <img src={successUser.photo} alt="Profile" className={`w-12 h-12 rounded-full border-2 shadow-sm ${successUser.isPending ? 'border-amber-200' : 'border-emerald-200'}`} />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <CheckCircle2 size={24} className={successUser.isPending ? "text-amber-500" : "text-emerald-500"} />
                            </div>
                        )}
                        <div className="text-left">
                            <p className="text-sm text-slate-500 dark:text-slate-400">คุณเข้าใช้งานในชื่อ</p>
                            <p className="font-bold text-lg">{successUser.name}</p>
                        </div>
                    </div>
                    {successUser.isPending ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                            ข้อมูลของคุณถูกส่งไปยังผู้จัดการแล้ว คุณจะสามารถเข้าใช้งานระบบได้ทันทีหลังจากได้รับการอนุมัติ
                        </p>
                    ) : (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 animate-pulse">
                            กำลังพาท่านเข้าสู่แดชบอร์ดการทำงาน...
                        </p>
                    )}
                </div>

            ) : isRegisterMode ? (
                // --- REGISTER FORM STATE ---
                <form onSubmit={handleStaffRegistration} className="space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">ชื่อ-นามสกุล (สำหรับใช้ในระบบ)</label>
                        <input 
                            type="text" name="name" required
                            value={regForm.name} onChange={handleFormChange}
                            placeholder="เช่น สมชาย พนักงานแพ็ค"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">เพศ</label>
                            <select name="gender" value={regForm.gender} onChange={handleFormChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all cursor-pointer">
                                <option value="unspecified">ไม่ระบุ</option>
                                <option value="male">ชาย</option>
                                <option value="female">หญิง</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">วันที่เริ่มงาน</label>
                            <input 
                                type="date" name="startDate" required
                                value={regForm.startDate} onChange={handleFormChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-slate-600 dark:text-slate-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">ตำแหน่งที่ต้องการสมัคร</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                            <select name="position" value={regForm.position} onChange={handleFormChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all cursor-pointer appearance-none">
                                <option value="staff">พนักงานทั่วไป (Staff)</option>
                                <option value="packer">พนักงานแพ็คสินค้า (Packer)</option>
                                <option value="manager">ผู้จัดการ (Manager)</option>
                                <option value="admin">แอดมินระบบ (Admin)</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-3 py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all ${loading ? 'opacity-70 pointer-events-none' : 'active:scale-[0.98]'}`}
                    >
                        {loading ? (
                            <><Loader2 size={20} className="animate-spin shrink-0" /><span className="text-sm">{statusText}</span></>
                        ) : (
                            <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5 bg-white p-0.5 rounded-full" /><span className="text-sm tracking-wide">ยืนยันข้อมูลและผูกบัญชี Google</span></>
                        )}
                    </button>

                    {!loading && (
                        <button type="button" onClick={() => { setIsRegisterMode(false); setError(''); }} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-4 flex items-center justify-center gap-1 transition-colors">
                            <ChevronLeft size={14} /> ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
                        </button>
                    )}
                </form>

            ) : (
                // --- DEFAULT LOGIN STATE ---
                <div className="space-y-4 animate-fade-in">
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-800 border rounded-xl font-bold transition-all shadow-sm ${
                        loading 
                            ? 'border-blue-400 text-slate-700 dark:text-slate-200 opacity-80' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-500/50 hover:shadow-md active:scale-[0.98]'
                        } group`}
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
                    
                    {!loading && (
                        <>
                            <div className="flex items-center justify-center gap-2 py-2">
                                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>
                                <span className="text-xs text-slate-400 font-medium whitespace-nowrap px-2">หรือพนักงานใหม่</span>
                                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>
                            </div>

                            <button 
                                onClick={() => { setIsRegisterMode(true); setError(''); }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/50 dark:hover:bg-indigo-900/30 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                            >
                                <UserPlus size={18} /> สมัครเพื่อขอสิทธิ์พนักงาน
                            </button>
                        </>
                    )}

                    {!loading && (
                        <div className="pt-6 text-center">
                            <a 
                                href="https://dh-notebook-frontend.web.app" 
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors group"
                            >
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                กลับไปยังหน้าเว็บไซต์หลักสำหรับลูกค้า
                            </a>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
        
        {/* Security Badge Footer */}
        <div className={`p-4 border-t flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
            successUser 
              ? successUser.isPending 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50 text-amber-600 dark:text-amber-400' 
                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400' 
              : isRegisterMode
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'
        }`}>
          <ShieldCheck size={14} />
          ระบบรักษาความปลอดภัย 2 ชั้น (Enterprise Gatekeeper Active)
        </div>
      </div>
    </div>
  );
}