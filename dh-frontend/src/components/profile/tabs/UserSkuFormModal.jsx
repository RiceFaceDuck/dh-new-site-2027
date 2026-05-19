/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Package, X, Loader2, Save, Image as ImageIcon, UploadCloud, Youtube } from 'lucide-react';
import { addDoc, serverTimestamp, collection } from 'firebase/firestore';

// 🛠️ นำเข้า Path Todo ที่ถูกต้องจาก userSkuService
import { db } from '../../../firebase/config';
import { driveService } from '../../../firebase/driveService';
import { userSkuService, SKU_STATUS, getManagerTodosCollection } from '../../../firebase/userSkuService'; 

// 🚀 เพิ่ม Props: editingAd เพื่อรองรับระบบ "แก้ไข"
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
    } else if (isOpen) {
      // รีเซ็ตฟอร์มหากเป็นการเปิดสร้างใหม่
      setFormData({
        name: '', price: '', shopeeLink: '', lazadaLink: '', tiktokLink: '', youtubeLink: '', imageFile: null, imagePreview: null
      });
    }
  }, [isOpen, editingAd]);

  if (!isOpen) return null;

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

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = editingAd ? editingAd.imageUrl : null;
      
      // 1. ☁️ อัปโหลดรูปภาพใหม่ (ถ้ามี)
      if (formData.imageFile) {
        setUploadStatusText('กำลังอัปโหลดไฟล์รูปภาพเข้าสู่ระบบฐานข้อมูล...');
        uploadedImageUrl = await driveService.uploadUserSkuImage(formData.imageFile);
      }
      
      setUploadStatusText('กำลังบันทึกและส่งข้อมูลให้ผู้จัดการอนุมัติ...');

      // 📝 เตรียมชุดข้อมูล Links
      const linksData = {
        shopee: formData.shopeeLink,
        lazada: formData.lazadaLink,
        tiktok: formData.tiktokLink,
        youtube: formData.youtubeLink
      };

      if (editingAd) {
        // ==========================================
        // โหมด: แก้ไข (UPDATE)
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

        // 📜 บันทึก Log การแก้ไข
        await addDoc(collection(db, 'artifacts', window.__app_id || 'default-app-id', 'public', 'data', 'history_logs'), {
          module: 'UserSKU',
          action: 'Update',
          targetId: editingAd.skuId,
          details: `อัปเดตข้อมูลโฆษณา (รอตรวจสอบใหม่)`,
          actionBy: user.uid,
          actorName: userProfile?.accountName || 'Partner',
          timestamp: serverTimestamp()
        });

        alert(`อัปเดตโฆษณาเรียบร้อยแล้ว!\nระบบส่งคำขอให้ผู้จัดการตรวจสอบข้อมูลใหม่แล้วครับ`);

      } else {
        // ==========================================
        // โหมด: สร้างใหม่ (CREATE)
        // ==========================================
        const skuCode = `PV-${Date.now().toString().slice(-5)}`;
        const adData = {
          ownerName: userProfile?.accountName || userProfile?.displayName || 'Partner',
          ownerUid: user.uid,
          skuId: skuCode,
          name: formData.name,
          price: Number(formData.price) || 0,
          imageUrl: uploadedImageUrl,
          status: SKU_STATUS.PENDING, 
          isActive: true, 
          links: linksData
        };

        await userSkuService.createAdRequest(user.uid, adData);

        // 🔔 ส่งงานไป Todo ผู้จัดการ
        await addDoc(getManagerTodosCollection(), {
          type: 'USER_SKU_APPROVAL',
          title: `ตรวจสอบโฆษณาใหม่: ${formData.name}`,
          status: 'pending',
          priority: 'Normal',
          targetSkuId: skuCode,
          customerName: userProfile?.accountName || userProfile?.displayName || 'Partner',
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });

        // 📜 บันทึก Log การสร้าง
        await addDoc(collection(db, 'artifacts', window.__app_id || 'default-app-id', 'public', 'data', 'history_logs'), {
          module: 'UserSKU',
          action: 'Create',
          targetId: skuCode,
          details: `สร้างสินค้าโฆษณาใหม่ (รอการอนุมัติ)`,
          actionBy: user.uid,
          actorName: userProfile?.accountName || 'Partner',
          timestamp: serverTimestamp()
        });

        alert(`สร้างรายการโฆษณาเรียบร้อยแล้ว!\nระบบส่งคำขอให้ผู้จัดการตรวจสอบแล้วครับ`);
      }

      onSuccess(); // สั่ง Refresh รายการ
      onClose(); // ปิด Modal
      
    } catch (error) {
      console.error("🔥 Error submitting SKU:", error);
      alert(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-10">
          <h3 className="font-black text-gray-800 flex items-center gap-2 text-lg">
            <Package className="text-[#0870B8]" size={20}/> 
            {editingAd ? 'แก้ไขรายการฝากโฆษณา' : 'เพิ่มรายการฝากโฆษณา'}
          </h3>
          {!isSubmitting && <button type="button" onClick={onClose} className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><X size={20}/></button>}
        </div>
        
        <form onSubmit={handleSubmitSku} className="p-6 space-y-5 relative">
          
          {/* 🚀 Loading Overlay ทับฟอร์มตอนกดเซฟ */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-b-2xl">
               <Loader2 size={48} className="text-[#0870B8] animate-spin mb-4" />
               <p className="text-[#0870B8] font-bold text-base mb-1">{uploadStatusText}</p>
               <p className="text-sm text-gray-500">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้...</p>
            </div>
          )}

          {/* ส่วนอัปโหลดรูปภาพ */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">1. รูปภาพสินค้าโฆษณา (อัตราส่วน 1:1) <span className="text-rose-500">*</span></label>
            <div className="relative border-2 border-dashed border-gray-300 hover:border-[#0870B8] rounded-xl p-4 transition-colors text-center bg-gray-50 group cursor-pointer overflow-hidden min-h-[160px] flex items-center justify-center">
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleImageChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                 required={!formData.imagePreview}
               />
               {formData.imagePreview ? (
                 <div className="relative w-full h-40 flex items-center justify-center">
                   <img src={formData.imagePreview} alt="Preview" className="max-h-full rounded-lg shadow-sm object-contain" />
                   <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                      <span className="text-white text-sm font-bold flex items-center gap-2"><UploadCloud size={18}/> เปลี่ยนรูปภาพใหม่</span>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-6">
                   <div className="bg-white p-4 rounded-full shadow-sm mb-3 text-[#0870B8]">
                     <ImageIcon size={28} />
                   </div>
                   <p className="text-base font-bold text-gray-700 mb-1">คลิก หรือ ลากรูปภาพมาวางที่นี่</p>
                   <p className="text-xs text-gray-500">รองรับ JPG, PNG ขนาดไม่เกิน 5MB</p>
                 </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">2. ชื่อสินค้า <span className="text-rose-500">*</span></label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#0870B8] focus:ring-2 focus:ring-[#0870B8]/20 transition-all" placeholder="เช่น กระเป๋าเป้สะพายหลัง รุ่น XYZ..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">3. ราคา (บาท)</label>
              <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-[#0870B8] focus:ring-2 focus:ring-[#0870B8]/20 transition-all" placeholder="0" />
            </div>
          </div>

          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
            <p className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1.5"><span className="text-lg">🔗</span> 4. ลิงก์ปลายทาง (สั่งซื้อสินค้า)</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] font-bold text-gray-500 text-right">Shopee</span>
                <input type="url" value={formData.shopeeLink} onChange={e => setFormData({...formData, shopeeLink: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="https://shopee.co.th/..." />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] font-bold text-gray-500 text-right">Lazada</span>
                <input type="url" value={formData.lazadaLink} onChange={e => setFormData({...formData, lazadaLink: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="https://lazada.co.th/..." />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-16 text-[10px] font-bold text-gray-500 text-right">TikTok</span>
                <input type="url" value={formData.tiktokLink} onChange={e => setFormData({...formData, tiktokLink: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="https://shop.tiktok.com/..." />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-100/50">
               <p className="text-xs font-bold text-rose-700 uppercase mb-3 flex items-center gap-1.5"><Youtube size={14} className="text-rose-500"/> ลิงก์วิดีโอรีวิว (เสริมความน่าสนใจ)</p>
               <div className="flex items-center gap-3">
                 <span className="w-16 text-[10px] font-bold text-gray-500 text-right">YouTube</span>
                 <input type="url" value={formData.youtubeLink} onChange={e => setFormData({...formData, youtubeLink: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" placeholder="https://youtube.com/watch?v=..." />
               </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] py-3.5 bg-[#0870B8] text-white font-bold text-sm rounded-xl hover:bg-[#065A96] transition-all flex justify-center items-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 active:scale-95">
              <Save size={18} /> {editingAd ? 'อัปเดตรายการโฆษณา' : 'ยืนยันการสร้างโฆษณา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSkuFormModal;