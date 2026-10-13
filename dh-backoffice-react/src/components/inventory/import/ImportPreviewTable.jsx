import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';

export default function ImportPreviewTable({ headers, parsedData }) {
  const priority = useMemo(() => ['SKU', 'Name', 'StockQuantity', 'AddStock', 'Price', 'RetailPrice'], []);
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
         if (h === 'AddStock') return c.field === 'AddStock' || (c.field === 'Stock' && c.type === 'add');
         if (['StockQuantity', 'Stock', 'stock'].includes(h)) return c.field === h || (c.field === 'Stock' && c.type === 'adjustment');
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
    
    return <span className={row._status === 'ERROR' ? 'text-red-500 opacity-50' : ''}>{val}{suffix}</span>;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'NEW': return <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md text-[10px] font-bold border border-green-500/20">NEW</span>;
      case 'CHANGED': return <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-md text-[10px] font-bold border border-orange-500/20">CHANGED</span>;
      case 'UNCHANGED': return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded-md text-[10px] font-bold border border-gray-500/20">UNCHANGED</span>;
      case 'ERROR': return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[10px] font-bold border border-red-500/20">ERROR</span>;
      default: return null;
    }
  };

  const errorCount = parsedData.filter(d => d._status === 'ERROR').length;

  const virtuosoComponents = useMemo(() => ({
    Table: ({ style, ...props }) => (
      <table {...props} style={style} className="w-full text-left text-sm whitespace-nowrap border-collapse" />
    ),
    TableHead: React.forwardRef((props, ref) => (
      <thead {...props} ref={ref} className="bg-dh-base sticky top-0 shadow-xs z-10" />
    )),
    TableBody: React.forwardRef((props, ref) => (
      <tbody {...props} ref={ref} className="divide-y divide-dh-border" />
    ))
  }), []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-bold flex items-center gap-2">
          สรุปผลการวิเคราะห์ข้อมูล ({parsedData.length.toLocaleString()} รายการ)
          {!headers.includes('SKU') && (
            <span className="text-red-500 text-xs ml-2">⚠️ ไม่พบคอลัมน์ SKU (จำเป็น)</span>
          )}
        </h4>

        {parsedData.length > 0 && parsedData[0]._status && (
          <div className="flex gap-3 text-[11px] bg-dh-surface px-2.5 py-1 rounded-md border border-dh-border">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 
              <span className="font-bold text-slate-600">ใหม่: {parsedData.filter(d => d._status === 'NEW').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> 
              <span className="font-bold text-slate-600">เปลี่ยน: {parsedData.filter(d => d._status === 'CHANGED').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> 
              <span className="font-bold text-slate-500">คงเดิม: {parsedData.filter(d => d._status === 'UNCHANGED').length}</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 
                <span className="font-bold text-red-500">ผิด: {errorCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {errorCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <p className="font-bold">⚠️ พบข้อมูลที่กรอกผิดพลาด {errorCount} แถว</p>
          <p className="opacity-90 mt-1">กรุณาแก้ไขไฟล์ Excel ให้ถูกต้องตามข้อความที่ระบุในตาราง แล้วอัปโหลดใหม่อีกครั้ง</p>
        </div>
      )}

      <div className="border border-dh-border rounded-xl shadow-xs custom-scrollbar-thick bg-dh-surface h-[55vh] min-h-[350px] overflow-hidden">
        <TableVirtuoso
          data={parsedData}
          components={virtuosoComponents}
          fixedHeaderContent={() => (
            <tr>
              <th className="px-4 py-3 font-bold text-dh-muted w-24 bg-dh-base">Status</th>
              {sortedHeaders.map((h) => (
                <th key={h} className="px-4 py-3 font-bold text-dh-muted bg-dh-base">{h}</th>
              ))}
            </tr>
          )}
          itemContent={(idx, row) => (
            <>
              <td className="px-4 py-2 align-middle">
                {getStatusBadge(row._status)}
                {row._errorReason && <p className="text-[10px] text-red-500 mt-1 max-w-[120px] whitespace-normal leading-tight font-medium">{row._errorReason}</p>}
              </td>
              {sortedHeaders.map((h) => (
                <td key={h} className="px-4 py-2 align-middle">
                  {renderCell(row, h)}
                </td>
              ))}
            </>
          )}
        />
      </div>
    </div>
  );
}
