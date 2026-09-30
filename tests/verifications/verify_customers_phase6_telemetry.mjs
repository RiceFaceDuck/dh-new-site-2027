import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

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

console.log('🔍 [Phase 6 Verification] Verifying Customers Phase 6 GA4 Telemetry & Script Quarantine...');

// 1. Check migrateCustomerCodes.mjs quarantine
const scriptCodePath = path.resolve('scripts/migrateCustomerCodes.mjs');
const scriptCodeContent = fs.readFileSync(scriptCodePath, 'utf8');
assert(
  scriptCodeContent.includes('process.exit(1)') && scriptCodeContent.includes('QUARANTINE'),
  'migrateCustomerCodes.mjs contains quarantine exit guard'
);

const runCodeResult = spawnSync('node', [scriptCodePath]);
assert(
  runCodeResult.status === 1 && runCodeResult.stderr.toString().includes('QUARANTINE'),
  'migrateCustomerCodes.mjs safely terminates with code 1 on attempted execution'
);

// 2. Check migrateUsers.mjs quarantine
const scriptUsersPath = path.resolve('scripts/migrateUsers.mjs');
const scriptUsersContent = fs.readFileSync(scriptUsersPath, 'utf8');
assert(
  scriptUsersContent.includes('process.exit(1)') && scriptUsersContent.includes('QUARANTINE'),
  'migrateUsers.mjs contains quarantine exit guard'
);

const runUsersResult = spawnSync('node', [scriptUsersPath]);
assert(
  runUsersResult.status === 1 && runUsersResult.stderr.toString().includes('QUARANTINE'),
  'migrateUsers.mjs safely terminates with code 1 on attempted execution'
);

// 3. Check marketingAnalyticsService.js
const marketingPath = path.resolve('dh-frontend/src/firebase/marketingAnalyticsService.js');
const marketingContent = fs.readFileSync(marketingPath, 'utf8');
assert(
  marketingContent.includes('isPermissionError') && marketingContent.includes('clearInterval(flushInterval)'),
  'marketingAnalyticsService.js halts interval on permission denied to eliminate network retry loop'
);

console.log(`\n================================`);
console.log(`Phase 6 Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
