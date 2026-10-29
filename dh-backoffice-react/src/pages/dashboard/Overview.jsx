import React from 'react';
import { WebTrafficCard } from '../../components/overview/WebTrafficCard';

const Overview = () => {
  return (
    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* การ์ดสถิติการเข้าชมหน้าเว็บ (ขนาดกะทัดรัด สไตล์โปรแกรมสมัยเก่า) */}
        <section>
          <WebTrafficCard />
        </section>

        {/* โซนพื้นที่สำหรับวิดเจ็ตอื่นๆ ในอนาคต */}
        <section className="border border-dashed border-slate-300 dark:border-slate-700 rounded-[2px] p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-mono bg-white/50 dark:bg-slate-800/30">
          [ พื้นที่ว่างสำหรับข้อมูลสรุปและวิดเจ็ตเพิ่มเติม ]
        </section>
      </div>
    </div>
  );
};

export default Overview;
