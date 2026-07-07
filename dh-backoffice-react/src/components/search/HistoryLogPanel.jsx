import React, { useState } from 'react';
import { History, Maximize2, Clock, User, ChevronRight, CheckCircle2, AlertCircle, Edit3, Trash2, PlusCircle, MessageSquare, Send, Pin, PinOff } from 'lucide-react';

const getActionColor = (action) => {
  const act = action?.toLowerCase() || '';
  if (act.includes('note') || act.includes('comment')) return 'text-amber-600';
  if (act.includes('create') || act.includes('add')) return 'text-emerald-600';
  if (act.includes('update') || act.includes('edit')) return 'text-blue-600';
  if (act.includes('delete') || act.includes('remove')) return 'text-red-600';
  return 'text-slate-500';
};

const LogItem = ({ log, dateStr, timeStr, actionMethod, actor, isPinned, onTogglePin, onDeleteNote, isSimplified = false }) => {
  const [isExpanded, setIsExpanded] = useState(isPinned); 
  const isNote = actionMethod === 'note';
  const colorClass = getActionColor(actionMethod);

  // Parsing Details & Qty
  let qty = 0;
  let actionText = log.action || 'RECORD';
  
  let rawDetails = log.details;
  if (typeof rawDetails === 'string') {
    try {
      const parsed = JSON.parse(rawDetails);
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

  const qtyStr = qty > 0 ? `+${qty}` : (qty < 0 ? `${qty}` : '0');
  const qtyColor = qty > 0 ? 'text-emerald-600' : (qty < 0 ? 'text-red-600' : 'text-slate-400');

  let detailTextFull = typeof rawDetails === 'object' ? JSON.stringify(rawDetails, null, 2) : rawDetails;
  let detailTextShort = typeof rawDetails === 'object' ? JSON.stringify(rawDetails) : rawDetails;

  return (
    <div className={`group relative bg-white border ${isSimplified ? 'border-amber-400 shadow-xs' : 'border-slate-200'} rounded-lg mb-2 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer`}>
      
      {/* Top Line (Compact / Single Line View) */}
      <div 
        className="flex items-center gap-2 px-2.5 py-2 pr-8 overflow-hidden" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={`text-sm font-black shrink-0 font-mono w-6 text-center ${qtyColor}`}>
          {qtyStr}
        </span>
        
        <span className={`text-[13px] font-bold shrink-0 uppercase ${colorClass}`}>
          {actionText}
        </span>
        
        {!isExpanded && (
           <span className="text-slate-600 text-[13px] font-medium truncate flex-1 ml-1">
             {detailTextShort}
           </span>
        )}

        <span className={`text-slate-400 text-[11px] font-medium shrink-0 whitespace-nowrap ${!isExpanded ? 'ml-2' : 'ml-auto'}`}>
          {dateStr} {timeStr}
        </span>

        <span className="text-slate-500 text-xs font-bold shrink-0 truncate max-w-[100px] ml-2">
          {actor}
        </span>
      </div>
      
      {/* Expanded Details Section */}
      {isExpanded && (
        <div 
          className="text-slate-800 text-[13px] font-medium pb-3 px-3 leading-relaxed wrap-break-word whitespace-pre-wrap ml-1 border-t border-slate-100 pt-2 bg-slate-50/50 rounded-b-lg font-mono"
          onClick={() => setIsExpanded(false)}
        >
          {detailTextFull}
        </div>
      )}

      {/* Pin Button */}
      {isNote && onTogglePin && (
        <button 
          onClick={(e) => { e.stopPropagation(); onTogglePin(log); }}
          className={`absolute right-1.5 top-1.5 p-1 rounded-md transition-all z-20 ${isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-600 hover:bg-slate-100'}`}
          title={isPinned ? 'เลิกปักหมุด' : 'ปักหมุดบันทึกนี้'}
        >
          {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
      )}

      {/* Delete Button */}
      {isNote && onDeleteNote && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDeleteNote(log); }}
          className={`absolute right-8 top-1.5 p-1 rounded-md transition-all z-20 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50`}
          title="ลบโน๊ต"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export default function HistoryLogPanel({ 
  selectedProduct, setIsHistoryModalOpen, loadingHistory, historyLogs,
  newComment, setNewComment, handleAddComment, isSubmittingComment, handleAddNoteSuccess, handleTogglePinComment, handleDeleteNote
}) {
  const pinnedComments = selectedProduct?.pinnedComments || [];
  const deletedNotes = selectedProduct?.deletedNotes || [];
  
  // กรองประวัติที่ถูกผู้ใช้กด "ลบ" (ซ่อน) ออกไป
  const displayLogs = historyLogs.filter(log => !deletedNotes.includes(log.id));

  return (
    <div className="w-[20%] min-w-[280px] max-w-[380px] bg-[#F8FAFC] flex flex-col overflow-hidden shrink-0 transition-colors duration-300 border-l border-slate-200 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
      
      {/* --- Header --- */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
            <History size={16} strokeWidth={2.5}/>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">ประวัติการทำงาน</h3>
            <p className="text-xs font-bold text-slate-400">Activity Timeline</p>
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
            <div className="text-xs font-bold text-center text-slate-400 mb-3 pb-3 border-b border-slate-200 uppercase tracking-widest shrink-0">
              รหัสอ้างอิง: <span className="text-indigo-600">{selectedProduct.sku}</span>
            </div>

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
                          let d = typeof log.timestamp.toDate === 'function' ? log.timestamp.toDate() : (log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000) : new Date());
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
                {[...displayLogs]
                  .filter(log => !pinnedComments.some(c => c.id === log.id))
                  .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                  .map((log) => {
                  let dateStr = '-';
                  let timeStr = '-';
                  if (log.timestamp) {
                    let d = typeof log.timestamp.toDate === 'function' ? log.timestamp.toDate() : (log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000) : new Date());
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
                <div className="text-center mt-4">
                  <span className="inline-block px-4 py-1.5 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-400 rounded-full uppercase tracking-wider">
                    สิ้นสุดประวัติ
                  </span>
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