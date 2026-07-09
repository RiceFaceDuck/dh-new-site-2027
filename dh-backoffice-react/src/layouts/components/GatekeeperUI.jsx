import React from 'react';
import { ShieldCheck, Users } from 'lucide-react';

export function GatekeeperChecking() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl text-center border border-slate-100 dark:border-slate-700 animate-in zoom-in duration-300">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <ShieldCheck className="absolute inset-0 m-auto text-blue-600 dark:text-blue-500" size={24} />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">กำลังตรวจสอบสิทธิ์...</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">DH System Security Gatekeeper</p>
      </div>
    </div>
  );
}

export function GatekeeperDenied({ denyReason, handleLogout }) {
  const isError = denyReason === 'error';
  const isBlocked = denyReason === 'blocked';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 blur-[100px] rounded-full pointer-events-none ${isError ? 'bg-slate-400/20' : isBlocked ? 'bg-red-500/10' : 'bg-amber-400/20'}`}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className={`p-8 sm:p-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center max-w-md w-full border-t-4 animate-in zoom-in-95 duration-500 relative z-10 ${
        isError ? 'border-slate-500' : isBlocked ? 'border-red-500' : 'border-amber-500'
      }`}>
        <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 shadow-inner ${
          isError ? 'bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400' : 
          isBlocked ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 
          'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
        }`}>
          <Users className="h-10 w-10 drop-shadow-sm" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          {isError ? 'ไม่พบข้อมูลสิทธิ์การเข้าใช้งาน' : isBlocked ? 'บัญชีถูกระงับการใช้งาน' : 'บัญชีรอการอนุมัติ'}
        </h2>
        
        <div className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium text-sm">
          {isError ? (
            <p>
              ระบบไม่พบข้อมูลสิทธิ์การเข้าถึง Backoffice สำหรับบัญชีของคุณ<br/><br/>
              หากคุณเป็นพนักงานใหม่ กรุณาติดต่อผู้จัดการเพื่อเพิ่มข้อมูลเข้าสู่ระบบ หรือตรวจสอบว่าคุณใช้อีเมลที่ถูกต้องในการเข้าสู่ระบบ
            </p>
          ) : isBlocked ? (
            <p>บัญชีของคุณถูกระงับการเข้าถึงชั่วคราว<br/>กรุณาติดต่อผู้จัดการหรือผู้ดูแลระบบเพื่อตรวจสอบ</p>
          ) : (
            <p>
              บัญชีของคุณอยู่ในสถานะ <br/>
              <span className="inline-block mt-3 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-500/20 font-bold shadow-xs">"รอการอนุมัติสิทธิ์ (Pending)"</span> <br/><br/>
              กรุณาแจ้งผู้จัดการเพื่อเปิดสิทธิ์การเข้าใช้งานระบบ
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => window.location.reload()} className="w-full px-4 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95">
            โหลดข้อมูลใหม่
          </button>
          <button onClick={handleLogout} className="w-full px-4 py-3.5 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95">
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
