import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { 
  X, UserPlus, Save, Loader2, Sparkles
} from 'lucide-react';
import { parseCustomerAddress } from 'dh-shared';
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
  const [rawInputText, setRawInputText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setRawInputText('');
    }
  }, [isOpen]);

  const handlePasteTextChange = (text) => {
    setRawInputText(text);
    if (!text.trim()) return;

    const parsed = parseCustomerAddress(text);
    setFormData(prev => ({
      ...prev,
      accountName: parsed.accountName || prev.accountName,
      storeName: parsed.storeName || parsed.accountName || prev.storeName,
      contactName: parsed.contactName || prev.contactName,
      firstName: parsed.contactName || prev.firstName,
      phone: parsed.phone || prev.phone,
      phoneNumber: parsed.phone || prev.phoneNumber,
      email: parsed.email || prev.email,
      lineId: parsed.lineId || prev.lineId,
      facebookUrl: parsed.facebookUrl || prev.facebookUrl,
      facebook: parsed.facebook || prev.facebook,
      logisticProvider: parsed.logisticProvider || prev.logisticProvider,
      preferredCourier: parsed.preferredCourier || prev.preferredCourier,
      logisticNote: parsed.logisticNote || prev.logisticNote,
      shippingNotes: parsed.shippingNotes || prev.shippingNotes,
      address: {
        ...(typeof prev.address === 'object' ? prev.address : {}),
        addressLine: parsed.addressLine || (typeof prev.address === 'object' ? prev.address?.addressLine : '') || '',
        subDistrict: parsed.subDistrict || (typeof prev.address === 'object' ? prev.address?.subDistrict : '') || '',
        district: parsed.district || (typeof prev.address === 'object' ? prev.address?.district : '') || '',
        province: parsed.province || (typeof prev.address === 'object' ? prev.address?.province : '') || '',
        zipCode: parsed.zipCode || (typeof prev.address === 'object' ? prev.address?.zipCode : '') || '',
        postalCode: parsed.postalCode || (typeof prev.address === 'object' ? prev.address?.postalCode : '') || ''
      }
    }));
  };

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

            {/* 🌟 Smart Quick Paste / Real-time Parser Section */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  วางข้อมูลลูกค้าชุดเดียวที่นี่ (ก๊อปปี้จาก Chat / Line / FB)
                </label>
                <span className="text-[10px] text-amber-500 bg-amber-500/20 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Smart Real-time Parser
                </span>
              </div>
              <textarea 
                rows={2} 
                value={rawInputText} 
                onChange={e => handlePasteTextChange(e.target.value)} 
                placeholder="ตัวอย่าง: ร้านดีไอวาย คอมพิวเตอร์ คุณ ภวัต บุญมา 065-4428822 91/364 ม.2 พฤกษา14บี ต.บางคูรัด อ.บางบัวทอง จ.นนทบุรี 11110" 
                className="w-full p-2.5 border border-amber-500/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-lg text-xs bg-dh-surface text-dh-main placeholder:text-dh-muted outline-hidden transition-all resize-none font-sans" 
              />
              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                ⚡ ระบบจะจำแนกชื่อร้าน, ชื่อผู้ติดต่อ, เบอร์โทรศัพท์, และที่อยู่อัตโนมัติลงในแบบฟอร์มด้านล่างทันที
              </p>
            </div>
            
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-sm transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-xs active:scale-95 disabled:opacity-70"
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