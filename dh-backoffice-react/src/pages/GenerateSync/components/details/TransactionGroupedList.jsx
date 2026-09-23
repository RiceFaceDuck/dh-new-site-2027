import React from 'react';
import { ExternalLink, ChevronDown, ChevronUp, User, Clock } from 'lucide-react';

export default function TransactionGroupedList({ groupedByBill, expandedBills, onToggleExpandBill, onNavigateToTransaction }) {
  if (groupedByBill.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl text-center border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-medium">
        ไม่พบข้อมูลจัดกลุ่มตามเงื่อนไขที่กรอง
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {groupedByBill.map((group) => {
        const Icon = group.eventIcon;
        const firstItem = group.items?.[0] || {};
        const remainingCount = Math.max(0, (group.items?.length || 0) - 1);
        const isExpanded = expandedBills[group.txId];

        return (
          <div key={group.txId} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-3.5 py-2.5 gap-2 text-xs">
              <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                {firstItem.hasRealDocument ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToTransaction(group.eventCategory, group.txId);
                    }}
                    className="font-mono font-black text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 dark:hover:text-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0 flex items-center gap-1 transition-all cursor-pointer group/tx hover:shadow-2xs"
                    title={`คลิกเพื่อเปิดดูรายการ ${group.txId}`}
                  >
                    <span>{group.txId}</span>
                    <ExternalLink size={11} className="opacity-60 group-hover/tx:opacity-100 group-hover/tx:translate-x-0.5 transition-all" />
                  </button>
                ) : (
                  <span 
                    className="font-mono text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shrink-0 font-medium"
                    title="ไม่มีเอกสารอ้างอิง (การตรวจนับหรือปรับยอดสต็อก)"
                  >
                    {group.txId}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${group.eventBadgeClass}`}>
                  {Icon && <Icon size={12} />}
                  {group.eventLabel}
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0 flex-1 px-1">
                <span className="text-slate-400 font-mono text-[11px] font-bold">1.</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{group.items?.[0]?.sku || '-'}</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[280px] lg:max-w-[420px]" title={firstItem.name || '-'}>
                  {firstItem.name || 'ไม่มีรายการสินค้า'}
                </span>
                {remainingCount > 0 && (
                  <button
                    onClick={() => onToggleExpandBill(group.txId)}
                    className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] hover:bg-indigo-200 transition-all shrink-0 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>+ อีก {remainingCount} รายการ</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="text-slate-400 line-through font-normal mr-1">{firstItem.oldValue ?? '-'}</span>
                  <span>➔ {firstItem.newValue ?? '-'}</span>
                  <span className={`ml-1 font-bold text-[11px] ${
                    firstItem.type === 'decreased' ? 'text-blue-600 dark:text-blue-400' :
                    firstItem.type === 'increased' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    ({firstItem.quantityDiffText ?? '0'})
                  </span>
                </div>
                <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={group.customerName}>
                  <User size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{group.customerName}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                  <Clock size={12} className="text-slate-400 shrink-0" />
                  <span>{group.timestamp}</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-200 font-bold text-[10px] whitespace-nowrap">
                  รวม {group.items?.length || 0} รายการ ({group.totalQuantity || 0} ชิ้น)
                </div>
              </div>
            </div>

            {remainingCount > 0 && isExpanded && group.items && (
              <div className="bg-slate-50/90 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700/60 p-2 space-y-1 divide-y divide-slate-100/60 dark:divide-slate-800">
                {group.items.slice(1).map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between items-center px-3 py-1.5 text-xs font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 font-mono text-[10px] font-bold w-4">{idx + 2}.</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{item.sku}</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[350px]">{item.name}</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span className="text-slate-400 line-through font-normal mr-1">{item.oldValue}</span>
                      <span>➔ {item.newValue}</span>
                      <span className="ml-1 text-[11px] font-bold text-blue-600">({item.quantityDiffText})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
