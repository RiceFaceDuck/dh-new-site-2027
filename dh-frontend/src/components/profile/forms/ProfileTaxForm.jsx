import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, User, FileText, MapPin, Save, 
  Loader2, CheckCircle2, AlertCircle, ShieldCheck, 
  Eye, EyeOff, Hash
} from 'lucide-react';
import { userService } from '../../../firebase/userService';

export default function ProfileTaxForm({ user }) {
  // 1. State สำหรับเก็บข้อมูล
  const [formData, setFormData] = useState({
    type: 'personal', // 'personal' | 'company'
    name: '',
    taxId: '',
    address: '',
    isHeadOffice: true,
    branchCode: ''
  });
  
  // State สำหรับเปรียบเทียบข้อมูลเดิม
  const [initialData, setInitialData] = useState(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showTaxId, setShowTaxId] = useState(false);

  // 2. โหลดข้อมูลความลับจาก Sub-collection
  useEffect(() => {
    let isMounted = true;
    const fetchTaxInfo = async () => {
      if (!user?.uid) return;
      setIsLoading(true);
      try {
        const taxData = await userService.getPrivateTaxInfo(user.uid);
        if (isMounted) {
          const loadedData = {
            type: taxData?.type || 'personal',
            name: taxData?.name || '',
            taxId: taxData?.taxId || '',
            address: taxData?.address || '',
            isHeadOffice: taxData?.isHeadOffice ?? true,
            branchCode: taxData?.branchCode || ''
          };
          setFormData(loadedData);
          setInitialData(loadedData); // จำค่าดั้งเดิมไว้
        }
      } catch (error) {
        console.error("Error fetching tax info:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTaxInfo();
    return () => { isMounted = false; };
  }, [user]);

  // 3. จัดการ Input & Validation
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // ดักให้กรอกเฉพาะตัวเลขสำหรับ Tax ID และ Branch Code
    if (name === 'taxId' && value && !/^\d{0,13}$/.test(value)) return;
    if (name === 'branchCode' && value && !/^\d{0,5}$/.test(value)) return;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (status.message) setStatus({ type: '', message: '' });
  };

  // 🧠 เช็คว่ามีการแก้ไขข้อมูลหรือไม่ (เพื่อปิดปุ่ม Save)
  const hasChanges = () => {
    if (!initialData) return true;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  // 4. บันทึกข้อมูลแบบ Secure
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !hasChanges()) return;

    // Basic Validation
    if (formData.taxId && formData.taxId.length !== 13) {
      setStatus({ type: 'error', message: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลักถ้วน' });
      return;
    }
    if (formData.type === 'company' && !formData.isHeadOffice && formData.branchCode.length < 4) {
      setStatus({ type: 'error', message: 'กรุณาระบุรหัสสาขาให้ถูกต้อง (4-5 หลัก)' });
      return;
    }

    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      // 🔒 ส่งข้อมูลเข้าฟังก์ชัน updatePrivateTaxInfo เพื่อเก็บในโซนปลอดภัย
      await userService.updatePrivateTaxInfo(user.uid, formData);
      
      // อัปเดต Initial Data ให้ตรงกับที่เพิ่งเซฟไป
      setInitialData({ ...formData });
      
      setStatus({ type: 'success', message: 'บันทึกข้อมูลผู้เสียภาษีเรียบร้อยแล้ว แหล่งเก็บข้อมูลปลอดภัย 100%' });
      
      // Auto-hide Tax ID หลังบันทึกเสร็จเพื่อความปลอดภัย
      setShowTaxId(false);
    } catch (error) {
      setStatus({ type: 'error', message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        if (status.type === 'success') setStatus({ type: '', message: '' });
      }, 4000);
    }
  };

  // 👁️ ฟังก์ชันช่วย Mask เลขบัตรประชาชน
  const getMaskedTaxId = (taxId) => {
    if (!taxId) return '';
    if (taxId.length <= 4) return taxId;
    return '•••••••••' + taxId.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <ShieldCheck className="w-10 h-10 text-indigo-200 absolute" />
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative" />
        </div>
        <p className="text-sm font-bold text-slate-500 mt-4 tracking-wide">กำลังเชื่อมต่อฐานข้อมูลความปลอดภัย...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* 🛡️ Header: Secure Zone */}
      <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            ข้อมูลผู้เสียภาษี (Tax Information)
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ข้อมูลส่วนนี้ถูกเข้ารหัสและจัดเก็บใน Private Storage สำหรับการออกใบกำกับภาษีเท่านั้น
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-7">
        
        {/* ประเภทผู้เสียภาษี */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">ประเภทผู้จดทะเบียน</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
              formData.type === 'personal' 
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-[0_2px_10px_-3px_rgba(79,70,229,0.2)] ring-1 ring-indigo-600' 
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
            }`}>
              <input 
                type="radio" name="type" value="personal" 
                checked={formData.type === 'personal'} onChange={handleChange}
                className="hidden" 
              />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.type === 'personal' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">บุคคลธรรมดา</span>
                <span className="text-[11px] opacity-70">สำหรับนามบุคคลทั่วไป</span>
              </div>
            </label>

            <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
              formData.type === 'company' 
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-[0_2px_10px_-3px_rgba(79,70,229,0.2)] ring-1 ring-indigo-600' 
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300'
            }`}>
              <input 
                type="radio" name="type" value="company" 
                checked={formData.type === 'company'} onChange={handleChange}
                className="hidden" 
              />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.type === 'company' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">นิติบุคคล</span>
                <span className="text-[11px] opacity-70">บริษัทจำกัด / ห้างหุ้นส่วน</span>
              </div>
            </label>
          </div>
        </div>

        {/* ข้อมูลพื้นฐาน */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {formData.type === 'personal' ? 'ชื่อ - นามสกุล' : 'ชื่อจดทะเบียนบริษัท / ห้างหุ้นส่วนจำกัด'}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {formData.type === 'personal' ? (
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                ) : (
                  <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                )}
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
                placeholder={formData.type === 'personal' ? 'เช่น นายสมชาย ใจดี' : 'เช่น บจก. ดีเอช โน้ตบุ๊ค (ไม่ต้องใส่คำว่า บริษัท)'}
              />
            </div>
          </div>

          <div className={formData.type === 'personal' ? 'md:col-span-2' : 'md:col-span-1'}>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between items-end">
              <span>เลขประจำตัวผู้เสียภาษี (13 หลัก)</span>
              {formData.taxId && formData.taxId.length === 13 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">รูปแบบถูกต้อง</span>
              )}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FileText className={`h-5 w-5 transition-colors ${formData.taxId.length === 13 ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
              </div>
              
              {/* 👁️ Data Masking Input */}
              <input
                type={showTaxId ? "text" : "password"}
                name="taxId"
                value={showTaxId ? formData.taxId : getMaskedTaxId(formData.taxId)}
                onChange={showTaxId ? handleChange : undefined}
                onClick={() => setShowTaxId(true)}
                className={`block w-full pl-11 pr-12 py-2.5 border rounded-xl focus:ring-2 transition-all font-mono tracking-widest text-base ${
                  !showTaxId 
                    ? 'bg-slate-100 border-slate-200 cursor-pointer select-none text-slate-500' 
                    : formData.taxId.length === 13
                      ? 'bg-white border-emerald-300 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800'
                      : 'bg-white border-indigo-300 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800'
                }`}
                placeholder="XXXXXXXXXXXXX"
              />
              
              <button
                type="button"
                onClick={() => setShowTaxId(!showTaxId)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                title={showTaxId ? "ซ่อนข้อมูล" : "แสดงและแก้ไขข้อมูล"}
              >
                {showTaxId ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {formData.taxId && formData.taxId.length > 0 && formData.taxId.length < 13 && showTaxId && (
              <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                <AlertCircle className="w-3 h-3" /> กรุณาระบุให้ครบ 13 หลัก
              </p>
            )}
          </div>

          {/* ฟิลด์เฉพาะนิติบุคคล (สำนักงานใหญ่ / สาขา) */}
          {formData.type === 'company' && (
            <div className="md:col-span-1 animate-in fade-in slide-in-from-left-2 duration-300">
              <label className="block text-sm font-semibold text-slate-700 mb-2">สาขาจดทะเบียน</label>
              <div className="flex flex-col gap-2 p-1">
                <label className="flex items-center gap-2 cursor-pointer mt-1 group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      name="isHeadOffice"
                      checked={formData.isHeadOffice}
                      onChange={handleChange}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition-all cursor-pointer peer"
                    />
                  </div>
                  <span className="text-sm text-slate-700 font-medium group-hover:text-indigo-700 transition-colors">สำนักงานใหญ่</span>
                </label>
                
                {/* อนิเมชั่นขยายช่องกรอกรหัสสาขา */}
                <div className={`transition-all duration-300 overflow-hidden ${!formData.isHeadOffice ? 'max-h-16 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      name="branchCode"
                      value={formData.branchCode}
                      onChange={handleChange}
                      placeholder="รหัสสาขา (เช่น 00001)"
                      maxLength={5}
                      required={!formData.isHeadOffice}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-sm text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">ที่อยู่สำหรับออกใบกำกับภาษี</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-start pt-3 pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white text-slate-800 resize-none leading-relaxed"
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="font-medium">{status.message}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="pt-5 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !hasChanges()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> กำลังเข้ารหัสบันทึก...</>
            ) : (
              <><Save className="w-5 h-5" /> ยืนยันข้อมูลภาษี</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}