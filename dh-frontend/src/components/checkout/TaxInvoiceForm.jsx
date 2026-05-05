import React, { useState, useEffect } from 'react';
import { FileText, Info, Building, User, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

export default function TaxInvoiceForm() {
  const { checkoutState, updateCheckoutConfig } = useCart();
  
  // ⚡️ Local State สำหรับ Toggle และ ฟอร์ม
  const [requestTax, setRequestTax] = useState(checkoutState?.requestTax || false);
  const [taxInfo, setTaxInfo] = useState(checkoutState?.taxInfo || {
    type: 'company', // 'company' หรือ 'personal'
    name: '',
    taxId: '',
    address: '',
    isHeadOffice: true,
    branchCode: ''
  });

  // 🛡 UX Validation: เช็คว่ากรอกข้อมูลสำคัญครบไหม (เพื่อโชว์ Badge)
  const isComplete = 
    taxInfo.name.length > 2 && 
    taxInfo.taxId.length === 13 && 
    taxInfo.address.length > 10 &&
    (taxInfo.isHeadOffice || taxInfo.branchCode.length >= 4);

  const [errors, setErrors] = useState({});
  const validateTaxId = (taxId) => {
    return /^\d{13}$/.test(taxId);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newErrors = { ...errors };

    // 🪄 ลูกเล่น UX: บังคับกรอกเฉพาะตัวเลข 13 หลัก สำหรับเลขภาษี
    if (name === 'taxId') {
      const onlyNums = value.replace(/\D/g, '').slice(0, 13);
      setTaxInfo(prev => ({ ...prev, [name]: onlyNums }));

      if (onlyNums.length > 0 && !validateTaxId(onlyNums)) {
        newErrors.taxId = 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก';
      } else {
        delete newErrors.taxId;
      }
      setErrors(newErrors);
      return;
    }

    setTaxInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ⏱ ประหยัด Performance: ซิงค์ข้อมูลกับ Context เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    // ซิงค์แค่สถานะเปิด/ปิด ทันที
    updateCheckoutConfig({ requestTax });

    // ถ้าเปิดขอภาษี ค่อยหน่วงเวลาซิงค์ฟอร์ม
    if (requestTax) {
      const timer = setTimeout(() => {
        updateCheckoutConfig({ taxInfo });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [requestTax, taxInfo, updateCheckoutConfig]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
      {/* Header & Toggle Switch */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          ต้องการใบกำกับภาษีเต็มรูปหรือไม่?
        </h2>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={requestTax} 
            onChange={(e) => setRequestTax(e.target.checked)} 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
        </label>
      </div>

      {/* 🧾 ฟอร์มขยายตัว (Expandable Form) เมื่อ Toggle เป็น True */}
      {requestTax && (
        <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Information Note */}
          <div className="p-4 bg-blue-50/80 text-blue-800 text-sm rounded-2xl flex gap-3 items-start border border-blue-100">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <p className="leading-relaxed">
              เอกสารจะถูกจัดส่งไปพร้อมกับสินค้า และข้อมูลจะถูกบันทึกอัตโนมัติในหน้าโปรไฟล์ของคุณ เพื่อความสะดวกในการสั่งซื้อครั้งต่อไป
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* เลือกประเภท: นิติบุคคล / บุคคลธรรมดา */}
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${taxInfo.type === 'company' ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold' : 'border-gray-100 hover:bg-gray-50'}`}>
                <input type="radio" name="type" value="company" checked={taxInfo.type === 'company'} onChange={handleChange} className="sr-only" />
                <Building className="w-4 h-4" /> นิติบุคคล
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${taxInfo.type === 'personal' ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold' : 'border-gray-100 hover:bg-gray-50'}`}>
                <input type="radio" name="type" value="personal" checked={taxInfo.type === 'personal'} onChange={handleChange} className="sr-only" />
                <User className="w-4 h-4" /> บุคคลธรรมดา
              </label>
            </div>

            {isComplete && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> พร้อมออกเอกสาร
              </span>
            )}
          </div>

          {/* ฟอร์มกรอกข้อมูล */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* ชื่อบริษัท หรือ ชื่อบุคคล */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {taxInfo.type === 'company' ? 'ชื่อบริษัท / นิติบุคคล' : 'ชื่อ-นามสกุล (ตามบัตรประชาชน)'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="name"
                value={taxInfo.name}
                onChange={handleChange}
                placeholder={taxInfo.type === 'company' ? 'บริษัท ดีดี ดาต้า ไอที จำกัด' : 'สมชาย ใจดี'}
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* เลขภาษี */}
            <div className={taxInfo.type === 'company' ? 'md:col-span-1' : 'md:col-span-2'}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="taxId"
                value={taxInfo.taxId}
                onChange={handleChange}
                placeholder="X-XXXX-XXXXX-XX-X"
                maxLength="13"
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium tracking-widest ${errors.taxId ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
              />
              {errors.taxId ? (
                <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.taxId}</p>
              ) : taxInfo.taxId.length > 0 && taxInfo.taxId.length < 13 && (
                <p className="text-xs text-amber-500 mt-1.5 ml-1">กรุณากรอกให้ครบ 13 หลัก (ขาดอีก {13 - taxInfo.taxId.length} ตัว)</p>
              )}
            </div>

            {/* สาขา (โชว์เฉพาะนิติบุคคล) */}
            {taxInfo.type === 'company' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">สาขา <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap pt-2">
                    <input 
                      type="checkbox" 
                      name="isHeadOffice"
                      checked={taxInfo.isHeadOffice}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                    />
                    <span className="text-sm text-gray-700 font-medium">สำนักงานใหญ่</span>
                  </label>
                  
                  {!taxInfo.isHeadOffice && (
                    <input 
                      type="text" 
                      name="branchCode"
                      value={taxInfo.branchCode}
                      onChange={handleChange}
                      placeholder="รหัสสาขา (เช่น 00001)"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all animate-in fade-in zoom-in"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ที่อยู่สำหรับออกบิล */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                ที่อยู่สำหรับออกใบกำกับภาษี <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows="2" 
                name="address"
                value={taxInfo.address}
                onChange={handleChange}
                placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" 
                className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}