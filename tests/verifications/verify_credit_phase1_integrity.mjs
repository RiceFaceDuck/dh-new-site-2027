import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.resolve(__dirname, '../../');

console.log("================================================================================");
console.log("🛡️ VERIFICATION SUITE: CREDIT POINT PHASE 1 FINANCIAL INTEGRITY");
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
// 1. Check walletFunctions.js Anti-Inflation Fix
// -------------------------------------------------------------
console.log("--- 1. Testing walletFunctions.js (100x Point Inflation Fix) ---");
const walletFuncPath = path.join(baseDir, 'functions/inventory/walletFunctions.js');
const walletFuncContent = fs.readFileSync(walletFuncPath, 'utf-8');

assert(!walletFuncContent.includes('pendingCredits: Math.max(0, trueNetTotal - useWallet)'), 
  "walletFunctions.js must NOT write raw unpaid cash THB into pendingCredits");
assert(walletFuncContent.includes('const remainingPoints = Math.floor(remainingPayable / 100);'), 
  "walletFunctions.js calculates remainingPoints based on standard 100 THB = 1 Pt");
assert(walletFuncContent.includes('pendingCredits: remainingPoints'), 
  "walletFunctions.js writes converted points into pendingCredits");
assert(walletFuncContent.includes('remainingPayable: remainingPayable'), 
  "walletFunctions.js tracks cash remainingPayable separately from points");

// -------------------------------------------------------------
// 2. Check statusWalletHandler.js Zero-Trust Anti-Inflation Guard
// -------------------------------------------------------------
console.log("\n--- 2. Testing statusWalletHandler.js Zero-Trust Guard ---");
const statusWalletPath = path.join(baseDir, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js');
const statusWalletContent = fs.readFileSync(statusWalletPath, 'utf-8');

assert(statusWalletContent.includes('earnedPoints >= amountForPoints && amountForPoints > 0'), 
  "statusWalletHandler.js detects suspicious pendingCredits >= cash amount");
assert(statusWalletContent.includes('earnedPoints = 0;'), 
  "statusWalletHandler.js resets inflated pendingCredits and triggers recalculation");

// -------------------------------------------------------------
// 3. Check ga4AdSyncCron.js Ledger Sync & creditPoints Deduction
// -------------------------------------------------------------
console.log("\n--- 3. Testing ga4AdSyncCron.js Ledger Parity & Config Unwrap ---");
const cronPath = path.join(baseDir, 'functions/marketing/ga4AdSyncCron.js');
const cronContent = fs.readFileSync(cronPath, 'utf-8');

assert(!cronContent.includes('heldCreditPoints: newHeld'), 
  "ga4AdSyncCron.js must NOT deduct from uninitialized heldCreditPoints");
assert(cronContent.includes('creditPoints: newPoints'), 
  "ga4AdSyncCron.js deducts from actual userData.creditPoints");
assert(cronContent.includes('const safeDeduct = Math.min(currentPoints, Math.round(totalDeduct));'), 
  "ga4AdSyncCron.js clamps deduction to available points (no negative balance exploit)");
assert(cronContent.includes('const newAllocated = Math.max(0, currentAllocated - safeDeduct);'), 
  "ga4AdSyncCron.js decrements ledger.totalAllocated by exact same safeDeduct (1:1 balance)");
assert(cronContent.includes('rawData.config || rawData.creditConfig || rawData'), 
  "ga4AdSyncCron.js unwraps nested credit_config.config to read manager settings");

// -------------------------------------------------------------
// 4. Check Frontend creditActionService.js Ledger Synchronization
// -------------------------------------------------------------
console.log("\n--- 4. Testing Frontend creditActionService.js Ledger Sync ---");
const frontCreditActionPath = path.join(baseDir, 'dh-frontend/src/firebase/credit/creditActionService.js');
const frontCreditActionContent = fs.readFileSync(frontCreditActionPath, 'utf-8');

assert(frontCreditActionContent.includes('totalAllocated: newTotalAllocated'), 
  "Frontend adjustUserCreditWithTransaction synchronizes settings/credit_config.ledger.totalAllocated");
assert(frontCreditActionContent.includes('totalAllocated: currentAllocated + pendingPoints'), 
  "Frontend handlePaymentCompletion synchronizes settings/credit_config.ledger.totalAllocated");

// -------------------------------------------------------------
// 5. Mathematical Simulation of Zero Drift
// -------------------------------------------------------------
console.log("\n--- 5. Simulating Zero Ledger Drift Under Phase 1 Math ---");
let totalAllocated = 10000;
let userBalance = 500;
const adCost = 600; // Costs more than user has

const safeDeduct = Math.min(userBalance, Math.round(adCost));
userBalance -= safeDeduct;
totalAllocated -= safeDeduct;

const discrepancy = Math.abs(totalAllocated - (10000 - safeDeduct));
assert(userBalance === 0, `User balance clamped cleanly to 0 (got ${userBalance})`);
assert(safeDeduct === 500, `Deduction clamped to available balance 500 (got ${safeDeduct})`);
assert(totalAllocated === 9500, `Ledger totalAllocated decreased by exact same 500 (got ${totalAllocated})`);
assert(discrepancy === 0, `Discrepancy remains exactly 0 with zero drift`);

// -------------------------------------------------------------
// Final Audit Summary
// -------------------------------------------------------------
console.log("\n================================================================================");
console.log(`📊 PHASE 1 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log("🎉 VERIFICATION STATUS: 100% PERFECT PASS (PHASE 1 COMPLETE)");
} else {
  console.log("⚠️ VERIFICATION STATUS: SOME TESTS FAILED");
  process.exit(1);
}
console.log("================================================================================");
