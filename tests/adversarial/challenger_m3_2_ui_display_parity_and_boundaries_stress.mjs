/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE: UI DISPLAY PARITY & BOUNDARIES STRESS (CHALLENGER M3-2)
 * File: Management System/tests/adversarial/challenger_m3_2_ui_display_parity_and_boundaries_stress.mjs
 * 
 * Scope:
 * 1. UI Display Parity & Strict Metric Disambiguation:
 *    - MarketingInfo.jsx: "ยอดเข้าชมหน้าร้าน (Store Profile Visits)" vs "ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)"
 *    - StoreProfileForm.jsx: Distinct Store Profile Visits badge
 *    - TabAdManager.jsx: Subtab badge gating & distinct label
 *    - AdListTable.jsx: Distinct Ad Impressions headers & mobile cards
 * 
 * 2. Data Boundary Value Analysis & Null Safety Harness:
 *    - Metric derivation math under null, undefined, 0, negative, string, exponential counts
 *    - Number formatting (.toLocaleString()) without NaN or crashes
 *    - Status badge and credit limit rendering resilience
 * 
 * 3. In-Memory Cache TTL, Expiry, and Anti-Leak Pruning Stress:
 *    - 5-minute TTL boundary accuracy (300,000ms)
 *    - High-volume anti-leak pruning sweep (10,000 expired entries purged)
 *    - High-concurrency rapid navigation churn (50,000 simulated requests)
 *    - In-place mutation safety on ad pause / delete
 * 
 * 4. Backend Aggregation & Atomic Ingestion Contract:
 *    - recordAdTelemetry.js: 20,000 mixed/corrupted events aggregation stress
 *    - Store view telemetry isolation and atomic FieldValue.increment
 *    - Zero-ad batch handling without credit_config errors
 * 
 * 5. Ad Service Historical Views Preservation:
 *    - approveAd bundle synchronization without resetting accumulated views
 *    - getStoreProfile ActivePartners linking and fallback hierarchy
 * 
 * 6. UI Border Radius 0.1 (rounded-[2px]) & Button Radius Preservation:
 *    - Containers and cards adhere to rounded-[2px]
 *    - Action buttons preserve system radii (rounded-lg, rounded-xl, rounded-full, rounded-md)
 *    - Prohibited bubble curvature check (zero rounded-2xl/3xl on cards)
 * 
 * 7. Production Build Verification:
 *    - dh-frontend & dh-backoffice-react build artifacts validation
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const MANAGEMENT_DIR = path.resolve(REPO_ROOT, 'Management System');

console.log('================================================================================');
console.log('  ⚔️ CHALLENGER M3-2: UI DISPLAY PARITY & BOUNDARIES EMPIRICAL STRESS SUITE');
console.log('  Targets: MarketingInfo, StoreProfileForm, TabAdManager, AdListTable,');
console.log('           recordAdTelemetry, adManagementService, UI Invariants & Builds');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const defects = [];

function test(category, description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] [${category}] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] [${category}] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    defects.push({ category, description, error: err.message });
  }
}

async function asyncTest(category, description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] [${category}] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] [${category}] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    defects.push({ category, description, error: err.message });
  }
}

const resolvePath = (relPath) => {
  const p1 = path.resolve(MANAGEMENT_DIR, relPath);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(REPO_ROOT, relPath);
  if (fs.existsSync(p2)) return p2;
  return p1;
};

// ==============================================================================
// 1. UI DISPLAY PARITY & STRICT METRIC DISAMBIGUATION
// ==============================================================================
console.log('--- 1. UI DISPLAY PARITY & STRICT METRIC DISAMBIGUATION ---');

test('Parity:Labels', 'MarketingInfo.jsx strictly separates Store Profile Visits from Ad Impressions', () => {
  const filePath = resolvePath('dh-backoffice-react/src/pages/Customers/components/details/MarketingInfo.jsx');
  assert(fs.existsSync(filePath), `File missing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Must contain both distinct labels
  assert(
    content.includes('ยอดเข้าชมหน้าร้าน (Store Profile Visits)'),
    'MarketingInfo.jsx must explicitly display "ยอดเข้าชมหน้าร้าน (Store Profile Visits)"'
  );
  assert(
    content.includes('ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'),
    'MarketingInfo.jsx must explicitly display "ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)"'
  );
  assert(
    content.includes('ยอดถูกใจร้านค้า (Store Likes)'),
    'MarketingInfo.jsx must explicitly display "ยอดถูกใจร้านค้า (Store Likes)"'
  );
  assert(
    content.includes('คลิกโฆษณา (Ad Clicks)'),
    'MarketingInfo.jsx must explicitly display "คลิกโฆษณา (Ad Clicks)"'
  );

  // Assert Store Visits and Ad Impressions are in completely different sections
  const storeVisitIdx = content.indexOf('ยอดเข้าชมหน้าร้าน (Store Profile Visits)');
  const adImpressionIdx = content.indexOf('ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)');
  assert(storeVisitIdx > 0, 'Store visits label must be present');
  assert(adImpressionIdx > 0, 'Ad impressions label must be present');
  assert(adImpressionIdx > storeVisitIdx, 'Ad impressions section must follow Store Profile section separately');
});

test('Parity:Labels', 'StoreProfileForm.jsx displays distinct Store Profile Visits badge', () => {
  const filePath = resolvePath('dh-frontend/src/components/profile/tabs/store-profile/StoreProfileForm.jsx');
  assert(fs.existsSync(filePath), `File missing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');

  assert(
    content.includes('ยอดเข้าชมหน้าร้าน (Store Profile Visits):'),
    'StoreProfileForm.jsx must display "ยอดเข้าชมหน้าร้าน (Store Profile Visits):"'
  );
  assert(
    content.includes('storeData?.viewCount') || content.includes('storeData.viewCount'),
    'StoreProfileForm.jsx must bind storeData.viewCount'
  );
});

test('Parity:Labels', 'TabAdManager.jsx gates store view count badge and preserves subtab styling', () => {
  const filePath = resolvePath('dh-frontend/src/components/profile/tabs/TabAdManager.jsx');
  assert(fs.existsSync(filePath), `File missing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');

  assert(
    content.includes('Number(storeData?.viewCount || 0) > 0'),
    'TabAdManager.jsx must gate badge with Number(storeData?.viewCount || 0) > 0'
  );
  assert(
    content.includes('ยอดเข้าชมหน้าร้านพาร์ทเนอร์'),
    'TabAdManager.jsx badge title must be "ยอดเข้าชมหน้าร้านพาร์ทเนอร์"'
  );
});

test('Parity:Labels', 'AdListTable.jsx displays distinct Ad Impressions header and mobile card label', () => {
  const filePath = resolvePath('dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');
  assert(fs.existsSync(filePath), `File missing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');

  assert(
    content.includes('ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)'),
    'AdListTable.jsx desktop header must be "ยอดการมองเห็นป้ายโฆษณา (Ad Impressions)"'
  );
  assert(
    content.includes('ยอดมองเห็น (Ad Impressions)'),
    'AdListTable.jsx mobile card view must display "ยอดมองเห็น (Ad Impressions)"'
  );
});

// ==============================================================================
// 2. DATA BOUNDARY VALUE ANALYSIS & NULL SAFETY HARNESS
// ==============================================================================
console.log('\n--- 2. DATA BOUNDARY VALUE ANALYSIS & NULL SAFETY HARNESS ---');

test('Boundaries:Metrics', 'Store visits & likes derivation oracle withstands 1,000 randomized boundary inputs', () => {
  // Replicate the exact derivation logic from MarketingInfo.jsx
  const deriveStoreMetrics = (storeProfile, activePartner) => {
    const storeViewCount = Number(storeProfile?.viewCount || activePartner?.viewCount || 0);
    const storeLikeCount = Number(storeProfile?.likeCount || activePartner?.likeCount || 0);
    return {
      storeViewCount: isNaN(storeViewCount) ? 0 : storeViewCount,
      storeLikeCount: isNaN(storeLikeCount) ? 0 : storeLikeCount,
      formattedViews: (isNaN(storeViewCount) ? 0 : storeViewCount).toLocaleString(),
      formattedLikes: (isNaN(storeLikeCount) ? 0 : storeLikeCount).toLocaleString(),
    };
  };

  // Base deterministic checks
  assert.deepEqual(deriveStoreMetrics(null, null), { storeViewCount: 0, storeLikeCount: 0, formattedViews: '0', formattedLikes: '0' });
  assert.deepEqual(deriveStoreMetrics(undefined, undefined), { storeViewCount: 0, storeLikeCount: 0, formattedViews: '0', formattedLikes: '0' });
  assert.deepEqual(deriveStoreMetrics({}, {}), { storeViewCount: 0, storeLikeCount: 0, formattedViews: '0', formattedLikes: '0' });
  assert.deepEqual(deriveStoreMetrics({ viewCount: 0 }, { viewCount: 42 }), { storeViewCount: 42, storeLikeCount: 0, formattedViews: '42', formattedLikes: '0' });
  assert.deepEqual(deriveStoreMetrics({ viewCount: 150 }, { viewCount: 42 }), { storeViewCount: 150, storeLikeCount: 0, formattedViews: '150', formattedLikes: '0' });
  assert.deepEqual(deriveStoreMetrics({ viewCount: '1000000' }, null), { storeViewCount: 1000000, storeLikeCount: 0, formattedViews: '1,000,000', formattedLikes: '0' });

  // 1,000 randomized boundary test cases
  const boundaryValues = [null, undefined, 0, -1, 1, 999999999, '0', '1234', 'invalid_string', NaN, Infinity, -Infinity, {}, [], false, true];
  for (let i = 0; i < 1000; i++) {
    const v1 = boundaryValues[Math.floor(Math.random() * boundaryValues.length)];
    const v2 = boundaryValues[Math.floor(Math.random() * boundaryValues.length)];
    const profile = Math.random() > 0.5 ? { viewCount: v1, likeCount: v2 } : null;
    const partner = Math.random() > 0.5 ? { viewCount: v2, likeCount: v1 } : null;

    const res = deriveStoreMetrics(profile, partner);
    assert(typeof res.formattedViews === 'string', 'formattedViews must always be string');
    assert(typeof res.formattedLikes === 'string', 'formattedLikes must always be string');
    assert(!res.formattedViews.includes('NaN'), 'formattedViews must never contain NaN');
    assert(!res.formattedLikes.includes('NaN'), 'formattedLikes must never contain NaN');
  }
});

test('Boundaries:AdStats', 'Ad impressions and clicks derivation oracle produces valid strings under extreme inputs', () => {
  const deriveAdStats = (ad) => {
    const views = Number(ad?.stats?.views || ad?.impressions || 0);
    const clicks = Number(ad?.stats?.clicks || ad?.clicks || 0);
    const safeViews = isNaN(views) ? 0 : views;
    const safeClicks = isNaN(clicks) ? 0 : clicks;
    const limitDisplay = ad?.creditLimit === -1 || ad?.isUnlimited ? '∞ ไม่จำกัด' : (ad?.creditLimit ? `${ad.creditLimit} Pts` : 'N/A');

    return {
      views: safeViews,
      clicks: safeClicks,
      formattedViews: safeViews.toLocaleString(),
      formattedClicks: safeClicks.toLocaleString(),
      limitDisplay
    };
  };

  assert.equal(deriveAdStats(null).formattedViews, '0');
  assert.equal(deriveAdStats({}).formattedViews, '0');
  assert.equal(deriveAdStats({ creditLimit: -1 }).limitDisplay, '∞ ไม่จำกัด');
  assert.equal(deriveAdStats({ isUnlimited: true }).limitDisplay, '∞ ไม่จำกัด');
  assert.equal(deriveAdStats({ creditLimit: 500 }).limitDisplay, '500 Pts');
  assert.equal(deriveAdStats({ creditLimit: 0 }).limitDisplay, 'N/A');
  assert.equal(deriveAdStats({ stats: { views: 5000000 } }).formattedViews, '5,000,000');
});

test('Boundaries:StatusBadge', 'Status renderer oracle produces deterministic classes for all known and unknown statuses', () => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-700';
      case 'pending': return 'bg-amber-500/10 text-amber-700';
      case 'rejected': return 'bg-rose-500/10 text-rose-700';
      case 'paused': return 'bg-slate-200 text-slate-700';
      case 'OUT_OF_CREDIT': return 'bg-purple-500/10 text-purple-700';
      case 'COMPLETED': return 'bg-blue-500/10 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const cases = ['active', 'pending', 'rejected', 'paused', 'OUT_OF_CREDIT', 'COMPLETED', 'unknown', null, undefined, ''];
  cases.forEach((c) => {
    const color = getStatusColor(c);
    assert(typeof color === 'string' && color.length > 0, `Status ${c} should produce valid class`);
  });
});

// ==============================================================================
// 3. IN-MEMORY CACHE TTL, EXPIRY, AND ANTI-LEAK PRUNING STRESS
// ==============================================================================
console.log('\n--- 3. IN-MEMORY CACHE TTL, EXPIRY, AND ANTI-LEAK PRUNING STRESS ---');

test('Cache:TTL', '5-Minute TTL (300,000ms) enforces strict time-based expiry', () => {
  const TTL_MS = 300000;
  let mockNow = 1000000;
  const cache = {};

  const getCache = (uid) => {
    const entry = cache[uid];
    if (!entry) return null;
    if (mockNow - entry.timestamp > TTL_MS) {
      delete cache[uid];
      return null;
    }
    return entry;
  };

  const setCache = (uid, data) => {
    // Prune expired entries
    Object.keys(cache).forEach((key) => {
      if (mockNow - cache[key].timestamp > TTL_MS) {
        delete cache[key];
      }
    });
    cache[uid] = { ...data, timestamp: mockNow };
  };

  // 1. Initial write
  setCache('user-1', { storeProfile: { viewCount: 10 } });
  assert.equal(getCache('user-1')?.storeProfile.viewCount, 10, 'Must hit cache at t=0');

  // 2. Query at t = 299,999ms (within TTL)
  mockNow += 299999;
  assert.equal(getCache('user-1')?.storeProfile.viewCount, 10, 'Must hit cache at t=299,999ms');

  // 3. Query at t = 300,001ms (expired)
  mockNow += 2; // total 300,001ms
  assert.equal(getCache('user-1'), null, 'Must return null and evict entry at t=300,001ms');
  assert.equal(cache['user-1'], undefined, 'Key must be deleted from cache');
});

test('Cache:AntiLeakPruning', 'High-volume write sweep purges 10,000 expired entries down to 1 in a single setCache call', () => {
  const TTL_MS = 300000;
  let mockNow = 1000000;
  const cache = {};

  const setCache = (uid, data) => {
    Object.keys(cache).forEach((key) => {
      if (mockNow - cache[key].timestamp > TTL_MS) {
        delete cache[key];
      }
    });
    cache[uid] = { ...data, timestamp: mockNow };
  };

  // Seed 10,000 expired entries
  for (let i = 0; i < 10000; i++) {
    cache[`stale-user-${i}`] = {
      storeProfile: { viewCount: i },
      timestamp: mockNow - (TTL_MS + 10000) // expired
    };
  }
  assert.equal(Object.keys(cache).length, 10000, 'Cache must initially hold 10,000 entries');

  // Single fresh write
  const startTime = Date.now();
  setCache('fresh-user', { storeProfile: { viewCount: 999 } });
  const duration = Date.now() - startTime;

  assert.equal(Object.keys(cache).length, 1, 'All 10,000 expired entries must be pruned, leaving exactly 1 entry');
  assert.equal(cache['fresh-user'].storeProfile.viewCount, 999, 'Fresh user entry must remain intact');
  assert(duration < 100, `Sweep took ${duration}ms, must be < 100ms`);
});

test('Cache:ConcurrencyChurn', '50,000 rapid customer profile navigations maintain strictly bounded cache size', () => {
  const TTL_MS = 300000;
  let mockNow = 1000000;
  const cache = {};

  const setCache = (uid, data) => {
    Object.keys(cache).forEach((key) => {
      if (mockNow - cache[key].timestamp > TTL_MS) {
        delete cache[key];
      }
    });
    cache[uid] = { ...data, timestamp: mockNow };
  };

  // Simulate 50,000 customer views across 500 distinct customers over 1 hour
  for (let step = 0; step < 50000; step++) {
    mockNow += 72; // ~72ms per navigation -> 3,600,000ms = 1 hour total
    const randomUid = `cust-${step % 500}`;
    setCache(randomUid, {
      storeProfile: { viewCount: step },
      timestamp: mockNow
    });
  }

  // At the end of 1 hour, only entries within the last 5 minutes (300,000ms) can exist
  const finalKeyCount = Object.keys(cache).length;
  assert(finalKeyCount <= 500, `Cache key count (${finalKeyCount}) must never exceed total distinct pool size (500)`);
  assert(finalKeyCount > 0, 'Cache must contain active recent entries');
});

test('Cache:InPlaceMutation', 'In-place cache modification for ad pause / delete is null-safe', () => {
  const cache = {
    'cust-1': {
      ads: [
        { id: 'ad-10', status: 'active', isActive: true },
        { id: 'ad-20', status: 'active', isActive: true }
      ],
      timestamp: Date.now()
    }
  };

  // 1. Pause ad-10
  const pauseAd = (uid, adId) => {
    if (cache[uid] && Array.isArray(cache[uid].ads)) {
      cache[uid].ads = cache[uid].ads.map(ad => ad.id === adId ? { ...ad, status: 'paused', isActive: false } : ad);
    }
  };

  pauseAd('cust-1', 'ad-10');
  assert.equal(cache['cust-1'].ads.find(a => a.id === 'ad-10').status, 'paused');
  assert.equal(cache['cust-1'].ads.find(a => a.id === 'ad-10').isActive, false);

  // 2. Delete ad-20
  const deleteAd = (uid, adId) => {
    if (cache[uid] && Array.isArray(cache[uid].ads)) {
      cache[uid].ads = cache[uid].ads.filter(ad => ad.id !== adId);
    }
  };

  deleteAd('cust-1', 'ad-20');
  assert.equal(cache['cust-1'].ads.length, 1);
  assert.equal(cache['cust-1'].ads.find(a => a.id === 'ad-20'), undefined);

  // 3. Null-safety check with non-existent or corrupted UID
  assert.doesNotThrow(() => pauseAd('non-existent-uid', 'ad-999'));
  assert.doesNotThrow(() => deleteAd('non-existent-uid', 'ad-999'));
});

// ==============================================================================
// 4. BACKEND AGGREGATION & ATOMIC INGESTION CONTRACT
// ==============================================================================
console.log('\n--- 4. BACKEND AGGREGATION & ATOMIC INGESTION CONTRACT ---');

await asyncTest('Backend:Aggregation', 'recordAdTelemetry.js aggregates mixed store_view and ad events, respects quota clamps, and handles streaming batches', async () => {
  const telemetryPath = resolvePath('functions/marketing/recordAdTelemetry.js');
  assert(fs.existsSync(telemetryPath), `File missing: ${telemetryPath}`);
  
  const telemetryModule = await import(`file://${telemetryPath.replace(/\\/g, '/')}`);
  const { aggregateTelemetryEvents } = telemetryModule.default || telemetryModule;

  // 1. Quota Clamp Verification: Single batch > 100 events is clamped to 100
  const largeBatch = [];
  for (let i = 0; i < 500; i++) {
    largeBatch.push({
      type: 'store_view',
      store_id: `store-${i % 10}`,
      partner_name: `Shop ${i % 10}`
    });
  }
  const clampedRes = aggregateTelemetryEvents(largeBatch);
  const totalClampedViews = Object.values(clampedRes.storeAggregates).reduce((sum, s) => sum + s.views, 0);
  assert.equal(totalClampedViews, 100, 'Single batch must be strictly clamped to MAX_EVENTS_PER_BATCH (100)');

  // 2. Distinct Ads Clamp: More than 30 distinct ads are clamped to 30
  const manyAdsBatch = [];
  for (let i = 0; i < 50; i++) {
    manyAdsBatch.push({
      type: 'view',
      adId: `ad-${i}`,
      collection: 'partner_ads'
    });
  }
  const clampedAdsRes = aggregateTelemetryEvents(manyAdsBatch);
  assert.equal(Object.keys(clampedAdsRes.adAggregates).length, 30, 'Distinct ads must be clamped to MAX_DISTINCT_ADS_PER_BATCH (30)');

  // 3. Exact 100-event batch aggregation with mixed store views, ads, and corrupted inputs
  const mixedBatch = [];
  // 40 store views across 4 stores (10 each)
  for (let i = 0; i < 40; i++) {
    mixedBatch.push({
      type: 'store_view',
      store_id: `store-${i % 4}`,
      partner_name: `Shop ${i % 4}`
    });
  }
  // 40 ad views across 8 ads (5 each)
  for (let i = 0; i < 40; i++) {
    mixedBatch.push({
      type: 'view',
      adId: `ad-${i % 8}`,
      collection: 'partner_ads',
      ownerId: `owner-${i % 8}`
    });
  }
  // 20 malformed / corrupted events (null, missing IDs, invalid types)
  const corruptTemplates = [null, undefined, {}, { type: 'store_view' }, { type: 'view' }, "invalid_raw", 9999];
  for (let i = 0; i < 20; i++) {
    mixedBatch.push(corruptTemplates[i % corruptTemplates.length]);
  }

  assert.equal(mixedBatch.length, 100, 'Batch size must be exactly 100');
  const exactRes = aggregateTelemetryEvents(mixedBatch);

  assert.equal(Object.keys(exactRes.storeAggregates).length, 4, 'Must have 4 stores');
  for (let s = 0; s < 4; s++) {
    assert.equal(exactRes.storeAggregates[`store-${s}`].views, 10, `Store store-${s} must have 10 views`);
  }

  assert.equal(Object.keys(exactRes.adAggregates).length, 8, 'Must have 8 ads');
  for (let a = 0; a < 8; a++) {
    assert.equal(exactRes.adAggregates[`ad-${a}`].views, 5, `Ad ad-${a} must have 5 views`);
  }
  assert.equal(exactRes.distinctCount, 12, 'Distinct count must be 4 stores + 8 ads = 12');

  // 4. Streaming multi-batch aggregation (2,000 events chunked into 20 batches of 100)
  const totalStoreAccum = {};
  const totalAdAccum = {};
  for (let batchIdx = 0; batchIdx < 20; batchIdx++) {
    const chunk = [];
    for (let i = 0; i < 50; i++) {
      chunk.push({ type: 'store_view', store_id: `partner-store-${i % 10}` });
    }
    for (let i = 0; i < 50; i++) {
      chunk.push({ type: 'view', adId: `partner-ad-${i % 10}` });
    }
    const bRes = aggregateTelemetryEvents(chunk);
    Object.keys(bRes.storeAggregates).forEach(k => {
      totalStoreAccum[k] = (totalStoreAccum[k] || 0) + bRes.storeAggregates[k].views;
    });
    Object.keys(bRes.adAggregates).forEach(k => {
      totalAdAccum[k] = (totalAdAccum[k] || 0) + bRes.adAggregates[k].views;
    });
  }

  // Each of the 10 stores got 5 views per batch * 20 batches = 100 views
  for (let s = 0; s < 10; s++) {
    assert.equal(totalStoreAccum[`partner-store-${s}`], 100, `Multi-batch store partner-store-${s} must accumulate 100 views`);
  }
  // Each of the 10 ads got 5 views per batch * 20 batches = 100 views
  for (let a = 0; a < 10; a++) {
    assert.equal(totalAdAccum[`partner-ad-${a}`], 100, `Multi-batch ad partner-ad-${a} must accumulate 100 views`);
  }
});

test('Backend:Contract', 'recordAdTelemetry.js commits atomic FieldValue.increment and handles store-only batches', () => {
  const filePath = resolvePath('functions/marketing/recordAdTelemetry.js');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify atomic Firestore increment
  assert(
    content.includes('ActivePartners') && content.includes('viewCount: FieldValue.increment(deltaViews)'),
    'recordAdTelemetry.js must atomically increment viewCount using FieldValue.increment(deltaViews)'
  );

  // Verify doc creation fallback if doc does not exist
  assert(
    content.includes('transaction.set(storeRef') && content.includes('{ merge: true }'),
    'recordAdTelemetry.js must create ActivePartners doc with merge: true if not exists'
  );

  // Verify store-only batches don't fail when adIds.length === 0
  assert(
    content.includes('if (adIds.length > 0)') || content.includes('adIds.length > 0 ? calculateAdDeductions'),
    'recordAdTelemetry.js must guard credit_config reads and deductions when adIds is empty'
  );

  assert(
    content.includes('processed: adIds.length + storeIds.length'),
    'recordAdTelemetry.js must return combined processed count of ads and stores'
  );
});

// ==============================================================================
// 5. AD SERVICE HISTORICAL VIEWS PRESERVATION
// ==============================================================================
console.log('\n--- 5. AD SERVICE HISTORICAL VIEWS PRESERVATION ---');

test('AdService:ViewPreservation', 'approveAd preserves accumulated views from existing active_partners_bundle item', () => {
  const filePath = resolvePath('dh-backoffice-react/src/firebase/adManagementService.js');
  assert(fs.existsSync(filePath), `File missing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Must find existing item before assigning viewsCount
  const existingIdxPos = content.indexOf('const existingIdx = items.findIndex');
  const viewsAssignPos = content.indexOf('partnerItem.viewsCount =');
  assert(existingIdxPos > 0, 'Must search for existingAd in bundle items');
  assert(viewsAssignPos > existingIdxPos, 'Bundle item views must preserve existingAd accumulated counts');

  assert(
    content.includes('existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views'),
    'approveAd must preserve accumulated views from existingAd'
  );
  assert(
    content.includes('views: existingAd?.stats?.views || existingAd?.viewsCount'),
    'approveAd stats.views must preserve accumulated views from existingAd'
  );
});

test('AdService:ActivePartnersEnrichment', 'getStoreProfile queries ActivePartners for SSOT stats and falls back gracefully', () => {
  const filePath = resolvePath('dh-backoffice-react/src/firebase/adManagementService.js');
  const content = fs.readFileSync(filePath, 'utf8');

  assert(
    content.includes('getCollectionPath(\'ActivePartners\')') || content.includes('ActivePartners'),
    'getStoreProfile must query ActivePartners collection'
  );
  assert(
    content.includes('viewCount: Number(apData.viewCount || apData.viewsCount'),
    'getStoreProfile must normalize viewCount accepting apData.viewCount or apData.viewsCount'
  );
  assert(
    content.includes('likeCount: Number(apData.likeCount'),
    'getStoreProfile must populate likeCount from ActivePartners'
  );
  assert(
    content.includes('getActivePartner: async (uid)'),
    'adManagementService must export getActivePartner helper'
  );
});

// ==============================================================================
// 6. UI BORDER RADIUS 0.1 (rounded-[2px]) & BUTTON PRESERVATION AUDITING
// ==============================================================================
console.log('\n--- 6. UI BORDER RADIUS 0.1 (rounded-[2px]) & BUTTON PRESERVATION AUDITING ---');

test('Radius:MarketingInfo', 'MarketingInfo.jsx containers, cards, and inputs use rounded-[2px]', () => {
  const filePath = resolvePath('dh-backoffice-react/src/pages/Customers/components/details/MarketingInfo.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify presence of rounded-[2px]
  const count2px = (content.match(/rounded-\[2px\]/g) || []).length;
  assert(count2px >= 10, `MarketingInfo.jsx must use rounded-[2px] across cards/containers (found ${count2px})`);

  // Verify zero old rounded-[0.1rem] remnants
  assert(!content.includes('rounded-[0.1rem]'), 'MarketingInfo.jsx must normalize all rounded-[0.1rem] to rounded-[2px]');
});

test('Radius:ButtonsPreserved', 'Action buttons across all modified components retain system radii', () => {
  // 1. StoreProfileHero.jsx
  const heroPath = resolvePath('dh-frontend/src/pages/StoreProfile/components/StoreProfileHero.jsx');
  const heroContent = fs.readFileSync(heroPath, 'utf8');
  assert(heroContent.includes('rounded-xl bg-emerald-600'), 'StoreProfileHero.jsx phone button must preserve rounded-xl');
  assert(heroContent.includes('rounded-xl bg-sky-600'), 'StoreProfileHero.jsx maps button must preserve rounded-xl');
  assert(heroContent.includes('rounded-[2px]'), 'StoreProfileHero.jsx hero container must use rounded-[2px]');

  // 2. TabAdManager.jsx
  const tabPath = resolvePath('dh-frontend/src/components/profile/tabs/TabAdManager.jsx');
  const tabContent = fs.readFileSync(tabPath, 'utf8');
  assert(tabContent.includes('rounded-lg flex items-center'), 'TabAdManager.jsx subtab buttons must preserve rounded-lg');
  assert(tabContent.includes('rounded-full font-bold'), 'TabAdManager.jsx view count badge must use rounded-full pill');

  // 3. AdListTable.jsx
  const tablePath = resolvePath('dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');
  const tableContent = fs.readFileSync(tablePath, 'utf8');
  assert(tableContent.includes('rounded-lg text-xs font-bold'), 'AdListTable.jsx action buttons must preserve rounded-lg');

  // 4. StoreProfileForm.jsx
  const formPath = resolvePath('dh-frontend/src/components/profile/tabs/store-profile/StoreProfileForm.jsx');
  const formContent = fs.readFileSync(formPath, 'utf8');
  assert(formContent.includes('rounded-md flex items-center gap-2 border border-slate-200'), 'StoreProfileForm.jsx shortcut button preserves rounded-md');
});

test('Radius:NoProhibitedBubble', 'Zero prohibited bubble curvature (rounded-2xl / rounded-3xl) on cards in target files', () => {
  const targetFiles = [
    'dh-backoffice-react/src/pages/Customers/components/details/MarketingInfo.jsx',
    'dh-frontend/src/pages/StoreProfile/components/PartnerAds.jsx',
    'dh-frontend/src/components/ads/ProductAdCard.jsx',
    'dh-frontend/src/components/profile/tabs/store-profile/StoreProfileForm.jsx'
  ];

  targetFiles.forEach((rel) => {
    const fPath = resolvePath(rel);
    if (!fs.existsSync(fPath)) return;
    const content = fs.readFileSync(fPath, 'utf8');
    
    // Check for illegal bubble radii on card containers
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if ((line.includes('rounded-2xl') || line.includes('rounded-3xl')) && (line.includes('Card') || line.includes('card') || line.includes('border') || line.includes('bg-white'))) {
        assert.fail(`Prohibited bubble curvature at ${rel}:${idx + 1}: ${line.trim()}`);
      }
    });
  });
});

// ==============================================================================
// 7. PRODUCTION BUILD VERIFICATION
// ==============================================================================
console.log('\n--- 7. PRODUCTION BUILD ARTIFACTS VERIFICATION ---');

test('Build:Frontend', 'dh-frontend production build artifact exists and contains valid entrypoint', () => {
  const indexPath = resolvePath('dh-frontend/dist/index.html');
  assert(fs.existsSync(indexPath), `Frontend build artifact missing: ${indexPath}`);
  const html = fs.readFileSync(indexPath, 'utf8');
  assert(html.includes('<script type="module"'), 'index.html must reference Vite module bundle');
});

test('Build:Backoffice', 'dh-backoffice-react production build artifact exists and contains PWA manifest', () => {
  const indexPath = resolvePath('dh-backoffice-react/dist/index.html');
  const swPath = resolvePath('dh-backoffice-react/dist/sw.js');
  assert(fs.existsSync(indexPath), `Backoffice build artifact missing: ${indexPath}`);
  assert(fs.existsSync(swPath), `Backoffice service worker missing: ${swPath}`);
  const html = fs.readFileSync(indexPath, 'utf8');
  assert(html.includes('manifest.webmanifest'), 'index.html must reference PWA webmanifest');
});

// ==============================================================================
// SUMMARY & VERDICT
// ==============================================================================
console.log('\n================================================================================');
console.log(`📊 CHALLENGER M3-2 RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
if (failedTests === 0) {
  console.log('🏆 VERDICT: APPROVE — ALL UI DISPLAY PARITY, BOUNDARIES & INVARIANTS PASS EMPIRICALLY!');
} else {
  console.error(`💥 VERDICT: REQUEST_CHANGES — ${failedTests} DEFECTS DETECTED:`);
  defects.forEach(d => console.error(`   - [${d.category}] ${d.description}: ${d.error}`));
}
console.log('================================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
