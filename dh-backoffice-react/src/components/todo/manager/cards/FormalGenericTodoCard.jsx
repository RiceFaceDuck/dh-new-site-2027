import React, { useState } from 'react';
import { Clock, Calendar, Check, X, Play, ChevronDown, ChevronUp } from 'lucide-react';
import FormalManagerBadge from './FormalManagerBadge';

export default function FormalGenericTodoCard({ 
  todo, 
  isProcessing, 
  isManagerTab, 
  urgencyClass, 
  handleAction, 
  getStatusBadge, 
  formatDate, 
  handleRejectClick, 
  getIconForType 
}) {
  const [trackingNo, setTrackingNo] = useState(todo.payload?.trackingNo || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMarkArrived = () => {
    if (!trackingNo.trim()) {
      alert('กรุณากรอกเลขที่ขนส่งก่อนทำรายการ');
      return;
    }
    const confirmed = window.confirm('⚠️ หากกด "ได้รับสินค้าแล้ว" จะเปลี่ยนเป็นสถานะ "กำลังตรวจ" แล้วไม่สามารถแก้ไขอะไรได้ คุณตรวจสอบสภาพสินค้าเรียบร้อยดีแล้วใช่หรือไม่');
    if (confirmed) {
      handleAction(todo.id, 'markArrived', todo.type, { trackingNo: trackingNo.trim() });
    }
  };

  return (
    <div className={`bg-white rounded-md shadow-sm border border-slate-200 flex flex-col relative transition-all hover:border-slate-400 mb-4 ${urgencyClass} ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>
      
      {isManagerTab && <FormalManagerBadge text="MANAGER ACTION" />}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mb-2"></div>
          <span className="text-xs font-bold text-slate-600 animate-pulse">PROCESSING...</span>
        </div>
      )}

      {/* Header / Summary */}
      <div 
        className={`p-4 cursor-pointer flex items-center justify-between gap-4 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            {getIconForType(todo.type)}
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 shadow-sm">
                #{todo.id?.slice(-6).toUpperCase()}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200 shadow-sm">
                {todo.type}
              </span>
              {getStatusBadge(todo.status)}
              {todo.priority === 'High' && (
                <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded shadow-sm tracking-wider">
                  URGENT
                </span>
              )}
            </div>
            
            <h3 className="font-bold text-slate-800 text-sm truncate uppercase tracking-wide">
              {todo.title || 'งานทั่วไป'}
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium flex-wrap">
              {todo.customerName && <span className="text-slate-700 font-bold">Acct: {todo.customerName}</span>}
              <span className="flex items-center gap-1"><Clock size={12}/> {formatDate(todo.createdAt || todo.requestedAt)}</span>
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
            {todo.description && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Details / Note</span>
                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                  {todo.description}
                </p>
              </div>
            )}
            
            {/* Meta data */}
            {todo.dueDate && (
              <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-slate-200 shadow-sm w-fit">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Due Date</span>
                <span className={`font-bold text-sm flex items-center gap-1.5 ${todo.priority === 'High' ? 'text-red-600' : 'text-slate-700'}`}>
                  <Calendar size={14} /> {formatDate(todo.dueDate)}
                </span>
              </div>
            )}

            {todo.payload && Object.keys(todo.payload).length > 0 && (
              <div className="mt-2 p-3 bg-slate-800 rounded-md border border-slate-700 shadow-inner overflow-x-auto">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2 border-b border-slate-700 pb-1">Payload Data</span>
                <pre className="text-[11px] text-emerald-400 leading-tight whitespace-pre-wrap font-mono">
                  {JSON.stringify(todo.payload, null, 2)}
                </pre>
              </div>
            )}

            {/* Extra Input (e.g. Tracking No) for Staff */}
            {!isManagerTab && todo.status === 'waiting_item' && (
              <div className="bg-indigo-50 p-3 rounded border border-indigo-200 mt-2">
                 <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1.5">ระบุเลขพัสดุ (Tracking No.)</label>
                 <input 
                    type="text" 
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    placeholder="กรอกเลขที่พัสดุ..."
                    className="w-full sm:w-1/2 text-sm px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
            {isManagerTab ? (
              <>
                <button 
                  onClick={() => handleAction(todo.id, 'approve', todo.type, todo.payload || todo)}
                  disabled={isProcessing}
                  className="flex-1 min-w-[120px] flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check size={16} strokeWidth={3} /> อนุมัติ (APPROVE)
                </button>
                <button 
                  onClick={handleRejectClick}
                  disabled={isProcessing}
                  className="flex-1 min-w-[120px] flex justify-center items-center gap-2 bg-white border border-slate-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 px-6 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  title="ปฏิเสธคำขอ"
                >
                  <X size={16} strokeWidth={3} /> ปฏิเสธ (REJECT)
                </button>
              </>
            ) : (
              <>
                {todo.status === 'todo' && (
                  <button 
                    onClick={() => handleAction(todo.id, 'start', todo.type)}
                    disabled={isProcessing}
                    className="flex-1 min-w-[120px] flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Play size={14} fill="currentColor" /> เริ่มงาน (START)
                  </button>
                )}
                
                {todo.status === 'in_progress' && (
                  <button 
                    onClick={() => handleAction(todo.id, 'complete', todo.type)}
                    disabled={isProcessing}
                    className="flex-1 min-w-[120px] flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check size={16} strokeWidth={3} /> เสร็จสิ้น (COMPLETE)
                  </button>
                )}

                {todo.status === 'waiting_item' && trackingNo.trim().length > 0 && (
                  <button 
                    onClick={handleMarkArrived}
                    disabled={isProcessing}
                    className="flex-1 min-w-[120px] flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check size={16} strokeWidth={3} /> รับสินค้าแล้ว (RECEIVED)
                  </button>
                )}
                
                <button 
                  onClick={handleRejectClick}
                  disabled={isProcessing}
                  className="flex-1 min-w-[120px] flex justify-center items-center gap-2 bg-white border border-slate-300 text-slate-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 px-4 py-2.5 rounded-md text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  <X size={16} strokeWidth={3} /> ยกเลิกงาน (CANCEL)
                </button>
              </>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
