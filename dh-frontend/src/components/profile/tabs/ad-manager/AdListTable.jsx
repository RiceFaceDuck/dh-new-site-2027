/* eslint-disable react/prop-types */
import React from 'react';
import { Megaphone, ExternalLink, Loader2, CheckCircle2, ShieldAlert, AlertCircle, X } from 'lucide-react';

const AdListTable = ({ ads, onDeleteAd }) => {
  const getStatusBadge = (status) => {
    if (status === 'active') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 size={12}/> ออนไลน์</span>;
    if (status === 'rejected') return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><ShieldAlert size={12}/> ไม่ผ่านอนุมัติ</span>;
    if (status === 'paused') return <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><AlertCircle size={12}/> ถูกระงับ</span>;
    return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 w-max"><Loader2 size={12} className="animate-spin"/> รอตรวจสอบ</span>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><Megaphone size={18} className="text-[#0870B8]"/> ประวัติโฆษณาของฉัน</h3>
      </div>
      
      {ads.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center text-center bg-slate-50/30">
          <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-slate-100"><Megaphone size={32} className="text-slate-300"/></div>
          <h3 className="font-bold text-slate-700 text-lg">ยังไม่เคยสร้างโฆษณาสินค้า</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-sm">กำหนดงบประมาณ และสร้างโฆษณาแรกของคุณวันนี้ เพื่อดันยอดขาย!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">รายละเอียดโฆษณา</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">สถานะ</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">การแสดงผล / งบประมาณ</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">คลิกสะสม</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 min-w-[250px]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 p-0.5 flex-shrink-0 shadow-sm">
                        <img src={ad.imageUrl || '/logo.png'} alt="Ad" className="w-full h-full object-cover rounded-md" onError={(e)=>{e.target.src='https://placehold.co/100x100?text=No+Img'}}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1" title={ad.title}>{ad.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold text-white shadow-sm ${
                            ad.platform === 'shopee' ? 'bg-[#EE4D2D]' : ad.platform === 'lazada' ? 'bg-[#0F146D]' : ad.platform === 'tiktok' ? 'bg-black' : ad.platform === 'thisshop' ? 'bg-[#E31E24]' : 'bg-slate-400'
                          }`}>{ad.platform}</span>
                          <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            ดูลิงก์ <ExternalLink size={10}/>
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center">{getStatusBadge(ad.status)}</div>
                    {ad.status === 'rejected' && ad.rejectReason && (
                      <p className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate mx-auto" title={ad.rejectReason}>
                        เหตุผล: {ad.rejectReason}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center bg-blue-50 text-blue-800 rounded-lg px-3 py-1.5 border border-blue-100 font-mono text-sm">
                       <span className="font-black">{ad.impressions || 0}</span>
                       <span className="mx-1 text-blue-300">/</span>
                       <span className="text-slate-500">{Math.floor((ad.creditLimit || 0) / (ad.costPerImpression || 1))}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-slate-700">{ad.clicks || 0}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => onDeleteAd(ad.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100"
                      title="ลบโฆษณา"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdListTable;