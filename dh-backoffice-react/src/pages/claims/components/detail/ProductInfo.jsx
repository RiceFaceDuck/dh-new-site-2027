import React from 'react';
import { Package, Truck, Check, Copy, Gift, AlertCircle } from 'lucide-react';

export default function ProductInfo({ selectedRequest, isManager, trackingNo, setTrackingNo, copiedText, handleQuickCopy, freebieReturned, setFreebieReturned, freebiePenaltyAmount, setFreebiePenaltyAmount }) {
  const isClaim = selectedRequest.originalType === 'CLAIM_APPROVAL' || selectedRequest.type === 'CLAIM_APPROVAL';
  const isReturn = selectedRequest.originalType === 'RETURN_APPROVAL' || selectedRequest.type === 'RETURN_APPROVAL';
  const hasFreebies = selectedRequest.payload?.hasFreebies;

  return (
    <div className="bg-dh-surface/60 backdrop-blur-sm p-5 rounded-xl border border-dh-border shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <h3 className="text-[10px] font-black text-dh-muted uppercase tracking-widest mb-3 border-b border-dh-border pb-2 flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5"/> ข้อมูลสินค้าและสาเหตุ
      </h3>
      
      <div className="bg-gradient-to-r from-dh-base to-transparent p-4 rounded-xl border border-dh-border/50 mb-4 hover:border-dh-border transition-colors">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[9px] font-black text-dh-surface bg-dh-muted px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">{selectedRequest.payload.actionType}</span>
            <p className="font-black text-dh-main text-[14px] mt-2 leading-snug">{selectedRequest.payload.productName}</p>
            <p className="font-mono text-[11px] text-dh-accent font-bold mt-1 bg-dh-accent/10 w-fit px-1.5 py-0.5 rounded">{selectedRequest.payload.sku}</p>
          </div>
          <div className="text-right shrink-0 bg-dh-surface px-3 py-1.5 rounded-lg border border-dh-border shadow-sm">
            <span className="text-[10px] font-bold text-dh-muted block mb-0.5">จำนวน</span>
            <span className="text-2xl font-black text-dh-main">{selectedRequest.payload.qty || 1}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-dh-base/50 p-3 rounded-lg border border-dh-border/50">
          <p className="text-[10px] font-black text-dh-muted mb-1.5 uppercase tracking-wide">{isClaim ? 'อาการเสียเบื้องต้น' : 'เหตุผลการคืน'}</p>
          <p className="text-[13px] text-dh-main font-bold flex items-start gap-2 before:content-['•'] before:text-dh-accent">
            {selectedRequest.payload.symptomCode || selectedRequest.payload.returnReason}
          </p>
        </div>
        
        <div>
          <p className="text-[10px] font-bold text-dh-muted mb-1.5 ml-1">รายละเอียดเพิ่มเติม</p>
          <p className="text-[12px] text-dh-main whitespace-pre-wrap bg-dh-base/80 p-3 rounded-xl border border-dh-border/50 shadow-inner">
            {selectedRequest.payload.symptomDetails || selectedRequest.payload.returnDetails || <span className="text-dh-muted/50 italic">ไม่มีรายละเอียดเพิ่มเติม</span>}
          </p>
        </div>
        
        {/* Freebie Check Section (For Returns Only) */}
        {isReturn && hasFreebies && isManager && selectedRequest.status === 'processing' && (
          <div className="bg-orange-50/80 p-3 rounded-lg border border-orange-200 shadow-sm mt-3 animate-in fade-in slide-in-from-top-2">
             <p className="text-[11px] font-black text-orange-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
               <Gift className="w-4 h-4"/> ตรวจสอบการคืนของแถม
             </p>
             <p className="text-[10px] text-orange-600 mb-3 leading-snug">ออเดอร์นี้มีของแถม โปรดยืนยันว่าลูกค้าคืนของแถมครบถ้วน หรือระบุยอดเงินที่ต้องหักหากลูกค้าไม่ได้คืนของแถม</p>
             
             <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-orange-100 hover:border-orange-300 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={freebieReturned} 
                    onChange={(e) => {
                      setFreebieReturned(e.target.checked);
                      if(e.target.checked) setFreebiePenaltyAmount(0);
                    }}
                    className="w-4 h-4 text-orange-600 rounded border-orange-300 focus:ring-orange-500"
                  />
                  <span className="text-[12px] font-bold text-slate-700">ลูกค้าคืนของแถมครบถ้วน</span>
                </label>
                
                {!freebieReturned && (
                  <div className="bg-white p-3 rounded border border-orange-200 flex flex-col gap-1.5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                    <label className="text-[10px] font-bold text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> ระบุยอดเงินที่ต้องหัก (ค่าปรับ)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                      <input 
                        type="number"
                        min="1"
                        value={freebiePenaltyAmount}
                        onChange={(e) => setFreebiePenaltyAmount(Number(e.target.value))}
                        className="w-full text-xs p-2 pl-7 rounded bg-slate-50 border border-slate-300 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                        placeholder="ระบุมูลค่าของแถมเพื่อหักจากยอดคืนเงิน"
                      />
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
        
        {/* Tracking Section */}
        {isManager && selectedRequest.status === 'pending_manager' ? (
          <div className="mt-2 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5"/> เลขพัสดุรับเข้า (Tracking Number)</p>
            <input 
              type="text" 
              placeholder="กรอกเลขพัสดุก่อนรับจบ (ถ้ามี)" 
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-black/20 border border-blue-200 dark:border-blue-800/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono transition-all shadow-sm"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {selectedRequest.payload.trackingNo && (
              <div className="group/track w-fit">
                <p className="text-[10px] font-bold text-dh-muted mb-1.5 ml-1 flex items-center gap-1"><Truck className="w-3 h-3"/> เลขพัสดุรับเข้า (จากลูกค้า)</p>
                <span className="font-mono text-[13px] font-black text-dh-accent bg-dh-accent/10 px-3 py-1.5 rounded-lg border border-dh-accent/20 cursor-pointer flex items-center gap-2 hover:bg-dh-accent/20 transition-colors shadow-sm" onClick={(e) => handleQuickCopy(e, selectedRequest.payload.trackingNo)}>
                  {selectedRequest.payload.trackingNo}
                  {copiedText === selectedRequest.payload.trackingNo ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4 opacity-0 group-hover/track:opacity-100 transition-opacity"/>}
                </span>
              </div>
            )}
            
            {selectedRequest.payload.returnTrackingNo && (
              <div className="group/rtrack w-fit mt-1">
                <p className="text-[10px] font-bold text-emerald-600 mb-1.5 ml-1 flex items-center gap-1"><Truck className="w-3 h-3"/> เลขพัสดุส่งออก (ส่งกลับลูกค้า)</p>
                <span className="font-mono text-[13px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm" onClick={(e) => handleQuickCopy(e, selectedRequest.payload.returnTrackingNo)}>
                  {selectedRequest.payload.returnTrackingNo}
                  {copiedText === selectedRequest.payload.returnTrackingNo ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4 opacity-0 group-hover/rtrack:opacity-100 transition-opacity"/>}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
