import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mgmtDir = path.resolve(__dirname, '../..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedChecks++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('=== VERIFY CLAIMS SYSTEM FINAL COMPREHENSIVE SUITE ===\n');

// 1. Facade & Service Delegation
console.log('1. Checking claimManagerService Facade:');
const managerServicePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimManagerService.js');
const managerServiceContent = fs.readFileSync(managerServicePath, 'utf8');

assert(managerServiceContent.includes("task.type.startsWith('CANCEL_')"), 'claimManagerService delegates CANCEL_* to cancelActionService');
assert(managerServiceContent.includes("task.type === 'RETURN_APPROVAL'"), 'claimManagerService delegates RETURN_APPROVAL to returnActionService');
assert(managerServiceContent.includes("task.type === 'CLAIM_APPROVAL' || task.type === 'EXCHANGE_APPROVAL'"), 'claimManagerService delegates CLAIM & EXCHANGE to claimActionService');
assert(managerServiceContent.includes("approveCancel"), 'Delegates approve to approveCancel');
assert(managerServiceContent.includes("rejectCancel"), 'Delegates reject to rejectCancel');

// 2. Transaction Line Order Analysis
console.log('\n2. Checking Transaction Line Order in Services:');
const servicesToCheck = [
  { name: 'claimRequestService.js', path: 'dh-backoffice-react/src/firebase/claim/claimRequestService.js' },
  { name: 'claimActionService.js', path: 'dh-backoffice-react/src/firebase/claim/claimActionService.js' },
  { name: 'returnActionService.js', path: 'dh-backoffice-react/src/firebase/claim/returnActionService.js' },
  { name: 'cancelActionService.js', path: 'dh-backoffice-react/src/firebase/claim/cancelActionService.js' },
];

for (const s of servicesToCheck) {
  const content = fs.readFileSync(path.join(mgmtDir, s.path), 'utf8');
  assert(!content.includes("getCollectionPath('todos')"), `${s.name} does not reference getCollectionPath('todos')`);
  assert(content.includes("getCollectionPath('claims')"), `${s.name} references getCollectionPath('claims')`);
}

// 3. Firestore Rules Invariants
console.log('\n3. Checking Firestore Rules Access & Guards:');
const rulesContent = fs.readFileSync(path.join(mgmtDir, 'firestore.rules'), 'utf8');

assert(rulesContent.includes('match /claims/{claimId}'), 'Rules define match /claims/{claimId}');
assert(rulesContent.includes('resource.data.customerUid == request.auth.uid'), 'Rules allow customer to read their claims by customerUid');
assert(rulesContent.includes("CANCEL_CLAIM_APPROVAL") && rulesContent.includes("CANCEL_EXCHANGE_APPROVAL") && rulesContent.includes("CANCEL_RETURN_APPROVAL"), 'Rules allow staff cancel types under pending_manager');
assert(rulesContent.includes("resource.data.status == 'waiting_item'") && rulesContent.includes("hasOnly(['payload', 'updatedAt', 'trackingNo'])"), 'Rules allow customer tracking update under waiting_item');

// 4. Stepper & Table Formatting Invariants
console.log('\n4. Checking Stepper & Table Formatting:');
const tableContent = fs.readFileSync(path.join(mgmtDir, 'dh-backoffice-react/src/pages/claims/components/table/ClaimTable.jsx'), 'utf8');
const rowContent = fs.readFileSync(path.join(mgmtDir, 'dh-backoffice-react/src/pages/claims/components/table/ClaimTableRow.jsx'), 'utf8');
const stepperContent = fs.readFileSync(path.join(mgmtDir, 'dh-backoffice-react/src/pages/claims/components/detail/ClaimStepper.jsx'), 'utf8');

assert(tableContent.includes('table-fixed'), 'ClaimTable uses table-fixed for strict column budgeting');
assert(rowContent.includes('truncateText(payload.productName || payload.sku, 40)'), 'ClaimTableRow caps product names with truncateText');
assert(rowContent.includes("const stripeBg = isEven"), 'ClaimTableRow implements zebra striping');
assert(stepperContent.includes("type?.startsWith('CANCEL_')"), 'ClaimStepper protects against null type');

// 5. SSR Memory Local Grimoire
console.log('\n5. Checking Local Grimoire Compliance:');
const memoryContent = fs.readFileSync(path.join(mgmtDir, 'dh-backoffice-react/src/pages/claims/ssr memory claims.md'), 'utf8');
assert(!memoryContent.includes('<watchlist>'), 'ssr memory claims.md has no <watchlist> tag');
assert(memoryContent.split('\n').length <= 80, 'ssr memory claims.md is <= 80 lines');
assert(Buffer.byteLength(memoryContent, 'utf8') <= 6144, 'ssr memory claims.md is <= 6KB');

console.log('\n=====================================');
console.log(`TOTAL CHECKS: ${totalChecks}`);
console.log(`PASSED:       ${passedChecks}`);
console.log(`FAILED:       ${failedChecks}`);
console.log('=====================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
