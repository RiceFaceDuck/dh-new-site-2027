import React from 'react';
import { 
  Activity, 
  RefreshCcw, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Server, 
  Clock 
} from 'lucide-react';

export default function SystemHealthPanel({
  healthStatus = 'healthy', // 'healthy' | 'warning' | 'critical'
  isCheckingHealth = false,
  healthLogs = [
    { time: new Date().toLocaleTimeString(), msg: "ระบบ Credit System Initialized", type: "info" },
    { time: new Date().toLocaleTimeString(), msg: "เชื่อมต่อ Database Service สำเร็จ", type: "success" }
  ],
  onRefresh = () => console.log('Ping health check...') // Fallback function
}) {

  // กำหนดสไตล์ตามสถานะของเซิร์ฟเวอร์
  const getStatusConfig = () => {
    switch (healthStatus) {
      case 'warning':
        return {
          color: 'text-amber-500',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: AlertTriangle,
          label: 'System Degraded',
          pulse: 'bg-amber-500'
        };
      case 'critical':
        return {
          color: 'text-rose-500',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          icon: XCircle,
          label: 'System Critical',
          pulse: 'bg-rose-500'
        };
      case 'healthy':
      default:
        return {
          color: 'text-emerald-500',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: CheckCircle2,
          label: 'All Systems Operational',
          pulse: 'bg-emerald-500'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Activity size={18} className="text-blue-500" />
          </div>
          System Health & Diagnostics
        </h3>
        
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isCheckingHealth}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${isCheckingHealth 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200'
            }`}
        >
          <RefreshCcw size={14} className={isCheckingHealth ? "animate-spin" : ""} />
          {isCheckingHealth ? "Running..." : "Run Diagnostics"}
        </button>
      </div>

      {/* Current Status Card */}
      <div className={`p-4 rounded-xl border flex items-center justify-between mb-4 ${statusConfig.bg} ${statusConfig.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm ${statusConfig.color}`}>
            <StatusIcon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{statusConfig.label}</h4>
            <p className="text-xs text-slate-500 mt-0.5">สถานะการเชื่อมต่อ Database และ Credit Core</p>
          </div>
        </div>
        
        {/* Mock Server Metrics (เพิ่มความน่าเชื่อถือ) */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
          <div className="flex flex-col items-end">
            <span className="text-slate-400 flex items-center gap-1"><Server size={12}/> Latency</span>
            <span className="text-slate-700">24 ms</span>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex flex-col items-end">
            <span className="text-slate-400 flex items-center gap-1"><Clock size={12}/> Uptime</span>
            <span className="text-slate-700">99.99%</span>
          </div>
        </div>
      </div>

      {/* Terminal / Logs Section */}
      <div className="flex-1 flex flex-col min-h-[200px]">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
          <Terminal size={14} className="text-slate-400" />
          Event Logs
        </h4>
        
        <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-y-auto shadow-inner border border-slate-800 relative">
          <div className="space-y-2 font-mono text-[11px] sm:text-xs">
            {healthLogs.length === 0 ? (
              <div className="text-slate-500">Waiting for events...</div>
            ) : (
              healthLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5 hover:bg-slate-800/50 p-1 -mx-1 rounded transition-colors">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={`flex-1 break-words leading-relaxed
                    ${log.type === 'error' ? 'text-rose-400' : 
                      log.type === 'warning' ? 'text-amber-400' : 
                      log.type === 'success' ? 'text-emerald-400' : 
                      'text-slate-300'}`}
                  >
                    {log.type === 'error' && '> ERR: '}
                    {log.type === 'warning' && '> WARN: '}
                    {log.type === 'success' && '> OK: '}
                    {log.type === 'info' && '> INFO: '}
                    {log.msg}
                  </span>
                </div>
              ))
            )}
          </div>
          
          {/* Decorative Terminal Cursor */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 mt-2">
             <span className="text-emerald-500 font-mono text-xs">admin@dh-core:~$</span>
             <span className="w-1.5 h-3.5 bg-slate-400 animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  );
}