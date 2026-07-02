import { useState, useEffect } from 'react';
import { auth } from '../../../firebase/config';
import { userService } from '../../../firebase/userService';
import { todoService } from '../../../firebase/todoService';

/**
 * Hook สำหรับจัดการ Action ต่างๆ เช่น เพิ่ม, แก้ไข, ลบ ลูกค้า และเปลี่ยน Rank
 * เชื่อมต่อกับ Firebase Services และจัดการ State Sync ไปยัง Data Hook
 */
export const useCustomerActions = (customers, setCustomers, fetchCustomers, CACHE_KEY) => {
  // ==========================================
  // 1. Roles & Permissions State
  // ==========================================
  const [currentUserRole, setCurrentUserRole] = useState('Staff');
  const managerRoles = ['Admin', 'Manager', 'Owner', 'manager', 'owner', 'admin', 'แอดมิน', 'ผู้จัดการ', 'เจ้าของ'];

  useEffect(() => {
    // โหลด Role ของ User ที่กำลังใช้งานเพื่อใช้คุมสิทธิ์
    if (auth.currentUser) {
      userService.getUserProfile(auth.currentUser.uid).then(profile => {
        if (profile && profile.role) setCurrentUserRole(profile.role);
      });
    }
  }, []);

  // ==========================================
  // 2. Add Customer Form States
  // ==========================================
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerCode: '', accountName: '', contactName: '', phone: '', email: '', address: '',
    logisticProvider: '', logisticNote: '', rank: 'Customer', accountRank: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // 3. Edit & Rank States
  // ==========================================
  const [selectedCustomer, setSelectedCustomer] = useState(null); // ตัวแปรกลางที่ต้อง sync กับตารางและประวัติ
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  // ==========================================
  // 4. Action Functions (Mutations)
  // ==========================================

  // สร้างลูกค้าใหม่
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.accountName.trim()) {
      alert("กรุณากรอกชื่อร้าน/ชื่อบริษัท");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...newCustomer,
        customerCode: newCustomer.customerCode.trim() || `CUST-${Math.floor(Math.random() * 10000)}`
      };
      
      await userService.createManualCustomer(payload);
      
      setIsAddModalOpen(false);
      setNewCustomer({ 
        customerCode: '', accountName: '', contactName: '', phone: '', email: '', address: '', 
        logisticProvider: '', logisticNote: '', rank: 'Customer', accountRank: '' 
      });
      
      // สั่งให้ useCustomerData ดึงข้อมูลใหม่เพื่อสะท้อนความเปลี่ยนแปลง
      fetchCustomers(false); 
    } catch (error) {
      console.error("Create customer error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  // เตรียมข้อมูลสำหรับฟอร์มแก้ไข
  const startEditCustomer = (customer) => {
    if (!customer) return;
    setEditFormData({
      id: customer.id || customer.uid || '',
      originalAccountId: customer.accountId || customer.customerCode || customer.id?.substring(0,8)?.toUpperCase() || '',
      customerCode: customer.accountId || customer.customerCode || customer.id?.substring(0,8)?.toUpperCase() || '',
      accountId: customer.accountId || customer.customerCode || customer.id?.substring(0,8)?.toUpperCase() || '',
      accountName: customer.accountName || customer.displayName || '',
      contactName: customer.contactName || customer.firstName || '',
      phone: customer.phone || customer.phoneNumber || '',
      email: customer.email || '',
      address: customer.address || '',
      logisticProvider: customer.logisticProvider || '',
      logisticNote: customer.logisticNote || '',
      rank: customer.rank || customer.role || 'Customer',
      accountRank: customer.accountRank || '' 
    });
    setIsEditMode(true);
  };

  // บันทึกการแก้ไข (sync ข้อมูลลง Cache ทันทีโดยไม่ต้องดึงใหม่ทั้งหมด)
  const saveCustomerEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editFormData.accountName.trim()) {
      alert("กรุณากรอกชื่อร้าน/ชื่อบริษัท");
      return;
    }
    if (!selectedCustomer) return;
    
    setIsSavingEdit(true);
    try {
      const targetId = selectedCustomer.uid || selectedCustomer.id;
      const payloadToUpdate = { ...editFormData };
      
      if (payloadToUpdate.rank) {
        payloadToUpdate.role = payloadToUpdate.rank; // sync rank กับ role 
      }

      await userService.updateCustomerProfile(targetId, payloadToUpdate);
      
      // Update UI ทันที
      const updatedCustomer = { ...selectedCustomer, ...payloadToUpdate };
      setSelectedCustomer(updatedCustomer); // update panel 
      
      // Sync ไปยัง State หลักใน useCustomerData และ Cache
      const updateList = (list) => list.map(c => c.id === targetId ? updatedCustomer : c);
      const newCustomersList = updateList(customers);
      setCustomers(newCustomersList);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCustomersList));
      
      setIsEditMode(false);
    } catch (error) {
      console.error("Save edit error:", error);
      alert("บันทึกข้อมูลล้มเหลว กรุณาลองใหม่");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // เปลี่ยน Rank อย่างรวดเร็ว (จาก DetailPanel)
  const handleQuickRankChange = async (newRank) => {
    if (!selectedCustomer) return;
    setIsQuickSaving(true);
    try {
      const targetId = selectedCustomer.uid || selectedCustomer.id;
      
      await userService.updateCustomerProfile(targetId, { rank: newRank, role: newRank });
      
      const updatedCustomer = { ...selectedCustomer, rank: newRank, role: newRank };
      setSelectedCustomer(updatedCustomer);
      
      const updateList = (list) => list.map(c => c.id === targetId ? updatedCustomer : c);
      const newCustomersList = updateList(customers);
      setCustomers(newCustomersList);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCustomersList));

    } catch (error) {
      console.error("Quick rank change error:", error);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนระดับบัญชี");
    } finally {
      setIsQuickSaving(false);
    }
  };

  // ลบข้อมูล (แบ่งเคส Admin กับ Staff)
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    const targetId = selectedCustomer.uid || selectedCustomer.id;
    const customerName = selectedCustomer.accountName || selectedCustomer.displayName || selectedCustomer.id;
    const isManager = managerRoles.includes(currentUserRole);

    if (isManager) {
      if (window.confirm(`⚠️ ยืนยันการลบลูกค้า: ${customerName} หรือไม่?\nการกระทำนี้จะลบข้อมูลออกจากระบบ และไม่สามารถกู้คืนได้`)) {
        try {
          await userService.deleteCustomer(targetId, customerName);
          
          setSelectedCustomer(null); // ปิดหน้า panel

          // Sync ลบออกจาก state หลักและ cache
          const newCustomersList = customers.filter(c => c.id !== targetId);
          setCustomers(newCustomersList);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newCustomersList));
          
          alert('ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
        } catch (error) {
          console.error("Delete customer error:", error);
          alert('เกิดข้อผิดพลาดในการลบข้อมูล');
        }
      }
    } else {
      if (window.confirm(`คุณไม่มีสิทธิ์ลบข้อมูลโดยตรง\n\nต้องการส่ง "คำขออนุมัติลบลูกค้า" (${customerName}) ไปยังผู้จัดการหรือไม่?`)) {
        try {
          await todoService.requestCustomerDeletion(selectedCustomer, auth.currentUser.uid);
          alert('✅ ส่งคำขออนุมัติลบลูกค้า ไปยังคิวงาน (To-do) ของผู้จัดการเรียบร้อยแล้ว');
        } catch (error) {
          console.error("Request deletion error:", error);
          alert('เกิดข้อผิดพลาดในการส่งคำขอ');
        }
      }
    }
  };

  // ลบข้อมูลอดีต (Migration) - ล้างฟิลด์ customerCode
  const handleRunMigration = async () => {
    const isManager = managerRoles.includes(currentUserRole);
    if (!isManager) {
      alert("คุณไม่มีสิทธิ์รัน Migration");
      return;
    }

    // 1. Dry Run (จำลองผลลัพธ์)
    const usersToMigrate = customers.filter(c => c.customerCode !== undefined && c.customerCode !== null);
    
    if (usersToMigrate.length === 0) {
      alert("🎉 ไม่พบข้อมูลอดีตที่ตกค้างเลยครับ (ฐานข้อมูลสะอาด 100%)");
      return;
    }

    const confirmMsg = `🔍 จำลองผลลัพธ์ (Dry-Run):\nพบรายชื่อลูกค้าที่ยังมีฟิลด์รหัสอดีต (customerCode) จำนวน ${usersToMigrate.length} รายการ\n\nการกด 'ตกลง' จะทำการ:\n1. ลบฟิลด์ customerCode ทิ้งอย่างถาวร\n2. บังคับใช้ accountId มาตรฐาน 8 หลัก\n\nต้องการ "ถอนรากถอนโคน" เลยหรือไม่?`;
    
    if (window.confirm(confirmMsg)) {
      setIsSubmitting(true);
      try {
        const { updateDoc, doc, deleteField } = await import('firebase/firestore');
        const { db } = await import('../../../firebase/config');
        
        let success = 0;
        for (const u of usersToMigrate) {
          try {
            const userRef = doc(db, 'users', u.id || u.uid);
            await updateDoc(userRef, {
               customerCode: deleteField(),
               // Ensure accountId exists
               accountId: u.accountId || u.customerCode?.substring(0,8)?.toUpperCase() || u.id?.substring(0,8)?.toUpperCase()
            });
            success++;
          } catch(err) {
            console.error(`Failed to migrate user ${u.id}:`, err);
          }
        }
        alert(`✅ การกวาดล้างเสร็จสมบูรณ์!\nปรับปรุงข้อมูลสำเร็จ ${success}/${usersToMigrate.length} รายการ`);
        fetchCustomers(true); // โหลดข้อมูลใหม่ทั้งหมด
      } catch (error) {
        console.error("Migration error:", error);
        alert("เกิดข้อผิดพลาดในการกวาดล้างข้อมูล");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    state: {
      currentUserRole,
      managerRoles,
      isAddModalOpen,
      newCustomer,
      isSubmitting,
      selectedCustomer,
      isEditMode,
      editFormData,
      isSavingEdit,
      isQuickSaving
    },
    actions: {
      setIsAddModalOpen,
      setNewCustomer,
      setSelectedCustomer,
      setIsEditMode,
      setEditFormData,
      handleCreateCustomer,
      startEditCustomer,
      saveCustomerEdit,
      handleQuickRankChange,
      handleDeleteCustomer,
      handleRunMigration
    }
  };
};