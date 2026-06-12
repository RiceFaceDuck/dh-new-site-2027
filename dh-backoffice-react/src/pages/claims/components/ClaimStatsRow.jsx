import React from 'react';
import { Plus, Clock, CheckCircle, XCircle, Ban, ArrowLeft } from 'lucide-react';

export default function ClaimStatsRow({ stats, activeTab, setActiveTab }) {
  const tabs = [
    { 
      id: 'create', 
      label: activeTab === 'create' ? 'ย้อนกลับ' : 'สร้างรายการใหม่', 
      count: null, 
      icon: activeTab === 'create' ? ArrowLeft : Plus, 
      color: 'text-white', 
      bg: activeTab === 'create' ? 'bg-slate-700 hover:bg-slate-800 border-slate-800 shadow-md' : 'bg-dh-accent hover:brightness-110 border-dh-accent shadow-md',
      isProminent: true
    },
    { id: 'all', label: 'ทั้งหมด', count: stats.total || stats.all, color: 'text-dh-main', bg: 'bg-dh-surface hover:bg-dh-base' },
    { id: 'pending', label: 'รอตรวจ', count: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-700/30' },
    { id: 'approved', label: 'อนุมัติแล้ว', count: stats.approved, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-200/50 dark:bg-emerald-900/10 dark:border-emerald-700/30' },
    { id: 'rejected', label: 'ไม่อนุมัติ', count: stats.rejected, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 hover:bg-rose-100/50 border-rose-200/50 dark:bg-rose-900/10 dark:border-rose-700/30' },
    { id: 'cancelled', label: 'ยกเลิก', count: stats.cancelled, icon: Ban, color: 'text-dh-muted', bg: 'bg-dh-surface hover:bg-dh-base' },
  ];

  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          onClick={() => {
              if (tab.id === 'create' && activeTab === 'create') {
                  setActiveTab('all');
              } else {
                  setActiveTab(tab.id);
              }
          }} 
          className={`relative flex-1 min-w-[120px] p-2.5 rounded-md border cursor-pointer transition-all active:scale-95 flex items-center justify-between ${activeTab === tab.id && !tab.isProminent ? 'border-dh-accent shadow-sm ring-1 ring-dh-accent/10' : `border-dh-border ${tab.bg}`} ${tab.isProminent ? 'justify-center gap-2' : ''}`}
        >
          <div className={`flex items-center gap-1.5 relative z-10 ${tab.isProminent ? 'justify-center w-full' : ''}`}>
            {tab.icon && <tab.icon className={`${tab.isProminent ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${tab.color}`} />}
            <span className={`${tab.isProminent ? 'text-[13px]' : 'text-[11px]'} font-black uppercase ${tab.isProminent ? tab.color : 'text-dh-muted'}`}>{tab.label}</span>
          </div>
          {tab.count !== null && (
            <span className={`text-[15px] font-black relative z-10 ${activeTab === tab.id && !tab.isProminent ? 'text-dh-main' : tab.color}`}>{tab.count}</span>
          )}
        </div>
      ))}
    </div>
  );
}
