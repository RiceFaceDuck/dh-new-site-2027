import React from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function ManualModal({ isManualModalOpen, setIsManualModalOpen }) {
  if (!isManualModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-dh-surface rounded-xl shadow-dh-elevated w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border">
        <div className="bg-dh-base px-5 py-3 border-b border-dh-border flex justify-between items-center">
          <h3 className="font-bold text-dh-main flex items-center gap-2 text-sm">
            <HelpCircle size={16} className="text-dh-accent"/>
            คู่มือการใช้งาน Product Search+
          </h3>
          <button onClick={() => setIsManualModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1 rounded-md hover:bg-dh-border/50 transition-colors">
            <X size={16}/>
          </button>
        </div>
        <div className="p-5 space-y-3 text-xs text-dh-main bg-dh-surface">
          <p className="font-semibold text-dh-accent">ระบบ Zero-Read Search ลดเวลาในการหาสินค้า</p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1 shrink-0"></div>
              <div>ช่อง <strong>K1 (คีย์เวิร์ดหลัก)</strong>: สำหรับใส่คำค้นหาหลัก เช่น ชื่อรุ่น หรือ แบรนด์</div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0"></div>
              <div>ช่อง <strong>K2 และ K3</strong>: สำหรับกรองข้อมูลให้แคบลง เช่น สี, ขนาด, หรือจุดสังเกต</div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-dh-muted mt-1 shrink-0"></div>
              <div>
                ใช้คีย์ลัด <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1">Ctrl</kbd> + <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1">F</kbd> เพื่อเริ่มค้นหาได้ทันทีโดยไม่ต้องใช้เมาส์คลิก
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-dh-muted mt-1 shrink-0"></div>
              <div>
                ปุ่ม <kbd className="bg-dh-base border border-dh-border text-dh-muted rounded px-1 py-0.5 text-[10px] mx-1">X</kbd> ภายในช่องค้นหา และปุ่ม <strong>ล้างค่า</strong> เพื่อความรวดเร็วในการ Reset
              </div>
            </li>
            <li className="flex items-start gap-2 bg-red-50/50 p-2 rounded-md border border-red-100">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
              <div className="text-red-700">
                หากเจอคำว่า <strong>หมดสต๊อก</strong> หรือ <strong className="text-yellow-600">ใกล้หมด</strong> ให้ระมัดระวังในการขาย
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
