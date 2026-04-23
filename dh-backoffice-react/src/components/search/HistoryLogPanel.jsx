import React from 'react';
import { History, Maximize2, RefreshCw, Clock, Activity } from 'lucide-react';

export default function HistoryLogPanel({ selectedProduct, setIsHistoryModalOpen, loadingHistory, historyLogs }) {
  return (
    <div className="w-[20%] min-w-[220px] max-w-[280px] bg-dh-surface rounded-2xl border border-dh-border shadow-dh-card flex flex-col overflow-hidden shrink-0 transition-colors duration-300">
      
      {/* --- Panel Header --- */}
      <div className="px-4 py-2.5 border-b border-dh-border bg-dh-base/50 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-bold text-dh-muted uppercase tracking-widest flex items-center gap-1.5">
          <History size={12} className="text-dh-muted"/> History Log
        </span>
        <button 
          onClick={() => setIsHistoryModalOpen(true)}
          className="p-1 text-dh-muted hover:text-dh-main hover:bg-dh-border/50 rounded-md transition-colors active:scale-95"
          title="ขยายประวัติแบบเต็มจอ"
        >
          <Maximize2 size={12} strokeWidth={2}/>
        </button>
      </div>
      
      {/* --- Panel Content --- */}
      <div className="flex-1 p-3 bg-dh-base overflow-y-auto custom-scrollbar relative">
        {selectedProduct ? (
          <>
            {/* Target SKU Badge - Compact */}
            <div className="flex items-center justify-center gap-1.5 mb-3 bg-dh-surface p-1.5 rounded-lg border border-dh-border shadow-sm">
              <span className="text-[8px] font-bold text-dh-muted bg-dh-base border border-dh-border px-1.5 py-0.5 rounded uppercase">Target</span>
              <span className="text-[11px] font-bold text-dh-main truncate">{selectedProduct.sku}</span>
            </div>
            
            {loadingHistory ? (
              <div className="flex justify-center items-center py-10">
                <RefreshCw className="animate-spin text-dh-muted" size={18}/>
              </div>
            ) : historyLogs.length > 0 ? (
              <div className="space-y-2">
                {historyLogs.map(log => (
                  <div key={log.id} className="group p-2.5 bg-dh-surface border border-dh-border rounded-xl shadow-sm hover:border-dh-border/80 hover:shadow-dh-card transition-all duration-200 relative overflow-hidden">
                    
                    {/* Color Indicator Strip (Subtle) */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      log.action === 'Create' ? 'bg-emerald-400' : 
                      log.action === 'Update' ? 'bg-blue-400' : 
                      log.action === 'Approve' ? 'bg-teal-400' : 'bg-slate-300'
                    } opacity-50 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="pl-1.5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[8px] font-bold text-dh-muted bg-dh-base px-1.5 py-0.5 rounded uppercase border border-dh-border">
                          {log.module}
                        </span>
                        <span className="text-[8px] font-medium text-dh-muted flex items-center gap-0.5">
                          <Clock size={8}/> {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleDateString('th-TH') : '-'}
                        </span>
                      </div>
                      
                      <p className="text-[10px] font-semibold text-dh-main leading-relaxed mb-2 line-clamp-3">
                        {log.details}
                      </p>
                      
                      {/* Actor Info - Minimal */}
                      <div className="mt-auto pt-1.5 border-t border-dh-border/50 flex items-center gap-1">
                        <div className="w-[14px] h-[14px] rounded-full bg-dh-base border border-dh-border flex items-center justify-center text-[7px] font-bold text-dh-muted">
                          {log.actorName?.substring(0, 1) || log.performedBy?.substring(0, 1) || '?'}
                        </div>
                        <span className="text-[9px] font-medium text-dh-muted truncate">
                          {log.actorName || log.performedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty History State */
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <Activity size={20} className="text-dh-muted mb-2" />
                <p className="text-[10px] font-bold text-dh-muted">ไม่มีประวัติการเคลื่อนไหว</p>
              </div>
            )}
          </>
        ) : (
          /* Waiting for Selection State */
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <History size={24} className="text-dh-muted mb-2" strokeWidth={1.5} />
            <p className="text-[11px] font-bold text-dh-muted">รอเลือกสินค้า</p>
          </div>
        )}
      </div>
    </div>
  );
}