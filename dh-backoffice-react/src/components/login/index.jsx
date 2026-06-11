import React from 'react';
import { ShieldCheck, AlertCircle, Building2, LockKeyhole, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuthFlow } from './hooks/useAuthFlow';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import StatusView from './StatusView';

export default function LoginContainer() {
    const {
        viewMode,
        setViewMode,
        loading,
        error,
        setError,
        statusText,
        attemptedEmail,
        statusData,
        handleGoogleLogin,
        handleStaffRegistration,
        resetFlow
    } = useAuthFlow();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
            
            {/* 🎨 Gimmick: Background Decorations เพื่อความหรูหรามีมิติ */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{animationDelay: '1s'}}></div>
            
            <div className={`w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 transform ${viewMode === 'register' ? 'scale-[1.02]' : 'scale-100'}`}>
                
                {/* Top Accent Line */}
                <div className={`h-2 w-full transition-colors duration-500 ${
                    viewMode === 'status' && statusData.type === 'pending' ? 'bg-amber-500' :
                    viewMode === 'status' && statusData.type === 'success' ? 'bg-emerald-500' :
                    viewMode === 'status' && statusData.type === 'unauthorized' ? 'bg-red-500' :
                    viewMode === 'register' ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 
                    'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400'
                }`}></div>

                <div className="p-8 sm:p-10 relative overflow-hidden">
                    
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border shadow-sm mb-6 transition-all duration-500 ${
                            viewMode === 'status' 
                                ? (statusData.type === 'pending' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 scale-110' :
                                   statusData.type === 'unauthorized' ? 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 scale-110' :
                                   'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 scale-110')
                                : viewMode === 'register'
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}>
                            {viewMode === 'status' ? (
                                statusData.type === 'pending' ? <CheckCircle2 className="w-8 h-8 text-amber-600 dark:text-amber-400" strokeWidth={2} /> :
                                statusData.type === 'unauthorized' ? <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" strokeWidth={2} /> :
                                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                            ) : viewMode === 'register' ? (
                                <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                            ) : (
                                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" strokeWidth={1.5} />
                            )}
                        </div>
                        
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-slate-900 dark:text-white transition-all">
                            {viewMode === 'status' 
                                ? statusData.title
                                : viewMode === 'register' ? 'ลงทะเบียนพนักงาน' : (
                                    <>
                                        <span className="block">DH Notebook</span>
                                        <span className="block text-xl sm:text-2xl text-blue-600 dark:text-blue-500 mt-1">System Command</span>
                                    </>
                                )
                            }
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 transition-all">
                            {viewMode === 'status' ? (
                                statusData.type === 'pending' ? <AlertCircle size={14} className="text-amber-500" /> :
                                statusData.type === 'unauthorized' ? <AlertCircle size={14} className="text-red-500" /> :
                                <LockKeyhole size={14} className="text-emerald-500" />
                            ) : (
                                <LockKeyhole size={14} className={viewMode === 'register' ? "text-indigo-500" : "text-blue-600 dark:text-blue-500"} />
                            )}
                            {viewMode === 'status' 
                                ? (statusData.type === 'pending' ? 'กรุณารอผู้จัดการอนุมัติสิทธิ์เข้าใช้งาน' : 
                                   statusData.type === 'unauthorized' ? 'ติดต่อผู้ดูแลระบบหากคิดว่านี่คือข้อผิดพลาด' :
                                   'ระบบกำลังเตรียมพื้นที่ทำงานของคุณ') 
                                : viewMode === 'register' ? 'กรอกข้อมูลเพื่อขอสิทธิ์เข้าใช้งานระบบ' : 'พื้นที่เฉพาะเจ้าหน้าที่และผู้จัดการเท่านั้น'
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

                    {/* Content Section */}
                    <div className="relative">
                        {viewMode === 'status' && (
                            <StatusView 
                                statusData={statusData} 
                                onBack={resetFlow} 
                            />
                        )}

                        {viewMode === 'register' && (
                            <RegisterForm 
                                onSubmit={handleStaffRegistration} 
                                onCancel={resetFlow} 
                                loading={loading} 
                                statusText={statusText} 
                            />
                        )}

                        {viewMode === 'login' && (
                            <LoginForm 
                                onLogin={handleGoogleLogin} 
                                onGoRegister={() => { setViewMode('register'); setError(''); }} 
                                loading={loading} 
                                statusText={statusText} 
                            />
                        )}
                    </div>
                </div>
                
                {/* Security Badge Footer */}
                <div className={`p-4 border-t flex items-center justify-center gap-2 text-xs font-medium transition-colors ${
                    viewMode === 'status'
                        ? (statusData.type === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50 text-amber-600 dark:text-amber-400' :
                           statusData.type === 'unauthorized' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400' :
                           'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400')
                        : viewMode === 'register'
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
