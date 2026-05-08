import React from 'react';
import { 
  X, UserPlus, Save, Loader2, Building2, 
  MapPin, Phone, Mail, Truck, Hash 
} from 'lucide-react';

export default function CustomerModal({
  isOpen,
  onClose,
  isEditMode,
  formData,
  setFormData,
  onSubmit,
  isSubmitting
}) {
  if (!isOpen) return null;

  // ฟังก์ชันช่วยอัปเดตข้อมูลใน Form
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <><Edit2 className="text-dh-accent" size={24}/> แก้ไขข้อมูลลูกค้า</>
            ) : (
              <><UserPlus className="text-dh-accent" size={24}/> เพิ่มลูกค้าระบบ Manual</>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-dh-border text-dh-muted hover:text-dh-main rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Form) */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="space-y-6">
            
            {/* ส่วนที่ 1: ข้อมูลหลัก */}
            <div>
              <h3 className="text-sm font-bold text-dh-accent mb-3 flex items-center gap-2 border-b border-dh-border pb-2">
                <Building2 size={16} /> ข้อมูลหลักของร้านค้า
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-dh-muted flex items-center gap-1">
                    <Hash size={12}/> รหัสลูกค้า <span className="text-[10px] text-gray-400 font-normal">(เว้นว่างเพื่อสุ่มอัตโนมัติ)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="เช่น CUST-001" 
                    className="w-full px-3 py-2.5 border border-dh-border rounded-lg focus:ring-1 focus:ring-dh-accent focus:border-dh-accent outline-none text-sm bg-dh-base focus:bg-dh-surface transition-all text-dh-main uppercase"
                    value={formData.customerCode || ''} 
                    onChange={e => handleChange('customerCode', e.target.value)}
                    disabled={isEditMode} // มักจะไม่ให้แก้รหัสลูกค้าเดิม
                  />
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