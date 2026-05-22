import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, AlertCircle, ShieldCheck, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../firebase/authService';

// Google Icon SVG (Official Colors)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.56 0 2.95.54 4.06 1.43l3.04-3.04C17.46 2.19 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  
  // แยก Loading State เพื่อให้ UI ตอบสนองตรงจุด
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  
  // Gimmick: แสดง/ซ่อน รหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);

  // ล้างฟอร์มและ Error เมื่อสลับโหมด Login / Register
  useEffect(() => {
    setError('');
    setFormData({ email: '', password: '', name: '' });
    setShowPassword(false);
  }, [isLogin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    if (!isLogin && !formData.name) {
      setError('กรุณากรอกชื่อ-นามสกุลของคุณ');
      return;
    }

    setIsLoadingEmail(true);
    setError('');
    
    try {
      if (isLogin) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        await registerWithEmail(formData.email, formData.password, formData.name);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ');
      } else if (err.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      } else {
        setError('เกิดข้อผิดพลาด: ' + err.message);
      }
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-md mx-auto relative overflow-hidden transition-all duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-60 -ml-10 -mb-10 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
            <Lock className="w-8 h-8 text-[#0870B8]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            {isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isLogin ? 'เข้าสู่ระบบเพื่อจัดการร้านค้าและเครดิตของคุณ' : 'เข้าร่วมเป็นพาร์ทเนอร์และรับสิทธิพิเศษมากมาย'}
          </p>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoadingEmail || isLoadingGoogle}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
        >
          {isLoadingGoogle ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          ) : (
            <>
              <GoogleIcon />
              <span className="group-hover:text-blue-600 transition-colors">ดำเนินการต่อด้วย Google</span>
            </>
          )}
        </button>

        <div className="mt-6 mb-6 flex items-center justify-center">
          <div className="w-full border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-400 font-medium bg-white">หรือด้วยอีเมล</span>
          <div className="w-full border-t border-gray-200"></div>
        </div>

        {/* Error Banner (Smooth Animation) */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-[pulse_0.5s_ease-in-out]">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          
          {/* Name Field (Only for Register) */}
          {!isLogin && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อ - นามสกุล</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-800"
                  placeholder="กรอกชื่อ-นามสกุล"
                  disabled={isLoadingEmail || isLoadingGoogle}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">อีเมล</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-800"
                placeholder="you@example.com"
                required
                disabled={isLoadingEmail || isLoadingGoogle}
              />
            </div>
          </div>

          {/* Password Field with Eye Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">รหัสผ่าน</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-800"
                placeholder="••••••••"
                required
                disabled={isLoadingEmail || isLoadingGoogle}
              />
              {/* Toggle Visibility Button */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoadingEmail || isLoadingGoogle || !formData.email || !formData.password}
            className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-[#0870B8] to-[#0A85D9] hover:from-[#065a96] hover:to-[#0870B8] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {isLoadingEmail ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-8 text-center text-sm text-gray-600">
          {isLogin ? "ยังไม่มีบัญชีใช่หรือไม่? " : "มีบัญชีอยู่แล้วใช่ไหม? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#0870B8] font-bold hover:text-[#065a96] transition-colors underline decoration-2 decoration-transparent hover:decoration-[#0870B8] underline-offset-4"
          >
            {isLogin ? "สมัครสมาชิกใหม่" : "เข้าสู่ระบบเลย"}
          </button>
        </div>

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">ข้อมูลของคุณได้รับการปกป้อง 100%</span>
          </div>
          <p>Secure login powered by Firebase Auth</p>
        </div>
      </div>
    </div>
  );
}