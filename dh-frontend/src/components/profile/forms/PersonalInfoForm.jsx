import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { 
  User, Phone, Save, CheckCircle2, AlertCircle, 
  Loader2, MapPin, Map, Navigation, Home, 
  Building, Building2, Hash 
} from 'lucide-react';

export default function PersonalInfoForm({ user, initialData, onRefresh }) {
  // 🚀 โครงสร้าง State ใหม่ รองรับ Address แบบแยกส่วน
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    mapUrl: '',
    address: {
      addressLine: '',
      subDistrict: '',
      district: '',
      province: '',
      zipCode: ''
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // 1. โหลดข้อมูลเริ่มต้นและแกะโครงสร้าง Ecosystem & Address
  useEffect(() => {
    if (initialData || user) {
      setFormData({
        displayName: initialData?.displayName || user?.displayName || '',
        phoneNumber: initialData?.phoneNumber || '',
        mapUrl: initialData?.ecosystem?.mapUrl || '',
        address: {
          addressLine: initialData?.address?.addressLine || '',
          subDistrict: initialData?.address?.subDistrict || '',
          district: initialData?.address?.district || '',
          province: initialData?.address?.province || '',
          zipCode: initialData?.address?.zipCode || ''
        }
      });
    }
  }, [initialData, user]);

  // 2. จัดการการเปลี่ยนแปลงข้อมูล พร้อมระบบ Smart Validation 
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ดักให้กรอกเฉพาะตัวเลข และจำกัดความยาว
    if (name === 'phoneNumber' && value && !/^\d{0,10}$/.test(value)) return;
    if (name === 'address.zipCode' && value && !/^\d{0,5}$/.test(value)) return;
    
    // 🧠 จัดการ State ที่เป็น Nested Object (Address)
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (status.message) setStatus({ type: '', message: '' });
  };

  const isValidMapUrl = (url) => {
    if (!url) return true;
    return /^(https?:\/\/)?(www\.)?(goo\.gl\/maps|maps\.app\.goo\.gl|google\.com\/maps).*$/.test(url);
  };

  // 🧠 เช็คว่ามีการแก้ไขข้อมูลหรือไม่ (Deep Compare ประหยัด Firebase Writes)
  const hasChanges = () => {
    const initName = initialData?.displayName || user?.displayName || '';
    const initPhone = initialData?.phoneNumber || '';
    const initMap = initialData?.ecosystem?.mapUrl || '';
    const initAddr = initialData?.address || {};
    
    return formData.displayName !== initName ||
           formData.phoneNumber !== initPhone ||
           formData.mapUrl !== initMap ||
           formData.address.addressLine !== (initAddr.addressLine || '') ||
           formData.address.subDistrict !== (initAddr.subDistrict || '') ||
           formData.address.district !== (initAddr.district || '') ||
           formData.address.province !== (initAddr.province || '') ||
           formData.address.zipCode !== (initAddr.zipCode || '');
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
      
      // อัปเดตข้อมูลลง Firestore (โครงสร้างใหม่ ไม่มี taxId, เพิ่ม address)
      await setDoc(userRef, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        ecosystem: {
          mapUrl: formData.mapUrl
        },
        updatedAt: new Date()
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
      setTimeout(() => {
        if (status.type === 'success') setStatus({ type: '', message: '' });
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-[#0870B8]" />
          ข้อมูลส่วนตัวพื้นฐาน
        </h3>
        <p className="text-sm text-slate-500 mt-1">จัดการข้อมูลการติดต่อ และที่อยู่สำหรับการจัดส่ง</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* =========================================
            Section 1: ข้อมูลการติดต่อพื้นฐาน
        ========================================= */}
        <div className="space-y-5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0870B8]"></span>
            ข้อมูลผู้ติดต่อ (Contact Info)
          </h4>
          
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
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0870B8]/10 focus:border-[#0870B8] transition-all bg-slate-50 focus:bg-white text-slate-800"
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
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0870B8]/10 focus:border-[#0870B8] transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium"
                  placeholder="08X-XXX-XXXX"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            Section 2: ข้อมูลที่อยู่ (อัปเกรดใหม่)
        ========================================= */}
        <div className="space-y-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ที่อยู่จัดส่งสินค้า (Shipping Address)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* บ้านเลขที่ ซอย ถนน */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">บ้านเลขที่ / หมู่ / ซอย / ถนน / อาคาร</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-start pt-3 pointer-events-none">
                  <Home className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <textarea
                  name="address.addressLine"
                  value={formData.address.addressLine}
                  onChange={handleChange}
                  rows="2"
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800 resize-none"
                  placeholder="เช่น 123/45 หมู่ 6 ซอยสุขุมวิท 1 ถ.สุขุมวิท อาคารเอ ชั้น 2..."
                ></textarea>
              </div>
            </div>

            {/* แขวง/ตำบล */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">แขวง / ตำบล</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="address.subDistrict"
                  value={formData.address.subDistrict}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
                  placeholder="ตำบล / แขวง"
                />
              </div>
            </div>

            {/* เขต/อำเภอ */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">เขต / อำเภอ</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="address.district"
                  value={formData.address.district}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
                  placeholder="อำเภอ / เขต"
                />
              </div>
            </div>

            {/* จังหวัด */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">จังหวัด</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="address.province"
                  value={formData.address.province}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800"
                  placeholder="จังหวัด"
                />
              </div>
            </div>

            {/* รหัสไปรษณีย์ */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">รหัสไปรษณีย์</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  maxLength={5}
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-mono tracking-widest"
                  placeholder="10XXX"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            Section 3: แผนที่ Google Maps
        ========================================= */}
        <div className="bg-emerald-50/50 border border-emerald-100/60 p-5 rounded-xl mt-6">
          <label className="block text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2">
            <Map className="w-4 h-4" /> พิกัดร้านค้า (Google Maps)
          </label>
          <p className="text-xs text-emerald-600 mb-3">ใช้สำหรับการเข้าร่วมระบบ Partner Ecosystem ของ DH Notebook</p>
          
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
                  : 'border-emerald-200/60 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white'
              }`}
              placeholder="https://maps.app.goo.gl/..."
            />
            
            {/* Gimmick: ปุ่มพรีวิวแผนที่สีเขียว */}
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
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-medium rounded-xl transition-all duration-300 focus:ring-4 focus:ring-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึก...</>
            ) : (
              <><Save className="w-5 h-5" /> บันทึกการเปลี่ยนแปลง</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}