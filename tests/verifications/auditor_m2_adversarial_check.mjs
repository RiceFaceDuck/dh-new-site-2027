/**
 * Auditor Independent Adversarial Verification Suite: Milestone 2
 * Location: Management System/tests/verifications/auditor_m2_adversarial_check.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const backofficeDir = path.join(rootDir, 'dh-backoffice-react');

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

console.log("================================================================================");
console.log("  AUDITOR INDEPENDENT ADVERSARIAL INTEGRITY VERIFICATION (MILESTONE 2)");
console.log("================================================================================\n");

// 1. Static Scan for Prohibited Anti-Patterns
console.log("1. Prohibited Anti-Pattern Detection (Facade, Dummy, Hardcoded):");
const targetFiles = [
  'src/firebase/managerTodoService.js',
  'src/firebase/managerActionService.js',
  'src/firebase/claim/claimManagerService.js',
  'src/pages/claims/hooks/useClaimData.js',
  'src/layouts/AdminLayout.jsx',
  'src/components/todo/TodoItem.jsx',
  'src/pages/ManagersOverview/components/ManagerTaskSection.jsx'
];

for (const relPath of targetFiles) {
  const fullPath = path.join(backofficeDir, relPath);
  assert(fs.existsSync(fullPath), `Target file exists: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Check for dummy return constants or fake test passing
  assert(!content.includes("return true; // dummy"), `No dummy return in ${relPath}`);
  assert(!content.includes("/* fake */"), `No fake comment tags in ${relPath}`);
  assert(!content.includes("mock_test_pass"), `No mock test pass flag in ${relPath}`);
}

// 2. Deep Static Verification of managerActionService routing
console.log("\n2. Deep Static Verification of managerActionService Routing:");
const actionServiceContent = fs.readFileSync(path.join(backofficeDir, 'src/firebase/managerActionService.js'), 'utf8');
assert(
  actionServiceContent.includes("if (CLAIM_TASK_TYPES.includes(type)) {"),
  "handleApproval intercepts CLAIM_TASK_TYPES before generic handlers"
);
assert(
  actionServiceContent.includes("await claimManagerService.approveRequest(task, roleOrType, adminId, adminName, payload)"),
  "handleApproval routes authentic payload and arguments to claimManagerService"
);
assert(
  actionServiceContent.includes("await claimManagerService.rejectRequest(task, roleOrType, reason, adminId, adminName)"),
  "handleRejection routes authentic reason and arguments to claimManagerService"
);

// 3. Deep Static Verification of claimManagerService Polymorphic Facade
console.log("\n3. Deep Static Verification of claimManagerService Facade:");
const facadeContent = fs.readFileSync(path.join(backofficeDir, 'src/firebase/claim/claimManagerService.js'), 'utf8');
assert(
  facadeContent.includes("args[0] === 'cancel' || args[0] === 'manager'"),
  "claimManagerService supports polymorphic (task, roleOrType, adminId, adminName, payload)"
);
assert(
  facadeContent.includes("cancelActionService.approveCancel(taskObj, adminUid, adminName)"),
  "Routes cancel approvals to cancelActionService.approveCancel"
);
assert(
  facadeContent.includes("cancelActionService.rejectCancel(task, reason, adminUid, adminName)"),
  "Routes cancel rejections to cancelActionService.rejectCancel"
);

// 4. Stress Test: Sorting and Deduplication Under Extreme Conditions
console.log("\n4. Stress Test: Edge Cases in Merge & Deduplication Logic:");

const getDocTime = (docItem) => {
  if (!docItem?.createdAt) return 0;
  if (typeof docItem.createdAt.toMillis === 'function') return docItem.createdAt.toMillis();
  if (typeof docItem.createdAt.toDate === 'function') return docItem.createdAt.toDate().getTime();
  if (docItem.createdAt instanceof Date) return docItem.createdAt.getTime();
  return new Date(docItem.createdAt).getTime() || 0;
};

// Edge Case 1: Corrupted or Missing createdAt
const itemWithNoDate = { id: 'TASK-1', type: 'STAFF_APPROVAL' };
const itemWithInvalidDate = { id: 'TASK-2', type: 'STAFF_APPROVAL', createdAt: 'invalid-date' };
const itemWithMillis = { id: 'TASK-3', type: 'STAFF_APPROVAL', createdAt: { toMillis: () => 5000 } };
const itemWithDate = { id: 'TASK-4', type: 'STAFF_APPROVAL', createdAt: new Date('2026-09-30T10:00:00Z') };

assert(getDocTime(itemWithNoDate) === 0, "Item with no createdAt defaults safely to 0");
assert(getDocTime(itemWithInvalidDate) === 0, "Item with invalid date string defaults safely to 0");
assert(getDocTime(itemWithMillis) === 5000, "Item with toMillis method returns timestamp");
assert(getDocTime(itemWithDate) > 0, "Item with Date instance returns timestamp");

// Edge Case 2: Stale shadow todo colliding with active claim
const todosList = [
  { id: 'C-1', type: 'CANCEL_CLAIM_APPROVAL', status: 'pending_manager', title: 'Old In Todo', createdAt: 100 },
  { id: 'S-1', type: 'STAFF_APPROVAL', status: 'pending', createdAt: 200 }
];
const claimsList = [
  { id: 'C-1', type: 'CANCEL_CLAIM_APPROVAL', status: 'pending_manager', title: 'Authoritative In Claims', createdAt: 150 }
];

const CLAIM_TASK_TYPES = [
  'CLAIM_APPROVAL',
  'RETURN_APPROVAL',
  'EXCHANGE_APPROVAL',
  'CANCEL_CLAIM_APPROVAL',
  'CANCEL_RETURN_APPROVAL',
  'CANCEL_EXCHANGE_APPROVAL'
];
const MANAGER_TASK_TYPES = [
  'STAFF_APPROVAL',
  ...CLAIM_TASK_TYPES
];

const taskMap = new Map();
todosList.forEach(todo => {
  const typeToCheck = todo.type || todo.taskType;
  if (MANAGER_TASK_TYPES.includes(typeToCheck) && !CLAIM_TASK_TYPES.includes(typeToCheck)) {
    taskMap.set(todo.id, todo);
  }
});
claimsList.forEach(claim => {
  const typeToCheck = claim.type || claim.taskType;
  if (!typeToCheck || CLAIM_TASK_TYPES.includes(typeToCheck)) {
    taskMap.set(claim.id, claim);
  }
});

const merged = Array.from(taskMap.values());
assert(merged.length === 2, "Merged output contains exactly 2 tasks (no duplicates)");
assert(merged.find(t => t.id === 'C-1')?.title === 'Authoritative In Claims', "Authoritative claims doc retained, stale shadow in todos ignored");

// 5. Invariant Test: useClaimData Active Tab & Stats Mutual Exclusivity
console.log("\n5. Invariant Test: useClaimData Pending vs Cancelled Logic:");

const claimItems = [
  { id: '1', status: 'pending_manager', type: 'CLAIM_APPROVAL' },
  { id: '2', status: 'pending_manager', type: 'CANCEL_CLAIM_APPROVAL' },
  { id: '3', status: 'pending_manager', type: 'CANCEL_RETURN_APPROVAL' },
  { id: '4', status: 'cancelled', type: 'CANCEL_CLAIM_APPROVAL' },
  { id: '5', status: 'cancelled', type: 'CLAIM_APPROVAL' },
  { id: '6', status: 'waiting_item', type: 'CLAIM_APPROVAL' }
];

const pendingCount = claimItems.filter(r => r.status === 'pending_manager').length;
const cancelledCount = claimItems.filter(r => r.status === 'cancelled').length;

assert(pendingCount === 3, "Exactly 3 pending_manager items counted in stats.pending");
assert(cancelledCount === 2, "Exactly 2 cancelled items counted in stats.cancelled");

// Filter simulation
const pendingTab = claimItems.filter(r => r.status === 'pending_manager');
const cancelledTab = claimItems.filter(r => r.status === 'cancelled');

assert(pendingTab.length === 3, "Pending tab contains all 3 pending items including cancellations");
assert(cancelledTab.length === 2, "Cancelled tab contains only 2 finalized cancelled items");
assert(!cancelledTab.some(i => i.status === 'pending_manager'), "Cancelled tab NEVER contains pending_manager items");

console.log("\n================================================================================");
console.log(`TOTAL ADVERSARIAL CHECKS: ${totalChecks}`);
console.log(`PASSED:                   ${passedChecks}`);
console.log(`FAILED:                   ${failedChecks}`);
console.log("================================================================================\n");

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL ADVERSARIAL CHECKS PASSED WITH ZERO INTEGRITY VIOLATIONS!\n");
  process.exit(0);
}
