/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Info, Link as LinkIcon, X, Loader2, Save, Image as ImageIcon, UploadCloud, Youtube, PlayCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';

import { driveService } from '../../../firebase/driveService';
import { userSkuService, SKU_STATUS } from '../../../firebase/userSkuService'; 

const TabUserSku = ({ userProfile }) => {
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // ดึงสินค้าของตัวเอง
  const fetchMySkus = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      const fetchedSkus = await userSkuService.getUserAds(auth.currentUser.uid);
      setSkus(fetchedSkus);
    } catch (error) {
      console.error("🔥 Error fetching User SKUs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySkus();
  }, []);

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

  // 🚀 1. บันทึกสินค้าใหม่ (ฝากไฟล์เข้า Drive แล้วเซฟลิงก์ลงฐานข้อมูล)
  const handleCreateSku = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("กรุณากรอกชื่อสินค้า");
    if (!formData.imageFile) return alert("กรุณาอัปโหลดรูปภาพสินค้าด้วยครับ");

    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const skuCode = `PV-${Date.now().toString().slice(-5)}`;

      // 1. ☁️ อัปโหลดรูปภาพเข้า Google Drive (ระบบจะรอจนกว่าจะได้ลิงก์ภาพกลับมา)
      setUploadStatusText('กำลังฝากไฟล์รูปภาพไปยัง Google Drive...');
      const uploadedImageUrl = await driveService.uploadUserSkuImage(formData.imageFile);
      
      setUploadStatusText('กำลังบันทึกข้อมูลสินค้า...');

      // 2. 📝 เตรียมชุดข้อมูลเพื่อบันทึก
      const adData = {
        ownerName: userProfile?.accountName || 'Partner',
        skuId: skuCode,
        name: formData.name,
        price: Number(formData.price) || 0,
        imageUrl: uploadedImageUrl, // ใช้ลิงก์ที่ได้จาก Google Drive
        status: SKU_STATUS.INACTIVE, // สถานะ INACTIVE = ยังไม่เปิดใช้งาน
        links: {
          shopee: formData.shopeeLink,
          lazada: formData.lazadaLink,
          tiktok: formData.tiktokLink,
          youtube: formData.youtubeLink
        }
      };

      // 3. 💾 สร้างรายการโฆษณา
      await userSkuService.createAdRequest(user.uid, adData);

      setIsModalOpen(false);
      setFormData({ name: '', price: '', shopeeLink: '', lazadaLink: '', tiktokLink: '', youtubeLink: '', imageFile: null, imagePreview: null });
      fetchMySkus(); 
      alert(`สร้างสินค้าเรียบร้อยแล้ว!\n(คุณสามารถกด "เปิดใช้งานโฆษณา" ได้ที่หน้ารายการสินค้า)`);
      
    } catch (error) {
      console.error("🔥 Error creating SKU:", error);
      alert(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  // 🚀 2. ฟังก์ชันเปิดใช้งานโฆษณา (Activate Ad) - เปลี่ยนมาเช็ค Credit แต่ยังไม่หักล่วงหน้า
  const handleActivateAd = async (sku) => {
    // เช็คว่ามีเครดิตเหลืออยู่หรือไม่
    if ((userProfile?.creditPoints || 0) <= 0) {
      return alert("Credit Point ของคุณไม่เพียงพอ กรุณาเติม Credit ก่อนเปิดใช้งานโฆษณาครับ");
    }

    if (!window.confirm(`ระบบจะส่งโฆษณานี้ให้ผู้จัดการอนุมัติ (เครดิตจะถูกหักตามจำนวนครั้งที่แสดงผล) ยืนยันหรือไม่?`)) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      // 1. เปลี่ยนสถานะเป็น PENDING (รอผู้จัดการ)
      const adRef = doc(db, 'user_skus', sku.id);
      await updateDoc(adRef, { status: SKU_STATUS.PENDING });

      // 2. ส่งงานไป To-do ผู้จัดการ
      await addDoc(collection(db, 'todos'), {
        type: 'USER_SKU_APPROVAL',
        title: `อนุมัติฝากโฆษณา: ${sku.name}`,
        status: 'pending_manager',
        priority: 'Normal',
        targetSkuId: sku.skuId,
        targetDocId: sku.id, 
        customerName: userProfile?.accountName || 'Partner',
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      // 3. บันทึก Log
      await addDoc(collection(db, 'history_logs'), {
        module: 'UserSKU',
        action: 'Activate',
        targetId: sku.skuId,
        details: `เปิดใช้งานโฆษณาสินค้า (รอผู้จัดการอนุมัติ)`,
        actionBy: user.uid,
        actorName: userProfile?.accountName || 'Partner',
        timestamp: serverTimestamp()
      });

      alert(`ส่งคำขอเปิดโฆษณาเรียบร้อยแล้ว\nสถานะปัจจุบัน: รอผู้จัดการอนุมัติ`);
      fetchMySkus();

    } catch (error) {
      console.error("🔥 Error activating Ad:", error);
      alert("ไม่สามารถเปิดใช้งานได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const filteredSkus = skus.filter(sku => 
    (sku.skuId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (sku.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status) {
      case SKU_STATUS.APPROVED: return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[9px] font-bold">กำลังแสดงผลโฆษณา</span>;
      case SKU_STATUS.PENDING: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[9px] font-bold">รอผู้จัดการอนุมัติ</span>;
      case SKU_STATUS.REJECTED: return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[9px] font-bold">ไม่อนุมัติ</span>;
      case SKU_STATUS.INACTIVE: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[9px] font-bold">ยังไม่เปิดโฆษณา</span>;
      default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[9px] font-bold">ไม่มีสถานะ</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
         <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           <Package size={22} className="text-emerald-600" /> สินค้าของฉัน (User SKU)
         </h2>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group active:scale-95"
         >
           <Plus size={16} className="group-hover:rotate-90 transition-transform" /> สร้างสินค้าใหม่
         </button>
       </div>
       
       <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-5 mb-6 shadow-sm flex items-start gap-4">
         <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-sm shrink-0">
           <div className="text-center">
             <p className="text-[10px] text-gray-500 font-bold uppercase">Credit</p>
             <p className="text-lg font-bold text-emerald-600 leading-none">{userProfile?.creditPoints || 0}</p>
           </div>
         </div>
         <div>
           <p className="text-sm font-bold text-emerald-800">ขยายช่องทางการขายด้วยการฝากโฆษณาสินค้า</p>
           <p className="text-[11px] md:text-xs text-emerald-700/80 mt-1.5 leading-relaxed max-w-3xl">
             ระบบจะแทรกสินค้าของคุณ (รหัส <strong>PV-</strong>) ไปยังหน้าสินค้าของบริษัท 
             คุณสามารถ <strong>"สร้างสินค้าเก็บไว้ได้ไม่จำกัด"</strong> และระบบจะเริ่มเช็คและหัก Credit ก็ต่อเมื่อคุณกด <strong>"เปิดใช้งานโฆษณา"</strong> และมีการนำไปแสดงผลให้ลูกค้าเห็นเท่านั้น
           </p>
         </div>
       </div>

       <div className="relative mb-6 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="ค้นหารหัส PV-XXXX หรือชื่อสินค้า..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm" 
          />
       </div>

       {/* ตารางแสดงสินค้า */}
       <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm min-h-[200px] relative">
         {loading && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
           </div>
         )}
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                 <th className="p-4">รูปภาพ & รหัส</th>
                 <th className="p-4">ข้อมูลสินค้า</th>
                 <th className="p-4">สถานะ</th>
                 <th className="p-4">ลิงก์ร้านค้า</th>
                 <th className="p-4 text-right">สถิติ/จัดการ</th>
               </tr>
             </thead>
             <tbody>
               {!loading && filteredSkus.length === 0 ? (
                 <tr><td colSpan="5" className="p-8 text-center text-xs text-gray-500">ยังไม่มีสินค้าในระบบ กดปุ่ม "สร้างสินค้าใหม่" เพื่อเริ่มต้น</td></tr>
               ) : (
                 filteredSkus.map(sku => (
                   <tr key={sku.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                     <td className="p-4 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                         {sku.imageUrl ? (
                           <img src={sku.imageUrl} alt={sku.name} className="w-full h-full object-cover" />
                         ) : (
                           <ImageIcon size={16} className="text-gray-400 m-auto h-full" />
                         )}
                       </div>
                       <span className="text-xs font-bold text-emerald-600">{sku.skuId}</span>
                     </td>
                     <td className="p-4">
                       <p className="text-xs font-bold text-gray-800 line-clamp-1">{sku.name}</p>
                       <p className="text-[10px] text-gray-500">฿{sku.price?.toLocaleString() || 0}</p>
                     </td>
                     <td className="p-4">{getStatusBadge(sku.status)}</td>
                     <td className="p-4">
                       <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                         {sku.links?.shopee && <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Shopee</span>}
                         {sku.links?.lazada && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Lazada</span>}
                         {sku.links?.tiktok && <span className="bg-black text-white px-1.5 py-0.5 rounded">TikTok</span>}
                         {sku.links?.youtube && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded">YouTube</span>}
                         {(!sku.links?.shopee && !sku.links?.lazada && !sku.links?.tiktok && !sku.links?.youtube) && <span className="text-gray-400">-</span>}
                       </div>
                     </td>
                     <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          {/* ปุ่มเปิดใช้งานโฆษณา (แสดงเฉพาะตอน INACTIVE) */}
                          {sku.status === SKU_STATUS.INACTIVE && (
                             <button 
                               onClick={() => handleActivateAd(sku)}
                               className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-colors"
                             >
                                <PlayCircle size={12}/> เปิดใช้งานโฆษณา
                             </button>
                          )}
                          
                          {/* สถิติการคลิก (แสดงเฉพาะตอน APPROVED) */}
                          {sku.status === SKU_STATUS.APPROVED && (
                            <span className="text-[9px] text-gray-400 font-medium">คลิก: {sku.clicks || 0} ครั้ง</span>
                          )}
                          
                          <button className="text-[10px] font-bold text-gray-500 hover:text-emerald-600 border border-gray-200 px-2 py-1 rounded-lg bg-white">แก้ไขข้อมูล</button>
                        </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
       </div>

       {/* Modal สร้างสินค้า */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 my-auto">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
               <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package size={18}/> สร้างรายการฝากโฆษณา</h3>
               {!isSubmitting && <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1"><X size={18}/></button>}
             </div>
             
             <form onSubmit={handleCreateSku} className="p-5 space-y-4 relative">
               
               {/* 🚀 Loading Overlay ทับฟอร์มตอนกดเซฟ */}
               {isSubmitting && (
                 <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-b-2xl">
                    <Loader2 size={40} className="text-emerald-500 animate-spin mb-3" />
                    <p className="text-emerald-700 font-bold text-sm">{uploadStatusText}</p>
                    <p className="text-xs text-gray-500 mt-1">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้...</p>
                 </div>
               )}

               {/* ส่วนอัปโหลดรูปภาพ */}
               <div>
                 <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">รูปภาพสินค้า (อัปโหลดเข้า Google Drive) <span className="text-red-500">*</span></label>
                 <div className="relative border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-xl p-4 transition-colors text-center bg-gray-50 group cursor-pointer overflow-hidden">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      required
                    />
                    {formData.imagePreview ? (
                      <div className="relative w-full h-32 flex items-center justify-center">
                        <img src={formData.imagePreview} alt="Preview" className="max-h-full rounded-lg shadow-sm object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                           <span className="text-white text-xs font-bold flex items-center gap-1"><UploadCloud size={14}/> เปลี่ยนรูปภาพ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-2 text-emerald-500">
                          <ImageIcon size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-700">คลิก หรือ ลากรูปภาพมาวาง</p>
                        <p className="text-[10px] text-gray-500 mt-1">ระบบจะฝากไฟล์อัตโนมัติ (ไม่เกิน 5MB)</p>
                      </div>
                    )}
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                   <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="เช่น กระเป๋าเป้สะพายหลัง รุ่น XYZ..." />
                 </div>
                 <div className="col-span-2">
                   <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ราคาโดยประมาณ (บาท)</label>
                   <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="0" />
                 </div>
               </div>

               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
                 <p className="text-[10px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><LinkIcon size={12}/> ลิงก์ไปหน้าร้านของคุณ</p>
                 <input type="url" value={formData.shopeeLink} onChange={e => setFormData({...formData, shopeeLink: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-orange-500" placeholder="Shopee URL..." />
                 <input type="url" value={formData.lazadaLink} onChange={e => setFormData({...formData, lazadaLink: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500" placeholder="Lazada URL..." />
                 <input type="url" value={formData.tiktokLink} onChange={e => setFormData({...formData, tiktokLink: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-black" placeholder="TikTok Shop URL..." />
                 
                 <div className="relative mt-2 pt-2 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><Youtube size={12} className="text-red-500"/> ลิงก์วิดีโอรีวิว</p>
                    <input type="url" value={formData.youtubeLink} onChange={e => setFormData({...formData, youtubeLink: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-500" placeholder="YouTube URL..." />
                 </div>
               </div>

               <div className="flex gap-2 pt-2 sticky bottom-0 bg-white">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                 <button type="submit" disabled={isSubmitting} className="flex-[2] py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2 disabled:bg-emerald-400 disabled:cursor-not-allowed shadow-sm">
                   <Save size={16} /> บันทึกข้อมูลสินค้า
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default TabUserSku;