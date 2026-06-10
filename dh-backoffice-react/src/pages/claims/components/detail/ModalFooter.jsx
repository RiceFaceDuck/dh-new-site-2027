import React from 'react';
import { Ban, Check, X } from 'lucide-react';

export default function ModalFooter({ 
  selectedRequest, 
  isManager, 
  isProcessing, 
  handleRequestCancel, 
  handleApprove, 
  handleReject, 
  setSelectedRequest 
}) {
  return (
    <div className="p-5 bg-dh-surface border-t border-dh-border flex justify-between items-center shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10 relative">
      <div className="flex items-center gap-2">
        {(!selectedRequest.type.startsWith('CANCEL_') && (selectedRequest.status === 'pending_manager' || selectedRequest.status === 'approved')) && (
          <button 
            disabled={isProcessing} 
            onClick={handleRequestCancel} 
            className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
          >
            <Ban className="w-3.5 h-3.5" /> ขอยกเลิก
          </button>
        )}

        {/* ✨ Manager Approval Buttons */}
        {isManager && selectedRequest.status === 'pending_manager' && (
          <div className="flex items-center gap-3 ml-4">
            <button 
              disabled={isProcessing} 
              onClick={handleApprove} 
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <Check className="w-4 h-4" /> อนุมัติทำรายการ
            </button>
            <button 
              disabled={isProcessing} 
              onClick={handleReject} 
              className="px-5 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-900/20 dark:border-rose-900/50 dark:hover:bg-rose-900/40 rounded-lg transition-all flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <X className="w-4 h-4" /> ไม่อนุมัติ
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={() => setSelectedRequest(null)} 
        className="px-8 py-2.5 bg-dh-main hover:bg-dh-muted text-dh-surface font-black text-[12px] rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        ปิด
      </button>
    </div>
  );
}
