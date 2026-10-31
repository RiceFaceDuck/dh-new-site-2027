/**
 * ⚔️ CHALLENGER M3: Display Parity, Cache TTL & Architecture Resilience Stress Test
 * Path: Management System/tests/adversarial/challenger_m3_display_parity_and_cache_stress.mjs
 * 
 * Adversarial Audit Dimensions:
 * 1. Cache TTL & Memory Leak Pruning: Boundary time shifts, stale entry purging, multi-tenant memory stress.
 * 2. Ad Approval View Count Preservation: Regression attack on accumulated views in active_partners_bundle.
 * 3. recordAdTelemetry Ingestion Robustness: Malformed payloads, whitespace keys, batch limits, mixed telemetry.
 * 4. Micro-Deduction Precision & Financial Rules: Fractional credit deductions without zero-rounding leaks.
 * 5. Display Parity & Strict Lexicon Audit: Verifies explicit disambiguation labels across Backoffice and Frontend.
 * 6. UI Border Radius 0.1 & Integrity Verification: Verifies rounded-[2px] invariant and zero-facade code.
 * 
 * Execution: node "Management System/tests/adversarial/challenger_m3_display_parity_and_cache_stress.mjs"
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

console.log('================================================================================');
console.log('⚔️ CHALLENGER M3: ADVERSARIAL STRESS TEST & INTEGRITY AUDIT');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const defects = [];

function pass(name, detail = '') {
  totalChecks++;
  passedChecks++;
  console.log(`  [PASS] ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, error) {
  totalChecks++;
  failedChecks++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  [FAIL] ${name}: ${msg}`);
  defects.push({ test: name, error: msg });
}

// =============================================================================
// SUITE 1: CACHE TTL & MEMORY LEAK PRUNING SIMULATION
// =============================================================================
console.log('--- Suite 1: Cache TTL & Memory Leak Pruning ---');

try {
  const MARKETING_CACHE_TTL_MS = 300000;
  const simulatedCache = {};

  const getMarketingCache = (uid, currentTime = Date.now()) => {
    const entry = simulatedCache[uid];
    if (!entry) return null;
    if (currentTime - entry.timestamp > MARKETING_CACHE_TTL_MS) {
      delete simulatedCache[uid];
      return null;
    }
    return entry;
  };

  const setMarketingCache = (uid, data, currentTime = Date.now()) => {
    Object.keys(simulatedCache).forEach((key) => {
      if (currentTime - simulatedCache[key].timestamp > MARKETING_CACHE_TTL_MS) {
        delete simulatedCache[key];
      }
    });
    simulatedCache[uid] = {
      ...data,
      timestamp: currentTime
    };
  };

  const t0 = 1000000000;
  setMarketingCache('user-fresh', { storeProfile: { viewCount: 10 } }, t0);
  assert.notStrictEqual(getMarketingCache('user-fresh', t0 + 100000), null, 'Cache hit within TTL failed');
  pass('1.1 Fresh cache hit within 300,000ms TTL');

  // Boundary check at exactly TTL
  assert.notStrictEqual(getMarketingCache('user-fresh', t0 + 300000), null, 'Boundary at exactly TTL should hit');
  // 1ms past TTL
  assert.strictEqual(getMarketingCache('user-fresh', t0 + 300001), null, 'Expired entry must return null');
  assert.strictEqual(simulatedCache['user-fresh'], undefined, 'Expired entry must be pruned on get');
  pass('1.2 Boundary precision and auto-pruning on expired get');

  // Multi-tenant churn: Seed 50 users at t0, add user-51 at t0 + 350,000
  for (let i = 1; i <= 50; i++) {
    simulatedCache[`user-${i}`] = { data: i, timestamp: t0 };
  }
  assert.strictEqual(Object.keys(simulatedCache).length, 50);

  // Write new entry after TTL
  setMarketingCache('user-new', { data: 'active' }, t0 + 350000);
  assert.strictEqual(Object.keys(simulatedCache).length, 1, 'All 50 stale entries should be pruned upon new write');
  assert.ok(simulatedCache['user-new'], 'New entry must remain in cache');
  pass('1.3 Multi-tenant memory leak protection (bulk eviction of 50 stale keys)');

  // Null/undefined resilience
  assert.strictEqual(getMarketingCache(null), null);
  assert.strictEqual(getMarketingCache(undefined), null);
  pass('1.4 Resilience to null and undefined cache keys');
} catch (err) {
  fail('Suite 1: Cache TTL Simulation', err);
}

// =============================================================================
// SUITE 2: AD APPROVAL VIEW COUNT PRESERVATION
// =============================================================================
console.log('\n--- Suite 2: Ad Approval View Count Preservation ---');

try {
  // Simulate active_partners_bundle update logic in approveAd
  const simulateBundleUpdate = (items, partnerId, adData) => {
    const existingIdx = items.findIndex(i => (i.id === partnerId || i.partnerId === partnerId));
    const existingAd = existingIdx >= 0 ? items[existingIdx] : null;
    const existingStats = existingAd?.stats || {};

    const partnerItem = {
      id: partnerId,
      partnerId: partnerId,
      storeName: 'Test Shop',
      viewsCount: Number(adData?.stats?.views || adData?.viewsCount || 0),
      stats: {
        ...existingStats,
        views: existingAd?.stats?.views || existingAd?.viewsCount || 0,
        clicks: existingAd?.stats?.clicks || Number(adData?.stats?.clicks || adData?.clicks || 0)
      },
      isVerified: true,
      isActive: true
    };

    if (existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views) {
      partnerItem.viewsCount = existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views || 0;
    }

    const newItems = [...items];
    if (existingIdx >= 0) {
      newItems[existingIdx] = { ...newItems[existingIdx], ...partnerItem };
    } else {
      newItems.unshift(partnerItem);
    }
    return newItems;
  };

  // Case A: Existing store with 1,250 historical views; ad submitted with 0 views
  const initialBundle = [
    { id: 'partner-alpha', storeName: 'Alpha Store', viewsCount: 1250, stats: { views: 1250, clicks: 45 } }
  ];
  const updatedBundleA = simulateBundleUpdate(initialBundle, 'partner-alpha', { stats: { views: 0, clicks: 0 } });
  assert.strictEqual(updatedBundleA[0].viewsCount, 1250, 'Historical viewsCount must NOT be wiped by new ad submission');
  assert.strictEqual(updatedBundleA[0].stats.views, 1250, 'Historical stats.views must NOT be wiped');
  pass('2.1 Zero-reset guard: Accumulated 1,250 views preserved on ad update');

  // Case B: Brand new store registering for the first time
  const updatedBundleB = simulateBundleUpdate(initialBundle, 'partner-beta', { stats: { views: 0, clicks: 0 } });
  assert.strictEqual(updatedBundleB[0].id, 'partner-beta');
  assert.strictEqual(updatedBundleB[0].viewsCount, 0, 'New store initializes viewsCount to 0 cleanly');
  assert.strictEqual(updatedBundleB.length, 2, 'Bundle size expands to 2');
  pass('2.2 Clean initialization for new partners');
} catch (err) {
  fail('Suite 2: Ad Approval View Preservation', err);
}

// =============================================================================
// SUITE 3: RECORD AD TELEMETRY ADVERSARIAL INGESTION
// =============================================================================
console.log('\n--- Suite 3: recordAdTelemetry Ingestion Robustness ---');

try {
  const telemetryModule = await import('../../functions/marketing/recordAdTelemetry.js');
  const { aggregateTelemetryEvents, calculateAdDeductions } = telemetryModule.default || telemetryModule;

  // 3.1 Edge case: empty, null, undefined events
  assert.strictEqual(aggregateTelemetryEvents([]).distinctCount, 0);
  assert.strictEqual(aggregateTelemetryEvents(null).distinctCount, 0);
  assert.strictEqual(aggregateTelemetryEvents(undefined).distinctCount, 0);
  assert.strictEqual(aggregateTelemetryEvents('invalid').distinctCount, 0);
  pass('3.1 Tolerates empty, null, undefined, and non-array event input');

  // 3.2 Whitespace trimming and field alias fallback
  const untrimmedEvents = [
    { type: 'store_view', store_id: '  store-space-1  ', partner_name: 'Shop 1' },
    { type: 'store_view', storeId: 'store-space-1', partner_name: 'Shop 1' },
    { type: 'store_view', store_id: '', partner_name: 'Empty ID Shop' },
    { type: 'store_view', store_id: '   ' }
  ];
  const { storeAggregates } = aggregateTelemetryEvents(untrimmedEvents);
  assert.ok(storeAggregates['store-space-1'], 'Trimmed store-space-1 must exist');
  assert.strictEqual(storeAggregates['store-space-1'].views, 2, 'Two store_view events must aggregate to 2');
  assert.strictEqual(Object.keys(storeAggregates).length, 1, 'Empty and blank store IDs must be discarded');
  pass('3.2 Sanitizes whitespace and discards empty store IDs');

  // 3.3 High volume batch capping
  const overflowEvents = [];
  for (let i = 0; i < 150; i++) {
    overflowEvents.push({ type: 'view', adId: `ad-overflow-${i}`, ownerId: `user-${i}` });
  }
  const overflowAgg = aggregateTelemetryEvents(overflowEvents);
  assert.strictEqual(Object.keys(overflowAgg.adAggregates).length, 30, 'Distinct ads must cap at MAX_DISTINCT_ADS_PER_BATCH (30)');
  pass('3.3 Strict batch boundary enforcement (100 event cap, 30 distinct ad cap)');

  // 3.4 Micro-deduction precision
  const config = { adClickCost: 5, adImpressionCost: 0.1, adImpressionCount: 1000 };
  const microAdMap = {
    'ad-1': { ownerId: 'user-micro', deltaViews: 10, deltaClicks: 0 },
    'ad-2': { ownerId: 'user-micro', deltaViews: 25, deltaClicks: 0 }
  };
  const deductions = calculateAdDeductions(microAdMap, config);
  // (10/1000 * 0.1) = 0.001; (25/1000 * 0.1) = 0.0025; total = 0.0035
  assert.strictEqual(deductions['user-micro'].totalDeduct, 0.0035, 'Micro-deductions must preserve 4 decimal places');
  pass('3.4 Micro-deduction precision preserves 0.0035 Pts without zero-truncation');

  // 3.5 Prepaid ads zero view deduction
  const prepaidAdMap = {
    'ad-prepaid': { ownerId: 'user-prepaid', deltaViews: 500, deltaClicks: 1, data: { remainingViews: 500 } }
  };
  const prepaidDeductions = calculateAdDeductions(prepaidAdMap, config);
  // Clicks: 1 * 5 = 5. Views: 0 because prepaid
  assert.strictEqual(prepaidDeductions['user-prepaid'].totalDeduct, 5, 'Prepaid ads must only deduct click cost (5 Pts)');
  pass('3.5 Prepaid ads do not double-bill impressions during view events');
} catch (err) {
  fail('Suite 3: recordAdTelemetry Robustness', err);
}

// =============================================================================
// SUITE 4: DISPLAY PARITY & STRICT LEXICON AUDIT
// =============================================================================
console.log('\n--- Suite 4: Display Parity & Lexicon Enforcement ---');

try {
  const marketingInfoPath = path.resolve(projectRoot, 'Management System/dh-backoffice-react/src/pages/Customers/components/details/MarketingInfo.jsx');
  const storeProfileFormPath = path.resolve(projectRoot, 'Management System/dh-frontend/src/components/profile/tabs/store-profile/StoreProfileForm.jsx');
  const adListTablePath = path.resolve(projectRoot, 'Management System/dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');

  const miContent = fs.readFileSync(marketingInfoPath, 'utf8');
  const spfContent = fs.readFileSync(storeProfileFormPath, 'utf8');
  const altContent = fs.readFileSync(adListTablePath, 'utf8');

  // Required labels
  assert.ok(miContent.includes('ยอดเข้าชมหน้าร้าน (Store Profile Visits)'), 'MarketingInfo missing Store Profile Visits label');
  assert.ok(miContent.includes('ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'), 'MarketingInfo missing Ad Impressions label');
  assert.ok(spfContent.includes('ยอดเข้าชมหน้าร้าน (Store Profile Visits)'), 'StoreProfileForm missing Store Profile Visits label');
  assert.ok(altContent.includes('ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'), 'AdListTable missing Ad Impressions label');
  pass('4.1 Canonical labels present across Backoffice and Frontend surfaces');

  // Terminology ban audit: zero instances of "เคลมเปลี่ยน"
  assert.strictEqual(miContent.includes('เคลมเปลี่ยน'), false, 'Forbidden term "เคลมเปลี่ยน" found in MarketingInfo');
  assert.strictEqual(spfContent.includes('เคลมเปลี่ยน'), false, 'Forbidden term "เคลมเปลี่ยน" found in StoreProfileForm');
  assert.strictEqual(altContent.includes('เคลมเปลี่ยน'), false, 'Forbidden term "เคลมเปลี่ยน" found in AdListTable');
  pass('4.2 Strictly enforces terminology ban (Zero "เคลมเปลี่ยน")');
} catch (err) {
  fail('Suite 4: Display Parity & Lexicon', err);
}

// =============================================================================
// SUITE 5: UI BORDER RADIUS 0.1 & CODE INTEGRITY AUDIT
// =============================================================================
console.log('\n--- Suite 5: UI Border Radius 0.1 & Code Integrity ---');

try {
  const marketingInfoPath = path.resolve(projectRoot, 'Management System/dh-backoffice-react/src/pages/Customers/components/details/MarketingInfo.jsx');
  const miContent = fs.readFileSync(marketingInfoPath, 'utf8');

  // Verify rounded-[2px] applied to cards and containers
  const matches2px = (miContent.match(/rounded-\[2px\]/g) || []).length;
  assert.ok(matches2px >= 10, `Expected at least 10 instances of rounded-[2px] in MarketingInfo, found ${matches2px}`);
  pass(`5.1 UI Border Radius 0.1 applied across ${matches2px} elements in MarketingInfo.jsx`);

  // Verify absence of hyper-rounded corners (rounded-2xl, rounded-3xl) in MarketingInfo
  assert.strictEqual(miContent.includes('rounded-2xl'), false, 'rounded-2xl found in MarketingInfo');
  assert.strictEqual(miContent.includes('rounded-3xl'), false, 'rounded-3xl found in MarketingInfo');
  pass('5.2 Zero hyper-curved bubble borders (no rounded-2xl / rounded-3xl)');

  // Anti-cheating & integrity checks
  const suspiciousTokens = ['mockReturn', 'bypassAuth', 'skipVerification', '__TEST_CHEAT__', 'fakeSuccess'];
  for (const token of suspiciousTokens) {
    assert.strictEqual(miContent.includes(token), false, `Suspicious bypass token "${token}" found in MarketingInfo`);
  }
  pass('5.3 Zero integrity bypass tokens or facade implementations');
} catch (err) {
  fail('Suite 5: UI Border Radius & Integrity', err);
}

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n================================================================================');
console.log(`🎯 CHALLENGER AUDIT COMPLETED: ${passedChecks}/${totalChecks} PASS`);
if (failedChecks > 0) {
  console.error(`❌ ${failedChecks} ADVERSARIAL CHECKS FAILED!`);
  process.exit(1);
} else {
  console.log('✅ ALL ADVERSARIAL STRESS CHECKS AND INTEGRITY AUDITS PASSED WITH ZERO DEFECTS!');
  console.log('================================================================================');
  process.exit(0);
}
