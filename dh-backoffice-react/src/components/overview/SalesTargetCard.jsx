import React from 'react';
import { DollarSign, Target, TrendingUp } from 'lucide-react';

export const SalesTargetCard = ({ metrics, progressPercent }) => {
  const formatMoney = (amount) => 
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-700/50 relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.2)] transition-all duration-500">
      
      {/* Inner Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px] opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"></div>

      <div className="absolute -right-6 -bottom-6 text-white/5 group-hover:text-white/10 transition-colors group-hover:scale-110 duration-700 pointer-events-none">
        <DollarSign size={140} />
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            ยอดขายวันนี้ (Real-time)
          </p>
          <h3 className="text-4xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-linear-to-b from-white to-slate-300">
            {formatMoney(metrics.revenueToday)}
          </h3>
        </div>
        
        <div className="mt-5">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Target size={14} className="text-indigo-400"/> เป้าหมายรายวัน
            </span>
            <span className="text-sm font-black text-white">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-950/50 rounded-full h-2.5 overflow-hidden border border-slate-700/50 backdrop-blur-md p-[1px]">
            <div 
              className="bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out relative" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-6 bg-linear-to-l from-white/40 to-transparent blur-[1px]"></div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-bold bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 backdrop-blur-md">
            <TrendingUp size={14} className="text-emerald-400" />
            <span>AOV {formatMoney(metrics.aov)} / บิล</span>
          </div>
        </div>
      </div>
    </div>
  );
};
