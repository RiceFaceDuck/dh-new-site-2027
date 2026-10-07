/**
 * 🧪 DH Notebook Automated Verification Suite
 * Module: Ad Manager & Store Profile Image Healing Verification (Phase 1)
 * Path: tests/verifications/verify_ad_image_healing.mjs
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Starting Ad Image Healing Verification Suite (Phase 1)...\n");

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

// 1. Verify StoreProfileBasicInfo uses LazyImage
runTest("1. StoreProfileBasicInfo.jsx imports and utilizes LazyImage for logo and gallery", () => {
  const filePath = path.resolve('dh-frontend/src/components/profile/tabs/store-profile/StoreProfileBasicInfo.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(content.includes("import LazyImage from '../../../common/LazyImage';"), "Missing LazyImage import");
  assert(content.includes("<LazyImage"), "Must use LazyImage component");
  assert(!content.includes('<img src={storeData.storeImage}'), "Raw img for storeImage must be replaced");
});

// 2. Verify AdListTable uses LazyImage
runTest("2. AdListTable.jsx uses LazyImage across mobile and desktop table views", () => {
  const filePath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(content.includes("import LazyImage from '../../../common/LazyImage';"), "Missing LazyImage import");
  assert(!content.includes('<img src={ad.imageUrl}'), "Raw img for ad.imageUrl must be replaced");
  assert(content.includes('fallbackSrc="/logo.png"'), "Must provide /logo.png fallbackSrc");
});

// 3. Verify storeProfileSubmitService purged placehold.co
runTest("3. storeProfileSubmitService.js uses local /logo.png instead of external placehold.co", () => {
  const filePath = path.resolve('dh-frontend/src/firebase/storeProfileSubmitService.js');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(!content.includes("placehold.co"), "placehold.co external dependency must be removed");
  assert(content.includes("imageUrl: finalStoreData.storeImage || '/logo.png'"), "Must fallback to /logo.png");
});

// 4. Verify AdPreviewCard purged placehold.co
runTest("4. AdPreviewCard.jsx uses LazyImage and purged placehold.co", () => {
  const filePath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdPreviewCard.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(!content.includes("placehold.co"), "placehold.co external dependency must be removed");
  assert(content.includes("import LazyImage from '../../../common/LazyImage';"), "Missing LazyImage import");
});

// 5. Verify StoreProfileForm Pending Badge has Calm UI (no animate-pulse)
runTest("5. StoreProfileForm.jsx Pending badge is static and free of animate-pulse", () => {
  const filePath = path.resolve('dh-frontend/src/components/profile/tabs/store-profile/StoreProfileForm.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(!content.includes('animate-pulse font-bold">🟡 รอตรวจสอบ (Pending)</span>'), "Pending badge must not have animate-pulse");
  assert(content.includes('font-bold">🟡 รอตรวจสอบ (Pending)</span>'), "Must have calm static Pending badge");
});

// 6. Verify useAdManager Quota Shield (no redundant fetchMyAds on mount)
runTest("6. useAdManager.js relies solely on onSnapshot on mount to cut reads by 50%", () => {
  const filePath = path.resolve('dh-frontend/src/components/profile/tabs/hooks/useAdManager.js');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify useEffect does NOT call fetchMyAds()
  const useEffectMatch = content.match(/useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[user\?\.uid\]\);/);
  assert(useEffectMatch, "Must find user.uid useEffect block in useAdManager.js");
  assert(!useEffectMatch[1].includes("fetchMyAds();"), "useEffect must NOT invoke fetchMyAds() concurrently with onSnapshot");
  assert(useEffectMatch[1].includes("onSnapshot"), "useEffect must utilize onSnapshot");
  assert(useEffectMatch[1].includes("liveAds.sort"), "onSnapshot must sort liveAds safely");
});

console.log(`\n========================================`);
console.log(`📊 Image Healing, Calm UI & Quota Shield Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL AD ENHANCEMENTS CHECKS PASSED PERFECTLY!\n");
  process.exit(0);
}
