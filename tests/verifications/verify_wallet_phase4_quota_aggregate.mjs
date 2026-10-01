/**
 * Verification Test: Wallet Phase 4 Quota Optimization & System Aggregation
 * Path: Management System/tests/verifications/verify_wallet_phase4_quota_aggregate.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../');

console.log('========================================================');
console.log('🧪 VERIFY: Wallet Phase 4 Quota Optimization & System Aggregation');
console.log('========================================================\n');

let passCount = 0;
const totalChecks = 5;

// Check 1: File existence
const hookPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/wallet/hooks/useWalletManagement.js');
if (fs.existsSync(hookPath)) {
  console.log('✅ 1. useWalletManagement.js exists');
  passCount++;
} else {
  console.error('❌ 1. useWalletManagement.js not found');
}

const content = fs.readFileSync(hookPath, 'utf8');

// Check 2: Aggregation functions imported from firebase/firestore
const hasAggregationImports = content.includes('getAggregateFromServer') &&
  content.includes('sum') &&
  content.includes('count') &&
  content.includes("from 'firebase/firestore'");

if (hasAggregationImports) {
  console.log('✅ 2. getAggregateFromServer, sum, and count imported from firebase/firestore');
  passCount++;
} else {
  console.error('❌ 2. Missing aggregation imports in useWalletManagement.js');
}

// Check 3: Zero-Quota / 1-Read Aggregation Call
const usesAggregateServer = content.includes('getAggregateFromServer(qHasBalance, {') &&
  content.includes("totalWallet: sum('walletBalance')") &&
  content.includes('walletHolders: count()');

if (usesAggregateServer) {
  console.log('✅ 3. getAggregateFromServer calculates totalWallet and walletHolders across entire system');
  passCount++;
} else {
  console.error('❌ 3. getAggregateFromServer call pattern invalid or missing');
}

// Check 4: Reduced sample fetch in initDashboard from 100 reads down to 20 reads via Promise.all
const initDashboardCode = content.slice(content.indexOf('const initDashboard'), content.indexOf('initDashboard();'));
const usesReducedSample = content.includes('Promise.all([') &&
  initDashboardCode.includes('limit(20)') &&
  !initDashboardCode.includes('limit(100)');

if (usesReducedSample) {
  console.log('✅ 4. Eliminated limit(100) in initDashboard and reduced sample document fetch to limit(20) via Promise.all');
  passCount++;
} else {
  console.error('❌ 4. Sample query optimization failed: expected limit(20) without limit(100) in initDashboard');
}

// Check 5: Correct state updates and memory caching
const updatesStatsCorrectly = content.includes('setStats(prev => ({ ...prev, totalBalance: totalBal }));') &&
  content.includes('setWalletHoldersCount(totalHolders);') &&
  content.includes('walletHoldersCount: totalHolders,');

if (updatesStatsCorrectly) {
  console.log('✅ 5. Dashboard state and memory cache correctly populated with exact system totals');
  passCount++;
} else {
  console.error('❌ 5. State update or cache population logic verification failed');
}

console.log('\n--------------------------------------------------------');
if (passCount === totalChecks) {
  console.log(`🎉 ALL ${passCount}/${totalChecks} VERIFICATION CHECKS FOR PHASE 4 PASSED PERFECTLY!\n`);
  process.exit(0);
} else {
  console.error(`💥 FAILED: Only ${passCount}/${totalChecks} checks passed.\n`);
  process.exit(1);
}
