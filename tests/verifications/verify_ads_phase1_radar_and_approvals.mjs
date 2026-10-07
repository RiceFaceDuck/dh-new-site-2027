import fs from 'fs';
import path from 'path';

console.log("🚀 Starting Phase 1 Verification: Radar, Approvals & Schema Parity...");

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

// 1. Check useManagerAds.js uses adManagementService
const useManagerAdsPath = path.resolve('dh-backoffice-react/src/pages/ads/hooks/useManagerAds.js');
const useManagerAdsContent = fs.readFileSync(useManagerAdsPath, 'utf8');

assert(
  useManagerAdsContent.includes("import { adManagementService } from '../../../firebase/adManagementService';"),
  "useManagerAds.js correctly imports adManagementService"
);
assert(
  useManagerAdsContent.includes("await adManagementService.approveAd(ad.id, taskId)"),
  "useManagerAds.js delegates approval to adManagementService.approveAd"
);
assert(
  useManagerAdsContent.includes("await adManagementService.rejectAd(ad.id, taskId"),
  "useManagerAds.js delegates rejection to adManagementService.rejectAd"
);

// 2. Check marketingService.js restores ActivePartners upon unpause
const marketingServicePath = path.resolve('dh-frontend/src/firebase/marketingService.js');
const marketingServiceContent = fs.readFileSync(marketingServicePath, 'utf8');

assert(
  marketingServiceContent.includes("setDoc(activePartnerRef"),
  "marketingService.js restores ActivePartners on unpause"
);
assert(
  marketingServiceContent.includes("active_partners_cache_v4_"),
  "marketingService.js clears active_partners_cache in localStorage upon toggle"
);

// 3. Check storeProfileSubmitService.js writes adPayload
const storeProfilePath = path.resolve('dh-frontend/src/firebase/storeProfileSubmitService.js');
const storeProfileContent = fs.readFileSync(storeProfilePath, 'utf8');

assert(
  storeProfileContent.includes("adPayload: adPayload"),
  "storeProfileSubmitService.js includes adPayload in todoPayload"
);

// 4. Check AdApprovalCard.jsx supports fallback
const adApprovalCardPath = path.resolve('dh-backoffice-react/src/components/todo/cards/AdApprovalCard.jsx');
const adApprovalCardContent = fs.readFileSync(adApprovalCardPath, 'utf8');

assert(
  adApprovalCardContent.includes("todo.adPayload || todo.adDetails || todo.skuDetails"),
  "AdApprovalCard.jsx supports fallback across adPayload, adDetails, and skuDetails"
);

console.log(`\n========================================`);
console.log(`Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
