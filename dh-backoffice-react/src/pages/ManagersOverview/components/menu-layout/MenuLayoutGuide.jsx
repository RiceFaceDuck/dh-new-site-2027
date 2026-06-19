import React from 'react';
import { GripVertical } from 'lucide-react';

export default function MenuLayoutGuide() {
  return (
    <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 shadow-sm">
      <h3 className="font-black text-blue-700 flex items-center gap-2 mb-2">
        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">?</span>
        คู่มือการจัดเรียงเมนู (Manual)
      </h3>
      <div className="space-y-2 pl-7">
        <p><b>ฟีเจอร์นี้คืออะไร?:</b> ระบบสำหรับจัดการและจัดกลุ่มปุ่มลัด (Quick Access) ในหน้า Dashboard ของผู้จัดการ</p>
        <p><b>วิธีใช้งาน (How-to):</b> 
          1. ลากไอคอน <GripVertical size={14} className="inline text-slate-400"/> หน้าชื่อเมนู เพื่อสลับตำแหน่ง <br/>
          2. สร้างโซนใหม่ด้วยปุ่ม "สร้างโซนใหม่" ด้านล่าง <br/>
          3. ดึงเมนูที่ถูกซ่อนกลับมา โดยเลือกจาก Dropdown ใต้โซนนั้นๆ <br/>
          4. กด "บันทึกเลย์เอาต์" เพื่อใช้งาน
        </p>
        <p><b>เทคนิค (Tips):</b> คุณสามารถซ่อนเมนูที่ไม่ค่อยได้ใช้ โดยการชี้เมาส์ที่เมนูแล้วกดปุ่มกากบาทสีแดง เพื่อให้ Dashboard ดูสะอาดขึ้น</p>
        <p><b>ผลลัพธ์ (Expected Results):</b> เลย์เอาต์ใหม่จะอัปเดตทันทีสำหรับผู้จัดการ "ทุกคน" ในระบบส่วนกลาง (Global Settings)</p>
      </div>
    </div>
  );
}
