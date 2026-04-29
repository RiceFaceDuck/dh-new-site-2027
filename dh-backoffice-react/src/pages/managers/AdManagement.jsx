import React, { useState, useEffect } from 'react';
import { Megaphone, Search, Filter, Loader2, CheckCircle2, XCircle, ExternalLink, Image as ImageIcon, Eye } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

// App ID ของโปรเจกต์
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const AdManagement = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_approval'); // 'pending_approval' | 'active' | 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // เก็บ ID ของโฆษณาที่กำลังทำรายการ

  const fetchAds = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลโฆษณาทั้งหมด (ในการใช้งานจริงอาจจะต้องทำ Pagination ถ้าข้อมูลเยอะ)
      const adsRef = collection(db, 'artifacts', appId, 'public', 'data', 'marketing_ads');
      const q = query(adsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const fetchedAds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAds(fetchedAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // กรองโฆษณาตาม Tab และคำค้นหา
  const filteredAds = ads.filter(ad => {
    const matchesTab = (ad.status || 'pending_approval') === activeTab;
    const matchesSearch = 
      (ad.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ad.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // ฟังก์ชันอัปเดตสถานะโฆษณา
  const handleUpdateStatus = async (adId, newStatus) => {
    if (!window.confirm(`ยืนยันการเปลี่ยนสถานะโฆษณานี้เป็น ${newStatus} ใช่หรือไม่?`)) return;

    setActionLoading(adId);
    try {
      const adRef = doc(db, 'artifacts', appId, 'public', 'data', 'marketing_ads', adId);
      await updateDoc(adRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // รีเฟรชข้อมูลเฉพาะใน Local State เพื่อความรวดเร็ว
      setAds(prevAds => prevAds.map(ad => 
        ad.id === adId ? { ...ad, status: newStatus } : ad
      ));
      
    } catch (error) {
      console.error("Error updating ad status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="text-[#0870B8]" />
            จัดการโฆษณา (Ad Management)
          </h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบและอนุมัติโฆษณาที่ Partner ส่งเข้ามา</p>
        </div>
      </div>

      {/* ควบคุม (Tabs & Search) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab('pending_approval')}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'pending_approval' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            รอตรวจสอบ ({ads.filter(a => (a.status || 'pending_approval') === 'pending_approval').length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'active' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ออนไลน์ ({ads.filter(a => a.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'rejected' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ปฏิเสธ ({ads.filter(a => a.status === 'rejected').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อโฆษณา, พาร์ทเนอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0870B8]/50 text-sm"
          />
        </div>
      </div>

      {/* รายการโฆษณา */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[#0870B8] w-8 h-8 mb-4" />
          <span className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</span>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Filter className="text-gray-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">ไม่พบข้อมูล</h3>
          <p className="text-gray-500 mt-1">ไม่มีโฆษณาในสถานะ '{activeTab}' หรือตรงกับคำค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group">
              
              {/* ส่วนหัวการ์ด (ข้อมูล Partner) */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">ส่งโดย Partner</p>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{ad.partnerName || 'ไม่ระบุ'}</p>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(ad.createdAt?.toDate ? ad.createdAt.toDate() : ad.createdAt).toLocaleDateString('th-TH')}
                </span>
              </div>

              {/* ส่วนแสดงข้อมูลโฆษณา */}
              <div className="p-4 flex-1">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error' }} />
                    ) : (
                      <ImageIcon className="text-gray-300 w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase text-white ${
                        ad.platform === 'shopee' ? 'bg-[#ee4d2d]' : ad.platform === 'lazada' ? 'bg-[#0f146d]' : ad.platform === 'tiktok' ? 'bg-black' : 'bg-gray-500'
                      }`}>
                        {ad.platform || 'OTHER'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm line-clamp-2" title={ad.title}>{ad.title || 'ไม่มีชื่อโฆษณา'}</h4>
                    {ad.description && <p className="text-xs text-gray-500 line-clamp-1 mt-1">{ad.description}</p>}
                  </div>
                </div>

                {/* ลิงก์ */}
                <div className="mt-4 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between gap-2">
                   <div className="truncate flex-1 text-xs text-blue-600 font-medium hover:underline cursor-pointer" onClick={() => window.open(ad.link, '_blank')} title={ad.link}>
                     {ad.link}
                   </div>
                   <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
                </div>
              </div>

              {/* ส่วน Action (ปุ่มกด) */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex justify-end gap-2">
                {activeTab === 'pending_approval' && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                      disabled={actionLoading === ad.id}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <XCircle size={14} /> ปฏิเสธ
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(ad.id, 'active')}
                      disabled={actionLoading === ad.id}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {actionLoading === ad.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      อนุมัติออนไลน์
                    </button>
                  </>
                )}
                
                {activeTab === 'active' && (
                  <button 
                    onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                    disabled={actionLoading === ad.id}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    ระงับการแสดงผล
                  </button>
                )}

                {activeTab === 'rejected' && (
                  <button 
                    onClick={() => handleUpdateStatus(ad.id, 'pending_approval')}
                    disabled={actionLoading === ad.id}
                    className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
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