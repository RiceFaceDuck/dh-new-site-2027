import { CheckCircle, ShieldCheck } from 'lucide-react';

export default function ImportResultSummary({ importResult, onClose }) {
  return (
    <div className="text-center py-10 space-y-4">
      <CheckCircle size={64} className="text-green-500 mx-auto" />
      <h3 className="text-2xl font-bold">นำเข้าข้อมูลเสร็จสิ้น!</h3>
      <div className="bg-dh-surface p-6 rounded-xl border border-dh-border max-w-md mx-auto space-y-3.5 shadow-xs text-left">
        <div className="flex justify-between items-center font-medium">
          <span className="text-dh-muted text-sm">บันทึกสำเร็จ (สินค้าใหม่ / ข้อมูลเปลี่ยน):</span>
          <span className="text-green-500 font-black text-base">{importResult.successCount?.toLocaleString()} รายการ</span>
        </div>
        <div className="flex justify-between items-center font-medium">
          <span className="text-dh-muted text-sm">ข้าม (ข้อมูลเดิมตรงกัน 100%):</span>
          <span className="text-slate-500 font-black text-base">{importResult.skippedCount?.toLocaleString()} รายการ</span>
        </div>
        {importResult.skippedCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
            <ShieldCheck size={18} className="shrink-0" />
            <span>ประหยัดโควต้า: ข้าม {importResult.skippedCount.toLocaleString()} รายการที่ข้อมูลคงเดิม ไม่เสียค่าเขียน Firestore ฟรี</span>
          </div>
        )}
      </div>
      <button 
        onClick={onClose} 
        className="mt-6 px-8 py-3 bg-dh-accent text-white rounded-xl font-bold hover:bg-dh-accent-hover shadow-xs transition-transform active:scale-95 cursor-pointer"
      >
        ปิดหน้าต่าง
      </button>
    </div>
  );
}
