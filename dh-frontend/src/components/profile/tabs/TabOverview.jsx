import React, { useState, useEffect } from 'react';
import { Store, MapPin, Receipt, Link as LinkIcon, ShieldCheck, Wrench, Award, Upload, Save, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase/config'; // แก้ไข Path ให้ถูกต้องตรงกับโครงสร้าง src

const TabOverview = ({ userProfile }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // 1. ผูก State กับข้อมูล userProfile ที่ส่งมาจากด้านนอก
  const [formData, setFormData] = useState({
    accountName: '',
    contactName: '', // 🚀 เพิ่มฟิลด์ชื่อผู้ติดต่อ
    phone: '',       // 🚀 เพิ่มฟิลด์เบอร์โทร
    address: '',
    shopInfo: {
      shopName: '',
      mapUrl: '',
      services: {
        screen_keyboard: false,
        board_chip: false,
        software_os: false,
        server_network: false,
        buy_secondhand: false,
        onsite: false,
        machine_robot: false,
        ai_smarthome: false
      },
      social: { youtube: '', tiktok: '', facebook: '' },
      tax: { name: '', taxId: '', address: '' }
    },
    settings: {
      badgeEnabled: true,
      badgeType: '🏆 สมาชิกผู้สนับสนุน (Prime Member)'
    }
  });

  // 2. ดึงข้อมูลครั้งแรกเมื่อ Component โหลด
  useEffect(() => {
    if (userProfile) {
      setFormData({
        accountName: userProfile.accountName || '',
        contactName: userProfile.contactName || '', // 🚀 โหลดค่าชื่อผู้ติดต่อ
        phone: userProfile.phone || '',             // 🚀 โหลดค่าเบอร์โทร
        address: userProfile.address || '',
        shopInfo: {
          shopName: userProfile.shopInfo?.shopName || '',
          mapUrl: userProfile.shopInfo?.mapUrl || '',
          services: { ...formData.shopInfo.services, ...userProfile.shopInfo?.services },
          social: { ...formData.shopInfo.social, ...userProfile.shopInfo?.social },
          tax: { ...formData.shopInfo.tax, ...userProfile.shopInfo?.tax }
        },
        settings: {
          badgeEnabled: userProfile.settings?.badgeEnabled ?? true,
          badgeType: userProfile.settings?.badgeType || '🏆 สมาชิกผู้สนับสนุน (Prime Member)'
        }
      });
    }
  }, [userProfile]);

  // 3. ฟังก์ชันจัดการการเปลี่ยนค่า Input ต่างๆ
  const handleChange = (e, section, subSection = null) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    if (section === 'root') {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    } else if (subSection) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subSection]: { ...prev[section][subSection], [name]: finalValue }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [name]: finalValue }
      }));
    }
  };

  // 4. 🚀 ฟังก์ชันบันทึกข้อมูลเข้า Firestore และสร้าง Log ส่งไปให้ Backoffice
  const handleSave = async () => {
    if (!userProfile?.uid) return;
    
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // อัปเดตข้อมูล Profile ลง Firestore
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        userType: 'customer', // 🚀 FORCED UPDATE: บังคับแก้บัญชีเก่าทุกเคส ให้ระบบหลังบ้านมองเห็นทันที
        accountName: formData.accountName,
        contactName: formData.contactName, // 🚀 บันทึกชื่อผู้ติดต่อ
        phone: formData.phone,             // 🚀 บันทึกเบอร์โทร
        address: formData.address,
        shopInfo: formData.shopInfo,
        settings: formData.settings,
        updatedAt: serverTimestamp()
      });

      // ยิง History Log ไปที่หลังบ้าน
      await addDoc(collection(db, 'history_logs'), {
        module: 'CustomerProfile',
        action: 'Update',
        targetId: userProfile.uid,
        details: `อัปเดตข้อมูลร้านค้า/โปรไฟล์ส่วนตัว (${formData.accountName || formData.contactName})`,
        actionBy: userProfile.uid,
        performedBy: userProfile.uid,
        actorName: formData.accountName || formData.contactName || userProfile.email || 'Partner',
        timestamp: serverTimestamp()
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000); // ซ่อนข้อความสำเร็จหลัง 3 วินาที
    } catch (error) {
      console.error("🔥 Error updating profile:", error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 relative">
      
      {/* Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sticky top-0 bg-white/90 backdrop-blur-md z-10 py-2 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Store size={22} className="text-emerald-600" /> จัดการข้อมูลร้านค้า & ยืนยันตัวตน
        </h2>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && <span className="text-xs font-bold text-emerald-600 animate-pulse">บันทึกสำเร็จ!</span>}
          {saveStatus === 'error' && <span className="text-xs font-bold text-red-600">เกิดข้อผิดพลาด</span>}
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-70"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </div>

      {/* 1. KYC ยืนยันตัวตน (ตามเอกสารแนวคิด) */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
        <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-3">
          <ShieldCheck size={18} /> KYC ยืนยันตัวตน Partner (PDPA)
        </h3>
        <p className="text-[11px] text-emerald-700 mb-4 leading-relaxed">
          อัปโหลดใบทะเบียนการค้า หรือบัตรประชาชน เพื่อสร้างความน่าเชื่อถือให้ร้านของคุณ ข้อมูลจะถูกปกปิดและใช้เพื่อการยืนยันตัวตนตามมาตรฐานกฎหมาย PDPA เท่านั้น
        </p>
        <div className="flex gap-4">
          <div className="flex-1 border-2 border-dashed border-emerald-200 bg-white rounded-xl p-6 text-center hover:border-emerald-400 cursor-pointer transition-colors shadow-sm">
            <Upload size={24} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-gray-700">อัปโหลดเอกสาร KYC</p>
            <p className="text-[10px] text-gray-400 mt-1">ฟังก์ชันอัปโหลดกำลังพัฒนา...</p>
          </div>
        </div>
      </div>

      {/* 2. ข้อมูลร้านค้า และ Google Map */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><MapPin size={16} className="text-gray-400" /> ข้อมูลทั่วไป & พิกัด</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 🚀 ฟิลด์ใหม่: ชื่อผู้ติดต่อ และ เบอร์โทร */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ชื่อ-นามสกุล (ผู้ติดต่อ)</label>
            <input type="text" name="contactName" value={formData.contactName} onChange={(e) => handleChange(e, 'root')} placeholder="ระบุชื่อผู้ติดต่อ / ชื่อผู้รับพัสดุ" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">เบอร์โทรศัพท์ (จำเป็นสำหรับจัดส่ง)</label>
            <input type="tel" name="phone" value={formData.phone} onChange={(e) => handleChange(e, 'root')} placeholder="08X-XXX-XXXX" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ชื่อบัญชีร้านค้าหลัก (ระบบหลังบ้าน)</label>
            <input type="text" name="accountName" value={formData.accountName} onChange={(e) => handleChange(e, 'root')} placeholder="เช่น DH Notebook สาขา 1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ชื่อสำหรับรับงานหน้าเว็บ (Shop Name)</label>
            <input type="text" name="shopName" value={formData.shopInfo.shopName} onChange={(e) => handleChange(e, 'shopInfo')} placeholder="ชื่อร้าน หรือ ชื่อช่าง" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 outline-none transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ลิงก์ Google Map (พิกัดร้าน)</label>
            <input type="text" name="mapUrl" value={formData.shopInfo.mapUrl} onChange={(e) => handleChange(e, 'shopInfo')} placeholder="https://maps.app.goo.gl/..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 outline-none transition-colors" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ที่อยู่ร้านค้า / จัดส่ง (แสดงให้ลูกค้าปลีกเห็นเมื่อค้นหาช่าง)</label>
            <textarea rows="2" name="address" value={formData.address} onChange={(e) => handleChange(e, 'root')} placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 outline-none transition-colors resize-none"></textarea>
          </div>
        </div>
      </div>

      {/* 3. รูปแบบการให้บริการ (Services) */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><Wrench size={16} className="text-gray-400" /> ความเชี่ยวชาญ (Services)</h3>
        <p className="text-[11px] text-gray-500 mb-4">เลือกบริการที่คุณถนัด เพื่อให้ระบบจับคู่ (Smart Matching) นำเสนอลูกค้าได้ตรงจุดที่สุด</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-gray-700">
          {[
            { id: 'screen_keyboard', label: 'เปลี่ยนจอ / คีย์บอร์ด' },
            { id: 'board_chip', label: 'ซ่อมบอร์ด / ยกชิป' },
            { id: 'software_os', label: 'Software / OS' },
            { id: 'server_network', label: 'ติดตั้ง Server / Network' },
            { id: 'buy_secondhand', label: 'รับซื้อเครื่องมือสอง' },
            { id: 'onsite', label: 'บริการซ่อมถึงที่ (On-site)' },
            { id: 'machine_robot', label: 'เครื่องจักรกล / หุ่นยนต์' },
            { id: 'ai_smarthome', label: 'ระบบ AI / Smart Home' }
          ].map(service => (
            <label key={service.id} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" name={service.id} checked={formData.shopInfo.services[service.id]} onChange={(e) => handleChange(e, 'shopInfo', 'services')} className="accent-emerald-500 w-4 h-4 cursor-pointer" /> 
              <span className="group-hover:text-emerald-600 transition-colors">{service.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. จัดการฉายา Badge */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Award size={16} className="text-gray-400" /> ตราประทับเกียรติยศ (Badge)</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <span className="mr-3 text-[10px] font-bold text-gray-500 uppercase">เปิดแสดง Badge</span>
            <input type="checkbox" name="badgeEnabled" checked={formData.settings.badgeEnabled} onChange={(e) => handleChange(e, 'settings')} className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
        <div className={`transition-all duration-300 ${formData.settings.badgeEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <select name="badgeType" value={formData.settings.badgeType} onChange={(e) => handleChange(e, 'settings')} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 outline-none bg-gray-50 cursor-pointer">
            <option>🏆 สมาชิกผู้สนับสนุน (Prime Member)</option>
            <option>🏅 ผู้ให้คำแนะนำ (Expert Reviewer)</option>
            <option>🔥 กระแสโดดเด่น (Top Engagement)</option>
            <option>⭐ สมาชิกมีใบรับรอง (Verified Partner)</option>
          </select>
        </div>
      </div>

      {/* 5. Social Links & Tax Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><LinkIcon size={16} className="text-gray-400" /> ลิงก์ร้านค้า & โซเชียล</h3>
          <div className="space-y-3">
            <input type="text" name="youtube" value={formData.shopInfo.social.youtube} onChange={(e) => handleChange(e, 'shopInfo', 'social')} placeholder="YouTube Channel URL..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1" />
            <input type="text" name="tiktok" value={formData.shopInfo.social.tiktok} onChange={(e) => handleChange(e, 'shopInfo', 'social')} placeholder="TikTok Profile URL..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1" />
            <input type="text" name="facebook" value={formData.shopInfo.social.facebook} onChange={(e) => handleChange(e, 'shopInfo', 'social')} placeholder="Facebook Page URL..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><Receipt size={16} className="text-gray-400" /> ข้อมูลใบกำกับภาษี</h3>
          <div className="space-y-3">
            <input type="text" name="name" value={formData.shopInfo.tax.name} onChange={(e) => handleChange(e, 'shopInfo', 'tax')} placeholder="ชื่อบริษัท / นิติบุคคล / บุคคลธรรมดา" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1" />
            <input type="text" name="taxId" value={formData.shopInfo.tax.taxId} onChange={(e) => handleChange(e, 'shopInfo', 'tax')} placeholder="เลขประจำตัวผู้เสียภาษี (13 หลัก)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1" />
            <textarea rows="1" name="address" value={formData.shopInfo.tax.address} onChange={(e) => handleChange(e, 'shopInfo', 'tax')} placeholder="ที่อยู่ออกใบกำกับภาษี..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 resize-none"></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabOverview;