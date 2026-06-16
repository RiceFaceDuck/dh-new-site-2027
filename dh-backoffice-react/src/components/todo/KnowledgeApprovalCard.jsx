import React, { useState } from 'react';
import { BookOpen, Check, X, Loader2, Package } from 'lucide-react';

export default function KnowledgeApprovalCard({ task, isProcessing, handleAction }) {
  const { payload, title, description, createdByName, createdAt } = task;
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const formattedDate = createdAt?.toDate ? createdAt.toDate().toLocaleString('th-TH') : '';
  const creditReward = payload?.creditReward || 2;

  const onApprove = () => {
    handleAction(task.id, 'approve', task.type, payload);
  };

  const onReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ปฏิเสธ');
      return;
    }
    handleAction(task.id, 'reject', task.type, { ...payload, reason: rejectReason });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>

      <div className="flex items-start justify-between mb-4 pl-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formattedDate}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-md border border-yellow-200">
             ให้รางวัล: {creditReward} Credit
           </span>
        </div>
      </div>

      <div className="pl-3 mb-6 space-y-3">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 flex items-start gap-3">
           <Package className="text-slate-400 mt-0.5 shrink-0" size={18} />
           <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">สินค้าอ้างอิง:</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{payload.productName} ({payload.productId})</p>
           </div>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">ข้อมูลที่เสนอมา:</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 text-lg">"{payload.suggestedValue}"</p>
          <p className="text-xs text-slate-500 mt-2">เสนอโดย: {createdByName}</p>
        </div>

        {showRejectInput && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2">
            <input 
              type="text" 
              placeholder="ระบุเหตุผลที่ปฏิเสธ (เช่น ข้อมูลไม่ถูกต้อง)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isProcessing}
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pl-3">
        <button 
          onClick={onApprove}
          disabled={isProcessing}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/20"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
          อนุมัติ
        </button>
        <button 
          onClick={onReject}
          disabled={isProcessing}
          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 border ${
            showRejectInput 
              ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
              : 'bg-white dark:bg-slate-800 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20'
          }`}
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} strokeWidth={3} />}
          {showRejectInput ? 'ยืนยันปฏิเสธ' : 'ปฏิเสธ'}
        </button>
        {showRejectInput && (
          <button 
            onClick={() => setShowRejectInput(false)}
            disabled={isProcessing}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            ยกเลิก
          </button>
        )}
      </div>
    </div>
  );
}
