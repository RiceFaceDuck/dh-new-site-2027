import React from 'react';

export default function SystemHealthPanel({
  healthStatus = 'healthy', 
  isCheckingHealth = false,
  healthLogs = [],
  onRefresh
}) {
  return (
    // ทรงเหลี่ยมชิด ขอบบาง ลดช่องว่างภายใน
    <div className="bg-white border border-slate-300 rounded-sm flex flex-col h-[300px]">
      <div className="px-4 py-3 border-b border-slate-300 flex justify-between items-center bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800">Event Logs</h3>
        <button
          onClick={onRefresh}
          disabled={isCheckingHealth}
          className="text-xs text-blue-600 hover:underline disabled:text-slate-400"
        >
          {isCheckingHealth ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      
      <div className="flex-1 bg-slate-900 p-3 overflow-y-auto font-mono text-xs">
        {healthLogs.length === 0 ? (
          <div className="text-slate-500">Waiting for events...</div>
        ) : (
          healthLogs.map((log, idx) => (
            <div key={idx} className="mb-1 text-slate-300">
              <span className="text-slate-500 mr-2">[{log.time}]</span>
              <span className={
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'warning' ? 'text-yellow-400' : 
                log.type === 'success' ? 'text-green-400' : ''
              }>
                {log.msg}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}