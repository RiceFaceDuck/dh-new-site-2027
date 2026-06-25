import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

export default function GenerateSyncStatusBar({
  isFlushing,
  pendingCount,
  lastSyncTime,
  isCalculating,
  fetchChanges,
  autoSyncEnabled,
  updateAutoSync,
  syncInterval,
  updateSyncInterval
}) {
  return (
    <div className="w-full px-4 sm:px-6 pt-6 pb-2 flex flex-wrap items-center justify-between gap-4">
      
      {/* Status indicator */}
      <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
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

      {/* Auto Sync Settings */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
         <label className="flex items-center gap-2 cursor-pointer">
           <div className="relative">
             <input type="checkbox" className="sr-only" checked={autoSyncEnabled} onChange={(e) => {
               updateAutoSync(e.target.checked);
             }} />
             <div className={`block w-10 h-6 rounded-full transition-colors ${autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
             <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoSyncEnabled ? 'transform translate-x-4' : ''}`}></div>
           </div>
           <span className="text-sm font-bold text-slate-700 select-none">Auto Refresh</span>
         </label>

         {autoSyncEnabled && (
           <div className="flex items-center border-l border-slate-200 pl-3">
             <select 
               value={syncInterval} 
               onChange={(e) => {
                 updateSyncInterval(Number(e.target.value));
               }}
               className="text-sm border border-slate-200 bg-slate-50 rounded-lg px-2 py-1 text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-bold"
             >
               <option value={1}>ทุก 1 นาที</option>
               <option value={5}>ทุก 5 นาที</option>
               <option value={15}>ทุก 15 นาที</option>
               <option value={30}>ทุก 30 นาที</option>
               <option value={60}>ทุก 1 ชั่วโมง</option>
             </select>
           </div>
         )}
      </div>
    </div>
  );
}
