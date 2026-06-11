import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { userService } from '../../../../firebase/userService';
import { Edit, X, User, Calendar, Phone } from 'lucide-react';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

export default function StaffEditModal({ editingStaff, setEditingStaff, showToast, setStaffList }) {
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        firstName: editingStaff.firstName || '',
        lastName: editingStaff.lastName || '',
        phone: editingStaff.phone || '',
        gender: editingStaff.gender || 'unspecified',
        startDate: editingStaff.startDate || '',
        displayName: editingStaff.firstName 
            ? `${editingStaff.firstName} ${editingStaff.lastName || ''}`.trim() 
            : (editingStaff.displayName || '')
      };

      if (userService.updateUserProfile) {
        await userService.updateUserProfile(editingStaff.id, payload);
      } else {
        const userRef = doc(db, getCollectionPath('users'), editingStaff.id);
        await updateDoc(userRef, payload);
      }
      
      setStaffList(prev => prev.map(staff => 
        staff.id === editingStaff.id ? { ...staff, ...payload } : staff
      ));
      setEditingStaff(null);
      showToast('success', 'บันทึกข้อมูลพนักงานสำเร็จ');
    } catch (error) {
      showToast('error', 'บันทึกข้อมูลล้มเหลว');
    }
  };

  if (!editingStaff) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-md w-full border border-slate-200/50 dark:border-slate-700/50 overflow-hidden animate-in zoom-in-95">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit className="text-indigo-500" size={24} /> แก้ไขข้อมูลพนักงาน
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">อัปเดตข้อมูลส่วนตัวของ {editingStaff.email}</p>
            </div>
            <button onClick={() => setEditingStaff(null)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors">
                <X size={20} />
            </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">ชื่อจริง</label>
                    <input 
                        type="text" 
                        value={editingStaff.firstName || ''}
                        onChange={e => setEditingStaff({...editingStaff, firstName: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-inner"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">นามสกุล</label>
                    <input 
                        type="text" 
                        value={editingStaff.lastName || ''}
                        onChange={e => setEditingStaff({...editingStaff, lastName: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 flex items-center gap-1">
                        <User size={12}/> เพศ
                    </label>
                    <select 
                        value={editingStaff.gender || 'unspecified'}
                        onChange={e => setEditingStaff({...editingStaff, gender: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all cursor-pointer"
                    >
                        <option value="unspecified">ไม่ระบุ</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 flex items-center gap-1">
                        <Calendar size={12}/> วันเริ่มงาน
                    </label>
                    <input 
                        type="date" 
                        value={editingStaff.startDate || ''}
                        onChange={e => setEditingStaff({...editingStaff, startDate: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all text-slate-600 dark:text-slate-300"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 ml-1 flex items-center gap-1">
                <Phone size={12} /> เบอร์โทรศัพท์
                </label>
                <input 
                type="tel" 
                value={editingStaff.phone || ''}
                onChange={e => setEditingStaff({...editingStaff, phone: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-inner"
                />
            </div>
            
            <div className="pt-6 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button 
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                ยกเลิก
                </button>
                <button 
                type="submit"
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
                >
                บันทึกการเปลี่ยนแปลง
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
}
