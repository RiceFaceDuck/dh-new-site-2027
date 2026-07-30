import { AlertTriangle } from 'lucide-react';

export default function ImportConfig({ conflictStrategy, setConflictStrategy }) {
  return (
    <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-xl space-y-3">
      <div className="flex items-start gap-3 text-orange-600 dark:text-orange-400">
        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">การจัดการข้อมูลที่มีอยู่แล้ว (Conflict Resolution)</h4>
          <p className="text-sm opacity-90 mt-1">
            ระบบพบว่ามีรายการสินค้าในไฟล์ตรงกับสินค้าเดิม กรุณาเลือกว่าจะดำเนินการอย่างไรกับข้อมูลเหล่านั้น
          </p>
        </div>
      </div>
      <div className="ml-8">
        <select 
          value={conflictStrategy}
          onChange={(e) => setConflictStrategy(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 bg-dh-surface border border-orange-500/30 rounded-xl outline-hidden focus:ring-2 focus:ring-orange-500 text-sm font-bold"
        >
          <option value="skip">ข้าม (Skip) - ไม่แก้ไขข้อมูลเดิม</option>
          <option value="overwrite">เขียนทับ (Overwrite) - อัพเดทข้อมูลตามไฟล์ Excel ทันที</option>
        </select>
      </div>
    </div>
  );
}
