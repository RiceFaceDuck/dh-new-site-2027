import React, { useState, useEffect } from 'react';
import { 
  X, UserPlus, Save, Loader2, Building2, 
  MapPin, Phone, Mail, Truck, Hash, Wand2, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { generateAccountId, checkAccountIdExists } from '../../../../firebase/customer/accountIdService';
import { syncCustomerAccount } from '../../../../firebase/customerAdminService';

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
    setFormData(prev => ({ ...prev, [field]: value }));
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
      setIdError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6">
      {/* พื้นหลังเบลอ */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
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
            <div>
              <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                <Building2 size={16} /> ข้อมูลหลักของร้านค้า
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                      <Hash size={12}/> รหัสลูกค้า (Account ID)
                    </label>
                    <div className="flex items-center gap-2">
                      {isEditMode && formData.originalAccountId && (
                        <>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            ID ปัจจุบัน: {formData.originalAccountId}
                          </span>
                          {formData.email ? (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-teal-50 text-teal-600 border border-teal-200" title={`ซิงค์กับอีเมล: ${formData.email}`}>
                              <CheckCircle2 size={10} strokeWidth={3} />
                              <span>SYNCED</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-rose-50 text-rose-600 border border-rose-200" title="ยังไม่เชื่อมต่อบัญชีหน้าเว็บ">
                              <X size={10} strokeWidth={3} />
                              <span>NO EMAIL SYNC</span>
                            </span>
                          )}
                        </>
                      )}
                      <button type="button" onClick={handleGenerateId} className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded transition-colors shrink-0">
                        <Wand2 size={10} /> สุ่มรหัสใหม่
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="เช่น CUST-001" 
                      className={`w-full px-3 py-2.5 pr-8 border rounded-lg focus:ring-1 outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main uppercase font-mono ${
                        idError ? 'border-rose-400 focus:ring-rose-400' : 
                        idSuccess ? 'border-emerald-400 focus:ring-emerald-400' : 'border-dh-border focus:ring-dh-accent'
                      }`}
                      value={formData.customerCode || formData.accountId || ''} 
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setFormData(prev => ({ ...prev, customerCode: val, accountId: val }));
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {(isValidatingId || isSyncing) && <Loader2 size={14} className="animate-spin text-slate-400" />}
                      {(!isValidatingId && !isSyncing) && idSuccess && <CheckCircle2 size={14} className="text-emerald-500" />}
                      {(!isValidatingId && !isSyncing) && idError && <AlertCircle size={14} className="text-rose-500" />}
                    </div>
                  </div>
                  {idError && !duplicateIdToSync && <p className="text-[10px] text-rose-500 font-medium">{idError}</p>}
                  
                  {/* ปุ่มโอนย้ายบัญชี (กรณีตรวจพบว่ารหัสซ้ำ) */}
                  {duplicateIdToSync && isEditMode && (
                    <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                       <p className="text-xs text-indigo-800 font-bold mb-2 flex items-center gap-1">
                         <RefreshCw size={12} className="text-indigo-600" /> พบรหัสนี้ในระบบ (ต้องการโอนย้ายข้อมูลหรือไม่?)
                       </p>
                       <p className="text-[10px] text-indigo-600 mb-3 leading-relaxed">
                         หากลูกค้านำรหัสนี้มาจากหน้าเว็บ คุณสามารถคลิกปุ่มด้านล่างเพื่อโอนย้ายข้อมูลคำสั่งซื้อและเครดิตเดิม ทั้งหมดไปรวมกับบัญชีรหัสใหม่ได้ทันที
                       </p>
                       <button 
                         type="button" 
                         onClick={() => handleSyncAccount(duplicateIdToSync)}
                         disabled={isSyncing}
                         className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-md shadow-md hover:bg-indigo-700 flex items-center justify-center gap-1 transition-colors"
                       >
                         {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <><RefreshCw size={14} /> ยืนยันการโอนย้ายและควบรวมบัญชี</>}
                       </button>
                    </div>
                  )}
                  {duplicateIdToSync && !isEditMode && <p className="text-[10px] text-rose-500 font-medium">รหัสนี้ถูกใช้งานแล้ว กรุณาสุ่มใหม่</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                    ชื่อร้าน / ชื่อบริษัท <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="ระบุชื่อร้านค้า" 
                    required
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main font-medium"
                    value={formData.accountName || ''} 
                    onChange={e => handleChange('accountName', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ส่วนที่ 2: ข้อมูลการติดต่อ */}
            <div>
              <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                <Phone size={16} /> ข้อมูลการติดต่อ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dh-muted">ชื่อผู้ติดต่อ</label>
                  <input 
                    type="text" 
                    placeholder="ชื่อผู้ติดต่อหลัก" 
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                    value={formData.contactName || ''} 
                    onChange={e => handleChange('contactName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dh-muted">เบอร์โทรศัพท์</label>
                  <input 
                    type="tel" 
                    placeholder="เช่น 0812345678" 
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                    value={formData.phone || ''} 
                    onChange={e => handleChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                    <Mail size={12}/> อีเมล
                  </label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                    value={formData.email || ''} 
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                    <MapPin size={12}/> ที่อยู่แบบเต็ม
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" 
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main resize-none"
                    value={formData.address || ''} 
                    onChange={e => handleChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ส่วนที่ 3: การจัดส่ง */}
            <div>
              <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                <Truck size={16} /> การจัดส่ง
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dh-muted">ขนส่งที่ใช้ประจำ</label>
                  <input 
                    type="text" 
                    placeholder="เช่น Flash, Kerry, J&T, ไปรษณีย์ไทย" 
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main"
                    value={formData.logisticProvider || ''} 
                    onChange={e => handleChange('logisticProvider', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-dh-muted">หมายเหตุการจัดส่ง (ถ้ามี)</label>
                  <textarea 
                    rows={2}
                    placeholder="เช่น ฝากไว้ที่ป้อมยาม, ห้ามโยนของ" 
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main resize-none"
                    value={formData.logisticNote || ''} 
                    onChange={e => handleChange('logisticNote', e.target.value)}
                  />
                </div>
              </div>
            </div>
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
            className="px-6 py-2.5 bg-dh-accent text-white rounded-lg hover:bg-dh-accent-hover font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-sm active:scale-95 disabled:opacity-70"
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