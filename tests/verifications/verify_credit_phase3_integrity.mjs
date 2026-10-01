import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');

console.log('================================================================================');
console.log('🛡️ VERIFICATION SUITE: CREDIT POINT PHASE 3 (DISPLAY, MATH & QUOTA LISTENERS)');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// 1. Verify userManagementService.js Display Name Fix
// -----------------------------------------------------------------------------
console.log('--- 1. Testing userManagementService.js Display Name Fix ---');

const userServicePath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/userManagementService.js');
const userServiceCode = fs.readFileSync(userServicePath, 'utf8');

assert(!userServiceCode.includes('getCustomerDisplayName(d, d).accountName'),
  'userManagementService.js must NOT access .accountName on string primitive');
assert(userServiceCode.includes('getCustomerDisplayName(d, d) ||'),
  'userManagementService.js must directly use getCustomerDisplayName(d, d)');
console.log('  ✅ PASS: getCustomerDisplayName string returned is directly used without property access error');

// -----------------------------------------------------------------------------
// 2. Verify Elimination of Point vs Currency Symbol (฿) Confusion
// -----------------------------------------------------------------------------
console.log('\n--- 2. Testing Currency Symbol (฿) vs Pts Parity in UI ---');

const statsCardsPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/CreditDashboard/components/LedgerStatsCards.jsx');
const statsCardsCode = fs.readFileSync(statsCardsPath, 'utf8');
assert(!statsCardsCode.includes('฿ {formatNumber(stats.totalUserCredits)}'), 'LedgerStatsCards must NOT prefix totalUserCredits with ฿');
assert(statsCardsCode.includes('{formatNumber(stats.totalUserCredits)} Pts'), 'LedgerStatsCards must suffix totalUserCredits with Pts');
assert(statsCardsCode.includes('{formatNumber(stats.remainingPool)} Pts'), 'LedgerStatsCards must suffix remainingPool with Pts');
assert(statsCardsCode.includes('{formatNumber(stats.systemPoolMax)} Pts'), 'LedgerStatsCards must suffix systemPoolMax with Pts');
console.log('  ✅ PASS: LedgerStatsCards formats all loyalty cards with Pts instead of ฿');

const partnerTabPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/CreditDashboard/components/tabs/PartnerCreditsTab.jsx');
const partnerTabCode = fs.readFileSync(partnerTabPath, 'utf8');
assert(!partnerTabCode.includes('฿ {totalDisplayedCredit'), 'PartnerCreditsTab must NOT prefix totalDisplayedCredit with ฿');
assert(partnerTabCode.includes('Pts'), 'PartnerCreditsTab must format with Pts');
console.log('  ✅ PASS: PartnerCreditsTab formats visible liability with Pts');

const adjustTabPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/CreditDashboard/components/tabs/CreditAdjustTab.jsx');
const adjustTabCode = fs.readFileSync(adjustTabPath, 'utf8');
assert(adjustTabCode.includes('แต้ม (Pts) สำเร็จ'), 'CreditAdjustTab success toast must specify แต้ม (Pts)');
console.log('  ✅ PASS: CreditAdjustTab success message specifies แต้ม (Pts)');

const historyTabPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/CreditDashboard/components/tabs/CreditHistoryTab.jsx');
const historyTabCode = fs.readFileSync(historyTabPath, 'utf8');
assert(historyTabCode.includes('Amount (Pts)'), 'CreditHistoryTab table header must label Amount (Pts)');
console.log('  ✅ PASS: CreditHistoryTab table header labels Amount (Pts)');

const walletHistoryPath = path.join(REPO_ROOT, 'dh-frontend/src/components/profile/tabs/wallet/WalletHistory.jsx');
const walletHistoryCode = fs.readFileSync(walletHistoryPath, 'utf8');
assert(walletHistoryCode.includes("isCredit ? `${formatCredit(amount)} Pts` : `฿ ${formatCredit(amount)}`"),
  'WalletHistory must render Pts for credit logs and ฿ for cash wallet logs');
console.log('  ✅ PASS: WalletHistory distinguishes Pts from ฿ based on transaction source');

// -----------------------------------------------------------------------------
// 3. Verify useLedgerStats.js Math Refactor (Liabilities & Negative Aggregation)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Testing useLedgerStats.js Checksum Math Refactor ---');

const ledgerHookPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/CreditDashboard/hooks/useLedgerStats.js');
const ledgerHookCode = fs.readFileSync(ledgerHookPath, 'utf8');

assert(ledgerHookCode.includes("where('creditPoints', '!=', 0)"),
  'useLedgerStats must query where creditPoints != 0 to net negative user balances');
assert(ledgerHookCode.includes('signedDiscrepancy'),
  'useLedgerStats must track signedDiscrepancy to distinguish surplus from deficit');
assert(ledgerHookCode.includes('trueEffectiveLiability = Math.max(totalAllocated, userStats.totalCredit)'),
  'useLedgerStats must factor circulating user liabilities into effective liability');
assert(ledgerHookCode.includes('remainingPool = Math.max(0, systemPoolMax - trueEffectiveLiability)'),
  'useLedgerStats must clamp remainingPool against effective liability to protect insolvency');
console.log('  ✅ PASS: useLedgerStats includes negative balances and implements Safe Remaining Pool');

// -----------------------------------------------------------------------------
// 4. Verify Listener Quota Leaks Elimination & Subscription Multiplexing
// -----------------------------------------------------------------------------
console.log('\n--- 4. Testing Listener Quota Leaks Elimination ---');

const boFormatPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/credit/creditFormatService.js');
const boFormatCode = fs.readFileSync(boFormatPath, 'utf8');
assert(!boFormatCode.includes('\ninitRoleTierConfigListener();'),
  'Backoffice creditFormatService must NOT execute initRoleTierConfigListener at top level');
console.log('  ✅ PASS: Backoffice creditFormatService does not leak top-level module listener');

const feFormatPath = path.join(REPO_ROOT, 'dh-frontend/src/firebase/credit/creditFormatService.js');
const feFormatCode = fs.readFileSync(feFormatPath, 'utf8');
assert(!feFormatCode.includes('\ninitRoleTierConfigListener();'),
  'Frontend creditFormatService must NOT execute initRoleTierConfigListener at top level');
console.log('  ✅ PASS: Frontend creditFormatService does not leak top-level module listener');

const feRealtimePath = path.join(REPO_ROOT, 'dh-frontend/src/firebase/credit/creditRealtimeService.js');
const feRealtimeCode = fs.readFileSync(feRealtimePath, 'utf8');
assert(feRealtimeCode.includes('userDocumentSubscriptionManager.subscribe'),
  'creditRealtimeService must route through userDocumentSubscriptionManager singleton');
assert(!feRealtimeCode.includes('onSnapshot(profileRef'),
  'creditRealtimeService must NOT open raw unmanaged onSnapshot listeners');
console.log('  ✅ PASS: Frontend creditRealtimeService multiplexes through userDocumentSubscriptionManager');

console.log('\n================================================================================');
console.log('📊 PHASE 3 AUDIT SUMMARY: ALL CHECKS PASSED');
console.log('🎉 VERIFICATION STATUS: 100% PERFECT PASS (PHASE 3 COMPLETE)');
console.log('================================================================================');
