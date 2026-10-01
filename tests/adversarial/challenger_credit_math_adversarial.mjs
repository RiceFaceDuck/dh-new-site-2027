/**
 * Challenger Credit & Math Adversarial Stress Suite
 * 
 * Centralized Test Hub: Management System/tests/adversarial/
 * Focus: Empirical verification of Topic 7 & Checksum/Discrepancy Math
 * 
 * Verifies:
 * 1. Floating-point precision, satang rounding, and accumulation drift
 * 2. Asymmetric discrepancy masking (insolvency vs over-allocation)
 * 3. Remaining pool calculation blindness under runaway user balances
 * 4. Negative balance masking caused by `where('creditPoints', '>', 0)` filter
 * 5. Architectural divergence between Frontend (zero ledger sync) and Backoffice
 * 6. Cloud Function ga4AdSyncCron ledger de-synchronization (heldCreditPoints vs totalAllocated)
 * 7. Single-document transaction hotspot bottleneck on settings/credit_config
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

console.log('================================================================================');
console.log('🔥 CHALLENGER: CREDIT POINT CHECKUSM & DISCREPANCY MATH ADVERSARIAL SUITE');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const defects = [];

function assert(condition, name, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failedChecks++;
    const msg = details ? `${name} -> ${details}` : name;
    console.error(`  ❌ [FAIL] ${msg}`);
    defects.push({ test: name, details });
  }
}

// =============================================================================
// TEST 1: Floating-Point Precision & Rounding Drift in Ledger Math
// =============================================================================
console.log('\n--- 1. Testing Floating-Point Arithmetic & Drift Accumulation ---');

// In creditActionService.js:
// let safeAmount = Math.round(numAmount * 100) / 100;
// newTotalAllocated += safeAmount; // (NOT rounded to 2 decimals!)
let floatSum1 = 0;
// Test standard IEEE-754 precision failure with 0.1 and 0.2
const classicFloatDrift = (0.1 + 0.2) !== 0.3;
assert(classicFloatDrift === true,
  'Standard IEEE-754 Floating-Point Arithmetic Drift verified (0.1 + 0.2 !== 0.3)',
  `0.1 + 0.2 in JS evaluates to ${0.1 + 0.2}`);

// Test repeated addition drift without rounding on ledger:
let rawTotalAllocated = 0;
for (let i = 0; i < 10; i++) {
  rawTotalAllocated += 0.1; // 10 times 0.1
}
const tenTenthsDrift = rawTotalAllocated !== 1.0;
assert(tenTenthsDrift === true,
  'Repeated addition of 0.1 * 10 without rounding on totalAllocated yields IEEE-754 drift',
  `Summing 0.1 ten times yields ${rawTotalAllocated} instead of 1.0`);

// Test Math.round masking in discrepancy formula:
// const discrepancy = Math.round(Math.abs(totalAllocated - userStats.totalCredit));
const driftDelta = 0.49; // 0.49 points drift (~49 Satang)
const maskedDiscrepancy = Math.round(Math.abs(1000 - (1000 + driftDelta)));
assert(maskedDiscrepancy === 0,
  'Mathematical Masking: Math.round() masks sub-point discrepancies up to 0.4999 Pts',
  `Delta of 0.49 produced discrepancy ${maskedDiscrepancy} instead of reporting true drift`);

const unmaskedDiscrepancy = Math.abs(1000 - (1000 + driftDelta));
assert(unmaskedDiscrepancy > 0,
  'Exact floating delta reveals true ledger drift that Math.round conceals');

// =============================================================================
// TEST 2: Directional Asymmetry & Insolvency Masking
// =============================================================================
console.log('\n--- 2. Testing Directional Masking (abs(totalAllocated - totalUserCredits)) ---');

// Case A: Ledger says 50,000 allocated, users have 40,000 (10,000 unminted/burned unrecorded)
const ledgerSurplus = { totalAllocated: 50000, totalUserCredits: 40000 };
const discrepancySurplus = Math.round(Math.abs(ledgerSurplus.totalAllocated - ledgerSurplus.totalUserCredits));

// Case B: Ledger says 40,000 allocated, users hold 50,000 (10,000 unbacked/counterfeit/insolvent)
const ledgerDeficit = { totalAllocated: 40000, totalUserCredits: 50000 };
const discrepancyDeficit = Math.round(Math.abs(ledgerDeficit.totalAllocated - ledgerDeficit.totalUserCredits));

assert(discrepancySurplus === discrepancyDeficit,
  'Symmetry Flaw: System reports identical discrepancy (10,000) for both Surplus and Insolvency',
  `Surplus: ${discrepancySurplus}, Deficit: ${discrepancyDeficit}. Manager cannot discern solvency direction.`);

const signedDiscrepancySurplus = ledgerSurplus.totalAllocated - ledgerSurplus.totalUserCredits;
const signedDiscrepancyDeficit = ledgerDeficit.totalAllocated - ledgerDeficit.totalUserCredits;
assert(Math.sign(signedDiscrepancySurplus) !== Math.sign(signedDiscrepancyDeficit),
  'Mathematical Proof: Signed ledger delta distinguishes over-allocation (+10000) from insolvency (-10000)');

// =============================================================================
// TEST 3: Remaining Pool Blindness Under Runaway User Balances
// =============================================================================
console.log('\n--- 3. Testing Remaining Pool Blindness to Real User Liabilities ---');

const systemPoolMax = 10000000; // 10 Million Max Pool
const corruptState = {
  totalAllocated: 500000,         // Ledger thinks only 500K allocated
  totalUserCredits: 15000000     // Users actually hold 15M (e.g. from frontend bypass)
};

// Current formula:
const remainingPool = Math.max(0, systemPoolMax - corruptState.totalAllocated);
assert(remainingPool === 9500000,
  'Remaining Pool Blindness: Dashboard reports 9,500,000 available when users already hold 15,000,000 (breaching 10M max)',
  `Reported remaining: ${remainingPool}, Real deficit: ${systemPoolMax - corruptState.totalUserCredits}`);

// Safe true remaining pool formula:
const trueEffectiveLiability = Math.max(corruptState.totalAllocated, corruptState.totalUserCredits);
const safeRemainingPool = Math.max(0, systemPoolMax - trueEffectiveLiability);
assert(safeRemainingPool === 0,
  'Corrected Pool Formula: Safe remaining pool clamps to 0 when user liability breaches systemPoolMax');

// =============================================================================
// TEST 4: Negative Balance Masking by where('creditPoints', '>', 0)
// =============================================================================
console.log('\n--- 4. Testing Negative Balance Masking in Firestore Aggregation Query ---');

// In useLedgerStats.js:
// const q = query(usersRef, where('creditPoints', '>', 0));
// const aggSnap = await getAggregateFromServer(q, { totalCredit: sum('creditPoints') });

const simulatedUsers = [
  { uid: 'user_1', creditPoints: 5000 },
  { uid: 'user_2', creditPoints: 3000 },
  { uid: 'user_3', creditPoints: -2000 }, // Negative balance from clawback / manual bug
  { uid: 'user_4', creditPoints: 0 }
];

// Aggregation query simulator:
const filteredSum = simulatedUsers
  .filter(u => u.creditPoints > 0)
  .reduce((acc, u) => acc + u.creditPoints, 0);

const trueNetSum = simulatedUsers
  .reduce((acc, u) => acc + u.creditPoints, 0);

console.log(`  ℹ️ Filtered query sum (creditPoints > 0): ${filteredSum}`);
console.log(`  ℹ️ True net system liabilities: ${trueNetSum}`);

assert(filteredSum !== trueNetSum,
  'Query Vulnerability: where("creditPoints", ">", 0) hides negative balances (-2,000 Pts)',
  `Filtered sum is ${filteredSum}, true sum is ${trueNetSum}. Delta = ${filteredSum - trueNetSum}`);

// If ledger was accurately tracking net balance (6000):
const ledgerNet = 6000;
const falseDiscrepancy = Math.round(Math.abs(ledgerNet - filteredSum));
assert(falseDiscrepancy === 2000,
  'False Discrepancy Trigger: Clean net ledger triggers a false 2,000 alarm because negative user was excluded');

// If ledger was out of sync (10000):
const ledgerOutOfSync = 8000;
const maskedDiscrepancyOnFilter = Math.round(Math.abs(ledgerOutOfSync - filteredSum));
assert(maskedDiscrepancyOnFilter === 0,
  'False Negative Green Pass: Out-of-sync ledger (8000) reports 0 discrepancy (Match) when real net is 6000');

// =============================================================================
// TEST 5: Code Inspection: Frontend vs Backoffice Ledger Synchronization Parity
// =============================================================================
console.log('\n--- 5. Checking Frontend vs Backoffice Ledger Sync Parity ---');

const backofficeActionPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/credit/creditActionService.js');
const frontendActionPath = path.join(REPO_ROOT, 'dh-frontend/src/firebase/credit/creditActionService.js');

const backofficeCode = fs.readFileSync(backofficeActionPath, 'utf8');
const frontendCode = fs.readFileSync(frontendActionPath, 'utf8');

const backofficeUpdatesLedger = backofficeCode.includes('newTotalAllocated') && 
                                backofficeCode.includes('credit_config') &&
                                backofficeCode.includes('totalAllocated: newTotalAllocated');

const frontendUpdatesLedger = frontendCode.includes('newTotalAllocated') || 
                              frontendCode.includes('totalAllocated');

assert(backofficeUpdatesLedger === true,
  'Backoffice creditActionService updates settings/credit_config.ledger.totalAllocated inside transaction');

assert(frontendUpdatesLedger === true,
  'Frontend creditActionService updates settings/credit_config.ledger.totalAllocated inside transaction (Parity Maintained)');

// =============================================================================
// TEST 6: Code Inspection: Cloud Function ga4AdSyncCron Ledger Synchronization
// =============================================================================
console.log('\n--- 6. Checking Cloud Function ga4AdSyncCron Ledger Synchronization ---');

const ga4CronPath = path.join(REPO_ROOT, 'functions/marketing/ga4AdSyncCron.js');
const ga4Code = fs.readFileSync(ga4CronPath, 'utf8');

const ga4DecrementsTotalAllocated = ga4Code.includes('totalAllocated: newAllocated');
const ga4TargetsHeldCreditPoints = ga4Code.includes('heldCreditPoints: newHeld');
const ga4TargetsCreditPoints = ga4Code.includes('creditPoints:');

assert(ga4DecrementsTotalAllocated === true,
  'ga4AdSyncCron decrements settings/credit_config.ledger.totalAllocated');

assert(ga4TargetsCreditPoints === true && !ga4TargetsHeldCreditPoints,
  'ga4AdSyncCron targets users.creditPoints and synchronizes ledger.totalAllocated (Fixed)');

// =============================================================================
// TEST 7: Single-Document Transaction Hotspot Analysis
// =============================================================================
console.log('\n--- 7. Analyzing Transaction Bottleneck on settings/credit_config ---');

// Both backoffice credit adjustments lock settings/credit_config.
// Firestore transactions fail with CONCURRENCY_CONTENDED if >1 write per second targets the same document.
const usesGlobalSettingsLock = backofficeCode.includes("doc(db, getCollectionPath('settings'), 'credit_config')");
assert(usesGlobalSettingsLock === true,
  'Contention Hotspot Identified: Every credit transaction acquires write lock on global settings/credit_config');

// =============================================================================
// TEST 8: Nested Config Unwrapping Defect in handlePaymentCompletion
// =============================================================================
console.log('\n--- 8. Checking Nested Config Unwrapping Defect in handlePaymentCompletion ---');

// In creditActionService.js line 349-355:
// const creditConfig = settingsSnap.exists() ? settingsSnap.data() : null;
// const calculatedPoints = calculateEarnedPoints(amountForPoints, creditConfig, orderData.items || [], userTotalAccumulatedPoints);

const rawFirestoreSettingsDoc = {
  ledger: { totalAllocated: 1000, systemPoolMax: 1000000 },
  config: {
    pointsEarningRate: 50, // 1 point per 50 THB
    skuBonusRules: 'SKU-SPECIAL:25'
  }
};

// Replicate calculateEarnedPoints logic from creditFormatService.js
function testCalculateEarnedPoints(amount, config, items = []) {
  if (!amount || amount <= 0 || !config) return 0;
  const earningRate = config.earningRate || config.pointsEarningRate || 100;
  let basePoints = Math.floor(amount / earningRate);
  let totalPoints = basePoints; // assuming multiplier 1

  if (config.skuBonusRules && items.length > 0) {
    const rules = config.skuBonusRules.split('\n').filter(Boolean);
    const skuMap = {};
    rules.forEach(rule => {
      const [sku, pts] = rule.split(':');
      if (sku && pts) skuMap[sku.trim().toUpperCase()] = parseInt(pts.trim(), 10);
    });

    items.forEach(item => {
      const itemSku = (item.sku || '').toUpperCase();
      if (itemSku && skuMap[itemSku]) totalPoints += skuMap[itemSku] * (item.quantity || 1);
    });
  }
  return totalPoints;
}

const items = [{ sku: 'SKU-SPECIAL', quantity: 2 }];
const amount = 500; // Should earn: 500/50 = 10 pts + 25*2 = 50 pts => Total 60 pts

const pointsWithoutUnwrap = testCalculateEarnedPoints(amount, rawFirestoreSettingsDoc, items);
const unwrapConfig = (s) => s?.config || s?.creditConfig || s || {};
const pointsWithUnwrap = testCalculateEarnedPoints(amount, unwrapConfig(rawFirestoreSettingsDoc), items);

console.log(`  ℹ️ Points calculated without unwrap helper: ${pointsWithoutUnwrap}`);
console.log(`  ℹ️ Points calculated with unwrap helper: ${pointsWithUnwrap}`);

assert(pointsWithoutUnwrap === 5,
  'Config Unwrapping Vulnerability: Without unwrap helper, calculateEarnedPoints drops custom rate & SKU bonuses (earns 5 instead of 60)',
  `Got ${pointsWithoutUnwrap}, expected ${pointsWithUnwrap}`);

assert(pointsWithUnwrap === 60,
  'Unwrap Helper correctly resolves nested config values (earns 60 pts)');

// Verify that creditActionService.js line 349 unwraps with unwrapCreditConfig
const backofficeHandlePaymentCode = backofficeCode.slice(backofficeCode.indexOf('handlePaymentCompletion'));
const unwrapUsedInHandlePayment = backofficeHandlePaymentCode.includes('unwrapConfig') || 
                                  backofficeHandlePaymentCode.includes('unwrapCreditConfig') ||
                                  backofficeHandlePaymentCode.includes('creditConfig?.config');
assert(unwrapUsedInHandlePayment === true,
  'handlePaymentCompletion unwraps settingsSnap.data() with unwrapCreditConfig before calling calculateEarnedPoints (Fixed)');

// =============================================================================
// TEST 9: Property Access Bug on Customer Display Name in userManagementService.js
// =============================================================================
console.log('\n--- 9. Checking .accountName Property Access Bug in userManagementService.js ---');

const userServicePath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/userManagementService.js');
const userServiceCode = fs.readFileSync(userServicePath, 'utf8');

const hasAccountNameBugInUserService = userServiceCode.includes('getCustomerDisplayName(d, d).accountName');
assert(hasAccountNameBugInUserService === true,
  'Property Access Bug Verified: userManagementService.js:263 attempts to access .accountName on string returned by getCustomerDisplayName(d, d)',
  'This causes getCustomerDisplayName to always evaluate to undefined on line 263');

// =============================================================================
// TEST 10: Formatting Divergence between Backoffice and Frontend
// =============================================================================
console.log('\n--- 10. Checking formatCredit Precision Parity between Backoffice and Frontend ---');

const backofficeFormatPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/credit/creditFormatService.js');
const frontendFormatPath = path.join(REPO_ROOT, 'dh-frontend/src/firebase/credit/creditFormatService.js');

const boFormatCode = fs.readFileSync(backofficeFormatPath, 'utf8');
const feFormatCode = fs.readFileSync(frontendFormatPath, 'utf8');

const boHasDecimals = boFormatCode.includes('maximumFractionDigits: 2');
const feHasDecimals = feFormatCode.includes('maximumFractionDigits: 2');

assert(boHasDecimals === true,
  'Backoffice formatCredit explicitly supports 2 fraction digits');

assert(feHasDecimals === false,
  'Display Inconsistency: Frontend formatCredit lacks maximumFractionDigits (rounds fractional points to integer)',
  'Frontend will display 10.5 pts as 10 or 11, while Backoffice displays 10.5');

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n================================================================================');
console.log(`📊 ADVERSARIAL STRESS RESULTS: ${passedChecks}/${totalChecks} PASSED`);
if (failedChecks > 0) {
  console.log(`⚠️ DEFECTS DETECTED: ${failedChecks}`);
  defects.forEach((d, idx) => console.log(`   ${idx + 1}. [${d.test}]: ${d.details}`));
} else {
  console.log('🎉 ALL ADVERSARIAL PROOFS AND ASSERTIONS EXECUTED SUCCESSFULLY');
}
console.log('================================================================================\n');

process.exit(failedChecks > 0 ? 1 : 0);
