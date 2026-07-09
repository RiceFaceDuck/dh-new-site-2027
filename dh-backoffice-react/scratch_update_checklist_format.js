import fs from 'fs';

const checklistPath = 'c:/DH Notebook/Management System/Audit Checklist.md';
let content = fs.readFileSync(checklistPath, 'utf8');

const targetLine = '@ID:P4-POS-002 | @PHASE:Phase4';
const updatedLine = '@ID:P4-POS-002 | @PHASE:Phase4 | @CAT:DATA | @SEV:🔴Critical | @STAT:🟢PASS | @EV:Verified and fixed via REAL E2E Simulation by AI Manager. Updated Order ID format to DH-O{Shard}-26-{Seq} and changed Shard Prefix from T to O. Corrected server-side secure calculation for B2B/Retail and linked customer.uid to history query. | @REF:scratch_test_pos_billing.js | @TASK: Verify Backoffice POS (BillingMain) Workflow and Data Flow.';

let lines = content.split('\n');
let updatedCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(targetLine)) {
    lines[i] = updatedLine;
    updatedCount++;
    console.log(`Updated checklist line to new format`);
  }
}

if (updatedCount > 0) {
  fs.writeFileSync(checklistPath, lines.join('\n'), 'utf8');
  console.log("✅ Audit Checklist.md updated successfully!");
} else {
  console.log("❌ Target line not found!");
}
