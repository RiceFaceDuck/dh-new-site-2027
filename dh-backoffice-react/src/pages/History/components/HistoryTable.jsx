import React from 'react';
import { Loader2 } from 'lucide-react';

export default function HistoryTable({ 
  filteredLogs, 
  hasMore, 
  loadMore, 
  loadingMore,
  searchTerm,
  moduleFilter,
  actionFilter 
}) {

  // Helper to format date "YY/MM/DD"
  const formatDate = (timestamp) => {
    if (!timestamp) return '00/00/00';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  };

  // Helper to format time "HH:MM:SS"
  const formatTime = (timestamp) => {
    if (!timestamp) return '00:00:00';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getActionFormat = (action) => {
    const act = action?.toUpperCase() || 'INFO';
    if (act.includes('DELETE')) return { label: 'ERRR', color: 'text-[#ff5555]' };
    if (act.includes('UPDATE ROLE')) return { label: 'WARN', color: 'text-[#f1fa8c]' };
    if (act.includes('UPDATE')) return { label: 'DBUG', color: 'text-white' };
    return { label: 'INFO', color: 'text-white' };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-[#001e26] border border-[#003642] rounded shadow-lg overflow-hidden transition-all duration-300 h-full flex flex-col">
      <div className="overflow-y-auto flex-1 custom-scrollbar font-mono text-[13px] leading-relaxed tracking-wider p-4">
        {filteredLogs.length === 0 ? (
          <div className="text-[#586e75] p-4">
            {`> grep "${searchTerm || 'logs'}" ... no results found.`}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log) => {
              const dateStr = formatDate(log.timestamp);
              const timeStr = formatTime(log.timestamp);
              const actionFmt = getActionFormat(log.action);
              const moduleStr = (log.module || 'SYS').toUpperCase().substring(0, 5);
              const actor = log.actorName || log.performedBy || 'Unknown';
              
              return (
                <div 
                  key={log.id} 
                  className="hover:bg-[#002b36] transition-colors flex items-start group"
                >
                  <span className="text-[#839496] mr-2 shrink-0">{dateStr}</span>
                  <span className="text-[#cb4b16] mr-2 shrink-0">{timeStr}</span>
                  <span className={`${actionFmt.color} mr-2 shrink-0 font-bold w-[45px]`}>{actionFmt.label}</span>
                  <span className="text-[#2aa198] mr-2 shrink-0">[{moduleStr}]</span>
                  <span className="text-[#93a1a1] break-words">
                    <span className="text-[#b58900] cursor-pointer hover:underline" onClick={() => copyToClipboard(actor)} title="Copy User">
                      {actor}
                    </span>
                    <span className="text-[#586e75] mx-1">:</span>
                    <span className="text-[#839496]">{log.details || 'No Details'}</span>
                    {log.targetId && (
                      <span 
                        className="ml-2 text-[#d33682] cursor-pointer hover:underline" 
                        onClick={() => copyToClipboard(log.targetId)}
                        title="Copy Ref ID"
                      >
                        (ref: {log.targetId})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {hasMore && !searchTerm && moduleFilter === 'all' && actionFilter === 'all' && (
          <div className="mt-4 pt-4 border-t border-[#002b36]">
            <button 
              onClick={loadMore}
              disabled={loadingMore}
              className="text-[#2aa198] hover:text-[#268bd2] hover:bg-[#002b36] px-2 py-1 rounded transition-colors flex items-center gap-2"
            >
              {loadingMore ? <Loader2 className="animate-spin w-3 h-3" /> : '>'}
              {loadingMore ? 'tail -f logs...' : './load_more.sh'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
