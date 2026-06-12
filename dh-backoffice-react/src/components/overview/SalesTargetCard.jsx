import React from 'react';
import { DollarSign, Target, TrendingUp } from 'lucide-react';

export const SalesTargetCard = ({ metrics, progressPercent }) => {
  const formatMoney = (amount) => 
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-md p-6 text-white shadow-dh-elevated relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-dh-accent rounded-full mix-blend-screen filter blur-[40px] opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
      <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/20 transition-colors group-hover:rotate-12 duration-500">
        <DollarSign size={80} />
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">ยอดขายวันนี้ (Real-time)</p>
          <h3 className="text-4xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            {formatMoney(metrics.revenueToday)}
          </h3>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Target size={12} className="text-dh-accent"/> เป้าหมายรายวัน
            </span>
            <span className="text-xs font-black text-white">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-slate-700">
            <div 
              className="bg-gradient-to-r from-dh-accent to-yellow-400 h-2 rounded-full transition-all duration-1000 ease-out relative" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px] animate-[ping_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium bg-white/10 w-fit px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/5 text-slate-200">
            <TrendingUp size={12} className="text-emerald-400" />
            <span>AOV {formatMoney(metrics.aov)}/บิล</span>
          </div>
        </div>
      </div>
    </div>
  );
};
