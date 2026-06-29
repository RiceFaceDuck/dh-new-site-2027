import React from 'react';
import { HelpCircle, X, BookOpen, ListOrdered, Lightbulb, AlertTriangle } from 'lucide-react';

export default function ManualModal({ isManualModalOpen, setIsManualModalOpen }) {
  if (!isManualModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-dh-surface rounded-xl shadow-dh-elevated w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-dh-border flex flex-col max-h-[85vh]">
        <div className="bg-dh-base px-5 py-4 border-b border-dh-border flex justify-between items-center shrink-0">
          <h3 className="font-bold text-dh-main flex items-center gap-2 text-base">
            <HelpCircle size={18} className="text-dh-accent"/>
            คู่มือการใช้งานระบบ Product Search+
          </h3>
          <button onClick={() => setIsManualModalOpen(false)} className="text-dh-muted hover:text-dh-main p-1.5 rounded-md hover:bg-dh-border/50 transition-colors">
            <X size={18}/>
          </button>
        </div>
        
        <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-dh-surface">
          <div className="p-5 space-y-6 text-sm text-dh-main">
            
            {/* 1. ตำรา / คำอธิบาย */}
            <section>
              <h4 className="flex items-center gap-2 font-bold text-dh-accent mb-2 pb-1 border-b border-dh-border/50">
                <BookOpen size={16} /> ตำรา / คำอธิบาย
              </h4>
              <p className="text-dh-muted leading-relaxed pl-6">
                ระบบ <strong>Zero-Read Search</strong> คือระบบค้นหาสินค้าอัจฉริยะที่ออกแบบมาเพื่อลดระยะเวลาและประหยัดทรัพยากรการดึงข้อมูล (Reads) ของฐานข้อมูล ช่วยให้คุณสามารถหาสินค้าได้รวดเร็วแบบ Real-time โดยไม่ต้องกด Enter และกรองข้อมูลได้ละเอียดขึ้นด้วยคีย์เวิร์ดหลายชั้น
              </p>
            </section>

            {/* 2. วิธีการใช้งาน (How-to) */}
            <section>
              <h4 className="flex items-center gap-2 font-bold text-blue-600 mb-2 pb-1 border-b border-dh-border/50">
                <ListOrdered size={16} /> วิธีการใช้งาน (How-to)
              </h4>
              <ol className="list-decimal pl-10 space-y-2 text-dh-muted">
                <li>พิมพ์คำค้นหาหลักลงในช่อง <strong className="text-yellow-600">K1 (คีย์เวิร์ดหลัก)</strong> เช่น ชื่อรุ่น, แบรนด์, หรือ SKU</li>
                <li>หากผลลัพธ์ยังกว้างไป ให้พิมพ์เงื่อนไขเพิ่มเติมในช่อง <strong className="text-cyan-600">K2 (กรองเพิ่มเติม)</strong> เช่น สี, ขนาด</li>
                <li>หากต้องการเจาะจงเฉพาะจุด ให้ใช้ช่อง <strong className="text-pink-600">K3 (เจาะจงเฉพาะ)</strong> เพื่อจำกัดผลลัพธ์ให้แคบที่สุด</li>
                <li>คลิกที่รายการสินค้าในแถบด้านซ้าย เพื่อดูรายละเอียดและประวัติในแถบด้านขวา</li>
              </ol>
            </section>

            {/* 3. เทคนิคการใช้งาน (Tips & Tricks) */}
            <section>
              <h4 className="flex items-center gap-2 font-bold text-amber-500 mb-2 pb-1 border-b border-dh-border/50">
                <Lightbulb size={16} /> เทคนิคการใช้งาน (Tips & Tricks)
              </h4>
              <ul className="space-y-2.5 pl-6">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                  <div>
                    <strong>Shortcut Key:</strong> กด <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1 text-xs">Ctrl</kbd> + <kbd className="bg-dh-base border border-dh-border text-dh-main rounded px-1.5 py-0.5 shadow-sm mx-1 text-xs">F</kbd> เพื่อโฟกัสไปที่ช่องค้นหาได้ทันทีโดยไม่ต้องใช้เมาส์
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                  <div>
                    <strong>Quick Copy:</strong> ในหน้ารายละเอียดสินค้า (ตรงกลาง) สามารถกดปุ่ม <strong>"คัดลอกลงแชต"</strong> เพื่อคัดลอกรหัส, ชื่อ, ราคา และคำลงท้าย (ครับ/ค่ะ) ไปวางให้ลูกค้าได้ทันที
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                  <div>
                    <strong>Clear All:</strong> กดปุ่มกากบาท <kbd className="bg-dh-base border border-dh-border text-dh-muted rounded px-1 py-0.5 text-[10px] mx-1">X</kbd> หรือปุ่ม "ล้างค่า" เพื่อรีเซ็ตการค้นหาทั้งหมดอย่างรวดเร็ว
                  </div>
                </li>
              </ul>
            </section>

            {/* 4. ตัวอย่างผลลัพธ์ (Expected Results) */}
            <section>
              <h4 className="flex items-center gap-2 font-bold text-red-500 mb-2 pb-1 border-b border-dh-border/50">
                <AlertTriangle size={16} /> ตัวอย่างผลลัพธ์และข้อควรระวัง (Expected Results)
              </h4>
              <div className="pl-6 space-y-3 text-dh-muted">
                <p>ระบบจะแสดงสถานะสต๊อกของสินค้าในผลลัพธ์การค้นหา โปรดสังเกตสีและข้อความต่อไปนี้ก่อนทำการขาย:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-dh-surface border border-dh-border p-3 rounded-lg flex items-center gap-3 shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></div>
                    <div className="text-xs">
                      <strong className="text-emerald-700 block">พร้อมขาย</strong>
                      มีสินค้าในสต๊อกมากกว่า 2 ชิ้น
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3 shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shrink-0"></div>
                    <div className="text-xs">
                      <strong className="text-yellow-700 block">ใกล้หมด</strong>
                      มีสินค้าเหลือ 1-2 ชิ้น ตรวจสอบสต๊อกจริงก่อนขาย
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-3 shadow-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0 animate-pulse"></div>
                    <div className="text-xs">
                      <strong className="text-red-700 block">หมดสต๊อก</strong>
                      สินค้าหมด ห้ามรับออเดอร์ หรือเช็คคิวของเข้า
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
        
        <div className="bg-dh-base px-5 py-3 border-t border-dh-border flex justify-end shrink-0">
           <button onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 bg-dh-accent text-white font-semibold rounded-lg hover:bg-dh-accent/90 transition-colors text-sm shadow-sm">
             รับทราบ
           </button>
        </div>
      </div>
    </div>
  );
}
