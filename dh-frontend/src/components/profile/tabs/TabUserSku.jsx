/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Info, AlertTriangle, Coins, Loader2, BarChart3, Eye, MousePointerClick, TrendingUp, Activity } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getAuth } from 'firebase/auth';

import { userSkuService, SKU_STATUS } from '../../../firebase/userSkuService'; 
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
  // 📊 คำนวณสถิติ Analytics แบบ Real-time
  // ==========================================
  const stats = skus.reduce((acc, sku) => {
    acc.views += (sku.viewsCount || 0);
    acc.clicks += (sku.clicksCount || 0);
    // นับโฆษณาที่เปิดใช้งานและระบบอนุมัติแล้ว
    if (sku.isActive && (sku.status === SKU_STATUS.APPROVED || sku.status === 'active')) {
        acc.activeAds++;
    }
    return acc;
  }, { views: 0, clicks: 0, activeAds: 0 });

  const ctr = stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : "0.0";

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
             <Package size={24} className="text-[#0870B8]" /> พื้นที่โฆษณาสินค้า
           </h2>
           <p className="text-sm text-gray-500 mt-1">จัดการและตรวจสอบประสิทธิภาพโฆษณาสินค้าของคุณ</p>
         </div>
         <button 
           onClick={() => { setEditingAd(null); setIsModalOpen(true); }}
           className="bg-[#0870B8] hover:bg-[#065A96] text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group active:scale-95"
         >
           <Plus size={18} className="group-hover:rotate-90 transition-transform" /> เพิ่มโฆษณาสินค้า
         </button>
       </div>
       
       {/* 💳 Dashboard Section: Credit + Analytics */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
         
         {/* Card 1: Credit Balance */}
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
           
           <div className="flex items-center justify-between mb-2 relative z-10">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Coins size={14} className="text-emerald-400"/> Credit Balance
             </p>
             {!creditLoading && tier && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full border ${tier.border} ${tier.bg} ${tier.color} uppercase font-bold tracking-wider`}>
                  {tier.name}
                </span>
             )}
           </div>

           {creditLoading ? (
             <div className="flex items-center gap-3 py-2"><Loader2 className="animate-spin text-emerald-400" size={24} /> <span className="text-sm text-slate-400">กำลังโหลด...</span></div>
           ) : (
             <div className="relative z-10 flex items-baseline gap-2">
               <p className={`text-4xl font-black font-tech tracking-tight ${balance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCredit(balance)}
               </p>
               <span className="text-sm text-slate-400 font-medium mb-1">พอยต์</span>
             </div>
           )}
           
           <p className="text-[10px] text-slate-400 mt-3 relative z-10 leading-relaxed">
             ใช้เพื่อลงโฆษณาใหม่ (หักพอยต์ตอนสร้าง) <br/>สถิติผู้เข้าชมอัปเดตแบบเรียลไทม์ฟรี
           </p>
         </div>

         {/* Card 2: Mini Analytics Dashboard */}
         <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#0870B8]"/> ภาพรวมประสิทธิภาพโฆษณา
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                 <Activity size={10} className="animate-pulse"/> Live
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-50 transition-transform hover:scale-105">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Eye size={12} className="text-blue-500"/> ผู้เข้าชมรวม</p>
                <p className="text-xl font-black text-blue-700">{stats.views.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-50 transition-transform hover:scale-105">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><MousePointerClick size={12} className="text-emerald-500"/> ยอดคลิกรวม</p>
                <p className="text-xl font-black text-emerald-700">{stats.clicks.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-50 transition-transform hover:scale-105">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-purple-500"/> อัตราคลิก (CTR)</p>
                <p className="text-xl font-black text-purple-700">{ctr}%</p>
              </div>
              <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-50 transition-transform hover:scale-105">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Package size={12} className="text-orange-500"/> กำลังทำงาน</p>
                <p className="text-xl font-black text-orange-700">{stats.activeAds} <span className="text-xs font-normal text-gray-500">โฆษณา</span></p>
              </div>
            </div>
         </div>
       </div>

       {/* ⚠️ ป้ายแจ้งเตือนฉุกเฉิน (แสดงเฉพาะเมื่อเครดิตหมด) */}
       {balance <= 0 && !creditLoading && (
         <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm animate-pulse">
           <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
           <div>
             <h4 className="text-sm font-bold text-rose-800">⚠️ เครดิตพอยต์ของคุณหมดแล้ว!</h4>
             <p className="text-xs text-rose-600 mt-1 leading-relaxed">
               คุณจะไม่สามารถสร้างโฆษณาใหม่ หรือเปิดสวิตช์โฆษณาที่หยุดพักไว้ได้ <br/>
               กรุณาเติมเครดิตเข้าสู่ระบบเพื่อให้สามารถทำรายการได้อย่างต่อเนื่อง
             </p>
           </div>
         </div>
       )}

       {/* ℹ️ ป้ายแจ้งเตือนเงื่อนไขการแสดงผล (แสดงเมื่อเครดิตยังเหลือ) */}
       {balance > 0 && !creditLoading && (
         <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-6 flex items-start gap-3 shadow-sm">
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
               <strong>เงื่อนไขโฆษณา:</strong> สินค้าของคุณจะแสดงผลให้ลูกค้าเห็นก็ต่อเมื่อได้รับ <strong>"การอนุมัติ"</strong> จากผู้จัดการ, มีการ <strong>"เปิดสวิตช์โฆษณา"</strong> (สีเขียว), และ <strong>ยอดเครดิตพอยต์ต้องมากกว่า 0</strong> 
            </p>
         </div>
       )}

       {/* Search Bar */}
       <div className="relative mb-6 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="ค้นหารหัส หรือชื่อสินค้าโฆษณา..." 
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