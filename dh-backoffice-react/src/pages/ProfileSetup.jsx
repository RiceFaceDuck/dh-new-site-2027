import React, { useState } from 'react';
import { userService } from '../firebase/userService';
import { UserCircle, Loader2, Save, ShieldCheck } from 'lucide-react';

export default function ProfileSetup({ user, onComplete }) {
  // เช็คว่าเป็นอีเมลเจ้าของระบบหรือไม่
  const isOwner = user.email === 'dh1notebook@gmail.com';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    // ถ้าเป็นเจ้าของ ล็อคตำแหน่งไว้เลย ถ้าไม่ใช่ ค่าเริ่มต้นคือ Admin ฝ่ายขาย
    role: isOwner ? 'เจ้าของ' : 'Admin ฝ่ายขาย',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✨ เพิ่ม userType และ isApproved เพื่อบังคับ State เข้าสู่ระบบ Guard Layer ทันที
      const profileData = {
        email: user.email,
        firstName: form.firstName,
        lastName: form.lastName,
        nickname: form.nickname,
        role: form.role,
        photoURL: user.photoURL || '',
        userType: 'staff',
        isApproved: false
      };
      
      // บันทึกลงฐานข้อมูล Firestore
      await userService.createUserProfile(user.uid, profileData);
      
      // ส่งข้อมูลกลับไปให้ App.jsx เพื่อปลดล็อคเข้าสู่ระบบ (หรือเข้าหน้ารออนุมัติ)
      onComplete(profileData);
    } catch (error) {
      console.error("Setup Profile Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg p-1">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserCircle size={40} className="text-blue-200" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">ยินดีต้อนรับสู่ DH Notebook</h2>
            <p className="text-blue-100 text-sm">กรุณาระบุข้อมูลพนักงานสำหรับการเข้าใช้งานครั้งแรก</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
            <ShieldCheck className="text-blue-600 shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold text-gray-800">บัญชีผู้ใช้: {user.email}</p>
              {isOwner && <p className="text-xs text-blue-700 mt-0.5">สถานะ: เจ้าของระบบ (สิทธิ์สูงสุด)</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อจริง *</label>
              <input type="text" name="firstName" required value={form.firstName} onChange={handleChange}
                placeholder="สมชาย"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">นามสกุล *</label>
              <input type="text" name="lastName" required value={form.lastName} onChange={handleChange}
                placeholder="รักดี"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อเล่น *</label>
            <input type="text" name="nickname" required value={form.nickname} onChange={handleChange}
              placeholder="เช่น บอย, นัท"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ตำแหน่งหน้าที่ *</label>
            {isOwner ? (
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-bold flex items-center cursor-not-allowed opacity-80">
                {form.role}
              </div>
            ) : (
              <select name="role" required value={form.role} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-gray-700">
                <option value="Admin ฝ่ายขาย">Admin ฝ่ายขาย</option>
                <option value="จัดแพ็ค">จัดแพ็ค</option>
                <option value="การบัญชี">การบัญชี</option>
                <option value="ผู้จัดการ">ผู้จัดการ</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> บันทึกข้อมูลและเข้าสู่ระบบ</>}
          </button>
        </form>

      </div>
    </div>
  );
}