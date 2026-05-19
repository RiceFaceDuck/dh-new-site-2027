/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Info, AlertTriangle, Coins, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';

import { userSkuService } from '../../../firebase/userSkuService'; 
import { useUserCredit, formatCredit } from '../../../firebase/creditService'; 

// นำเข้า Sub-components ที่ถูกแยกส่วนแล้ว (Modular)
import UserSkuList from './UserSkuList';
import UserSkuFormModal from './UserSkuFormModal';

const TabUserSku = ({ userProfile }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  // ⚡ ดึงข้อมูลเครดิตแบบ Real-time จาก Backend
  const { balance, tier, loading: creditLoading } = useUserCredit(user?.uid);

  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null); // เก็บข้อมูลรายการที่กำลังจะแก้ไข

  // โหลดรายการโฆษณา
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

  // ==========================================
  // Action Handlers
  // ==========================================

  // จัดการการเปิด-ปิดสวิตช์โฆษณา
  const handleToggleActive = async (sku) => {
    const newActiveStatus = !sku.isActive;

    // 🛑 ตรวจสอบก่อนเปิดสวิตช์: ถ้าเครดิตหมด ไม่ให้เปิด
    if (newActiveStatus && balance <= 0) {
      alert("ไม่สามารถเปิดแสดงผลได้ เนื่องจากเครดิตพอยต์ของคุณหมดแล้ว กรุณาเติมเครดิตก่อนครับ");
      return;
    }

    // Optimistic UI Update ทำให้กดแล้วติดปุ๊บ ไม่หน่วง
    setSkus(skus.map(s => s.id === sku.id ? { ...s, isActive: newActiveStatus } : s));

    try {
      const adRef = doc(db, 'artifacts', window.__app_id || 'default-app-id', 'public', 'data', 'user_skus', sku.id);
      await updateDoc(adRef, { isActive: newActiveStatus, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("🔥 Error toggling active status:", error);
      // Revert if error
      setSkus(skus.map(s => s.id === sku.id ? { ...s, isActive: sku.isActive } : s));
      alert("ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // จัดการกดปุ่ม "แก้ไข"
  const handleEdit = (sku) => {
    setEditingAd(sku);
    setIsModalOpen(true);
  };

  // จัดการกดปุ่ม "ลบ"
  const handleDelete = async (sku) => {
    if (window.confirm(`คุณต้องการลบโฆษณาสินค้า "${sku.name}" ใช่หรือไม่?\nข้อมูลที่ลบไปแล้วจะไม่สามารถกู้คืนได้`)) {
      try {
        await userSkuService.deleteAdRequest(sku.id);
        // อัปเดต UI ทันทีโดยไม่ต้องโหลดใหม่
        setSkus(skus.filter(s => s.id !== sku.id));
        alert("ลบข้อมูลโฆษณาเรียบร้อยแล้ว");
      } catch (error) {
        console.error("Error deleting ad:", error);
        alert("เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  // ปิดหน้าต่าง Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAd(null); // ล้างข้อมูลแก้ไขทุกครั้งที่ปิด
  };

  const filteredSkus = skus.filter(sku => 
    (sku.skuId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (sku.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 relative">
       
       {/* Header Section */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
         <div>
           <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
             <Package size={24} className="text-[#0870B8]" /> สินค้าของฉัน (User SKU)
           </h2>
           <p className="text-sm text-gray-500 mt-1">จัดการพื้นที่ฝากโฆษณาสินค้าและช่องทางการขายของท่าน</p>
         </div>
         <button 
           onClick={() => { setEditingAd(null); setIsModalOpen(true); }}
           className="bg-[#0870B8] hover:bg-[#065A96] text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group active:scale-95"
         >
           <Plus size={18} className="group-hover:rotate-90 transition-transform" /> เพิ่มโฆษณาสินค้า
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
             คุณสามารถเพิ่มสินค้าได้ <strong>ไม่จำกัดจำนวน</strong> โดยระบบจะคำนวณและตัดเครดิตเฉพาะตอนที่มีลูกค้าเห็นหรือคลิกหน้าเว็บจริงเท่านั้น
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

       {/* Search Bar */}
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

       {/* 🚀 เรียกใช้ Modular Components */}
       <UserSkuList 
         skus={filteredSkus} 
         loading={loading} 
         balance={balance} 
         onToggleActive={handleToggleActive} 
         onEdit={handleEdit}
         onDelete={handleDelete}
       />

       {/* Modal ฟอร์ม (ทำงาน 2 โหมด: สร้างใหม่ และ แก้ไข) */}
       <UserSkuFormModal 
         isOpen={isModalOpen} 
         onClose={handleCloseModal} 
         onSuccess={fetchMySkus} 
         user={user} 
         userProfile={userProfile} 
         editingAd={editingAd}
       />
       
    </div>
  );
};

export default TabUserSku;