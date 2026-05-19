/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { adManagementService } from '../../firebase/adManagementService';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Image as ImageIcon, 
  PauseCircle,
  AlertCircle,
  Loader2,
  Search,
  MessageSquare,
  ShieldCheck,
  Youtube,
  ShoppingBag,
  Store,
  Clock
} from 'lucide-react';

export default function AdManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, active, rejected
  const [processingId, setProcessingId] = useState(null);
  
  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchAds();
  }, [activeTab]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const data = await adManagementService.getAdsByStatus(activeTab);
      setAds(data);
    } catch (error) {
      console.error("Fetch Ads Error:", error);
      alert('ไม่สามารถโหลดข้อมูลโฆษณาได้');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ad) => {
    if (!window.confirm(`ยืนยันการอนุมัติโฆษณา [${ad.skuId}] ให้เริ่มแสดงผลทันทีใช่หรือไม่?\n\n*โปรดตรวจสอบลิงก์ปลายทางให้แน่ใจว่าไม่ใช่ Scammer ก่อนอนุมัติ*`)) return;
    
    setProcessingId(ad.id);
    const res = await adManagementService.approveAd(ad.id, ad.skuId);
    if (res.success) {
      fetchAds(); // รีโหลดข้อมูลใหม่
    } else {
      alert(res.message);
    }
    setProcessingId(null);
  };

  const handlePause = async (id) => {
    if (!window.confirm('คุณต้องการระงับการแสดงผลโฆษณานี้ชั่วคราวใช่หรือไม่?')) return;
    
    setProcessingId(id);
    const res = await adManagementService.pauseAd(id);
    if (res.success) {
      fetchAds();
    } else {
      alert(res.message);
    }
    setProcessingId(null);
  };

  const openRejectModal = (ad) => {
    setSelectedAd(ad);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อให้ลูกค้าทราบและนำไปแก้ไข');
      return;
    }

    setProcessingId(selectedAd.id);
    const res = await adManagementService.rejectAd(
      selectedAd.id, 
      selectedAd.skuId, // ส่งไปเพื่อปิดงานใน Manager Todos
      rejectReason
    );

    if (res.success) {
      setIsRejectModalOpen(false);
      fetchAds();
    } else {
      alert(res.message);
    }
    setProcessingId(null);
  };

  // Helper: ตรวจสอบแพลตฟอร์มจาก Object links
  const renderPlatformLinks = (links) => {
    if (!links) return <span className="text-gray-400 text-xs">ไม่มีลิงก์ปลายทาง</span>;
    
    return (
      <div className="flex flex-col gap-2 w-full mt-2">
        <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
          <ShieldCheck size={14} className="text-emerald-500"/> ตรวจสอบความปลอดภัยลิงก์
        </p>
        <div className="grid grid-cols-2 gap-2">
          {links.shopee && (
            <a href={links.shopee} target="_blank" rel="noreferrer" className="flex items-center justify-between px-2 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[11px] font-bold hover:bg-orange-100 transition-colors">
              <span className="flex items-center gap-1"><ShoppingBag size={12}/> Shopee</span> <ExternalLink size={10}/>
            </a>
          )}
          {links.lazada && (
            <a href={links.lazada} target="_blank" rel="noreferrer" className="flex items-center justify-between px-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold hover:bg-blue-100 transition-colors">
              <span className="flex items-center gap-1"><ShoppingBag size={12}/> Lazada</span> <ExternalLink size={10}/>
            </a>
          )}
          {links.tiktok && (
            <a href={links.tiktok} target="_blank" rel="noreferrer" className="flex items-center justify-between px-2 py-1.5 bg-gray-100 text-gray-800 border border-gray-300 rounded text-[11px] font-bold hover:bg-gray-200 transition-colors">
              <span className="flex items-center gap-1"><Store size={12}/> TikTok</span> <ExternalLink size={10}/>
            </a>
          )}
          {links.youtube && (
            <a href={links.youtube} target="_blank" rel="noreferrer" className="flex items-center justify-between px-2 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold hover:bg-red-100 transition-colors">
              <span className="flex items-center gap-1"><Youtube size={12}/> YouTube</span> <ExternalLink size={10}/>
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
               <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            การจัดการพื้นที่โฆษณา (Sponsored Ads)
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            ศูนย์ตรวจสอบ อนุมัติ และจัดการโฆษณาสินค้าที่ Partner ส่งเข้ามา เพื่อความปลอดภัยของระบบ
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-full max-w-md">
        {[
          { id: 'pending', label: 'รอตรวจสอบ', icon: Clock },
          { id: 'active', label: 'กำลังแสดงผล', icon: CheckCircle },
          { id: 'rejected', label: 'ถูกปฏิเสธ', icon: XCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p className="font-bold text-gray-500">กำลังโหลดข้อมูลคำขอโฆษณา...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-600">ไม่มีรายการโฆษณาในหมวดหมู่นี้</p>
            <p className="text-sm mt-1">เมื่อ Partner ส่งคำขอโฆษณา ข้อมูลจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6 bg-gray-50/50 min-h-[500px]">
            {ads.map((ad) => (
              <div key={ad.id} className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white flex flex-col hover:-translate-y-1">
                
                {/* Image / Thumbnail Placeholder */}
                <div className="relative h-56 bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-100">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                  {/* SKU Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 text-xs font-black font-tech rounded-lg shadow-sm backdrop-blur-md bg-white/90 text-[#0870B8] border border-white/20">
                    {ad.skuId}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight min-h-[40px]">{ad.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">฿{ad.price?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500 truncate flex-1">โดย: {ad.ownerName}</p>
                    </div>
                  </div>

                  <div className="mb-5 flex-1">
                    {/* Render Links to Verify */}
                    {renderPlatformLinks(ad.links)}
                  </div>

                  {/* Stats (แสดงเฉพาะตอน Active) */}
                  {activeTab === 'active' && (
                     <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-center">
                           <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">การมองเห็น</p>
                           <p className="text-sm font-black text-slate-800">{ad.stats?.impressions?.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-center border-l border-slate-200">
                           <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">การคลิก</p>
                           <p className="text-sm font-black text-[#0870B8]">{ad.stats?.clicks?.toLocaleString() || 0}</p>
                        </div>
                     </div>
                  )}

                  {/* Rejected Reason */}
                  {activeTab === 'rejected' && ad.rejectReason && (
                    <div className="mt-auto mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>เหตุผล:</strong> {ad.rejectReason}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          disabled={processingId === ad.id}
                          onClick={() => openRejectModal(ad)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-white text-rose-600 border-2 border-rose-100 hover:bg-rose-50 hover:border-rose-200 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> ปฏิเสธ
                        </button>
                        <button
                          disabled={processingId === ad.id}
                          onClick={() => handleApprove(ad)}
                          className="flex-[1.5] flex items-center justify-center gap-1.5 bg-emerald-600 text-white border-2 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                        >
                          {processingId === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          ยืนยันอนุมัติ
                        </button>
                      </>
                    )}

                    {activeTab === 'active' && (
                      <button
                        disabled={processingId === ad.id}
                        onClick={() => handlePause(ad.id)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                      >
                        {processingId === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                        ระงับการแสดงผลชั่วคราว (ฉุกเฉิน)
                      </button>
                    )}

                    {activeTab === 'rejected' && (
                      <div className="w-full text-center text-xs font-bold text-gray-400 py-2.5 bg-gray-50 rounded-xl">
                        รายการนี้ถูกปฏิเสธแล้ว
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-rose-50">
              <h3 className="text-lg font-black text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                ระบุเหตุผลการไม่อนุมัติ
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                 <p className="text-xs text-gray-500 mb-1">รหัสโฆษณา: <span className="font-bold text-[#0870B8]">{selectedAd.skuId}</span></p>
                 <p className="text-sm font-bold text-gray-900 line-clamp-1">{selectedAd.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  เหตุผลแจ้งให้ Partner ทราบ (เพื่อนำไปแก้ไข) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="4"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น ภาพไม่ชัดเจน, ลิงก์ปลายทางเสีย หรือเป็นลิงก์หลอกลวง, สินค้าผิดกฎหมาย..."
                  className="w-full p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none transition-all"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                disabled={processingId !== null}
              >
                ยกเลิก
              </button>
              <button
                onClick={submitReject}
                disabled={processingId !== null}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-md shadow-rose-500/20"
              >
                {processingId !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}