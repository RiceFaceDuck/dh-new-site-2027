import React, { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import { User, Phone, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PersonalInfoForm({ user, initialData, onRefresh }) {
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // โหลดข้อมูลเริ่มต้นเมื่อ Component ถูกเรียก หรือเมื่อ initialData มีการเปลี่ยนแปลง
  useEffect(() => {
    if (initialData || user) {
      setFormData({
        displayName: initialData?.displayName || user?.displayName || '',
        phoneNumber: initialData?.phoneNumber || ''
      });
    }
  }, [initialData, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // อนุญาตให้กรอกเฉพาะตัวเลขสำหรับเบอร์โทร
    if (name === 'phoneNumber' && value && !/^\d*$/.test(value)) return;
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const auth = getAuth();
      const db = getFirestore();

      // 1. ถ้าชื่อเปลี่ยน ให้อัปเดต Profile ในระบบ Auth ด้วย (สำคัญสำหรับการแสดงผลตอน Login)
      if (auth.currentUser && formData.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { 
          displayName: formData.displayName 
        });
      }

      // 2. อัปเดตข้อมูลลงฐานข้อมูล Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        lastUpdated: new Date().toISOString()
      }, { merge: true }); // ใช้ merge: true เพื่อไม่ให้ข้อมูลฟิลด์อื่นๆ (เช่น role, social links) หาย

      // 3. แสดงข้อความสำเร็จ
      setStatus({ type: 'success', message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว' });
      
      // 4. สั่งให้หน้าหลัก (TabOverview) ดึงข้อมูลใหม่มาแสดงทันที
      if (onRefresh) onRefresh();

      // เคลียร์ข้อความสำเร็จหลังจาก 3 วินาที
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);

    } catch (error) {
      console.error("Error saving personal info:", error);
      setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-[#0870B8]">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">ข้อมูลส่วนตัวพื้นฐาน</h3>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Display Name Input */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              ชื่อ-นามสกุล / ชื่อร้านค้า
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="ระบุชื่อที่ต้องการให้แสดงผล"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#0870B8] transition-colors text-sm text-gray-800"
                required
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              เบอร์โทรศัพท์ติดต่อ
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="08X-XXX-XXXX"
                maxLength={10}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#0870B8] transition-colors text-sm text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-medium">{status.message}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="pt-4 border-t border-gray-50 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || (formData.displayName === (initialData?.displayName || '') && formData.phoneNumber === (initialData?.phoneNumber || ''))}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0870B8] hover:bg-[#065a96] text-white font-medium rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                บันทึกข้อมูล
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}