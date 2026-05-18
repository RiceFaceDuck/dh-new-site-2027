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
  MessageSquare
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
  const [refundAmount, setRefundAmount] = useState(100); // ค่าเริ่มต้น แนะนำให้ตั้งตาม Global Settings

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

  const handleApprove = async (id) => {
    if (!window.confirm('ยืนยันการอนุมัติโฆษณานี้ให้เริ่มแสดงผลทันที?')) return;
    
    setProcessingId(id);
    const res = await adManagementService.approveAd(id);
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
    setRefundAmount(100); // สามารถผูกกับ context/settings ของระบบได้
    setIsRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อให้ลูกค้าทราบ');
      return;
    }

    setProcessingId(selectedAd.id);
    const res = await adManagementService.rejectAd(
      selectedAd.id, 
      selectedAd.userId, 
      Number(refundAmount), 
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

  // Helper: ตกแต่งสี Badge ตาม Platform
  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'shopee': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'lazada': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tiktok': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'facebook': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'lineshopping': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            การจัดการพื้นที่โฆษณา (Sponsored Ads)
          </h1>
          <p className="text-gray-500 mt-1">
            ตรวจสอบ อนุมัติ และจัดการโฆษณาสินค้าที่ Partner หรือ User ส่งเข้ามา
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full max-w-md">
        {[
          { id: 'pending', label: 'รออนุมัติ', icon: AlertCircle },
          { id: 'active', label: 'กำลังแสดงผล', icon: CheckCircle },
          { id: 'rejected', label: 'ถูกปฏิเสธ', icon: XCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>กำลังโหลดข้อมูลคำขอโฆษณา...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-600">ไม่มีรายการโฆษณาในหมวดหมู่นี้</p>
            <p className="text-sm">เมื่อมีผู้ส่งคำขอโฆษณา ข้อมูลจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {ads.map((ad) => (
              <div key={ad.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col">
                
                {/* Image / Thumbnail Placeholder */}
                <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                  {/* Platform Badge */}
                  <div className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm backdrop-blur-sm bg-opacity-90 ${getPlatformColor(ad.platform)}`}>
                    {(ad.platform || 'OTHER').toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">
                      {ad.description || 'ไม่มีคำอธิบาย'}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Owner ID:</span>
                      <span className="font-mono text-xs truncate max-w-[120px]">{ad.userId}</span>
                    </div>
                    {ad.youtubeUrl && (
                      <div className="flex justify-between items-center text-red-600">
                        <span className="text-gray-400">Youtube:</span>
                        <a href={ad.youtubeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                          คลิปรีวิว <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Target URL:</span>
                      <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline truncate max-w-[120px]">
                        ลิงก์ร้านค้า <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Rejected Reason (If applicable) */}
                  {activeTab === 'rejected' && ad.rejectReason && (
                    <div className="mt-auto mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>เหตุผล:</strong> {ad.rejectReason}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          disabled={processingId === ad.id}
                          onClick={() => handleApprove(ad.id)}
                          className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {processingId === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          อนุมัติ
                        </button>
                        <button
                          disabled={processingId === ad.id}
                          onClick={() => openRejectModal(ad)}
                          className="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          ไม่อนุมัติ
                        </button>
                      </>
                    )}

                    {activeTab === 'active' && (
                      <button
                        disabled={processingId === ad.id}
                        onClick={() => handlePause(ad.id)}
                        className="col-span-2 flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-500 hover:text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {processingId === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                        ระงับการแสดงผลชั่วคราว
                      </button>
                    )}

                    {activeTab === 'rejected' && (
                      <div className="col-span-2 text-center text-sm text-gray-400 py-2">
                        สถานะ: ถูกปฏิเสธ
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                ระบุเหตุผลการไม่อนุมัติ
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                โฆษณา: <strong className="text-gray-900">{selectedAd.title}</strong>
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวน Credit Point ที่ต้องการคืนให้ลูกค้า
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                  <span className="absolute right-4 top-2 text-gray-400">แต้ม</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">ระบบจะทำรายการโอนคืนยอดนี้เข้าบัญชี User ทันที</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เหตุผล (เพื่อให้ลูกค้าแก้ไข) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น ภาพไม่ชัดเจน, ลิงก์ไม่ถูกต้อง, สินค้าผิดกฎหมาย..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                disabled={processingId !== null}
              >
                ยกเลิก
              </button>
              <button
                onClick={submitReject}
                disabled={processingId !== null}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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