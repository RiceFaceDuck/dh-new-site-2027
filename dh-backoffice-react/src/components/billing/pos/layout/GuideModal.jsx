import React from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function GuideModal({ setIsGuideModalOpen }) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setIsGuideModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-[#EFF2F9]">
                    <h2 className="text-base font-black text-[#2A305A] flex items-center gap-2"><HelpCircle size={18} className="text-[#D51C39]"/> คู่มือการใช้งาน: เปิดบิลการขาย</h2>
                    <button onClick={() => setIsGuideModalOpen(false)} className="text-gray-400 hover:text-[#D51C39] transition-colors"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-sm text-gray-700">
                    
                    <section>
                        <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">1. โซนตะกร้าสินค้า (ซ้ายบน)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>การค้นหาสินค้า:</strong> กด <code>F3</code> เพื่อพิมพ์ค้นหา หรือใช้เครื่องยิงบาร์โค้ดสแกนได้ทันที</li>
                            <li><strong>การแก้ไขรายการ:</strong> คลิกที่ชื่อสินค้าเพื่อแก้ไขจำนวนหรือส่วนลดรายชิ้น หรือกดปุ่ม <code>-</code> / <code>+</code> ด้านขวา</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">2. โซนตั้งค่าบิล (ขวามือ)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>การเลือกลูกค้า:</strong> ค้นหาด้วยชื่อหรือเบอร์โทร หากเป็นลูกค้าใหม่สามารถกด "ดึงข้อมูลจากระบบ" เพื่อกรอกอัตโนมัติ</li>
                            <li><strong>รูปแบบบิลและ VAT:</strong> เลือกระดับราคา (B2B/ปลีก) และรูปแบบภาษี (ไม่มี VAT, รวม VAT, แยก VAT) ตามที่ต้องการ</li>
                            <li><strong>ค่าจัดส่งและส่วนลด:</strong> มีปุ่มลัดสำหรับใส่ค่าส่งด่วน (เช่น +40, +60) หรือส่วนลดทันที</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">3. โซนชำระเงิน (ด้านล่าง)</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>การยุบแผง:</strong> แผงสรุปเงินจะยุบอัตโนมัติเพื่อให้หน้าจอกว้างขึ้น คุณสามารถกด <code>ล็อค</code> (ไอคอนกุญแจ) เพื่อเปิดค้างไว้ได้</li>
                            <li><strong>การรับชำระ:</strong> ระบุยอดเงินสด หรือกด <code>พอดี</code> เพื่อรับเงินสดแบบรวดเร็ว หากโอนเงินสามารถแนบสลิปผ่านปุ่มแนบไฟล์ หรือกด <code>Ctrl+V</code> เพื่อวางสลิป</li>
                            <li><strong>ปุ่มลัดยืนยัน:</strong> สามารถกด <code>Ctrl + Enter</code> เพื่อยืนยันการรับชำระเงิน (Paid) อย่างรวดเร็ว</li>
                        </ul>
                    </section>

                </div>
            </div>
        </div>
    );
}
