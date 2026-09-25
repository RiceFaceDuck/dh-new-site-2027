/**
 * 🧪 DH Notebook Automated Verification Suite
 * Module: Ad Manager & Store Profile Parity & Security Rules
 * Path: tests/verifications/verify_ad_manager_parity.mjs
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Starting Ad Manager & Store Profile Parity Verification Suite...\n");

let passed = 0;
let failed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${testName}`);
    console.error(`   Error: ${err.message}\n`);
    failed++;
  }
}

// 1. Verify firestore.rules
runTest("1. firestore.rules allows owner Pause/Resume toggle for approved ads", () => {
  const rulesPath = path.resolve('firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  assert(rulesContent.includes("match /partner_ads/{adId}"), "Missing partner_ads rule");
  assert(rulesContent.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'isActive', 'updatedAt'])"), "Missing hasOnly status and isActive check");
  assert(rulesContent.includes("resource.data.status in ['active', 'paused', 'ACTIVE', 'PAUSED']"), "Missing pre-approval check for old status");
  assert(rulesContent.includes("request.resource.data.status in ['active', 'paused', 'ACTIVE', 'PAUSED']"), "Missing target active/paused constraint");
});

// 2. Verify Single Source of Truth in marketingService.js
runTest("2. marketingService.js writes exclusively to partner_ads (No Dual-Write)", () => {
  const servicePath = path.resolve('dh-frontend/src/firebase/marketingService.js');
  const content = fs.readFileSync(servicePath, 'utf8');

  // Must not write to oldCollectionName in submitPartnerAd or updatePartnerAd
  assert(!content.includes("batch.set(doc(db, getCollectionPath(oldCollectionName), adId), adPayload);"), "Legacy dual-write must be removed");
  
  // getUserPartnerAds must query single collection partner_ads
  assert(content.includes("collection(db, getCollectionPath('partner_ads'))"), "Must query partner_ads");
  assert(!content.includes("const [s1, s2, s3] = await Promise.all([p1, p2, p3]);"), "Must not query 3 collections in parallel");
});

// 3. Verify SSOT Priority and Fallback in Store Profile Reading
runTest("3. Store Profile reads SSOT users first and falls back to artifacts if unmigrated", () => {
  const tabPath = path.resolve('dh-frontend/src/components/profile/tabs/TabAdManager.jsx');
  const hookPath = path.resolve('dh-frontend/src/components/profile/tabs/hooks/useStoreProfileData.js');

  const tabContent = fs.readFileSync(tabPath, 'utf8');
  const hookContent = fs.readFileSync(hookPath, 'utf8');

  assert(!tabContent.includes("'artifacts', appId"), "TabAdManager must not read from artifacts collection");
  assert(hookContent.includes("getCollectionPath('users')"), "useStoreProfileData must read users path as SSOT primary");
  assert(hookContent.includes("legacyStoreRef"), "useStoreProfileData must maintain fallback for unmigrated data");
});

// 4. Verify Clean Architecture Pure UI in TabAdManager.jsx
runTest("4. TabAdManager.jsx is a Pure UI component powered by useAdManager", () => {
  const tabPath = path.resolve('dh-frontend/src/components/profile/tabs/TabAdManager.jsx');
  const content = fs.readFileSync(tabPath, 'utf8');

  assert(content.includes("useAdManager(user)"), "TabAdManager must call useAdManager hook");
  assert(!content.includes("const [ads, setAds] = useState"), "TabAdManager must not declare ads state directly");
  assert(!content.includes("const [storeData, setStoreData] = useState"), "TabAdManager must not declare storeData state directly");
  assert(content.split('\n').length <= 180, "TabAdManager must be under 180 lines (Pure Presentation)");
});

// 5. Verify Budget Checksum & Math Logic
runTest("5. Budget check compares spentBudget against creditLimit (not raw views)", () => {
  const analyticsPath = path.resolve('dh-frontend/src/firebase/marketingAnalyticsService.js');
  const content = fs.readFileSync(analyticsPath, 'utf8');

  // Must calculate spentBudget
  assert(content.includes("const currentSpent = Number(adData.spentBudget || 0);"), "Must read current spentBudget");
  assert(content.includes("const newSpent = currentSpent + costToDeduct;"), "Must accumulate newSpent from costToDeduct");
  assert(content.includes("if (newSpent >= adData.creditLimit)"), "Must check newSpent >= creditLimit");
  assert(!content.includes("(currentViews + stats.views) >= adData.creditLimit"), "Must NOT compare views count against creditLimit");
});

console.log(`\n========================================`);
console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL AD MANAGER PARITY CHECKS PASSED PERFECTLY!\n");
  process.exit(0);
}
