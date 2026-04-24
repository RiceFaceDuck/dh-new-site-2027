import React, { useState, useEffect } from 'react';
import { Store, MapPin, Receipt, Link as LinkIcon, ShieldCheck, Wrench, Award, Upload, Save, Loader2, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase/config';

const TabOverview = ({ userProfile }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // 1. ผูก State กับข้อมูล userProfile ที่ส่งมาจากด้านนอก
  const [formData, setFormData] = useState({
    accountName: '',
    contactName: '',
    phone: '',
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
      pushNotifications: true,
      emailNotifications: true,
      language: 'th'
    }
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        ...userProfile,
        shopInfo: { ...prev.shopInfo, ...(userProfile.shopInfo || {}) },
        settings: { ...prev.settings, ...(userProfile.settings || {}) }
      }));
    }
  }, [userProfile]);

  // 2. ฟังก์ชันจัดการการพิมพ์ฟิลด์ต่างๆ (รวมถึง nested object)
  const handleChange = (e, section = null, subSection = null) => {
    const { name, value } = e.target;
    
    if (subSection && section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subSection]: {
            ...prev[section][subSection],
            [name]: value
          }
        }
      }));
    } else if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (key) => {
    setFormData(prev => ({
      ...prev,
      shopInfo: {
        ...prev.shopInfo,
        services: {
          ...prev.shopInfo.services,
          [key]: !prev.shopInfo.services[key]
        }
      }
    }));
  };

  // 3. ฟังก์ชันบันทึกข้อมูล (Tech Save Logic)
  const handleSave = async () => {
    if (!userProfile?.uid) return;
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, {
        ...formData,
        lastUpdated: serverTimestamp()
      });
      
      // บันทึกลง System Log
      await addDoc(collection(db, "users", userProfile.uid, "history"), {
        action: "update_profile",
        details: "พาร์ทเนอร์อัปเดตข้อมูลโปรไฟล์และหน้าร้าน",
        timestamp: serverTimestamp()
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("🔥 Error updating profile:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const serviceLabels = {
    screen_keyboard: 'เปลี่ยนจอ/คีย์บอร์ด/แบต',
    board_chip: 'ซ่อมบอร์ด/ชิป/ระบบไฟ',
    software_os: 'ลงโปรแกรม/OS/ล้างไวรัส',
    server_network: 'ระบบ Network/Server',
    buy_secondhand: 'รับซื้อ/เทิร์นเครื่องมือสอง',
    onsite: 'บริการนอกสถานที่ (On-site)',
    machine_robot: 'ซ่อมตู้ม้า/เครื่องจักร/หุ่นยนต์',
    ai_smarthome: 'ระบบบ้านอัจฉริยะ/AI/กล้อง'
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10 animate-fade-in-up">
      
      {/* Header & Save Button Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
         <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center font-tech tracking-wider uppercase">
             <span className="w-1.5 h-6 bg-cyber-blue rounded-sm mr-3 inline-block shadow-glow-blue"></span>
             Terminal Data
           </h2>
           <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-tech">Manage your partner identity and configurations.</p>
         </div>

         {/* Smart Tech Save Button */}
         <button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-sm font-tech font-bold uppercase tracking-widest text-xs transition-all duration-300 shadow-sm border ${
            isSaving ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait' 
            : saveStatus === 'success' ? 'bg-emerald-50 text-cyber-emerald border-emerald-200' 
            : saveStatus === 'error' ? 'bg-red-50 text-red-500 border-red-200'
            : 'bg-slate-800 text-white border-slate-900 hover:bg-slate-900 hover:shadow-glow-emerald'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> 
           : saveStatus === 'success' ? <CheckCircle2 size={16} /> 
           : saveStatus === 'error' ? <ShieldCheck size={16} /> 
           : <Save size={16} />}
          {isSaving ? 'Processing...' : saveStatus === 'success' ? 'Data Saved' : saveStatus === 'error' ? 'Failed' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* 📋 Column 1: ข้อมูลผู้ใช้งาน และข้อมูลร้านค้า */}
        <div className="space-y-6">
          
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 shadow-tech-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
            <h3 className="text-xs font-tech font-bold tracking-widest uppercase text-slate-700 flex items-center gap-2 mb-4">
              <FileText size={16} className="text-slate-400" /> Account Identity
            </h3>
            <div className="space-y-3">
              <div>
                 <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Username / Nickname</label>
                 <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="นามแฝง (ที่ใช้ในระบบ)" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Contact Name</label>
                    <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} placeholder="ชื่อผู้ติดต่อจริง" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all" />
                 </div>
                 <div>
                    <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="เบอร์โทรศัพท์" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-tech text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all" />
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 shadow-tech-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyber-blue"></div>
            <h3 className="text-xs font-tech font-bold tracking-widest uppercase text-slate-700 flex items-center gap-2 mb-4">
              <Store size={16} className="text-cyber-blue" /> Store Profile
            </h3>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Store / Branch Name</label>
                  <input type="text" name="shopName" value={formData.shopInfo.shopName} onChange={(e) => handleChange(e, 'shopInfo')} placeholder="ชื่อร้าน (ที่ใช้โปรโมทและแสดงในบิล)" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all" />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><MapPin size={12}/> Physical Address</label>
                  <textarea rows="2" name="address" value={formData.address} onChange={handleChange} placeholder="ที่อยู่ในการจัดส่ง (พิมพ์แบบเต็ม)" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all"></textarea>
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Google Maps URL</label>
                  <input type="url" name="mapUrl" value={formData.shopInfo.mapUrl} onChange={(e) => handleChange(e, 'shopInfo')} placeholder="ลิงก์หมุดร้านค้า (หากมี)" className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs text-slate-600 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all" />
               </div>
            </div>
            
            {/* Tech Badges (Services Toggle) */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-3 ml-1 flex items-center gap-1"><Wrench size={12}/> Provided Services</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.keys(serviceLabels).map((key) => {
                  const isSelected = formData.shopInfo.services[key];
                  return (
                    <label key={key} className={`flex items-center gap-3 p-2.5 border rounded-sm cursor-pointer transition-all duration-200 select-none ${
                      isSelected ? 'bg-emerald-50/50 border-cyber-emerald text-slate-800 shadow-[inset_2px_0_0_rgba(16,185,129,1)]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleServiceChange(key)}
                        className="w-4 h-4 rounded-sm border-slate-300 text-cyber-emerald focus:ring-cyber-emerald focus:ring-offset-0 bg-slate-100"
                      />
                      <span className="text-xs md:text-sm font-medium">{serviceLabels[key]}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 📋 Column 2: โซเชียลมีเดีย และ ข้อมูลภาษี */}
        <div className="space-y-6">
          
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 shadow-tech-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-400"></div>
            <h3 className="text-xs font-tech font-bold tracking-widest uppercase text-slate-700 flex items-center gap-2 mb-4">
              <LinkIcon size={16} className="text-purple-400" /> Digital Footprint
            </h3>
            <div className="space-y-3">
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Facebook Page</label>
                  <input type="url" name="facebook" value={formData.shopInfo.social.facebook} onChange={(e) => handleChange(e, 'shopInfo', 'social')} placeholder="URL..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 transition-all" />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">TikTok Channel</label>
                  <input type="url" name="tiktok" value={formData.shopInfo.social.tiktok} onChange={(e) => handleChange(e, 'shopInfo', 'social')} placeholder="URL..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 transition-all" />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">YouTube Channel</label>
                  <input type="url" name="youtube" value={formData.shopInfo.social.youtube} onChange={(e) => handleChange(e, 'shopInfo', 'social')} placeholder="URL..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 transition-all" />
               </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 shadow-tech-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <h3 className="text-xs font-tech font-bold tracking-widest uppercase text-slate-700 flex items-center gap-2 mb-4">
              <Receipt size={16} className="text-amber-500" /> Tax & Billing Configuration
            </h3>
            <div className="space-y-3">
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Entity Name</label>
                  <input type="text" name="name" value={formData.shopInfo.tax.name} onChange={(e) => handleChange(e, 'shopInfo', 'tax')} placeholder="ชื่อบริษัท / นิติบุคคล / บุคคลธรรมดา" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all" />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Tax ID</label>
                  <input type="text" name="taxId" value={formData.shopInfo.tax.taxId} onChange={(e) => handleChange(e, 'shopInfo', 'tax')} placeholder="เลขประจำตัวผู้เสียภาษี (13 หลัก)" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-tech text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all" />
               </div>
               <div>
                  <label className="block text-[10px] text-slate-500 font-tech uppercase tracking-widest mb-1 ml-1">Registered Address</label>
                  <textarea rows="2" name="address" value={formData.shopInfo.tax.address} onChange={(e) => handleChange(e, 'shopInfo', 'tax')} placeholder="ที่อยู่สำหรับออกใบกำกับภาษีเต็มรูปแบบ" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-sm text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-cyber-emerald focus:ring-1 focus:ring-cyber-emerald transition-all"></textarea>
               </div>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50/50 border border-amber-200 rounded-sm flex items-start gap-2">
               <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5" />
               <p className="text-[10px] md:text-xs text-amber-800 font-medium leading-relaxed">
                 ข้อมูลในส่วนนี้จะถูกใช้เป็นค่าเริ่มต้นเมื่อท่านขอออกใบกำกับภาษี/ใบเสร็จรับเงินในขั้นตอนการ Check out ตรวจสอบให้ถูกต้องเพื่อป้องกันความล่าช้าในการจัดส่งเอกสาร
               </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TabOverview;