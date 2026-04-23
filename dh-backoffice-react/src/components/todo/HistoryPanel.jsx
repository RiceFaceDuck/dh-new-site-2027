import React from 'react';
import { History, X, RotateCcw } from 'lucide-react';

export default function HistoryPanel({ showCompletedPanel, setShowCompletedPanel, loadingCompleted, completedTodos, handleRecallTodo }) {
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toMillis) return '-';
    const date = new Date(timestamp.toMillis());
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-dh-surface border-l border-dh-border shadow-2xl transform transition-transform duration-300 z-40 flex flex-col ${showCompletedPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-dh-border flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-dh-main flex items-center gap-2"><History size={18}/> งานที่จัดการแล้ว</h3>
          <button onClick={() => setShowCompletedPanel(false)} className="text-slate-400 hover:text-dh-main p-1"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loadingCompleted ? (
            <div className="text-center text-dh-muted text-sm py-10 animate-pulse">กำลังโหลดประวัติ...</div>
          ) : completedTodos.length === 0 ? (
            <div className="text-center text-dh-muted text-sm py-10">ไม่พบประวัติงานที่เสร็จแล้ว</div>
          ) : (
            completedTodos.map(todo => (
              <div key={todo.id} className="bg-white dark:bg-slate-900 border border-dh-border rounded-lg p-3 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-dh-main line-clamp-1">{todo.title}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${todo.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {todo.status === 'completed' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                  </span>
                </div>
                <p className="text-[11px] text-dh-muted mb-2">จัดการโดย: {todo.handledByName || 'System'}</p>
                <div className="flex justify-between items-center border-t border-dh-border pt-2 mt-2">
                  <span className="text-[10px] text-slate-400">{formatDate(todo.updatedAt)}</span>
                  <button onClick={() => handleRecallTodo(todo)} className="text-[11px] font-bold text-dh-accent hover:text-orange-600 flex items-center gap-1 transition-colors">
                    <RotateCcw size={12}/> ดึงกลับมาทำใหม่
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {showCompletedPanel && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setShowCompletedPanel(false)}></div>}
    </>
  );
}