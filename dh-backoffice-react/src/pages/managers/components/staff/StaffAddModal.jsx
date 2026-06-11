import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../../../firebase/config';
import { userService } from '../../../../firebase/userService';
import { Users, Search, X, UserPlus, Mail } from 'lucide-react';

const ROLES = ['Admin', 'Manager', 'Staff', 'Packer', 'Developer'];

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

export default function StaffAddModal({ showAddModal, setShowAddModal, showToast, fetchStaff }) {
  const [addSearchKeyword, setAddSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchNewStaff = async () => {
    if (!addSearchKeyword.trim()) return;
    setIsSearching(true);
    try {
      const usersRef = collection(db, getCollectionPath('users'));
      let snapshot = await getDocs(usersRef);

      const results = [];
      const keyword = addSearchKeyword.toLowerCase().trim();

      snapshot.forEach(doc => {
        const data = doc.data();
        if ((data.email && data.email.toLowerCase().includes(keyword)) ||
            (data.phone && data.phone.includes(keyword)) ||
            (data.displayName && data.displayName.toLowerCase().includes(keyword))) {
          
          const currentRole = String(data.role || (data.roles && data.roles[0]) || '').toLowerCase();
          if (!['admin', 'manager', 'staff', 'packer', 'developer'].includes(currentRole)) {
            results.push({ id: doc.id, ...data });
          }
        }
      });
      setSearchResults(results);
    } catch (error) {
      console.error(error);
      showToast('error', 'เกิดข้อผิดพลาดในการค้นหาผู้ใช้');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePromoteToStaff = async (uid, role) => {
    try {
      await userService.updateUserRole(uid, uid, role); // Assuming current user is admin, here we just pass uid for simplicity or adapt if adminId is needed
      
      try {
        const userRef = doc(db, getCollectionPath('users'), uid);
        await updateDoc(userRef, { 
          isStaff: true, 
          isActive: true, 
          role: role,
          roles: [role.charAt(0).toUpperCase() + role.slice(1)]
        });
      } catch(e) { console.error("Force update isStaff failed", e); }

      showToast('success', 'แต่งตั้งสำเร็จ (เปิดสิทธิ์การเข้าสู่ระบบเรียบร้อย)');
      setShowAddModal(false);
      setAddSearchKeyword('');
      setSearchResults([]);
      fetchStaff(); 
    } catch (error) {
      showToast('error', 'ไม่สามารถแต่งตั้งได้');
    }
  };

  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-2xl w-full border border-slate-200/50 dark:border-slate-700/50 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/50">
                <UserPlus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">แต่งตั้งพนักงานใหม่</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">ค้นหาบัญชีผู้ใช้ในระบบเพื่อเลื่อนขั้นเป็นพนักงาน</p>
              </div>
          </div>
          <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 sm:p-8 flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="พิมพ์อีเมล เบอร์โทร หรือชื่อผู้ใช้..." 
                value={addSearchKeyword}
                onChange={(e) => setAddSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchNewStaff()}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-inner"
                />
            </div>
            <button 
                onClick={handleSearchNewStaff}
                disabled={isSearching}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-indigo-500/20 whitespace-nowrap"
            >
                {isSearching ? 'กำลังค้นหา...' : 'ค้นหาบัญชี'}
            </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700/80 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 p-2 sm:p-4">
            {searchResults.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Search size={48} className="mb-4 opacity-20" strokeWidth={1} />
                <p className="font-medium text-sm">ไม่พบข้อมูลการค้นหา หรือบัญชีนี้เป็นพนักงานอยู่แล้ว</p>
                </div>
            ) : (
                <div className="space-y-3">
                {searchResults.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                        {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                        ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                            <Users size={20} className="text-slate-500" />
                        </div>
                        )}
                        <div>
                        <p className="font-bold text-slate-900 dark:text-white text-base">{user.displayName || 'ไม่มีชื่อแสดง'}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={12}/> {user.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <select 
                        id={`role-select-${user.id}`}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white flex-1 sm:w-36 cursor-pointer"
                        >
                        {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                        </select>
                        <button 
                        onClick={() => {
                            const selectedRole = document.getElementById(`role-select-${user.id}`).value;
                            handlePromoteToStaff(user.id, selectedRole);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 shadow-sm shadow-emerald-500/20 active:scale-95"
                        >
                        แต่งตั้ง
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}
