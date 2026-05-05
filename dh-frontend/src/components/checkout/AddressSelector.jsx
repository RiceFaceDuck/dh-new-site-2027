import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, Building2, CheckCircle2, ShieldCheck, Navigation } from 'lucide-react';
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

  // 🚀 Smart Profile Binding: ดึงข้อมูลที่อยู่จาก User Profile มาแสดงเป็นค่าเริ่มต้น
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser && !checkoutState?.addressInfo?.fullName) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.taxInfo || data.defaultDeliveryNote || data.displayName) {
               setFormData(prev => ({
                 ...prev,
                 fullName: data.taxInfo?.name || data.displayName || prev.fullName,
                 address: data.taxInfo?.address || data.defaultDeliveryNote || prev.address,
                 companyName: data.taxInfo?.name || prev.companyName,
                 phone: data.phone || prev.phone
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
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-10"></div>
      
      {/* หัวข้อ Component */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MapPin className={`w-6 h-6 ${orderMode === 'wholesale' ? 'text-orange-500' : 'text-blue-600'}`} />
          {orderMode === 'wholesale' ? 'ข้อมูลร้านค้าและสถานที่จัดส่ง' : 'ข้อมูลผู้รับและที่อยู่จัดส่ง'}
        </h2>
        {/* Badge แจ้งเตือนเมื่อข้อมูลพร้อม */}
        {isComplete && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full animate-in fade-in zoom-in duration-300 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
            ข้อมูลครบถ้วน
          </span>
        )}
      </div>

      <div className="space-y-5 z-10 relative">
        {/* ฟิลด์เฉพาะกรณี "ขอราคาส่ง" */}
        {orderMode === 'wholesale' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-gray-400" />
              ชื่อร้านค้า / บริษัท / ช่าง <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="เช่น บริษัท DD Data IT จำกัด" 
              className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ชื่อผู้รับ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400" />
              ชื่อ-นามสกุล ผู้รับ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="เช่น สมชาย ใจดี" 
              className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
          {/* เบอร์โทรศัพท์ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-gray-400" />
              เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08X-XXX-XXXX" 
              className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm outline-none ${errors.phone ? 'border-red-300 bg-red-50' : formData.phone.length > 0 && formData.phone.length < 12 ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* ที่อยู่แบบ Textarea */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-gray-400" />
            ที่อยู่จัดส่งโดยละเอียด <span className="text-red-500">*</span>
          </label>
          <textarea 
            rows="3" 
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" 
            className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none leading-relaxed"
          />
          <p className="text-xs text-gray-400 mt-1.5 pl-1">กรุณาระบุรหัสไปรษณีย์ให้ถูกต้อง เพื่อความรวดเร็วในการคัดแยกพัสดุ</p>
        </div>

        {/* Smart UX: Save to profile feature (Custom Checkbox) */}
        <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input 
                type="checkbox" 
                name="saveAsDefault"
                checked={formData.saveAsDefault}
                onChange={handleChange}
                className="peer sr-only" 
              />
              <div className="w-5 h-5 bg-gray-100 border-2 border-gray-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200"></div>
              <CheckCircle2 className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              บันทึกเป็นที่อยู่เริ่มต้น สำหรับครั้งต่อไป
            </span>
          </label>

          {/* Trust Element */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            เข้ารหัสข้อมูลปลอดภัย
          </div>
        </div>

      </div>
    </div>
  );
}