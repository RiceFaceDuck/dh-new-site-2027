import React from 'react';
import GuidePanel from '../../../../components/common/GuidePanel';

const DataRepairGuide = () => {
  return (
    <GuidePanel title="คู่มือเครื่องมือ Data Repair System">
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-dh-gray-800">📖 Data Repair System คืออะไร?</h4>
          <p className="text-dh-muted text-sm mt-1">
            คือระบบตรวจสอบและซ่อมแซมข้อมูลอัตโนมัติ ออกแบบมาเพื่อค้นหาปัญหาข้อมูลไม่ซิงค์กัน เช่น ออเดอร์ที่ถูกยกเลิกแล้วแต่เงินใน Wallet ไม่ได้คืน (ขัดข้องชั่วคราว) หรือ แต้ม Credit Point ของลูกค้าคำนวณสะสมไม่ตรงกับประวัติจริง
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-dh-gray-800">🛠 วิธีการใช้งาน</h4>
          <ol className="list-decimal list-inside text-dh-muted text-sm mt-1 space-y-1">
            <li>กดปุ่ม <span className="font-semibold text-amber-600">ตรวจสอบความถูกต้องของแต้ม (Points)</span> เพื่อสแกนหาลูกค้าที่แต้มเพี้ยน</li>
            <li>กดปุ่ม <span className="font-semibold text-blue-600">สแกนบิลที่ผิดปกติ (Orders)</span> เพื่อหาบิลที่คืนเงินไม่สำเร็จ</li>
            <li>หากพบปัญหา ระบบจะแสดงรายการขึ้นมาในตารางด้านล่าง</li>
            <li>กดปุ่ม <span className="font-semibold text-emerald-600">ซ่อมแซม (Fix)</span> ในรายการที่คุณต้องการ ระบบจะทำการซ่อมแซมและบันทึกประวัติให้โดยอัตโนมัติ</li>
          </ol>
        </div>

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-sm">
          <span className="font-semibold">💡 Tips:</span> การกดซ่อมแซมแต้ม (Credit Points) ระบบจะทำการคำนวณแต้มใหม่ทั้งหมดจากประวัติ `credit_transactions` ตั้งแต่วันแรกที่สมัคร เพื่อให้ได้แต้มที่ถูกต้อง 100% เสมอ
        </div>
      </div>
    </GuidePanel>
  );
};

export default DataRepairGuide;
