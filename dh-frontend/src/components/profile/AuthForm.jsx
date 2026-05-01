import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../firebase/authService';

// Google Icon SVG (Official Colors)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ฉลาดในการสื่อสาร: แปลง Error เป็นภาษาไทยให้ User ไม่งง
  const translateError = (err) => {
    if (err.message && err.message.includes('บล็อคหน้าต่าง Popup')) return err.message;
    switch (err.code) {
      case 'auth/popup-closed-by-user': return 'คุณยกเลิกการเข้าสู่ระบบผ่าน Google';
      case 'auth/invalid-credential': return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      case 'auth/email-already-in-use': return 'อีเมลนี้มีผู้ใช้งานแล้ว กรุณาเข้าสู่ระบบแทน';
      case 'auth/weak-password': return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      case 'auth/network-request-failed': return 'เกิดปัญหาการเชื่อมต่ออินเทอร์เน็ต';
      default: return 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง';
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // ไม่ต้องทำ Navigate() เพราะไฟล์ Profile.jsx (ตัวแม่) จะจัดการเช็ค Status และเปลี่ยนหน้าให้อัตโนมัติ
    } catch (err) {
      setError(translateError(err));
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        await registerWithEmail(formData.email, formData.password, formData.name);
      }
    } catch (err) {
      setError(translateError(err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative mt-8 lg:mt-16">
      {/* UX Gimmick: แสงวงกลมพื้นหลัง เพิ่มมิติความน่าเชื่อถือ */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            {isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อและรับสิทธิพิเศษ' : 'ลงทะเบียนเพื่อเริ่มต้นประสบการณ์ช้อปปิ้งที่ดีที่สุด'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group mb-6 shadow-sm hover:shadow"
        >
          {loading && !formData.email ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          ) : (
            <GoogleIcon />
          )}
          <span>ดำเนินการต่อด้วย Google</span>
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-4 text-xs text-gray-400 uppercase tracking-widest absolute">หรือใช้อีเมล</span>
        </div>

        {/* Standard Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                name="name"
                required={!isLogin}
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
                placeholder="ชื่อ - นามสกุล"
              />
            </div>
          )}

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
              placeholder="อีเมลของคุณ"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
              placeholder="รหัสผ่าน"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white font-semibold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && formData.email ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          {isLogin ? "ยังไม่มีบัญชีใช่หรือไม่? " : "มีบัญชีอยู่แล้วใช่ไหม? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-blue-600 font-bold hover:text-blue-800 transition-colors underline decoration-2 decoration-transparent hover:decoration-blue-600 underline-offset-4"
          >
            {isLogin ? "สมัครสมาชิกใหม่" : "เข้าสู่ระบบเลย"}
          </button>
        </div>

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center justify-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">ข้อมูลถูกเข้ารหัสและปกป้องอย่างปลอดภัย</span>
          </div>
        </div>
      </div>
    </div>
  );
}