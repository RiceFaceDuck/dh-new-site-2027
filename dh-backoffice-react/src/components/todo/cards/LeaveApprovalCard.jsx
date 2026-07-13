import { useState } from 'react';
import { Calendar, Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function LeaveApprovalCard({ 
  todo, 
  isProcessing, 
  isManagerTab,
  urgencyLevel,
  handleAction, 
  handleRejectClick,
  getStatusBadge,
  formatDate
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const payload = todo.payload || {};

  const translateLeaveType = (type) => {
    switch (type) {
      case 'sick': return 'ลาป่วย';
      case 'personal': return 'ลากิจ';
      case 'vacation': return 'ลาพักร้อน';
      default: return type;
    }
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
        <div className="w-16 h-16 shrink-0 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-200"></div>
          <Calendar className="w-8 h-8 text-orange-500" />
        </div>
        
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm shadow-xs uppercase tracking-wider">#{todo.id?.slice(-6).toUpperCase()}</span>
            {getStatusBadge(todo.status)}
            {todo.priority === 'High' && <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-sm shadow-xs animate-pulse">🔥 ด่วนมาก</span>}
          </div>
          
          <h3 className="text-sm font-black text-slate-900 truncate mb-1 leading-tight">คำขอลางาน: {payload.staffName || 'พนักงาน'}</h3>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><Clock size={12}/> ส่งคำขอ: {formatDate(todo.createdAt)}</span>
          </div>

          <div className="mt-2 flex gap-3 text-xs">
             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm border border-slate-200"><strong>ประเภท:</strong> {translateLeaveType(payload.leaveType)}</span>
             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm border border-slate-200"><strong>วันที่:</strong> {payload.startDate} - {payload.endDate}</span>
          </div>
        </div>

        <div className="hidden sm:flex shrink-0 items-center justify-center text-slate-400 pr-2">
           {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2">
          <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 mb-4">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">เหตุผลการลา</span>
             <p className="text-sm text-slate-700 font-medium">{payload.reason || '-'}</p>
          </div>

          <div className="flex flex-row gap-2 pt-3 border-t border-slate-100">
            {isManagerTab ? (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'approve', todo.type, todo.payload); }} 
                  disabled={isProcessing} 
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} strokeWidth={3} /> อนุมัติการลา
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRejectClick(); }} 
                  disabled={isProcessing} 
                  className="flex-1 py-1.5 bg-white border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 font-bold rounded-lg transition-colors flex items-center justify-center text-[10px] disabled:opacity-50"
                >
                  <X size={14} strokeWidth={2.5} /> ไม่อนุมัติ
                </button>
              </>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); handleRejectClick(); }} 
                disabled={isProcessing} 
                className="flex-1 py-1.5 bg-white border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold rounded-lg transition-colors flex items-center justify-center text-[10px] disabled:opacity-50"
              >
                <X size={12} strokeWidth={2.5} /> ยกเลิกคำขอลางาน
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
