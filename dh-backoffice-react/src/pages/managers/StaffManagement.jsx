import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, ShieldAlert, ShieldCheck, 
  Edit, UserX, UserCheck, Mail, AlertCircle, 
  CheckCircle2, Trash2, UserPlus, Eye, EyeOff, X, Phone,
  ArrowLeft, Activity, BarChart, TrendingUp, CalendarDays,
  Target, Star, Clock, User, Briefcase
} from 'lucide-react';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const SUPER_ADMINS = ['dh1notebook@gmail.com', 'zhoulinjuan1@gmail.com', 'dh2notebook@gmail.com'];
const ROLES = ['Admin', 'Manager', 'Staff', 'Packer', 'Developer'];

// Helper สำหรับดึง Path ฐานข้อมูล
const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

export default function StaffManagement() {
  const navigate = useNavigate();

  // Main States
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showSuspended, setShowSuspended] = useState(false);
  
  // UX/UI States
  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);
  
  // Edit & View Modal States
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null); 
  
  // Add Staff Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearchKeyword, setAddSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllStaff();
      const sortedData = data.sort((a, b) => {
        if (SUPER_ADMINS.includes(a.email)) return -1;
        if (SUPER_ADMINS.includes(b.email)) return 1;
        return 0;
      });
      setStaffList(sortedData);
    } catch (error) {
      showToast('error', 'ไม่สามารถดึงข้อมูลพนักงานได้');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (title, desc, actionFn, isDanger = false) => {
    setModalConfig({
      isOpen: true,
      title,
      desc,
      action: actionFn,
      type: isDanger ? 'danger' : 'warning'
    });
  };
  const closeModal = () => setModalConfig(null);

  // --- Core Actions ---
  const handleRoleChange = async (uid, newRole, email) => {
    if (SUPER_ADMINS.includes(email)) {
      return showToast('error', 'ไม่อนุญาตให้เปลี่ยนสิทธิ์ของเจ้าของระบบ');
    }
    openModal(
      'ยืนยันการปรับเปลี่ยนตำแหน่ง',
      `คุณต้องการเปลี่ยนตำแหน่งของ ${email} เป็น ${newRole} ใช่หรือไม่?`,
      async () => {
        try {
          await userService.updateUserRole(uid, newRole);
          
          // 🛡️ บังคับยัดค่า isStaff = true ให้ฐานข้อมูลตรงๆ
          try {
            const userRef = doc(db, getCollectionPath('users'), uid);
            await updateDoc(userRef, { isStaff: true, isActive: true });
          } catch(e) { console.error("Force update isStaff failed", e); }
          
          setStaffList(prev => prev.map(staff => 
            staff.id === uid ? { ...staff, role: newRole, computedRole: newRole.toLowerCase(), roles: [newRole], isStaff: true } : staff
          ));
          showToast('success', 'อัปเดตตำแหน่งสำเร็จ');
        } catch (error) {
          showToast('error', 'เกิดข้อผิดพลาดในการอัปเดตตำแหน่ง');
        }
      }
    );
  };

  const handleToggleStatus = async (uid, currentStatus, email) => {
    if (SUPER_ADMINS.includes(email)) {
      return showToast('error', 'ไม่อนุญาตให้ระงับการใช้งานเจ้าของระบบ');
    }
    const isSuspending = currentStatus === true;
    const actionText = isSuspending ? 'ระงับการใช้งาน' : 'ปลดแบน/คืนสิทธิ์';
    
    openModal(
      `ยืนยันการ${actionText}`,
      `คุณแน่ใจหรือไม่ที่จะ${actionText}บัญชี ${email}?`,
      async () => {
        try {
          if (isSuspending) {
            await userService.suspendUser(uid);
          } else {
            await userService.restoreUser(uid);
          }
          setStaffList(prev => prev.map(staff => 
            staff.id === uid ? { ...staff, isActive: !isSuspending } : staff
          ));
          showToast('success', `ดำเนินการ${actionText}สำเร็จ`);
        } catch (error) {
          showToast('error', `ไม่สามารถ${actionText}ได้`);
        }
      },
      isSuspending
    );
  };

  const handleDeleteStaff = (uid, email) => {
    if (SUPER_ADMINS.includes(email)) {
      return showToast('error', 'ไม่อนุญาตให้ลบเจ้าของระบบ');
    }
    openModal(
      'ยืนยันการลบพนักงาน',
      `คำเตือน: คุณกำลังจะลบ ${email} ออกจากระบบ ข้อมูลนี้จะไม่สามารถกู้คืนได้ ยืนยันหรือไม่?`,
      async () => {
        try {
          await userService.deleteUser(uid);
          setStaffList(prev => prev.filter(staff => staff.id !== uid));
          showToast('success', 'ลบพนักงานสำเร็จ');
        } catch (error) {
          showToast('error', 'ลบพนักงานล้มเหลว');
        }
      },
      true 
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        firstName: editingStaff.firstName || '',
        lastName: editingStaff.lastName || '',
        phone: editingStaff.phone || '',
        gender: editingStaff.gender || 'unspecified',
        startDate: editingStaff.startDate || '',
        // ผสานชื่อให้ฉลาดขึ้น
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

  // --- Add Staff Actions ---
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
          // หาเฉพาะคนที่ยังไม่ได้เป็นพนักงาน
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
      await userService.updateUserRole(uid, role);
      
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

  // --- Derived Data ---
  const filteredStaff = staffList.filter(staff => {
    if (!showSuspended && !staff.isActive) return false;
    
    const matchesSearch = 
      (staff.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.displayName || staff.firstName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const staffRole = staff.computedRole || staff.role || (staff.roles ? staff.roles[0] : '');
    const matchesRole = roleFilter === 'all' || 
      (staffRole && staffRole.toLowerCase() === roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 relative h-full overflow-y-auto custom-scrollbar">
      
      {/* 🔙 ปุ่มย้อนกลับ */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/managers')} 
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors w-fit group"
        >
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          ย้อนกลับไปหน้าผู้จัดการ (Overview)
        </button>
      </div>

      {/* 🟢 Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in-down border backdrop-blur-md ${
          toast.type === 'success' 
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/80 dark:border-emerald-700/50 dark:text-emerald-300' 
            : 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/80 dark:border-red-700/50 dark:text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* 🔴 Custom Confirmation Modal */}
      {modalConfig && modalConfig.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 border border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-8">
              <div className={`p-4 rounded-2xl shrink-0 shadow-inner ${
                modalConfig.type === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
              }`}>
                <AlertCircle size={28} strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">{modalConfig.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{modalConfig.desc}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => { modalConfig.action(); closeModal(); }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all active:scale-95 ${
                  modalConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                }`}
              >
                ยืนยันดำเนินการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Add Staff Modal (ค้นหาและแต่งตั้ง) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-2xl w-full border border-slate-200/50 dark:border-slate-700/50 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
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
      )}

      {/* 🔵 Edit Profile Modal (อัปเกรดให้ครอบคลุมข้อมูลใหม่) */}
      {editingStaff && (
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
      )}

      {/* 🌟 View Details & KPI Modal (ระบบดูรายละเอียดแบบฉบับเต็ม Enterprise) 🌟 */}
      {viewingStaff && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[90vh] animate-in zoom-in-95 relative">
            
            {/* Header Cover สีไล่ระดับแบบ Luxury */}
            <div className="h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <button onClick={() => setViewingStaff(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm transition-colors z-10">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="px-6 sm:px-8 pb-8 pt-0 relative flex-1 overflow-y-auto custom-scrollbar">
              {/* Profile Image & Basic Info */}
              <div className="flex flex-col items-center -mt-16 mb-6">
                <div className="w-32 h-32 rounded-[2rem] border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-xl shadow-indigo-500/10 flex items-center justify-center overflow-hidden mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                  {viewingStaff.photoURL ? (
                    <img src={viewingStaff.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={48} className="text-indigo-300" strokeWidth={1.5} />
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center">
                  {viewingStaff.displayName || viewingStaff.firstName || 'ไม่ระบุชื่อ'}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                  <Mail size={14}/> {viewingStaff.email}
                </p>
                <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
                    {viewingStaff.role || viewingStaff.computedRole || 'Staff'}
                    </span>
                    {SUPER_ADMINS.includes(viewingStaff.email) && (
                        <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm gap-1">
                            <ShieldAlert size={14} /> Owner
                        </span>
                    )}
                </div>
              </div>

              {/* General Info Grid (ข้อมูลครบถ้วน) */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Phone size={12}/> เบอร์ติดต่อ</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{viewingStaff.phone || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><User size={12}/> เพศ</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {viewingStaff.gender === 'male' ? 'ชาย' : viewingStaff.gender === 'female' ? 'หญิง' : 'ไม่ระบุ'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar size={12}/> เริ่มงาน</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{viewingStaff.startDate || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><ShieldCheck size={12}/> สถานะบัญชี</p>
                    <p className={`text-sm font-bold flex items-center gap-1.5 ${viewingStaff.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${viewingStaff.isActive ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                      {viewingStaff.isActive ? 'ปกติ' : 'ถูกระงับ'}
                    </p>
                  </div>
                </div>

                {/* 🌟 KPI Section (โครงสร้างรองรับอนาคต) */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                      <Activity className="text-indigo-500" size={18}/> ประสิทธิภาพการทำงาน (KPI)
                    </h3>
                    <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Coming Soon</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 relative">
                    {/* Placeholder Overaly เพื่อบอกว่ายังเป็นแค่การเตรียมโครงสร้าง */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[3px] rounded-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:opacity-0 cursor-crosshair">
                       <BarChart className="text-indigo-600 mb-2" size={32} strokeWidth={1.5} />
                       <p className="text-sm font-black text-slate-800 dark:text-slate-100">ระบบประเมินผล KPI</p>
                       <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 text-center px-4 font-medium">สถิติการทำงานรายบุคคล จะเปิดใช้งานในเฟสถัดไป<br/><span className="text-[10px] opacity-70">(เอาเมาส์ชี้เพื่อดูตัวอย่างดีไซน์)</span></p>
                    </div>

                    {/* Dummy Data */}
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 text-indigo-500/5 rotate-12"><Target size={80}/></div>
                      <Target className="mx-auto mb-2 text-indigo-400 relative z-10" size={24} strokeWidth={1.5}/>
                      <p className="text-[11px] font-bold text-slate-500 relative z-10 uppercase">บิลที่ดูแลสำเร็จ</p>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 relative z-10">124 <span className="text-[11px] text-emerald-500 font-bold ml-1">+12%</span></p>
                    </div>
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 text-amber-500/5 rotate-12"><Star size={80}/></div>
                      <Star className="mx-auto mb-2 text-amber-400 relative z-10" size={24} strokeWidth={1.5}/>
                      <p className="text-[11px] font-bold text-slate-500 relative z-10 uppercase">ความพึงพอใจ</p>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-200 mt-1 relative z-10">4.8 <span className="text-[11px] text-slate-400 font-bold ml-1">/ 5.0</span></p>
                    </div>
                    <div className="col-span-2 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-inner"><Clock size={20}/></div>
                        <div className="text-left">
                          <p className="text-[11px] font-bold text-slate-500 uppercase">เวลาตอบสนองเฉลี่ย (SLA)</p>
                          <p className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight">14 นาที 20 วินาที</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-bold shadow-sm">ระดับดีเยี่ยม</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
               <Users size={24} />
            </div>
            ทะเบียนเจ้าหน้าที่ (Staff Management)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
            เพิ่มพนักงานใหม่, ดูประวัติและข้อมูลการทำงาน, อัปเดตตำแหน่ง และจัดการสถานะบัญชีอย่างครบวงจร
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
        >
          <UserPlus size={18} strokeWidth={2.5} /> แต่งตั้งพนักงานใหม่
        </button>
      </div>

      {/* Toolbar: Search, Filters, Toggles */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาด้วยชื่อ หรือ อีเมลพนักงาน..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:w-56 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Briefcase className="text-indigo-500 shrink-0" size={16} />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-1.5 bg-transparent text-sm font-bold focus:outline-none dark:text-white cursor-pointer"
            >
              <option value="all">ทุกตำแหน่ง (All Roles)</option>
              <option value="owner">Owner (เจ้าของ)</option>
              {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
            </select>
          </div>
          
          <button
            onClick={() => setShowSuspended(!showSuspended)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shrink-0 w-full sm:w-auto ${
              showSuspended 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-sm' 
                : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {showSuspended ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
            <span>บัญชีที่ถูกแบน</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th className="px-6 py-5">ข้อมูลพนักงาน</th>
                <th className="px-6 py-5 text-center">ตำแหน่งปัจจุบัน (Role)</th>
                <th className="px-6 py-5 text-center">สถานะสิทธิ์เข้าถึง</th>
                <th className="px-6 py-5 text-right pr-8">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                // Loading Skeleton
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5 flex gap-4 items-center">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-32"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-48"></div>
                        </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-32 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-24 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-32 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-slate-500 dark:text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                        <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="font-bold text-lg text-slate-700 dark:text-slate-300">ไม่พบรายชื่อพนักงาน</p>
                    <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มพนักงานใหม่เข้าสู่ระบบ</p>
                  </td>
                </tr>
              ) : (
                // Data Rows
                filteredStaff.map((staff) => {
                  const isSuperAdmin = SUPER_ADMINS.includes(staff.email);
                  const displayRole = staff.role || (staff.roles && staff.roles[0]) || staff.computedRole || 'Staff';
                  const staffName = staff.displayName || staff.firstName || 'ไม่ระบุชื่อ';
                  
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      {/* Name & Email */}
                      <td className="px-6 py-4 cursor-pointer" onClick={() => setViewingStaff(staff)} title="คลิกเพื่อดูรายละเอียดและประวัติย้อนหลัง">
                        <div className="flex items-center gap-4">
                          {staff.photoURL ? (
                            <img src={staff.photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white dark:border-slate-800 shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-100 dark:border-indigo-800 shadow-sm text-lg">
                              {staffName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-[15px]">
                              {staffName}
                              {isSuperAdmin && <ShieldAlert size={14} className="text-amber-500" title="Super Admin / Owner" strokeWidth={3} />}
                            </div>
                            <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                <Mail size={12}/> {staff.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Select */}
                      <td className="px-6 py-4 text-center">
                        {isSuperAdmin ? (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm">
                              <ShieldCheck size={14} strokeWidth={2.5}/> Owner
                           </span>
                        ) : (
                          <div className="relative inline-block w-40">
                            <select
                                value={displayRole.toLowerCase()}
                                onChange={(e) => handleRoleChange(staff.id, e.target.value, staff.email)}
                                className={`w-full appearance-none pl-4 pr-8 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm transition-all text-center ${
                                displayRole.toLowerCase() === 'admin' ? 'text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20' :
                                displayRole.toLowerCase() === 'manager' ? 'text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20' :
                                'text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border min-w-[100px] ${
                          staff.isActive 
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                            : 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          {staff.isActive ? 'ปกติ (Active)' : 'ระงับการใช้งาน'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          
                          <button
                            onClick={() => setViewingStaff(staff)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                            title="ดูรายละเอียด/KPI"
                          >
                            <Eye size={18} strokeWidth={2.5}/>
                          </button>

                          {isSuperAdmin ? (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 rounded-xl">
                              Protected
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingStaff(staff)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                                title="แก้ไขข้อมูลส่วนตัว"
                              >
                                <Edit size={18} strokeWidth={2.5}/>
                              </button>
                              <button
                                onClick={() => handleToggleStatus(staff.id, staff.isActive, staff.email)}
                                className={`p-2 rounded-xl transition-all shadow-sm border border-transparent ${
                                  staff.isActive 
                                    ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-500/20 dark:hover:border-amber-800' 
                                    : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-800'
                                }`}
                                title={staff.isActive ? "ระงับบัญชี" : "ปลดแบนคืนสิทธิ์"}
                              >
                                {staff.isActive ? <UserX size={18} strokeWidth={2.5}/> : <UserCheck size={18} strokeWidth={2.5}/>}
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff.id, staff.email)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                title="ลบพนักงาน"
                              >
                                <Trash2 size={18} strokeWidth={2.5}/>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}