import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'; // เพิ่ม doc, updateDoc สำหรับ Force Update
import { db } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, ShieldAlert, ShieldCheck, 
  Edit, UserX, UserCheck, Mail, AlertCircle, 
  CheckCircle2, Trash2, UserPlus, Eye, EyeOff, X, Phone,
  ArrowLeft, Activity, BarChart, TrendingUp, CalendarDays,
  Target, Star, Clock // ไอคอนเพิ่มเติมสำหรับ KPI
} from 'lucide-react';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const SUPER_ADMINS = ['dh1notebook@gmail.com', 'zhoulinjuan1@gmail.com'];
const ROLES = ['Admin', 'Manager', 'Staff', 'Packer', 'Developer'];

// Helper สำหรับดึง Path ฐานข้อมูลให้ถูกต้องตรงกับเวอร์ชันปัจจุบัน
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
  const [viewingStaff, setViewingStaff] = useState(null); // สำหรับดูรายละเอียด & KPI
  
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
          // อัปเดต Role
          await userService.updateUserRole(uid, newRole);
          
          // 🛡️ แก้บั๊กหน้า Login: บังคับยัดค่า isStaff = true ให้ฐานข้อมูลตรงๆ ป้องกันปัญหาจาก Service
          try {
            const userRef = doc(db, getCollectionPath('users'), uid);
            await updateDoc(userRef, { isStaff: true, isActive: true });
          } catch(e) { console.error("Force update isStaff failed", e); }
          
          setStaffList(prev => prev.map(staff => 
            staff.id === uid ? { ...staff, role: newRole, computedRole: newRole.toLowerCase(), roles: [newRole], isStaff: true } : staff
          ));
          showToast('success', 'อัปเดตตำแหน่งสำเร็จ (สิทธิ์การเข้าสู่ระบบถูกเปิดแล้ว)');
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
      if (userService.updateUserProfile) {
        await userService.updateUserProfile(editingStaff.id, {
          firstName: editingStaff.firstName || '',
          lastName: editingStaff.lastName || '',
          phone: editingStaff.phone || '',
          displayName: editingStaff.firstName ? `${editingStaff.firstName} ${editingStaff.lastName || ''}`.trim() : editingStaff.displayName
        });
      } else {
        // Fallback หากไม่มีฟังก์ชัน updateUserProfile
        const userRef = doc(db, getCollectionPath('users'), editingStaff.id);
        await updateDoc(userRef, {
          firstName: editingStaff.firstName || '',
          lastName: editingStaff.lastName || '',
          phone: editingStaff.phone || '',
          displayName: editingStaff.firstName ? `${editingStaff.firstName} ${editingStaff.lastName || ''}`.trim() : editingStaff.displayName
        });
      }
      
      setStaffList(prev => prev.map(staff => 
        staff.id === editingStaff.id ? { ...staff, ...editingStaff } : staff
      ));
      setEditingStaff(null);
      showToast('success', 'บันทึกข้อมูลส่วนตัวสำเร็จ');
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
      // 1. เรียก Service เพื่ออัปเดต Role
      await userService.updateUserRole(uid, role);
      
      // 2. 🛡️ แก้บั๊กหน้า Login (บังคับยัดลงฐานข้อมูลให้ชัวร์ที่สุด)
      try {
        const userRef = doc(db, getCollectionPath('users'), uid);
        await updateDoc(userRef, { 
          isStaff: true, 
          isActive: true, 
          role: role,
          roles: [role.charAt(0).toUpperCase() + role.slice(1)]
        });
      } catch(e) { console.error("Force update isStaff failed", e); }

      showToast('success', 'แต่งตั้งสำเร็จ (เปิดสิทธิ์การเข้าสู่ระบบเรียบร้อย 100%)');
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative h-full overflow-y-auto custom-scrollbar">
      
      {/* 🔙 ปุ่มย้อนกลับ (ปรับแต่งให้สวยงามเข้าธีม) */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/managers')} 
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors w-fit group"
        >
          <div className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          ย้อนกลับไปหน้าผู้จัดการ (Overview)
        </button>
      </div>

      {/* 🟢 Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl animate-fade-in-down border ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* 🔴 Custom Confirmation Modal */}
      {modalConfig && modalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up border border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-full shrink-0 ${
                modalConfig.type === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
              }`}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{modalConfig.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{modalConfig.desc}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => { modalConfig.action(); closeModal(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  modalConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                ยืนยันดำเนินการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="text-blue-600 dark:text-blue-400" /> แต่งตั้งพนักงานใหม่
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="ค้นหาด้วยอีเมล เบอร์โทร หรือชื่อผู้ใช้..." 
                  value={addSearchKeyword}
                  onChange={(e) => setAddSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchNewStaff()}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>
              <button 
                onClick={handleSearchNewStaff}
                disabled={isSearching}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSearching ? 'กำลังค้นหา...' : 'ค้นหาบัญชี'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-2">
              {searchResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <Search size={40} className="mb-3 opacity-20" />
                  <p>ค้นหาบัญชีผู้ใช้งานเพื่อแต่งตั้งขึ้นเป็นพนักงาน</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <Users size={18} className="text-slate-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{user.displayName || 'No Name'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select 
                          id={`role-select-${user.id}`}
                          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white flex-1 sm:w-32"
                        >
                          {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                        </select>
                        <button 
                          onClick={() => {
                            const selectedRole = document.getElementById(`role-select-${user.id}`).value;
                            handlePromoteToStaff(user.id, selectedRole);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shrink-0 shadow-sm"
                        >
                          แต่งตั้งทันที
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔵 Edit Profile Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="text-blue-600 dark:text-blue-400" size={20} /> แก้ไขข้อมูลพนักงาน
              </h2>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ชื่อ (First Name)</label>
                <input 
                  type="text" 
                  value={editingStaff.firstName || ''}
                  onChange={e => setEditingStaff({...editingStaff, firstName: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">นามสกุล (Last Name)</label>
                <input 
                  type="text" 
                  value={editingStaff.lastName || ''}
                  onChange={e => setEditingStaff({...editingStaff, lastName: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                  <Phone size={14} /> เบอร์โทรศัพท์
                </label>
                <input 
                  type="tel" 
                  value={editingStaff.phone || ''}
                  onChange={e => setEditingStaff({...editingStaff, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 View Details & KPI Modal (ระบบดูรายละเอียดใหม่) 🌟 */}
      {viewingStaff && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Header Cover สีไล่ระดับ */}
            <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
               <button onClick={() => setViewingStaff(null)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pb-6 pt-0 relative flex-1 overflow-y-auto custom-scrollbar">
              {/* Profile Image & Basic Info */}
              <div className="flex flex-col items-center -mt-14 mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 shadow-md flex items-center justify-center overflow-hidden mb-3">
                  {viewingStaff.photoURL ? (
                    <img src={viewingStaff.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={40} className="text-slate-400" />
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {viewingStaff.displayName || viewingStaff.firstName || 'ไม่ระบุชื่อ'}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail size={14}/> {viewingStaff.email}
                </p>
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-sm">
                  {viewingStaff.role || viewingStaff.computedRole || 'Staff'}
                </div>
              </div>

              {/* General Info Grid */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Phone size={12}/> เบอร์ติดต่อ</p>
                    <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">{viewingStaff.phone || 'ไม่มีข้อมูล'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><CalendarDays size={12}/> สถานะบัญชี</p>
                    <p className={`text-[15px] font-semibold flex items-center gap-1.5 ${viewingStaff.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${viewingStaff.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      {viewingStaff.isActive ? 'Active (ปกติ)' : 'Suspended (ระงับ)'}
                    </p>
                  </div>
                </div>

                {/* 🌟 KPI Section (โครงสร้างรองรับอนาคต) 🌟 */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                      <Activity className="text-blue-500" size={18}/> ประสิทธิภาพการทำงาน (KPI)
                    </h3>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Coming Soon</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 relative">
                    {/* Placeholder Overaly เพื่อบอกว่ายังเป็นแค่การเตรียมโครงสร้าง */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-[2px] rounded-xl border border-slate-200 dark:border-slate-700 transition-opacity hover:opacity-0 cursor-crosshair">
                       <BarChart className="text-blue-600 mb-2" size={28}/>
                       <p className="text-xs font-bold text-slate-800 dark:text-slate-200">ระบบประเมินผล KPI</p>
                       <p className="text-[10px] text-slate-500 mt-1 text-center px-4 font-medium">สถิติการทำงานรายบุคคล จะเปิดใช้งานในเฟสถัดไป (เอาเมาส์ชี้เพื่อดูตัวอย่าง)</p>
                    </div>

                    {/* Dummy Data (โครงสร้าง) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                      <Target className="mx-auto mb-2 text-indigo-400" size={22}/>
                      <p className="text-xs font-bold text-slate-500">บิลที่ดูแลรับผิดชอบ</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">124 <span className="text-[10px] text-emerald-500 font-bold">+12%</span></p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                      <Star className="mx-auto mb-2 text-amber-400" size={22}/>
                      <p className="text-xs font-bold text-slate-500">คะแนนความพึงพอใจ</p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">4.8 <span className="text-[10px] text-slate-400 font-bold">/ 5.0</span></p>
                    </div>
                    <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Clock size={18}/></div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-500">เวลาตอบสนองเฉลี่ย (SLA)</p>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-300">14 นาที 20 วินาที</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-1 rounded font-bold">ยอดเยี่ยม</span>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-blue-600 dark:text-blue-400" />
            การจัดการเจ้าหน้าที่ (Staff Management)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            เพิ่มพนักงาน, ดูประวัติการทำงาน(KPI), แก้ไขข้อมูล และสถานะบัญชี
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors active:scale-95 shrink-0"
        >
          <UserPlus size={18} /> เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* Toolbar: Search, Filters, Toggles */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาด้วยชื่อ หรือ อีเมล..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-shadow"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:w-48">
            <ShieldCheck className="text-slate-400 shrink-0" size={18} />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white cursor-pointer"
            >
              <option value="all">ทุกตำแหน่ง (All Roles)</option>
              <option value="owner">Owner (เจ้าของ)</option>
              {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
            </select>
          </div>
          
          {/* Toggle Show Suspended */}
          <button
            onClick={() => setShowSuspended(!showSuspended)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors shrink-0 ${
              showSuspended 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
            }`}
          >
            {showSuspended ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="hidden sm:inline">บัญชีที่ถูกแบน</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-6 py-4 font-bold">เจ้าหน้าที่</th>
                <th className="px-6 py-4 font-bold text-center">ตำแหน่ง (Role)</th>
                <th className="px-6 py-4 font-bold text-center">สถานะบัญชี</th>
                <th className="px-6 py-4 font-bold text-right pr-8">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                // Loading Skeleton
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-24 mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-20 mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredStaff.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium">ไม่พบเจ้าหน้าที่ในระบบ</p>
                  </td>
                </tr>
              ) : (
                // Data Rows
                filteredStaff.map((staff) => {
                  const isSuperAdmin = SUPER_ADMINS.includes(staff.email);
                  const displayRole = staff.role || (staff.roles && staff.roles[0]) || staff.computedRole || 'Staff';
                  
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                      {/* Name & Email */}
                      <td className="px-6 py-4 cursor-pointer" onClick={() => setViewingStaff(staff)} title="คลิกเพื่อดูรายละเอียดและ KPI">
                        <div className="flex items-center gap-3">
                          {staff.photoURL ? (
                            <img src={staff.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                              {staff.displayName ? staff.displayName.charAt(0).toUpperCase() : <Mail size={16}/>}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {staff.displayName || staff.firstName || 'ไม่ระบุชื่อ'}
                              {isSuperAdmin && <ShieldAlert size={14} className="text-amber-500" title="Super Admin" />}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Select */}
                      <td className="px-6 py-4 text-center">
                        {isSuperAdmin ? (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm">
                             Owner
                           </span>
                        ) : (
                          <select
                            value={displayRole.toLowerCase()}
                            onChange={(e) => handleRoleChange(staff.id, e.target.value, staff.email)}
                            className={`px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-black uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm ${
                              displayRole.toLowerCase() === 'admin' ? 'text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800' :
                              displayRole.toLowerCase() === 'manager' ? 'text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800' :
                              'text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                          </select>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm border ${
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
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          
                          {/* 👁️ ดูรายละเอียด KPI */}
                          <button
                            onClick={() => setViewingStaff(staff)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                            title="ดูรายละเอียด/KPI"
                          >
                            <Eye size={18} />
                          </button>

                          {isSuperAdmin ? (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">
                              Protected
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingStaff(staff)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                                title="แก้ไขข้อมูลส่วนตัว"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(staff.id, staff.isActive, staff.email)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  staff.isActive 
                                    ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' 
                                    : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                }`}
                                title={staff.isActive ? "ระงับบัญชี" : "ปลดแบน"}
                              >
                                {staff.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(staff.id, staff.email)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                                title="ลบพนักงาน"
                              >
                                <Trash2 size={18} />
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