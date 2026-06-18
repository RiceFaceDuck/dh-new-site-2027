import React from 'react';
import { Clock, Coins, Star, History } from 'lucide-react';

export default function PointTransactionTable({ pointTransactions }) {
  if (!pointTransactions || pointTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
          <Coins size={40} className="mb-2 opacity-30" strokeWidth={1.5} />
          <span className="font-bold text-xs">ยังไม่มีประวัติการใช้แต้ม</span>
      </div>
    );
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-white sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 shadow-sm">
          <tr>
              <th className="px-5 py-3">รายละเอียดการใช้งาน</th>
              <th className="px-5 py-3 text-right">จำนวนแต้ม</th>
          </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
          {pointTransactions.map(pt => {
              const isEarn = pt.type === 'deposit' || pt.type === 'earn';
              return (
                  <tr key={pt.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="px-5 py-3.5">
                          <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isEarn ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                  {isEarn ? <Star size={14} strokeWidth={2.5}/> : <History size={14} strokeWidth={2.5}/>}
                              </div>
                              <div>
                                  <div className="font-black text-xs text-slate-800">{pt.note || pt.type}</div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                      <span className="flex items-center gap-1"><Clock size={10}/> {pt.createdAt ? new Date(pt.createdAt.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                      {pt.referenceId && <><span className="text-slate-300">•</span><span className="font-mono text-slate-500">Ref: {pt.referenceId}</span></>}
                                  </div>
                              </div>
                          </div>
                      </td>
                      <td className="px-5 py-3.5 text-right align-top">
                          <div className={`font-black text-sm ${isEarn ? 'text-amber-600' : 'text-slate-600'}`}>
                              {isEarn ? '+' : '-'} {Number(pt.amount || 0).toLocaleString('th-TH')}
                          </div>
                      </td>
                  </tr>
              );
          })}
      </tbody>
    </table>
  );
}
