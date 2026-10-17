import { HelpCircle, ShieldCheck, CheckCircle2, AlertTriangle, Smartphone } from 'lucide-react';

export default function PaymentGuide() {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
        <HelpCircle className="w-5 h-5 text-amber-500" />
        <h3 className="font-black text-slate-900 dark:text-white text-base">
          คู่มือการตั้งค่าบัญชีรับเงิน
        </h3>
      </div>

      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            1. ข้อมูลที่แสดงบนหน้าเว็บลูกค้า
          </h4>
          <p>
            เมื่อลูกค้าดำเนินการสั่งซื้อที่หน้า Checkout ระบบจะดึงเลขบัญชีและชื่อบัญชีนี้ไปแสดงในกล่องโอนเงินธนาคารทันที พร้อมปุ่มกดคัดลอกเลขบัญชีแบบ One-Click
          </p>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-500" />
            2. ความปลอดภัยและการแคชข้อมูล
          </h4>
          <p>
            ระบบหน้าบ้านใช้เทคโนโลยี Caching 15 นาที เพื่อประหยัดโควต้าการอ่านฐานข้อมูล Firestore (0 Reads ซ้ำซ้อน) เมื่อบันทึกการแก้ไข ข้อมูลจะอัปเดตอัตโนมัติ
          </p>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <Smartphone size={14} className="text-purple-500" />
            3. บัญชีเริ่มต้นของระบบ (Default)
          </h4>
          <p>
            ระบบตั้งค่าเริ่มต้นเป็น <strong>ธนาคารกรุงศรีอยุธยา (Krungsri)</strong> เลขที่บัญชี <strong>692-1-14458-6</strong> ชื่อบัญชี <strong>นายเหว่ย ไห</strong> ซึ่งสามารถปรับเปลี่ยนได้ตามต้องการ
          </p>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0 text-amber-600" />
            โปรดตรวจทานเลขที่บัญชีและชื่อบัญชีให้ถูกต้อง 100% ทุกครั้งก่อนกดบันทึก เพื่อป้องกันลูกค้าโอนเงินผิดบัญชี
          </p>
        </div>
      </div>
    </div>
  );
}
