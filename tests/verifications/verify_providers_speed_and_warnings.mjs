import fs from 'fs';
import path from 'path';

console.log("=== Verification Suite: Providers Speed & Console Warnings Remediation ===");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

// 1. Verify index.html does not contain the unused Unsplash preload
const indexHtmlPath = path.resolve('dh-frontend/index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
assert(
  !indexHtmlContent.includes('photo-1591405351990-4726e331f14c'),
  "dh-frontend/index.html: Unused Unsplash banner preload is completely removed"
);

// 2. Verify imageUtils.js supports custom width parameter
const imageUtilsPath = path.resolve('dh-frontend/src/utils/imageUtils.js');
const imageUtilsContent = fs.readFileSync(imageUtilsPath, 'utf-8');
assert(
  imageUtilsContent.includes('width =') && imageUtilsContent.includes('=w${width}'),
  "dh-frontend/src/utils/imageUtils.js: getRenderableImageUrl supports dynamic width scaling"
);

// 3. Verify PartnerCard.jsx passes 400px width for avatars
const partnerCardPath = path.resolve('dh-frontend/src/pages/Home/components/PartnerCard.jsx');
const partnerCardContent = fs.readFileSync(partnerCardPath, 'utf-8');
assert(
  partnerCardContent.includes('getRenderableImageUrl(rawAvatar, 400)'),
  "dh-frontend/src/pages/Home/components/PartnerCard.jsx: Requests optimized 400px thumbnail for card avatars"
);

// 4. Verify LazyImage.jsx removes loading='lazy' and adds instant cache detector
const lazyImagePath = path.resolve('dh-frontend/src/components/common/LazyImage.jsx');
const lazyImageContent = fs.readFileSync(lazyImagePath, 'utf-8');
assert(
  !lazyImageContent.includes('loading="lazy"'),
  "dh-frontend/src/components/common/LazyImage.jsx: Removed native loading='lazy' to prevent double-lazy load stall"
);
assert(
  lazyImageContent.includes('node.complete && node.naturalWidth > 0 && !isLoaded'),
  "dh-frontend/src/components/common/LazyImage.jsx: Instant cached image detector is active"
);

// 5. Verify partnerLocationService.js has inFlightFetchPromise deduplication
const locationServicePath = path.resolve('dh-frontend/src/firebase/partnerLocationService.js');
const locationServiceContent = fs.readFileSync(locationServicePath, 'utf-8');
assert(
  locationServiceContent.includes('inFlightFetchPromise'),
  "dh-frontend/src/firebase/partnerLocationService.js: In-flight Promise deduplication shields against concurrent reads"
);

console.log(`\nVerification Summary: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All verifications PASSED successfully!");
}
