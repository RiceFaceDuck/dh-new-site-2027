import { Clock, CheckCircle2, XCircle, Ban, Wrench, Package, Layers } from 'lucide-react';

export default function ClaimStatsRow({ stats, activeTab, setActiveTab }) {
  const tabs = [
    { 
      id: 'all', 
      label: 'ทั้งหมด', 
      count: stats.all || 0, 
      icon: Layers, 
      activeStyle: 'bg-slate-900 text-white shadow-md shadow-slate-900/20 border-slate-900', 
      inactiveStyle: 'text-slate-700 hover:bg-slate-100 border-slate-200/80 bg-slate-50/60',
      activeBadge: 'bg-white/20 text-white',
      inactiveBadge: 'bg-slate-200/80 text-slate-800'
    },
    { 
      id: 'pending', 
      label: 'รอรับเรื่อง', 
      count: stats.pending || 0, 
      icon: Clock, 
      activeStyle: 'bg-rose-500 text-white shadow-md shadow-rose-500/25 border-rose-500', 
      inactiveStyle: 'text-rose-700 hover:bg-rose-100/80 border-rose-200/80 bg-rose-50/60',
      activeBadge: 'bg-white/20 text-white',
      inactiveBadge: 'bg-rose-100 text-rose-800'
    },
    { 
      id: 'waiting', 
      label: 'รอรับของ', 
      count: stats.waiting || 0, 
      icon: Package, 
      activeStyle: 'bg-amber-500 text-white shadow-md shadow-amber-500/25 border-amber-500', 
      inactiveStyle: 'text-amber-700 hover:bg-amber-100/80 border-amber-200/80 bg-amber-50/60',
      activeBadge: 'bg-white/20 text-white',
      inactiveBadge: 'bg-amber-100 text-amber-800'
    },
    { 
      id: 'processing', 
      label: 'กำลังตรวจ', 
      count: stats.processing || 0, 
      icon: Wrench, 
      activeStyle: 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border-blue-600', 
      inactiveStyle: 'text-blue-700 hover:bg-blue-100/80 border-blue-200/80 bg-blue-50/60',
      activeBadge: 'bg-white/20 text-white',
      inactiveBadge: 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'completed', 
      label: 'เสร็จสิ้น', 
      count: stats.completed || stats.approved || 0, 
      icon: CheckCircle2, 
      activeStyle: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 border-emerald-600', 
      inactiveStyle: 'text-emerald-700 hover:bg-emerald-100/80 border-emerald-200/80 bg-emerald-50/60',
      activeBadge: 'bg-white/20 text-white',
      inactiveBadge: 'bg-emerald-100 text-emerald-800'
    },
    { 
      id: 'rejected', 
      label: 'ไม่อนุมัติ', 
      count: stats.rejected || 0, 
      icon: XCircle, 
      activeStyle: 'bg-red-600 text-white shadow-md shadow-red-600/25 border-red-600', 
      inactiveStyle: 'text-red-700 hover:bg-red-100/80 border-red-200/80 bg-red-50/60',
      activeBadge: 'bg-white/20 text-white',
      inactiveBadge: 'bg-red-100 text-red-800'
    },
    { 
      id: 'cancelled', 
      label: 'ยกเลิก', 
      count: stats.cancelled || 0, 
      icon: Ban, 
      activeStyle: 'bg-gray-700 text-white shadow-md shadow-gray-700/25 border-gray-700', 
      inactiveStyle: 'text-gray-700 hover:bg-gray-200/80 border-gray-300/80 bg-gray-100/60',
      activeBadge: 'bg-white/20 text-white',
      inactiveBadge: 'bg-gray-200 text-gray-800'
    },
  ];

  return (
    <div className="bg-dh-surface p-2 rounded-2xl border border-dh-border/80 shadow-xs flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button 
            key={tab.id} 
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[115px] md:min-w-[130px] px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer active:scale-95 select-none ${
              isActive ? tab.activeStyle : tab.inactiveStyle
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {Icon && <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />}
              <span className="text-[12px] font-black tracking-wide truncate">
                {tab.label}
              </span>
            </div>
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 transition-colors ${
              isActive ? tab.activeBadge : tab.inactiveBadge
            }`}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}


