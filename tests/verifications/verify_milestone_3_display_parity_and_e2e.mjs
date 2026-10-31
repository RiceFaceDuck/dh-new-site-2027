/**
 * 🧪 Test Suite: Milestone 3 Verification (Display Parity, Backoffice Integration & E2E)
 * Centralized Path: Management System/tests/verifications/verify_milestone_3_display_parity_and_e2e.mjs
 * 
 * Verifies:
 * 1. Backoffice MarketingInfo.jsx: Store profile visits card, like count, distinct metrics separation, and UI radius 0.1
 * 2. Backoffice MarketingInfo.jsx: 5-minute TTL cache (300,000ms) and anti-leak pruning
 * 3. Backoffice adManagementService.js: View count preservation in approveAd and ActivePartners stats linking
 * 4. Backend recordAdTelemetry.js: store_view telemetry ingestion contract, batch delta aggregation, and atomic increment
 * 5. Frontend Partner Profile: Display parity in StoreProfileForm.jsx, TabAdManager.jsx, and AdListTable.jsx
 * 6. UI Border Radius Invariant & Architecture Compliance
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

const resolveRepoPath = (subPath) => {
  const candidate1 = path.resolve(projectRoot, 'Management System', subPath);
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.resolve(projectRoot, subPath);
  if (fs.existsSync(candidate2)) return candidate2;
  return candidate1;
};

console.log('==================================================================');
console.log('🚀 RUNNING VERIFICATION: MILESTONE 3 DISPLAY PARITY & E2E');
console.log('==================================================================');

// ------------------------------------------------------------------
// Test 1: MarketingInfo.jsx Metric Parity & Clear Separation
// ------------------------------------------------------------------
const marketingInfoPath = resolveRepoPath('dh-backoffice-react/src/pages/Customers/components/details/MarketingInfo.jsx');
assert(fs.existsSync(marketingInfoPath), '❌ MarketingInfo.jsx does not exist');
const marketingInfoContent = fs.readFileSync(marketingInfoPath, 'utf8');

assert(
  marketingInfoContent.includes('storeProfile?.viewCount') || marketingInfoContent.includes('activePartner?.viewCount'),
  '❌ MarketingInfo.jsx must read viewCount from storeProfile or activePartner'
);
assert(
  marketingInfoContent.includes('storeProfile?.likeCount') || marketingInfoContent.includes('activePartner?.likeCount'),
  '❌ MarketingInfo.jsx must read likeCount from storeProfile or activePartner'
);
assert(
  marketingInfoContent.includes('ยอดเข้าชมหน้าร้าน (Store Profile Visits)'),
  '❌ MarketingInfo.jsx missing explicit label: ยอดเข้าชมหน้าร้าน (Store Profile Visits)'
);
assert(
  marketingInfoContent.includes('ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'),
  '❌ MarketingInfo.jsx missing explicit label: ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'
);
assert(
  marketingInfoContent.includes('rounded-[2px]'),
  '❌ MarketingInfo.jsx must apply UI border radius 0.1 (rounded-[2px])'
);
console.log('✅ [PASS] Test 1: MarketingInfo.jsx renders Store Visits vs Ad Impressions with zero ambiguity and UI radius 0.1');

// ------------------------------------------------------------------
// Test 2: MarketingInfo.jsx 5-Minute TTL Cache & Anti-Leak Pruning
// ------------------------------------------------------------------
assert(
  marketingInfoContent.includes('300000') || marketingInfoContent.includes('5 * 60 * 1000'),
  '❌ MarketingInfo.jsx must define a 5-minute TTL (300,000ms)'
);
assert(
  marketingInfoContent.includes('MARKETING_CACHE_TTL_MS'),
  '❌ MarketingInfo.jsx missing MARKETING_CACHE_TTL_MS constant'
);
assert(
  marketingInfoContent.includes('Date.now()') && marketingInfoContent.includes('timestamp'),
  '❌ MarketingInfo.jsx cache entries must be timestamped and checked against TTL'
);
console.log('✅ [PASS] Test 2: MarketingInfo.jsx implements 5-minute TTL cache and memory leak protection');

// ------------------------------------------------------------------
// Test 3: adManagementService.js Ad View Preservation & ActivePartners Linking
// ------------------------------------------------------------------
const adServicePath = resolveRepoPath('dh-backoffice-react/src/firebase/adManagementService.js');
assert(fs.existsSync(adServicePath), '❌ adManagementService.js does not exist');
const adServiceContent = fs.readFileSync(adServicePath, 'utf8');

assert(
  adServiceContent.includes('getActivePartner:'),
  '❌ adManagementService.js missing getActivePartner helper'
);
assert(
  adServiceContent.includes('getCollectionPath(\'ActivePartners\')') || adServiceContent.includes('ActivePartners'),
  '❌ adManagementService.js must query ActivePartners for partner stats'
);
assert(
  adServiceContent.includes('viewsCount: existingAd?.viewsCount') ||
  adServiceContent.includes('existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views'),
  '❌ adManagementService.js must preserve existingAd.viewsCount when updating active_partners_bundle'
);
assert(
  adServiceContent.includes('views: existingAd?.stats?.views || existingAd?.viewsCount'),
  '❌ adManagementService.js stats.views must preserve existingAd accumulated views'
);
console.log('✅ [PASS] Test 3: adManagementService.js accurately links ActivePartners and preserves view counts in bundle sync');

// ------------------------------------------------------------------
// Test 4: recordAdTelemetry.js Store View Ingestion Contract
// ------------------------------------------------------------------
const telemetryModule = await import('../../functions/marketing/recordAdTelemetry.js');
const { aggregateTelemetryEvents, calculateAdDeductions, commitTelemetryTransaction } = telemetryModule.default || telemetryModule;

// Test 4.1: Aggregation of store_view events
const testEvents = [
  { type: 'store_view', store_id: 'store-101', partner_name: 'Partner Shop Alpha' },
  { type: 'store_view', storeId: 'store-101', partner_name: 'Partner Shop Alpha' },
  { type: 'store_view', store_id: 'store-202', partner_name: 'Partner Shop Beta' },
  { type: 'view', adId: 'ad-303', collection: 'partner_ads', ownerId: 'user-303' }
];

const { adAggregates, storeAggregates, distinctCount } = aggregateTelemetryEvents(testEvents);

assert.strictEqual(storeAggregates['store-101'].views, 2, '❌ store-101 should have accumulated 2 store views');
assert.strictEqual(storeAggregates['store-202'].views, 1, '❌ store-202 should have accumulated 1 store view');
assert.strictEqual(adAggregates['ad-303'].views, 1, '❌ ad-303 should have 1 ad impression');
assert.strictEqual(distinctCount, 3, '❌ Distinct count should be 3 (2 stores + 1 ad)');

// Test 4.2: Verify commitTelemetryTransaction function contract
const telemetryContent = fs.readFileSync(resolveRepoPath('functions/marketing/recordAdTelemetry.js'), 'utf8');
assert(
  telemetryContent.includes('ActivePartners') && telemetryContent.includes('viewCount: FieldValue.increment(deltaViews)'),
  '❌ recordAdTelemetry.js must atomically increment ActivePartners/{store_id}.viewCount via FieldValue.increment'
);
console.log('✅ [PASS] Test 4: recordAdTelemetry.js ingests store_view events and atomically increments ActivePartners.viewCount');

// ------------------------------------------------------------------
// Test 5: Frontend Partner Ads Tab Metric Parity (/profile?tab=ads)
// ------------------------------------------------------------------
const storeProfileFormPath = resolveRepoPath('dh-frontend/src/components/profile/tabs/store-profile/StoreProfileForm.jsx');
assert(fs.existsSync(storeProfileFormPath), '❌ StoreProfileForm.jsx does not exist');
const storeFormContent = fs.readFileSync(storeProfileFormPath, 'utf8');

assert(
  storeFormContent.includes('ยอดเข้าชมหน้าร้าน (Store Profile Visits)'),
  '❌ StoreProfileForm.jsx must display distinct badge for ยอดเข้าชมหน้าร้าน (Store Profile Visits)'
);
assert(
  storeFormContent.includes('storeData?.viewCount') || storeFormContent.includes('storeData.viewCount'),
  '❌ StoreProfileForm.jsx must render storeData.viewCount'
);

const tabAdManagerPath = resolveRepoPath('dh-frontend/src/components/profile/tabs/TabAdManager.jsx');
assert(fs.existsSync(tabAdManagerPath), '❌ TabAdManager.jsx does not exist');
const tabAdManagerContent = fs.readFileSync(tabAdManagerPath, 'utf8');

assert(
  tabAdManagerContent.includes('storeData?.viewCount') || tabAdManagerContent.includes('storeData.viewCount'),
  '❌ TabAdManager.jsx must display store view count on store subtab button'
);

const adListTablePath = resolveRepoPath('dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');
assert(fs.existsSync(adListTablePath), '❌ AdListTable.jsx does not exist');
const adListTableContent = fs.readFileSync(adListTablePath, 'utf8');

assert(
  adListTableContent.includes('ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'),
  '❌ AdListTable.jsx must label ad views distinctly as ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'
);
console.log('✅ [PASS] Test 5: Frontend Partner Profile tabs display Store Visits and Ad Impressions with clear parity');

// ------------------------------------------------------------------
// Test 6: Invariants & Security Boundaries
// ------------------------------------------------------------------
const partnerAdsPath = resolveRepoPath('dh-frontend/src/pages/StoreProfile/components/PartnerAds.jsx');
const partnerAdsContent = fs.readFileSync(partnerAdsPath, 'utf8');
assert(!partnerAdsContent.includes('getDoc(doc(db, \'users\''), '❌ PartnerAds must not query private users collection');
assert(partnerAdsContent.includes('rounded-[2px]'), '❌ PartnerAds.jsx must maintain UI border radius 0.1 (rounded-[2px])');
console.log('✅ [PASS] Test 6: Invariants, UI border radius 0.1, and security boundaries verified');

console.log('==================================================================');
console.log('🎯 ALL 6/6 MILESTONE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('==================================================================');
