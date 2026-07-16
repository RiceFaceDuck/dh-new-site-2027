const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '.agents', 'memory', 'Audit Checklist.md');
let content = fs.readFileSync(filePath, 'utf8');

const newAuditLines = `
@ID:P2-UX-050 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟡PENDING | @EV:Pending fix | @REF:Accessibility Guidelines | @TASK: Verify that [APP:Frontend] ตรวจสอบปุ่ม Icon (เช่น ค้นหาใน SearchPage) ว่ามีการใส่ aria-label หรือ title เพื่อรองรับ Screen Reader และเพิ่ม Accessibility
@ID:P2-UX-051 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟡PENDING | @EV:Pending fix | @REF:Premium Web App Guidelines | @TASK: Verify that [APP:Frontend] เพิ่ม Animation (framer-motion) ใน Modal/Dialog ต่างๆ (เช่น UploadSlipModal, WholesaleRequestModal, ImageZoomModal) แทนการโผล่ขึ้นมาแข็งๆ (CSS animate-in ไม่เพียงพอสำหรับการปิด Modal อย่างสมูท)
@ID:P2-UX-052 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:Pending fix | @REF:Web Performance Standards | @TASK: Verify that [APP:Frontend] ตรวจสอบรูปภาพทั่วไปที่อยู่ต่ำกว่าส่วนแรก (Below the fold) ว่ามีการใช้ loading="lazy" อย่างครบถ้วน (นอกเหนือจาก LazyImage component)
@ID:P2-UX-053 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:Pending fix | @REF:Error Handling Guidelines | @TASK: Verify that [APP:Frontend] ตรวจสอบ Input Forms (เช่น ในหน้า Checkout, Profile) ให้มีระบบ Validation Feedback (ข้อความเตือนใต้ช่องกรอก) ที่ชัดเจนทันทีเมื่อพิมพ์ผิด แทนที่จะพึ่งพา Toast ขวาบนอย่างเดียว
`;

if (!content.includes('P2-UX-050')) {
    content += '\n# --- DEEP UX/UI AUDIT (FRONTEND) ---' + newAuditLines;
    fs.writeFileSync(filePath, content);
    console.log('Successfully appended new UX audit tasks to Audit Checklist.md');
} else {
    console.log('UX tasks already exist in the checklist.');
}
