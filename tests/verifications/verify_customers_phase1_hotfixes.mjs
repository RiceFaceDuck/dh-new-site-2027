import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('🔍 [Phase 1 Hotfix Verification] Testing Data Loss Prevention & Security Hotfixes...');

// 1. Check useCustomerActions.js for Overwrite Sanitization (CRIT-01)
const actionsPath = path.resolve('dh-backoffice-react/src/pages/Customers/hooks/useCustomerActions.js');
const actionsContent = fs.readFileSync(actionsPath, 'utf8');

assert(
  actionsContent.includes('sanitizedPayload') &&
  actionsContent.includes('filter(([_, v]) => v !== \'\' && v !== undefined && v !== null)'),
  'useCustomerActions.js sanitizes payload against empty string overwrite (CRIT-01)'
);

// 2. Check useCustomerActions.js for Migration Disarming (HIGH-05)
assert(
  !actionsContent.includes('customerCode: deleteField()'),
  'useCustomerActions.js completely eliminated customerCode: deleteField() (HIGH-05)'
);
assert(
  actionsContent.includes('ระบบล็อกการไมเกรชัน'),
  'useCustomerActions.js locked migration action with protective notice (HIGH-05)'
);

// 3. Check customerAdminService.js for keepExistingFields support
const adminServicePath = path.resolve('dh-backoffice-react/src/firebase/customerAdminService.js');
const adminServiceContent = fs.readFileSync(adminServicePath, 'utf8');

assert(
  adminServiceContent.includes('options?.keepExistingFields') &&
  adminServiceContent.includes('filter(([_, v]) => v !== \'\' && v !== undefined && v !== null)'),
  'customerAdminService.js supports keepExistingFields payload sanitization (CRIT-01)'
);

// 4. Check managerActionService.js for CUSTOMER_DELETE_APPROVAL (CRIT-02)
const managerActionPath = path.resolve('dh-backoffice-react/src/firebase/managerActionService.js');
const managerActionContent = fs.readFileSync(managerActionPath, 'utf8');

assert(
  managerActionContent.includes("type === 'CUSTOMER_DELETE_APPROVAL'") &&
  managerActionContent.includes('await deleteCustomer(targetId'),
  'managerActionService.js executes deleteCustomer for CUSTOMER_DELETE_APPROVAL (CRIT-02)'
);

// 5. Check nightlyChunkGuard.js for courier/contact fields (CRIT-03)
const chunkGuardPath = path.resolve('functions/inventory/nightlyChunkGuard.js');
const chunkGuardContent = fs.readFileSync(chunkGuardPath, 'utf8');

assert(
  chunkGuardContent.includes('preferredCourier: data.preferredCourier || data.logisticProvider') &&
  chunkGuardContent.includes('contactName: data.contactName || data.firstName') &&
  chunkGuardContent.includes('shippingNotes: data.shippingNotes || data.logisticNote'),
  'nightlyChunkGuard.js preserves preferredCourier, contactName, shippingNotes in chunk (CRIT-03)'
);

// 6. Check nightlyChunkGuard.js for Auth Secret Guard in rebuildAllChunksManual (HIGH-03)
assert(
  chunkGuardContent.includes('CHUNK_REBUILD_SECRET') &&
  chunkGuardContent.includes('res.status(401)'),
  'nightlyChunkGuard.js protects rebuildAllChunksManual with Auth Secret Key check (HIGH-03)'
);

console.log(`\n========================================`);
console.log(`Phase 1 Hotfix Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 1 HOTFIX VERIFICATIONS PASSED 100%!');
}
