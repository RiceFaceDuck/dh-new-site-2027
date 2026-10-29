import React from 'react';
import { Globe, Clock } from 'lucide-react';
import { useWebTrafficStats } from './hooks/useWebTrafficStats';

/**
 * คอมโพเนนต์แสดงสถิติการเข้าชมหน้าเว็บ สไตล์โปรแกรมสมัยเก่า (Classic Retro Desktop UI)
 * การ์ดขนาดกะทัดรัด ตัวเลขชัดเจน สบายตา ป้ายนิ่งสงบ ไม่รบกวนสายตา
 */
export const WebTrafficCard = () => {
  const { stats, loading } = useWebTrafficStats();

  const items = [
    { label: 'เมื่อวาน', value: stats.yesterday },
    { label: '7 วันล่าสุด', value: stats.last7Days },
    { label: '30 วันล่าสุด', value: stats.last30Days },
    { label: 'ทั้งหมด', value: stats.allTime }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[2px] shadow-sm overflow-hidden">
      {/* Title Bar สไตล์โปรแกรมคลาสสิก */}
      <div className="bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-semibold tracking-wide">
          <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span>สถิติการเข้าชมหน้าเว็บ</span>
        </div>

        {/* ป้ายแสดงวันเวลาอัปเดตล่าสุด (Calm UI Invariant - นิ่ง ไม่กระพริบ) */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded-[2px]">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>อัปเดตล่าสุด: {loading ? 'กำลังโหลด...' : stats.lastUpdatedText}</span>
        </div>
      </div>

      {/* Grid 4 คอลัมน์ ขนาดกะทัดรัด */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 dark:divide-slate-700 bg-white dark:bg-slate-900">
        {items.map((item, index) => (
          <div key={index} className="p-2.5 sm:p-3 flex flex-col justify-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {item.label}
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold font-mono text-slate-800 dark:text-slate-100 tracking-tight">
                {loading ? '-' : Number(item.value).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">ครั้ง</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
