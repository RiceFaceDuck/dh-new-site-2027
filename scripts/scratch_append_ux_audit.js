const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '.agents', 'memory', 'Audit Checklist.md');
let content = fs.readFileSync(filePath, 'utf8');

const newAuditLines = `
# =====================================================================
# 🗺️ NEW UX DEEP DIVE AUDIT (Frontend UX/UI, Speed & Fluidity) - ${new Date().toISOString().split('T')[0]}
# =====================================================================
@ID:P2-UX-033 | @PHASE:Phase2 | @CAT:UX | @SEV:🟠High | @STAT:🟡PENDING | @EV:Found in Checkout.jsx; freebies and shipping_rules are fetched on every mount without cache. | @REF:Web Performance Standards | @TASK: Verify that [APP:Frontend] ปรับปรุงความลื่นไหลในหน้า Checkout.jsx โดยใช้การ Cache ข้อมูล freebies และ shipping_rules เพื่อลดอาการโหลด (Spinner) ซ้ำซ้อนเมื่อสลับหน้าไปมา
@ID:P2-UX-034 | @PHASE:Phase2 | @CAT:UX | @SEV:🔴Critical | @STAT:🟡PENDING | @EV:Found in SearchPage.jsx; search limits to 1000 items and filters client-side. If DB grows, results will be missing. | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that [APP:Frontend] แก้ไขคอขวดระบบค้นหาสินค้า (SearchPage) ที่จำกัดแค่ 1000 ชิ้น เพื่อรองรับสเกลข้อมูลขนาดใหญ่โดยที่ผู้ใช้ยังค้นเจอของครบ
@ID:P2-UX-035 | @PHASE:Phase2 | @CAT:UX | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:Found in Navbar.jsx and SearchPage.jsx; no auto-suggest or live search overlay. | @REF:Premium Web App Guidelines | @TASK: Verify that [APP:Frontend] เพิ่ม Live Search / Auto-suggest Dropdown ใน Navbar เพื่อลดขั้นตอนการเปลี่ยนหน้า และสร้างความรู้สึก Premium
@ID:P2-UX-036 | @PHASE:Phase2 | @CAT:UX | @SEV:⚪Low | @STAT:🟡PENDING | @EV:Found in CategoryPage.jsx; Infinite scroll spacer might trigger late. | @REF:UX Best Practices | @TASK: Verify that [APP:Frontend] ปรับปรุงจุด Trigger ของ Infinite Scroll ในหน้า CategoryPage ให้โหลดล่วงหน้าก่อนเลื่อนสุดจอ (Pre-fetch) ป้องกันอาการกระตุก
`;

fs.appendFileSync(filePath, newAuditLines);
console.log('Appended new UX audit findings to Audit Checklist.md');
