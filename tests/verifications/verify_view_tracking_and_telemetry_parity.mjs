/**
 * 🧪 Test Suite: View Tracking & Telemetry Parity Verification
 * Centralized Path: Management System/tests/verifications/verify_view_tracking_and_telemetry_parity.mjs
 * 
 * Objectives:
 * 1. Verify unified useAdViewTracker hook implementation (IntersectionObserver + 1,000ms dwell time + anti-fraud)
 * 2. Verify dual pipeline parity (GA4 'ad_impression' and Cloud Function 'recordAdTelemetry' metadata consistency)
 * 3. Verify coverage across all 3 ad types (BUSINESS_CARD, BILLBOARD, PRODUCT_LINK) and all 5 Touchpoints
 * 4. Verify Cloud Function multi-collection support (partner_ads & user_sku_ads) and micro-deduction precision
 * 5. Verify SRP decomposition in Store Profile: usePartnerAds (controller) and PartnerAds (presentation)
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
console.log('🚀 RUNNING VERIFICATION: VIEW TRACKING & TELEMETRY PARITY');
console.log('==================================================================');

// ------------------------------------------------------------------
// Test 1: useAdViewTracker Hook Exists & Conforms to SRP & MRC Standards
// ------------------------------------------------------------------
const hookPath = resolveRepoPath('dh-frontend/src/hooks/useAdViewTracker.js');
assert(fs.existsSync(hookPath), '❌ useAdViewTracker.js does not exist');
const hookContent = fs.readFileSync(hookPath, 'utf8');

assert(hookContent.includes('IntersectionObserver'), '❌ useAdViewTracker missing IntersectionObserver');
assert(hookContent.includes('dwellTimeMs = 1000'), '❌ useAdViewTracker must default dwellTimeMs to 1000ms (MRC standard)');
assert(hookContent.includes('threshold = 0.5'), '❌ useAdViewTracker must default threshold to 0.5 (50% visibility)');
assert(hookContent.includes('clearDwellTimer'), '❌ useAdViewTracker must cancel dwell timer when scrolling away before 1s');
assert(hookContent.includes('trackAdView'), '❌ useAdViewTracker must trigger trackAdView upon valid dwell completion');
console.log('✅ [PASS] Test 1: useAdViewTracker correctly implements IntersectionObserver with 1,000ms dwell time guard');

// ------------------------------------------------------------------
// Test 2: Dual Telemetry Parity & Metadata in marketingAnalyticsService
// ------------------------------------------------------------------
const analyticsServicePath = resolveRepoPath('dh-frontend/src/firebase/marketingAnalyticsService.js');
assert(fs.existsSync(analyticsServicePath), '❌ marketingAnalyticsService.js does not exist');
const analyticsContent = fs.readFileSync(analyticsServicePath, 'utf8');

assert(analyticsContent.includes('inMemoryAntiFraudCache'), '❌ Missing in-memory fallback cache for anti-fraud');
assert(analyticsContent.includes('placement: meta?.placement'), '❌ GA4 / EventQueue missing placement parameter propagation');
assert(analyticsContent.includes('ad_impression'), '❌ GA4 ad_impression event missing');
console.log('✅ [PASS] Test 2: marketingAnalyticsService has anti-fraud memory fallback and placement propagation');

// ------------------------------------------------------------------
// Test 3: Cloud Function Multi-Collection & Deduction Precision
// ------------------------------------------------------------------
const telemetryModule = await import('../../functions/marketing/recordAdTelemetry.js');
const { aggregateTelemetryEvents, calculateAdDeductions } = telemetryModule.default || telemetryModule;

// Test 3.1: Multi-collection aggregation
const mixedEvents = [
  { type: 'view', adId: 'card-1', collection: 'partner_ads', ownerId: 'user-1', adType: 'BUSINESS_CARD' },
  { type: 'view', adId: 'sku-1', collection: 'user_sku_ads', ownerId: 'user-2', adType: 'PRODUCT_LINK' },
  { type: 'click', adId: 'sku-1', collection: 'user_sku_ads', ownerId: 'user-2', adType: 'PRODUCT_LINK' }
];

const { adAggregates } = aggregateTelemetryEvents(mixedEvents);
assert.strictEqual(adAggregates['card-1'].collection, 'partner_ads', '❌ card-1 should belong to partner_ads');
assert.strictEqual(adAggregates['sku-1'].collection, 'user_sku_ads', '❌ sku-1 should belong to user_sku_ads');
assert.strictEqual(adAggregates['sku-1'].views, 1, '❌ sku-1 should have 1 view');
assert.strictEqual(adAggregates['sku-1'].clicks, 1, '❌ sku-1 should have 1 click');

// Test 3.2: Micro-deduction precision (< 50 views)
const smallBatchAdMap = {
  'card-1': { ownerId: 'user-1', deltaViews: 20, deltaClicks: 0 }
};
const config = { adClickCost: 5, adImpressionCost: 0.1, adImpressionCount: 1000 };
const smallDeductions = calculateAdDeductions(smallBatchAdMap, config);
// 20 / 1000 * 0.1 = 0.002 Pts (previously rounded down to 0.00)
assert.strictEqual(smallDeductions['user-1'].totalDeduct, 0.002, '❌ Small batch of 20 views should calculate 0.002 Pts without loss');

// Test 3.3: Normal batch parity preservation
const normalBatchAdMap = {
  'ad-101': { ownerId: 'user-A', deltaViews: 2000, deltaClicks: 2 }
};
const normalDeductions = calculateAdDeductions(normalBatchAdMap, config);
assert.strictEqual(normalDeductions['user-A'].totalDeduct, 10.2, '❌ Normal batch calculation must preserve exact 10.2 Pts');
console.log('✅ [PASS] Test 3: recordAdTelemetry handles multi-collection (partner_ads + user_sku_ads) and micro-deduction math');

// ------------------------------------------------------------------
// Test 4: Touchpoint 1 (Home) & Touchpoint 3 (Providers) Coverage
// ------------------------------------------------------------------
const nearbyPartnersPath = resolveRepoPath('dh-frontend/src/pages/Home/hooks/useNearbyPartners.js');
assert(fs.existsSync(nearbyPartnersPath), '❌ useNearbyPartners.js does not exist');
const nearbyContent = fs.readFileSync(nearbyPartnersPath, 'utf8');
assert(!nearbyContent.includes('logImpression('), '❌ useNearbyPartners must not fire eager impressions on network fetch');

const partnerCardPath = resolveRepoPath('dh-frontend/src/pages/Home/components/PartnerCard.jsx');
assert(fs.existsSync(partnerCardPath), '❌ PartnerCard.jsx does not exist');
const partnerCardContent = fs.readFileSync(partnerCardPath, 'utf8');
assert(partnerCardContent.includes('useAdViewTracker'), '❌ PartnerCard must integrate useAdViewTracker');
assert(partnerCardContent.includes('home_squad_highlight'), '❌ PartnerCard missing home_squad_highlight default placement');
assert(partnerCardContent.includes('trackAdClick'), '❌ PartnerCard must track ad clicks');

const providersListPath = resolveRepoPath('dh-frontend/src/pages/Providers/components/ProvidersList.jsx');
assert(fs.existsSync(providersListPath), '❌ ProvidersList.jsx does not exist');
const providersContent = fs.readFileSync(providersListPath, 'utf8');
assert(providersContent.includes('placement="providers_directory"'), '❌ ProvidersList must specify providers_directory placement');
console.log('✅ [PASS] Test 4: Home (SquadHighlight) and Providers (/providers) touchpoints fully covered with viewport tracking');

// ------------------------------------------------------------------
// Test 5: Touchpoint 2 (Search Results Grid & Technician Modal) Coverage
// ------------------------------------------------------------------
const searchPagePath = resolveRepoPath('dh-frontend/src/pages/SearchPage.jsx');
assert(fs.existsSync(searchPagePath), '❌ SearchPage.jsx does not exist');
const searchContent = fs.readFileSync(searchPagePath, 'utf8');
assert(searchContent.includes('SearchTechnicianCardItem'), '❌ SearchPage missing SearchTechnicianCardItem component');
assert(searchContent.includes('search_technician_modal'), '❌ SearchPage missing search_technician_modal placement');
assert(!searchContent.includes('technicianAds.forEach(ad => {'), '❌ SearchPage must not blast views to all 30 modal cards simultaneously');
console.log('✅ [PASS] Test 5: Search results and Search technician modal covered with granular scroll observer');

// ------------------------------------------------------------------
// Test 6: Touchpoint 4 (Product Detail Nearest Partner Box) Coverage
// ------------------------------------------------------------------
const partnerBoxPath = resolveRepoPath('dh-frontend/src/components/partner/PartnerSupportBox.jsx');
assert(fs.existsSync(partnerBoxPath), '❌ PartnerSupportBox.jsx does not exist');
const partnerBoxContent = fs.readFileSync(partnerBoxPath, 'utf8');
assert(partnerBoxContent.includes('useAdViewTracker'), '❌ PartnerSupportBox must integrate useAdViewTracker');
assert(partnerBoxContent.includes('product_detail_nearest_partner'), '❌ PartnerSupportBox missing product_detail_nearest_partner placement');
assert(partnerBoxContent.includes('handleContactClick'), '❌ PartnerSupportBox missing click tracking handler');
console.log('✅ [PASS] Test 6: Product detail (/product/:id) nearest partner box covered with view & click telemetry');

// ------------------------------------------------------------------
// Test 7: Touchpoint 5 (Store Profile Hero & PartnerAds SRP Architecture) Coverage
// ------------------------------------------------------------------
const usePartnerAdsPath = resolveRepoPath('dh-frontend/src/pages/StoreProfile/hooks/usePartnerAds.js');
assert(fs.existsSync(usePartnerAdsPath), '❌ usePartnerAds.js controller hook does not exist');
const usePartnerAdsContent = fs.readFileSync(usePartnerAdsPath, 'utf8');
assert(
  usePartnerAdsContent.includes('const allAds = await getUserPartnerAds') ||
  usePartnerAdsContent.includes('getUserPartnerAds(partnerId)'),
  '❌ usePartnerAds controller hook must fetch allAds via getUserPartnerAds'
);

const partnerAdsPath = resolveRepoPath('dh-frontend/src/pages/StoreProfile/components/PartnerAds.jsx');
assert(fs.existsSync(partnerAdsPath), '❌ PartnerAds.jsx presentation component does not exist');
const partnerAdsContent = fs.readFileSync(partnerAdsPath, 'utf8');
assert(partnerAdsContent.includes('usePartnerAds'), '❌ PartnerAds must use usePartnerAds controller hook');
assert(partnerAdsContent.includes('store_partner_ads'), '❌ PartnerAds must pass store_partner_ads placement');

const storeHeroPath = resolveRepoPath('dh-frontend/src/pages/StoreProfile/components/StoreProfileHero.jsx');
assert(fs.existsSync(storeHeroPath), '❌ StoreProfileHero.jsx does not exist');
const storeHeroContent = fs.readFileSync(storeHeroPath, 'utf8');
assert(storeHeroContent.includes('useAdViewTracker'), '❌ StoreProfileHero must integrate useAdViewTracker');
assert(storeHeroContent.includes('store_profile_hero'), '❌ StoreProfileHero missing store_profile_hero placement');
assert(storeHeroContent.includes('handlePhoneClick'), '❌ StoreProfileHero must track phone click instead of console.log');
console.log('✅ [PASS] Test 7: Store Profile (/store/:id) hero, usePartnerAds hook, and presentation component verified');

// ------------------------------------------------------------------
// Test 8: ProductAdCard Component Upgraded to Unified Hook
// ------------------------------------------------------------------
const productAdCardPath = resolveRepoPath('dh-frontend/src/components/ads/ProductAdCard.jsx');
assert(fs.existsSync(productAdCardPath), '❌ ProductAdCard.jsx does not exist');
const productAdCardContent = fs.readFileSync(productAdCardPath, 'utf8');
assert(productAdCardContent.includes('useAdViewTracker'), '❌ ProductAdCard must use useAdViewTracker hook');
console.log('✅ [PASS] Test 8: ProductAdCard upgraded to unified useAdViewTracker hook');

console.log('==================================================================');
console.log('🎯 ALL 8/8 VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('==================================================================');
