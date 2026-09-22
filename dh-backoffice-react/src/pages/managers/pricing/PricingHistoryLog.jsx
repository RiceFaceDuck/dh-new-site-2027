import { useState, useRef } from 'react';
import { History, RefreshCw, ChevronUp, ChevronDown, Pin, PinOff } from 'lucide-react';

const formatLogDetails = (details) => {
  if (!details) return '-';
  if (typeof details === 'string') return details;
  if (typeof details === 'object') {
    if (typeof details.legacy_details === 'string') return details.legacy_details;
    if (details.legacy_details) return JSON.stringify(details.legacy_details);
    return JSON.stringify(details);
  }
  return String(details);
};

export default function PricingHistoryLog({ logs = [], loadingLogs = false, fetchPricingLogs }) {
  const [collapsed, setCollapsed] = useState(true);
  const [pinned, setPinned] = useState(false);
  const containerRef = useRef(null);

  const handleMouseLeave = () => {
    if (!pinned && !collapsed) {
      setCollapsed(true);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={handleMouseLeave}
      className={`bg-(--dh-bg-surface) rounded-2xl shadow-xs border border-(--dh-border) overflow-hidden shrink-0 transition-all duration-300 flex flex-col ${
        collapsed ? 'h-[46px]' : 'h-[260px]'
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-sm cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-slate-700/50 text-indigo-300 border border-slate-600/50">
            <History size={14} />
          </div>
          <span className="font-black text-xs text-white uppercase tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            ประวัติการแก้ไขโครงสร้างราคา
          </span>
          {logs.length > 0 && (
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
              {logs.length} รายการ
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* ปุ่มตรึงหน้าจอ (Pin) เมื่อเปิดออก */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              title={pinned ? 'ปลดตรึง (หุบอัตโนมัติเมื่อเมาส์ออก)' : 'ตรึงไว้ (เปิดค้างไว้)'}
              className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                pinned
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
              }`}
            >
              {pinned ? <Pin size={12} className="fill-amber-300" /> : <PinOff size={12} />}
              <span className="hidden sm:inline">{pinned ? 'ตรึงไว้' : 'อัตโนมัติ'}</span>
            </button>
          )}

          {/* ปุ่มรีเฟรช */}
          <button
            type="button"
            onClick={fetchPricingLogs}
            title="รีเฟรชประวัติ"
            className="text-slate-300 hover:text-white p-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={loadingLogs ? "animate-spin text-indigo-400" : ""} />
          </button>

          {/* ปุ่มขยาย / หุบ */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'ขยายดูประวัติ' : 'หุบลงชิดด้านล่าง'}
            className="text-slate-300 hover:text-white p-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="text-[10px] font-bold pl-1 hidden sm:inline">{collapsed ? 'ขยาย' : 'หุบ'}</span>
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Body: Timeline List */}
      {!collapsed && (
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-(--dh-bg-surface) transition-opacity duration-300">
          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center h-full text-(--dh-text-muted)">
              <RefreshCw className="animate-spin mb-2" size={20} />
              <p className="text-[10px] font-bold">กำลังโหลดประวัติ...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-(--dh-text-muted) text-[11px] font-bold">
              ยังไม่มีประวัติการเปลี่ยนแปลง
            </div>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[7px] before:w-[2px] before:bg-(--dh-border) before:opacity-50">
              {logs.map((log) => (
                <div key={log.id} className="relative flex items-start gap-4 group/log">
                  <div className="absolute left-0 w-4 h-4 rounded-full bg-(--dh-bg-surface) border-[3px] border-(--dh-border) mt-1 z-10 flex items-center justify-center transition-colors group-hover/log:border-(--dh-accent)"></div>
                  <div className="pl-6 w-full">
                    <div className="bg-(--dh-bg-base) p-3 rounded-xl border border-(--dh-border) shadow-xs transition-colors group-hover/log:border-(--dh-accent)/30">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] font-black text-(--dh-text-main)">
                          {formatLogDetails(log.details)}
                        </span>
                        <span className="text-[9px] font-bold text-(--dh-text-muted) shrink-0 pl-2">
                          {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-(--dh-text-muted)">
                        ดำเนินการโดย: <span className="text-blue-600 dark:text-blue-400">{log.actorName || log.performedBy || 'System'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
