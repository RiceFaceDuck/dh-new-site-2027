import React from 'react';
import { History, RefreshCw } from 'lucide-react';

export default function PricingHistoryLog({ logs, loadingLogs, fetchPricingLogs }) {
  return (
    <div className="bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] overflow-hidden shrink-0 h-[280px] flex flex-col">
      <div className="p-4 border-b border-[var(--dh-border)] bg-[var(--dh-bg-base)] flex items-center justify-between shrink-0">
        <h2 className="font-black text-[var(--dh-text-main)] text-xs uppercase tracking-widest flex items-center gap-2">
          <History size={14} className="text-[var(--dh-text-muted)]" /> ประวัติการแก้โครงสร้างราคา
        </h2>
        <button onClick={fetchPricingLogs} className="text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] p-1 rounded-md hover:bg-[var(--dh-bg-surface)] transition-colors"><RefreshCw size={14} className={loadingLogs ? "animate-spin text-[var(--dh-accent)]" : ""}/></button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-[var(--dh-bg-surface)]">
        {loadingLogs ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--dh-text-muted)]"><RefreshCw className="animate-spin mb-2" size={20} /><p className="text-[10px] font-bold">กำลังโหลดประวัติ...</p></div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--dh-text-muted)] text-[11px] font-bold">ยังไม่มีประวัติการเปลี่ยนแปลง</div>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[7px] before:w-[2px] before:bg-[var(--dh-border)] before:opacity-50">
            {logs.map(log => (
              <div key={log.id} className="relative flex items-start gap-4 group/log">
                <div className="absolute left-0 w-4 h-4 rounded-full bg-[var(--dh-bg-surface)] border-[3px] border-[var(--dh-border)] mt-1 z-10 flex items-center justify-center transition-colors group-hover/log:border-[var(--dh-accent)]">
                </div>
                <div className="pl-6 w-full">
                  <div className="bg-[var(--dh-bg-base)] p-3 rounded-xl border border-[var(--dh-border)] shadow-sm transition-colors group-hover/log:border-[var(--dh-accent)]/30">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-black text-[var(--dh-text-main)]">{log.details}</span>
                      <span className="text-[9px] font-bold text-[var(--dh-text-muted)] shrink-0 pl-2">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('th-TH', {dateStyle:'short', timeStyle:'short'}) : '-'}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-[var(--dh-text-muted)]">
                      ดำเนินการโดย: <span className="text-blue-600 dark:text-blue-400">{log.actorName || log.performedBy || 'System'}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
