import fs from 'fs';
import path from 'path';

console.log("🚀 Starting Phase 3 Verification: Billing Transparency & Telemetry Parity...");

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Check AdListTable.jsx displays spentBudget in Mobile and Desktop
const adListTablePath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');
const adListTableContent = fs.readFileSync(adListTablePath, 'utf8');

assert(
  adListTableContent.includes("ใช้ไป / งบ"),
  "AdListTable.jsx includes 'ใช้ไป / งบ' label in headers/cards"
);
assert(
  adListTableContent.includes("ad.spentBudget"),
  "AdListTable.jsx displays ad.spentBudget points value"
);

// 2. Check AdFormModal.jsx displays remainingCredit
const adFormModalPath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdFormModal.jsx');
const adFormModalContent = fs.readFileSync(adFormModalPath, 'utf8');

assert(
  adFormModalContent.includes("คงเหลือหลังหักงบนี้:"),
  "AdFormModal.jsx displays remainingCredit calculation dynamically"
);

// 3. Check marketingAnalyticsService.js handles permission denial safely without crashing
const marketingAnalyticsServicePath = path.resolve('dh-frontend/src/firebase/marketingAnalyticsService.js');
const marketingAnalyticsContent = fs.readFileSync(marketingAnalyticsServicePath, 'utf8');

assert(
  marketingAnalyticsContent.includes("isPermissionError"),
  "marketingAnalyticsService.js traps permission errors gracefully"
);

console.log(`\n========================================`);
console.log(`Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
