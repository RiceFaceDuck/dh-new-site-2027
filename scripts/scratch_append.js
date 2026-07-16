const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '.agents/memory/Audit Checklist.md');
const content = fs.readFileSync(file, 'utf8');

const newAuditItems = `
@ID:P3-COST-022 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟡PENDING | @EV:None | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that [DOMAIN:Manager] ใช้ getCountFromServer() แทน getDocs() ในการนับจำนวน (เช่น adManagementService.js บรรทัด 300) เพื่อป้องกัน Quota Drain
@ID:P3-COST-023 | @PHASE:Phase3 | @CAT:COST | @SEV:🔴Critical | @STAT:🟡PENDING | @EV:None | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that [DOMAIN:Migration] จำกัด limit หรือใช้ where() ในสคริปต์ AccountMigration.jsx เพื่อป้องกันการดึง Users ทั้งระบบซ้ำๆ โดยไม่จำเป็น
@ID:P3-COST-024 | @PHASE:Phase3 | @CAT:COST | @SEV:🟠High | @STAT:🟡PENDING | @EV:None | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that [DOMAIN:Manager] หลีกเลี่ยงการใช้ snapshot.docs.length เพื่อดูจำนวนรวมใน featuredConfigService.js โดยให้เปลี่ยนไปใช้ getCountFromServer()
`;

fs.writeFileSync(file, content.trimEnd() + '\n' + newAuditItems + '\n');
console.log('Appended to Audit Checklist.md');
