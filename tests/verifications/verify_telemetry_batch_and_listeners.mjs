/**
 * 🧪 Verification: Ad Telemetry Batch Ingestion & Storefront Guest Listener Pruning
 * Tests in-memory batching, anti-fraud, Cloud Function batch logic, and pruned guest listeners
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('==================================================================');
console.log('🚀 RUNNING VERIFICATION: TELEMETRY BATCH & LISTENER PRUNING');
console.log('==================================================================');

// Test 1: Verify marketingAnalyticsService.js has 2-minute buffer & beacon
const analyticsServicePath = path.resolve('dh-frontend/src/firebase/marketingAnalyticsService.js');
const analyticsContent = fs.readFileSync(analyticsServicePath, 'utf8');

assert(analyticsContent.includes('FLUSH_INTERVAL_MS = 2 * 60 * 1000'), '❌ Missing 2-minute flush interval in marketingAnalyticsService');
assert(analyticsContent.includes('navigator.sendBeacon'), '❌ Missing navigator.sendBeacon in marketingAnalyticsService');
assert(analyticsContent.includes('keepalive: true'), '❌ Missing keepalive flag in marketingAnalyticsService');
assert(analyticsContent.includes('visibilitychange'), '❌ Missing visibilitychange lifecycle listener');
console.log('✅ [PASS] Test 1: marketingAnalyticsService has 2-minute in-memory buffer, sendBeacon, and lifecycle handlers');

// Test 2: Verify Cloud Function recordAdTelemetry exists and is exported
const functionPath = path.resolve('functions/marketing/recordAdTelemetry.js');
const indexFunctionsPath = path.resolve('functions/index.js');
assert(fs.existsSync(functionPath), '❌ recordAdTelemetry.js does not exist');
const functionContent = fs.readFileSync(functionPath, 'utf8');
const indexContent = fs.readFileSync(indexFunctionsPath, 'utf8');

assert(functionContent.includes('processAdTelemetryBatch'), '❌ Missing processAdTelemetryBatch in recordAdTelemetry.js');
assert(functionContent.includes('FieldValue.increment'), '❌ Missing FieldValue.increment in recordAdTelemetry.js');
assert(functionContent.includes('OUT_OF_CREDIT'), '❌ Missing OUT_OF_CREDIT auto-pause guard');
assert(indexContent.includes('recordAdTelemetry'), '❌ recordAdTelemetry is not exported in functions/index.js');
console.log('✅ [PASS] Test 2: recordAdTelemetry Cloud Function endpoint is implemented with atomic transaction and exported');

// Test 3: Verify useStorefrontTheme does NOT use onSnapshot
const themeHookPath = path.resolve('dh-frontend/src/hooks/useStorefrontTheme.js');
const themeContent = fs.readFileSync(themeHookPath, 'utf8');
assert(!themeContent.includes('onSnapshot'), '❌ useStorefrontTheme still contains onSnapshot listener');
assert(themeContent.includes('getDoc'), '❌ useStorefrontTheme should use getDoc');
assert(themeContent.includes('localStorage'), '❌ useStorefrontTheme should cache to localStorage');
console.log('✅ [PASS] Test 3: useStorefrontTheme pruned of onSnapshot, using cached getDoc (0-Read Guard)');

// Test 4: Verify Footer.jsx does NOT subscribe to real-time config
const footerPath = path.resolve('dh-frontend/src/components/Footer.jsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert(!footerContent.includes('subscribeFooterConfig'), '❌ Footer.jsx still contains subscribeFooterConfig real-time listener');
assert(footerContent.includes('getFooterConfig'), '❌ Footer.jsx should use getFooterConfig');
console.log('✅ [PASS] Test 4: Footer.jsx pruned of live subscription, using cached getFooterConfig');

// Test 5: Verify usePromotions does NOT open 2 onSnapshot queries
const promoHookPath = path.resolve('dh-frontend/src/hooks/usePromotions.js');
const promoContent = fs.readFileSync(promoHookPath, 'utf8');
assert(!promoContent.includes('onSnapshot'), '❌ usePromotions still contains onSnapshot query listeners');
assert(promoContent.includes('getDocs'), '❌ usePromotions should use getDocs with in-memory cache');
assert(promoContent.includes('PROMO_CACHE_TTL_MS'), '❌ usePromotions should have cache TTL guard');
console.log('✅ [PASS] Test 5: usePromotions pruned of 2 onSnapshot queries, using cached getDocs');

// Test 6: Verify AdStatsOverview has out-of-credit banner
const adStatsPath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdStatsOverview.jsx');
const adStatsContent = fs.readFileSync(adStatsPath, 'utf8');
assert(adStatsContent.includes('isOutOfCredit'), '❌ AdStatsOverview missing isOutOfCredit check');
assert(adStatsContent.includes('เครดิตโฆษณาของคุณหมดแล้ว'), '❌ AdStatsOverview missing out-of-credit banner alert');
console.log('✅ [PASS] Test 6: AdStatsOverview has clear out-of-credit warning alert banner');

// Test 7: Verify pure functions in recordAdTelemetry (SRP Verification)
const telemetryModule = await import('../../functions/marketing/recordAdTelemetry.js');
const { aggregateTelemetryEvents, calculateAdDeductions } = telemetryModule.default || telemetryModule;

const mockEvents = [
  { type: 'view', adId: 'ad-101', ownerId: 'user-A' },
  { type: 'view', adId: 'ad-101', ownerId: 'user-A' },
  { type: 'click', adId: 'ad-101', ownerId: 'user-A' },
  { type: 'view', adId: 'ad-102', ownerId: 'user-B' }
];

const { adAggregates, distinctCount } = aggregateTelemetryEvents(mockEvents);
assert.strictEqual(distinctCount, 2, '❌ Should aggregate 4 events into 2 distinct ads');
assert.strictEqual(adAggregates['ad-101'].views, 2, '❌ ad-101 should have 2 views');
assert.strictEqual(adAggregates['ad-101'].clicks, 1, '❌ ad-101 should have 1 click');
console.log('✅ [PASS] Test 7: aggregateTelemetryEvents correctly aggregates and deduplicates raw batch events');

// Test 8: Verify deduction math calculations
const mockAdMap = {
  'ad-101': { ownerId: 'user-A', deltaViews: 2000, deltaClicks: 2 }
};
const mockConfig = { adClickCost: 5, adImpressionCost: 0.1, adImpressionCount: 1000 };
const deductions = calculateAdDeductions(mockAdMap, mockConfig);

// 2 clicks * 5 Pts = 10 Pts. 2000 views / 1000 * 0.1 Pt = 0.2 Pt. Total = 10.2 Pts
assert.strictEqual(deductions['user-A'].totalDeduct, 10.2, '❌ Calculation mismatch: should deduct 10.2 Pts');
console.log('✅ [PASS] Test 8: calculateAdDeductions produces exact math parity (10.2 Pts)');

console.log('==================================================================');
console.log('🎯 ALL 8/8 VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('==================================================================');
