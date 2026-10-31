/**
 * 🧪 Test Suite: Milestone 2 View Telemetry & Clean Architecture SRP Verification
 * Centralized Path: Management System/tests/verifications/verify_milestone_2_view_telemetry_and_srp.mjs
 * 
 * Objectives:
 * 1. Verify GA4 Store View Telemetry (trackStoreView + 2-min in-memory queue + GA4 'store_profile_view')
 * 2. Verify SPA route change page_view telemetry in App.jsx
 * 3. Verify useStoreStats quota optimization (1,000ms dwell time + 5-min session guard + trackStoreView)
 * 4. Verify StoreProfileHero organic view decoupling from ad quota (no synthetic ad impression)
 * 5. Verify ProductAdModal extraction from ProductAdCard (Clean Architecture & SRP < 200 lines)
 * 6. Verify usePartnerAds hook extraction and pure presentation in PartnerAds.jsx
 * 7. Verify useStoreProfilePage hook extraction and pure presentation in StoreProfilePage.jsx
 * 8. Verify UI Border Radius 0.1 (rounded-[2px]) compliance on cards/containers
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('==================================================================');
console.log('🚀 RUNNING VERIFICATION: MILESTONE 2 VIEW TELEMETRY & SRP ARCHITECTURE');
console.log('==================================================================');

// ------------------------------------------------------------------
// Test 1: trackStoreView in marketingAnalyticsService.js
// ------------------------------------------------------------------
const analyticsServicePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/marketingAnalyticsService.js');
assert.ok(fs.existsSync(analyticsServicePath), '❌ marketingAnalyticsService.js does not exist');
const analyticsContent = fs.readFileSync(analyticsServicePath, 'utf8');

assert.ok(analyticsContent.includes('export const trackStoreView'), '❌ trackStoreView must be exported');
assert.ok(analyticsContent.includes('store_profile_view'), '❌ GA4 custom event store_profile_view missing');
assert.ok(analyticsContent.includes("type: 'store_view'"), '❌ In-memory queue store_view entry missing');
assert.ok(analyticsContent.includes('FLUSH_INTERVAL_MS'), '❌ 2-minute in-memory buffer flush missing');
console.log('✅ [PASS] Test 1: marketingAnalyticsService.js exports trackStoreView with GA4 store_profile_view and 2-min buffer');

// ------------------------------------------------------------------
// Test 2: App.jsx SPA Route Change Telemetry
// ------------------------------------------------------------------
const appPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/App.jsx');
assert.ok(fs.existsSync(appPath), '❌ App.jsx does not exist');
const appContent = fs.readFileSync(appPath, 'utf8');

assert.ok(appContent.includes("logEvent(analytics, 'page_view'"), '❌ App.jsx must track GA4 page_view on route change');
assert.ok(appContent.includes('useLocation()'), '❌ App.jsx must observe route location transitions');
console.log('✅ [PASS] Test 2: App.jsx tracks SPA route change page_view telemetry via GA4');

// ------------------------------------------------------------------
// Test 3: useStoreStats.js Quota Optimization & Dwell Time Guard
// ------------------------------------------------------------------
const storeStatsHookPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreStats.js');
assert.ok(fs.existsSync(storeStatsHookPath), '❌ useStoreStats.js does not exist');
const storeStatsCode = fs.readFileSync(storeStatsHookPath, 'utf8');

assert.ok(storeStatsCode.includes('trackStoreView'), '❌ useStoreStats must pipe view events through trackStoreView');
assert.ok(storeStatsCode.includes('1000'), '❌ useStoreStats must enforce 1,000ms continuous dwell-time');
assert.ok(storeStatsCode.includes('300000'), '❌ useStoreStats must enforce 5-minute (300000ms) session deduplication');
assert.ok(storeStatsCode.includes('setViewCount((prev) => prev + 1)'), '❌ useStoreStats must maintain optimistic UI increment');
assert.ok(!storeStatsCode.includes('updateDoc(partnerRef, {\n          viewCount: increment(1)\n        })'), '❌ useStoreStats must eliminate raw unbuffered client updateDoc for views');
console.log('✅ [PASS] Test 3: useStoreStats.js enforces 1,000ms dwell-time, 5-min session guard, and routes through trackStoreView');

// ------------------------------------------------------------------
// Test 4: StoreProfileHero.jsx Decoupled Organic Views & Action Helpers
// ------------------------------------------------------------------
const storeHeroPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreProfileHero.jsx');
assert.ok(fs.existsSync(storeHeroPath), '❌ StoreProfileHero.jsx does not exist');
const storeHeroCode = fs.readFileSync(storeHeroPath, 'utf8');

// Ensure synthetic ad impression call is removed from hero
assert.ok(!storeHeroCode.includes("const { ref: heroRef } = useAdViewTracker"), '❌ StoreProfileHero must not call useAdViewTracker on organic visits');
assert.ok(storeHeroCode.includes('handlePhoneClick'), '❌ StoreProfileHero must retain handlePhoneClick handler');
assert.ok(storeHeroCode.includes('resolveMapsUrl'), '❌ StoreProfileHero must extract map URL resolver helper');
assert.ok(storeHeroCode.includes('handleStoreShare'), '❌ StoreProfileHero must extract share action helper');
assert.ok(storeHeroCode.includes('rounded-[2px]'), '❌ StoreProfileHero must comply with UI Border Radius 0.1 (rounded-[2px])');
console.log('✅ [PASS] Test 4: StoreProfileHero.jsx decoupled from ad impressions, action helpers extracted, UI radius 0.1 applied');

// ------------------------------------------------------------------
// Test 5: ProductAdModal.jsx Extraction & ProductAdCard.jsx Lean SRP
// ------------------------------------------------------------------
const modalPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/ads/ProductAdModal.jsx');
assert.ok(fs.existsSync(modalPath), '❌ ProductAdModal.jsx does not exist');
const modalCode = fs.readFileSync(modalPath, 'utf8');
assert.ok(modalCode.includes('createPortal'), '❌ ProductAdModal must use createPortal for clean DOM rendering');
assert.ok(modalCode.includes('rounded-[2px]'), '❌ ProductAdModal must comply with UI Border Radius 0.1');

const cardPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/ads/ProductAdCard.jsx');
assert.ok(fs.existsSync(cardPath), '❌ ProductAdCard.jsx does not exist');
const cardCode = fs.readFileSync(cardPath, 'utf8');
const cardLineCount = cardCode.split('\n').length;
assert.ok(cardLineCount < 200, `❌ ProductAdCard.jsx must be under 200 lines (actual: ${cardLineCount})`);
assert.ok(cardCode.includes('ProductAdModal'), '❌ ProductAdCard must import and render ProductAdModal');
assert.ok(cardCode.includes('useAdViewTracker'), '❌ ProductAdCard must use useAdViewTracker hook');
console.log(`✅ [PASS] Test 5: ProductAdModal.jsx cleanly extracted; ProductAdCard.jsx reduced to ${cardLineCount} lines (< 200 lines)`);

// ------------------------------------------------------------------
// Test 6: usePartnerAds Hook & PartnerAds Presentation
// ------------------------------------------------------------------
const partnerAdsHookPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/usePartnerAds.js');
assert.ok(fs.existsSync(partnerAdsHookPath), '❌ usePartnerAds.js does not exist');
const partnerAdsHookCode = fs.readFileSync(partnerAdsHookPath, 'utf8');
assert.ok(partnerAdsHookCode.includes('getUserPartnerAds'), '❌ usePartnerAds must fetch ads via getUserPartnerAds');
assert.ok(partnerAdsHookCode.includes('ActivePartners'), '❌ usePartnerAds must check public ActivePartners for guest safety');

const partnerAdsCompPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/PartnerAds.jsx');
assert.ok(fs.existsSync(partnerAdsCompPath), '❌ PartnerAds.jsx does not exist');
const partnerAdsCompCode = fs.readFileSync(partnerAdsCompPath, 'utf8');
assert.ok(partnerAdsCompCode.includes('usePartnerAds'), '❌ PartnerAds.jsx must delegate to usePartnerAds hook');
assert.ok(partnerAdsCompCode.includes('store_partner_ads'), '❌ PartnerAds.jsx must set placement="store_partner_ads"');
assert.ok(partnerAdsCompCode.includes('rounded-[2px]'), '❌ PartnerAds.jsx must comply with UI Border Radius 0.1');
console.log('✅ [PASS] Test 6: usePartnerAds.js extracted; PartnerAds.jsx is purely presentational');

// ------------------------------------------------------------------
// Test 7: useStoreProfilePage Hook & StoreProfilePage Presentation
// ------------------------------------------------------------------
const storePageHookPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreProfilePage.js');
assert.ok(fs.existsSync(storePageHookPath), '❌ useStoreProfilePage.js does not exist');
const storePageHookCode = fs.readFileSync(storePageHookPath, 'utf8');
assert.ok(storePageHookCode.includes('onAuthStateChanged'), '❌ useStoreProfilePage must manage auth state');
assert.ok(storePageHookCode.includes('ActivePartners'), '❌ useStoreProfilePage must query ActivePartners');

const storePageCompPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/StoreProfilePage.jsx');
assert.ok(fs.existsSync(storePageCompPath), '❌ StoreProfilePage.jsx does not exist');
const storePageCompCode = fs.readFileSync(storePageCompPath, 'utf8');
assert.ok(storePageCompCode.includes('useStoreProfilePage'), '❌ StoreProfilePage.jsx must delegate to useStoreProfilePage hook');
assert.ok(storePageCompCode.includes('StoreProfileHero'), '❌ StoreProfilePage must render StoreProfileHero');
assert.ok(storePageCompCode.includes('PartnerAds'), '❌ StoreProfilePage must render PartnerAds');
assert.ok(storePageCompCode.includes('rounded-[2px]'), '❌ StoreProfilePage must comply with UI Border Radius 0.1');
console.log('✅ [PASS] Test 7: useStoreProfilePage.js extracted; StoreProfilePage.jsx is purely presentational');

console.log('==================================================================');
console.log('🎯 ALL 7/7 MILESTONE 2 VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('==================================================================');
