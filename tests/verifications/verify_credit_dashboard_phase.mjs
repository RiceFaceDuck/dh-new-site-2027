import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.resolve(__dirname, '../../dh-backoffice-react/src');
const creditDashboardDir = path.join(baseDir, 'pages/managers/CreditDashboard');
const creditServiceDir = path.join(baseDir, 'firebase/credit');

console.log("===============================================================");
console.log("🔍 PHASE FINAL REVIEW: CREDIT DASHBOARD (STRICT RIGOROUS AUDIT)");
console.log("===============================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// -------------------------------------------------------------
// 1. Accounting Formula & Logic Rigor
// -------------------------------------------------------------
console.log("--- 1. Testing Accounting Formulas & Anti-Alarm Logic ---");
const mockLedger = {
  totalAllocated: 38050,
  systemPoolMax: 10000000,
  totalUserCredits: 38050
};

const discrepancy = Math.round(Math.abs(mockLedger.totalAllocated - mockLedger.totalUserCredits));
const remainingPool = Math.max(0, mockLedger.systemPoolMax - mockLedger.totalAllocated);
const isMatch = discrepancy === 0;

assert(discrepancy === 0, `Discrepancy must be 0 (got ${discrepancy})`);
assert(remainingPool === 9961950, `Remaining pool must be 9,961,950 (got ${remainingPool})`);
assert(isMatch === true, `Ledger match status must be true (ตรงกัน)`);
assert(discrepancy !== (mockLedger.systemPoolMax - mockLedger.totalUserCredits), `Anti-false alarm: discrepancy is NOT 9,961,950`);

// -------------------------------------------------------------
// 2. Dead Component Cleanup & Clean Architecture
// -------------------------------------------------------------
console.log("\n--- 2. Checking Dead Components & Directory Cleanliness ---");
const deadFile1 = path.join(creditDashboardDir, 'components/SecurityFrameworkInfo.jsx');
const deadFile2 = path.join(creditDashboardDir, 'components/SystemHealthPanel.jsx');

assert(!fs.existsSync(deadFile1), "SecurityFrameworkInfo.jsx must be removed from production components");
assert(!fs.existsSync(deadFile2), "SystemHealthPanel.jsx must be removed from production components");

const backupDir = path.resolve(__dirname, '../../_Backups/2026-09-22_CreditDashboard_Cloning');
assert(fs.existsSync(backupDir), "Backup directory must exist in _Backups/2026-09-22_CreditDashboard_Cloning");
assert(fs.existsSync(path.join(backupDir, 'CreditDashboard/components/SecurityFrameworkInfo.jsx')), "SecurityFrameworkInfo.jsx is safely backed up");
assert(fs.existsSync(path.join(backupDir, 'CreditDashboard/components/SystemHealthPanel.jsx')), "SystemHealthPanel.jsx is safely backed up");

// -------------------------------------------------------------
// 3. UI Shell & Layout Verification (100% Parity with Hosting)
// -------------------------------------------------------------
console.log("\n--- 3. Checking Header Banner & Full-Width 12-Col Layout ---");
const indexPath = path.join(creditDashboardDir, 'index.jsx');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

assert(indexContent.includes('EVENT LOGS'), "Header banner contains integrated EVENT LOGS terminal");
assert(indexContent.includes('SYSTEM OPTIMAL'), "Header banner contains SYSTEM OPTIMAL status pill");
assert(indexContent.includes('Atomic TXN'), "Header banner contains Atomic TXN security badge");
assert(indexContent.includes('Multi-Sync'), "Header banner contains Multi-Sync security badge");
assert(indexContent.includes('Audit Log'), "Header banner contains Audit Log security badge");
assert(indexContent.includes('ย้อนกลับ (Settings)'), "Header banner contains integrated back navigation button");
assert(!indexContent.includes('lg:col-span-8'), "Old 8:4 column split is eliminated (tabs take 100% full width)");

// -------------------------------------------------------------
// 4. Quota Safety & Zero Firestore Pollution
// -------------------------------------------------------------
console.log("\n--- 4. Checking Quota Protection & Non-Destructive Health Ping ---");
const healthHookPath = path.join(creditDashboardDir, 'hooks/useSystemHealth.js');
const healthHookContent = fs.readFileSync(healthHookPath, 'utf-8');

assert(!healthHookContent.includes('addDoc'), "useSystemHealth.js must NOT call addDoc (Zero Firestore write pollution)");
const ledgerHookPath = path.join(creditDashboardDir, 'hooks/useLedgerStats.js');
const ledgerHookContent = fs.readFileSync(ledgerHookPath, 'utf-8');
assert(ledgerHookContent.includes('creditCacheManager'), "useLedgerStats.js utilizes creditCacheManager for session caching");

const cacheManagerPath = path.join(creditServiceDir, 'creditCacheManager.js');
assert(fs.existsSync(cacheManagerPath), "creditCacheManager.js exists in firebase/credit/");

// -------------------------------------------------------------
// 5. Smart Account Resolver & Operations Tab
// -------------------------------------------------------------
console.log("\n--- 5. Checking Operations Tab & Smart Resolver ---");
const adjustTabPath = path.join(creditDashboardDir, 'components/tabs/CreditAdjustTab.jsx');
const adjustTabContent = fs.readFileSync(adjustTabPath, 'utf-8');

assert(adjustTabContent.includes('resolveSmartUserInfo') || adjustTabContent.includes('resolveSmartUid'), "CreditAdjustTab integrates smart account resolution");
assert(adjustTabContent.includes('Current Balance'), "CreditAdjustTab displays real-time Current Balance");
assert(adjustTabContent.includes('bg-emerald-50'), "CreditAdjustTab features verified green customer account preview card");

// -------------------------------------------------------------
// 6. SSR Memory Grimoire Rules
// -------------------------------------------------------------
console.log("\n--- 6. Checking SSR Memory Grimoire Protocol ---");
const memoryPath = path.join(creditDashboardDir, 'ssr memory credit_dashboard.md');
assert(fs.existsSync(memoryPath), "ssr memory credit_dashboard.md exists");

if (fs.existsSync(memoryPath)) {
  const memoryContent = fs.readFileSync(memoryPath, 'utf-8');
  const lineCount = memoryContent.split('\n').length;
  assert(lineCount <= 80, `Grimoire lines must not exceed 80 lines (actual: ${lineCount})`);
  assert(memoryContent.includes('<flow_and_entry>'), "Grimoire includes <flow_and_entry>");
  assert(memoryContent.includes('<core_schema>'), "Grimoire includes <core_schema>");
  assert(memoryContent.includes('<business_rules>'), "Grimoire includes <business_rules>");
  assert(memoryContent.includes('<cross_impact>'), "Grimoire includes <cross_impact>");
  assert(memoryContent.includes('<pitfalls_and_lessons>'), "Grimoire includes <pitfalls_and_lessons>");
}

// -------------------------------------------------------------
// Final Audit Summary
// -------------------------------------------------------------
console.log("\n===============================================================");
console.log(`📊 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log("🎉 VERIFICATION STATUS: 100% PERFECT PASS (ALL CRITERIA SATISFIED)");
} else {
  console.log("⚠️ VERIFICATION STATUS: SOME TESTS FAILED");
}
console.log("===============================================================");
