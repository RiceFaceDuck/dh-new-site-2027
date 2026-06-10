import React from 'react';
import { User, Check, Copy } from 'lucide-react';
import { getStatusDisplay } from '../../utils/claimFormatters';

export default function CustomerInfo({ selectedRequest, copiedText, handleQuickCopy }) {
  return (
    <div className="space-y-4">
      <div className="bg-dh-surface/60 backdrop-blur-sm p-5 rounded-xl border border-dh-border shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-[10px] font-black text-dh-muted uppercase tracking-widest mb-3 border-b border-dh-border pb-2 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5"/> ข้อมูลลูกค้าและบิล
        </h3>
        <div className="space-y-3 text-[12px]">
          <div className="flex justify-between items-center group">
            <span className="text-dh-muted font-medium">ชื่อลูกค้า:</span> 
            <span className="font-black text-dh-main">{selectedRequest.payload.customerName}</span>
          </div>
          <div className="flex justify-between items-center group/copy">
            <span className="text-dh-muted font-medium">บิลอ้างอิง:</span> 
            <span className="font-mono font-bold text-dh-accent flex items-center gap-1 cursor-pointer hover:bg-dh-accent/10 px-1.5 py-0.5 rounded transition-colors" onClick={(e) => handleQuickCopy(e, selectedRequest.payload.orderId)}>
              {selectedRequest.payload.orderId}
              {copiedText === selectedRequest.payload.orderId ? <Check className="w-3.5 h-3.5 text-emerald-500"/> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover/copy:opacity-100 transition-opacity"/>}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dh-muted font-medium">วันที่ซื้อ:</span> 
            <span className="font-bold text-dh-main">{selectedRequest.payload.purchaseDate ? new Date(selectedRequest.payload.purchaseDate).toLocaleDateString('th-TH') : '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dh-muted font-medium">พนักงานแจ้ง:</span> 
            <span className="font-bold text-dh-main">{selectedRequest.payload.requestedByName}</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-dh-surface to-dh-base p-5 rounded-xl border border-dh-border shadow-sm flex flex-col items-center justify-center min-h-[140px] text-center relative overflow-hidden group hover:border-dh-accent/30 transition-colors">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-dh-accent/5 rounded-full blur-2xl group-hover:bg-dh-accent/10 transition-colors"></div>
        <p className="text-[10px] font-black text-dh-muted uppercase tracking-widest mb-3 z-10">สถานะการตรวจสอบ</p>
        <div className="z-10 scale-110 mb-1">{getStatusDisplay(selectedRequest)}</div>
        <span className="text-[10px] font-bold text-dh-main mt-3 bg-dh-surface px-4 py-1.5 rounded-full border border-dh-border shadow-sm z-10">{selectedRequest.payload.status || 'รอตรวจสอบ'}</span>
        
        {selectedRequest.status === 'rejected' && <p className="text-[11px] text-rose-600 mt-3 font-bold w-full text-center z-10 bg-rose-50 dark:bg-rose-900/20 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/50">เหตุผล: {selectedRequest.rejectReason}</p>}
        {selectedRequest.type.startsWith('CANCEL_') && selectedRequest.rejectCancelReason && <p className="text-[11px] text-red-600 mt-3 font-bold w-full text-center z-10 bg-red-50 dark:bg-red-900/20 py-1.5 rounded-lg border border-red-100 dark:border-red-900/50">ปฏิเสธยกเลิก: {selectedRequest.rejectCancelReason}</p>}
      </div>
    </div>
  );
}
