import React, { useState } from 'react';
import { BookOpen, Check, X, Package, ChevronDown, ChevronUp, Clock } from 'lucide-react';

export default function KnowledgeCard({ todo, isProcessing, isManagerTab, urgencyLevel, handleAction, getStatusBadge, formatDate, handleRejectClick, getIconForType }) {
  const { payload, title, description, createdByName, createdAt, id, type } = todo;
  const [isExpanded, setIsExpanded] = useState(false);
  const creditReward = payload?.creditReward || 2;

  const onApprove = (e) => {
    e.stopPropagation();
    handleAction(id, 'approve', type, payload);
  };

  const onReject = (e) => {
    e.stopPropagation();
    handleRejectClick();
  };

  const getUrgencyStyles = (level) => {
    switch (level) {
      case 'high': return 'border-l-4 border-l-red-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 hover:border-red-400 bg-red-50/30';
      case 'medium': return 'border-l-4 border-l-orange-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 hover:border-orange-400 bg-orange-50/30';
      default: return 'border-2 border-gray-200 hover:border-slate-400 bg-white';
    }
  };

  return (
    <div className={`rounded-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] transition-all overflow-hidden relative mb-4 transform hover:-translate-y-0.5 ${getUrgencyStyles(urgencyLevel)} ${isProcessing ? 'opacity-75 pointer-events-none' : ''}`}>
      
      {isManagerTab && <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 shadow-xs">Manager</div>}

      {isProcessing && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-xs z-20 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-dh-main border-t-transparent rounded-full"></div>
        </div>
      )}

      <div 
        className="flex flex-col sm:flex-row p-3 sm:p-4 gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-16 h-16 shrink-0 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
          {getIconForType(type)}
        </div>
        
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm shadow-xs uppercase tracking-wider">#{id?.slice(-6).toUpperCase()}</span>
            <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 border border-yellow-300 px-1.5 py-0.5 rounded-sm shadow-xs tracking-wider">REWARD: {creditReward} PTS</span>
            {getStatusBadge(todo.status)}
            {todo.priority === 'High' && <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-sm shadow-xs animate-pulse">🔥 ด่วนมาก</span>}
          </div>
          
          <h3 className="text-sm font-black text-slate-900 truncate mb-1 leading-tight">{title || 'ตรวจสอบข้อมูลความรู้'}</h3>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(createdAt)}</span>
            <span className="truncate">เสนอโดย: <strong>{createdByName}</strong></span>
          </div>

          <div className="mt-2">
            <p className={`text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded-sm border border-slate-100 shadow-xs leading-tight border-l-2 border-l-slate-300 ${!isExpanded ? 'line-clamp-1' : 'whitespace-pre-wrap'}`}>
              ข้อมูลที่นำเสนอ: "{payload?.suggestedValue}"
            </p>
          </div>
        </div>

        {/* Desktop Expand Icon */}
        <div className="hidden sm:flex shrink-0 items-center justify-center text-slate-400 pr-2">
           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2">
          <div className="space-y-3 mb-4">
            <div className="bg-white border border-slate-200 p-3 rounded-md flex items-start gap-3 shadow-xs">
               <Package className="text-slate-400 mt-0.5 shrink-0" size={18} />
               <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สินค้าอ้างอิง</span>
                  <span className="text-sm font-bold text-slate-800">{payload?.productName}</span>
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded-sm w-fit">{payload?.productId}</span>
               </div>
            </div>
            {description && (
              <div className="bg-slate-50 p-3 rounded-sm border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">รายละเอียดเพิ่มเติม</span>
                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{description}</p>
              </div>
            )}
          </div>

          <div className="flex flex-row gap-2 pt-3 border-t border-slate-100">
            {isManagerTab ? (
              <>
                <button onClick={onApprove} disabled={isProcessing} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Check size={14} strokeWidth={3} /> อนุมัติ
                </button>
                <button onClick={onReject} disabled={isProcessing} className="flex-1 py-1.5 bg-white border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 font-bold rounded-lg transition-colors flex items-center justify-center text-[10px] disabled:opacity-50">
                  <X size={14} strokeWidth={2.5} /> ปฏิเสธ
                </button>
              </>
            ) : (
              <button onClick={onReject} disabled={isProcessing} className="flex-1 py-1.5 bg-white border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold rounded-lg transition-colors flex items-center justify-center text-[10px] disabled:opacity-50">
                <X size={12} strokeWidth={2.5} /> ยกเลิกคำขอ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
