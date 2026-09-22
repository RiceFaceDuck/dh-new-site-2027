import { ShieldAlert } from 'lucide-react';

export default function CreditSettingsGuide({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-blue-600" /> คู่มือการตั้งค่ากฎการใช้งานเครดิต (Credit Rules)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 bg-blue-50 p-2 rounded-sm border border-blue-100">📖 ตำรา / คำอธิบาย (Overview)</h3>
            <p className="text-sm text-slate-600 leading-relaxed pl-2">
              หน้านี้ใช้สำหรับตั้งค่า <b>กลไกหลักของระบบ Credit Point (Core Engine)</b> ซึ่งจะมีผลทันทีต่อระบบการเงินและเครดิตทั้งหมดในแพลตฟอร์ม ทั้งฝั่งผู้ใช้งาน (Front-end) และผู้ดูแล (Backoffice)
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 bg-emerald-50 p-2 rounded-sm border border-emerald-100">⚙️ วิธีการใช้งาน (How-to)</h3>
            <ul className="text-sm text-slate-600 space-y-2 list-decimal pl-6">
              <li><b>Security Rules:</b> เปิด/ปิด การบังคับใช้รหัสผ่าน 2 ขั้นตอนเวลาแจกพอยต์ หรือการระงับพาร์ทเนอร์อัตโนมัติหากพอยต์ติดลบ</li>
              <li><b>Credit Valuation:</b> กำหนดอัตราส่วนการได้รับพอยต์จากการซื้อของ เช่น 100 บาท ได้รับ 1 พอยต์ (Points Earning Rate)</li>
              <li><b>Ad Costing:</b> กำหนดพอยต์ที่จะถูกหักออกเมื่อโฆษณาแสดงผล (Ad Impression Cost) หรือเวลาซื้อตำแหน่ง Partner</li>
              <li>เมื่อปรับเปลี่ยนตัวเลขแล้ว ให้กดปุ่ม <b>"Save Configuration"</b> ที่ด้านล่างขวา เพื่อบันทึกลงระบบ (มีผลทันที)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 bg-amber-50 p-2 rounded-sm border border-amber-100">💡 เทคนิคการใช้งาน (Tips & Tricks)</h3>
            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-6">
              <li>คุณสามารถใช้หน้า <b>"Smart Calculator"</b> เพื่อจำลองอัตราการเบิร์น (Burn Rate) ก่อนที่จะมาปรับลด/เพิ่มค่าต่างๆ ในหน้านี้</li>
              <li>หากตั้งค่า <b>Max Transaction Limit</b> ให้ต่ำลง จะช่วยลดความเสี่ยงจากการที่ Admin เติมพอยต์ผิดพลาด (Fat-finger Error) ได้ดีมาก</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 bg-purple-50 p-2 rounded-sm border border-purple-100">🎯 ตัวอย่างผลลัพธ์ (Expected Results)</h3>
            <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 text-sm text-slate-600 space-y-2">
              <p>⚠️ <b>ข้อควรระวัง:</b> หากปรับ "Points Earning Rate" จาก 100 บาท เป็น 50 บาท จะส่งผลให้ผู้ซื้อสินค้าได้รับพอยต์ <b>เพิ่มขึ้น 2 เท่า</b> ทันทีเมื่อออเดอร์ใหม่ได้รับการอนุมัติ (Paid)</p>
              <p>ระบบจะ <b>ไม่มีผลย้อนหลัง</b> กับบิลที่อนุมัติไปแล้ว การเปลี่ยนแปลงจะเริ่มนับจากบิล หรือโฆษณาในวินาทีถัดไป</p>
            </div>
          </section>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded-sm hover:bg-slate-900 transition-colors">
            รับทราบและเข้าใจ
          </button>
        </div>
      </div>
    </div>
  );
}
