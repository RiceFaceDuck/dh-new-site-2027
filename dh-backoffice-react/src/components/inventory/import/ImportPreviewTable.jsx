import React, { useMemo, useState } from 'react';

export default function ImportPreviewTable({ headers, parsedData }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'NEW' | 'CHANGED' | 'UNCHANGED' | 'ERROR'
  const pageSize = 50;

  const STATUS_PRIORITY = useMemo(() => ({ ERROR: 0, NEW: 1, CHANGED: 2, UNCHANGED: 3 }), []);

  const counts = useMemo(() => {
    let newCount = 0;
    let changedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;
    for (const d of parsedData) {
      if (d._status === 'NEW') newCount++;
      else if (d._status === 'CHANGED') changedCount++;
      else if (d._status === 'UNCHANGED') unchangedCount++;
      else if (d._status === 'ERROR') errorCount++;
    }
    return { newCount, changedCount, unchangedCount, errorCount, total: parsedData.length };
  }, [parsedData]);

  const duplicateSkus = useMemo(() => {
    const list = [];
    parsedData.forEach(d => {
      const s = String(d['SKU'] || '').trim().toUpperCase();
      if (d._isDuplicateInFile && s && !list.includes(s)) {
        list.push(s);
      }
    });
    return list;
  }, [parsedData]);

  const filteredAndSortedData = useMemo(() => {
    const list = statusFilter === 'ALL'
      ? parsedData
      : parsedData.filter(d => d._status === statusFilter);

    // 🚀 ลำดับความสำคัญ: ERROR -> NEW -> CHANGED -> UNCHANGED
    return [...list].sort((a, b) => {
      const pA = STATUS_PRIORITY[a._status] ?? 99;
      const pB = STATUS_PRIORITY[b._status] ?? 99;
      return pA - pB;
    });
  }, [parsedData, statusFilter, STATUS_PRIORITY]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, activePage, pageSize]);

  const priority = useMemo(() => ['SKU', 'Name', 'นับสต๊อค', 'StockQuantity', 'AddStock', 'Price (ราคาส่ง)', 'Price', 'RetailPrice'], []);
  const sortedHeaders = useMemo(() => {
    return [...headers].sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [headers, priority]);

  const renderCell = (row, h) => {
    const val = String(row[h] || '').substring(0, 30);
    const suffix = String(row[h] || '').length > 30 ? '...' : '';
    
    // Check if this field was changed
    if (row._status === 'CHANGED' && row._changes) {
       const changeInfo = row._changes.find(c => {
         if (['AddStock', 'เพิ่มสต๊อก', 'เพิ่มสต๊อค'].includes(h)) return c.field === 'AddStock' || (c.field === 'Stock' && c.type === 'add');
         if (['นับสต๊อค', 'นับสต๊อก', 'StockQuantity', 'Stock', 'stock'].includes(h)) return c.field === h || (c.field === 'Stock' && c.type === 'adjustment');
         if (['Price (ราคาส่ง)', 'Price(ราคาส่ง)', 'Price', 'price', 'ราคาส่ง'].includes(h)) return c.field === 'Price';
         return c.field === h;
       });

       if (changeInfo) {
         if (changeInfo.type === 'add') {
           if (h === 'AddStock') {
             return (
               <div className="flex flex-col">
                 <span className="text-orange-500 font-bold leading-tight">+{changeInfo.added}</span>
               </div>
             );
           }
           return (
             <div className="flex flex-col">
               <span className="text-[10px] text-dh-muted leading-tight">เดิม {changeInfo.old || '0'}</span>
               <span className="text-green-500 font-bold leading-tight">รวม {changeInfo.new || '0'}</span>
             </div>
           );
         }
         if (changeInfo.type === 'adjustment') {
           const diff = Number(changeInfo.diff || 0);
           const diffFormatted = diff > 0 ? `+${diff}` : String(diff);
           const diffColor = diff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
           return (
             <div className="flex flex-col">
               <span className="text-[10px] text-dh-muted leading-tight">
                 เดิม {changeInfo.old || '0'} <span className={`font-black ${diffColor}`}>({diffFormatted})</span>
               </span>
               <span className="text-dh-main font-black leading-tight">นับได้ {changeInfo.new || '0'}</span>
             </div>
           );
         }
         return (
           <div className="flex flex-col">
             <span className="text-[10px] text-red-400 line-through leading-tight">{changeInfo.old || '-'}</span>
             <span className="text-green-500 font-bold leading-tight">{changeInfo.new || '-'}</span>
           </div>
         );
       }
    }
    
    if (h === 'SKU' && row._duplicateWarning) {
      return (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{val}{suffix}</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-tight whitespace-normal mt-0.5">
            ⚠️ {row._duplicateWarning}
          </span>
        </div>
      );
    }

    return <span className={row._status === 'ERROR' ? 'text-red-500 opacity-50' : ''}>{val}{suffix}</span>;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'NEW': return (
        <div className="flex flex-col gap-0.5">
          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md text-[10px] font-bold border border-green-500/20 w-fit">NEW</span>
          <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">ซ่อนสินค้าไว้</span>
        </div>
      );
      case 'CHANGED': return <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-md text-[10px] font-bold border border-orange-500/20">CHANGED</span>;
      case 'UNCHANGED': return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded-md text-[10px] font-bold border border-gray-500/20">UNCHANGED</span>;
      case 'ERROR': return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[10px] font-bold border border-red-500/20">ERROR</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h4 className="font-bold flex items-center gap-2">
          สรุปผลการวิเคราะห์ข้อมูล ({parsedData.length.toLocaleString()} รายการ)
          {!headers.includes('SKU') && (
            <span className="text-red-500 text-xs ml-2">⚠️ ไม่พบคอลัมน์ SKU (จำเป็น)</span>
          )}
        </h4>

        {parsedData.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md font-bold transition-all border ${
                statusFilter === 'ALL'
                  ? 'bg-dh-primary/10 text-dh-primary border-dh-primary/30 shadow-xs'
                  : 'bg-dh-surface text-slate-500 border-dh-border hover:bg-dh-base'
              }`}
            >
              ทั้งหมด ({counts.total.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('NEW'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all border ${
                statusFilter === 'NEW'
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40 shadow-xs'
                  : 'bg-dh-surface text-slate-600 border-dh-border hover:bg-dh-base'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 
              ใหม่: {counts.newCount.toLocaleString()}
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('CHANGED'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all border ${
                statusFilter === 'CHANGED'
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40 shadow-xs'
                  : 'bg-dh-surface text-slate-600 border-dh-border hover:bg-dh-base'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> 
              เปลี่ยน: {counts.changedCount.toLocaleString()}
            </button>
            <button
              type="button"
              onClick={() => { setStatusFilter('UNCHANGED'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all border ${
                statusFilter === 'UNCHANGED'
                  ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/40 shadow-xs'
                  : 'bg-dh-surface text-slate-500 border-dh-border hover:bg-dh-base'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> 
              คงเดิม: {counts.unchangedCount.toLocaleString()}
            </button>
            {counts.errorCount > 0 && (
              <button
                type="button"
                onClick={() => { setStatusFilter('ERROR'); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-all border ${
                  statusFilter === 'ERROR'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 shadow-xs'
                    : 'bg-dh-surface text-red-500 border-dh-border hover:bg-dh-base'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 
                ผิด: {counts.errorCount.toLocaleString()}
              </button>
            )}
          </div>
        )}
      </div>

      {counts.errorCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <p className="font-bold">⚠️ พบข้อมูลที่กรอกผิดพลาด {counts.errorCount} แถว</p>
          <p className="opacity-90 mt-1">กรุณาแก้ไขไฟล์ Excel ให้ถูกต้องตามข้อความที่ระบุในตาราง แล้วอัปโหลดใหม่อีกครั้ง</p>
        </div>
      )}

      {duplicateSkus.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <div>
            <span className="font-bold">พบ SKU ซ้ำอยู่ในไฟล์ ({duplicateSkus.length} รายการ): </span>
            <span className="font-mono font-semibold">{duplicateSkus.join(', ')}</span>
            <span className="opacity-90 ml-1">กรุณาตรวจสอบ</span>
          </div>
        </div>
      )}

      {/* 🚀 Table Container (Fixed height with sticky header) */}
      <div className="border border-dh-border rounded-xl shadow-xs custom-scrollbar-thick bg-dh-surface h-[52vh] min-h-[350px] overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
          <thead className="bg-dh-base sticky top-0 shadow-xs z-10">
            <tr>
              <th className="px-4 py-3 font-bold text-dh-muted w-14 bg-dh-base border-b border-dh-border">#</th>
              <th className="px-4 py-3 font-bold text-dh-muted w-24 bg-dh-base border-b border-dh-border">Status</th>
              {sortedHeaders.map((h) => (
                <th key={h} className="px-4 py-3 font-bold text-dh-muted bg-dh-base border-b border-dh-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dh-border">
            {paginatedData.map((row, idx) => {
              const globalIdx = (activePage - 1) * pageSize + idx + 1;
              return (
                <tr key={row['SKU'] ? `${row['SKU']}-${globalIdx}` : globalIdx} className="hover:bg-dh-accent/5 transition-colors">
                  <td className="px-4 py-2 align-middle text-xs text-dh-muted font-mono">{globalIdx}</td>
                  <td className="px-4 py-2 align-middle">
                    {getStatusBadge(row._status)}
                    {row._errorReason && (
                      <p className="text-[10px] text-red-500 mt-1 max-w-[140px] whitespace-normal leading-tight font-medium">
                        {row._errorReason}
                      </p>
                    )}
                  </td>
                  {sortedHeaders.map((h) => (
                    <td key={h} className="px-4 py-2 align-middle">
                      {renderCell(row, h)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🚀 Pagination Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-dh-surface px-4 py-2.5 rounded-xl border border-dh-border text-xs">
        <div className="text-dh-muted font-medium">
          แสดงรายการที่ <span className="font-bold text-dh-main">{filteredAndSortedData.length === 0 ? 0 : (activePage - 1) * pageSize + 1}</span> ถึง{' '}
          <span className="font-bold text-dh-main">{Math.min(activePage * pageSize, filteredAndSortedData.length)}</span> จากทั้งหมด{' '}
          <span className="font-bold text-dh-main">{filteredAndSortedData.length.toLocaleString()}</span> รายการ
          {statusFilter !== 'ALL' && <span className="ml-1 text-dh-primary font-bold">(กรอง: {statusFilter})</span>}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={activePage === 1}
            className="px-2.5 py-1 bg-dh-base border border-dh-border rounded-lg font-bold hover:bg-dh-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            « หน้าแรก
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={activePage === 1}
            className="px-2.5 py-1 bg-dh-base border border-dh-border rounded-lg font-bold hover:bg-dh-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹ ก่อนหน้า
          </button>
          
          <span className="px-3 py-1 font-bold text-dh-main bg-dh-base/50 rounded-lg border border-dh-border">
            หน้า {activePage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={activePage === totalPages}
            className="px-2.5 py-1 bg-dh-base border border-dh-border rounded-lg font-bold hover:bg-dh-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ถัดไป ›
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={activePage === totalPages}
            className="px-2.5 py-1 bg-dh-base border border-dh-border rounded-lg font-bold hover:bg-dh-border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            หน้าสุดท้าย »
          </button>
        </div>
      </div>
    </div>
  );
}
