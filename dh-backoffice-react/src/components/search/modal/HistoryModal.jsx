import React from 'react';
import { History, X, RefreshCw, Clock } from 'lucide-react';

export default function HistoryModal({ isHistoryModalOpen, setIsHistoryModalOpen, loadingHistory, historyLogs }) {
  if (!isHistoryModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-dh-surface rounded-xl shadow-dh-elevated w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
        <div className="bg-dh-surface px-5 py-3 border-b border-dh-border flex justify-between items-center z-10">
          <h3 className="font-bold text-dh-main flex items-center gap-2 text-sm">
            <History size={16} className="text-dh-muted"/>
            ประวัติความเคลื่อนไหว (History Log)
          </h3>
          <button onClick={() => setIsHistoryModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1 rounded-md hover:bg-dh-base transition-colors">
            <X size={16}/>
          </button>
        </div>
        <div className="flex-1 p-5 overflow-y-auto bg-dh-base custom-scrollbar relative">
            {loadingHistory ? (
              <div className="flex justify-center items-center h-full"><RefreshCw className="animate-spin text-dh-muted" size={20}/></div>
            ) : historyLogs.length > 0 ? (
              <div className="max-w-3xl mx-auto relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-dh-border">
                {historyLogs.map((log) => (
                  <div key={log.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group mb-4 last:mb-0">
                    {/* Timeline Icon */}
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-dh-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${
                      log.action === 'Create' ? 'bg-emerald-500' : 
                      log.action === 'Update' ? 'bg-blue-500' : 
                      log.action === 'Approve' ? 'bg-teal-500' : 'bg-slate-400'
                    }`}>
                        <span className="text-white font-bold text-[10px]">{log.action.substring(0, 1)}</span>
                    </div>
                    {/* Timeline Content */}
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg bg-dh-surface border border-dh-border shadow-sm hover:border-dh-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold text-dh-muted bg-dh-base px-1.5 py-0.5 rounded border border-dh-border uppercase tracking-wide">{log.module} / {log.action}</span>
                        <span className="text-[9px] font-medium text-dh-muted flex items-center gap-1">
                          <Clock size={10}/> {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-dh-main mt-1 leading-relaxed">{log.details}</p>
                      <div className="mt-1.5 pt-1.5 border-t border-dh-border text-[10px] text-dh-muted flex items-center gap-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-dh-base flex items-center justify-center font-bold text-dh-accent border border-dh-border">{log.actorName?.substring(0,1) || log.performedBy?.substring(0,1) || 'U'}</div>
                        <span>{log.actorName || log.performedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full opacity-50">
                <History size={24} className="text-dh-muted mb-2" />
                <p className="text-xs font-semibold text-dh-muted">ไม่มีประวัติการเคลื่อนไหว</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
