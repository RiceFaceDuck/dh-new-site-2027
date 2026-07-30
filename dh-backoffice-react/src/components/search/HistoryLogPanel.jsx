import { useState, useEffect } from 'react';
import { History, Maximize2, Trash2, Send, Pin, PinOff } from 'lucide-react';

import { safeJsonParse } from 'dh-shared';
const getActionColor = (action) => {
  const act = action?.toLowerCase() || '';
  if (act.includes('note') || act.includes('comment')) return 'text-amber-600';
  if (act.includes('create') || act.includes('add')) return 'text-emerald-600';
  if (act.includes('update') || act.includes('edit')) return 'text-blue-600';
  if (act.includes('delete') || act.includes('remove')) return 'text-red-600';
  return 'text-slate-500';
};

const formatDetailText = (rawDetails, actionText) => {
  if (!rawDetails) return '';
  
  let target = rawDetails;
  if (typeof target === 'string') {
    const trimmed = target.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = safeJsonParse(target);
        if (parsed && typeof parsed === 'object') {
          target = parsed;
        }
      } catch (e) {}
    } else {
      return target;
    }
  }

  if (typeof target === 'object' && target !== null) {
    if (target.note || target.text || target.comment || target.description) {
      return target.note || target.text || target.comment || target.description;
    }
    if (target.reference) {
      return `ออเดอร์ #${target.reference}`;
    }
    if (target.legacy_details && typeof target.legacy_details === 'string') {
      const leg = target.legacy_details;
      const match = leg.match(/DH-[A-Za-z0-9-]+/);
      if (match) return `ออเดอร์ #${match[0]}`;
      const cleaned = leg.replace(/\[.*?\]\s*/g, '').replace(/ลดสต๊อก\s*\d+\s*ชิ้น/g, '').replace(/ขายออกบิล\s*/g, 'ออเดอร์ #').trim();
      return cleaned || leg;
    }
    if (target.changes && typeof target.changes === 'object') {
      const changeKeys = Object.keys(target.changes);
      if (changeKeys.length > 0) return `แก้ไข: ${changeKeys.join(', ')}`;
    }
  }

  return String(target);
};

const LogItem = ({ log, dateStr, timeStr, actionMethod, actor, isPinned, onTogglePin, onDeleteNote, isSimplified = false }) => {
  const [isExpanded, setIsExpanded] = useState(isPinned); 
  const isNote = actionMethod === 'note';
  const colorClass = getActionColor(actionMethod);

  // Parsing Details & Qty
  let qty = 0;
  let actionText = log.action || 'RECORD';
  
  let rawDetails = log.details;
  if (typeof rawDetails === 'string' && (rawDetails.trim().startsWith('{') || rawDetails.trim().startsWith('['))) {
    try {
      const parsed = safeJsonParse(rawDetails);
      if (typeof parsed === 'object' && parsed !== null) {
        rawDetails = parsed;
      }
    } catch(e) {}
  }
  
  if (typeof rawDetails === 'object' && rawDetails !== null) {
     if (rawDetails.qtyChange !== undefined) qty = rawDetails.qtyChange;
     else if (rawDetails.changes?.stockQuantity) {
       qty = (rawDetails.changes.stockQuantity.new || 0) - (rawDetails.changes.stockQuantity.old || 0);
     }
  }

  // Translation / Formatting Action
  const actLower = actionMethod?.toLowerCase() || '';
  if (actLower.includes('updateproduct')) actionText = 'แก้ไขสเปค';
  else if (actLower.includes('update')) actionText = 'แก้ไข';
  else if (actLower.includes('create') || actLower.includes('add')) actionText = 'สร้าง/เพิ่ม';
  else if (actLower.includes('delete') || actLower.includes('remove')) actionText = 'ลบทิ้ง';
  else if (actLower.includes('note') || actLower.includes('comment')) actionText = 'บันทึก';
  else if (actLower.includes('sale') || actLower.includes('sell') || actLower.includes('order')) actionText = 'ขายออก';
  else if (actLower.includes('claim')) actionText = 'เคลม';

  const qtyStr = qty !== 0 ? (qty > 0 ? `+${qty}` : `${qty}`) : '';
  const qtyBadgeColor = qty > 0 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
    : (qty < 0 ? 'bg-red-100 text-red-800 border-red-300' : 'bg-slate-100 text-slate-600 border-slate-300');

  const formattedDetails = formatDetailText(rawDetails, actionText);

  return (
    <div className={`group relative bg-white border-b border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer ${isPinned ? 'bg-amber-50/70 border-l-4 border-l-amber-400' : ''}`}>
      
      <div 
        className="px-2.5 py-1.5 flex items-center justify-between gap-1.5 min-h-[36px]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left Side: Action Badge + Qty + Detail */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${colorClass} bg-slate-50 border-slate-200`}>
            {actionText}
          </span>

          {qtyStr && (
            <span className={`text-[11px] font-black font-mono px-1 py-0.5 rounded border shrink-0 ${qtyBadgeColor}`}>
              {qtyStr}
            </span>
          )}

          {formattedDetails && (
            <span className="text-slate-800 text-[12px] font-semibold truncate flex-1">
              {formattedDetails}
            </span>
          )}
        </div>

        {/* Right Side: Actor + Timestamp */}
        <div className="flex items-center gap-1.5 shrink-0 text-[11px] pl-1">
          <span className="text-slate-700 font-bold truncate max-w-[90px]" title={actor}>
            {actor}
          </span>
          <span className="text-slate-400 font-mono text-[10px] whitespace-nowrap">
            {dateStr} {timeStr}
          </span>
        </div>
      </div>

      {/* Expanded details view if clicked */}
      {isExpanded && formattedDetails && (
        <div className="px-3 py-2 text-xs text-slate-700 bg-slate-100/90 border-t border-slate-200 wrap-break-word font-mono leading-relaxed">
          {typeof rawDetails === 'object' ? JSON.stringify(rawDetails, null, 2) : rawDetails}
        </div>
      )}

      {/* Pin / Delete Actions */}
      <div className="absolute right-1 top-1.5 hidden group-hover:flex items-center gap-1 bg-white/95 px-1 py-0.5 rounded border border-slate-200 shadow-xs z-10">
        {isNote && onTogglePin && (
          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePin(log); }}
            className={`p-1 rounded hover:bg-slate-100 ${isPinned ? 'text-amber-600' : 'text-slate-400'}`}
            title={isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
          >
            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
        )}
        {isNote && onDeleteNote && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteNote(log); }}
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
            title="ลบ"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default function HistoryLogPanel({ 
  selectedProduct, setIsHistoryModalOpen, loadingHistory, historyLogs,
  newComment, setNewComment, handleAddComment, isSubmittingComment, handleAddNoteSuccess, handleTogglePinComment, handleDeleteNote
}) {
  const [visibleLimit, setVisibleLimit] = useState(21);
  const pinnedComments = selectedProduct?.pinnedComments || [];
  const deletedNotes = selectedProduct?.deletedNotes || [];
  
  useEffect(() => {
    setVisibleLimit(21);
  }, [selectedProduct?.sku]);

  // กรองประวัติที่ถูกผู้ใช้กด "ลบ" (ซ่อน) ออกไป
  const displayLogs = historyLogs.filter(log => !deletedNotes.includes(log.id));
  const mainLogs = [...displayLogs]
    .filter(log => !pinnedComments.some(c => c.id === log.id))
    .sort((a, b) => {
      const getTime = (t) => {
        if (!t) return 0;
        if (typeof t.toMillis === 'function') return t.toMillis();
        if (t.seconds) return t.seconds * 1000;
        if (typeof t === 'string' || typeof t === 'number') return new Date(t).getTime();
        return 0;
      };
      return getTime(b.timestamp) - getTime(a.timestamp);
    });

  const visibleLogs = mainLogs.slice(0, visibleLimit);
  const hasMoreLogs = mainLogs.length > visibleLimit;

  return (
    <div className="w-[20%] min-w-[280px] max-w-[380px] bg-[#F8FAFC] flex flex-col overflow-hidden shrink-0 transition-colors duration-300 border-l border-slate-200 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
      
      {/* --- Header --- */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
            <History size={16} strokeWidth={2.5}/>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              ประวัติ อ้างอิง: <span className="text-indigo-600">{selectedProduct?.sku || '-'}</span>
            </h3>
            <p className="text-xs font-bold text-slate-400">รายการความเคลื่อนไหว Activity Timeline</p>
          </div>
        </div>
        <button 
          onClick={() => setIsHistoryModalOpen(true)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors active:scale-95"
          title="ขยายประวัติแบบเต็มจอ"
        >
          <Maximize2 size={16} strokeWidth={2}/>
        </button>
      </div>
      
      {/* --- Panel Content --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative px-3 py-3">
        {selectedProduct ? (
          <div className="flex flex-col h-full">

            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                <span className="text-xs font-bold text-slate-500">กำลังโหลดประวัติ...</span>
              </div>
            ) : historyLogs.length > 0 ? (
              <div className="flex flex-col pb-4">
                
                {/* --- Pinned Comments Section --- */}
                {pinnedComments.length > 0 && (
                  <div className="mb-4 pb-2 border-b-2 border-dashed border-slate-200">
                    <div className="flex items-center gap-2 mb-2 px-1 text-amber-500">
                      <Pin size={14} className="fill-amber-100" />
                      <span className="text-xs font-black uppercase tracking-widest">รายการที่ปักหมุด ({pinnedComments.length}/1)</span>
                    </div>
                    <div className="flex flex-col">
                      {pinnedComments.map((log) => {
                        let dateStr = '-';
                        let timeStr = '-';
                        if (log.timestamp) {
                          let d = typeof log.timestamp.toDate === 'function' 
                            ? log.timestamp.toDate() 
                            : (log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp));
                          dateStr = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
                          timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                        }
                        const actor = log.actorName || log.performedBy || 'System';
                        return (
                          <LogItem 
                            key={log.id} log={log} dateStr={dateStr} timeStr={timeStr} actionMethod="note" actor={actor} isPinned={true} onTogglePin={handleTogglePinComment} isSimplified={true}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* --- Main Timeline --- */}
                {visibleLogs.map((log) => {
                  let dateStr = '-';
                  let timeStr = '-';
                  if (log.timestamp) {
                    let d = typeof log.timestamp.toDate === 'function' 
                      ? log.timestamp.toDate() 
                      : (log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp));
                    dateStr = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
                    timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                  }
                  const actionMethod = log.action ? log.action.toLowerCase() : 'record';
                  const actor = log.actorName || log.performedBy || 'System';
                  return (
                    <LogItem 
                      key={log.id} log={log} dateStr={dateStr} timeStr={timeStr} actionMethod={actionMethod} actor={actor} isPinned={pinnedComments.some(c => c.id === log.id)} onTogglePin={actionMethod === 'note' ? handleTogglePinComment : undefined} onDeleteNote={handleDeleteNote}
                    />
                  );
                })}

                <div className="text-center mt-3 mb-2">
                  {hasMoreLogs ? (
                    <button
                      onClick={() => setVisibleLimit(prev => prev + 21)}
                      className="w-full py-2 px-3 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-indigo-600 text-xs font-bold rounded-lg transition-all shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <span>แสดงเพิ่มเติม (+21)</span>
                      <span className="text-[10px] text-slate-400 font-medium">({mainLogs.length - visibleLimit} เหลือ)</span>
                    </button>
                  ) : (
                    <span className="inline-block px-4 py-1 bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full uppercase tracking-wider">
                      สิ้นสุดประวัติ
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center opacity-60">
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-3 text-slate-400">
                  <History size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-600 mb-1">ยังไม่มีประวัติการทำงาน</h4>
              </div>
            )}
            
            {/* Note Input Box */}
            <div className="mt-auto shrink-0 pt-3 border-t border-slate-200 bg-[#F8FAFC]">
              <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-300 shadow-xs focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="พิมพ์โน้ตส่วนตัว (Enter)"
                  className="w-full text-sm font-medium text-slate-800 bg-transparent border-none outline-hidden placeholder-slate-400 ml-1"
                  disabled={isSubmittingComment}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(handleAddNoteSuccess); }
                  }}
                />
                <button
                  onClick={() => handleAddComment(handleAddNoteSuccess)}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors flex items-center justify-center shadow-xs"
                  title="บันทึกข้อความ"
                >
                  {isSubmittingComment ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={14} className="ml-px" />}
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-4">
            <div className="w-16 h-16 bg-white border border-slate-200 shadow-xs rounded-2xl flex items-center justify-center mb-4 text-slate-400 transform -rotate-6">
              <History size={32} />
            </div>
            <h4 className="text-sm font-black text-slate-600 mb-1">เลือกรายการสินค้า</h4>
            <p className="text-xs text-slate-500">คลิกที่สินค้าเพื่อดูประวัติย้อนหลัง</p>
          </div>
        )}
      </div>
    </div>
  );
}