import fs from 'fs';
import path from 'path';

console.log("🚀 Starting Phase 4 Verification: Optimization & Watchlist Clearance...");

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Check marketingService.js getActiveAds query limit is 30
const marketingServicePath = path.resolve('dh-frontend/src/firebase/marketingService.js');
const marketingServiceContent = fs.readFileSync(marketingServicePath, 'utf8');

assert(
  marketingServiceContent.includes("where('type', '==', adType), limit(30))"),
  "marketingService.js getActiveAds queries with limit(30) saving 70% unnecessary document reads"
);
assert(
  !marketingServiceContent.includes("where('type', '==', adType), limit(100))"),
  "marketingService.js no longer over-fetches 100 documents for active ads"
);

// 2. Check useAdManager.js removed dead state adToDelete
const useAdManagerPath = path.resolve('dh-frontend/src/components/profile/tabs/hooks/useAdManager.js');
const useAdManagerContent = fs.readFileSync(useAdManagerPath, 'utf8');

assert(
  !useAdManagerContent.includes("adToDelete"),
  "useAdManager.js successfully purged dead adToDelete state"
);

console.log(`\n========================================`);
console.log(`Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
