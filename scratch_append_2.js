const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '.agents/memory/Audit Checklist.md');
const content = fs.readFileSync(file, 'utf8');

const newAuditItem = `
@ID:P3-COST-025 | @PHASE:Phase3 | @CAT:COST | @SEV:🟢Low | @STAT:🟢PASS | @EV:Verified; Enabled persistentLocalCache on Backoffice and Staff App to prevent Quota Drain from full reload reads. | @REF:Firestore Quota & Cost Optimization Guidelines | @TASK: Verify that [DOMAIN:System] เปิดใช้งาน Offline Persistence (persistentLocalCache) ในทุกแอพ (Frontend, Backoffice, Staff) เพื่อลด Read Costs
`;

fs.writeFileSync(file, content.trimEnd() + '\n' + newAuditItem + '\n');
console.log('Appended to Audit Checklist.md');
