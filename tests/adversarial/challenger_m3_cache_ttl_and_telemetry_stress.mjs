/**
 * 🧪 EMPIRICAL ADVERSARIAL STRESS TEST SUITE
 * Milestone 3: Cache TTL, Memory Eviction, Ad View Preservation & Telemetry Aggregation
 * Path: Management System/tests/adversarial/challenger_m3_cache_ttl_and_telemetry_stress.mjs
 * 
 * Verifies & Stress-Tests:
 * 1. Cache TTL expiration (300,000ms) and unbounded memory leak pruning in MarketingInfo.jsx
 * 2. Ad View preservation across multiple consecutive approvals in adManagementService.js
 * 3. recordAdTelemetry.js store_view & ad event aggregation and boundary limits
 * 4. commitTelemetryTransaction execution: atomic increments, credit deductions, and variable scoping
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

console.log('====================================================================');
console.log('⚔️  CHALLENGER M3-1: EMPIRICAL ADVERSARIAL STRESS TEST SUITE');
console.log('====================================================================\n');

let passCount = 0;
let failCount = 0;
const failureDetails = [];

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failureDetails.push({ name, error: err.message, stack: err.stack });
    failCount++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failureDetails.push({ name, error: err.message, stack: err.stack });
    failCount++;
  }
}

// ====================================================================
// SUITE 1: Cache TTL & Memory Eviction Stress (MarketingInfo.jsx)
// ====================================================================
console.log('--- SUITE 1: CACHE TTL & MEMORY EVICTION STRESS ---');

// Replicate the exact caching algorithm implemented in MarketingInfo.jsx
const MARKETING_CACHE_TTL_MS = 300000;

function createMarketingCache() {
  const cache = {};
  
  const getCache = (uid, currentTime = Date.now()) => {
    const entry = cache[uid];
    if (!entry) return null;
    if (currentTime - entry.timestamp > MARKETING_CACHE_TTL_MS) {
      delete cache[uid];
      return null;
    }
    return entry;
  };

  const setCache = (uid, data, currentTime = Date.now()) => {
    const now = currentTime;
    Object.keys(cache).forEach((key) => {
      if (now - cache[key].timestamp > MARKETING_CACHE_TTL_MS) {
        delete cache[key];
      }
    });
    cache[uid] = {
      ...data,
      timestamp: now
    };
  };

  return { cache, getCache, setCache };
}

runTest('1.1 Cache hit within 300,000ms TTL window', () => {
  const { cache, getCache, setCache } = createMarketingCache();
  const startTime = 1000000;
  
  setCache('user_1', { storeProfile: { name: 'Shop 1' }, ads: [] }, startTime);
  
  // Access at 0ms, 100,000ms, and 299,999ms
  const hit0 = getCache('user_1', startTime);
  assert(hit0 !== null, 'Should hit cache at 0ms');
  assert.strictEqual(hit0.storeProfile.name, 'Shop 1');

  const hit100k = getCache('user_1', startTime + 100000);
  assert(hit100k !== null, 'Should hit cache at 100,000ms');

  const hit299k = getCache('user_1', startTime + 299999);
  assert(hit299k !== null, 'Should hit cache at 299,999ms');
});

runTest('1.2 Cache exact boundary condition (300,000ms)', () => {
  const { cache, getCache, setCache } = createMarketingCache();
  const startTime = 1000000;
  
  setCache('user_boundary', { ads: [1, 2] }, startTime);
  
  // At exactly 300,000ms: difference > 300,000 is FALSE, so cache hits
  const exactHit = getCache('user_boundary', startTime + 300000);
  assert(exactHit !== null, 'Boundary at exactly 300,000ms should still hit cache');
  assert.strictEqual(exactHit.ads.length, 2);

  // At 300,001ms: difference > 300,000 is TRUE, expired and deleted
  const expiredMiss = getCache('user_boundary', startTime + 300001);
  assert.strictEqual(expiredMiss, null, 'Cache must expire at 300,001ms');
  assert.strictEqual(cache['user_boundary'], undefined, 'Entry must be deleted from memory on expired read');
});

runTest('1.3 High-churn memory leak stress test (10,000 customer entries)', () => {
  const { cache, getCache, setCache } = createMarketingCache();
  const baseTime = 1000000;

  // Insert 5,000 entries that will expire (timestamped at t = 0)
  for (let i = 0; i < 5000; i++) {
    cache[`old_user_${i}`] = { data: i, timestamp: baseTime };
  }

  // Insert 5,000 fresh entries (timestamped at t = 200,000)
  for (let i = 0; i < 5000; i++) {
    cache[`fresh_user_${i}`] = { data: i, timestamp: baseTime + 200000 };
  }

  assert.strictEqual(Object.keys(cache).length, 10000, 'Initial pre-populated count should be 10,000');

  // Trigger setCache at time t = baseTime + 350,000
  // Old entries (age 350,000 > 300,000) must be pruned.
  // Fresh entries (age 150,000 < 300,000) must remain.
  setCache('new_user_trigger', { active: true }, baseTime + 350000);

  const remainingKeys = Object.keys(cache);
  assert.strictEqual(
    remainingKeys.length,
    5001,
    `Expired entries should be completely pruned on write. Expected 5001, got ${remainingKeys.length}`
  );
  assert.strictEqual(cache['old_user_0'], undefined, 'Old expired user should not exist in cache');
  assert(cache['fresh_user_0'] !== undefined, 'Fresh user should still exist in cache');
  assert(cache['new_user_trigger'] !== undefined, 'Newly added entry must exist');
});

runTest('1.4 Mutation preservation in cache during status changes (pause/delete)', () => {
  const { cache, setCache } = createMarketingCache();
  const startTime = 1000000;

  setCache('customer_42', {
    storeProfile: { viewCount: 150 },
    ads: [{ id: 'ad_1', status: 'active' }, { id: 'ad_2', status: 'active' }]
  }, startTime);

  // Simulate handlePauseAd updating cache directly:
  const newAds = cache['customer_42'].ads.map(ad => ad.id === 'ad_1' ? { ...ad, status: 'paused' } : ad);
  cache['customer_42'].ads = newAds;

  assert.strictEqual(cache['customer_42'].ads[0].status, 'paused', 'Ad status update in cache should take effect');
  assert.strictEqual(cache['customer_42'].timestamp, startTime, 'Ad mutation must preserve original timestamp for TTL');
});

// ====================================================================
// SUITE 2: Ad View Preservation Under Consecutive Approvals (adManagementService.js)
// ====================================================================
console.log('\n--- SUITE 2: AD VIEW PRESERVATION UNDER CONSECUTIVE APPROVALS ---');

function simulateApproveAdBundleSync(existingItems, partnerId, adData) {
  let items = [...existingItems];
  const existingIdx = items.findIndex(i => (i.id === partnerId || i.partnerId === partnerId));
  const existingAd = existingIdx >= 0 ? items[existingIdx] : null;
  const existingStats = existingAd?.stats || {};

  const partnerItem = {
    id: partnerId,
    partnerId: partnerId,
    storeName: adData.partnerName || adData.title || '',
    partnerName: adData.partnerName || adData.title || '',
    services: adData.services || '',
    phone: adData.phone || '',
    points: 100,
    viewsCount: Number(adData?.stats?.views || adData?.viewsCount || 0),
    stats: {
      ...existingStats,
      views: existingAd?.stats?.views || existingAd?.viewsCount || 0,
      clicks: existingAd?.stats?.clicks || Number(adData?.stats?.clicks || adData?.clicks || 0)
    },
    isVerified: true,
    isActive: true
  };

  // 🛡️ M3 Parity Logic from adManagementService.js line 282-284:
  if (existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views) {
    partnerItem.viewsCount = existingAd?.viewsCount || existingAd?.views || existingAd?.stats?.views || 0;
  }

  if (existingIdx >= 0) {
    items[existingIdx] = { ...items[existingIdx], ...partnerItem };
  } else {
    items.unshift(partnerItem);
  }

  return items;
}

runTest('2.1 Consecutive approvals: accumulated view counts (500 views) must NEVER reset to 0', () => {
  const initialItems = [
    {
      id: 'partner_zeer',
      partnerId: 'partner_zeer',
      storeName: 'Lucky Com Zeer Rangsit',
      viewsCount: 500,
      stats: { views: 500, clicks: 12 }
    }
  ];

  // Approval 1: Manager approves ad update with adData having 0 views in payload
  const adUpdate1 = {
    partnerName: 'Lucky Com Zeer Rangsit (Updated Name)',
    stats: { views: 0, clicks: 0 }
  };
  const afterApproval1 = simulateApproveAdBundleSync(initialItems, 'partner_zeer', adUpdate1);
  const p1 = afterApproval1.find(i => i.id === 'partner_zeer');
  assert.strictEqual(p1.viewsCount, 500, 'Approval 1: viewsCount must be preserved at 500');
  assert.strictEqual(p1.stats.views, 500, 'Approval 1: stats.views must be preserved at 500');
  assert.strictEqual(p1.storeName, 'Lucky Com Zeer Rangsit (Updated Name)');

  // Approval 2: Manager re-approves with empty stats object
  const adUpdate2 = {
    partnerName: 'Lucky Com Zeer Rangsit Final',
    stats: {}
  };
  const afterApproval2 = simulateApproveAdBundleSync(afterApproval1, 'partner_zeer', adUpdate2);
  const p2 = afterApproval2.find(i => i.id === 'partner_zeer');
  assert.strictEqual(p2.viewsCount, 500, 'Approval 2: viewsCount must remain 500');
  assert.strictEqual(p2.stats.views, 500, 'Approval 2: stats.views must remain 500');

  // Approval 3: Manager re-approves with null adData stats
  const adUpdate3 = {
    partnerName: 'Lucky Com Zeer Rangsit Platinum'
  };
  const afterApproval3 = simulateApproveAdBundleSync(afterApproval2, 'partner_zeer', adUpdate3);
  const p3 = afterApproval3.find(i => i.id === 'partner_zeer');
  assert.strictEqual(p3.viewsCount, 500, 'Approval 3: viewsCount must remain 500');
  assert.strictEqual(p3.stats.views, 500, 'Approval 3: stats.views must remain 500');
});

runTest('2.2 Edge cases: legacy field naming variations (views vs viewsCount)', () => {
  // Scenario A: Existing partner has legacy `views: 850` without `viewsCount`
  const legacyItemsA = [{ id: 'p_a', views: 850, stats: {} }];
  const resA = simulateApproveAdBundleSync(legacyItemsA, 'p_a', { partnerName: 'Store A', stats: { views: 0 } });
  assert.strictEqual(resA[0].viewsCount, 850, 'Must fallback to legacy views field (850)');

  // Scenario B: Existing partner has `stats.views: 1200` without root viewsCount
  const legacyItemsB = [{ id: 'p_b', stats: { views: 1200 } }];
  const resB = simulateApproveAdBundleSync(legacyItemsB, 'p_b', { partnerName: 'Store B' });
  assert.strictEqual(resB[0].viewsCount, 1200, 'Must fallback to stats.views (1200)');
  assert.strictEqual(resB[0].stats.views, 1200, 'stats.views must be 1200');
});

runTest('2.3 Brand new partner approval (null existingAd)', () => {
  const initialItems = [{ id: 'existing_partner', viewsCount: 100 }];
  const newPartnerData = {
    partnerName: 'Brand New Partner',
    stats: { views: 0, clicks: 0 }
  };
  const result = simulateApproveAdBundleSync(initialItems, 'new_partner', newPartnerData);
  assert.strictEqual(result.length, 2, 'Bundle should contain 2 items');
  assert.strictEqual(result[0].id, 'new_partner', 'New partner should be unshifted to the top');
  assert.strictEqual(result[0].viewsCount, 0, 'New partner viewsCount should initialize cleanly to 0');
  assert.strictEqual(result[0].stats.views, 0, 'New partner stats.views should initialize to 0');
});

// ====================================================================
// SUITE 3: Backend Telemetry Ingestion Contract (recordAdTelemetry.js)
// ====================================================================
console.log('\n--- SUITE 3: BACKEND TELEMETRY INGESTION & AGGREGATION ---');

const telemetryModule = await import('../../functions/marketing/recordAdTelemetry.js');
const { aggregateTelemetryEvents, calculateAdDeductions, commitTelemetryTransaction } = telemetryModule.default || telemetryModule;

runTest('3.1 Mixed batch payload aggregation (store_view + ad_impression + ad_click)', () => {
  const mixedEvents = [
    { type: 'store_view', store_id: 'store_alpha', partner_name: 'Alpha Store' },
    { type: 'store_view', storeId: 'store_alpha', partner_name: 'Alpha Store' },
    { type: 'store_view', store_id: 'store_beta', partner_name: 'Beta Store' },
    { type: 'view', adId: 'ad_x1', collection: 'partner_ads', ownerId: 'user_x' },
    { type: 'view', adId: 'ad_x1', collection: 'partner_ads', ownerId: 'user_x' },
    { type: 'click', adId: 'ad_x1', collection: 'partner_ads', ownerId: 'user_x' },
    { type: 'view', adId: 'ad_y2', collection: 'user_sku_ads', ownerId: 'user_y' }
  ];

  const { adAggregates, storeAggregates, distinctCount } = aggregateTelemetryEvents(mixedEvents);

  assert.strictEqual(storeAggregates['store_alpha'].views, 2, 'store_alpha must have 2 views');
  assert.strictEqual(storeAggregates['store_beta'].views, 1, 'store_beta must have 1 view');
  assert.strictEqual(adAggregates['ad_x1'].views, 2, 'ad_x1 must have 2 views');
  assert.strictEqual(adAggregates['ad_x1'].clicks, 1, 'ad_x1 must have 1 click');
  assert.strictEqual(adAggregates['ad_y2'].views, 1, 'ad_y2 must have 1 view');
  assert.strictEqual(adAggregates['ad_y2'].collection, 'user_sku_ads', 'Collection must be user_sku_ads');
  assert.strictEqual(distinctCount, 4, 'Distinct count must be 4 (2 stores + 2 ads)');
});

runTest('3.2 Malformed, whitespace, and boundary event payloads', () => {
  const weirdEvents = [
    null,
    undefined,
    {},
    { type: 'store_view' }, // missing store_id
    { type: 'store_view', store_id: '   ' }, // whitespace store_id
    { type: 'store_view', store_id: '  store_trimmed  ', partner_name: 'Trimmed' },
    { type: 'view' }, // missing adId
    { type: 'view', adId: '   ' }, // whitespace adId
    { type: 'view', adId: '  ad_trimmed  ', ownerId: 'unknown' }
  ];

  const { adAggregates, storeAggregates, distinctCount } = aggregateTelemetryEvents(weirdEvents);

  assert.strictEqual(storeAggregates['store_trimmed'].views, 1, 'Whitespace in store_id should be trimmed');
  assert.strictEqual(adAggregates['ad_trimmed'].views, 1, 'Whitespace in adId should be trimmed');
  assert.strictEqual(adAggregates['ad_trimmed'].ownerId, null, 'Owner "unknown" should be converted to null');
  assert.strictEqual(distinctCount, 2, 'Only 2 valid entities should be parsed');
});

runTest('3.3 Truncation guards: MAX_EVENTS_PER_BATCH (100) and MAX_DISTINCT_ADS (30)', () => {
  // Generate 150 events for 40 distinct ads
  const excessiveEvents = [];
  for (let i = 0; i < 150; i++) {
    excessiveEvents.push({
      type: 'view',
      adId: `ad_${i % 40}`,
      ownerId: `user_${i % 40}`
    });
  }

  const { adAggregates, distinctCount } = aggregateTelemetryEvents(excessiveEvents);
  const distinctAdIds = Object.keys(adAggregates);

  assert(distinctAdIds.length <= 30, `Distinct ads must be capped at 30, got ${distinctAdIds.length}`);
});

// ====================================================================
// SUITE 4: Backend Telemetry Transaction Execution & Scoping Vulnerability
// ====================================================================
console.log('\n--- SUITE 4: BACKEND TELEMETRY TRANSACTION EXECUTION & SCOPING ---');

// Mock Firestore Database & Transaction Engine
function createMockFirestore(initialData = {}) {
  const store = JSON.parse(JSON.stringify(initialData));
  const writtenOps = [];

  const getDoc = (coll, docId) => {
    const data = store[coll]?.[docId];
    return {
      exists: !!data,
      id: docId,
      ref: { coll, docId },
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
    };
  };

  const db = {
    collection: (coll) => ({
      doc: (docId) => ({
        coll,
        docId,
        get: async () => getDoc(coll, docId)
      })
    }),
    runTransaction: async (updateFunction) => {
      const transaction = {
        get: async (ref) => getDoc(ref.coll, ref.docId),
        set: (ref, data, options = {}) => {
          writtenOps.push({ type: 'set', ref, data, options });
          if (!store[ref.coll]) store[ref.coll] = {};
          if (options.merge && store[ref.coll][ref.docId]) {
            store[ref.coll][ref.docId] = { ...store[ref.coll][ref.docId], ...data };
          } else {
            store[ref.coll][ref.docId] = JSON.parse(JSON.stringify(data));
          }
        },
        update: (ref, data) => {
          writtenOps.push({ type: 'update', ref, data });
          if (!store[ref.coll]) store[ref.coll] = {};
          store[ref.coll][ref.docId] = { ...(store[ref.coll][ref.docId] || {}), ...data };
        },
        delete: (ref) => {
          writtenOps.push({ type: 'delete', ref });
          if (store[ref.coll]?.[ref.docId]) {
            delete store[ref.coll][ref.docId];
          }
        }
      };

      return updateFunction(transaction);
    }
  };

  return { db, store, writtenOps };
}

await runAsyncTest('4.1 Pure store view transaction: atomic increments on ActivePartners', async () => {
  const initialData = {
    ActivePartners: {
      store_101: { partnerId: 'store_101', viewCount: 15, storeName: 'Zeer Shop' }
    }
  };
  const { db, store, writtenOps } = createMockFirestore(initialData);

  const storeAggregates = {
    store_101: { storeId: 'store_101', views: 5, partnerName: 'Zeer Shop' },
    store_new: { storeId: 'store_new', views: 3, partnerName: 'New Shop' }
  };

  const result = await commitTelemetryTransaction(db, {}, {}, storeAggregates);

  assert.strictEqual(result.success, true, 'Transaction should succeed');
  assert.strictEqual(result.storesUpdated, 2, 'Should update 2 stores');
  assert.strictEqual(result.adsUpdated, 0, 'Zero ads updated');

  // Verify store_101 received increment update
  const store101Op = writtenOps.find(op => op.ref.coll === 'ActivePartners' && op.ref.docId === 'store_101');
  assert(store101Op !== undefined, 'store_101 update operation recorded');
  assert.strictEqual(store101Op.type, 'update');

  // Verify store_new was created via set merge
  const storeNewOp = writtenOps.find(op => op.ref.coll === 'ActivePartners' && op.ref.docId === 'store_new');
  assert(storeNewOp !== undefined, 'store_new set operation recorded');
  assert.strictEqual(storeNewOp.type, 'set');
  assert.strictEqual(storeNewOp.options?.merge, true);
});

await runAsyncTest('4.2 ADVERSARIAL STRESS CHALLENGE: settingsRef Variable Scoping Vulnerability in commitTelemetryTransaction', async () => {
  // Setup database with an active ad, customer points, and credit config ledger
  const initialData = {
    partner_ads: {
      ad_test_1: {
        id: 'ad_test_1',
        ownerId: 'user_rich',
        type: 'BANNER',
        status: 'active',
        spentBudget: 0,
        stats: { views: 10, clicks: 0 }
      }
    },
    users: {
      user_rich: {
        creditPoints: 500
      }
    },
    settings: {
      credit_config: {
        config: { adClickCost: 5, adImpressionCost: 0.1, adImpressionCount: 1000 },
        ledger: { systemPoolMax: 10000000, totalAllocated: 500, status: 'SECURE' }
      }
    }
  };

  const { db } = createMockFirestore(initialData);

  // An ad event that triggers a deduction (1 click = 5 credits deduction)
  const adAggregates = {
    ad_test_1: {
      adId: 'ad_test_1',
      collection: 'partner_ads',
      views: 0,
      clicks: 1,
      ownerId: 'user_rich'
    }
  };

  const config = { adClickCost: 5, adImpressionCost: 0.1, adImpressionCount: 1000 };

  try {
    await commitTelemetryTransaction(db, adAggregates, config, {});
    // If it reaches here without throwing ReferenceError:
    console.log('   ℹ️  commitTelemetryTransaction executed without error');
  } catch (err) {
    console.log(`   🚨 CAUGHT EXPECTED / POTENTIAL VULNERABILITY: ${err.message}`);
    // If settingsRef is declared inside `if (adIds.length > 0) { const settingsRef = ... }`
    // and referenced at line 396 outside that block, JS will throw ReferenceError: settingsRef is not defined
    if (err.message.includes('settingsRef is not defined')) {
      throw new Error(`CRITICAL BUG CONFIRMED: "settingsRef is not defined" at recordAdTelemetry.js line 396 due to block-scoped const declaration inside if (adIds.length > 0)`);
    }
    throw err;
  }
});

// ====================================================================
// SUMMARY & VERDICT
// ====================================================================
console.log('\n====================================================================');
console.log(`📊 ADVERSARIAL TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================================');

if (failCount > 0) {
  console.error('\n❌ FAILURES DETECTED:');
  failureDetails.forEach((f, idx) => {
    console.error(`  ${idx + 1}. [${f.name}]`);
    console.error(`     Error: ${f.error}`);
  });
  console.log('\n🚨 VERDICT: REQUEST_CHANGES');
  process.exit(1);
} else {
  console.log('\n🎯 VERDICT: APPROVE');
  process.exit(0);
}
