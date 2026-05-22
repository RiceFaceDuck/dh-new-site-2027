import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, Building2, CheckCircle2, ShieldCheck, Navigation, AlertCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function AddressSelector({ orderMode = 'retail' }) {
  const { checkoutState, updateCheckoutConfig } = useCart();
  
  // ⚡️ Local State สำหรับฟอร์ม ดึงค่าเก่ามาจาก Context (ถ้ามี)
  const [formData, setFormData] = useState({
    fullName: checkoutState?.addressInfo?.fullName || '',
    phone: checkoutState?.addressInfo?.phone || '',
    companyName: checkoutState?.addressInfo?.companyName || '',
    address: checkoutState?.addressInfo?.address || '',
    saveAsDefault: checkoutState?.addressInfo?.saveAsDefault ?? true
  });

  // 🛠 ฟังก์ชันอัจฉริยะ: แปลงข้อมูลที่อยู่ให้เป็นข้อความที่อ่านง่าย (รองรับทั้งแบบเก่าและแบบใหม่)
  const formatProfileAddress = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr; // รองรับข้อมูลเก่า
    const parts = [
      addr.addressLine, 
      addr.subDistrict, 
      addr.district, 
      addr.province, 
      addr.zipCode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '';
  };

  // 🚀 Smart Profile Binding: ดึงข้อมูลที่อยู่จาก User Profile มาแสดงเป็นค่าเริ่มต้น
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser && !checkoutState?.addressInfo?.fullName) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // ดึงข้อมูลภาษีลับ (Private Tax Info) เพื่อใช้ชื่อบริษัท
            let taxInfoName = '';
            try {
              const taxDoc = await getDoc(doc(db, "users", auth.currentUser.uid, 'private', 'taxInfo'));
              if (taxDoc.exists()) taxInfoName = taxDoc.data().name;
            } catch (e) {
              console.warn('Could not fetch private tax info', e);
            }

            if (data.address || data.defaultDeliveryNote || data.displayName || taxInfoName) {
               setFormData(prev => ({
                 ...prev,
                 fullName: taxInfoName || data.displayName || prev.fullName,
                 // ใช้ Smart Formatter เพื่อรองรับ Object Address แบบใหม่
                 address: formatProfileAddress(data.address) || data.defaultDeliveryNote || prev.address,
                 companyName: taxInfoName || prev.companyName,
                 phone: data.phoneNumber || data.phone || prev.phone
               }));
            }
          }
        } catch (error) {
          console.error("Error fetching user profile for auto-fill", error);
        }
      }
    };
    fetchUserProfile();
  }, [checkoutState?.addressInfo?.fullName]);

  // 🛡 UX Validation: เช็คว่ากรอกข้อมูลสำคัญครบหรือยัง
  const isComplete = orderMode === 'retail' 
    ? formData.fullName.length > 2 && formData.phone.length >= 12 && formData.address.length > 10
    : formData.companyName.length > 2 && formData.fullName.length > 2 && formData.phone.length >= 12 && formData.address.length > 10;

  const [errors, setErrors] = useState({});
  const validatePhone = (phone) => {
    const raw = phone.replace(/\D/g, '');
    return /^0\d{9}$/.test(raw);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newErrors = { ...errors };

    // 🪄 ลูกเล่น UX: จัดฟอร์แมตเบอร์โทรศัพท์อัตโนมัติ (08X-XXX-XXXX)
    if (name === 'phone') {
      let val = value.replace(/\D/g, ''); // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
      if (val.length > 10) val = val.substring(0, 10); // ล็อกสูงสุด 10 ตัว
      
      let formatted = val;
      if (val.length > 3 && val.length <= 6) {
        formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
      } else if (val.length > 6) {
        formatted = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
      }
      
      setFormData(prev => ({ ...prev, [name]: formatted }));
      if (formatted.length > 0 && !validatePhone(formatted)) {
        newErrors.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 10 หลัก)';
      } else {
        delete newErrors.phone;
      }
      setErrors(newErrors);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ⏱ ประหยัด Performance: อัปเดตกลับไปที่ Context เมื่อหยุดพิมพ์ 300ms (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCheckoutConfig({ addressInfo: formData });
    }, 300);
    return () => clearTimeout(timer);
  }, [formData, updateCheckoutConfig]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 relative overflow-hidden transition-all duration-300">
      {/* Decorative background accent (Deep Luxury Style) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10 blur-2xl"></div>
      
      {/* หัวข้อ Component */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className={`p-2 rounded-xl ${orderMode === 'wholesale' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
            <MapPin className="w-5 h-5" />
          </div>
          {orderMode === 'wholesale' ? 'ข้อมูลร้านค้าและสถานที่จัดส่ง' : 'ข้อมูลผู้รับและที่อยู่จัดส่ง'}
        </h2>
        {/* Badge แจ้งเตือนเมื่อข้อมูลพร้อม */}
        {isComplete && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/50 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-4 h-4" />
            ข้อมูลครบถ้วน
          </span>
        )}
      </div>

      <div className="space-y-5 z-10 relative">
        {/* ฟิลด์เฉพาะกรณี "ขอราคาส่ง" */}
        {orderMode === 'wholesale' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              ชื่อร้านค้า / บริษัท / ช่าง <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="เช่น บริษัท DD Data IT จำกัด" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 text-slate-800"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ชื่อผู้รับ */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              ชื่อ-นามสกุล ผู้รับ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="เช่น สมชาย ใจดี" 
              className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 transition-all duration-200 text-slate-800 ${
                orderMode === 'wholesale' ? 'focus:border-amber-500 focus:ring-amber-500/20' : 'focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
          </div>
          {/* เบอร์โทรศัพท์ */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08X-XXX-XXXX" 
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 transition-all duration-200 text-slate-800 font-medium ${
                errors.phone 
                  ? 'border-red-300 bg-red-50 focus:ring-red-500/20 focus:border-red-500' 
                  : formData.phone.length > 0 && formData.phone.length < 12 
                    ? 'border-amber-300 bg-amber-50 focus:ring-amber-500/20 focus:border-amber-500' 
                    : orderMode === 'wholesale'
                      ? 'border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:bg-white'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 focus:bg-white'
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium animate-fade-in">
                <AlertCircle className="w-3 h-3" /> {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* ที่อยู่แบบ Textarea */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-slate-400" />
            ที่อยู่จัดส่งโดยละเอียด <span className="text-red-500">*</span>
          </label>
          <textarea 
            rows="3" 
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" 
            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 transition-all duration-200 resize-none leading-relaxed text-slate-800 ${
              orderMode === 'wholesale' ? 'focus:border-amber-500 focus:ring-amber-500/20' : 'focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
          />
          <p className="text-xs text-slate-400 mt-1.5 pl-1 font-medium">กรุณาระบุรหัสไปรษณีย์ให้ถูกต้อง เพื่อความรวดเร็วในการคัดแยกพัสดุ</p>
        </div>

        {/* Smart UX: Save to profile feature (Custom Checkbox) */}
        <div className="pt-5 mt-2 border-t border-slate-100 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                name="saveAsDefault"
                checked={formData.saveAsDefault}
                onChange={handleChange}
                className="peer sr-only" 
              />
              <div className={`w-5 h-5 bg-slate-100 border-2 border-slate-300 rounded peer-checked:border-indigo-600 transition-all duration-200 ${
                orderMode === 'wholesale' ? 'peer-checked:bg-amber-500 peer-checked:border-amber-500' : 'peer-checked:bg-indigo-600 peer-checked:border-indigo-600'
              }`}></div>
              <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
            </div>
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
              บันทึกเป็นที่อยู่เริ่มต้น สำหรับครั้งต่อไป
            </span>
          </label>

          {/* Trust Element */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            เข้ารหัสข้อมูลปลอดภัย 100%
          </div>
        </div>

      </div>
    </div>
  );
}