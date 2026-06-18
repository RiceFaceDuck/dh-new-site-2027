import React from 'react';

export default function ImportPreviewTable({ headers, parsedData }) {
  return (
    <div className="space-y-2">
      <h4 className="font-bold flex justify-between items-end">
        <span>ตัวอย่างข้อมูล (Preview)</span>
        {!headers.includes('SKU') && (
          <span className="text-red-500 text-xs">⚠️ ไม่พบคอลัมน์ SKU (จำเป็น)</span>
        )}
      </h4>
      <div className="overflow-x-auto border border-dh-border rounded-xl shadow-sm custom-scrollbar bg-dh-surface max-h-[300px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-dh-base sticky top-0 shadow-sm z-10">
            <tr>
              {headers.slice(0, 10).map((h) => (
                <th key={h} className="px-4 py-3 font-bold text-dh-muted">{h}</th>
              ))}
              {headers.length > 10 && (
                <th className="px-4 py-3 font-bold text-dh-muted">... ({headers.length - 10} more)</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-dh-border">
            {parsedData.slice(0, 5).map((row, idx) => (
              <tr key={idx} className="hover:bg-dh-base/50 transition-colors">
                {headers.slice(0, 10).map((h) => (
                  <td key={h} className="px-4 py-2">
                    {String(row[h] || '').substring(0, 30)}
                    {String(row[h] || '').length > 30 ? '...' : ''}
                  </td>
                ))}
                {headers.length > 10 && <td className="px-4 py-2 text-dh-muted">...</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-dh-muted text-right">แสดงตัวอย่าง 5 แถวแรก</p>
    </div>
  );
}
