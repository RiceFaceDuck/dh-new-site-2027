import React, { useState } from 'react';
import { Clock, Calendar, Check, X, Play } from 'lucide-react';
import ManagerBadge from './ManagerBadge';

export default function GenericTodoCard({ todo, isProcessing, isManagerTab, urgencyLevel, handleAction, getStatusBadge, formatDate, handleRejectClick, getIconForType }) {
  const [trackingNo, setTrackingNo] = useState(todo.payload?.trackingNo || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMarkArrived = () => {
    if (!trackingNo.trim()) {
      alert('กรุณากรอกเลขที่ขนส่งก่อนทำรายการ');
      return;
    }
    const confirmed = window.confirm('⚠️ หากกด "ได้รับสินค้าแล้ว" จะเปลี่ยนเป็นสถานะ "กำลังตรวจ" แล้วไม่สามารถแก้ไขอะไรได้ คุณตรวจสอบสภาพสินค้าเรียบร้อยดีแล้วใช่หรือไม่ การยืนยันจะส่งผลกับกระบวนการทำงาน');
    if (confirmed) {
      handleAction(todo.id, 'markArrived', todo.type, { trackingNo: trackingNo.trim() });
    }
  };

  const getUrgencyStyles = (level) => {
    switch (level) {
      case 'high': 
        return 'border-l-4 border-l-red-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 hover:border-red-400 bg-red-50/30';
      case 'medium': 
        return 'border-l-4 border-l-orange-500 border-t-gray-200 border-r-gray-200 border-b-gray-200 hover:border-orange-400 bg-orange-50/30';
      default: 
        return 'border-2 border-gray-200 hover:border-slate-400 bg-white';
    }
  };

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`rounded-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] transition-all overflow-hidden relative mb-4 cursor-pointer transform hover:-translate-y-0.5 ${getUrgencyStyles(urgencyLevel)} ${isProcessing ? 'opacity-75 pointer-events-none' : ''}`}
    >
      
      {isManagerTab && <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 shadow-sm">Manager</div>}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-dh-main border-t-transparent rounded-full"></div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center p-3 sm:p-4 gap-4">
        
        {/* 1. Icon Box */}
        <div className="w-16 h-16 shrink-0 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
          {getIconForType(todo.type)}
        </div>

        {/* 2. Task Info */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
             <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">#{todo.id?.slice(-6).toUpperCase()}</span>
             {getStatusBadge(todo.status)}
             {todo.priority === 'High' && (
                <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded shadow-sm animate-pulse">🔥 ด่วนมาก</span>
             )}
          </div>
          
          <h3 className="text-sm font-black text-slate-900 truncate mb-1 leading-tight">{todo.title || 'งานทั่วไป'}</h3>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
             {todo.customerName && <span>ลูกค้า: <strong className="text-slate-800">{todo.customerName}</strong></span>}
             <span className="flex items-center gap-1 text-slate-500"><Clock size={12} className="opacity-70" /> {formatDate(todo.createdAt || todo.requestedAt)}</span>
             {todo.dueDate && <span className={`flex items-center gap-1 ${todo.priority === 'High' ? 'text-red-600 font-bold' : 'text-orange-600 font-medium'}`}><Calendar size={12} className="opacity-70" /> หมดเขต: {formatDate(todo.dueDate)}</span>}
          </div>
          
          {todo.description && (
             <div className="mt-2">
                 <p 
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setIsExpanded(prev => !prev);
                   }}
                   className={`text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 shadow-sm leading-tight border-l-2 border-l-slate-300 cursor-pointer hover:bg-slate-100 hover:border-blue-200 ${!isExpanded ? 'line-clamp-1' : 'whitespace-pre-wrap'}`}
                   title="คลิกเพื่อขยาย/ย่อ"
                 >
                   "{todo.description}"
                 </p>
                 
                 {isExpanded && (
                   <div className="mt-2 animate-in fade-in slide-in-from-top-1 bg-blue-50/50 p-2.5 rounded border border-blue-100 text-xs text-slate-700">
                     <p className="font-bold mb-1 border-b border-blue-100 pb-1">รายละเอียดและข้อมูลแนบ:</p>
                     
                     {/* Safely render payload JSON */}
                     {todo.payload && (
                        <div className="mt-1.5 p-2 bg-white rounded border border-slate-200 overflow-x-auto">
                           <pre className="text-[9px] text-slate-500 leading-tight whitespace-pre-wrap font-mono">
                              {JSON.stringify(todo.payload, null, 2)}
                           </pre>
                        </div>
                     )}

                     <button 
                       type="button"
                       onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(false); }} 
                       className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-2 p-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                     >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                       ซ่อนรายละเอียด
                     </button>
                   </div>
                 )}

                 {!isExpanded && (
                     <button 
                        type="button" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(true); }} 
                        className="text-[10px] text-blue-500 hover:text-blue-700 mt-1 font-semibold flex items-center gap-1"
                     >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        ดูรายละเอียดเพิ่มเติม
                     </button>
                 )}
             </div>
          )}
        </div>

        {/* 3. Extra Input (e.g. Tracking No) */}
        {todo.status === 'waiting_item' && (
          <div className="w-full sm:w-48 shrink-0 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
             <input 
                type="text" 
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                placeholder="กรอกเลขที่พัสดุ (Tracking)"
                className="w-full text-xs px-2.5 py-1.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 shadow-inner"
              />
          </div>
        )}

        {/* 4. Actions */}
        <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-32 sm:pl-3 sm:border-l-2 border-slate-100 justify-center">
          {isManagerTab ? (
            <>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'approve', todo.type, todo.payload || todo); }}
                disabled={isProcessing}
                className="flex-1 sm:w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Check size={14} strokeWidth={3} /> อนุมัติ
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRejectClick(); }}
                disabled={isProcessing}
                className="flex-1 sm:w-full py-1.5 bg-white border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 font-bold rounded-lg transition-colors flex items-center justify-center text-[10px] disabled:opacity-50"
              >
                <X size={14} strokeWidth={2.5} /> ปฏิเสธ
              </button>
            </>
          ) : (
            <>
              {todo.status === 'todo' && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'start', todo.type); }}
                  disabled={isProcessing}
                  className="flex-1 sm:w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Play size={12} fill="currentColor" /> เริ่มงาน
                </button>
              )}
              
              {todo.status === 'in_progress' && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'complete', todo.type); }}
                  disabled={isProcessing}
                  className="flex-1 sm:w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} strokeWidth={3} /> เสร็จสิ้น
                </button>
              )}

              {todo.status === 'waiting_item' && trackingNo.trim().length > 0 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleMarkArrived(); }}
                  disabled={isProcessing}
                  className="flex-1 sm:w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow hover:shadow-md transition-all text-[10px] flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Check size={12} strokeWidth={3} /> รับสินค้าแล้ว
                </button>
              )}
              
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRejectClick(); }}
                disabled={isProcessing}
                className="flex-1 sm:w-full py-1.5 bg-white border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold rounded-lg transition-colors flex items-center justify-center text-[10px] disabled:opacity-50"
              >
                <X size={12} strokeWidth={2.5} /> ยกเลิกงาน
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
