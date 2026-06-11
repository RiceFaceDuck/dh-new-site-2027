import React from 'react';
import { CheckCircle2, XCircle, Clock, ChevronLeft } from 'lucide-react';

export default function StatusView({ statusData, onBack }) {
    const { type, message, user } = statusData;
    
    const isPending = type === 'pending';
    const isError = type === 'unauthorized';
    const isSuccess = type === 'success';

    return (
        <div className="animate-fade-in text-center p-4 space-y-6">
            {user && (
                <div className="flex items-center justify-center gap-4">
                    {user.photo ? (
                        <img 
                            src={user.photo} 
                            alt="Profile" 
                            className={`w-12 h-12 rounded-full border-2 shadow-sm ${
                                isPending ? 'border-amber-200' : 
                                isError ? 'border-red-200' : 'border-emerald-200'
                            }`} 
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            {isPending && <Clock size={24} className="text-amber-500" />}
                            {isError && <XCircle size={24} className="text-red-500" />}
                            {isSuccess && <CheckCircle2 size={24} className="text-emerald-500" />}
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-sm text-slate-500 dark:text-slate-400">ชื่อบัญชีผู้ใช้</p>
                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{user.name}</p>
                    </div>
                </div>
            )}

            <div>
                {isPending && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                )}
                
                {isError && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-400 font-bold leading-relaxed">
                            {message}
                        </p>
                    </div>
                )}

                {isSuccess && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-pulse">
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                )}
            </div>

            {isError && (
                <button 
                    onClick={onBack} 
                    className="w-full text-center text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 mt-6 flex items-center justify-center gap-2 transition-colors py-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    <ChevronLeft size={16} /> ย้อนกลับไปหน้าเข้าสู่ระบบ
                </button>
            )}
            
            {isPending && (
                <button 
                    onClick={onBack} 
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-4 flex items-center justify-center gap-1 transition-colors"
                >
                    <ChevronLeft size={14} /> กลับสู่หน้าหลัก
                </button>
            )}
        </div>
    );
}
