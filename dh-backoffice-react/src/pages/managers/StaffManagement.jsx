import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../firebase/config';
import { userService, SUPER_ADMINS } from '../../firebase/userService';
import { useNavigate } from 'react-router-dom';
import { Users, Search, AlertCircle, CheckCircle2, UserPlus, Eye, EyeOff, ArrowLeft, Briefcase } from 'lucide-react';

import StaffTable from './components/staff/StaffTable';
import StaffAddModal from './components/staff/StaffAddModal';
import StaffEditModal from './components/staff/StaffEditModal';
import StaffDetailModal from './components/staff/StaffDetailModal';

const ROLES = ['Admin', 'Manager', 'Staff', 'Packer', 'Developer'];

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

export default function StaffManagement() {
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showSuspended, setShowSuspended] = useState(false);
  
  const [toast, setToast] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);
  
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);

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
      isOpen: true, title, desc, action: actionFn, type: isDanger ? 'danger' : 'warning'
    });
  };
  const closeModal = () => setModalConfig(null);

  const handleRoleChange = async (uid, newRole, email) => {
    if (SUPER_ADMINS.includes(email)) {
      return showToast('error', 'ไม่อนุญาตให้เปลี่ยนสิทธิ์ของเจ้าของระบบ');
    }
    openModal(
      'ยืนยันการปรับเปลี่ยนตำแหน่ง',
      `คุณต้องการเปลี่ยนตำแหน่งของ ${email} เป็น ${newRole} ใช่หรือไม่?`,
      async () => {
        try {
          await userService.updateUserRole(uid, uid, newRole);
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
            await userService.suspendUser(uid, uid);
          } else {
            await userService.restoreUser(uid, uid);
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
          await userService.deleteUser(uid, uid);
          setStaffList(prev => prev.filter(staff => staff.id !== uid));
          showToast('success', 'ลบพนักงานสำเร็จ');
        } catch (error) {
          showToast('error', 'ลบพนักงานล้มเหลว');
        }
      },
      true 
    );
  };

  // --- Derived Data ---
  const filteredStaff = staffList.filter(staff => {
    const isPending = staff.role === 'pending_approval' || staff.role === 'pending';
    
    // FIX: Show pending_approval regardless of isActive flag if showSuspended is false
    // If showSuspended is true, show everyone (including inactive and pending).
    if (!showSuspended && !staff.isActive && !isPending) return false;
    
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

      <StaffAddModal 
        showAddModal={showAddModal} 
        setShowAddModal={setShowAddModal} 
        showToast={showToast} 
        fetchStaff={fetchStaff} 
      />

      <StaffEditModal 
        editingStaff={editingStaff} 
        setEditingStaff={setEditingStaff} 
        showToast={showToast} 
        setStaffList={setStaffList} 
      />

      <StaffDetailModal 
        viewingStaff={viewingStaff} 
        setViewingStaff={setViewingStaff} 
      />

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

      <StaffTable 
        loading={loading}
        filteredStaff={filteredStaff}
        setViewingStaff={setViewingStaff}
        setEditingStaff={setEditingStaff}
        handleRoleChange={handleRoleChange}
        handleToggleStatus={handleToggleStatus}
        handleDeleteStaff={handleDeleteStaff}
      />
      
    </div>
  );
}