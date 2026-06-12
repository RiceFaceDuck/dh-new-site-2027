import React, { useState } from 'react';
import { History, Maximize2, X, ChevronRight, ChevronDown } from 'lucide-react';

const LogItem = ({ log, dateStr, actionMethod, actor }) => {
  // เริ่มต้นด้วยการย่อ (false)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="group px-1 py-1.5 hover:bg-[#F8F9FA] transition-colors border-l-[3px] border-transparent hover:border-[#007ACC] cursor-pointer flex"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Code Folding Icon */}
      <div className="w-4 shrink-0 flex items-start justify-center pt-[3px] text-[#A8A8A8] group-hover:text-[#333333] transition-colors">
        {isExpanded ? <ChevronDown size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {isExpanded ? (
          <>
            <div className="flex flex-wrap items-baseline break-all">
              <span className="text-[#AF00DB] font-semibold mr-1.5">def</span>
              <span className="text-[#0000FF]">{actionMethod}</span>
              <span className="text-[#000000]">(</span>
              <span className="text-[#001080]">module</span>
              <span className="text-[#000000]">=</span>
              <span className="text-[#A31515]">"{log.module}"</span>
              <span className="text-[#000000]">):</span>
            </div>
            <div className="pl-4 break-all">
              <span className="text-[#AF00DB]">await</span> <span className="text-[#795E26]">Log</span>.<span className="text-[#0000FF]">save</span><span className="text-[#000000]">(</span>
            </div>
            <div className="pl-8 break-all">
              <span className="text-[#001080]">date</span><span className="text-[#000000]">=</span><span className="text-[#A31515]">"{dateStr}"</span><span className="text-[#000000]">,</span>
            </div>
            <div className="pl-8 break-all">
              <span className="text-[#001080]">actor</span><span className="text-[#000000]">=</span><span className="text-[#A31515]">"{actor}"</span>
            </div>
            <div className="pl-4 break-all text-[#000000]">)</div>
            <div className="pl-4 break-words text-[#008000] mt-0.5 leading-snug">
              # {log.details}
            </div>
          </>
        ) : (
          <div className="flex items-center min-w-0 overflow-hidden">
             {/* ชื่อเหตุการณ์ (Event Name) */}
             <span className="text-[#0000FF] font-bold shrink-0 mr-2 tracking-wide">
               {log.action?.toUpperCase() || 'RECORD'}
             </span>
             {/* คำอธิบายสั้นๆ (Short Description) */}
             <span className="text-[#333333] truncate opacity-90" title={log.details}>
               {log.details}
             </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function HistoryLogPanel({ selectedProduct, setIsHistoryModalOpen, loadingHistory, historyLogs }) {
  return (
    <div className="w-[20%] min-w-[220px] max-w-[280px] bg-[#FFFFFF] flex flex-col overflow-hidden shrink-0 transition-colors duration-300 border-l border-[#E2E8F0] z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
      
      {/* --- Editor File Tab Header (VS Code Style) --- */}
      <div className="flex bg-[#F3F3F3] items-end px-2 pt-2 border-b border-[#CCCCCC] shrink-0 select-none justify-between">
        <div className="bg-[#FFFFFF] px-3 py-1.5 text-[10px] font-mono text-[#333333] border-t-2 border-t-[#007ACC] border-l border-r border-[#CCCCCC] border-b border-b-transparent -mb-[1px] flex items-center gap-1.5 cursor-default relative">
          <History size={12} className="text-[#007ACC]"/> 
          <span>history_log.py</span>
          <div className="ml-1 p-0.5 hover:bg-[#EAEAEA] rounded-sm cursor-pointer transition-colors text-slate-400">
            <X size={10} />
          </div>
        </div>
        <button 
          onClick={() => setIsHistoryModalOpen(true)}
          className="p-1 mb-1 text-slate-400 hover:text-slate-700 hover:bg-[#EAEAEA] rounded-md transition-colors active:scale-95"
          title="ขยายประวัติแบบเต็มจอ"
        >
          <Maximize2 size={12} strokeWidth={2}/>
        </button>
      </div>
      
      {/* --- Panel Content (Code Editor Window) --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#FFFFFF] font-mono text-[10.5px] leading-[1.6]">
        {selectedProduct ? (
          <div className="py-2">
            {/* Target SKU as a python comment */}
            <div className="px-3 mb-2 opacity-90">
              <span className="text-[#008000]"># Target Product: {selectedProduct.sku}</span>
            </div>

            {loadingHistory ? (
              <div className="px-3 text-[#0000FF] animate-pulse">
                <span className="text-[#AF00DB]">await</span> System.load_history()...
              </div>
            ) : historyLogs.length > 0 ? (
              <div className="flex flex-col pb-4">
                {historyLogs.map((log) => {
                  const dateStr = log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleDateString('th-TH') : '-';
                  const actionMethod = log.action ? log.action.toLowerCase() : 'record';
                  const actor = log.actorName || log.performedBy || 'System';
                  
                  return (
                    <LogItem 
                      key={log.id} 
                      log={log} 
                      dateStr={dateStr} 
                      actionMethod={actionMethod} 
                      actor={actor} 
                    />
                  );
                })}
                <div className="px-3 mt-3 opacity-60 text-[#008000]"># EOF</div>
              </div>
            ) : (
              <div className="px-3 mt-2">
                <span className="text-[#008000]"># No history logs found.</span>
                <br/>
                <span className="text-[#0000FF]">print</span><span className="text-[#000000]">(</span><span className="text-[#A31515]">"Empty"</span><span className="text-[#000000]">)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-4">
            <span className="text-[#008000]"># Please select a product to view its history log.</span>
            <br/>
            <span className="text-[#001080]">target_product</span> <span className="text-[#000000]">=</span> <span className="text-[#0000FF]">None</span>
          </div>
        )}
      </div>
    </div>
  );
}