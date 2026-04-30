/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Info, Link as LinkIcon, X, Loader2, Save } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';

const TabUserSku = ({ userProfile }) => {
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    shopeeLink: '',
    lazadaLink: '',
    tiktokLink: ''
  });

  // 🚀 Smart Fetch: ดึงสินค้าของตัวเอง
  const fetchMySkus = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'userSKUs'),
        where('ownerUid', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const fetchedSkus = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // เรียงล่าสุดขึ้นก่อน (In-memory ป้องกัน Index Error)
      fetchedSkus.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
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

  // 🚀 บันทึกสินค้าใหม่
  const handleCreateSku = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("กรุณากรอกชื่อสินค้า");

    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const skuCode = `PV-${Date.now().toString().slice(-5)}`; // สร้างรหัสสุ่ม PV-XXXXX

      const newSkuData = {
        ownerUid: auth.currentUser.uid,
        ownerName: userProfile?.accountName || 'Partner',
        skuId: skuCode,
        name: formData.name,
        price: Number(formData.price) || 0,
        links: {
          shopee: formData.shopeeLink,
          lazada: formData.lazadaLink,
          tiktok: formData.tiktokLink
        },
        status: 'pending', // ต้องรอหลังบ้าน Approve ก่อนแสดงหน้าเว็บ
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'userSKUs'), newSkuData);
      
      // ยิง Log ไปให้หลังบ้านทราบ
      await addDoc(collection(db, 'history_logs'), {
        module: 'UserSKU',
        action: 'Create',
        targetId: skuCode,
        details: `สร้างสินค้าใหม่รอการตรวจสอบ: ${formData.name}`,
        actionBy: auth.currentUser.uid,
        actorName: userProfile?.accountName || 'Partner',
        timestamp: serverTimestamp()
      });

      setIsModalOpen(false);
      setFormData({ name: '', price: '', shopeeLink: '', lazadaLink: '', tiktokLink: '' });
      fetchMySkus(); // โหลดข้อมูลใหม่
      alert("ส่งข้อมูลสินค้าใหม่เรียบร้อยแล้ว รอผู้ดูแลระบบตรวจสอบ (Pending)");
      
    } catch (error) {
      console.error("🔥 Error creating SKU:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSkus = skus.filter(sku => 
    sku.skuId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sku.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[9px] font-bold">กำลังแสดงผล</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[9px] font-bold">ไม่อนุมัติ</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[9px] font-bold">รอตรวจสอบ</span>;
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
           <Plus size={16} className="group-hover:rotate-90 transition-transform" /> สร้างสินค้าใหม่ (Generate PV-SKU)
         </button>
       </div>
       
       <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-5 mb-6 shadow-sm">
         <div className="flex items-start gap-3">
           <div className="bg-white p-1.5 rounded-lg border border-emerald-100 shadow-sm"><Info size={18} className="text-emerald-600" /></div>
           <div>
             <p className="text-sm font-bold text-emerald-800">ขยายช่องทางการขายด้วย User SKU</p>
             <p className="text-[11px] md:text-xs text-emerald-700/80 mt-1.5 leading-relaxed max-w-3xl">
               รหัสสินค้าของคุณจะขึ้นต้นด้วย <strong>PV-</strong> เสมอ คุณสามารถวางลิงก์ <strong className="text-orange-600">Shopee, Lazada, TikTok</strong> เพื่อให้ระบบสร้างปุ่มนำทางไปซื้อที่ร้านคุณได้โดยตรง
             </p>
           </div>
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
                 <th className="p-4">รหัส SKU</th>
                 <th className="p-4">ข้อมูลสินค้า</th>
                 <th className="p-4">สถานะ</th>
                 <th className="p-4">ลิงก์ร้านค้า</th>
                 <th className="p-4 text-right">จัดการ</th>
               </tr>
             </thead>
             <tbody>
               {!loading && filteredSkus.length === 0 ? (
                 <tr><td colSpan="5" className="p-8 text-center text-xs text-gray-500">ยังไม่มีสินค้าในระบบ กรุณาสร้างสินค้าใหม่</td></tr>
               ) : (
                 filteredSkus.map(sku => (
                   <tr key={sku.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                     <td className="p-4 text-xs font-bold text-emerald-600">{sku.skuId}</td>
                     <td className="p-4">
                       <p className="text-xs font-bold text-gray-800">{sku.name}</p>
                       <p className="text-[10px] text-gray-500">฿{sku.price?.toLocaleString() || 0}</p>
                     </td>
                     <td className="p-4">{getStatusBadge(sku.status)}</td>
                     <td className="p-4">
                       <div className="flex flex-wrap gap-1 text-[9px] font-bold">
                         {sku.links?.shopee && <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Shopee</span>}
                         {sku.links?.lazada && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Lazada</span>}
                         {sku.links?.tiktok && <span className="bg-black text-white px-1.5 py-0.5 rounded">TikTok</span>}
                         {(!sku.links?.shopee && !sku.links?.lazada && !sku.links?.tiktok) && <span className="text-gray-400">-</span>}
                       </div>
                     </td>
                     <td className="p-4 text-right">
                       <button className="text-[10px] font-bold text-gray-500 hover:text-emerald-600 border border-gray-200 px-2 py-1 rounded-lg bg-white">แก้ไข</button>
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
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package size={18}/> สร้างรายการสินค้า PV-SKU</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1"><X size={18}/></button>
             </div>
             <form onSubmit={handleCreateSku} className="p-5 space-y-4">
               <div>
                 <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                 <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="เช่น บอร์ดมือสอง รุ่น XYZ..." />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">ราคาโดยประมาณ (บาท)</label>
                 <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="0" />
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
                 <p className="text-[10px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><LinkIcon size={12}/> ลิงก์ไปหน้าร้านของคุณ</p>
                 <input type="url" value={formData.shopeeLink} onChange={e => setFormData({...formData, shopeeLink: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-orange-500" placeholder="Shopee URL..." />
                 <input type="url" value={formData.lazadaLink} onChange={e => setFormData({...formData, lazadaLink: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500" placeholder="Lazada URL..." />
                 <input type="url" value={formData.tiktokLink} onChange={e => setFormData({...formData, tiktokLink: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-black" placeholder="TikTok Shop URL..." />
               </div>
               <div className="flex gap-2 pt-2">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                 <button type="submit" disabled={isSubmitting} className="flex-[2] py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2">
                   {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ส่งขออนุมัติ
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