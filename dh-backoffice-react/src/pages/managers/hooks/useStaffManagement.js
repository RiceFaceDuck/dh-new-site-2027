import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../../firebase/config';
import { userService, SUPER_ADMINS } from '../../../firebase/userService';
import { historyService } from '../../../firebase/historyService';
import { auth } from '../../../firebase/config';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

export function useStaffManagement() {
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
          
          // Log role change
          await historyService.addLog('StaffManagement', 'UpdateRole', uid, `เปลี่ยนตำแหน่งพนักงาน ${email} เป็น ${newRole}`, auth.currentUser?.uid);

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

          // Log status change
          await historyService.addLog('StaffManagement', isSuspending ? 'Suspend' : 'Restore', uid, `${actionText}บัญชีพนักงาน ${email}`, auth.currentUser?.uid);

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
          
          // Log delete
          await historyService.addLog('StaffManagement', 'Delete', uid, `ลบบัญชีพนักงาน ${email}`, auth.currentUser?.uid);

          setStaffList(prev => prev.filter(staff => staff.id !== uid));
          showToast('success', 'ลบพนักงานสำเร็จ');
        } catch (error) {
          showToast('error', 'ลบพนักงานล้มเหลว');
        }
      },
      true 
    );
  };

  const filteredStaff = staffList.filter(staff => {
    const isPending = staff.role === 'pending_approval' || staff.role === 'pending';
    if (!showSuspended && !staff.isActive && !isPending) return false;
    
    const matchesSearch = 
      (staff.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.displayName || staff.firstName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const staffRole = staff.computedRole || staff.role || (staff.roles ? staff.roles[0] : '');
    const matchesRole = roleFilter === 'all' || 
      (staffRole && staffRole.toLowerCase() === roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  return {
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    showSuspended,
    setShowSuspended,
    toast,
    modalConfig,
    closeModal,
    editingStaff,
    setEditingStaff,
    viewingStaff,
    setViewingStaff,
    showAddModal,
    setShowAddModal,
    filteredStaff,
    handleRoleChange,
    handleToggleStatus,
    handleDeleteStaff,
    fetchStaff,
    showToast
  };
}
