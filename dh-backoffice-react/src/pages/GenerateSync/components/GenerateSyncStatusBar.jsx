import { Clock, RefreshCw } from 'lucide-react';

export default function GenerateSyncStatusBar({
  isFlushing,
  pendingCount,
  lastSyncTime,
  isCalculating,
  fetchChanges
}) {
  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-2 flex flex-wrap items-center justify-between gap-4">
      
      {/* Status indicator */}
      <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-xl shadow-xs border border-slate-200">
         <div className="flex items-center gap-2" title="รายการที่รออัปเดตไปยังระบบภายนอก (Google Sheet)">
           <div className={`w-2.5 h-2.5 rounded-full ${isFlushing ? 'bg-amber-400 animate-ping' : pendingCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
           <span className="text-sm font-bold text-slate-700">
             {pendingCount > 0 ? `รออัปเดต ${pendingCount} รายการ` : 'ข้อมูลอัปเดตครบถ้วน'}
           </span>
         </div>
         <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
         <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
           <Clock size={14} />
           <span>ซิงค์ล่าสุด: {lastSyncTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
         </div>
         
         <button 
           onClick={fetchChanges} 
           disabled={isCalculating} 
           className="ml-auto p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors disabled:opacity-50"
           title="โหลดข้อมูลใหม่"
         >
           <RefreshCw size={16} className={isCalculating ? 'animate-spin' : ''} />
         </button>
      </div>
    </div>
  );
}
