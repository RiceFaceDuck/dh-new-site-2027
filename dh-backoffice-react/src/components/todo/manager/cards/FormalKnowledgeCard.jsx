import React, { useState } from 'react';
import { BookOpen, Check, X, Loader2, Package, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import FormalManagerBadge from './FormalManagerBadge';

export default function FormalKnowledgeCard({ task, isProcessing, isManagerTab, handleAction }) {
  const { payload, title, description, createdByName, createdAt, id, type } = task;
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = createdAt?.toDate ? createdAt.toDate().toLocaleString('th-TH') : '';
  const creditReward = payload?.creditReward || 2;

  const onApprove = (e) => {
    e.stopPropagation();
    handleAction(id, 'approve', type, payload);
  };

  const onReject = (e) => {
    e.stopPropagation();
    if (!showRejectInput) {
      setShowRejectInput(true);
      if (!isExpanded) setIsExpanded(true); // Auto expand if they click reject from collapsed view (though buttons are hidden)
      return;
    }
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ปฏิเสธ');
      return;
    }
    handleAction(id, 'reject', type, { ...payload, reason: rejectReason });
  };

  return (
    <div className={`bg-white rounded-md shadow-sm border border-slate-200 flex flex-col relative transition-all hover:border-slate-400 mb-4 ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>
      
      {isManagerTab && <FormalManagerBadge text="KNOWLEDGE APPROVAL" />}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300">
          <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
          <span className="text-xs font-bold text-blue-600 animate-pulse">PROCESSING...</span>
        </div>
      )}

      {/* Header / Summary */}
      <div 
        className={`p-4 cursor-pointer flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded border border-blue-100 shrink-0">
            <BookOpen size={18} />
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 shadow-sm">
                #{id?.slice(-6).toUpperCase()}
              </span>
              <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 border border-yellow-300 px-1.5 py-0.5 rounded shadow-sm tracking-wider">
                REWARD: {creditReward} PTS
              </span>
            </div>
            
            <h3 className="font-bold text-slate-800 text-sm truncate uppercase tracking-wide">
              {title || 'ตรวจสอบข้อมูลความรู้'}
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Clock size={12}/> {formattedDate}</span>
              <span className="truncate">By: {createdByName}</span>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 text-slate-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
          
          <div className="space-y-4 mb-5">
            <div className="bg-white border border-slate-200 p-3 rounded-md flex items-start gap-3 shadow-sm">
               <Package className="text-slate-400 mt-0.5 shrink-0" size={18} />
               <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference Product</span>
                  <span className="text-sm font-bold text-slate-800">{payload.productName}</span>
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded w-fit">{payload.productId}</span>
               </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 shadow-inner">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Suggested Info</span>
              <p className="text-lg font-bold text-slate-800 break-words leading-relaxed">
                "{payload.suggestedValue}"
              </p>
            </div>

            {showRejectInput && (
              <div className="animate-in fade-in slide-in-from-top-2 bg-rose-50 p-3 rounded-md border border-rose-200">
                <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Reason for Rejection</label>
                <input 
                  type="text" 
                  placeholder="ระบุเหตุผลที่ปฏิเสธ (เช่น ข้อมูลไม่ถูกต้อง)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-rose-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-inner"
                  disabled={isProcessing}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex gap-2">
            <button 
              onClick={onApprove}
              disabled={isProcessing}
              className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              <Check size={16} strokeWidth={3} /> อนุมัติ (APPROVE)
            </button>
            <button 
              onClick={onReject}
              disabled={isProcessing}
              className={`flex-1 flex justify-center items-center gap-2 px-6 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50 border ${
                showRejectInput 
                  ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700' 
                  : 'bg-white border-slate-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400'
              }`}
            >
              <X size={16} strokeWidth={3} /> {showRejectInput ? 'ยืนยันปฏิเสธ (CONFIRM REJECT)' : 'ปฏิเสธ (REJECT)'}
            </button>
            {showRejectInput && (
              <button 
                onClick={() => setShowRejectInput(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-xs font-bold hover:bg-slate-200 transition-colors shadow-sm"
              >
                ยกเลิก (CANCEL)
              </button>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
