import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function TransactionItemizedTable({ filteredTransactions, onNavigateToTransaction }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 px-2.5 w-8 text-center text-[11px]">#</th>
              <th className="py-2.5 px-2.5 min-w-[125px] text-[11px]">วันที่ / เวลา</th>
              <th className="py-2.5 px-2.5 min-w-[130px] text-[11px]">เลขที่ธุรกรรม</th>
              <th className="py-2.5 px-2.5 min-w-[150px] text-[11px]">ชื่อลูกค้า / ช่องทาง</th>
              <th className="py-2.5 px-2.5 min-w-[260px] text-[11px]">สินค้า & SKU</th>
              <th className="py-2.5 px-2.5 min-w-[110px] text-center text-[11px]">การเปลี่ยนแปลง</th>
              <th className="py-2.5 px-2.5 min-w-[190px] text-[11px]">เหตุการณ์</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-medium">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  ไม่พบรายการธุรกรรมตามเงื่อนไขที่กรอง
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx, idx) => {
                const Icon = tx.eventIcon;
                return (
                  <tr key={tx.id || idx} className="hover:bg-indigo-50/40 dark:hover:bg-slate-700/40 transition-colors h-9">
                    <td className="py-1 px-2.5 text-center font-bold text-slate-400 text-[11px] align-middle">{idx + 1}</td>
                    <td className="py-1 px-2.5 text-slate-600 dark:text-slate-300 font-mono text-[11px] align-middle">{tx.timestamp}</td>
                    <td className="py-1 px-2.5 align-middle">
                      {tx.hasRealDocument ? (
                        <button
                          onClick={() => onNavigateToTransaction(tx.eventCategory, tx.txId)}
                          className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-mono font-bold transition-all cursor-pointer group/tx hover:shadow-2xs"
                          title={`คลิกเพื่อเปิดดูรายการ ${tx.txId}`}
                        >
                          <span>{tx.txId}</span>
                          <ExternalLink size={10} className="opacity-60 group-hover/tx:opacity-100 group-hover/tx:translate-x-0.5 transition-all" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 text-[10px] font-medium" title="ไม่มีเอกสารอ้างอิง (การตรวจนับหรือปรับยอดสต็อก)">
                          {tx.txId}
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2.5 align-middle">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block truncate max-w-[150px]" title={tx.customerName}>
                        {tx.customerName}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 align-middle">
                      <div className="flex items-center gap-1.5 max-w-[280px]">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] shrink-0 px-1.5 py-0.5 bg-indigo-50/60 dark:bg-indigo-950/50 rounded border border-indigo-100 dark:border-indigo-900/40">
                          {tx.sku}
                        </span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-200 truncate" title={tx.name}>
                          {tx.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-1 px-2.5 text-center align-middle">
                      <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded-md font-mono text-[11px]">
                        {tx.oldValue !== '-' && tx.newValue !== '-' && tx.oldValue !== tx.newValue ? (
                          <>
                            <span className="text-slate-400 line-through text-[10px]">{tx.oldValue}</span>
                            <span className="font-black text-slate-800 dark:text-white">➔ {tx.newValue}</span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400 ml-0.5">({tx.quantityDiffText})</span>
                          </>
                        ) : (
                          <span className="font-black text-indigo-600 dark:text-indigo-400">{tx.quantityDiffText}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-2.5 align-middle shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap ${tx.eventBadgeClass}`}>
                        {Icon && <Icon size={12} className="shrink-0" />}
                        <span>{tx.eventLabel}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
