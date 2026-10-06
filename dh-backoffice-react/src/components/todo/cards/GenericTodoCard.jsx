import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Check, X, Play, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';

export default function GenericTodoCard({ todo, isProcessing, isManagerTab, urgencyLevel, handleAction, getStatusBadge, formatDate, handleRejectClick, getIconForType }) {
  const navigate = useNavigate();
  const [trackingNo, setTrackingNo] = useState(todo.payload?.trackingNo || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // 🔍 Helper to parse structured data for clean 2-column display
  const getParsedDetails = () => {
    const p = todo.payload || {};
    let bill = p.orderId || p.referenceId || todo.referenceId || '';
    let symptom = p.symptomCode || p.returnReason || p.symptomDetails || '';
    let action = p.actionType || '';
    
    if (!bill && todo.description) {
      const m = todo.description.match(/บิลอ้างอิง:\s*([^\s\n,]+)/);
      if (m) bill = m[1];
    }
    if (!symptom && todo.description) {
      const m = todo.description.match(/(อาการเสีย|เหตุผลการคืน|อาการ\/เหตุผล):\s*([^\n,]+)/);
      if (m) symptom = m[2]?.trim();
    }
    if (!action && todo.description) {
      const m = todo.description.match(/การกระทำ:\s*([^\n,]+)/);
      if (m) action = m[1]?.trim();
    }
    
    return {
      bill: bill || '-',
      symptom: symptom || 'สาเหตุอื่นๆ',
      action: action || (todo.type?.includes('RETURN') ? 'คืนเงิน/คืนสินค้า' : 'เปลี่ยนสินค้าตัวใหม่ (EXC)')
    };
  };

  const getElapsedInfo = () => {
    const p = todo.payload || {};
    if (p.purchaseDate) {
      const pDate = new Date(p.purchaseDate);
      if (!isNaN(pDate)) {
        const diffTime = new Date() - pDate;
        const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        return `ซื้อมา ${days} วัน`;
      }
    }
    if (todo.customerName && todo.customerName !== 'ลูกค้าทั่วไป') {
      return `ลูกค้า: ${todo.customerName}`;
    }
    return null;
  };

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

  const getCardBorderStyle = (level) => {
    const isUrgent = todo.priority === 'High' || level === 'high' || todo.type === 'REFUND_MANUAL' || (todo.type && todo.type.includes('CLAIM'));
    const isApproval = todo.status === 'pending_manager' || todo.status === 'pending' || isManagerTab;
    const isInProgress = todo.status === 'in_progress';

    if (isUrgent) {
      return 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40 border border-rose-200/80 shadow-sm hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5';
    }
    if (isApproval) {
      return 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/80 shadow-sm hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5';
    }
    if (isInProgress) {
      return 'bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border border-blue-200/80 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5';
    }
    return 'bg-gradient-to-br from-slate-50/80 via-white to-slate-100/50 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5';
  };

  // 💎 1. Modern Manager Card Layout (ตรงตามดีไซน์ Mockup 100%)
  if (isManagerTab) {
    const parsed = getParsedDetails();
    const elapsedText = getElapsedInfo();

    return (
      <div 
        className={`rounded-2xl transition-all duration-200 overflow-hidden relative flex flex-col h-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-md border-l-[5px] border-l-amber-500 ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}
      >
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-20 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        <div className="p-4 flex flex-col gap-2.5">
          {/* Top Meta Bar: ID + Status + Urgent Pill */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-600 shadow-2xs">
              #{todo.id?.slice(-6).toUpperCase()}
            </span>
            {getStatusBadge(todo.status)}
            {(todo.priority === 'High' || urgencyLevel === 'high') && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                🔥 ด่วนมาก
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[14px] font-bold text-slate-900 dark:text-white leading-snug break-words tracking-tight mt-0.5">
            {todo.title || 'งานอนุมัติทั่วไป'}
          </h3>

          {/* Timestamp & Elapsed Chip */}
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-full font-medium w-fit">
            <span>{formatDate(todo.createdAt || todo.requestedAt)}</span>
            {elapsedText && <span>• {elapsedText}</span>}
          </div>

          {/* Structured Data Box (2 Columns) */}
          <div className="bg-slate-50/90 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-[12px] flex flex-col gap-1.5 mt-1">
            <div className="grid grid-cols-[68px_1fr] items-baseline gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">บิลอ้างอิง:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{parsed.bill}</span>
            </div>
            <div className="grid grid-cols-[68px_1fr] items-baseline gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">อาการ:</span>
              <span className="text-slate-800 dark:text-slate-200 truncate" title={parsed.symptom}>{parsed.symptom}</span>
            </div>
            <div className="grid grid-cols-[68px_1fr] items-baseline gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">การกระทำ:</span>
              <span className="text-slate-800 dark:text-slate-200">{parsed.action}</span>
            </div>

            {/* ดูรายละเอียดเพิ่มเติม link */}
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
            >
              <span>{isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียดเพิ่มเติม'}</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>

            {isExpanded && (
              <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800 flex flex-col gap-1.5 animate-in fade-in">
                {todo.description && <p className="whitespace-pre-wrap leading-relaxed">{todo.description}</p>}
                {todo.customerName && <p className="text-slate-700 dark:text-slate-300"><strong>ลูกค้า:</strong> {todo.customerName}</p>}
              </div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
            {todo.type === 'WARRANTY_SETUP' ? (
              <button 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  navigate(todo.targetUrl || '/managers/warranty'); 
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={14} /> ไปหน้าตั้งค่าระยะเวลารับประกัน <ExternalLink size={12} />
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'approve', todo.type, todo.payload || todo); }}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check size={16} strokeWidth={2.5} /> อนุมัติ
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRejectClick(); }}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100/80 active:bg-rose-200/70 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 font-bold border border-rose-200/80 dark:border-rose-900/50 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                >
                  <X size={15} strokeWidth={2.5} /> ปฏิเสธ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-2xl transition-all duration-200 overflow-hidden relative flex flex-col h-full ${getCardBorderStyle(urgencyLevel)} ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}
    >
      
      {/* Manager Badge indicator */}
      {isManagerTab && (
        <div className="absolute top-0 right-0 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-xl shadow-xs z-10 uppercase tracking-wider">
          Manager
        </div>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        
        {/* Top Meta Bar: ID + Status + Urgent Pill */}
        <div className="flex flex-wrap items-center gap-2 pr-14">
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
            #{todo.id?.slice(-6).toUpperCase()}
          </span>
          {getStatusBadge(todo.status)}
          {todo.priority === 'High' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md">
              <AlertTriangle size={10} className="text-rose-600 animate-pulse" /> ด่วนมาก
            </span>
          )}
        </div>

        {/* Content Header: Icon + Title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200/80 flex items-center justify-center shadow-xs">
            {getIconForType(todo.type)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 leading-snug break-words">
              {todo.title || 'งานอนุมัติทั่วไป'}
            </h3>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
              {todo.customerName && (
                <span className="font-medium text-slate-700">
                  ลูกค้า: <strong className="text-slate-900">{todo.customerName}</strong>
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock size={11} className="text-slate-400" /> {formatDate(todo.createdAt || todo.requestedAt)}
              </span>
              {todo.dueDate && (
                <span className={`flex items-center gap-1 text-[11px] ${todo.priority === 'High' ? 'text-rose-600 font-bold' : 'text-amber-600 font-medium'}`}>
                  <Calendar size={11} /> หมดเขต: {formatDate(todo.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description & Expandable Details */}
        {todo.description && (
          <div className="mt-1">
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 hover:bg-slate-100/80 cursor-pointer transition-colors leading-relaxed"
            >
              <p className={!isExpanded ? 'line-clamp-2' : 'whitespace-pre-wrap'}>
                "{todo.description}"
              </p>
              
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                <span>{isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียดเพิ่มเติม'}</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {isExpanded && todo.payload && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRawJson(!showRawJson);
                  }}
                  className="w-fit text-[10px] font-mono text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  ⚙️ {showRawJson ? 'ซ่อน Raw JSON ระบบ' : 'แสดง Raw JSON ระบบ (ทีมเทคนิค)'}
                </button>

                {showRawJson && (
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-inner animate-in fade-in duration-200">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(todo.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Extra Input (e.g. Tracking No) */}
        {todo.status === 'waiting_item' && (
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <input 
              type="text" 
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="กรอกเลขที่พัสดุ (Tracking)"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          {todo.type === 'WARRANTY_SETUP' ? (
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                navigate(todo.targetUrl || '/managers/warranty'); 
              }}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={14} /> ไปหน้าตั้งค่าระยะเวลารับประกัน <ExternalLink size={12} />
            </button>
          ) : isManagerTab ? (
            <>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'approve', todo.type, todo.payload || todo); }}
                disabled={isProcessing}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check size={14} strokeWidth={3} /> อนุมัติ
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRejectClick(); }}
                disabled={isProcessing}
                className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200/80 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
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
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Play size={12} fill="currentColor" /> เริ่มงาน
                </button>
              )}
              
              {todo.status === 'in_progress' && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAction(todo.id, 'complete', todo.type); }}
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check size={14} strokeWidth={3} /> เสร็จสิ้น
                </button>
              )}

              {todo.status === 'waiting_item' && trackingNo.trim().length > 0 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleMarkArrived(); }}
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Check size={12} strokeWidth={3} /> รับสินค้าแล้ว
                </button>
              )}
              
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRejectClick(); }}
                disabled={isProcessing}
                className="py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold border border-slate-200/80 hover:border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1 text-xs disabled:opacity-50 cursor-pointer"
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

