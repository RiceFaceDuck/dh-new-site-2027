import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { verifyResetCode, resetUserPassword } from '../../firebase/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ดึง oobCode (รหัสลับความปลอดภัย) จาก URL ที่ Firebase ส่งมา
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  // สถานะการตรวจสอบโค้ด
  const [isVerifying, setIsVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // ฟอร์มกรอกรหัสผ่านใหม่
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // สถานะการทำงาน
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // ตรวจสอบความถูกต้องของ Token ลับเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    if (!oobCode) {
      setIsVerifying(false);
      setVerifyError('ไม่พบรหัสความปลอดภัยสำหรับรีเซ็ตรหัสผ่าน กรุณากดขอลิงก์ใหม่อีกครั้ง');
      return;
    }

    const checkCode = async () => {
      try {
        setIsVerifying(true);
        const email = await verifyResetCode(oobCode);
        setUserEmail(email);
        setVerifyError('');
      } catch (err) {
        console.error('Verify reset code error:', err);
        if (err.code === 'auth/expired-action-code') {
          setVerifyError('ลิงก์สำหรับรีเซ็ตรหัสผ่านนี้หมดอายุแล้ว (เกินระยะเวลาความปลอดภัย)');
        } else if (err.code === 'auth/invalid-action-code') {
          setVerifyError('ลิงก์นี้ไม่ถูกต้อง หรืออาจเคยถูกใช้งานไปแล้ว');
        } else {
          setVerifyError('เกิดข้อผิดพลาดในการตรวจสอบลิงก์ กรุณาลองใหม่อีกครั้ง');
        }
      } finally {
        setIsVerifying(false);
      }
    };

    checkCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!password || !confirmPassword) {
      setSubmitError('กรุณากรอกรหัสผ่านให้ครบทั้ง 2 ช่อง');
      return;
    }

    if (password.length < 6) {
      setSubmitError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetUserPassword(oobCode, password);
      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.code === 'auth/expired-action-code') {
        setSubmitError('ลิงก์นี้หมดอายุแล้ว กรุณากดขอลิงก์รีเซ็ตใหม่อีกครั้ง');
      } else if (err.code === 'auth/weak-password') {
        setSubmitError('รหัสผ่านง่ายเกินไป กรุณาตั้งรหัสผ่านที่มีความปลอดภัยมากขึ้น');
      } else {
        setSubmitError('เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่: ' + (err.message || 'โปรดลองอีกครั้ง'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-[2px] shadow-xl border border-slate-200 p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-60 -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10">

          {/* 1. กำลังตรวจสอบ Token ความปลอดภัย */}
          {isVerifying && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
                <Loader2 className="w-8 h-8 text-[#0870B8] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">กำลังตรวจสอบความปลอดภัย...</h2>
              <p className="text-gray-500 mt-2 text-sm">กรุณารอสักครู่ ระบบกำลังยืนยันสิทธิ์การตั้งรหัสผ่าน</p>
            </div>
          )}

          {/* 2. กรณีเกิดข้อผิดพลาด / ลิงก์หมดอายุ */}
          {!isVerifying && verifyError && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">ไม่สามารถตั้งรหัสผ่านได้</h2>
              <p className="text-sm text-red-600 bg-red-50 p-3.5 rounded-[2px] border border-red-200 mb-6 leading-relaxed text-left">
                {verifyError}
              </p>
              <Link
                to="/"
                className="w-full py-3.5 px-4 bg-linear-to-r from-[#0870B8] to-[#0A85D9] hover:from-[#065a96] hover:to-[#0870B8] text-white rounded-md font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                กลับไปหน้าหลักของร้าน
              </Link>
            </div>
          )}

          {/* 3. กรณีเปลี่ยนรหัสผ่านสำเร็จ 100% */}
          {!isVerifying && !verifyError && isSuccess && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-2">ตั้งรหัสผ่านใหม่สำเร็จแล้ว!</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                ระบบได้อัปเดตรหัสผ่านใหม่สำหรับบัญชี <strong className="text-gray-900 font-semibold">{userEmail}</strong> เรียบร้อยแล้วค่ะ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
              </p>
              <Link
                to="/"
                className="w-full py-3.5 px-4 bg-linear-to-r from-[#0870B8] to-[#0A85D9] hover:from-[#065a96] hover:to-[#0870B8] text-white rounded-md font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                เข้าสู่ระบบและเริ่มช้อปปิ้ง <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {/* 4. ฟอร์มกรอกรหัสผ่านใหม่ (เมื่อ Token ถูกต้อง) */}
          {!isVerifying && !verifyError && !isSuccess && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
                  <KeyRound className="w-8 h-8 text-[#0870B8]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">ตั้งรหัสผ่านใหม่</h2>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-[2px] text-xs font-medium">
                  <span>บัญชี:</span>
                  <span className="font-semibold text-slate-900">{userEmail}</span>
                </div>
              </div>

              {submitError && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-[2px] flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* รหัสผ่านใหม่ */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">รหัสผ่านใหม่</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (submitError) setSubmitError('');
                      }}
                      className="block w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-800 text-sm"
                      placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                      required
                      minLength={6}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* ยืนยันรหัสผ่านใหม่ */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (submitError) setSubmitError('');
                      }}
                      className="block w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-[2px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white text-gray-800 text-sm"
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้งให้ตรงกัน"
                      required
                      minLength={6}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !password || !confirmPassword}
                  className="w-full mt-6 py-3.5 px-4 bg-linear-to-r from-[#0870B8] to-[#0A85D9] hover:from-[#065a96] hover:to-[#0870B8] text-white rounded-md font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>กำลังบันทึกรหัสผ่านใหม่...</span>
                    </>
                  ) : (
                    <>
                      <span>บันทึกรหัสผ่านใหม่</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Security info footer */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col items-center justify-center gap-1.5 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-slate-600">ระบบรักษาความปลอดภัยระดับมาตรฐานสากล</span>
                </div>
                <p>DH Service Hub Security Protection</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
