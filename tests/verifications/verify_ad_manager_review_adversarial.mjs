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

// 7. Verify system_logs permission security and telemetry category inclusion
runTest("7. system_logs rules allow telemetry/marketing logs and marketingService writes category", () => {
  const rulesPath = path.resolve('firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8').replace(/\r\n/g, '\n');
  const servicePath = path.resolve('dh-frontend/src/firebase/marketingService.js');
  const serviceContent = fs.readFileSync(servicePath, 'utf8').replace(/\r\n/g, '\n');

  assert(rules.includes("request.resource.data.get('category', '') in ['client_error', 'client_warning', 'telemetry', 'ERROR', 'error', 'Marketing', 'marketing']"),
    "firestore.rules must allow telemetry/marketing category in system_logs");
  assert(serviceContent.includes("category: 'telemetry',\n        module: 'Marketing',\n        action: 'SubmitAd',"),
    "submitPartnerAd must explicitly include category: telemetry");
  assert(serviceContent.includes("category: 'telemetry',\n        module: 'Marketing',\n        action: 'UpdateAdRequest',"),
    "updatePartnerAd must explicitly include category: telemetry");
});

// 8. Verify deleteAd method implementation in adManagementService
runTest("8. adManagementService implements deleteAd with multi-collection and ActivePartners cleanup", () => {
  const servicePath = path.resolve('dh-backoffice-react/src/firebase/adManagementService.js');
  const content = fs.readFileSync(servicePath, 'utf8').replace(/\r\n/g, '\n');

  assert(content.includes("deleteAd: async (adId) => {"), "adManagementService must implement deleteAd");
  assert(content.includes("batch.delete(partnerAdRef);"), "deleteAd must delete from partner_ads");
  assert(content.includes("batch.delete(activePartnerRef);"), "deleteAd must clean up ActivePartners for business cards");
});

// 9. Verify marketingAnalyticsService resilient set with merge on masterRef sync
runTest("9. marketingAnalyticsService uses batch.set with merge: true for safe legacy sync", () => {
  const servicePath = path.resolve('dh-frontend/src/firebase/marketingAnalyticsService.js');
  const content = fs.readFileSync(servicePath, 'utf8').replace(/\r\n/g, '\n');

  assert(content.includes("batch.set(masterRef, updateData, { merge: true });"),
    "marketingAnalyticsService must use set with merge: true to avoid crashes on unmigrated ads");
  assert(!content.includes("batch.update(masterRef, updateData);"),
    "batch.update(masterRef) must be replaced with set merge");
});

// 10. Verify useAdManager handleDeleteAd confirmation and multi-collection cleanup
runTest("10. useAdManager handleDeleteAd prompts confirmation and cleans up legacy collections", () => {
  const hookPath = path.resolve('dh-frontend/src/components/profile/tabs/hooks/useAdManager.js');
  const content = fs.readFileSync(hookPath, 'utf8').replace(/\r\n/g, '\n');

  assert(content.includes("window.confirm('คุณแน่ใจหรือไม่ที่จะลบแคมเปญโฆษณานี้?')"),
    "handleDeleteAd must prompt user confirmation");
  assert(content.includes("batch.delete(doc(db, getCollectionPath('billboard_ads'), adId));"),
    "handleDeleteAd must clean up billboard_ads");
  assert(content.includes("batch.delete(doc(db, getCollectionPath('user_sku_ads'), adId));"),
    "handleDeleteAd must clean up user_sku_ads");
  assert(content.includes("batch.delete(doc(db, getCollectionPath('ActivePartners'), user.uid));"),
    "handleDeleteAd must clean up ActivePartners when business card is deleted");
});

// 11. Verify StoreProfileLocation parses coordinates with comma, space, and plus delimiters
runTest("11. StoreProfileLocation parses coordinates with comma, space, or plus delimiters", () => {
  const locationPath = path.resolve('dh-frontend/src/components/profile/tabs/store-profile/StoreProfileLocation.jsx');
  const content = fs.readFileSync(locationPath, 'utf8').replace(/\r\n/g, '\n');

  assert(content.includes("match(/(-?\\d+\\.\\d+)(?:\\s*,\\s*|\\s+|\\+)(-?\\d+\\.\\d+)/)"),
    "StoreProfileLocation must parse coordinates with comma, space, or plus delimiters");

  // Verify behavior against sample coordinates
  const regex = /(-?\d+\.\d+)(?:\s*,\s*|\s+|\+)(-?\d+\.\d+)/;
  const match1 = "13.956, 100.567".match(regex);
  const match2 = "13.956 100.567".match(regex);
  const match3 = "13.956+100.567".match(regex);

  assert(match1 && match1[1] === "13.956" && match1[2] === "100.567", "Comma match failed");
  assert(match2 && match2[1] === "13.956" && match2[2] === "100.567", "Space match failed");
  assert(match3 && match3[1] === "13.956" && match3[2] === "100.567", "Plus match failed");
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
