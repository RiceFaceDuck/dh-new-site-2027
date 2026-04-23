import React from 'react';

const HeroBanner = () => {
  return (
    <div className="relative w-full h-48 sm:h-56 md:h-72 lg:h-80 rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-12 flex items-center group shadow-2xl shadow-emerald-900/10 border border-emerald-900/5">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 z-10 opacity-100"></div>
      {/* แสง/เงา ประดับ */}
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full z-10"></div>
      <div className="absolute right-0 bottom-0 w-80 h-80 bg-teal-500/10 blur-[100px] rounded-full z-10"></div>

      <div className="relative z-20 px-6 sm:px-10 md:px-16 w-full flex flex-col items-start">
        <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-md text-white/95 text-[10px] md:text-xs font-bold tracking-widest mb-4 uppercase border border-white/10 shadow-sm">
          Partner Program 2026
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight drop-shadow-md">
          ศูนย์รวมอะไหล่ไอที ราคาส่ง
        </h1>
        <p className="text-emerald-100/90 text-sm md:text-base max-w-lg hidden sm:block font-medium drop-shadow-sm leading-relaxed">
          นำเข้าและจัดจำหน่ายอะไหล่โน๊ตบุ๊คครบวงจร สมัครพาร์ทเนอร์วันนี้ รับส่วนลดพิเศษและระบบบริหารจัดการร้านค้าฟรี
        </p>
      </div>
    </div>
  );
};

export default HeroBanner;