import React from 'react';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';

export default function LoginForm({ 
    onLogin, 
    onGoRegister, 
    loading, 
    statusText 
}) {
    return (
        <div className="space-y-4 animate-fade-in">
            <button 
                onClick={onLogin}
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
                        onClick={onGoRegister}
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
    );
}
