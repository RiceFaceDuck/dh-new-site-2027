/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Package, X, Loader2, Save, Image as ImageIcon, UploadCloud, Youtube, Eye, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { addDoc, serverTimestamp, collection } from 'firebase/firestore';

// 🛠️ นำเข้า Path Todo และ Service ที่ถูกต้อง
import { db } from '../../../firebase/config';
import { driveService } from '../../../firebase/driveService';
import { userSkuService, SKU_STATUS, getManagerTodosCollection } from '../../../firebase/userSkuService'; 

// 🎯 ค่าใช้จ่ายในการลงโฆษณา (ปรับเปลี่ยนได้ในอนาคต)
const AD_CREATE_COST = 50;

const UserSkuFormModal = ({ isOpen, onClose, onSuccess, user, userProfile, editingAd = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState(''); 
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    shopeeLink: '',
    lazadaLink: '',
    tiktokLink: '',
    youtubeLink: '', 
    imageFile: null, 
    imagePreview: null 
  });

  // สถานะแจ้งเตือน URL
  const [urlErrors, setUrlErrors] = useState({});

  // 💡 โหลดข้อมูลเก่ามาแสดงเมื่อเป็นการ "แก้ไข"
  useEffect(() => {
    if (isOpen && editingAd) {
      setFormData({
        name: editingAd.name || '',
        price: editingAd.price || '',
        shopeeLink: editingAd.links?.shopee || '',
        lazadaLink: editingAd.links?.lazada || '',
        tiktokLink: editingAd.links?.tiktok || '',
        youtubeLink: editingAd.links?.youtube || '',
        imageFile: null, 
        imagePreview: editingAd.imageUrl || null 
      });
      setUrlErrors({}); // Reset errors
    } else if (isOpen) {
      // รีเซ็ตฟอร์มหากเป็นการเปิดสร้างใหม่
      setFormData({
        name: '', price: '', shopeeLink: '', lazadaLink: '', tiktokLink: '', youtubeLink: '', imageFile: null, imagePreview: null
      });
      setUrlErrors({});
    }
  }, [isOpen, editingAd]);

  if (!isOpen) return null;

  // 🛡️ Helper ตรวจ URL Real-time
  const validateUrl = (url) => {
    if (!url) return null; // ไม่มีไม่เป็นไร
    try {
      const parsed = new URL(url);
      return (parsed.protocol === "http:" || parsed.protocol === "https:") ? true : false;
    } catch {
      return false;
    }
  };

  const handleLinkChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    const isValid = validateUrl(value);
    setUrlErrors(prev => ({ ...prev, [field]: isValid === false })); // เก็บเฉพาะอันที่ Error
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ขนาดรูปภาพต้องไม่เกิน 5MB ครับ");
        return;
      }
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file) 
      });
    }
  };

  const handleSubmitSku = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("กรุณากรอกชื่อสินค้า");
    if (!formData.imagePreview && !formData.imageFile) return alert("กรุณาอัปโหลดรูปภาพสินค้าด้วยครับ");

    // เช็ค Error URL ค้างอยู่หรือไม่
    if (Object.values(urlErrors).some(err => err === true)) {
      return alert("กรุณาแก้ไขลิงก์ปลายทางให้ถูกต้องก่อนทำการบันทึก (ต้องขึ้นต้นด้วย http:// หรือ https://)");
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = editingAd ? editingAd.imageUrl : null;
      
      // 1. ☁️ อัปโหลดรูปภาพใหม่ (ถ้ามี)
      if (formData.imageFile) {
        setUploadStatusText('กำลังอัปโหลดไฟล์รูปภาพเข้าสู่ระบบฐานข้อมูล...');
        uploadedImageUrl = await driveService.uploadUserSkuImage(formData.imageFile);
      }
      
      setUploadStatusText('กำลังบันทึกข้อมูลโฆษณาและตรวจสอบเครดิต...');

      // 📝 เตรียมชุดข้อมูล Links
      const linksData = {
        shopee: formData.shopeeLink,
        lazada: formData.lazadaLink,
        tiktok: formData.tiktokLink,
        youtube: formData.youtubeLink
      };

      if (editingAd) {
        // ==========================================
        // โหมด: แก้ไข (UPDATE) - แก้ไขปกติไม่เสียแต้มเพิ่ม
        // ==========================================
        const updateData = {
          name: formData.name,
          price: Number(formData.price) || 0,
          imageUrl: uploadedImageUrl,
          status: SKU_STATUS.PENDING, // ส่งให้ผู้จัดการตรวจสอบใหม่เมื่อมีการแก้ไข
          links: linksData
        };

        await userSkuService.updateAdRequest(editingAd.id, updateData);

        // 🔔 ส่งงานไป Todo ผู้จัดการ (แจ้งว่ามีการแก้ไข)
        await addDoc(getManagerTodosCollection(), {
          type: 'USER_SKU_APPROVAL',
          title: `ตรวจสอบการแก้ไขโฆษณา: ${formData.name}`,
          status: 'pending',
          priority: 'Normal',
          targetSkuId: editingAd.skuId,
          customerName: userProfile?.accountName || userProfile?.displayName || 'Partner',
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });

        alert(`อัปเดตโฆษณาเรียบร้อยแล้ว!\nระบบส่งคำขอให้ผู้จัดการตรวจสอบข้อมูลใหม่แล้วครับ`);

      } else {
        // ==========================================
        // โหมด: สร้างใหม่ (CREATE) - ใช้ Atomic Transaction ตัดแต้ม
        // ==========================================
        const skuCode = `AD-${Date.now().toString().slice(-5)}`;
        const adData = {
          ownerName: userProfile?.accountName || userProfile?.displayName || 'Partner',
          ownerUid: user.uid,
          skuId: skuCode,
          name: formData.name,
          price: Number(formData.price) || 0,
          imageUrl: uploadedImageUrl,
          // Status จะถูก Set เป็น APPROVED จาก Service ถ้าตัดเงินผ่าน
          isActive: true, 
          links: linksData
        };

        // 💸 เรียกใช้ Service พร้อมโยนค่า Cost ไปตัดในระดับ Database (ปลอดภัย 100%)
        await userSkuService.createAdRequest(user.uid, adData, AD_CREATE_COST);

        // 🔔 ส่งงานไป Todo ผู้จัดการ (แจ้งให้ทราบเฉยๆ โฆษณารันเลยเพราะจ่ายเงินแล้ว)
        await addDoc(getManagerTodosCollection(), {
          type: 'USER_SKU_APPROVAL',
          title: `โฆษณาใหม่เริ่มทำงานแล้ว: ${formData.name}`,
          status: 'pending', // แอดมินสามารถกด Reject ภายหลังได้ถ้าเนื้อหาไม่เหมาะสม
          priority: 'Normal',
          targetSkuId: skuCode,
          customerName: userProfile?.accountName || userProfile?.displayName || 'Partner',
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });

        alert(`ดำเนินการสำเร็จ!\nหักแต้ม ${AD_CREATE_COST} เครดิต โฆษณาของคุณเริ่มทำงานแล้วครับ 🎉`);
      }

      onSuccess(); // สั่ง Refresh รายการ
      onClose(); // ปิด Modal
      
    } catch (error) {
      console.error("🔥 Error submitting SKU:", error);
      // แสดงข้อความ Error ที่มาจาก Backend (เช่น แต้มไม่พอ)
      alert(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* 🚀 ขยายความกว้าง Modal เพื่อรองรับระบบ Preview (max-w-4xl) */}
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto flex flex-col md:flex-row">
        
        {/* ========================================== */}
        {/* คอลัมน์ซ้าย: ฟอร์มกรอกข้อมูล */}
        {/* ========================================== */}
        <div className="flex-1 border-r border-gray-100 flex flex-col relative">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-10">
            <h3 className="font-black text-gray-800 flex items-center gap-2 text-lg">
              <Package className="text-[#0870B8]" size={20}/> 
              {editingAd ? 'แก้ไขรายการฝากโฆษณา' : 'เพิ่มโฆษณาสินค้าใหม่'}
            </h3>
            {/* ปุ่มปิดสำหรับหน้าจอมือถือ (ย้ายมาไว้ข้างใน Form) */}
            <button type="button" onClick={onClose} className="md:hidden text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><X size={20}/></button>
          </div>
          
          <form onSubmit={handleSubmitSku} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            
            {/* 🚀 Loading Overlay ทับฟอร์มตอนกดเซฟ */}
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                 <Loader2 size={48} className="text-[#0870B8] animate-spin mb-4" />
                 <p className="text-[#0870B8] font-bold text-base mb-1">{uploadStatusText}</p>
                 <p className="text-sm text-gray-500">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้...</p>
              </div>
            )}

            {/* ส่วนอัปโหลดรูปภาพ */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">1. รูปภาพสินค้าโฆษณา (อัตราส่วน 1:1) <span className="text-rose-500">*</span></label>
              <div className="relative border-2 border-dashed border-gray-300 hover:border-[#0870B8] rounded-xl p-4 transition-colors text-center bg-gray-50 group cursor-pointer overflow-hidden min-h-[140px] flex items-center justify-center">
                 <input 
                   type="file" 
                   accept="image/*" 
                   onChange={handleImageChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   required={!formData.imagePreview}
                 />
                 {formData.imagePreview ? (
                   <div className="relative w-full h-32 flex items-center justify-center">
                     <img src={formData.imagePreview} alt="Preview" className="max-h-full rounded-lg shadow-sm object-contain" />
                     <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <span className="text-white text-sm font-bold flex items-center gap-2"><UploadCloud size={18}/> เปลี่ยนรูป</span>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-4">
                     <div className="bg-white p-3 rounded-full shadow-sm mb-2 text-[#0870B8]">
                       <ImageIcon size={24} />
                     </div>
                     <p className="text-sm font-bold text-gray-700 mb-1">คลิก หรือ ลากรูปภาพมาวางที่นี่</p>
                     <p className="text-[10px] text-gray-500">รองรับ JPG, PNG ขนาดไม่เกิน 5MB</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">2. ชื่อสินค้า <span className="text-rose-500">*</span></label>
                <input required type="text" maxLength={60} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#0870B8] focus:ring-2 focus:ring-[#0870B8]/20 transition-all" placeholder="กระเป๋าเป้สะพายหลัง..." />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">3. ราคา (บาท)</label>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#0870B8] focus:ring-2 focus:ring-[#0870B8]/20 transition-all" placeholder="0" />
              </div>
            </div>

            {/* ส่วนของ Links พร้อมระบบ Smart Validator */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
              <p className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5"><span className="text-lg">🔗</span> 4. ลิงก์ปลายทางสั่งซื้อ (ใส่เฉพาะที่มี)</p>
              <div className="space-y-3">
                {[
                  { id: 'shopeeLink', label: 'Shopee', color: 'orange-500' },
                  { id: 'lazadaLink', label: 'Lazada', color: 'blue-600' },
                  { id: 'tiktokLink', label: 'TikTok', color: 'black' }
                ].map(platform => (
                  <div key={platform.id} className="relative flex items-center gap-3">
                    <span className="w-14 text-[10px] font-bold text-gray-600 text-right uppercase">{platform.label}</span>
                    <div className="flex-1 relative">
                      <input 
                        type="url" 
                        value={formData[platform.id]} 
                        onChange={e => handleLinkChange(platform.id, e.target.value)} 
                        className={`w-full pl-3 pr-8 py-2.5 border ${urlErrors[platform.id] ? 'border-rose-400 bg-rose-50' : 'border-gray-200'} rounded-lg text-xs outline-none focus:border-${platform.color} focus:ring-1 focus:ring-${platform.color} transition-colors`} 
                        placeholder={`https://${platform.label.toLowerCase()}...`} 
                      />
                      {formData[platform.id] && !urlErrors[platform.id] && <CheckCircle2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />}
                      {urlErrors[platform.id] && <AlertCircle size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-500" />}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-100/50">
                 <p className="text-[10px] font-bold text-rose-700 uppercase mb-3 flex items-center gap-1.5"><Youtube size={14} className="text-rose-500"/> ลิงก์รีวิว (เพิ่มความน่าสนใจ)</p>
                 <div className="flex items-center gap-3">
                   <span className="w-14 text-[10px] font-bold text-gray-600 text-right uppercase">YouTube</span>
                   <div className="flex-1 relative">
                      <input type="url" value={formData.youtubeLink} onChange={e => handleLinkChange('youtubeLink', e.target.value)} className={`w-full pl-3 pr-8 py-2.5 border ${urlErrors.youtubeLink ? 'border-rose-400 bg-rose-50' : 'border-gray-200'} rounded-lg text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500`} placeholder="https://youtube.com/watch?v=..." />
                      {formData.youtubeLink && !urlErrors.youtubeLink && <CheckCircle2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />}
                   </div>
                 </div>
              </div>
            </div>
          </form>
        </div>

        {/* ========================================== */}
        {/* คอลัมน์ขวา: 👁️ Live Preview Mode (Mockup) */}
        {/* ========================================== */}
        <div className="hidden md:flex md:w-[350px] bg-slate-50 flex-col relative">
          <div className="p-4 flex justify-between items-center absolute w-full top-0 right-0 z-10">
             <div className="bg-slate-800/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
               <Eye size={12}/> Live Preview 
             </div>
             {!isSubmitting && <button type="button" onClick={onClose} className="text-gray-400 hover:text-rose-500 hover:bg-white p-1.5 rounded-lg transition-colors shadow-sm bg-white/50"><X size={20}/></button>}
          </div>

          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            {/* โครงการ์ดโฆษณาจำลอง */}
            <div className="w-full max-w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform scale-95 transition-all">
               <div className="h-[280px] bg-gray-100 relative flex items-center justify-center overflow-hidden">
                  {formData.imagePreview ? (
                    <img src={formData.imagePreview} alt="Ad Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={48} className="text-gray-300" />
                  )}
                  {/* Badge ผู้ลงโฆษณา */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs px-2.5 py-1 rounded-full font-bold text-[#0870B8] shadow-sm">
                    {userProfile?.accountName || 'ร้านค้าของคุณ'}
                  </div>
               </div>
               
               <div className="p-4 space-y-3">
                 <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight min-h-[40px]">
                   {formData.name || 'ตัวอย่างชื่อโฆษณาสินค้า...'}
                 </h4>
                 <div className="flex items-end justify-between">
                   <p className="text-[#0870B8] font-black text-lg">฿{Number(formData.price || 0).toLocaleString()}</p>
                 </div>

                 {/* จำลองปุ่มช้อปปิ้ง */}
                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                    {formData.shopeeLink && <div className="py-1.5 bg-orange-50 text-orange-600 text-[10px] font-bold text-center rounded-lg border border-orange-100">Shopee</div>}
                    {formData.lazadaLink && <div className="py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold text-center rounded-lg border border-blue-100">Lazada</div>}
                    {formData.tiktokLink && <div className="py-1.5 bg-gray-100 text-gray-800 text-[10px] font-bold text-center rounded-lg border border-gray-200">TikTok</div>}
                    {(!formData.shopeeLink && !formData.lazadaLink && !formData.tiktokLink) && (
                      <div className="col-span-2 py-1.5 bg-gray-50 text-gray-400 text-[10px] font-bold text-center rounded-lg border border-gray-100 flex items-center justify-center gap-1">
                        <ShoppingCart size={12}/> จำลองปุ่มสั่งซื้อ
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>

          {/* แถบสรุปค่าใช้จ่ายด้านล่าง (Footer) */}
          <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
             {!editingAd ? (
               <div className="mb-4 bg-[#0870B8]/5 p-3 rounded-xl border border-[#0870B8]/10 flex items-center justify-between">
                 <span className="text-xs font-bold text-gray-600">ค่าธรรมเนียมโฆษณา:</span>
                 <div className="flex items-center gap-1.5">
                   <div className="w-5 h-5 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs font-black shadow-inner">P</div>
                   <span className="font-black text-[#0870B8] text-lg">{AD_CREATE_COST}</span>
                   <span className="text-xs text-gray-500 font-medium">เครดิต</span>
                 </div>
               </div>
             ) : (
               <div className="mb-4 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold gap-1.5">
                 <CheckCircle2 size={16}/> แก้ไขข้อมูล ฟรี ไม่หักแต้มเพิ่ม
               </div>
             )}

             <button onClick={handleSubmitSku} disabled={isSubmitting} className="w-full py-3.5 bg-[#0870B8] text-white font-bold text-sm rounded-xl hover:bg-[#065A96] transition-all flex justify-center items-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 active:scale-95">
               <Save size={18} /> {editingAd ? 'อัปเดตรายการโฆษณา' : 'หักแต้มและรันโฆษณา'}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserSkuFormModal;