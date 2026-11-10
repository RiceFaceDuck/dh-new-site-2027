import React from 'react';
import { Globe } from 'lucide-react';

/**
 * คอมโพเนนต์แสดงยอดผู้เข้าชมเว็บไซต์ All-Time (Pure UI Component)
 * - Calm UI Invariant: ป้ายนิ่ง ไม่กระพริบ ไม่เคลื่อนไหวรบกวนสายตา
 * - UI Border Radius Invariant: ใช้ความโค้งมนระดับ 0.1 (rounded-[2px]) ในโหมด Card
 * - Borderless PC Invariant: ใน Footer PC แสดงผลแบบคลีน ไร้ขอบ (No border) และไร้รูปทรงกล่องแยก (No shapes)
 * 
 * @param {Object} props
 * @param {string} props.count ตัวเลขยอดผู้เข้าชมที่จัดรูปแบบแล้ว
 * @param {boolean} props.loading สถานะกำลังโหลด
 * @param {'footer-dark' | 'mobile-card'} props.variant โหมดการแสดงผล
 */
export const VisitorCounterBadge = ({ count, loading = false, variant = 'footer-dark' }) => {
  if (variant === 'mobile-card') {
    return (
      <div 
        className="inline-flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 px-5 py-2.5 rounded-[2px] shadow-[0_4px_14px_-2px_rgba(0,0,0,0.08)] select-none transition-all text-xs sm:text-sm"
        title="สถิติผู้เข้าชมเว็บไซต์ทั้งหมด (All-time)"
      >
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Globe className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold tracking-tight">ผู้เข้าชมทั้งหมด:</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex items-baseline gap-1.5 font-mono font-bold text-sky-600 dark:text-sky-400">
          <span className="text-sm sm:text-base tracking-tight">{loading ? '...' : count}</span>
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 font-sans">ครั้ง</span>
        </div>
      </div>
    );
  }

  // โหมด Default: footer-dark สำหรับแสดงใน Footer PC ใต้ Trust Badges (ไร้ขอบ ไม่เอารูปทรงกล่อง)
  return (
    <div 
      className="flex items-center justify-between gap-3 px-1 py-1.5 select-none transition-colors"
      title="สถิติผู้เข้าชมเว็บไซต์ทั้งหมด (All-time)"
    >
      <div className="flex items-center gap-2 text-slate-400">
        <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="text-[11px] font-medium tracking-tight text-slate-400">ผู้เข้าชมทั้งหมด:</span>
      </div>
      <div className="flex items-baseline gap-1 font-mono font-bold text-sky-400">
        <span className="text-sm tracking-tight">{loading ? '...' : count}</span>
        <span className="text-[10px] font-normal text-slate-500 font-sans">ครั้ง</span>
      </div>
    </div>
  );
};

export default VisitorCounterBadge;
