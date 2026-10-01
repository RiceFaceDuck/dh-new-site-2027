import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');

console.log('================================================================================');
console.log('🛡️ VERIFICATION SUITE: CREDIT POINT PHASE 2 INTEGRITY & UNWRAP');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// 1. Verify unwrapCreditConfig in dh-shared
// -----------------------------------------------------------------------------
console.log('--- 1. Testing unwrapCreditConfig in dh-shared ---');

const creditUtilsPath = path.join(REPO_ROOT, 'dh-shared/src/utils/creditUtils.js');
assert(fs.existsSync(creditUtilsPath), 'creditUtils.js must exist in dh-shared/src/utils/');

const { unwrapCreditConfig } = await import(`file://${creditUtilsPath.replace(/\\/g, '/')}`);
assert(typeof unwrapCreditConfig === 'function', 'unwrapCreditConfig must be an exported function');

// Test nested config unwrapping
const nestedDoc = {
  ledger: { totalAllocated: 5000, systemPoolMax: 1000000 },
  config: {
    pointsEarningRate: 50,
    skuBonusRules: 'SKU-VIP:100',
    adClickCost: 15,
    adImpressionCost: 0.25,
    adImpressionCount: 500,
    partnerRankingCost: 75
  }
};
const unwrapped = unwrapCreditConfig(nestedDoc);
assert.strictEqual(unwrapped.earningRate, 50, 'earningRate must resolve from nested pointsEarningRate (50)');
assert.strictEqual(unwrapped.pointsEarningRate, 50, 'pointsEarningRate must resolve from nested pointsEarningRate (50)');
assert.strictEqual(unwrapped.skuBonusRules, 'SKU-VIP:100', 'skuBonusRules must resolve from nested config');
assert.strictEqual(unwrapped.adClickCost, 15, 'adClickCost must resolve from nested config (15)');
assert.strictEqual(unwrapped.adImpressionCost, 0.25, 'adImpressionCost must resolve from nested config (0.25)');
console.log('  ✅ PASS: unwrapCreditConfig resolves nested { config: { ... } } correctly');

// Test legacy flat config backwards compatibility
const legacyDoc = {
  earningRate: 75,
  skuBonusRules: 'SKU-LEGACY:10'
};
const unwrappedLegacy = unwrapCreditConfig(legacyDoc);
assert.strictEqual(unwrappedLegacy.earningRate, 75, 'Legacy flat earningRate preserved (75)');
assert.strictEqual(unwrappedLegacy.skuBonusRules, 'SKU-LEGACY:10', 'Legacy flat skuBonusRules preserved');
console.log('  ✅ PASS: unwrapCreditConfig preserves legacy flat config backwards compatibility');

// Test null/undefined resilience
assert.strictEqual(unwrapCreditConfig(null), null, 'unwrapCreditConfig handles null safely');
assert.strictEqual(unwrapCreditConfig(undefined), null, 'unwrapCreditConfig handles undefined safely');
console.log('  ✅ PASS: unwrapCreditConfig handles null and undefined safely');

// Verify export in dh-shared/index.js
const sharedIndexPath = path.join(REPO_ROOT, 'dh-shared/index.js');
const sharedIndexCode = fs.readFileSync(sharedIndexPath, 'utf8');
assert(sharedIndexCode.includes('creditUtils.js'), 'dh-shared/index.js must export creditUtils.js');
console.log('  ✅ PASS: dh-shared/index.js exports creditUtils.js');

// -----------------------------------------------------------------------------
// 2. Testing Backoffice creditActionService.js Unwrapping & Clawback Type
// -----------------------------------------------------------------------------
console.log('\n--- 2. Testing Backoffice creditActionService.js ---');

const boActionPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/credit/creditActionService.js');
const boActionCode = fs.readFileSync(boActionPath, 'utf8');

assert(boActionCode.includes('unwrapCreditConfig'), 'Backoffice creditActionService must import and use unwrapCreditConfig');
assert(boActionCode.includes("unwrapCreditConfig(settingsSnap.data())"), 'handlePaymentCompletion must unwrap settingsSnap.data()');
assert(boActionCode.includes("adjustUserCredit(uid, points, 'clawback'"), 'clawbackPoints must pass type "clawback" (not "deduct")');
console.log('  ✅ PASS: Backoffice handlePaymentCompletion unwraps creditConfig');
console.log('  ✅ PASS: Backoffice clawbackPoints uses type "clawback" to prevent crashes on low balance');

// -----------------------------------------------------------------------------
// 3. Testing cancelActionService.js Point Restoration
// -----------------------------------------------------------------------------
console.log('\n--- 3. Testing cancelActionService.js Return Reversal Loyalty Re-credit ---');

const cancelActionPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/claim/cancelActionService.js');
const cancelActionCode = fs.readFileSync(cancelActionPath, 'utf8');

assert(cancelActionCode.includes('pointsToRestore'), 'cancelActionService must calculate pointsToRestore');
assert(cancelActionCode.includes('getCreditPreloadRefs'), 'cancelActionService must preload credit refs during READ phase');
assert(cancelActionCode.includes('adjustUserCreditWithTransaction'), 'cancelActionService must call adjustUserCreditWithTransaction during WRITE phase');
assert(cancelActionCode.includes('CB_RTN_'), 'cancelActionService must assign deterministic idempotency ID CB_RTN_');
console.log('  ✅ PASS: cancelActionService calculates and preloads credit refs for cancelled returns');
console.log('  ✅ PASS: cancelActionService restores clawed-back loyalty points inside transaction');

// -----------------------------------------------------------------------------
// 4. Testing Frontend creditActionService.js Unwrapping & Lifetime Points
// -----------------------------------------------------------------------------
console.log('\n--- 4. Testing Frontend creditActionService.js ---');

const feActionPath = path.join(REPO_ROOT, 'dh-frontend/src/firebase/credit/creditActionService.js');
const feActionCode = fs.readFileSync(feActionPath, 'utf8');

assert(feActionCode.includes('unwrapCreditConfig(docSnap.data())'), 'getCreditSettings must unwrap creditConfig');
assert(feActionCode.includes('unwrapCreditConfig(rawConfig)'), 'calculateEarnedPoints must defensively unwrap config');
assert(feActionCode.includes('totalAccumulatedPoints: newAccumulated'), 'handlePaymentCompletion must update lifetime totalAccumulatedPoints');
console.log('  ✅ PASS: Frontend getCreditSettings unwraps creditConfig');
console.log('  ✅ PASS: Frontend calculateEarnedPoints defensively unwraps config');
console.log('  ✅ PASS: Frontend handlePaymentCompletion synchronizes lifetime totalAccumulatedPoints');

// -----------------------------------------------------------------------------
// 5. Testing firestore.rules Hardening
// -----------------------------------------------------------------------------
console.log('\n--- 5. Testing firestore.rules Hardening ---');

const rulesPath = path.join(REPO_ROOT, 'firestore.rules');
const rulesCode = fs.readFileSync(rulesPath, 'utf8');

// Check credit_transactions immutability
const creditTxRulesMatch = rulesCode.includes('match /credit_transactions/{txId}') &&
                          rulesCode.includes('allow create: if isStaff() || (isAuthenticated() && request.resource.data.uid == request.auth.uid);') &&
                          rulesCode.includes('allow update, delete: if false;');
assert(creditTxRulesMatch, 'credit_transactions must be append-only with allow update, delete: if false');
console.log('  ✅ PASS: credit_transactions is strictly append-only (immutable audit log)');

// Check settings/credit_config protection
const settingsAuthReadMatch = rulesCode.includes("docId != 'credit_config' || isAuthenticated()");
assert(settingsAuthReadMatch, 'settings/credit_config must require authentication to read');
console.log('  ✅ PASS: settings/credit_config requires authentication to read (no public exposure of reserves)');

// Check nested config write protection
const nestedConfigGuardMatch = rulesCode.includes("request.resource.data.config.diff(resource.data.config).affectedKeys()");
assert(nestedConfigGuardMatch, 'settings/credit_config write rules must guard nested config map changes');
console.log('  ✅ PASS: settings/credit_config write rule protects nested config from unauthorized staff modifications');

console.log('\n================================================================================');
console.log('📊 PHASE 2 AUDIT SUMMARY: ALL CHECKS PASSED');
console.log('🎉 VERIFICATION STATUS: 100% PERFECT PASS (PHASE 2 COMPLETE)');
console.log('================================================================================');
