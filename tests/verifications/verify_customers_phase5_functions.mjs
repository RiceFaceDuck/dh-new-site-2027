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

console.log('🔍 [Phase 5 Verification] Verifying Customers Phase 5 Cloud Functions & Chunk Sync...');

// 1. Check functions/index.js
const indexPath = path.resolve('functions/index.js');
const indexContent = fs.readFileSync(indexPath, 'utf8');

assert(indexContent.includes('./inventory/nightlyChunkGuard'), 'functions/index.js imports nightlyChunkGuard');
assert(indexContent.includes('./inventory/walletFunctions'), 'functions/index.js imports walletFunctions');
assert(indexContent.includes('./marketing/ga4AdSyncCron'), 'functions/index.js imports ga4AdSyncCron');

// Verify exports object directly
const functionsEntry = await import('../../functions/index.js');
const exportedKeys = Object.keys(functionsEntry.default || functionsEntry);

const requiredFunctions = [
  'verifySlipOcr',
  'purgeOldSlips',
  'nightlyChunkGuard',
  'rebuildAllChunksManual',
  'requestWithdrawal',
  'processWalletPayment',
  'ga4AdSyncCron',
  'ga4AdSyncManual'
];

requiredFunctions.forEach(fnName => {
  assert(exportedKeys.includes(fnName), `functions/index.js exports ${fnName}`);
});

// 2. Check nightlyChunkGuard.js
const chunkGuardPath = path.resolve('functions/inventory/nightlyChunkGuard.js');
const chunkGuardContent = fs.readFileSync(chunkGuardPath, 'utf8');

assert(chunkGuardContent.includes('accountId: resolvedAccountId'), 'nightlyChunkGuard.js preserves accountId');
assert(chunkGuardContent.includes('customerCode: data.customerCode || resolvedAccountId'), 'nightlyChunkGuard.js preserves customerCode');
assert(chunkGuardContent.includes('address: data.address || null'), 'nightlyChunkGuard.js preserves address');
assert(chunkGuardContent.includes('taxId: data.taxId || null'), 'nightlyChunkGuard.js preserves taxId');
assert(chunkGuardContent.includes('totalAccumulatedPoints: Number'), 'nightlyChunkGuard.js preserves totalAccumulatedPoints');

// 3. Check customerCacheService.js
const cacheServicePath = path.resolve('dh-backoffice-react/src/pages/Customers/services/customerCacheService.js');
const cacheServiceContent = fs.readFileSync(cacheServicePath, 'utf8');

assert(cacheServiceContent.includes('runTransaction(db, async (transaction)'), 'customerCacheService.js uses runTransaction for syncCustomerToDirectoryChunk');
assert(cacheServiceContent.includes('const dirSnap = await transaction.get(dirRef)'), 'customerCacheService.js reads directory chunk inside transaction');
assert(cacheServiceContent.includes('transaction.set(dirRef,'), 'customerCacheService.js writes directory chunk inside transaction');

console.log(`\n================================`);
console.log(`Phase 5 Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
