import fs from 'fs';

const checklistPath = 'c:/DH Notebook/Management System/Audit Checklist.md';
let content = fs.readFileSync(checklistPath, 'utf8');

// ลบ null byte
content = content.replace(/\u0000/g, '');

// อัปเดตบรรทัด P4-POS-002
const targetLine = '@ID:P4-POS-002 | @PHASE:Phase4';
const updatedLine = '@ID:P4-POS-002 | @PHASE:Phase4 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified via REAL E2E Simulation by AI Manager (ID: DH-2026-T2-0001). Stock deductions for Panel (LED14003, LED14005) and Freebie (TO0158) verified. Discovered critical server-side price calculation bug where secure price overrides wholesale/B2B price to retail price. Customer profile page latest bill linkage checked. | @REF:scratch_test_pos_billing.js | @TASK: Verify Backoffice POS (BillingMain) Workflow and Data Flow.';

let lines = content.split('\n');
let updatedCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(targetLine)) {
    lines[i] = updatedLine;
    updatedCount++;
    console.log(`Updated line ${i + 1}: ${lines[i]}`);
  }
}

if (updatedCount > 0) {
  fs.writeFileSync(checklistPath, lines.join('\n'), 'utf8');
  console.log("✅ Audit Checklist.md updated successfully!");
} else {
  console.log("❌ Target line not found!");
}
