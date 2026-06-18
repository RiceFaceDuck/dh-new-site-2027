import React from 'react';
import { ArrowDownToLine, Banknote, ArrowUpFromLine, Clock, Wallet } from 'lucide-react';

export default function TransactionTable({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
          <Wallet size={40} className="mb-2 opacity-30" strokeWidth={1.5} />
          <span className="font-bold text-xs">ยังไม่มีความเคลื่อนไหวทางบัญชี</span>
      </div>
    );
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-white sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 shadow-sm">
          <tr>
              <th className="px-5 py-3">รายละเอียด (Description)</th>
              <th className="px-5 py-3 text-right">จำนวนเงิน</th>
              <th className="px-5 py-3 text-right">คงเหลือ</th>
          </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
          {transactions.map(tx => {
              const isPositive = tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'WITHDRAWAL_REJECTED';
              const isCash = tx.type === 'cash_withdrawal' || tx.type === 'WITHDRAWAL_COMPLETED' || tx.type === 'WITHDRAWAL_REQUEST';
              return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5">
                          <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isCash ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                  {isPositive ? <ArrowDownToLine size={14} strokeWidth={2.5}/> : isCash ? <Banknote size={14} strokeWidth={2.5}/> : <ArrowUpFromLine size={14} strokeWidth={2.5}/>}
                              </div>
                              <div>
                                  <div className="font-black text-xs text-slate-800">{tx.note || tx.type}</div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                      <span className="flex items-center gap-1"><Clock size={10}/> {tx.timestamp ? new Date(tx.timestamp.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                      <span className="text-slate-300">•</span>
                                      <span className="font-mono text-slate-500">Ref: {tx.referenceId || tx.transactionId}</span>
                                  </div>
                              </div>
                          </div>
                      </td>
                      <td className="px-5 py-3.5 text-right align-top">
                          <div className={`font-black text-sm ${isPositive ? 'text-emerald-600' : isCash ? 'text-amber-600' : 'text-rose-600'}`}>
                              {isPositive ? '+' : '-'} {Number(tx.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </div>
                          {tx.status && <div className={`text-[9px] font-bold uppercase mt-0.5 ${tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}`}>{tx.status}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-right align-top">
                          <div className="font-bold text-xs text-slate-500">
                              {Number(tx.balanceAfter || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </div>
                      </td>
                  </tr>
              );
          })}
      </tbody>
    </table>
  );
}
