import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { 
  User, Save, CheckCircle2, AlertCircle, 
  Loader2
} from 'lucide-react';

import ContactInfoSection from './sections/ContactInfoSection';
import ShippingAddressSection from './sections/ShippingAddressSection';
import MapEcosystemSection from './sections/MapEcosystemSection';

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
        <ContactInfoSection formData={formData} handleChange={handleChange} />

        {/* =========================================
            Section 2: ข้อมูลที่อยู่ (อัปเกรดใหม่)
        ========================================= */}
        <ShippingAddressSection formData={formData} handleChange={handleChange} />

        {/* =========================================
            Section 3: แผนที่ Google Maps
        ========================================= */}
        <MapEcosystemSection formData={formData} handleChange={handleChange} isValidMapUrl={isValidMapUrl} />

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