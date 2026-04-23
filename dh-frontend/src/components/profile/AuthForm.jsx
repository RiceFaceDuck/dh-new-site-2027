import React from 'react';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

const AuthForm = ({ isLogin, setIsLogin, handleGoogleLogin, handleEmailAuth }) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden relative z-10">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setIsLogin(true)} className={`flex-1 py-4 text-sm font-bold transition-all ${isLogin ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>เข้าสู่ระบบ</button>
          <button onClick={() => setIsLogin(false)} className={`flex-1 py-4 text-sm font-bold transition-all ${!isLogin ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>สมัคร Partner</button>
        </div>

        <div className="p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mb-4 border border-emerald-100">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">
              {isLogin ? 'ยินดีต้อนรับกลับมา' : 'เข้าร่วมเป็น Partner'}
            </h2>
            <p className="text-[11px] md:text-xs text-gray-500 font-medium">
              {isLogin ? 'จัดการออเดอร์และรับสิทธิประโยชน์สำหรับพาร์ทเนอร์' : 'รับราคาส่งและพื้นที่โปรโมทร้านค้าฟรีแบบไม่มีค่าใช้จ่าย'}
            </p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700 font-bold py-3.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md mb-6 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            ดำเนินการต่อด้วย Google
          </button>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">หรือใช้อีเมล</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <form className="space-y-4" onSubmit={handleEmailAuth}>
            <div>
              <div className="relative">
                <Mail size={18} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="อีเมลของคุณ" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock size={18} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" placeholder="รหัสผ่าน" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm mt-2">
              {isLogin ? 'เข้าสู่ระบบ' : 'ลงทะเบียน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;