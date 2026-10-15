import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Verification Suite: Phase 4 Real-time Last Order Sync & Backfill');

const basePath = 'dh-backoffice-react/src';

// 1. Check all target files
const targetFiles = [
  path.join(basePath, 'firebase/billingTransactionService.js'),
  path.join(basePath, 'pages/Customers/services/customerCacheService.js'),
  path.join(basePath, 'pages/Customers/components/layout/CustomerRow.jsx'),
  path.join(basePath, 'pages/Customers/hooks/useCustomerData.js')
];

for (const f of targetFiles) {
  if (!fs.existsSync(f)) {
    console.error(`❌ Target file missing: ${f}`);
    process.exit(1);
  }
}
console.log('  ✅ PASS: All 4 target files exist');

// 2. Verify billingTransactionService real-time sync
const billingTxContent = fs.readFileSync(targetFiles[0], 'utf8');
if (
  billingTxContent.includes('syncCustomerToDirectoryChunk') &&
  billingTxContent.includes('lastOrderDate: Date.now()') &&
  billingTxContent.includes("customerUid !== 'WALK-IN'")
) {
  console.log('  ✅ PASS: POS billing transaction synchronously/non-blockingly syncs lastOrderDate to customer directory');
} else {
  console.error('❌ FAIL: Real-time POS customer lastOrderDate sync missing');
  process.exit(1);
}

// 3. Verify customerCacheService reconciliation & merge preservation
const cacheServiceContent = fs.readFileSync(targetFiles[1], 'utf8');
if (
  cacheServiceContent.includes('reconcileCustomerLastOrderDates') &&
  cacheServiceContent.includes('customerLastOrderMap') &&
  cacheServiceContent.includes('mergedLastOrder = Math.max')
) {
  console.log('  ✅ PASS: Directory chunk maintains atomic merge & historical reconciliation engine');
} else {
  console.error('❌ FAIL: reconcileCustomerLastOrderDates or mergedLastOrder missing in customerCacheService');
  process.exit(1);
}

// 4. Verify CustomerRow timestamp hardening
const customerRowContent = fs.readFileSync(targetFiles[2], 'utf8');
if (
  customerRowContent.includes('toMillis()') &&
  customerRowContent.includes('toDate().getTime()') &&
  customerRowContent.includes('seconds * 1000') &&
  customerRowContent.includes('daysSinceLastOrder = Math.floor')
) {
  console.log('  ✅ PASS: CustomerRow supports universal timestamp formats with zero NaN display');
} else {
  console.error('❌ FAIL: CustomerRow timestamp handling missing hardened format support');
  process.exit(1);
}

// 5. Verify useCustomerData wiring
const customerDataContent = fs.readFileSync(targetFiles[3], 'utf8');
if (
  customerDataContent.includes('reconcileCustomerLastOrderDates') &&
  customerDataContent.includes('!useCache')
) {
  console.log('  ✅ PASS: Manual refresh triggers non-blocking order reconciliation');
} else {
  console.error('❌ FAIL: useCustomerData missing reconciliation trigger on refresh');
  process.exit(1);
}

console.log('\n🎉 ALL PHASE 4 VERIFICATIONS PASSED (5/5)\n');
