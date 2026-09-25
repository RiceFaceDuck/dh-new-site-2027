import { FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import ClaimTableRow from './ClaimTableRow';

export default function ClaimTable({ 
  filteredRequests, 
  loading, 
  setSelectedRequest, 
  warrantyConfig,
  customerProfiles = {},
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 21,
  setPageSize,
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
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 bg-dh-surface/95 backdrop-blur-md border-b border-dh-border shadow-xs z-10">
            <tr>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[10%] whitespace-nowrap">วันที่ยื่น</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[12%] whitespace-nowrap">Ref / Type</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[22%] whitespace-nowrap">Customer / Order</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[10%] whitespace-nowrap">วันที่ซื้อ</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[12%] whitespace-nowrap">Warranty</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-left w-[24%] whitespace-nowrap">Product & Reason</th>
              <th className="px-3 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-center w-[10%] whitespace-nowrap">Status</th>
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
              filteredRequests.map((req, index) => (
                <ClaimTableRow 
                  key={req.id}
                  req={req}
                  index={index}
                  setSelectedRequest={setSelectedRequest}
                  copiedText={copiedText}
                  handleQuickCopy={handleQuickCopy}
                  warrantyConfig={warrantyConfig}
                  customerProfile={req.payload?.customerUid ? customerProfiles?.[req.payload.customerUid] : null}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-4 py-2 bg-dh-surface border-t border-dh-border flex flex-wrap items-center justify-between gap-3 shrink-0 text-sm shadow-xs rounded-b-xl z-10 select-none">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-dh-muted">
          <div>
            แสดง <span className="text-dh-accent font-bold">{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)}</span> จากทั้งหมด <span className="text-dh-main font-bold">{totalItems.toLocaleString()}</span> รายการ
          </div>
          {setPageSize && (
            <div className="flex items-center gap-1.5 border-l border-dh-border pl-4">
              <span className="text-dh-muted text-xs">แสดงหน้าละ:</span>
              <select 
                value={pageSize} 
                onChange={e => setPageSize(Math.max(10, Number(e.target.value) || 10))}
                className="px-2 py-1 bg-dh-base border border-dh-border rounded-md text-xs font-bold text-dh-main focus:outline-hidden focus:border-dh-accent cursor-pointer"
              >
                <option value={21}>21 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
                <option value={250}>250 รายการ</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange && onPageChange(1)}
            disabled={currentPage <= 1}
            className="px-2 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
            title="หน้าแรก"
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            onClick={() => onPageChange && onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
            title="หน้าก่อนหน้า"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">ย้อนกลับ</span>
          </button>

          <div className="flex items-center gap-1 px-2 py-1 bg-dh-base border border-dh-border rounded-md text-xs font-bold text-dh-main">
            <span>หน้า</span>
            <select
              value={currentPage}
              onChange={e => onPageChange && onPageChange(Math.max(1, Number(e.target.value) || 1))}
              className="bg-transparent border-none text-dh-accent font-bold outline-hidden cursor-pointer appearance-none text-center px-1 hover:bg-dh-surface rounded"
            >
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <span>/ {totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange && onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
            title="หน้าถัดไป"
          >
            <span className="hidden sm:inline">ถัดไป</span>
            <ChevronRight size={14} />
          </button>

          <button
            onClick={() => onPageChange && onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="px-2 py-1.5 bg-dh-base border border-dh-border hover:border-dh-accent text-dh-main hover:text-dh-accent rounded-md font-bold text-xs flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 cursor-pointer"
            title="หน้าสุดท้าย"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
