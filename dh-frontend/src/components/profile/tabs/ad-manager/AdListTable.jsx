/* eslint-disable react/prop-types */
import React from 'react';
import { Trash2, ExternalLink, Activity, Image as ImageIcon, Eye, CheckCircle2, Clock, XCircle } from 'lucide-react';

const AdListTable = ({ ads, onDeleteAd }) => {
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
    if (s === 'APPROVED') return <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 size={12}/> ใช้งานอยู่</span>;
    if (s === 'PENDING') return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><Clock size={12}/> รอตรวจสอบ</span>;
    if (s === 'REJECTED') return <span className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"><XCircle size={12}/> ไม่อนุมัติ</span>;
    return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase">{s}</span>;
  };

  const getTypeBadge = (type) => {
    if (type === 'BUSINESS_CARD') return <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">นามบัตร</span>;
    if (type === 'PRODUCT_LINK') return <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">สินค้า</span>;
    if (type === 'BILLBOARD') return <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold">แผ่นป้าย</span>;
    return <span>ทั่วไป</span>;
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Activity className="text-indigo-500" size={18}/> ประวัติโฆษณาของคุณ (My Campaigns)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100">
              <th className="p-4">รูปภาพ</th>
              <th className="p-4">แคมเปญ / ประเภท</th>
              <th className="p-4">สถานะ</th>
              <th className="p-4 text-center">ยอดวิว (Views)</th>
              <th className="p-4 text-center">งบ (Limit)</th>
              <th className="p-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    {ad.imageUrl ? <img src={ad.imageUrl} alt="Ad" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{ad.title || ad.productName || 'โฆษณา'}</div>
                  <div className="mt-1 flex items-center gap-2">
                    {getTypeBadge(ad.type)}
                    {ad.targetUrl && (
                      <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 truncate max-w-[120px]">
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
                <td className="p-4 text-center text-xs font-bold text-slate-500">
                  {ad.creditLimit === -1 ? '∞ ไม่จำกัด' : (ad.creditLimit ? `${ad.creditLimit} Pts` : 'N/A')}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => onDeleteAd(ad.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="ลบโฆษณา">
                    <Trash2 size={16} />
                  </button>
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