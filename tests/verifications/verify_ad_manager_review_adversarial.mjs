/**
 * 🧪 DH Notebook Automated Adversarial Verification Suite
 * Module: Ad Manager & Store Profile Module Deep Review
 * Path: tests/verifications/verify_ad_manager_review_adversarial.mjs
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Starting Ad Manager Adversarial Verification Suite...\n");

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

// 1. Verify firestore.rules allows re-inspection/resubmission to pending
runTest("1. firestore.rules allows owner to submit ad for re-inspection (status: pending, isActive: false)", () => {
  const rulesPath = path.resolve('firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8').replace(/\r\n/g, '\n');

  // Verify status pending allowed with isActive == false
  assert(rules.includes("request.resource.data.status in ['pending', 'PENDING'] && request.resource.data.isActive == false"), 
    "firestore.rules must allow owner to transition status to pending with isActive false");
  
  // Verify stats protected
  assert(rules.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(["), 
    "firestore.rules must forbid touching stats/financial keys");
});

// 2. Verify adManagementService in Backoffice resolves SSOT partner_ads
runTest("2. adManagementService resolves partner_ads first in approveAd, rejectAd, and pauseAd", () => {
  const backofficeServicePath = path.resolve('dh-backoffice-react/src/firebase/adManagementService.js');
  const content = fs.readFileSync(backofficeServicePath, 'utf8').replace(/\r\n/g, '\n');

  // Must check partner_ads first in approveAd
  assert(content.includes("const partnerAdRef = doc(collection(db, getCollectionPath('partner_ads')), adId);"),
    "approveAd must look up ad in partner_ads SSOT");
  
  // Must update partnerAdRef if it exists
  assert(content.includes("if (partnerSnap.exists()) {\n        batch.update(partnerAdRef, updatePayload);"),
    "approveAd/rejectAd/pauseAd must update partnerAdRef if it exists");
  
  // Must support legacy fallback
  assert(content.includes("const legacySnap = legacyRef ? await getDoc(legacyRef) : null;"),
    "Must check legacySnap as fallback");
});

// 3. Verify resubmitPartnerAd handles fallback target and deactivation
runTest("3. resubmitPartnerAd handles fallback target and sets isActive: false", () => {
  const servicePath = path.resolve('dh-frontend/src/firebase/marketingService.js');
  const content = fs.readFileSync(servicePath, 'utf8').replace(/\r\n/g, '\n');

  assert(content.includes("let targetRef = null;"), "resubmitPartnerAd must track targetRef dynamically");
  assert(content.includes("if (targetRef) {\n        batch.update(targetRef, updatePayload);\n      }"),
    "resubmitPartnerAd must update targetRef even when found in legacy collection");
  assert(content.includes("status: 'pending',\n        isActive: false,"),
    "resubmitPartnerAd must set isActive to false");
});

// 4. Verify useAdManager handles optimistic updates for businessCardAd
runTest("4. useAdManager synchronizes businessCardAd optimistically on toggle", () => {
  const hookPath = path.resolve('dh-frontend/src/components/profile/tabs/hooks/useAdManager.js');
  const content = fs.readFileSync(hookPath, 'utf8').replace(/\r\n/g, '\n');

  assert(content.includes("if (businessCardAd && businessCardAd.id === ad.id) {\n      setBusinessCardAd(prev => ({ ...prev, status: nextStatus, isActive: !isCurrentlyActive }));\n    }"),
    "useAdManager must update businessCardAd optimistically on toggle");
  assert(content.includes("if (businessCardAd && businessCardAd.id === ad.id) {\n        setBusinessCardAd(prev => ({ ...prev, status: ad.status, isActive: ad.isActive }));\n      }"),
    "useAdManager must rollback businessCardAd on toggle error");
});

// 5. Verify StoreProfileLocation handles exotic Google Maps coordinates
runTest("5. StoreProfileLocation parses !3d!4d and URL parameter Google Maps formats", () => {
  const locationPath = path.resolve('dh-frontend/src/components/profile/tabs/store-profile/StoreProfileLocation.jsx');
  const content = fs.readFileSync(locationPath, 'utf8').replace(/\r\n/g, '\n');

  // Verify !3d!4d pattern
  assert(content.includes("match(/!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/)"), 
    "StoreProfileLocation must parse !3d!4d coordinates from Google Maps URLs");

  // Verify parameter parsing
  assert(content.includes("lat="), "StoreProfileLocation must parse lat= query parameters");
});

// 6. Verify Avatar error resets when user photoURL changes
runTest("6. Navbar and ProfileSidebar reset avatarError on photoURL change", () => {
  const navbarPath = path.resolve('dh-frontend/src/components/Navbar.jsx');
  const sidebarPath = path.resolve('dh-frontend/src/components/profile/ProfileSidebar.jsx');

  const navContent = fs.readFileSync(navbarPath, 'utf8').replace(/\r\n/g, '\n');
  const sideContent = fs.readFileSync(sidebarPath, 'utf8').replace(/\r\n/g, '\n');

  assert(navContent.includes("setNavAvatarError(false);"), "Navbar must reset navAvatarError on photoURL change");
  assert(sideContent.includes("setAvatarError(false);"), "ProfileSidebar must reset avatarError on photoURL change");
});

console.log(`\n========================================`);
console.log(`📊 Adversarial Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL ADVERSARIAL REVIEWS PASSED PERFECTLY!\n");
  process.exit(0);
}
