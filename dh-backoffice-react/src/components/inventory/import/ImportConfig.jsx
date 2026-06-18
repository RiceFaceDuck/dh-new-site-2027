import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ImportConfig({ conflictStrategy, setConflictStrategy }) {
  return (
    <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-xl space-y-3">
      <div className="flex items-start gap-3 text-orange-600 dark:text-orange-400">
        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">การจัดการข้อมูลซ้ำซ้อน (SKU Conflict)</h4>
          <p className="text-sm opacity-90 mt-1">
            กรุณาเลือกว่าจะทำอย่างไร หากระบบพบว่ามี SKU ในไฟล์ที่ตรงกับสินค้าเดิมที่มีอยู่ในฐานข้อมูลแล้ว
          </p>
        </div>
      </div>
      <div className="ml-8">
        <select 
          value={conflictStrategy}
          onChange={(e) => setConflictStrategy(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 bg-dh-surface border border-orange-500/30 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold"
        >
          <option value="todo">ส่งงานไปพักรอที่ To-do (เพื่อรอตรวจสอบทีละรายการ)</option>
          <option value="overwrite">อัพเดทข้อมูลทับข้อมูลเก่าทันที</option>
          <option value="skip">ข้ามรายการนั้นไป (ไม่แก้ไขของเดิม)</option>
        </select>
      </div>
    </div>
  );
}
