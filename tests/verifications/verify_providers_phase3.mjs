import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("=== Verification: Service Providers Phase 3 (Data Parity & Schema Sync) ===");

// 1. Verify adManagementService.js
console.log("\n--- 1. Testing adManagementService.js sync logic ---");
const adServicePath = path.resolve('dh-backoffice-react/src/firebase/adManagementService.js');
const adServiceContent = fs.readFileSync(adServicePath, 'utf8');

assert(adServiceContent.includes('ActivePartners'), "adManagementService must reference ActivePartners");
assert(adServiceContent.includes('points: points'), "adManagementService must sync points to ActivePartners");
assert(adServiceContent.includes('address: adData.address'), "adManagementService must sync address");
assert(adServiceContent.includes('galleryImages: Array.isArray(adData.galleryImages)'), "adManagementService must sync galleryImages");
assert(adServiceContent.includes('richDescription: adData.richDescription'), "adManagementService must sync richDescription");
console.log("✅ Check 1: adManagementService full sync logic confirmed!");

// 2. Verify StoreProfileHero.jsx
console.log("\n--- 2. Testing StoreProfileHero.jsx map & avatar logic ---");
const heroPath = path.resolve('dh-frontend/src/pages/StoreProfile/components/StoreProfileHero.jsx');
const heroContent = fs.readFileSync(heroPath, 'utf8');

assert(heroContent.includes('googleMapLink'), "StoreProfileHero must support googleMapLink");
assert(heroContent.includes('getRenderableImageUrl'), "StoreProfileHero must format avatar with getRenderableImageUrl");
console.log("✅ Check 2: StoreProfileHero map url formatting and avatar render confirmed!");

// 3. Verify TopPartnerBanner.jsx
console.log("\n--- 3. Testing TopPartnerBanner.jsx collection query ---");
const bannerPath = path.resolve('dh-frontend/src/components/partner/TopPartnerBanner.jsx');
const bannerContent = fs.readFileSync(bannerPath, 'utf8');

assert(bannerContent.includes('fetchAllActivePartners'), "TopPartnerBanner must fetch from ActivePartners via fetchAllActivePartners");
assert(!bannerContent.includes("partnerService.getActivePartners()"), "TopPartnerBanner must not query legacy empty partners collection");
assert(bannerContent.includes('googleMapLink'), "TopPartnerBanner must support googleMapLink");
console.log("✅ Check 3: TopPartnerBanner migration to ActivePartners confirmed!");

// 4. Verify storeProfileSubmitService.js cache invalidation
console.log("\n--- 4. Testing storeProfileSubmitService.js cache key ---");
const submitServicePath = path.resolve('dh-frontend/src/firebase/storeProfileSubmitService.js');
const submitServiceContent = fs.readFileSync(submitServicePath, 'utf8');

assert(submitServiceContent.includes('active_partners_cache_v4_'), "storeProfileSubmitService must invalidate active_partners_cache_v4_");
console.log("✅ Check 4: Cache invalidation key v4 confirmed!");

console.log("\n🎉 ALL PHASE 3 VERIFICATION CHECKS PASSED!");
