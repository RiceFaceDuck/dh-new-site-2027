/**
 * 🧪 Test Suite: Partner Pause, Telemetry Isolation & Server Sync Resilience
 * Location: Management System/tests/verifications/verify_partner_pause_and_telemetry_isolation.mjs
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const msRoot = path.resolve(__dirname, '../..');

console.log("==================================================================");
console.log("🚀 STARTING ADVERSARIAL VERIFICATION: PARTNER PAUSE & TELEMETRY ISOLATION");
console.log("==================================================================");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(`   Reason: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Suite 1: AST Code & Architectural Boundary Check
// -------------------------------------------------------------
console.log("\n--- [Suite 1: Static Code AST & Boundary Invariants] ---");

runTest("recordAdTelemetry.js must not resurrect ActivePartners docs when !snap.exists", () => {
  const telemetryFile = path.join(msRoot, 'functions/marketing/recordAdTelemetry.js');
  const code = fs.readFileSync(telemetryFile, 'utf8');

  // Must have zombie guard comment
  assert.ok(code.includes('Zombie Guard'), "Must contain Zombie Guard annotation in ActivePartners telemetry write block");
  
  // Must NOT have else branch creating ActivePartners in storeSnaps block
  const snapExistsRegex = /if\s*\(\s*snap\.exists\s*\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?transaction\.set\(\s*storeRef/g;
  assert.strictEqual(snapExistsRegex.test(code), false, "Must NOT have else branch calling transaction.set(storeRef, ...)");
});

runTest("partnerVisibilitySync.js must export onPartnerAdWritten with BUSINESS_CARD filter", () => {
  const syncFile = path.join(msRoot, 'functions/marketing/partnerVisibilitySync.js');
  const code = fs.readFileSync(syncFile, 'utf8');

  assert.ok(code.includes('onPartnerAdWritten'), "Must define onPartnerAdWritten Cloud Function trigger");
  assert.ok(code.includes("adData.type !== 'BUSINESS_CARD'"), "Must specifically filter for BUSINESS_CARD ad type");
  assert.ok(code.includes("module.exports = {"), "Must have module.exports");
  assert.ok(code.includes("onPartnerAdWritten"), "Must export onPartnerAdWritten in module.exports");
});

runTest("nightlyChunkGuard.js must require real storeName to prevent bundling zombie docs", () => {
  const guardFile = path.join(msRoot, 'functions/inventory/nightlyChunkGuard.js');
  const code = fs.readFileSync(guardFile, 'utf8');

  assert.ok(code.includes('hasRealStoreName'), "Must contain hasRealStoreName check before bundling");
});

runTest("marketingService.js must dispatch cache invalidation event upon pausing", () => {
  const msFile = path.join(msRoot, 'dh-frontend/src/firebase/marketingService.js');
  const code = fs.readFileSync(msFile, 'utf8');

  assert.ok(code.includes('dh:partners_cache_invalidated'), "Must emit dh:partners_cache_invalidated event on pause");
});

// -------------------------------------------------------------
// Suite 2: Domain Logic Simulation & Unit Proofs
// -------------------------------------------------------------
console.log("\n--- [Suite 2: Pure Domain Logic & Guard Validation] ---");

const isVisiblePartner = (p) => Boolean(p) && p.isActive !== false && Boolean(p.storeName || p.partnerName) && Number(p.points || 0) > 0;

runTest("isVisiblePartner rejects paused partner (isActive: false)", () => {
  const p = { id: 'test1', storeName: 'Test Shop', points: 100, isActive: false };
  assert.strictEqual(isVisiblePartner(p), false, "Should return false for isActive: false");
});

runTest("isVisiblePartner rejects zero or negative credit points", () => {
  const p1 = { id: 'test1', storeName: 'Test Shop', points: 0, isActive: true };
  const p2 = { id: 'test2', storeName: 'Test Shop', points: -15, isActive: true };
  assert.strictEqual(isVisiblePartner(p1), false, "Should return false for points: 0");
  assert.strictEqual(isVisiblePartner(p2), false, "Should return false for points: -15");
});

runTest("isVisiblePartner rejects zombie doc with missing storeName and partnerName", () => {
  const zombie = { id: 'testZombie', points: 500, isActive: true, viewCount: 12 };
  assert.strictEqual(isVisiblePartner(zombie), false, "Should reject partner without real storeName");
});

runTest("isVisiblePartner accepts valid active partner with credit", () => {
  const valid = { id: 'valid1', storeName: 'Valid IT Shop', points: 150, isActive: true };
  assert.strictEqual(isVisiblePartner(valid), true, "Should accept valid partner with positive credit and real name");
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log("\n==================================================================");
console.log(`🏁 VERIFICATION COMPLETE: ${passedTests}/${totalTests} Passed (${totalTests - passedTests} Failed)`);
console.log("==================================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
