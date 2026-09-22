import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { auth } from '../../../firebase/config';
import { userService } from '../../../firebase/userService';
import { todoService } from '../../../firebase/todoService';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';
import { checkPotentialDuplicates } from '../components/forms/CustomerDuplicateComparisonModal';

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
    if (auth.currentUser) {
      userService.getUserProfile(auth.currentUser.uid).then(profile => {
        if (profile && profile.role) setCurrentUserRole(profile.role);
      }).catch(console.error);
    }
  }, []);

  // ==========================================
  // 2. Add Customer Form & Duplicate Guard States
  // ==========================================
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerCode: '', accountName: '', contactName: '', phone: '', email: '', address: '',
    logisticProvider: '', logisticNote: '', rank: 'Customer', accountRank: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ Duplicate Detection States
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [pendingNewCustPayload, setPendingNewCustPayload] = useState(null);

  // ==========================================
  // 3. Edit & Rank States
  // ==========================================
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  // ==========================================
  // 4. Action Functions (Mutations)
  // ==========================================

  // สร้างลูกค้าใหม่ พร้อมระบบตรวจสอบข้อมูลซ้ำซ้อน
  const handleCreateCustomer = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCustomer.accountName?.trim()) {
      alert("กรุณากรอกชื่อร้าน/ชื่อบริษัท");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...newCustomer,
        customerCode: newCustomer.customerCode?.trim() || ''
      };

      // 🔍 ตรวจจับรายชื่อที่อาจซ้ำซ้อนในฐานข้อมูลก่อน
      const duplicates = await checkPotentialDuplicates(payload);
      if (duplicates && duplicates.length > 0) {
        setDuplicateCandidates(duplicates);
        setPendingNewCustPayload(payload);
        setIsDuplicateModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      await userService.createManualCustomer(payload);
      toast.success('✅ บันทึกรายชื่อลูกค้าใหม่ลงฐานข้อมูลเรียบร้อยแล้ว');

      setIsAddModalOpen(false);
      setNewCustomer({ 
        customerCode: '', accountName: '', contactName: '', phone: '', email: '', address: '', 
        logisticProvider: '', logisticNote: '', rank: 'Customer', accountRank: '' 
      });

      fetchCustomers(false);
    } catch (error) {
      console.error("Create customer error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟢 กรณีตรวจพบข้อมูลซ้ำ: ผู้ใช้เลือก "ใช้งานข้อมูลนี้" (Select Existing)
  const handleSelectExistingCustomer = (existingCustomer) => {
    setSelectedCustomer(existingCustomer);
    setIsDuplicateModalOpen(false);
    setIsAddModalOpen(false);
  };

  // 🟣 กรณีตรวจพบข้อมูลซ้ำ: ผู้ใช้เลือก "เขียนทับลงการ์ดนี้" (Overwrite Existing)
  const handleOverwriteExistingCustomer = async (existingCustomer, newCustomerData) => {
    setIsSubmitting(true);
    try {
      const targetId = existingCustomer.uid || existingCustomer.id;
      await userService.updateCustomerProfile(targetId, newCustomerData);

      const updated = { ...existingCustomer, ...newCustomerData };
      setSelectedCustomer(updated);

      const updatedList = customers.map(c => (c.id === targetId || c.uid === targetId) ? updated : c);
      setCustomers(updatedList);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));

      toast.success('✅ รวมและเขียนทับข้อมูลลูกค้าเดิมเรียบร้อยแล้ว');
      setIsDuplicateModalOpen(false);
      setIsAddModalOpen(false);
      fetchCustomers(false);
    } catch (error) {
      console.error("Overwrite customer error:", error);
      alert("เกิดข้อผิดพลาดในการรวมข้อมูลลูกค้า");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🟡 กรณีตรวจพบข้อมูลซ้ำ: ผู้ใช้ยืนยัน "สร้างเป็นรายชื่อใหม่" (Force Create)
  const handleForceCreateNewCustomer = async () => {
    if (!pendingNewCustPayload) return;
    setIsSubmitting(true);
    try {
      await userService.createManualCustomer(pendingNewCustPayload);
      toast.success('✅ บันทึกรายชื่อลูกค้าใหม่ลงฐานข้อมูลเรียบร้อยแล้ว');

      setIsAddModalOpen(false);
      setIsDuplicateModalOpen(false);
      setPendingNewCustPayload(null);
      setNewCustomer({ 
        customerCode: '', accountName: '', contactName: '', phone: '', email: '', address: '', 
        logisticProvider: '', logisticNote: '', rank: 'Customer', accountRank: '' 
      });

      fetchCustomers(false);
    } catch (error) {
      console.error("Force create customer error:", error);
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
      accountName: getCustomerDisplayName(customer, ''),
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

  // บันทึกการแก้ไข
  const saveCustomerEdit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editFormData.accountName?.trim()) {
      alert("กรุณากรอกชื่อร้าน/ชื่อบริษัท");
      return;
    }
    if (!selectedCustomer) return;
    
    setIsSavingEdit(true);
    try {
      const targetId = selectedCustomer.uid || selectedCustomer.id;
      const payloadToUpdate = { ...editFormData };
      
      if (payloadToUpdate.rank) {
        payloadToUpdate.role = payloadToUpdate.rank;
      }

      await userService.updateCustomerProfile(targetId, payloadToUpdate);
      
      const updatedCustomer = { ...selectedCustomer, ...payloadToUpdate };
      setSelectedCustomer(updatedCustomer);
      
      const updateList = (list) => list.map(c => (c.id === targetId || c.uid === targetId) ? updatedCustomer : c);
      const newCustomersList = updateList(customers);
      setCustomers(newCustomersList);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCustomersList));
      
      toast.success('✅ บันทึกการแก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว');
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
      
      const updateList = (list) => list.map(c => (c.id === targetId || c.uid === targetId) ? updatedCustomer : c);
      const newCustomersList = updateList(customers);
      setCustomers(newCustomersList);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCustomersList));
      toast.success(`✅ เปลี่ยนระดับบัญชีเป็น ${newRank} เรียบร้อยแล้ว`);
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
    const customerName = getCustomerDisplayName(selectedCustomer, 'ลูกค้า');
    const isManager = managerRoles.includes(currentUserRole);

    if (isManager) {
      if (window.confirm(`⚠️ ยืนยันการลบลูกค้า: ${customerName} หรือไม่?\nการกระทำนี้จะลบข้อมูลออกจากระบบ และไม่สามารถกู้คืนได้`)) {
        try {
          await userService.deleteCustomer(targetId, customerName);
          
          setSelectedCustomer(null);

          const newCustomersList = customers.filter(c => c.id !== targetId && c.uid !== targetId);
          setCustomers(newCustomersList);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newCustomersList));
          
          toast.success('ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
        } catch (error) {
          console.error("Delete customer error:", error);
          alert(error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
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

  // ล้างฟิลด์ customerCode เก่า (Migration)
  const handleRunMigration = async () => {
    const isManager = managerRoles.includes(currentUserRole);
    if (!isManager) {
      alert("คุณไม่มีสิทธิ์รัน Migration");
      return;
    }

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
        const { getCollectionPath } = await import('dh-shared');
        
        let success = 0;
        for (const u of usersToMigrate) {
          try {
            const userRef = doc(db, getCollectionPath('users'), u.id || u.uid);
            await updateDoc(userRef, {
               customerCode: deleteField(),
               accountId: (u.accountId && u.accountId.length === 8 && !u.accountId.startsWith('CUST')) 
                 ? u.accountId 
                 : (u.id || u.uid).substring(0, 8).toUpperCase()
            });
            success++;
          } catch(err) {
            console.error(`Failed to migrate user ${u.id}:`, err);
          }
        }
        alert(`✅ การกวาดล้างเสร็จสมบูรณ์!\nปรับปรุงข้อมูลสำเร็จ ${success}/${usersToMigrate.length} รายการ`);
        fetchCustomers(true);
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
      isQuickSaving,
      isDuplicateModalOpen,
      duplicateCandidates,
      pendingNewCustPayload
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
      handleRunMigration,
      setIsDuplicateModalOpen,
      handleSelectExistingCustomer,
      handleOverwriteExistingCustomer,
      handleForceCreateNewCustomer
    }
  };
};