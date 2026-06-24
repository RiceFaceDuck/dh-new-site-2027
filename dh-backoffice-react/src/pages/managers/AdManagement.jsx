import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 🛠️ นำเข้า db ให้ตรงกับโครงสร้างโปรเจกต์
import { db } from '../../firebase/config'; 
import { useAdSubscriptions } from './hooks/useAdSubscriptions';
import { adManagementService } from '../../firebase/adManagementService';
import GuidePanel from '../../components/common/GuidePanel';
import { 
  Loader2, CheckCircle, XCircle, Megaphone, ExternalLink, 
  Image as ImageIcon, CreditCard, ShoppingBag, MonitorPlay, 
  Search, ShieldCheck, Clock, ArrowLeft
} from 'lucide-react';

const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "default-app-id";

export default function AdManagement() {
  const navigate = useNavigate();
  const { ads, loading } = useAdSubscriptions();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [processingId, setProcessingId] = useState(null);

  // 🚀 2. ฟังก์ชัน อนุมัติ / ปฏิเสธ (ใช้ Service เพื่อรักษา SRP และลด Redundant Writes)
  const handleAction = async (ad, action) => {
    if (!window.confirm(`ยืนยันการ ${action === 'APPROVED' ? 'อนุมัติให้แสดงผล' : 'ปฏิเสธคำขอ'} โฆษณานี้?`)) return;
    
    setProcessingId(ad.id);
    const taskId = `TODO-${ad.id}`;
    
    try {
      if (action === 'APPROVED') {
        const res = await adManagementService.approveAd(ad.id, taskId);
        if (!res.success) throw new Error(res.message);
      } else if (action === 'REJECTED') {
        const res = await adManagementService.rejectAd(ad.id, taskId);
        if (!res.success) throw new Error(res.message);
      } else if (action === 'PENDING') {
        // กรณีดึงกลับมารอตรวจสอบ (Pause)
        const res = await adManagementService.pauseAd(ad.id);
        if (!res.success) throw new Error(res.message);
      }
    } catch (error) {
      console.error("🔥 Action error:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAds = ads.filter(ad => String(ad.status).toUpperCase() === activeTab);

  const getTypeBadge = (type) => {
    const t = String(type).toUpperCase();
    if (t.includes('BUSINESS_CARD')) return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><CreditCard size={12}/> นามบัตร</span>;
    if (t.includes('PRODUCT_LINK') || t.includes('SKU')) return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><ShoppingBag size={12}/> สินค้าโปรโมท</span>;
    if (t.includes('BILLBOARD')) return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><MonitorPlay size={12}/> แผ่นป้าย</span>;
    return <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-bold">ทั่วไป</span>;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">กำลังโหลดข้อมูลโฆษณา...</p>
      </div>
    );
  }

  return (
    // 🚀 HOTFIX: ครอบด้วย Container ที่กำหนดความสูงและเปิด overflow-y-auto เพื่อแก้ปัญหา Scroll ไม่ได้
    <div className="h-[calc(100vh-64px)] w-full overflow-y-auto pb-20 bg-slate-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/managers')}
          className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm active:scale-95 w-fit"
        >
          <ArrowLeft size={18} /> ย้อนกลับ (Settings)
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100">
             <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">การจัดการพื้นที่โฆษณา (Sponsored Ads)</h2>
          <p className="text-sm text-slate-500">ศูนย์ตรวจสอบ อนุมัติ และจัดการโฆษณาสินค้าที่ Partner ส่งเข้ามา (รองรับ 3 ระบบ)</p>
        </div>

        {/* 📚 In-App Documentation (Rule compliance) */}
        <GuidePanel 
          title="การอนุมัติและจัดการพื้นที่โฆษณา"
          description="ส่วนนี้ใช้สำหรับตรวจสอบคำขอลงโฆษณาจาก Partner (เช่น ร้านซ่อม) เพื่อให้แสดงผลบนหน้าร้านค้าออนไลน์ของเรา"
          howTo={[
            "ตรวจสอบโฆษณาในแท็บ 'รอตรวจสอบ' ว่ามีภาพและลิงก์ถูกต้องหรือไม่",
            "คลิก 'อนุมัติ' เพื่ออนุญาตให้โฆษณาแสดงผล และดึงข้อมูล Partner ขึ้นแผนที่ทันที",
            "คลิก 'ปฏิเสธ' หากคำขอโฆษณาละเมิดกฎ หรือไม่เหมาะสม"
          ]}
          tips={[
            "หากเกิดข้อผิดพลาด สามารถดึงโฆษณาในแท็บ 'กำลังแสดงผล' หรือ 'ถูกปฏิเสธ' กลับมารอตรวจสอบใหม่ได้ทุกเมื่อ",
            "คุณสามารถคลิกลิงก์ของโฆษณาเพื่อดูตัวอย่างก่อนอนุมัติได้"
          ]}
          expectedResult="เมื่ออนุมัติ โฆษณาจะทำงานร่วมกับ Todo Service เพื่อปิดงานของผู้จัดการในระบบหลักโดยอัตโนมัติ เพื่อไม่ให้เกิดงานค้างซ้ำซ้อน"
        />

        {/* Tabs */}
        <div className="flex justify-center mb-8 sticky top-0 z-10 py-2 bg-slate-50/90 backdrop-blur-md">
          <div className="inline-flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            <button 
              onClick={() => setActiveTab('PENDING')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'PENDING' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Clock size={16}/> รอตรวจสอบ {ads.filter(a => String(a.status).toUpperCase() === 'PENDING').length > 0 && `(${ads.filter(a => String(a.status).toUpperCase() === 'PENDING').length})`}
            </button>
            <button 
              onClick={() => setActiveTab('APPROVED')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <CheckCircle size={16}/> กำลังแสดงผล
            </button>
            <button 
              onClick={() => setActiveTab('REJECTED')}
              className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <XCircle size={16}/> ถูกปฏิเสธ
            </button>
          </div>
        </div>

        {/* Content Area */}
        {filteredAds.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Search size={28} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-1">ไม่มีรายการโฆษณาในหมวดหมู่นี้</h3>
            <p className="text-sm text-slate-400">เมื่อ Partner ส่งคำขอโฆษณา ข้อมูลจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <div key={ad.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                
                {/* รูปภาพพรีวิว */}
                <div className="aspect-video w-full bg-slate-50 relative overflow-hidden group">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt="Ad Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={32} className="mb-2 opacity-50"/>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
                     งบ: {ad.creditLimit === -1 ? 'ไม่จำกัด' : `${ad.creditLimit} Pts`}
                  </div>
                </div>

                {/* ข้อมูลโฆษณา */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                     {getTypeBadge(ad.type)}
                     <span className="text-[10px] text-slate-400">
                       {new Date(ad.createdAt?.toMillis() || Date.now()).toLocaleDateString('th-TH')}
                     </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-base leading-tight mb-2 line-clamp-2">
                    {ad.title || ad.productName || 'ไม่มีหัวข้อ'}
                  </h3>
                  
                  <div className="text-xs text-slate-500 mb-4 space-y-1.5 flex-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <p className="line-clamp-2"><span className="font-bold text-slate-600">รายละเอียด:</span> {ad.description || '-'}</p>
                    <p className="line-clamp-1"><span className="font-bold text-slate-600">ผู้ขอ:</span> {ad.partnerName || ad.customerName || 'DH Partner'}</p>
                    
                    {ad.targetUrl && (
                      <p className="text-indigo-600 font-medium truncate pt-1">
                        🔗 <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="hover:underline">{ad.targetUrl}</a>
                      </p>
                    )}
                    {ad.messengerUrl && (
                      <p className="text-[#1877F2] font-medium truncate pt-1">
                        💬 <a href={ad.messengerUrl} target="_blank" rel="noreferrer" className="hover:underline">{ad.messengerUrl}</a>
                      </p>
                    )}
                  </div>

                  {/* ปุ่มจัดการ (แสดงเฉพาะสถานะรอตรวจสอบ) */}
                  {activeTab === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={() => handleAction(ad, 'REJECTED')}
                        disabled={processingId === ad.id}
                        className="py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 flex justify-center items-center gap-1.5 transition-all text-sm"
                      >
                        {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} ปฏิเสธ
                      </button>
                      <button 
                        onClick={() => handleAction(ad, 'APPROVED')}
                        disabled={processingId === ad.id}
                        className="py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 flex justify-center items-center gap-1.5 transition-all text-sm"
                      >
                        {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} อนุมัติ
                      </button>
                    </div>
                  )}
                  
                  {/* ปุ่มยกเลิก/ลบ (สำหรับสถานะอื่นๆ) */}
                  {activeTab !== 'PENDING' && (
                    <button 
                      onClick={() => handleAction(ad, 'PENDING')}
                      disabled={processingId === ad.id}
                      className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 flex justify-center items-center gap-1.5 transition-all text-sm mt-2"
                    >
                      {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <Clock size={16}/>} ดึงกลับไปรอตรวจสอบใหม่
                    </button>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}