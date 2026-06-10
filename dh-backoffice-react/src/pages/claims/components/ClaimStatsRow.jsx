import React from 'react';
import { Plus, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';

export default function ClaimStatsRow({ stats, activeTab, setActiveTab }) {
  const tabs = [
    { id: 'create', label: 'สร้างรายการใหม่', count: '+', icon: Plus, color: 'text-dh-accent', bg: 'bg-dh-accent/10 border-dh-accent/20 hover:bg-dh-accent/20' },
    { id: 'all', label: 'ทั้งหมด', count: stats.total || stats.all, color: 'text-dh-main', bg: 'bg-dh-surface hover:bg-dh-base' },
    { id: 'pending', label: 'รอตรวจ', count: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-700/30' },
    { id: 'approved', label: 'อนุมัติแล้ว', count: stats.approved, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-200/50 dark:bg-emerald-900/10 dark:border-emerald-700/30' },
    { id: 'rejected', label: 'ไม่อนุมัติ', count: stats.rejected, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 hover:bg-rose-100/50 border-rose-200/50 dark:bg-rose-900/10 dark:border-rose-700/30' },
    { id: 'cancelled', label: 'ยกเลิก', count: stats.cancelled, icon: Ban, color: 'text-dh-muted', bg: 'bg-dh-surface hover:bg-dh-base' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map(tab => (
        <div 
          key={tab.id} onClick={() => setActiveTab(tab.id)} 
          className={`flex-1 min-w-[120px] p-2.5 rounded-xl border cursor-pointer transition-all active:scale-95 flex items-center justify-between ${activeTab === tab.id ? 'border-dh-accent shadow-sm ring-1 ring-dh-accent/10' : `border-dh-border ${tab.bg}`}`}
        >
          <div className="flex items-center gap-1.5">
            {tab.icon && <tab.icon className={`w-3.5 h-3.5 ${tab.color}`} />}
            <span className="text-[11px] font-black uppercase text-dh-muted">{tab.label}</span>
          </div>
          <span className={`text-[15px] font-black ${activeTab === tab.id ? 'text-dh-main' : tab.color}`}>{tab.count}</span>
        </div>
      ))}
    </div>
  );
}
