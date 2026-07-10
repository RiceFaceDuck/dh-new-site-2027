import React, { useState, useEffect } from 'react';
import { 
  X, UserPlus, Save, Loader2, Building2, 
  MapPin, Phone, Mail, Truck, Hash, Wand2, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { generateAccountId, checkAccountIdExists } from '../../../../firebase/customer/accountIdService';
import { syncCustomerAccount } from '../../../../firebase/customerAdminService';
import MainInfoSection from './sections/MainInfoSection';
import ContactInfoSection from './sections/ContactInfoSection';
import ShippingInfoSection from './sections/ShippingInfoSection';

export default function CustomerModal({
  isOpen,
  onClose,
  isEditMode,
  formData,
  setFormData,
  onSubmit,
  isSubmitting
}) {
  const [isValidatingId, setIsValidatingId] = useState(false);
  const [idError, setIdError] = useState('');
  const [idSuccess, setIdSuccess] = useState(false);
  const [duplicateIdToSync, setDuplicateIdToSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ตรวจสอบเมื่อพิมพ์ ID ใหม่ (Debounce เล็กน้อย)
  useEffect(() => {
    const checkId = async () => {
      const code = formData.customerCode || formData.accountId;
      if (!code) {
        setIdError('');
        setIdSuccess(false);
        return;
      }
      
      // ข้ามการเช็คถ้ารหัสเหมือนเดิมในโหมด Edit
      if (isEditMode && code === formData.originalAccountId) {
        setIdError('');
        setIdSuccess(true);
        return;
      }

      setIsValidatingId(true);
      setIdError('');
      setIdSuccess(false);

      try {
        const isDuplicate = await checkAccountIdExists(code, formData.id);
        if (isDuplicate) {
          setIdError('รหัสลูกค้านี้มีในระบบแล้ว');
          setDuplicateIdToSync(code);
        } else {
          setIdSuccess(true);
          setDuplicateIdToSync(null);
        }
      } catch (error) {
    console.error("🔥 Error:", error);
    toast.error(error?.message || "เกิดข้อผิดพลาด");

        setIdError('เกิดข้อผิดพลาดในการตรวจสอบรหัส');
      } finally {
        setIsValidatingId(false);
      }
    };

    const timeoutId = setTimeout(checkId, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.customerCode, formData.accountId, isEditMode, formData.id, formData.originalAccountId]);

  if (!isOpen) return null;

  // ฟังก์ชันช่วยอัปเดตข้อมูลใน Form
  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({ 
        ...prev, 
        [parent]: {
          ...(prev[parent] || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGenerateId = () => {
    const newId = generateAccountId();
    setFormData(prev => ({ ...prev, customerCode: newId, accountId: newId }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (idError) return; // ป้องกันการ Submit ถ้ารหัสซ้ำ
    onSubmit(e);
  };

  const handleSyncAccount = async (targetId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการโอนย้ายข้อมูลทั้งหมดไปยังบัญชีปลายทาง? (ข้อมูลคำสั่งซื้อและเครดิตจะถูกย้ายถาวร)')) return;
    setIsSyncing(true);
    setIdError('');
    try {
      const res = await syncCustomerAccount(formData.id, targetId);
      alert(res.message);
      onClose(); // ปิด Modal หลังจากซิงค์สำเร็จ
      // หน้าจอหลักจะ Refresh อัตโนมัติเมื่อ Modal ปิด
    } catch (err) {
    console.error("🔥 Error:", err);
    toast.error(err?.message || "เกิดข้อผิดพลาด");

      setIdError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6">
      {/* พื้นหลังเบลอ */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* ตัวกล่อง Modal */}
      <div className="relative bg-dh-base w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-dh-border flex justify-between items-center bg-dh-surface">
          <h2 className="text-xl font-bold text-dh-main flex items-center gap-2">
            {isEditMode ? (
              <><Save className="text-dh-accent" size={24}/> แก้ไขข้อมูลลูกค้า</>
            ) : (
              <><UserPlus className="text-dh-accent" size={24}/> เพิ่มลูกค้าระบบ Manual</>
            )}
          </h2>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-dh-border text-dh-muted hover:text-dh-main rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body (Form) */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="space-y-6">
            
            {/* ส่วนที่ 1: ข้อมูลหลัก */}
            <MainInfoSection
                formData={formData}
                handleChange={handleChange}
                isEditMode={isEditMode}
                isValidatingId={isValidatingId}
                isSyncing={isSyncing}
                idSuccess={idSuccess}
                idError={idError}
                duplicateIdToSync={duplicateIdToSync}
                handleGenerateId={handleGenerateId}
                setFormData={setFormData}
                handleSyncAccount={handleSyncAccount}
            />

            {/* ส่วนที่ 2: ข้อมูลการติดต่อ */}
            <ContactInfoSection formData={formData} handleChange={handleChange} />

            {/* ส่วนที่ 3: การจัดส่ง */}
            <ShippingInfoSection formData={formData} handleChange={handleChange} />
          </div>
        </form>

        {/* Footer (Actions) */}
        <div className="px-6 py-4 border-t border-dh-border bg-dh-surface flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-dh-border text-dh-main rounded-lg hover:bg-gray-50 font-bold text-sm transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-dh-accent text-white rounded-lg hover:bg-dh-accent-hover font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-xs active:scale-95 disabled:opacity-70"
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin"/> กำลังบันทึก...</>
            ) : isEditMode ? (
              <><Save size={16} strokeWidth={2.5}/> บันทึกการแก้ไข</>
            ) : (
              <><UserPlus size={16} strokeWidth={2.5}/> บันทึกลูกค้าระบบ</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}