import React, { useState } from 'react';
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';

export default function HistoryTable({ 
  filteredLogs, 
  hasMore, 
  loadMore, 
  loadingMore,
  searchTerm,
  moduleFilter,
  actionFilter 
}) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to format date "YY/MM/DD"
  const formatDate = (timestamp) => {
    if (!timestamp) return '00/00/00';
    const date = new Date(timestamp);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  };

  // Helper to format time "HH:MM:SS"
  const formatTime = (timestamp) => {
    if (!timestamp) return '00:00:00';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getActionFormat = (action, level) => {
    const act = String(action || '').toUpperCase();
    const lvl = String(level || '').toUpperCase();
    
    if (lvl === 'ERROR' || act.includes('DELETE')) return { label: 'ERRR', color: 'text-[#ff5555]' };
    if (lvl === 'WARN' || act.includes('UPDATE ROLE')) return { label: 'WARN', color: 'text-[#f1fa8c]' };
    if (act.includes('UPDATE')) return { label: 'DBUG', color: 'text-[#8be9fd]' };
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
          <div className="space-y-1">
            {filteredLogs.map((log, index) => {
              // Ensure we have a unique key even if GAS doesn't provide an ID yet
              const keyId = log.id || `log-${index}-${log.timestamp || log.client_timestamp}`;
              const isExpanded = expandedRows[keyId];
              
              const ts = log.timestamp || log.client_timestamp || new Date();
              const dateStr = formatDate(ts);
              const timeStr = formatTime(ts);
              const actionFmt = getActionFormat(log.action, log.level);
              const moduleStr = String(log.module || 'SYS').toUpperCase().substring(0, 5);
              
              // Handle Actor
              const actorName = log.actor?.name || log.actorName || log.performedBy || 'Unknown';
              
              // Handle Target
              const targetId = log.target?.id || log.targetId || null;
              
              // Handle Details Summary
              let detailSummary = '';
              if (log.details?.legacy_details) {
                detailSummary = typeof log.details.legacy_details === 'object' ? JSON.stringify(log.details.legacy_details) : String(log.details.legacy_details);
              } else if (log.action) {
                detailSummary = typeof log.action === 'object' ? JSON.stringify(log.action) : String(log.action);
              } else {
                detailSummary = 'System action';
              }
              
              return (
                <div key={keyId} className="flex flex-col group">
                  <div 
                    className="hover:bg-[#002b36] transition-colors flex items-start p-1 rounded cursor-pointer"
                    onClick={() => toggleRow(keyId)}
                  >
                    <span className="text-[#586e75] mr-1 shrink-0 mt-0.5">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className="text-[#839496] mr-2 shrink-0">{dateStr}</span>
                    <span className="text-[#cb4b16] mr-2 shrink-0">{timeStr}</span>
                    <span className={`${actionFmt.color} mr-2 shrink-0 font-bold w-[45px]`}>{actionFmt.label}</span>
                    <span className="text-[#2aa198] mr-2 shrink-0 w-[60px]">[{moduleStr}]</span>
                    
                    <span className="text-[#93a1a1] break-words flex-1">
                      <span 
                        className="text-[#b58900] hover:underline" 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(actorName); }} 
                        title="Copy User"
                      >
                        {actorName}
                      </span>
                      <span className="text-[#586e75] mx-1">:</span>
                      <span className="text-[#839496]">{detailSummary}</span>
                      {targetId && (
                        <span 
                          className="ml-2 text-[#d33682] hover:underline" 
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(targetId); }}
                          title="Copy Ref ID"
                        >
                          (ref: {targetId})
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {isExpanded && (
                    <div className="ml-[170px] mr-4 mb-2 mt-1 p-3 bg-[#00151a] border border-[#003642] rounded-md text-[#839496] shadow-inner text-[12px] overflow-x-auto">
                      <pre className="whitespace-pre-wrap font-mono">
                        {JSON.stringify(log, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {hasMore && (
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
