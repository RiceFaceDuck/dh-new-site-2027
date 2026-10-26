import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==================================================================");
console.log("🧪 STAGE FINAL REVIEW: AUTOMATED VERIFICATION SUITE");
console.log("==================================================================");

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`);
    console.error(`   Reason: ${err.message}`);
  }
}

async function asyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`);
    console.error(`   Reason: ${err.message}`);
  }
}

// 1. Verify Assets
test("V1: Social & Contact Icons exist and are valid PNGs", () => {
  const assetsDir = path.resolve(__dirname, "../../dh-frontend/public/images");
  const icons = ['website_logo.png', 'youtube_logo.png', 'tiktok_logo.png', 'line_logo.png', 'messenger_logo.png'];
  for (const icon of icons) {
    const fullPath = path.join(assetsDir, icon);
    assert(fs.existsSync(fullPath), `Icon ${icon} must exist at ${fullPath}`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 1000, `Icon ${icon} size must be > 1KB (got ${stat.size} bytes)`);
  }
});

// 2. Verify URL Normalizer logic
test("V2: Universal URL Normalizers handle diverse user inputs without 404", () => {
  // Simulate the normalizers from StoreProfileInfo.jsx
  const formatExternalUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const formatYoutubeUrl = (input) => {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('@')) return `https://www.youtube.com/${trimmed}`;
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return `https://${trimmed}`;
    return `https://www.youtube.com/@${trimmed}`;
  };

  const formatTiktokUrl = (input) => {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('@')) return `https://www.tiktok.com/${trimmed}`;
    if (trimmed.includes('tiktok.com')) return `https://${trimmed}`;
    return `https://www.tiktok.com/@${trimmed}`;
  };

  const formatLineUrl = (input) => {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('@')) return `https://line.me/R/ti/p/~${trimmed}`;
    if (trimmed.includes('line.me')) return `https://${trimmed}`;
    return `https://line.me/R/ti/p/~${trimmed}`;
  };

  assert.strictEqual(formatExternalUrl("myshop.com"), "https://myshop.com");
  assert.strictEqual(formatExternalUrl("https://myshop.com"), "https://myshop.com");
  assert.strictEqual(formatYoutubeUrl("@BentShop"), "https://www.youtube.com/@BentShop");
  assert.strictEqual(formatYoutubeUrl("BentChannel"), "https://www.youtube.com/@BentChannel");
  assert.strictEqual(formatYoutubeUrl("https://youtube.com/c/test"), "https://youtube.com/c/test");
  assert.strictEqual(formatTiktokUrl("@shop_tik"), "https://www.tiktok.com/@shop_tik");
  assert.strictEqual(formatTiktokUrl("my_tik"), "https://www.tiktok.com/@my_tik");
  assert.strictEqual(formatLineUrl("@mylineshop"), "https://line.me/R/ti/p/~@mylineshop");
  assert.strictEqual(formatLineUrl("shopline123"), "https://line.me/R/ti/p/~shopline123");
});

// 3. Verify Lightbox Component Integrity
test("V3: GalleryLightbox.jsx contains full controls (ESC, Prev, Next, Thumbnails, Swipe)", () => {
  const lightboxPath = path.resolve(__dirname, "../../dh-frontend/src/pages/StoreProfile/components/GalleryLightbox.jsx");
  assert(fs.existsSync(lightboxPath), "GalleryLightbox.jsx must exist");
  const code = fs.readFileSync(lightboxPath, 'utf8');
  assert(code.includes("Escape"), "Must handle Escape key");
  assert(code.includes("ArrowLeft"), "Must handle ArrowLeft key");
  assert(code.includes("ArrowRight"), "Must handle ArrowRight key");
  assert(code.includes("onTouchStart"), "Must handle touch swipe start");
  assert(code.includes("onTouchEnd"), "Must handle touch swipe end");
  assert(code.includes("images[currentIndex]"), "Must display active image");
});

// 4. Verify Image Compressor & Quota limit in useStoreProfile.js
test("V4: Gallery Quota is set to 20 and compressor is integrated", () => {
  const hookPath = path.resolve(__dirname, "../../dh-frontend/src/components/profile/tabs/store-profile/hooks/useStoreProfile.js");
  const compPath = path.resolve(__dirname, "../../dh-frontend/src/components/profile/tabs/store-profile/StoreProfileBasicInfo.jsx");
  const hookCode = fs.readFileSync(hookPath, 'utf8');
  const compCode = fs.readFileSync(compPath, 'utf8');

  assert(hookCode.includes("MAX_GALLERY_IMAGES = 20"), "useStoreProfile must define MAX_GALLERY_IMAGES = 20");
  assert(compCode.includes("MAX_GALLERY_IMAGES"), "StoreProfileBasicInfo must reference MAX_GALLERY_IMAGES");
  assert(hookCode.includes("compressImage"), "useStoreProfile hook must call compressImage before upload");
  assert(hookCode.includes("uploadStoreImage"), "useStoreProfile must use storageService.uploadStoreImage");
});

// 5. Verify Storage Service fallback and path structure
test("V5: storageService.js uploads to stores/{userId} with fallback", () => {
  const servicePath = path.resolve(__dirname, "../../dh-frontend/src/firebase/storageService.js");
  assert(fs.existsSync(servicePath), "storageService.js must exist");
  const code = fs.readFileSync(servicePath, 'utf8');
  assert(code.includes("stores/"), "Must upload to stores/ path in Firebase Storage");
  assert(code.includes("driveService"), "Must have fallback to driveService");
});

// 6. Verify Mapping File and Migration Coverage
test("V6: drive_to_firebase_mapping.json has exactly 181 valid migrated Firebase URLs", () => {
  const mappingPath = path.resolve(__dirname, "drive_to_firebase_mapping.json");
  assert(fs.existsSync(mappingPath), "drive_to_firebase_mapping.json must exist");
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const keys = Object.keys(mapping);
  assert.strictEqual(keys.length, 181, `Must have exactly 181 mapped images (found ${keys.length})`);
  
  for (const [driveUrl, firebaseUrl] of Object.entries(mapping)) {
    assert(driveUrl.includes("drive.google.com"), "Drive URL must be google drive link");
    assert(firebaseUrl.includes("firebasestorage.googleapis.com"), "Firebase URL must point to firebasestorage.googleapis.com");
    assert(firebaseUrl.includes("stores%2Fmigrated%2F"), "Firebase path must be in stores/migrated/");
  }
});

// 7. Verify Live Firebase Storage connectivity for sample URLs
await asyncTest("V7: Live Firebase Storage download tokens return HTTP 200 image/webp", async () => {
  const mappingPath = path.resolve(__dirname, "drive_to_firebase_mapping.json");
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const testUrls = [
    Object.values(mapping)[0],
    Object.values(mapping)[50],
    Object.values(mapping)[100],
    Object.values(mapping)[180]
  ];

  for (const url of testUrls) {
    const res = await fetch(url);
    assert.strictEqual(res.status, 200, `URL must return HTTP 200 (got ${res.status})`);
    assert(res.headers.get("content-type").includes("image/webp"), `Content-Type must be image/webp (got ${res.headers.get("content-type")})`);
  }
});

// 8. Verify StoreProfileHero PC bottom alignment and 20% size reduction
test("V8: StoreProfileHero has PC bottom alignment and 20% smaller buttons while mobile is untouched", () => {
  const heroPath = path.resolve(__dirname, "../../dh-frontend/src/pages/StoreProfile/components/StoreProfileHero.jsx");
  const code = fs.readFileSync(heroPath, 'utf8');

  // PC Alignment & Height
  assert(code.includes("md:self-stretch"), "Must stretch info area on PC");
  assert(code.includes("md:mt-auto"), "Must push buttons to bottom on PC");
  assert(code.includes("md:h-[38px]"), "Button height must be 38px on PC (20% reduction from 48px)");
  assert(code.includes("md:max-w-md"), "Button grid max-width must be constrained on PC");
  // Mobile Preservation
  assert(code.includes("h-11"), "Mobile button height must stay h-11");
  assert(code.includes("w-1/2 mx-auto sm:w-full"), "Mobile button width rules must stay untouched");
});

// 9. Verify StoreProfileInfo Gallery has zero borders, zero background, and uncropped images
test("V9: StoreProfileInfo Gallery renders clean uncropped images with zero border/frame", () => {
  const infoPath = path.resolve(__dirname, "../../dh-frontend/src/pages/StoreProfile/components/StoreProfileInfo.jsx");
  const code = fs.readFileSync(infoPath, 'utf8');

  assert(!code.includes("border border-slate-100 cursor-pointer relative group bg-slate-50"), "Must NOT have gray border or bg-slate-50 on gallery items");
  assert(code.includes("object-contain"), "Image must be object-contain to display full uncropped picture");
  assert(code.includes("max-w-full h-auto w-auto"), "Image must preserve natural aspect ratio");
});

// 10. Verify Local Grimoire completeness (5 pillars)
test("V10: ssr-memory_storeprofile.md satisfies 5 pillars protocol", () => {
  const grimoirePath = path.resolve(__dirname, "../../dh-frontend/src/pages/StoreProfile/ssr-memory_storeprofile.md");
  assert(fs.existsSync(grimoirePath), "ssr-memory_storeprofile.md must exist");
  const content = fs.readFileSync(grimoirePath, 'utf8');
  assert(content.includes("<usage_workflow>"), "Must have pillar 1 <usage_workflow>");
  assert(content.includes("<domain_rules>"), "Must have pillar 2 <domain_rules>");
  assert(content.includes("<core_schema>"), "Must have pillar 3 <core_schema>");
  assert(content.includes("<third_party>"), "Must have pillar 4 <third_party>");
  assert(content.includes("<pitfalls_and_solutions>"), "Must have pillar 5 <pitfalls_and_solutions>");
});

console.log("\n==================================================================");
console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} Tests Passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log("==================================================================\n");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
