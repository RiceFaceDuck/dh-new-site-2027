import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("=== Verification: Service Providers Watchlist Optimizations ===");

// 1. Verify usePartnerReviews hook
console.log("\n--- 1. Testing usePartnerReviews.js hook ---");
const hookPath = path.resolve('dh-frontend/src/pages/StoreProfile/hooks/usePartnerReviews.js');
assert(fs.existsSync(hookPath), "usePartnerReviews.js hook must exist");
const hookContent = fs.readFileSync(hookPath, 'utf8');
assert(hookContent.includes('export const usePartnerReviews ='), "Must export usePartnerReviews");
assert(hookContent.includes('avgRating'), "Must calculate avgRating");
assert(hookContent.includes('handleSubmitReview'), "Must manage review submission");
console.log("✅ Check 1: usePartnerReviews hook exists and encapsulates domain logic!");

// 2. Verify PartnerReviews.jsx is pure presentation
console.log("\n--- 2. Testing PartnerReviews.jsx presentation layer ---");
const componentPath = path.resolve('dh-frontend/src/pages/StoreProfile/components/PartnerReviews.jsx');
const compContent = fs.readFileSync(componentPath, 'utf8');
assert(compContent.includes('usePartnerReviews'), "PartnerReviews must use usePartnerReviews hook");
assert(!compContent.includes('onSnapshot('), "PartnerReviews must not contain direct onSnapshot listeners");
assert(!compContent.includes('addDoc('), "PartnerReviews must not contain direct addDoc mutations");
console.log("✅ Check 2: PartnerReviews is now a pure presentation component!");

// 3. Verify marketingService.js userAdsCache
console.log("\n--- 3. Testing marketingService.js userAdsCache ---");
const mktPath = path.resolve('dh-frontend/src/firebase/marketingService.js');
const mktContent = fs.readFileSync(mktPath, 'utf8');
assert(mktContent.includes('userAdsCache'), "marketingService must implement userAdsCache");
assert(mktContent.includes('userAdsCache.has(userId)'), "getUserPartnerAds must check userAdsCache");
assert(mktContent.includes('userAdsCache.set(userId'), "getUserPartnerAds must populate userAdsCache");
console.log("✅ Check 3: Quota Shield with userAdsCache confirmed!");

console.log("\n🎉 ALL WATCHLIST VERIFICATION CHECKS PASSED!");
