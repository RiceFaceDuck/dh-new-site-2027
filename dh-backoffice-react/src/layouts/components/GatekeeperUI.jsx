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
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-4">
      <div className={`p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl text-center max-w-md border-t-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        denyReason === 'error' ? 'border-red-500' : 'border-amber-500'
      }`}>
        <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${
          denyReason === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
        }`}>
          <Users className="h-10 w-10" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
          {denyReason === 'error' ? 'การเชื่อมต่อขัดข้อง' : denyReason === 'blocked' ? 'บัญชีถูกระงับ' : 'บัญชีรอการอนุมัติ'}
        </h2>
        
        <div className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed font-medium text-sm">
          {denyReason === 'error' ? (
            <p>ระบบไม่สามารถตรวจสอบสิทธิ์ของคุณได้ในขณะนี้ อาจเกิดจากปัญหาอินเทอร์เน็ตหรือเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง</p>
          ) : denyReason === 'blocked' ? (
            <p>บัญชีของคุณถูกระงับการเข้าถึงชั่วคราว กรุณาติดต่อผู้จัดการหรือผู้ดูแลระบบ</p>
          ) : (
            <p>
              คุณได้ลงทะเบียนเข้าสู่ระบบเรียบร้อยแล้ว แต่อยู่ในสถานะ <br/>
              <span className="inline-block mt-3 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-500/20 font-bold shadow-sm">"รอการอนุมัติสิทธิ์ (Pending)"</span> <br/><br/>
              กรุณาแจ้งผู้จัดการเพื่อเปิดสิทธิ์การเข้าใช้งานระบบ
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => window.location.reload()} className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 active:scale-95">
            โหลดข้อมูลใหม่
          </button>
          <button onClick={handleLogout} className="w-full px-4 py-3 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95">
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
