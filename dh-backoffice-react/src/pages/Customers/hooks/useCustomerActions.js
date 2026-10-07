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

      // 🛡️ Sanitize Payload (CRIT-01): กรองเฉพาะฟิลด์ที่มีค่าจริงเท่านั้น ไม่นำค่าว่าง ("") หรือ null/undefined มาทับข้อมูลเดิม
      const sanitizedPayload = Object.fromEntries(
        Object.entries(newCustomerData || {}).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
      );

      await userService.updateCustomerProfile(targetId, sanitizedPayload);

      const updated = { ...existingCustomer, ...sanitizedPayload };
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
      toast.error("เกิดข้อผิดพลาดในการรวมข้อมูลลูกค้า: " + (error?.message || ''));
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

  // เตรียมข้อมูลสำหรับฟอร์มแก้ไข (พร้อมระบบป้องกันข้อมูลสูญหาย Data Overwrite Guard)
  const startEditCustomer = async (customer) => {
    if (!customer) return;
    const targetId = customer.id || customer.uid || '';

    // 🛡️ Data Overwrite Guard: หากในแคชไม่มีที่อยู่ ให้ไปดึงโปรไฟล์ตัวเต็มจาก users/{uid} ก่อนเปิดฟอร์ม
    let fullProfile = customer;
    if (targetId && !customer.address && !customer.legacyAddress && !customer.shippingAddress) {
      try {
        const fetched = await userService.getUserProfile(targetId);
        if (fetched) {
          fullProfile = { ...customer, ...fetched };
        }
      } catch (err) {
        console.warn('[useCustomerActions] Pre-edit fetch profile warning:', err);
      }
    }

    setEditFormData({
      id: targetId,
      originalAccountId: fullProfile.accountId || fullProfile.customerCode || targetId.substring(0,8).toUpperCase(),
      customerCode: fullProfile.accountId || fullProfile.customerCode || targetId.substring(0,8).toUpperCase(),
      accountId: fullProfile.accountId || fullProfile.customerCode || targetId.substring(0,8).toUpperCase(),
      accountName: getCustomerDisplayName(fullProfile, ''),
      contactName: fullProfile.contactName || fullProfile.firstName || '',
      phone: fullProfile.phone || fullProfile.phoneNumber || '',
      email: fullProfile.email || '',
      address: fullProfile.address || fullProfile.legacyAddress || fullProfile.shippingAddress || '',
      logisticProvider: fullProfile.logisticProvider || fullProfile.preferredCourier || '',
      logisticNote: fullProfile.logisticNote || fullProfile.shippingNotes || '',
      preferredCourier: fullProfile.preferredCourier || fullProfile.logisticProvider || '',
      shippingNotes: fullProfile.shippingNotes || fullProfile.logisticNote || '',
      rank: fullProfile.rank || fullProfile.role || 'Customer',
      accountRank: fullProfile.accountRank || '' 
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

    // 🛡️ Quarantined per ssr memory customers.md (HIGH-05): ห้ามลบฟิลด์ customerCode ทิ้งเด็ดขาดเพื่อรักษาประวัติศาสตร์
    toast.info("🔒 ระบบล็อกการไมเกรชัน: อนุรักษ์รหัส customerCode ไว้เคียงคู่กับ accountId ถาวรตามระเบียบระบบ");
    return;
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