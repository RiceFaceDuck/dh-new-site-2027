import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { User, Phone, Save, CheckCircle2, AlertCircle, Loader2, FileText, MapPin, Map, Navigation } from 'lucide-react';

export default function PersonalInfoForm({ user, initialData, onRefresh }) {
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    taxId: '',
    mapUrl: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // 1. โหลดข้อมูลเริ่มต้นและแกะโครงสร้าง Ecosystem
  useEffect(() => {
    if (initialData || user) {
      setFormData({
        displayName: initialData?.displayName || user?.displayName || '',
        phoneNumber: initialData?.phoneNumber || '',
        taxId: initialData?.taxId || '',
        mapUrl: initialData?.ecosystem?.mapUrl || ''
      });
    }
  }, [initialData, user]);

  // 2. จัดการการเปลี่ยนแปลงข้อมูล พร้อมระบบ Smart Validation 
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ดักให้กรอกเฉพาะตัวเลข และจำกัดความยาว
    if (name === 'phoneNumber' && value && !/^\d{0,10}$/.test(value)) return;
    if (name === 'taxId' && value && !/^\d{0,13}$/.test(value)) return;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  // เช็คว่าลิงก์แผนที่มาจาก Google Maps จริงหรือไม่
  const isValidMapUrl = (url) => {
    if (!url) return true;
    return /^(https?:\/\/)?(www\.)?(goo\.gl\/maps|maps\.app\.goo\.gl|google\.com\/maps).*$/.test(url);
  };

  // เช็คว่ามีการแก้ไขข้อมูลหรือไม่ (ประหยัด Firebase Writes)
  const hasChanges = () => {
    const initName = initialData?.displayName || user?.displayName || '';
    const initPhone = initialData?.phoneNumber || '';
    const initTaxId = initialData?.taxId || '';
    const initMap = initialData?.ecosystem?.mapUrl || '';
    
    return formData.displayName !== initName ||
           formData.phoneNumber !== initPhone ||
           formData.taxId !== initTaxId ||
           formData.mapUrl !== initMap;
  };

  // 3. บันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (formData.mapUrl && !isValidMapUrl(formData.mapUrl)) {
      setStatus({ type: 'error', message: 'กรุณาระบุลิงก์ Google Maps ให้ถูกต้อง' });
      return;
    }

    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      
      // อัปเดตข้อมูลลง Firestore (จัดโครงสร้างให้รองรับ Ecosystem)
      await setDoc(userRef, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        taxId: formData.taxId,
        ecosystem: {
          mapUrl: formData.mapUrl
        }
      }, { merge: true });

      // ซิงค์ชื่อใหม่เข้ากับระบบ Authentication กลางของ Firebase
      if (user.displayName !== formData.displayName) {
        await updateProfile(user, { displayName: formData.displayName });
      }

      setStatus({ type: 'success', message: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว' });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Save Profile Error:", error);
      setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setIsSaving(false);
      // Gimmick: เคลียร์ข้อความสำเร็จอัตโนมัติหลัง 3 วินาที
      setTimeout(() => {
        if (status.type === 'success') setStatus({ type: '', message: '' });
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-[#0870B8]" />
          ข้อมูลส่วนตัวพื้นฐาน
        </h3>
        <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลการติดต่อ ข้อมูลภาษี และพิกัดร้านค้าของคุณ</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* แถวที่ 1: ชื่อ และ เบอร์โทร */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อ - นามสกุล / ชื่อร้านค้า</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#0870B8] transition-colors" />
              </div>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0870B8]/20 focus:border-[#0870B8] transition-all bg-slate-50 focus:bg-white text-slate-800"
                placeholder="ระบุชื่อที่ต้องการให้แสดง"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">เบอร์โทรศัพท์ติดต่อ</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-[#0870B8] transition-colors" />
              </div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0870B8]/20 focus:border-[#0870B8] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
                placeholder="08X-XXX-XXXX"
              />
            </div>
          </div>
        </div>

        {/* แถวที่ 2: เลขที่ผู้เสียภาษี */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-slate-400 font-normal ml-1">(ถ้ามี)</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-slate-400 group-focus-within:text-[#0870B8] transition-colors" />
            </div>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0870B8]/20 focus:border-[#0870B8] transition-all bg-slate-50 focus:bg-white text-slate-800 font-mono tracking-widest"
              placeholder="XXXXXXXXXXXXX"
            />
          </div>
          {formData.taxId && formData.taxId.length > 0 && formData.taxId.length < 13 && (
             <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" /> กรุณาระบุให้ครบ 13 หลัก
             </p>
          )}
        </div>

        {/* แถวที่ 3: แผนที่ Google Maps */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-xl">
          <label className="block text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> พิกัดร้านค้า / สถานที่จัดส่ง (Google Maps)
          </label>
          <p className="text-xs text-emerald-600 mb-3">ใช้สำหรับการจัดส่งสินค้าและเข้าสู่ระบบ Ecosystem ของ DH Notebook</p>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Navigation className={`h-5 w-5 transition-colors ${formData.mapUrl && isValidMapUrl(formData.mapUrl) ? 'text-emerald-500' : 'text-slate-400'}`} />
            </div>
            <input
              type="url"
              name="mapUrl"
              value={formData.mapUrl}
              onChange={handleChange}
              className={`block w-full pl-11 pr-12 py-2.5 border rounded-xl transition-all focus:bg-white text-slate-800 ${
                formData.mapUrl && !isValidMapUrl(formData.mapUrl) 
                  ? 'border-rose-300 focus:ring-rose-500/20 bg-rose-50' 
                  : 'border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white'
              }`}
              placeholder="https://maps.app.goo.gl/..."
            />
            
            {/* Gimmick: ปุ่มพรีวิวแผนที่สีเขียว (คลิกเพื่อทดสอบลิงก์ได้เลย) */}
            {formData.mapUrl && isValidMapUrl(formData.mapUrl) && (
              <a 
                href={formData.mapUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                title="ทดสอบลิงก์แผนที่"
              >
                <Map className="w-4 h-4" />
              </a>
            )}
          </div>
          
          {/* ข้อความแจ้งเตือนลิงก์ผิด */}
          {formData.mapUrl && !isValidMapUrl(formData.mapUrl) && (
            <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
              <AlertCircle className="w-3 h-3" /> กรุณาตรวจสอบลิงก์ (ต้องเป็น Google Maps เท่านั้น)
            </p>
          )}
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
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !hasChanges()}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-medium rounded-xl transition-all duration-300 focus:ring-4 focus:ring-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:shadow-lg"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึก...</>
            ) : (
              <><Save className="w-5 h-5" /> บันทึกข้อมูล</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}