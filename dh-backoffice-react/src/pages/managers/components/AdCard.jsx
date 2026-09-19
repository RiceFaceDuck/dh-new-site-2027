import { 
  Loader2, CheckCircle, XCircle, 
  Image as ImageIcon, CreditCard, ShoppingBag, MonitorPlay, 
  Clock 
} from 'lucide-react';

export const getTypeBadge = (type) => {
  const t = String(type).toUpperCase();
  if (t.includes('BUSINESS_CARD')) return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><CreditCard size={12}/> นามบัตร</span>;
  if (t.includes('PRODUCT_LINK') || t.includes('SKU')) return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><ShoppingBag size={12}/> สินค้าโปรโมท</span>;
  if (t.includes('BILLBOARD')) return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-[10px] font-bold"><MonitorPlay size={12}/> แผ่นป้าย</span>;
  return <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-bold">ทั่วไป</span>;
};

export default function AdCard({ ad, activeTab, processingId, onAction }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      {/* รูปภาพพรีวิว */}
      <div className="aspect-video w-full bg-slate-50 relative overflow-hidden group">
        {ad.imageUrl ? (
          <img src={ad.imageUrl} alt="Ad Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
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
              onClick={() => onAction(ad, 'REJECTED')}
              disabled={processingId === ad.id}
              className="py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 flex justify-center items-center gap-1.5 transition-all text-sm"
            >
              {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>} ปฏิเสธ
            </button>
            <button 
              onClick={() => onAction(ad, 'APPROVED')}
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
            onClick={() => onAction(ad, 'PENDING')}
            disabled={processingId === ad.id}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 flex justify-center items-center gap-1.5 transition-all text-sm mt-2"
          >
            {processingId === ad.id ? <Loader2 size={16} className="animate-spin"/> : <Clock size={16}/>} ดึงกลับไปรอตรวจสอบใหม่
          </button>
        )}

      </div>
    </div>
  );
}
