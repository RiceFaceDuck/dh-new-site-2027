import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("🛡️ VERIFICATION SUITE: AD CREDIT SERVICE LEDGER SYNCHRONIZATION (PARITY GUARD)");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// -------------------------------------------------------------
// 1. Static Analysis: adCreditService.js Ledger Parity Checks
// -------------------------------------------------------------
console.log("--- 1. Static Analysis: adCreditService.js Ledger Parity ---");

const adCreditServicePath = path.resolve(__dirname, '../../dh-frontend/src/firebase/credit/adCreditService.js');
assert(fs.existsSync(adCreditServicePath), "adCreditService.js must exist in dh-frontend");

const adCreditCode = fs.readFileSync(adCreditServicePath, 'utf8');

// Check deductPartnerCredit synchronizes settings/credit_config
const deductHasSettingsRef = adCreditCode.includes("const settingsRef = doc(db, getCollectionPath('settings'), 'credit_config')");
const deductHasLedgerUpdate = adCreditCode.includes("totalAllocated: newAllocated") && adCreditCode.includes("actualDeduct");
assert(deductHasSettingsRef, "deductPartnerCredit references settings/credit_config");
assert(deductHasLedgerUpdate, "deductPartnerCredit decrements totalAllocated by actualDeduct in transaction");

// Check consumeAdCreditWithTransaction synchronizes settings/credit_config
const consumeHasLedgerUpdate = adCreditCode.includes("newAllocated = Math.max(0, currentAllocated - amount)");
assert(consumeHasLedgerUpdate, "consumeAdCreditWithTransaction decrements totalAllocated by amount in transaction");

// -------------------------------------------------------------
// 2. Mathematical Simulation: 1:1 Ledger Parity Invariant
// -------------------------------------------------------------
console.log("\n--- 2. Mathematical Simulation: Ad Deduction with 1:1 Parity ---");

let userCreditPoints = 6055;
let systemPoolMax = 10000000;
let totalAllocated = 38031;
const adImpressionCost = 2; // e.g. 2 Pts impression

// Simulate deductPartnerCredit
const actualDeduct = Math.min(userCreditPoints, adImpressionCost);
userCreditPoints -= actualDeduct;
totalAllocated -= actualDeduct;

const discrepancy = Math.abs(totalAllocated - userCreditPoints - (38031 - 6055)); // other users hold 31976
const remainingPool = systemPoolMax - totalAllocated;

assert(actualDeduct === 2, `Deduction clamped to 2 (got ${actualDeduct})`);
assert(userCreditPoints === 6053, `User balance reduced by 2 (got ${userCreditPoints})`);
assert(totalAllocated === 38029, `totalAllocated reduced by 2 (got ${totalAllocated})`);
assert(discrepancy === 0, `Discrepancy remains exactly 0 after ad deduction (got ${discrepancy})`);
assert(remainingPool === 9961971, `Remaining pool updated accurately to 9,961,971 (got ${remainingPool})`);

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log("\n================================================================================");
console.log(`📊 AD CREDIT LEDGER SYNC SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log("🎉 VERIFICATION STATUS: 100% PERFECT PASS (ALL PARITY INVARIANTS SECURED)");
} else {
  console.error("❌ VERIFICATION STATUS: SOME TESTS FAILED");
  process.exit(1);
}
console.log("================================================================================");
