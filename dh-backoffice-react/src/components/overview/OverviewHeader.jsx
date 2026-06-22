import React from 'react';
import { Sparkles, Users, Download, Zap, HelpCircle } from 'lucide-react';

export const OverviewHeader = ({ metrics, getGreeting, getMotivation, setShowGuide }) => {
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 px-4 py-3 rounded-md shrink-0 z-20 shadow-[0_4px_20px_-5px_rgba(239,68,68,0.5)] relative transition-colors duration-300 print:shadow-none print:border-none print:bg-transparent print:p-0 overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-[80px] opacity-20 animate-pulse pointer-events-none print:hidden"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-bold text-xs tracking-wide">{getGreeting()}</span>
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-green-400 bg-white/20 px-2 py-0.5 rounded-md border border-white/30 print:hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_#4ade80]"></span> Live Feed
          </span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
          DH Command Center
        </h2>
        <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Sparkles size={12} className="text-yellow-400" /> {getMotivation()}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 relative z-10 print:hidden mt-2 lg:mt-0">
        {metrics.pendingStaff > 0 && (
          <div className="flex items-center gap-2 bg-white/20 text-white px-3 py-1.5 rounded-md border border-white/30 shadow-sm animate-bounce backdrop-blur-sm">
            <Users size={14} />
            <span className="text-xs font-bold">{metrics.pendingStaff} พนักงานรออนุมัติ</span>
          </div>
        )}
        
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 px-4 py-1.5 rounded-md font-bold transition-all shadow-sm active:scale-95 text-xs backdrop-blur-sm"
        >
          <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          <span>Export Report</span>
        </button>
        <button 
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 px-4 py-1.5 rounded-md font-bold transition-all shadow-sm active:scale-95 text-xs backdrop-blur-sm"
        >
          <HelpCircle size={14} />
          <span>คู่มือใช้งาน</span>
        </button>
      </div>
    </div>
  );
};
