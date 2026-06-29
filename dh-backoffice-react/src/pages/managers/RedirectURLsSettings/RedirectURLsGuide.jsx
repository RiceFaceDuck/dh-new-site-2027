import React from 'react';
import { ArrowRightLeft, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RedirectURLsGuide() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <ArrowRightLeft size={20} />
        </div>
        <div>
          <h3 className="font-black text-indigo-900 text-lg">คู่มือการตั้งค่า Redirect URLs</h3>
          <p className="text-sm font-semibold text-indigo-600/80">ระบบจัดการการเปลี่ยนเส้นทางลิงก์เพื่อป้องกัน 404 Error และเพิ่มประสิทธิภาพ SEO</p>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: ตำรา & วิธีการ */}
        <div className="space-y-6">
          
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600">1</span>
              ฟีเจอร์นี้คืออะไร?
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-medium pl-8">
              เมื่อมีการลบหน้าเว็บหรือเปลี่ยน URL ใหม่ ลิงก์เก่าจะกลายเป็นหน้า <strong>ไม่พบข้อมูล (404 Error)</strong> 
              การใช้ Redirect จะช่วยส่งลูกค้าจาก "ลิงก์เก่า" ไปยัง "ลิงก์ใหม่" โดยอัตโนมัติ ซึ่งดีต่อทั้งประสบการณ์ผู้ใช้และคะแนน SEO บน Google
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600">2</span>
              วิธีการใช้งาน (How-to)
            </h4>
            <ul className="text-sm text-slate-600 space-y-2 pl-8 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>กดปุ่ม <strong>"เพิ่ม Redirect ใหม่"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>ช่อง <strong>URL เดิม</strong>: ใส่ลิงก์เก่าที่ต้องการเปลี่ยน (เช่น <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/old-product</code>)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>ช่อง <strong>URL ใหม่</strong>: ใส่ลิงก์ปลายทาง (เช่น <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/new-product</code> หรือ <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">https://...</code>)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Column 2: Tips & Expected */}
        <div className="space-y-6">
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
              <Lightbulb size={18} />
              เทคนิคการใช้งาน (Tips & Tricks)
            </h4>
            <ul className="text-sm text-amber-700/90 space-y-2 font-medium">
              <li>• สามารถใช้ทำ <strong>ลิงก์สั้น (Short Link)</strong> สำหรับโปรโมทแคมเปญได้ เช่น ตั้งค่า <code className="bg-amber-100/50 px-1 py-0.5 rounded">/promo24</code> ให้ชี้ไปยังหน้าสินค้ายาวๆ</li>
              <li>• หากต้องการยกเลิกการ Redirect ชั่วคราว ให้กดปิดสถานะ <strong className="text-slate-700">"เปิดใช้งาน"</strong> โดยไม่ต้องลบข้อมูลทิ้ง</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h4 className="font-bold text-red-800 flex items-center gap-2 mb-2">
              <AlertTriangle size={18} />
              ข้อควรระวัง (Expected Results)
            </h4>
            <p className="text-sm text-red-700/90 leading-relaxed font-medium">
              อย่าตั้งค่า URL เดิม และ URL ใหม่ ให้เป็นค่าเดียวกันเด็ดขาด เพราะจะทำให้เกิดการ <strong>Redirect วนลูป (Infinite Loop)</strong> และลูกค้าจะไม่สามารถเข้าหน้านั้นได้
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
