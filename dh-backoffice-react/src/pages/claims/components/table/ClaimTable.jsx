import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import ClaimTableRow from './ClaimTableRow';

export default function ClaimTable({ filteredRequests, loading, getStatusDisplay, setSelectedRequest, warrantyConfig }) {
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
    <div className="flex-1 overflow-auto h-full w-full custom-scrollbar rounded-b-xl">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        
        <thead className="bg-dh-surface/90 sticky top-0 z-20 backdrop-blur-md border-b border-dh-border shadow-sm">
          <tr>
            <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider font-mono w-[100px]">วันที่/เวลา ยื่นธุรกรรม</th>
            <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider w-[120px]">Ref / Type</th>
            <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider w-[180px]">Customer / Order</th>
            <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider w-[120px]">วันที่สั่งซื้อสินค้านี้</th>
            <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider w-[130px]">Warranty</th>
            <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider w-[35%] min-w-[350px]">Product & Reason</th>
            <th className="px-4 py-3 text-[11px] font-black text-dh-muted uppercase tracking-wider text-center w-[120px]">Status</th>
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        
        <tbody className="bg-dh-surface">
          {filteredRequests.length === 0 ? (
            <tr><td colSpan="8" className="text-center py-16 text-dh-muted text-[13px] font-medium"><FileText className="w-8 h-8 opacity-20 mx-auto mb-2"/>ไม่พบข้อมูล</td></tr>
          ) : (
            filteredRequests.map(req => (
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
  );
}
