import React from 'react';
import { Loader2, Search, Image as ImageIcon, CreditCard, ShoppingBag, MonitorPlay, XCircle, CheckCircle } from 'lucide-react';
import { ClockIcon } from './AdIcons';

export default function AdsList({ ads, activeTab, processingId, handleAction }) {
  if (ads.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-16 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
           <Search size={28} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-600 mb-1">ไม่มีรายการโฆษณาในหมวดหมู่นี้</h3>
        <p className="text-sm text-slate-400">เมื่อ Partner ส่งคำขอโฆษณา ข้อมูลจะแสดงที่นี่</p>
      </div>
    );
  }

  const getTypeBadge = (type) => {
    const t = String(type).toUpperCase();
    if (t.includes('BUSINESS_CARD')) return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><CreditCard size={12}/> นามบัตร</span>;
    if (t.includes('PRODUCT_LINK') || t.includes('SKU')) return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><ShoppingBag size={12}/> สินค้าโปรโมท</span>;
    if (t.includes('BILLBOARD')) return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><MonitorPlay size={12}/> แผ่นป้าย</span>;
    return <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-bold">ทั่วไป</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ads.map((ad) => (
        <div key={ad.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          
          <div className="aspect-video w-full bg-slate-50 relative overflow-hidden">
            {ad.imageUrl ? (
              <img src={ad.imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <ImageIcon size={32} className="mb-2 opacity-50"/>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
               งบ: {ad.creditLimit === -1 ? 'ไม่จำกัด' : `${ad.creditLimit} Pts`}
            </div>
          </div>

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
                <p className="text-blue-600 font-medium truncate pt-1">
                  💬 <a href={ad.messengerUrl} target="_blank" rel="noreferrer" className="hover:underline">{ad.messengerUrl}</a>
                </p>
              )}
            </div>

            {activeTab === 'PENDING' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => handleAction(ad, 'REJECTED')}
                  disabled={processingId === ad.id}
                  className="py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 flex justify-center items-center gap-1.5 transition-all text-sm disabled:opacity-50"
                >
                  {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} ปฏิเสธ
                </button>
                <button 
                  onClick={() => handleAction(ad, 'APPROVED')}
                  disabled={processingId === ad.id}
                  className="py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 flex justify-center items-center gap-1.5 transition-all text-sm disabled:opacity-50"
                >
                  {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} อนุมัติ
                </button>
              </div>
            )}
            
            {activeTab !== 'PENDING' && (
              <button 
                onClick={() => handleAction(ad, 'PENDING')}
                disabled={processingId === ad.id}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 flex justify-center items-center gap-1.5 transition-all text-sm mt-2 disabled:opacity-50"
              >
                {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <ClockIcon size={16}/>} ดึงกลับไปรอตรวจสอบใหม่
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
