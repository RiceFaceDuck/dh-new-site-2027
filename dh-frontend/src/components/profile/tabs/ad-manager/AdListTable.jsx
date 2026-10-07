import { Trash2, ExternalLink, Activity, Image as ImageIcon, CheckCircle2, Clock, XCircle, Edit, Power, RotateCw } from 'lucide-react';
import LazyImage from '../../../common/LazyImage';

const getSafeUrl = (url) => {
  if (!url) return '#';
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const AdListTable = ({ ads, onEditAd, onDeleteAd, onToggleStatus, onResubmitAd }) => {
  if (!ads || ads.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-64 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        <Activity size={48} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-600 mb-1">ยังไม่มีประวัติการลงโฆษณา</h3>
        <p className="text-sm text-slate-400 max-w-md">เมื่อคุณสร้างแคมเปญโฆษณาสำเร็จ ประวัติและสถิติการมองเห็นจะแสดงผลที่นี่แบบ Real-time</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    if (['APPROVED', 'ACTIVE'].includes(s)) return <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"><CheckCircle2 size={12}/> Active</span>;
    if (s === 'PENDING') return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"><Clock size={12}/> Pending</span>;
    if (s === 'REJECTED') return <span className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"><XCircle size={12}/> Rejected</span>;
    if (s === 'PAUSED') return <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"><Activity size={12}/> Paused</span>;
    if (s === 'OUT_OF_CREDIT') return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"><XCircle size={12}/> เครดิตหมด</span>;
    if (s === 'COMPLETED') return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"><CheckCircle2 size={12}/> จบแคมเปญ</span>;
    return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase">{s}</span>;
  };

  const getTypeBadge = (type) => {
    if (type === 'BUSINESS_CARD') return <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm text-[10px] font-bold">นามบัตร</span>;
    if (type === 'PRODUCT_LINK') return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm text-[10px] font-bold">สินค้า</span>;
    if (type === 'BILLBOARD') return <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm text-[10px] font-bold">แผ่นป้าย</span>;
    return <span>ทั่วไป</span>;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 md:p-5 border-b border-slate-200/80 bg-slate-50/90 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
          <Activity className="text-indigo-600" size={18}/> ประวัติโฆษณาของคุณ (My Campaigns)
        </h3>
        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 shadow-xs">
          {ads.length} แคมเปญ
        </span>
      </div>

      {/* 📱 1. Mobile Card View (แสดงบนมือถือ < md) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {ads.map((ad) => (
          <div key={ad.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
            {/* Header: รูป + ชื่อ + สถานะ */}
            <div className="flex gap-3 items-start">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center shadow-xs">
                {ad.imageUrl ? (
                  <LazyImage 
                    src={ad.imageUrl} 
                    alt={ad.title || "Ad"} 
                    className="w-full h-full" 
                    imgClassName="object-contain" 
                    fallbackSrc="/logo.png" 
                  />
                ) : (
                  <ImageIcon size={20} className="text-slate-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-800 text-sm truncate">{ad.title || ad.productName || 'โฆษณา'}</span>
                  {getStatusBadge(ad.status)}
                </div>
                <div className="flex items-center gap-2">
                  {getTypeBadge(ad.type)}
                  {ad.targetUrl && (
                    <a href={getSafeUrl(ad.targetUrl)} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 truncate max-w-[120px]">
                      <ExternalLink size={10}/> ดูลิงก์
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Row: Views / Clicks / Limit */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Views</span>
                <span className="font-black text-slate-700 text-xs">{Number(ad.stats?.views || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Clicks</span>
                <span className="font-black text-indigo-600 text-xs">{Number(ad.stats?.clicks || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">ใช้ไป / งบ</span>
                <span className="font-bold text-slate-700 text-[11px]">
                  {Number(ad.spentBudget || 0).toLocaleString()} / {ad.creditLimit === -1 ? '∞' : (ad.creditLimit ? `${ad.creditLimit}` : '0')} <span className="text-[9px] text-slate-400">Pts</span>
                </span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-medium">จัดการแคมเปญ</span>
              <div className="flex items-center gap-2">
                {['APPROVED', 'ACTIVE', 'PAUSED'].includes(String(ad.status).toUpperCase()) && onToggleStatus && (
                  <button 
                    onClick={() => onToggleStatus(ad)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border flex items-center gap-1.5 ${
                      ['APPROVED', 'ACTIVE'].includes(String(ad.status).toUpperCase())
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                    }`} 
                  >
                    <Power size={14} />
                    {['APPROVED', 'ACTIVE'].includes(String(ad.status).toUpperCase()) ? 'พักแคมเปญ' : 'เปิดแคมเปญ'}
                  </button>
                )}
                {['PENDING', 'REJECTED'].includes(String(ad.status).toUpperCase()) && onResubmitAd && (
                  <button 
                    onClick={() => onResubmitAd(ad)} 
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border flex items-center gap-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
                    title="ส่งคำร้องขออนุมัติอีกครั้ง"
                  >
                    <RotateCw size={14} />
                    <span>ส่งคำร้องซ้ำ</span>
                  </button>
                )}
                <button onClick={() => onEditAd(ad)} className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-all border border-slate-200/60" title="แก้ไข">
                  <Edit size={14} />
                </button>
                <button onClick={() => onDeleteAd(ad.id)} className="p-2 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-all border border-slate-200/60" title="ลบ">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 💻 2. Desktop Table View (แสดงบนจอคอม >= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200">
              <th className="p-4">รูปภาพ</th>
              <th className="p-4">แคมเปญ / ประเภท</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-center">ยอดวิว (Views)</th>
              <th className="p-4 text-center">ยอดคลิก (Clicks)</th>
              <th className="p-4 text-center">ใช้ไป / งบ (Pts)</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                    {ad.imageUrl ? (
                      <LazyImage 
                        src={ad.imageUrl} 
                        alt={ad.title || "Ad"} 
                        className="w-full h-full" 
                        imgClassName="object-contain" 
                        fallbackSrc="/logo.png" 
                      />
                    ) : (
                      <ImageIcon size={20} className="text-slate-300" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{ad.title || ad.productName || 'โฆษณา'}</div>
                  <div className="mt-1 flex items-center gap-2">
                    {getTypeBadge(ad.type)}
                    {ad.targetUrl && (
                      <a href={getSafeUrl(ad.targetUrl)} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 truncate max-w-[120px]">
                        <ExternalLink size={10}/> ดูลิงก์
                      </a>
                    )}
                  </div>
                </td>
                <td className="p-4">{getStatusBadge(ad.status)}</td>
                <td className="p-4 text-center">
                  <span className="font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                    {Number(ad.stats?.views || 0).toLocaleString()}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                    {Number(ad.stats?.clicks || 0).toLocaleString()}
                  </span>
                </td>
                <td className="p-4 text-center text-xs font-bold text-slate-700">
                  <span className="text-indigo-600 font-black">{Number(ad.spentBudget || 0).toLocaleString()}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-600">{ad.creditLimit === -1 ? '∞' : (ad.creditLimit ? `${ad.creditLimit}` : '0')}</span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    {['APPROVED', 'ACTIVE', 'PAUSED'].includes(String(ad.status).toUpperCase()) && onToggleStatus && (
                      <button 
                        onClick={() => onToggleStatus(ad)} 
                        className={`p-2.5 rounded-lg transition-all shadow-xs border ${
                          ['APPROVED', 'ACTIVE'].includes(String(ad.status).toUpperCase())
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            : 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
                        }`} 
                        title={['APPROVED', 'ACTIVE'].includes(String(ad.status).toUpperCase()) ? 'คลิกเพื่อ พักแคมเปญชั่วคราว (Pause)' : 'คลิกเพื่อ เปิดใช้งานโฆษณาต่อ (Resume)'}
                      >
                        <Power size={16} />
                      </button>
                    )}
                    {['PENDING', 'REJECTED'].includes(String(ad.status).toUpperCase()) && onResubmitAd && (
                      <button 
                        onClick={() => onResubmitAd(ad)} 
                        className="p-2.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all shadow-xs border border-amber-200" 
                        title="ส่งคำร้องขออนุมัติอีกครั้ง (Resubmit)"
                      >
                        <RotateCw size={16} />
                      </button>
                    )}
                    <button onClick={() => onEditAd(ad)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all shadow-xs border border-transparent hover:border-indigo-100" title="ดูรายละเอียด / แก้ไขโฆษณา">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDeleteAd(ad.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-xs border border-transparent hover:border-rose-100" title="ลบโฆษณา">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdListTable;