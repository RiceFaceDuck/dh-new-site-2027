import React from 'react';
import { Ban, Check, X, Package, CheckCircle2 } from 'lucide-react';

export default function ModalFooter({ 
  selectedRequest, 
  isManager, 
  isProcessing, 
  handleRequestCancel, 
  handleApprove, 
  handleMarkArrived,
  handleComplete,
  handleReject, 
  setSelectedRequest 
}) {
  const isPending = selectedRequest.status === 'pending_manager';
  const isWaitingItem = selectedRequest.status === 'waiting_item';
  const isProcessingItem = selectedRequest.status === 'processing';
  const isCancelTask = selectedRequest.type.startsWith('CANCEL_');

  return (
    <div className="p-5 bg-dh-surface border-t border-dh-border flex justify-between items-center shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10 relative">
      <div className="flex items-center gap-2">
        {(!isCancelTask && (isPending || isWaitingItem || isProcessingItem)) && (
          <button 
            disabled={isProcessing} 
            onClick={handleRequestCancel} 
            className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
          >
            <Ban className="w-3.5 h-3.5" /> ขอยกเลิก
          </button>
        )}

        {/* Manager Actions */}
        <div className="flex items-center gap-3 ml-4">
          
          {/* 1. Pending -> Approve */}
          {isPending && (
            <>
              <button 
                disabled={isProcessing || !isManager} 
                onClick={handleApprove} 
                className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 ${isManager ? 'text-white bg-blue-500 hover:bg-blue-600 hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                title={!isManager ? 'สงวนสิทธิ์เฉพาะระดับผู้จัดการขึ้นไป' : 'อนุมัติคำร้อง'}
              >
                <Check className="w-4 h-4" /> อนุมัติคำร้อง
              </button>
              <button 
                disabled={isProcessing || !isManager} 
                onClick={handleReject} 
                className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 border ${isManager ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                title={!isManager ? 'สงวนสิทธิ์เฉพาะระดับผู้จัดการขึ้นไป' : 'ไม่อนุมัติ'}
              >
                <X className="w-4 h-4" /> ไม่อนุมัติ
              </button>
            </>
          )}

          {/* 2. Waiting Item -> Mark Arrived */}
          {isWaitingItem && !isCancelTask && (
            <button 
              disabled={isProcessing || !isManager} 
              onClick={handleMarkArrived} 
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 ${isManager ? 'text-white bg-amber-500 hover:bg-amber-600 hover:shadow-lg animate-pulse hover:animate-none' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              title={!isManager ? 'สงวนสิทธิ์เฉพาะระดับผู้จัดการขึ้นไป' : 'รับสินค้าเรียบร้อย'}
            >
              <Package className="w-4 h-4" /> ได้รับสินค้าจากลูกค้าแล้ว
            </button>
          )}

          {/* 3. Processing -> Complete */}
          {isProcessingItem && !isCancelTask && (
            <button 
              disabled={isProcessing || !isManager} 
              onClick={handleComplete} 
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 ${isManager ? 'text-white bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              title={!isManager ? 'สงวนสิทธิ์เฉพาะระดับผู้จัดการขึ้นไป' : 'เสร็จสิ้นกระบวนการ'}
            >
              <CheckCircle2 className="w-4 h-4" /> เสร็จสิ้นกระบวนการ (คืนเงิน/เบิกของใหม่)
            </button>
          )}
        </div>
      </div>

      <button 
        onClick={setSelectedRequest} 
        className="px-8 py-2.5 bg-dh-main hover:bg-dh-muted text-dh-surface font-black text-[12px] rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        ปิด
      </button>
    </div>
  );
}
