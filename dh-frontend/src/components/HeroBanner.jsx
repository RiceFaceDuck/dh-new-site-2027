import React from 'react';
import { ShieldCheck, Cpu, ChevronRight } from 'lucide-react';

const HeroBanner = () => {
  return (
    // ปรับลด margin ทิ้ง (ลบ mb-8 md:mb-12) และใส่ h-full พร้อมคุมสัดส่วนด้วย aspect-[16/9]
    <div className="relative w-full h-full min-h-[220px] aspect-[16/9] lg:aspect-auto rounded-md overflow-hidden flex items-center group shadow-glow-emerald border border-slate-800">
      
      {/* 1. Background Layers (Tech Grid & Gradient) */}
      <div className="absolute inset-0 bg-dh-dark z-10"></div>
      <div className="absolute inset-0 bg-tech-grid-dark opacity-40 z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-10"></div>

      {/* 2. Glow Effects (แสงเรืองแสงตกแต่ง) */}
      <div className="absolute -left-20 -top-20 w-72 h-72 bg-cyber-emerald/20 blur-[80px] rounded-full z-10 pointer-events-none"></div>
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-cyber-blue/10 blur-[100px] rounded-full z-10 pointer-events-none"></div>

      {/* 3. Content */}
      {/* ลด Padding ให้กระชับขึ้นเพื่อเตรียมรองรับ Grid แบบ 4 ป้าย */}
      <div className="relative z-20 px-5 sm:px-8 lg:px-12 py-6 w-full max-w-2xl flex flex-col items-start">
        
        {/* Title: ลด Margin ด้านล่างลงเหลือ mb-2 */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
          ยกระดับศูนย์บริการของคุณ<br className="hidden sm:block" />ด้วยอะไหล่แท้คุณภาพสูง
        </h1>

        {/* Description: เพิ่ม line-clamp-2 ป้องกันข้อความยาวจนกินพื้นที่แนวตั้ง */}
        <p className="text-slate-300 text-sm sm:text-base mb-4 sm:mb-5 max-w-lg leading-relaxed line-clamp-2">
          D.H. Notebook ผู้นำด้านอะไหล่และอุปกรณ์ไอที พร้อมสนับสนุนพาร์ทเนอร์ทุกระดับด้วยบริการที่เหนือกว่า
        </p>

        {/* Buttons Container: ใช้ flex-col หรือ row พร้อมกำหนด gap-3 ให้กระชับ */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-cyber-emerald hover:bg-emerald-400 text-white px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] text-sm md:text-base">
            <ShieldCheck size={18} />
            <span>สมัคร Partner</span>
          </button>
          
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-sm font-semibold transition-all backdrop-blur-sm text-sm md:text-base group">
            <Cpu size={18} className="text-cyber-blue" />
            <span>ค้นหาอะไหล่</span>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. Decorative Tech Elements (โชว์เฉพาะหน้าจอใหญ่) */}
      {/* ซ่อนในมือถือและ Tablet เล็กๆ เพื่อไม่ให้เกะกะเมื่ออยู่ในกรอบ Grid */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block pointer-events-none z-10">
         <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="60" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
         </svg>
      </div>
    </div>
  );
};

export default HeroBanner;