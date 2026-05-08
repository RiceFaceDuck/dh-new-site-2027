import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { userService } from '../../firebase/userService';
import { 
  Users, Search, ShieldAlert, ShieldCheck, 
  Edit, UserX, UserCheck, Mail, AlertCircle, 
  CheckCircle2, Trash2, UserPlus, Eye, EyeOff, X, Phone
} from 'lucide-react';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const SUPER_ADMINS = ['dh1notebook@gmail.com', 'zhoulinjuan1@gmail.com'];
const ROLES = ['Admin', 'Manager', 'Staff', 'Packer', 'Developer'];

export default function StaffManagement() {
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
  
  // Edit Modal States
  const [editingStaff, setEditingStaff] = useState(null);
  
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
      // เรียงให้ Owner/Admin อยู่บนสุด
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
          setStaffList(prev => prev.map(staff => 
            staff.id === uid ? { ...staff, role: newRole, computedRole: newRole.toLowerCase(), roles: [newRole] } : staff
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
      true // danger
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await userService.updateUserProfile(editingStaff.id, {
        firstName: editingStaff.firstName || '',
        lastName: editingStaff.lastName || '',
        phone: editingStaff.phone || '',
        displayName: editingStaff.firstName ? `${editingStaff.firstName} ${editingStaff.lastName || ''}`.trim() : editingStaff.displayName
      });
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
      // ✅ แก้ไขให้ค้นหาจาก collection 'users' ตามฐานข้อมูลเดิม เพื่อให้เจอบัญชีที่เพิ่งสมัครเข้ามา
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const results = [];
      const keyword = addSearchKeyword.toLowerCase().trim();

      snapshot.forEach(doc => {
        const data = doc.data();
        if ((data.email && data.email.toLowerCase().includes(keyword)) ||
            (data.phone && data.phone.includes(keyword)) ||
            (data.displayName && data.displayName.toLowerCase().includes(keyword))) {
          
          // กรองพนักงานปัจจุบันออก (แสดงเฉพาะ Customer หรือคนยังไม่มียศ)
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
      await userService.updateUserRole(uid, role);
      showToast('success', 'แต่งตั้งพนักงานใหม่สำเร็จ');
      setShowAddModal(false);
      setAddSearchKeyword('');
      setSearchResults([]);
      fetchStaff(); // Refresh list
    } catch (error) {
      showToast('error', 'ไม่สามารถแต่งตั้งได้');
    }
  };

  // --- Derived Data ---
  const filteredStaff = staffList.filter(staff => {
    // 1. Status Filter
    if (!showSuspended && !staff.isActive) return false;
    
    // 2. Search Term Filter
    const matchesSearch = 
      (staff.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.displayName || staff.firstName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. Role Filter
    const staffRole = staff.computedRole || staff.role || (staff.roles ? staff.roles[0] : '');
    const matchesRole = roleFilter === 'all' || 
      (staffRole && staffRole.toLowerCase() === roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative h-full overflow-y-auto">
      
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
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSearching ? 'กำลังค้นหา...' : 'ค้นหา'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-2">
              {searchResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <Search size={40} className="mb-3 opacity-20" />
                  <p>ค้นหาผู้ใช้งานเพื่อเลื่อนขั้นเป็นพนักงาน</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <Users size={18} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{user.displayName || 'No Name'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select 
                          id={`role-select-${user.id}`}
                          className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white flex-1 sm:w-32"
                        >
                          {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                        </select>
                        <button 
                          onClick={() => {
                            const selectedRole = document.getElementById(`role-select-${user.id}`).value;
                            handlePromoteToStaff(user.id, selectedRole);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
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

      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-blue-600 dark:text-blue-400" />
            การจัดการเจ้าหน้าที่ (Staff Management)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            เพิ่มพนักงาน, แก้ไขข้อมูล, จัดการสิทธิ์ และสถานะบัญชี
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors active:scale-95 shrink-0"
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-shadow"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:w-48">
            <ShieldCheck className="text-slate-400 shrink-0" size={18} />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white cursor-pointer"
            >
              <option value="all">ทุกตำแหน่ง (All Roles)</option>
              <option value="owner">Owner (เจ้าของ)</option>
              {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
            </select>
          </div>
          
          {/* Toggle Show Suspended */}
          <button
            onClick={() => setShowSuspended(!showSuspended)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
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
                <th className="px-6 py-4 font-semibold">เจ้าหน้าที่</th>
                <th className="px-6 py-4 font-semibold text-center">ตำแหน่ง (Role)</th>
                <th className="px-6 py-4 font-semibold text-center">สถานะบัญชี</th>
                <th className="px-6 py-4 font-semibold text-right pr-8">จัดการ</th>
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
                    <p>ไม่พบเจ้าหน้าที่ในระบบ</p>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                            {staff.displayName ? staff.displayName.charAt(0).toUpperCase() : <Mail size={16}/>}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              {staff.displayName || staff.firstName || 'No Name'}
                              {isSuperAdmin && <ShieldAlert size={14} className="text-amber-500" title="Super Admin" />}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Select */}
                      <td className="px-6 py-4 text-center">
                        {isSuperAdmin ? (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                             Owner
                           </span>
                        ) : (
                          <select
                            value={displayRole.toLowerCase()}
                            onChange={(e) => handleRoleChange(staff.id, e.target.value, staff.email)}
                            className={`px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
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
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                          staff.isActive 
                            ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' 
                            : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          {staff.isActive ? 'ปกติ (Active)' : 'ระงับการใช้งาน'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {isSuperAdmin ? (
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1">
                              Protected
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingStaff(staff)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                                title="แก้ไขข้อมูลส่วนตัว"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(staff.id, staff.isActive, staff.email)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  staff.isActive 
                                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' 
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