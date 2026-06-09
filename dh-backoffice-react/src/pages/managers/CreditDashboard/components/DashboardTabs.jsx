import React from 'react';
import { ArrowRightLeft, History, Users, Settings } from 'lucide-react';

export default function DashboardTabs({ activeTab = 'adjust', onTabChange }) {
  const TABS = [
    { id: 'partners', label: 'Ledger', icon: Users },
    { id: 'history', label: 'Audit Trail', icon: History },
    { id: 'adjust', label: 'Operations', icon: ArrowRightLeft },
    { id: 'settings', label: 'Config', icon: Settings }
  ];

  return (
    // ดีไซน์แท็บแบบดั้งเดิม ธรรมดา เรียบง่าย ประหยัดพื้นที่
    <div className="border-b border-slate-300 bg-slate-50">
      <nav className="flex" aria-label="Tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium outline-none transition-none rounded-none
                ${isActive 
                  ? 'bg-white border-t-[3px] border-t-blue-600 border-r border-l border-slate-300 text-blue-700 -mb-[1px]' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-t-[3px] border-t-transparent border-r border-l border-transparent'
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}