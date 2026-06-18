import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ImportResultSummary({ importResult, onClose }) {
  return (
    <div className="text-center py-10 space-y-4">
      <CheckCircle size={64} className="text-green-500 mx-auto" />
      <h3 className="text-2xl font-bold">นำเข้าข้อมูลเสร็จสิ้น!</h3>
      <div className="bg-dh-surface p-6 rounded-xl border border-dh-border max-w-sm mx-auto space-y-3 shadow-sm">
        <div className="flex justify-between font-medium">
          <span className="text-dh-muted">นำเข้าสำเร็จ (เพิ่ม/อัพเดท):</span>
          <span className="text-green-500 font-bold">{importResult.successCount}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-dh-muted">ข้าม (ไม่แก้ไข):</span>
          <span className="text-orange-500 font-bold">{importResult.skippedCount}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-dh-muted">ส่งไปรออนุมัติ (To-do):</span>
          <span className="text-blue-500 font-bold">{importResult.todoCount}</span>
        </div>
      </div>
      <button 
        onClick={onClose} 
        className="mt-6 px-8 py-3 bg-dh-accent text-white rounded-xl font-bold hover:bg-dh-accent-hover shadow-sm transition-transform active:scale-95"
      >
        ปิดหน้าต่าง
      </button>
    </div>
  );
}
