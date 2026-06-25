import React from 'react';
import { HelpCircle, Settings } from 'lucide-react';

export default function GenerateSyncHeader({ onOpenSettings, onOpenGuide }) {
  return (
    <div className="dh-header-gradient p-4 sm:p-6 relative z-10 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-none">
          ระบบจัดการและซิงค์ข้อมูลภายนอก
        </h1>
        <p className="text-[12px] text-slate-300 mt-1.5 font-bold uppercase tracking-wider hidden sm:block">
          ดาวน์โหลดเพื่ออัปเดตสต็อก หรือนำเข้าไฟล์เพื่อตัดสต็อก
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenGuide} 
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-bold border border-white/20 shadow-sm"
        >
          <HelpCircle size={18} />
          คู่มือใช้งาน
        </button>
      </div>
    </div>
  );
}
