import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import ClaimTableRow from './ClaimTableRow';

export default function ClaimTable({ 
  filteredRequests, 
  loading, 
  getStatusDisplay, 
  setSelectedRequest, 
  warrantyConfig,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange
}) {
  const [copiedText, setCopiedText] = useState(null);

  const handleQuickCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="bg-dh-surface rounded-2xl shadow-xl shadow-dh-shadow border border-dh-border p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dh-main mb-4"></div>
        <p className="text-dh-muted font-bold text-sm">กำลังโหลดข้อมูลระบบเคลม...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden h-full w-full flex flex-col justify-between rounded-b-xl">
      {/* Single Table Container */}
      <div className="flex-1 overflow-auto w-full custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-dh-surface/95 backdrop-blur-md border-b border-dh-border shadow-xs z-10">
            <tr>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[120px]">วันที่/เวลา ยื่น</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[135px]">Ref / Type</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[170px]">Customer / Order</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[110px]">วันที่สั่งซื้อ</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[150px]">Warranty</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left">Product & Reason</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-center w-[140px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dh-border bg-dh-surface">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-16 text-dh-muted text-[13px] font-medium">
                  <FileText className="w-8 h-8 opacity-20 mx-auto mb-2"/>
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <ClaimTableRow 
                  key={req.id}
                  req={req}
                  setSelectedRequest={setSelectedRequest}
                  copiedText={copiedText}
                  handleQuickCopy={handleQuickCopy}
                  warrantyConfig={warrantyConfig}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-4 py-2 bg-dh-surface border-t border-dh-border flex items-center justify-between shrink-0 text-xs font-bold text-dh-muted select-none">
        <div>
          แสดง {totalItems > 0 ? (currentPage - 1) * 21 + 1 : 0} - {Math.min(currentPage * 21, totalItems)} จาก {totalItems} รายการ
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-dh-surface border border-dh-border text-dh-main hover:bg-dh-base hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft size={14} />
            <span>ย้อนกลับ</span>
          </button>
          
          <div className="px-3 py-1 bg-dh-base border border-dh-border rounded-md text-xs font-bold text-dh-main">
            หน้า <span className="text-dh-accent">{currentPage}</span> / {totalPages}
          </div>

          <button
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-dh-surface border border-dh-border text-dh-main hover:bg-dh-base hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            title="หน้าถัดไป"
          >
            <span>ถัดไป</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
