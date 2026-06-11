import React, { useState } from 'react';
import { Loader2, ChevronLeft, Briefcase } from 'lucide-react';

export default function RegisterForm({ 
    onSubmit, 
    onCancel, 
    loading, 
    statusText 
}) {
    const [regForm, setRegForm] = useState({
        firstName: '',
        lastName: '',
        nickname: '',
        gender: 'unspecified',
        age: '',
        startDate: '',
        position: 'staff'
    });

    const handleFormChange = (e) => {
        setRegForm({ ...regForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(regForm);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">ชื่อจริง *</label>
                    <input 
                        type="text" name="firstName" required
                        value={regForm.firstName} onChange={handleFormChange}
                        placeholder="เช่น สมชาย"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">นามสกุล *</label>
                    <input 
                        type="text" name="lastName" required
                        value={regForm.lastName} onChange={handleFormChange}
                        placeholder="เช่น รักดี"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">ชื่อเล่น *</label>
                    <input 
                        type="text" name="nickname" required
                        value={regForm.nickname} onChange={handleFormChange}
                        placeholder="เช่น บอย"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">อายุ (ปี) *</label>
                    <input 
                        type="number" name="age" required min="15" max="100"
                        value={regForm.age} onChange={handleFormChange}
                        placeholder="เช่น 25"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">เพศ</label>
                    <select name="gender" value={regForm.gender} onChange={handleFormChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all cursor-pointer">
                        <option value="unspecified">ไม่ระบุ</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">วันที่เริ่มงาน *</label>
                    <input 
                        type="date" name="startDate" required
                        value={regForm.startDate} onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-slate-600 dark:text-slate-300"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 ml-1">ตำแหน่งที่ต้องการสมัคร *</label>
                <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <select name="position" value={regForm.position} onChange={handleFormChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all cursor-pointer appearance-none">
                        <option value="staff">พนักงานทั่วไป (Staff)</option>
                        <option value="packer">พนักงานแพ็คสินค้า (Packer)</option>
                        <option value="manager">ผู้จัดการ (Manager)</option>
                        <option value="admin">แอดมินระบบ (Admin)</option>
                    </select>
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all ${loading ? 'opacity-70 pointer-events-none' : 'active:scale-[0.98]'}`}
            >
                {loading ? (
                    <><Loader2 size={20} className="animate-spin shrink-0" /><span className="text-sm">{statusText}</span></>
                ) : (
                    <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5 bg-white p-0.5 rounded-full" /><span className="text-sm tracking-wide">ยืนยันข้อมูลและผูกบัญชี Google</span></>
                )}
            </button>

            {!loading && (
                <button type="button" onClick={onCancel} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-4 flex items-center justify-center gap-1 transition-colors">
                    <ChevronLeft size={14} /> ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
                </button>
            )}
        </form>
    );
}
