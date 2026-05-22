import React, { useState, useEffect } from 'react';
import { 
  FileText, Building2, User, CheckCircle2, ShieldCheck, 
  AlertCircle, Eye, EyeOff, Hash, MapPin, Loader2 
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { auth } from '../../firebase/config';
import { userService } from '../../firebase/userService';

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

  const [showTaxId, setShowTaxId] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  // 🚀 Smart Profile Binding: ดึงข้อมูลภาษีลับมาใส่ให้อัตโนมัติ
  useEffect(() => {
    const fetchSecureTaxInfo = async () => {
      // ดึงข้อมูลเฉพาะตอนที่เปิดขอใบกำกับ และยังไม่มีชื่อใน State
      if (requestTax && auth.currentUser && !checkoutState?.taxInfo?.name) {
        setIsFetchingInfo(true);
        try {
          // ดึงจากโซนปลอดภัย 100% (Sub-collection)
          const secureData = await userService.getPrivateTaxInfo(auth.currentUser.uid);
          if (secureData && secureData.taxId) {
            setTaxInfo(prev => ({
              ...prev,
              type: secureData.type || 'company',
              name: secureData.name || '',
              taxId: secureData.taxId || '',
              address: secureData.address || '',
              isHeadOffice: secureData.isHeadOffice ?? true,
              branchCode: secureData.branchCode || ''
            }));
          }
        } catch (error) {
          console.error("Error auto-filling secure tax info:", error);
        } finally {
          setIsFetchingInfo(false);
        }
      }
    };

    fetchSecureTaxInfo();
  }, [requestTax, checkoutState?.taxInfo?.name]);

  // 🛡 UX Validation: เช็คว่ากรอกข้อมูลสำคัญครบไหม (เพื่อโชว์ Badge)
  const isComplete = 
    taxInfo.name.length > 2 && 
    taxInfo.taxId.length === 13 && 
    taxInfo.address.length > 10 &&
    (taxInfo.type === 'personal' || taxInfo.isHeadOffice || taxInfo.branchCode.length >= 4);

  // ⏱ ประหยัด Performance: ซิงค์กลับไปที่ Cart Context (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCheckoutConfig({ requestTax, taxInfo });
    }, 300);
    return () => clearTimeout(timer);
  }, [requestTax, taxInfo, updateCheckoutConfig]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // ดักให้กรอกเฉพาะตัวเลขสำหรับ Tax ID และ Branch Code
    if (name === 'taxId' && value && !/^\d{0,13}$/.test(value)) return;
    if (name === 'branchCode' && value && !/^\d{0,5}$/.test(value)) return;

    setTaxInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 👁️ ฟังก์ชันช่วย Mask เลขบัตรประชาชน
  const getMaskedTaxId = (taxId) => {
    if (!taxId) return '';
    if (taxId.length <= 4) return taxId;
    return '•••••••••' + taxId.slice(-4);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 relative overflow-hidden transition-all duration-300">
      
      {/* 🌟 Header & Premium Toggle Switch */}
      <div className={`flex items-center justify-between transition-all duration-300 ${requestTax ? 'mb-6 pb-4 border-b border-slate-100' : ''}`}>
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className={`p-2 rounded-xl transition-colors duration-300 ${requestTax ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
              <FileText className="w-5 h-5" />
            </div>
            ต้องการใบกำกับภาษีเต็มรูปแบบ
          </h2>
          <p className={`text-xs mt-1 transition-colors duration-300 ${requestTax ? 'text-indigo-500 font-medium' : 'text-slate-400'}`}>
            สำหรับเบิกจ่ายบริษัท หรือลดหย่อนภาษี
          </p>
        </div>
        
        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => setRequestTax(!requestTax)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            requestTax ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <span className="sr-only">Toggle Tax Invoice</span>
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
              requestTax ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 📄 Form Content (Animated Expand) */}
      <div className={`grid transition-all duration-500 ease-in-out ${requestTax ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          
          {isFetchingInfo ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-sm font-medium">กำลังดึงข้อมูลผู้เสียภาษี...</p>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              
              {/* Type Selection */}
              <div className="flex flex-col sm:flex-row gap-4">
                <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                  taxInfo.type === 'personal' 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-[0_2px_10px_-3px_rgba(79,70,229,0.2)] ring-1 ring-indigo-600' 
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}>
                  <input 
                    type="radio" name="type" value="personal" 
                    checked={taxInfo.type === 'personal'} onChange={handleChange}
                    className="hidden" 
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${taxInfo.type === 'personal' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">บุคคลธรรมดา</span>
                    <span className="text-[11px] opacity-70">สำหรับนามบุคคลทั่วไป</span>
                  </div>
                </label>

                <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                  taxInfo.type === 'company' 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-[0_2px_10px_-3px_rgba(79,70,229,0.2)] ring-1 ring-indigo-600' 
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}>
                  <input 
                    type="radio" name="type" value="company" 
                    checked={taxInfo.type === 'company'} onChange={handleChange}
                    className="hidden" 
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${taxInfo.type === 'company' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">นิติบุคคล</span>
                    <span className="text-[11px] opacity-70">บริษัท / ห้างหุ้นส่วน</span>
                  </div>
                </label>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    {taxInfo.type === 'personal' ? <User className="w-4 h-4 text-slate-400" /> : <Building2 className="w-4 h-4 text-slate-400" />}
                    {taxInfo.type === 'personal' ? 'ชื่อ - นามสกุล' : 'ชื่อจดทะเบียนบริษัท / ห้างหุ้นส่วนจำกัด'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={taxInfo.name}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
                    placeholder={taxInfo.type === 'personal' ? 'เช่น นายสมชาย ใจดี' : 'เช่น บจก. ดีเอช โน้ตบุ๊ค (ไม่ต้องใส่คำว่า บริษัท)'}
                  />
                </div>

                <div className={taxInfo.type === 'personal' ? 'md:col-span-2' : 'md:col-span-1'}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-end">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-red-500">*</span></span>
                    {taxInfo.taxId && taxInfo.taxId.length === 13 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">รูปแบบถูกต้อง</span>
                    )}
                  </label>
                  
                  <div className="relative group">
                    <input
                      type={showTaxId ? "text" : "password"}
                      name="taxId"
                      value={showTaxId ? taxInfo.taxId : getMaskedTaxId(taxInfo.taxId)}
                      onChange={showTaxId ? handleChange : undefined}
                      onClick={() => setShowTaxId(true)}
                      className={`block w-full pl-4 pr-12 py-3 border rounded-xl focus:ring-2 transition-all font-mono tracking-widest text-base ${
                        !showTaxId 
                          ? 'bg-slate-100 border-slate-200 cursor-pointer select-none text-slate-500' 
                          : taxInfo.taxId.length === 13
                            ? 'bg-white border-emerald-300 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800'
                            : 'bg-white border-indigo-300 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800'
                      }`}
                      placeholder="XXXXXXXXXXXXX"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTaxId(!showTaxId)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                      title={showTaxId ? "ซ่อนข้อมูล" : "แสดงและแก้ไขข้อมูล"}
                    >
                      {showTaxId ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {taxInfo.taxId && taxInfo.taxId.length > 0 && taxInfo.taxId.length < 13 && showTaxId && (
                    <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                      <AlertCircle className="w-3 h-3" /> กรุณาระบุให้ครบ 13 หลัก
                    </p>
                  )}
                </div>

                {/* ฟิลด์เฉพาะนิติบุคคล */}
                {taxInfo.type === 'company' && (
                  <div className="md:col-span-1 animate-in fade-in slide-in-from-left-2 duration-300">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">สาขาจดทะเบียน</label>
                    <div className="flex flex-col gap-2 p-1">
                      <label className="flex items-center gap-2 cursor-pointer mt-1 group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            name="isHeadOffice"
                            checked={taxInfo.isHeadOffice}
                            onChange={handleChange}
                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer peer"
                          />
                        </div>
                        <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-700 transition-colors">สำนักงานใหญ่</span>
                      </label>
                      
                      <div className={`transition-all duration-300 overflow-hidden ${!taxInfo.isHeadOffice ? 'max-h-16 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input 
                            type="text" 
                            name="branchCode"
                            value={taxInfo.branchCode}
                            onChange={handleChange}
                            placeholder="รหัสสาขา (เช่น 00001)"
                            maxLength={5}
                            className="block w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-sm text-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    ที่อยู่สำหรับออกใบกำกับภาษี <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    rows="2" 
                    name="address"
                    value={taxInfo.address}
                    onChange={handleChange}
                    placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" 
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-800 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer Trust Badge */}
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  ข้อมูลส่วนนี้จะถูกส่งเข้าระบบบัญชีโดยตรง
                </div>

                {isComplete && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in duration-300">
                    <CheckCircle2 className="w-4 h-4" />
                    พร้อมออกใบกำกับภาษี
                  </span>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}