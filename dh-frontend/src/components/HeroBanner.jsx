import React from 'react';
import { ShieldCheck, Cpu, ChevronRight } from 'lucide-react';

const HeroBanner = () => {
  return (
    <div className="relative w-full min-h-[220px] sm:h-64 md:h-72 lg:h-80 rounded-md overflow-hidden mb-8 md:mb-12 flex items-center group shadow-glow-emerald border border-slate-800">
      
      {/* 1. Background Layers (Tech Grid & Gradient) */}
      <div className="absolute inset-0 bg-dh-dark z-10"></div>
      <div className="absolute inset-0 bg-tech-grid-dark opacity-40 z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10"></div>

      {/* 2. Glow Effects (แสงเรืองแสงตกแต่ง) */}
      <div className="absolute -left-20 -top-20 w-72 h-72 bg-cyber-emerald/20 blur-[80px] rounded-full z-10"></div>
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-cyber-blue/10 blur-[100px] rounded-full z-10"></div>

      {/* 3. Content */}
      <div className="relative z-20 px-6 sm:px-10 md:px-16 w-full flex flex-col items-start">
        
        {/* Tech Badge - Partner Program */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur-md rounded-sm border border-slate-700/50 shadow-sm mb-4">
          <span className="w-2 h-2 rounded-full bg-cyber-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          <span className="text-slate-300 text-[10px] md:text-xs font-bold tracking-widest uppercase font-tech">
            DH Partner Portal
          </span>
        </div>

        {/* Main Typography */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 leading-tight">
          ระบบจัดการอะไหล่<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-emerald to-cyber-blue">
            ครบวงจรระดับมืออาชีพ
          </span>
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-lg mb-6 md:mb-8 font-medium leading-relaxed">
          ยกระดับธุรกิจของคุณด้วยคลังสินค้าอัจฉริยะ 
          เช็คสต๊อกเรียลไทม์ และระบบสั่งซื้อที่ออกแบบมาเพื่อพาร์ทเนอร์และช่างคอมพิวเตอร์โดยเฉพาะ
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-cyber-emerald hover:bg-emerald-400 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] text-sm md:text-base">
            <ShieldCheck size={18} />
            <span>สมัคร Partner</span>
          </button>
          
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 px-5 py-2.5 md:px-6 md:py-3 rounded-sm font-semibold transition-all backdrop-blur-sm text-sm md:text-base group">
            <Cpu size={18} className="text-cyber-blue" />
            <span>ค้นหาอะไหล่</span>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. Decorative Tech Elements (โชว์เฉพาะหน้าจอใหญ่) */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 z-20 opacity-40">
        <div className="w-16 h-1 bg-cyber-emerald rounded-sm"></div>
        <div className="w-12 h-1 bg-slate-600 rounded-sm"></div>
        <div className="w-24 h-1 bg-slate-600 rounded-sm"></div>
        <div className="w-8 h-1 bg-cyber-blue rounded-sm"></div>
      </div>
    </div>
  );
};

export default HeroBanner;