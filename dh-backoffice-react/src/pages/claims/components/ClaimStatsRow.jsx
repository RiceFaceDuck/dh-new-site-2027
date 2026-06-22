import React from 'react';
import { Clock, CheckCircle, XCircle, Ban, ArrowLeftRight, Wrench, Package } from 'lucide-react';

export default function ClaimStatsRow({ stats, activeTab, setActiveTab }) {
  const tabs = [
    { id: 'all', label: 'ทั้งหมด', count: stats.all, color: 'text-dh-main', bg: 'bg-dh-surface border-dh-border shadow-sm' },
    { id: 'pending', label: 'รอรับเรื่อง', count: stats.pending, icon: Clock, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 border-rose-200/50 dark:bg-rose-900/10 dark:border-rose-700/30' },
    { id: 'waiting', label: 'รอรับของ', count: stats.waiting || 0, icon: Package, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-700/30' },
    { id: 'processing', label: 'กำลังตรวจ', count: stats.processing || 0, icon: Wrench, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 border-blue-200/50 dark:bg-blue-900/10 dark:border-blue-700/30' },
    { id: 'completed', label: 'เสร็จสิ้น', count: stats.completed || stats.approved, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-900/10 dark:border-emerald-700/30' },
    { id: 'rejected', label: 'ไม่อนุมัติ', count: stats.rejected, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/50 border-red-200/50 dark:bg-red-900/10 dark:border-red-700/30' },
    { id: 'cancelled', label: 'ยกเลิก', count: stats.cancelled, icon: Ban, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50/50 border-gray-200/50 dark:bg-gray-900/10 dark:border-gray-700/30' },
  ];

  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)}
          className={`relative flex-1 min-w-[120px] p-2.5 rounded-md border flex items-center justify-between cursor-pointer transition-all active:scale-95 ${activeTab === tab.id ? 'ring-2 ring-dh-accent/50 scale-[1.02] shadow-md z-10' : ''} ${tab.bg}`}
        >
          <div className="flex items-center gap-1.5 relative z-10">
            {tab.icon && <tab.icon className={`w-3.5 h-3.5 ${tab.color}`} />}
            <span className={`text-[11px] font-black uppercase text-dh-muted`}>{tab.label}</span>
          </div>
          <span className={`text-[15px] font-black relative z-10 ${tab.color}`}>{tab.count}</span>
        </div>
      ))}
    </div>
  );
}
