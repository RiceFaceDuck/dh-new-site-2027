const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '.agents', 'memory', 'Audit Checklist.md');
let content = fs.readFileSync(filePath, 'utf-8');

const appendText = `

# --- SYSTEM STABILITY DEEP DIVE AUDIT (JULY 2026 - NEW VULNERABILITIES FOUND) ---
@ID:P3-STB-005 | @PHASE:Phase3 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟡PENDING | @EV:Found >20 instances of hardcoded \`doc(db, 'collection', ...)\` and \`collection(db, 'collection')\` instead of \`getCollectionPath()\` across backoffice (e.g. adManagementService.js, billingStatusTransaction.js, claimActionService.js) and frontend. | @REF:COGNITIVE_INDEX.md | @TASK: Verify that Hardcoded Firebase Collections: ป้องกันข้อมูล Test/Prod รั่วไหลหากสลับ environment
@ID:P3-STB-006 | @PHASE:Phase3 | @CAT:CODE | @SEV:🟠High | @STAT:🟡PENDING | @EV:Found >10 instances of \`.then()\` missing \`.catch()\` handling (e.g. OrderSummaryItems.jsx, InventoryHeader.jsx, CartItemCard.jsx). | @REF:Promise Handling | @TASK: Verify that Unhandled Promises: เพิ่ม .catch() ป้องกันแอพค้างเงียบเวลาเน็ตหลุดหรือ dynamic import ล้มเหลว
@ID:P3-STB-007 | @PHASE:Phase3 | @CAT:CODE | @SEV:🟡Medium | @STAT:🟡PENDING | @EV:Found 14 instances of \`eslint-disable-next-line react-hooks/exhaustive-deps\` (e.g. Checkout.jsx, PrivilegeSelector.jsx, SettingsPanel.jsx) that could cause Stale Closures | @REF:React Hooks Rules | @TASK: Verify that Stale Closures (React Hooks): แก้ไข Exhaustive-deps warning อย่างถูกต้องแทนการปิดแจ้งเตือน
`;

if (!content.includes('P3-STB-005')) {
  fs.writeFileSync(filePath, content + appendText);
  console.log('Appended successfully');
} else {
  console.log('Already appended');
}
