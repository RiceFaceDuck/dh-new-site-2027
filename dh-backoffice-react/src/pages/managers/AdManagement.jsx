/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Megaphone, Search, Filter, Loader2, CheckCircle2, XCircle, ExternalLink, Image as ImageIcon, Store, PlayCircle } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 📌 สถานะของ User SKU (ต้องตรงกับหน้าบ้าน)
const SKU_STATUS = {
  PENDING: 'PENDING',     // รอตรวจสอบ
  APPROVED: 'APPROVED',   // อนุมัติแล้ว
  REJECTED: 'REJECTED',   // ไม่อนุมัติ
  INACTIVE: 'INACTIVE'    // ยังไม่เปิดใช้งาน (หน้าหลังบ้านอาจจะไม่ต้องโฟกัสอันนี้มาก)
};

const AdManagement = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(SKU_STATUS.PENDING);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // เก็บ ID ของโฆษณาที่กำลังทำรายการ

  // 🚀 ดึงข้อมูล User SKUs ทั้งหมดที่ลูกค้ายื่นขอมา
  const fetchAds = async () => {
    setLoading(true);
    try {
      // ดึงจาก Collection 'user_skus' ที่ลูกค้าบันทึกจากหน้าบ้าน
      const adsRef = collection(db, 'user_skus');
      const q = query(adsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const fetchedAds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAds(fetchedAds);
    } catch (error) {
      console.error("🔥 Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // 🔍 กรองข้อมูลตาม Tab และ คำค้นหา
  const filteredAds = ads.filter(ad => {
    const matchesTab = (ad.status || SKU_STATUS.PENDING) === activeTab;
    const matchesSearch = 
      (ad.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ad.skuId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ad.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // ⚡ อัปเดตสถานะโฆษณา (อนุมัติ / ไม่อนุมัติ)
  const handleUpdateStatus = async (ad, newStatus) => {
    const actionText = newStatus === SKU_STATUS.APPROVED ? 'อนุมัติ (Approve)' : 'ปฏิเสธ (Reject)';
    if (!window.confirm(`คุณต้องการ ${actionText} โฆษณารหัส ${ad.skuId} ใช่หรือไม่?`)) return;

    setActionLoading(ad.id);
    try {
      const adRef = doc(db, 'user_skus', ad.id);
      
      // 1. อัปเดตสถานะใน user_skus โดยไม่ต้องทำ Transaction คืนเงิน เพราะเรายังไม่ได้หัก
      await updateDoc(adRef, { 
        status: newStatus, 
        updatedAt: serverTimestamp(),
        // หากต้องการเก็บประวัติคนอนุมัติ สามารถเพิ่ม approvedBy ลงไปได้
      });

      // 2. ปิดงานใน To-dos อัตโนมัติ
      try {
        const todosRef = collection(db, 'todos');
        const qTodos = query(todosRef); // จริงๆ ควร query ด้วย where('targetSkuId', '==', ad.skuId) 
        const querySnapshot = await getDocs(qTodos);
        
        // ใช้ for...of เพื่อหลีกเลี่ยงปัญหา async ใน forEach
        for (const todoDoc of querySnapshot.docs) {
          const todoData = todoDoc.data();
          if (todoData.targetSkuId === ad.skuId && todoData.status === 'pending_manager') {
            await updateDoc(todoDoc.ref, { 
              status: newStatus === SKU_STATUS.APPROVED ? 'completed' : 'rejected',
              completedAt: serverTimestamp(),
              actionBy: 'Manager',
              actionNote: `จัดการจากหน้า AdManagement (${newStatus})`
            });
          }
        }
      } catch (err) {
        console.error("🔥 Error updating todo task:", err);
      }
      
      // 3. รีเฟรชข้อมูลใน State หน้าจอทันที (Optimistic Update)
      setAds(prevAds => prevAds.map(a => 
        a.id === ad.id ? { ...a, status: newStatus } : a
      ));
      
    } catch (error) {
      console.error("🔥 Error updating ad status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* 🎯 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="text-emerald-600" />
            พิจารณาสินค้าโฆษณา (User SKUs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบเนื้อหา รูปภาพ และลิงก์สินค้าของ Partner ก่อนอนุญาตให้แสดงผล</p>
        </div>
      </div>

      {/* 🛠️ Controls (Tabs & Search) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Tabs */}
        <div className="flex bg-gray-50 p-1.5 rounded-xl w-full lg:w-auto border border-gray-100">
          <button
            onClick={() => setActiveTab(SKU_STATUS.PENDING)}
            className={`flex-1 lg:flex-none px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === SKU_STATUS.PENDING ? 'bg-white text-amber-700 shadow-sm border border-amber-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === SKU_STATUS.PENDING ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
            รอพิจารณา ({ads.filter(a => (a.status || SKU_STATUS.PENDING) === SKU_STATUS.PENDING).length})
          </button>
          <button
            onClick={() => setActiveTab(SKU_STATUS.APPROVED)}
            className={`flex-1 lg:flex-none px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === SKU_STATUS.APPROVED ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === SKU_STATUS.APPROVED ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
            อนุมัติแล้ว ({ads.filter(a => a.status === SKU_STATUS.APPROVED).length})
          </button>
          <button
            onClick={() => setActiveTab(SKU_STATUS.REJECTED)}
            className={`flex-1 lg:flex-none px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === SKU_STATUS.REJECTED ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === SKU_STATUS.REJECTED ? 'bg-rose-500' : 'bg-gray-300'}`}></div>
            ไม่อนุมัติ ({ads.filter(a => a.status === SKU_STATUS.REJECTED).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า, รหัส PV, หรือชื่อพาร์ทเนอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-colors text-sm"
          />
        </div>
      </div>

      {/* 📦 รายการโฆษณา (Ad Grid) */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600 w-10 h-10 mb-4" />
          <span className="text-gray-500 font-bold">กำลังซิงค์ข้อมูลสินค้า...</span>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <Filter className="text-gray-400 w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-700">ไม่พบรายการโฆษณา</h3>
          <p className="text-gray-500 mt-2">ไม่มีข้อมูลในสถานะนี้ หรือ ไม่พบคำที่ท่านค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-emerald-300 transition-colors overflow-hidden flex flex-col group">
              
              {/* Card Header (Owner Info) */}
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {(ad.ownerName || 'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ส่งโดย Partner</p>
                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{ad.ownerName || 'ไม่ระบุชื่อ'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-medium block">
                    {ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString('th-TH') : 'ไม่ระบุวันที่'}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">{ad.skuId}</span>
                </div>
              </div>

              {/* Card Body (Ad Info) */}
              <div className="p-5 flex-1">
                <div className="flex gap-4">
                  {/* Image Thumbnail */}
                  <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} alt={ad.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Image+Error' }} />
                    ) : (
                      <ImageIcon className="text-gray-300 w-8 h-8" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-gray-800 text-base leading-tight line-clamp-2 mb-1.5" title={ad.name}>
                      {ad.name || 'ไม่มีชื่อสินค้า'}
                    </h4>
                    <p className="text-sm font-bold text-emerald-600 mb-2">
                      ฿{Number(ad.price || 0).toLocaleString()}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                       {ad.links?.shopee && <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">Shopee</span>}
                       {ad.links?.lazada && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Lazada</span>}
                       {ad.links?.tiktok && <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded font-bold">TikTok</span>}
                    </div>
                  </div>
                </div>

                {/* Video Link Highlight */}
                {ad.links?.youtube && (
                  <div className="mt-4 p-2.5 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                    <PlayCircle size={16} className="text-red-500 shrink-0" />
                    <a href={ad.links.youtube} target="_blank" rel="noopener noreferrer" className="text-xs text-red-700 font-medium hover:underline truncate">
                      ตรวจสอบคลิปวิดีโอ (YouTube)
                    </a>
                  </div>
                )}
                
                {/* Store Links Check */}
                <div className="mt-3 space-y-1.5">
                   {['shopee', 'lazada', 'tiktok'].map(platform => {
                     if(ad.links?.[platform]) {
                       return (
                         <div key={platform} className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                           <Store size={12} className="text-gray-400" />
                           <span className="capitalize w-12 font-bold">{platform}:</span>
                           <a href={ad.links[platform]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate flex-1 flex items-center gap-1">
                             <ExternalLink size={10} /> เช็คลิงก์ปลายทาง
                           </a>
                         </div>
                       )
                     }
                     return null;
                   })}
                </div>
              </div>

              {/* 🖱️ Card Actions */}
              <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-2.5">
                {activeTab === SKU_STATUS.PENDING && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(ad, SKU_STATUS.REJECTED)}
                      disabled={actionLoading === ad.id}
                      className="flex-1 py-2 text-xs font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle size={16} /> ปฏิเสธ (ผิดกฎ)
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(ad, SKU_STATUS.APPROVED)}
                      disabled={actionLoading === ad.id}
                      className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50 shadow-sm"
                    >
                      {actionLoading === ad.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      อนุมัติโฆษณา
                    </button>
                  </>
                )}
                
                {activeTab === SKU_STATUS.APPROVED && (
                  <button 
                    onClick={() => handleUpdateStatus(ad, SKU_STATUS.REJECTED)}
                    disabled={actionLoading === ad.id}
                    className="w-full py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors flex justify-center items-center gap-1.5"
                  >
                    <XCircle size={16} className="text-gray-400" /> เพิกถอนการอนุมัติ (แบน)
                  </button>
                )}

                {activeTab === SKU_STATUS.REJECTED && (
                  <button 
                    onClick={() => handleUpdateStatus(ad, SKU_STATUS.PENDING)}
                    disabled={actionLoading === ad.id}
                    className="w-full py-2 text-xs font-bold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-xl transition-colors flex justify-center items-center gap-1.5"
                  >
                    นำกลับมาพิจารณาใหม่
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdManagement;