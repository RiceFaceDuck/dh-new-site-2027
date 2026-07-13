import { BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function CoreGuide() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 h-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        <BookOpen className="text-emerald-500" size={24} />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          คู่มือการจัดการระบบหลัก
        </h2>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* ตำรา / คำอธิบาย */}
        <section>
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center">1</span>
            อธิบายระบบ Sharding
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-100 dark:border-slate-700">
            ปกติ Firestore มีข้อจำกัดในการเขียนข้อมูลลง Document เดียวได้ไม่เกิน <strong className="text-rose-500">1 ครั้งต่อวินาที</strong> 
            ทำให้เมื่อมีการออกบิลพร้อมกันจำนวนมาก ระบบอาจเกิดปัญหาคอขวด (Transaction Contention)
            ระบบ <strong>Distributed Counters</strong> จะทำการแยกชุดตัวเลขออกเป็นหลายๆ ชุด (Shards) เพื่อกระจายภาระนี้
          </p>
        </section>

        {/* วิธีการใช้งาน */}
        <section>
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">2</span>
            การตั้งค่า
          </h3>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xs border border-slate-100 dark:border-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>เปิดใช้งานเมื่อมีการทำรายการจำนวนมากในเวลาเดียวกัน (เช่น Flash Sale)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>ปรับ <strong>Max Shards</strong> เพิ่มขึ้นหากยังพบปัญหาคอขวด (แนะนำที่ 5)</span>
            </li>
          </ul>
        </section>

        {/* เทคนิค */}
        <section>
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center">3</span>
            Tips & Tricks
          </h3>
          <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700/50">
            <div className="flex gap-3">
              <Lightbulb className="text-amber-500 shrink-0" size={20} />
              <p className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed">
                หมายเลขบิลจะมีการแทรก Shard ID เข้าไป เช่น <code className="bg-amber-100 dark:bg-amber-800/50 px-1.5 py-0.5 rounded-sm text-amber-900 dark:text-amber-100">DH-2024-T3-0001</code>
                ซึ่ง <strong>T3</strong> คือ Shard ที่ 3 ของระบบ
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
