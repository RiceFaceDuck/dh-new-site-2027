import React from 'react';
import { Mail, Lock, ShieldCheck, Terminal, Fingerprint } from 'lucide-react';

const AuthForm = ({ isLogin, setIsLogin, handleGoogleLogin, handleEmailAuth }) => {
  return (
    <div className="w-full relative">
      {/* ลบพื้นหลังเบลอวงกลมแบบเก่าออก 
        ใช้พื้นที่สะอาดตา เน้นที่ตัวฟอร์มล็อกอินสไตล์ Tech
      */}

      {/* Main Auth Container */}
      <div className="w-full max-w-md mx-auto bg-white rounded-sm shadow-tech-card border border-slate-200 overflow-hidden relative z-10 group">
        
        {/* Top Tech Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-emerald via-cyber-blue to-transparent"></div>

        {/* Status Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
           <div className="flex items-center gap-2">
             <ShieldCheck size={18} className="text-cyber-emerald" />
             <span className="text-white text-xs font-tech font-bold tracking-widest uppercase">
               Secure Portal
             </span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-cyber-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
             <span className="text-slate-400 text-[9px] font-tech uppercase tracking-wider">System Online</span>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button 
            onClick={() => setIsLogin(true)} 
            className={`flex-1 py-3.5 text-[11px] font-tech tracking-widest uppercase font-bold transition-all ${
              isLogin 
                ? 'text-cyber-emerald border-b-2 border-cyber-emerald bg-white' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            Authentication
          </button>
          <button 
            onClick={() => setIsLogin(false)} 
            className={`flex-1 py-3.5 text-[11px] font-tech tracking-widest uppercase font-bold transition-all ${
              !isLogin 
                ? 'text-cyber-blue border-b-2 border-cyber-blue bg-white' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            Registration
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
              <Terminal size={24} className="text-slate-700" />
              {isLogin ? 'Partner Login' : 'Create Partner ID'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isLogin ? 'ลงชื่อเข้าใช้เพื่อเข้าสู่ระบบศูนย์ควบคุมพันธมิตร' : 'ลงทะเบียนเพื่อรับสิทธิ์พาร์ทเนอร์และราคาพิเศษ'}
            </p>
          </div>

          {/* Social Auth (Google) */}
          <button 
            onClick={handleGoogleLogin} 
            type="button" 
            className="w-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-2.5 px-4 rounded-sm font-semibold transition-all shadow-sm text-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-3" alt="Google" />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="px-3 text-[10px] text-slate-400 font-tech uppercase tracking-widest">Or Use Email</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Email / Password Form */}
          <form className="space-y-4" onSubmit={handleEmailAuth}>
            <div>
              <div className="relative">
                <Mail size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Email Address" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-cyber-emerald focus:border-cyber-emerald transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400 font-tech" 
                  required 
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  name="password"
                  placeholder="Password" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-1 focus:ring-cyber-emerald focus:border-cyber-emerald transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400 font-tech" 
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className={`w-full text-white font-bold py-3 rounded-sm transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-tech mt-2 ${
                isLogin 
                  ? 'bg-slate-800 hover:bg-slate-900 border-slate-900 hover:shadow-glow-emerald' 
                  : 'bg-cyber-blue hover:bg-sky-600 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_20px_rgba(14,165,233,0.5)]'
              }`}
            >
              {isLogin ? (
                <><Fingerprint size={16} className="text-cyber-emerald" /> Authenticate</>
              ) : (
                <><ShieldCheck size={16} /> Initialize ID</>
              )}
            </button>
          </form>

          {/* Footer Warning */}
          <div className="mt-6 text-center">
             <p className="text-[9px] text-slate-400 font-tech tracking-widest uppercase">
               By proceeding, you agree to DH Notebook <br/>
               <span className="text-cyber-emerald cursor-pointer hover:underline">Terms of Service</span> & <span className="text-cyber-emerald cursor-pointer hover:underline">Privacy Policy</span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;