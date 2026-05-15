/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Info, Link as LinkIcon, X, Loader2, Save, Image as ImageIcon, UploadCloud, Youtube, Store, PlayCircle, AlertTriangle, Coins } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';

import { driveService } from '../../../firebase/driveService';
import { userSkuService, SKU_STATUS } from '../../../firebase/userSkuService'; 
// 🚀 นำเข้า Hook อัจฉริยะสำหรับดึงเครดิตแบบ Real-time
import { useUserCredit, formatCredit } from '../../../firebase/creditService'; 

const TabUserSku = ({ userProfile }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  // ⚡ ดึงข้อมูลเครดิตแบบ Real-time จาก Backend (ไม่ต้องรอรีเฟรชหน้า)
  const { balance, tier, loading: creditLoading } = useUserCredit(user?.uid);

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

  // ดึงสินค้าโฆษณาของตัวเอง
  const fetchMySkus = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetchedSkus = await userSkuService.getUserAds(user.uid);
      setSkus(fetchedSkus);
    } catch (error) {
      console.error("🔥 Error fetching User SKUs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySkus();
  }, [user]);

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

  // 🚀 1. บันทึกสินค้าใหม่ (สร้างได้เลย ไม่ต้องหักเครดิต ส่งให้แอดมินอนุมัติทันที)
  const handleCreateSku = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("กรุณากรอกชื่อสินค้า");
    if (!formData.imageFile) return alert("กรุณาอัปโหลดรูปภาพสินค้าด้วยครับ");

    setIsSubmitting(true);
    try {
      const skuCode = `PV-${Date.now().toString().slice(-5)}`;

      // 1. ☁️ อัปโหลดรูปภาพเข้า Google Drive
      setUploadStatusText('กำลังฝากไฟล์รูปภาพไปยัง Google Drive...');
      const uploadedImageUrl = await driveService.uploadUserSkuImage(formData.imageFile);
      
      setUploadStatusText('กำลังบันทึกและส่งข้อมูลให้ผู้จัดการอนุมัติ...');

      // 2. 📝 เตรียมชุดข้อมูลเพื่อบันทึก
      const adData = {
        ownerName: userProfile?.accountName || userProfile?.displayName || 'Partner',
        ownerUid: user.uid,
        skuId: skuCode,
        name: formData.name,
        price: Number(formData.price) || 0,
        imageUrl: uploadedImageUrl,
        status: SKU_STATUS.PENDING, // ส่งให้ผู้จัดการตรวจสอบทันที
        isActive: true, // ค่าเริ่มต้นเปิดสวิตช์ไว้เลย (แต่จะแสดงผลไหมอยู่ที่ Credit > 0)
        links: {
          shopee: formData.shopeeLink,
          lazada: formData.lazadaLink,
          tiktok: formData.tiktokLink,
          youtube: formData.youtubeLink
        }
      };

      // 3. 💾 สร้างรายการโฆษณาลง DB
      await userSkuService.createAdRequest(user.uid, adData);

      // 4. 🔔 ส่งงานไป To-do ผู้จัดการทันทีที่สร้าง
      await addDoc(collection(db, 'todos'), {
        type: 'USER_SKU_APPROVAL',
        title: `ตรวจสอบโฆษณา: ${formData.name}`,
        status: 'pending_manager',
        priority: 'Normal',
        targetSkuId: skuCode,
        customerName: userProfile?.accountName || userProfile?.displayName || 'Partner',
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      // 5. 📜 บันทึก Log การสร้าง
      await addDoc(collection(db, 'history_logs'), {
        module: 'UserSKU',
        action: 'Create',
        targetId: skuCode,
        details: `สร้างสินค้าโฆษณาใหม่ (รอการอนุมัติ)`,
        actionBy: user.uid,
        actorName: userProfile?.accountName || 'Partner',
        timestamp: serverTimestamp()
      });

      setIsModalOpen(false);
      setFormData({ name: '', price: '', shopeeLink: '', lazadaLink: '', tiktokLink: '', youtubeLink: '', imageFile: null, imagePreview: null });
      fetchMySkus(); 
      alert(`สร้างสินค้าเรียบร้อยแล้ว!\nระบบได้ส่งคำขอให้ผู้จัดการตรวจสอบแล้วครับ`);
      
    } catch (error) {
      console.error("🔥 Error creating SKU:", error);
      alert(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  // 🚀 2. ฟังก์ชันเปิด/ปิด สวิตช์การแสดงผล (Toggle Active Status)
  const handleToggleActive = async (sku) => {
    const newActiveStatus = !sku.isActive;

    // 🛑 ตรวจสอบก่อนเปิดสวิตช์: ถ้าเครดิตหมด ไม่ให้เปิด
    if (newActiveStatus && balance <= 0) {
      alert("ไม่สามารถเปิดแสดงผลได้ เนื่องจากเครดิตพอยต์ของคุณหมดแล้ว กรุณาเติมเครดิตก่อนครับ");
      return;
    }

    // อัปเดต UI ทันทีเพื่อความลื่นไหล (Optimistic UI Update)
    setSkus(skus.map(s => s.id === sku.id ? { ...s, isActive: newActiveStatus } : s));

    try {
      const adRef = doc(db, 'user_skus', sku.id);
      await updateDoc(adRef, { isActive: newActiveStatus, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("🔥 Error toggling active status:", error);
      // หากเกิดข้อผิดพลาด ให้คืนค่า UI กลับเป็นเหมือนเดิม
      setSkus(skus.map(s => s.id === sku.id ? { ...s, isActive: sku.isActive } : s));
      alert("ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const filteredSkus = skus.filter(sku => 
    (sku.skuId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (sku.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status) {
      case SKU_STATUS.APPROVED: return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-emerald-200">อนุมัติแล้ว</span>;
      case SKU_STATUS.PENDING: return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-amber-200">รอตรวจสอบ</span>;
      case SKU_STATUS.REJECTED: return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-bold border border-red-200">ไม่อนุมัติ</span>;
      default: return <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[10px] font-bold border border-slate-200">ไม่ทราบสถานะ</span>;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
       
       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
         <div>
           <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
             <Package size={24} className="text-[#0870B8]" /> สินค้าของฉัน (User SKU)
           </h2>
           <p className="text-sm text-gray-500 mt-1">จัดการพื้นที่ฝากโฆษณาสินค้าและช่องทางการขายของท่าน</p>
         </div>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-[#0870B8] hover:bg-[#065A96] text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group active:scale-95"
         >
           <Plus size={18} className="group-hover:rotate-90 transition-transform" /> เพิ่มโฆษณาสินค้า (ฟรี)
         </button>
       </div>
       
       {/* 💳 แสดงยอดเครดิต (Real-time) */}
       <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 mb-4 shadow-lg flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
         
         <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/10 shadow-inner shrink-0 text-center min-w-[140px] relative z-10">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
              <Coins size={12}/> Credit Point
           </p>
           {creditLoading ? (
             <div className="flex justify-center py-2"><Loader2 className="animate-spin text-emerald-400" size={24} /></div>
           ) : (
             <p className={`text-3xl font-black font-tech tracking-tight ${balance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCredit(balance)}
             </p>
           )}
         </div>
         
         <div className="relative z-10 text-center md:text-left">
           <h3 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
             ขยายช่องทางการขายด้วยพื้นที่โฆษณาพิเศษ
             {!creditLoading && tier && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tier.border} ${tier.bg} ${tier.color} uppercase tracking-wider`}>
                  {tier.name}
                </span>
             )}
           </h3>
           <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">
             ระบบจะแทรกสินค้าของคุณ (รหัส <span className="text-emerald-400 font-bold">PV-XXXX</span>) ปะปนไปกับหน้าสินค้าของบริษัท 
             คุณสามารถเพิ่มสินค้าได้ <strong>ฟรี ไม่จำกัดจำนวน</strong> โดยระบบจะคำนวณและตัดเครดิตเฉพาะตอนที่มีลูกค้าเห็นหรือคลิกหน้าเว็บจริงเท่านั้น
           </p>
         </div>
       </div>

       {/* ⚠️ ป้ายแจ้งเตือนฉุกเฉิน (แสดงเฉพาะเมื่อเครดิตหมด) */}
       {balance <= 0 && !creditLoading && (
         <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm animate-pulse">
           <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
           <div>
             <h4 className="text-sm font-bold text-rose-800">⚠️ เครดิตพอยต์ของคุณหมดแล้ว!</h4>
             <p className="text-xs text-rose-600 mt-1 leading-relaxed">
               สินค้าโฆษณาของคุณทั้งหมดจะ <strong>ถูกระงับการแสดงผลบนหน้าเว็บไซต์ชั่วคราว</strong> (แม้ว่าจะเปิดสวิตช์ไว้ก็ตาม) <br/>
               กรุณาเติมเครดิตเข้าสู่ระบบเพื่อให้โฆษณากลับมาแสดงผลตามปกติครับ
             </p>
           </div>
         </div>
       )}

       {/* ℹ️ ป้ายแจ้งเตือนเงื่อนไขการแสดงผล (แสดงเมื่อเครดิตยังเหลือ) */}
       {balance > 0 && !creditLoading && (
         <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-6 flex items-start gap-3 shadow-sm">
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
               <strong>เงื่อนไขการแสดงผลหน้าเว็บ:</strong> สินค้าของคุณจะแสดงผลให้ลูกค้าเห็นก็ต่อเมื่อได้รับ <strong>"การอนุมัติ"</strong> จากผู้จัดการ, มีการ <strong>"เปิดสวิตช์โฆษณา"</strong> (สีเขียว), และ <strong>ยอดเครดิตพอยต์ต้องมากกว่า 0</strong> 
            </p>
         </div>
       )}

       {/* แถบค้นหา */}
       <div className="relative mb-6 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="ค้นหารหัส PV-XXXX หรือชื่อสินค้าโฆษณา..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0870B8]/20 focus:border-[#0870B8] focus:outline-none shadow-sm transition-all" 
          />
       </div>

       {/* ตารางแสดงสินค้า */}
       <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm min-h-[300px] relative">
         {loading && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
             <Loader2 className="w-10 h-10 text-[#0870B8] animate-spin mb-3" />
             <p className="text-sm font-bold text-gray-600">กำลังโหลดข้อมูลสินค้า...</p>
           </div>
         )}
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                 <th className="p-4 pl-6">รูปภาพ & รหัส</th>
                 <th className="p-4">รายละเอียดโฆษณา</th>
                 <th className="p-4">สถานะตรวจสอบ</th>
                 <th className="p-4">ปลายทางลิงก์</th>
                 <th className="p-4 text-right pr-6">สวิตช์โฆษณา / จัดการ</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {!loading && filteredSkus.length === 0 ? (
                 <tr>
                   <td colSpan="5" className="p-16 text-center">
                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Package size={24} className="text-gray-400" />
                     </div>
                     <p className="text-sm font-bold text-gray-600 mb-1">ยังไม่มีสินค้าในระบบ</p>
                     <p className="text-xs text-gray-400">กดปุ่ม "เพิ่มโฆษณาสินค้า" ด้านบนเพื่อเริ่มต้น</p>
                   </td>
                 </tr>
               ) : (
                 filteredSkus.map(sku => {
                   // 💡 เช็คสถานะการแสดงผลจริงบนหน้าเว็บ
                   const isActuallyShowing = sku.isActive && balance > 0 && sku.status === SKU_STATUS.APPROVED;
                   const isCreditDepleted = sku.isActive && balance <= 0;

                   return (
                     <tr key={sku.id} className="hover:bg-blue-50/30 transition-colors group">
                       <td className="p-4 pl-6 flex items-center gap-4">
                         <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                           {sku.imageUrl ? (
                             <img src={sku.imageUrl} alt={sku.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : (
                             <ImageIcon size={20} className="text-gray-400 m-auto h-full" />
                           )}
                         </div>
                         <span className="text-sm font-black font-tech text-[#0870B8] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{sku.skuId}</span>
                       </td>
                       <td className="p-4 align-top">
                         <p className="text-sm font-bold text-gray-800 line-clamp-2 max-w-[250px] mb-1 leading-snug">{sku.name}</p>
                         <p className="text-xs font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">฿{sku.price?.toLocaleString() || 0}</p>
                       </td>
                       <td className="p-4 align-top pt-5">
                         {getStatusBadge(sku.status)}
                       </td>
                       <td className="p-4 align-top pt-4">
                         <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                           {sku.links?.shopee && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold shadow-sm">Shopee</span>}
                           {sku.links?.lazada && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold shadow-sm">Lazada</span>}
                           {sku.links?.tiktok && <span className="text-[10px] bg-black text-white px-2 py-1 rounded font-bold shadow-sm">TikTok</span>}
                           {sku.links?.youtube && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold shadow-sm flex items-center gap-1"><Youtube size={10}/> YouTube</span>}
                           {(!sku.links?.shopee && !sku.links?.lazada && !sku.links?.tiktok && !sku.links?.youtube) && <span className="text-xs text-gray-400">-</span>}
                         </div>
                       </td>
                       <td className="p-4 pr-6 text-right align-top pt-4">
                          <div className="flex flex-col items-end gap-3">
                            
                            {/* 🔘 สวิตช์เปิด-ปิด โฆษณา */}
                            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${isCreditDepleted ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                              <span className={`text-[11px] font-bold ${
                                isCreditDepleted ? 'text-rose-600' : 
                                (sku.isActive ? 'text-emerald-600' : 'text-gray-400')
                              }`}>
                                 {isCreditDepleted ? 'ระงับ (เครดิตหมด)' : (sku.isActive ? 'กำลังเปิดโฆษณา' : 'ปิดโฆษณา')}
                              </span>
                              <button
                                onClick={() => handleToggleActive(sku)}
                                disabled={!sku.isActive && balance <= 0} // ป้องกันการกดเปิดถ้าเครดิตหมด
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  sku.isActive && balance > 0 ? 'bg-emerald-500 focus:ring-emerald-500' : 
                                  (isCreditDepleted ? 'bg-rose-400 opacity-50 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-400')
                                }`}
                              >
                                <span 
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${sku.isActive ? 'translate-x-6' : 'translate-x-1'}`} 
                                />
                              </button>
                            </div>
                            
                            {/* สถิติการคลิก (แสดงเมื่อโฆษณามีการเคลื่อนไหว) */}
                            {sku.status === SKU_STATUS.APPROVED && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                  คลิก: <span className="font-bold text-gray-800">{sku.clicks || 0}</span>
                                </span>
                              </div>
                            )}
                          </div>
                       </td>
                     </tr>
                   );
                 })
               )}
             </tbody>
           </table>
         </div>
       </div>

       {/* Modal สร้างสินค้า */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-10">
               <h3 className="font-black text-gray-800 flex items-center gap-2 text-lg"><Package className="text-[#0870B8]" size={20}/> เพิ่มรายการฝากโฆษณา (ฟรี)</h3>
               {!isSubmitting && <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><X size={20}/></button>}
             </div>
             
             <form onSubmit={handleCreateSku} className="p-6 space-y-5 relative">
               
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
                      required
                    />
                    {formData.imagePreview ? (
                      <div className="relative w-full h-40 flex items-center justify-center">
                        <img src={formData.imagePreview} alt="Preview" className="max-h-full rounded-lg shadow-sm object-contain" />
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                           <span className="text-white text-sm font-bold flex items-center gap-2"><UploadCloud size={18}/> เปลี่ยนรูปภาพ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-3 text-[#0870B8]">
                          <ImageIcon size={28} />
                        </div>
                        <p className="text-base font-bold text-gray-700 mb-1">คลิก หรือ ลากรูปภาพมาวางที่นี่</p>
                        <p className="text-xs text-gray-500">รองรับ JPG, PNG ขนาดไม่เกิน 5MB (ฝากไฟล์เข้า G-Drive อัตโนมัติ)</p>
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
                 <p className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1.5"><LinkIcon size={14}/> 4. ลิงก์ปลายทาง (สั่งซื้อสินค้า)</p>
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
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                 <button type="submit" disabled={isSubmitting} className="flex-[2] py-3.5 bg-[#0870B8] text-white font-bold text-sm rounded-xl hover:bg-[#065A96] transition-all flex justify-center items-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 active:scale-95">
                   <Save size={18} /> ยืนยันการสร้างสินค้าโฆษณา
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