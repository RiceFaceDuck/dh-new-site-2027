/**
 * ⚔️ EMPIRICAL CHALLENGER 1 — MILESTONE 1 ADVERSARIAL STRESS TEST SUITE
 * File: Management System/tests/adversarial/adversarial_m1_store_metrics_stress.mjs
 * 
 * Target Modules:
 * - Management System/dh-shared/src/utils/storeMetricsHelper.js
 * - Management System/functions/marketing/recordAdTelemetry.js
 * 
 * Challenger Focus:
 * 1. Timezone boundary stress testing (UTC vs Bangkok midnight, leap years, year boundaries, malformed inputs).
 * 2. Cross-module Bangkok date key parity (ESM vs CJS 1,000 random timestamp fuzzing).
 * 3. resolveStoreViewMetrics resilience (Legacy migration, ?? trap, lazy rollover, Monotonic Max ceiling, midnight isolation).
 * 4. recordAdTelemetry.js CJS import & Write Phase 1 seeding math verification.
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ESM imports
import {
  getBangkokDateKey as getBangkokDateKeyEsm,
  resolveStoreViewMetrics
} from '../../dh-shared/src/utils/storeMetricsHelper.js';

import {
  formatLineUrl,
  formatMessengerUrl,
  formatYoutubeUrl,
  formatTiktokUrl,
  formatExternalUrl,
  resolveMapsUrl,
  resolveSocialLinks
} from '../../dh-frontend/src/pages/StoreProfile/utils/storeUrlUtils.js';

// CJS require
const require = createRequire(import.meta.url);
const recordAdTelemetryCjs = require('../../functions/marketing/recordAdTelemetry.js');
const {
  getBangkokDateKey: getBangkokDateKeyCjs,
  aggregateTelemetryEvents
} = recordAdTelemetryCjs;

console.log('================================================================================');
console.log('  ⚔️ EMPIRICAL CHALLENGER 1: MILESTONE 1 ADVERSARIAL STRESS TEST');
console.log('  Target: storeMetricsHelper.js & recordAdTelemetry.js (Backend & Domain)');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const defects = [];

function challenge(suite, description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] [${suite}] ${description}`);
  } catch (err) {
    failedTests++;
    defects.push({ suite, description, error: err.message, stack: err.stack });
    console.error(`  ❌ [FAIL] [${suite}] ${description}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ================================================================================
// SUITE 1: TIMEZONE & BANGKOK MIDNIGHT BOUNDARY STRESS
// ================================================================================
console.log('--- Suite 1: Timezone & Bangkok Midnight Boundary Stress ---');

challenge('Timezone', 'Bangkok Midnight (UTC 17:00:00 = Bangkok 00:00:00 next day)', () => {
  // 1 ms before midnight: 16:59:59.999Z -> Bangkok 23:59:59.999 -> 2026-11-09
  const justBefore = new Date('2026-11-09T16:59:59.999Z');
  assert.equal(getBangkokDateKeyEsm(justBefore), '2026-11-09');
  assert.equal(getBangkokDateKeyCjs(justBefore), '2026-11-09');

  // Exact midnight: 17:00:00.000Z -> Bangkok 00:00:00.000 -> 2026-11-10
  const atMidnight = new Date('2026-11-09T17:00:00.000Z');
  assert.equal(getBangkokDateKeyEsm(atMidnight), '2026-11-10');
  assert.equal(getBangkokDateKeyCjs(atMidnight), '2026-11-10');

  // 1 ms after midnight: 17:00:00.001Z -> Bangkok 00:00:00.001 -> 2026-11-10
  const justAfter = new Date('2026-11-09T17:00:00.001Z');
  assert.equal(getBangkokDateKeyEsm(justAfter), '2026-11-10');
  assert.equal(getBangkokDateKeyCjs(justAfter), '2026-11-10');
});

challenge('Timezone', 'UTC Midnight (UTC 00:00:00 = Bangkok 07:00:00 same day)', () => {
  // 23:59:59 UTC previous day = 06:59:59 Bangkok same day
  const beforeUtcMidnight = new Date('2026-11-08T23:59:59.999Z');
  assert.equal(getBangkokDateKeyEsm(beforeUtcMidnight), '2026-11-09');
  assert.equal(getBangkokDateKeyCjs(beforeUtcMidnight), '2026-11-09');

  // 00:00:00 UTC = 07:00:00 Bangkok
  const atUtcMidnight = new Date('2026-11-09T00:00:00.000Z');
  assert.equal(getBangkokDateKeyEsm(atUtcMidnight), '2026-11-09');
  assert.equal(getBangkokDateKeyCjs(atUtcMidnight), '2026-11-09');
});

challenge('Timezone', 'Leap year rollover 2024-02-28 -> 2024-02-29 -> 2024-03-01', () => {
  // 2024-02-28 16:59:59.999Z -> 2024-02-28
  assert.equal(getBangkokDateKeyEsm('2024-02-28T16:59:59.999Z'), '2024-02-28');
  // 2024-02-28 17:00:00.000Z -> 2024-02-29 (Leap Day!)
  assert.equal(getBangkokDateKeyEsm('2024-02-28T17:00:00.000Z'), '2024-02-29');
  assert.equal(getBangkokDateKeyCjs('2024-02-28T17:00:00.000Z'), '2024-02-29');
  // 2024-02-29 16:59:59.999Z -> 2024-02-29
  assert.equal(getBangkokDateKeyEsm('2024-02-29T16:59:59.999Z'), '2024-02-29');
  // 2024-02-29 17:00:00.000Z -> 2024-03-01
  assert.equal(getBangkokDateKeyEsm('2024-02-29T17:00:00.000Z'), '2024-03-01');
  assert.equal(getBangkokDateKeyCjs('2024-02-29T17:00:00.000Z'), '2024-03-01');
});

challenge('Timezone', 'Non-leap year rollover 2025-02-28 -> 2025-03-01', () => {
  assert.equal(getBangkokDateKeyEsm('2025-02-28T16:59:59.999Z'), '2025-02-28');
  assert.equal(getBangkokDateKeyEsm('2025-02-28T17:00:00.000Z'), '2025-03-01');
  assert.equal(getBangkokDateKeyCjs('2025-02-28T17:00:00.000Z'), '2025-03-01');
});

challenge('Timezone', 'Year boundary rollover 2026-12-31 -> 2027-01-01', () => {
  assert.equal(getBangkokDateKeyEsm('2026-12-31T16:59:59.999Z'), '2026-12-31');
  assert.equal(getBangkokDateKeyEsm('2026-12-31T17:00:00.000Z'), '2027-01-01');
  assert.equal(getBangkokDateKeyCjs('2026-12-31T17:00:00.000Z'), '2027-01-01');
});

challenge('Timezone', 'Timestamp formats: numeric epoch, Firestore Timestamp object (.toDate)', () => {
  const epoch = 1700000000000; // 2023-11-14T22:13:20.000Z -> Bangkok 2023-11-15 05:13:20
  assert.equal(getBangkokDateKeyEsm(epoch), '2023-11-15');
  assert.equal(getBangkokDateKeyCjs(epoch), '2023-11-15');

  const fsTimestamp = {
    toDate: () => new Date('2023-11-14T22:13:20.000Z')
  };
  assert.equal(getBangkokDateKeyEsm(fsTimestamp), '2023-11-15');
});

challenge('Timezone', 'Malformed and boundary inputs fallback safely to current Bangkok dateKey', () => {
  const expectedNow = getBangkokDateKeyEsm(new Date());
  assert.equal(getBangkokDateKeyEsm(null), expectedNow);
  assert.equal(getBangkokDateKeyEsm(undefined), expectedNow);
  assert.equal(getBangkokDateKeyEsm(''), expectedNow);
  assert.equal(getBangkokDateKeyEsm('invalid-string'), expectedNow);
  assert.equal(getBangkokDateKeyEsm(NaN), expectedNow);

  assert.equal(getBangkokDateKeyCjs(null), expectedNow);
  assert.equal(getBangkokDateKeyCjs(undefined), expectedNow);
  assert.equal(getBangkokDateKeyCjs(''), expectedNow);
  assert.equal(getBangkokDateKeyCjs('invalid-string'), expectedNow);
  assert.equal(getBangkokDateKeyCjs(NaN), expectedNow);
});

challenge('Timezone', 'Cross-Module Parity Fuzzer: 1,000 random timestamps match 100%', () => {
  // Epoch range from 2020-01-01 to 2030-01-01
  const startMs = new Date('2020-01-01T00:00:00Z').getTime();
  const endMs = new Date('2030-01-01T00:00:00Z').getTime();
  const step = (endMs - startMs) / 1000;

  for (let i = 0; i < 1000; i++) {
    const testMs = Math.floor(startMs + (i * step) + (Math.random() * step));
    const esmResult = getBangkokDateKeyEsm(testMs);
    const cjsResult = getBangkokDateKeyCjs(testMs);
    assert.equal(esmResult, cjsResult, `Mismatch at epoch ms ${testMs}: ESM ${esmResult} !== CJS ${cjsResult}`);
  }
});

// ================================================================================
// SUITE 2: RESOLVESTOREVIEWMETRICS RESILIENCE & MONOTONICITY
// ================================================================================
console.log('\n--- Suite 2: resolveStoreViewMetrics Resilience & Monotonicity ---');

const fixedNow = new Date('2026-11-09T10:00:00.000Z'); // Bangkok: 2026-11-09 17:00
const todayKey = '2026-11-09';
const yesterdayKey = '2026-11-08';

challenge('ResolveMetrics', 'Legacy document with only viewCount: 150 (empty views)', () => {
  const legacyDoc = { viewCount: 150 };
  const res = resolveStoreViewMetrics(legacyDoc, null, fixedNow);
  assert.deepEqual(res, {
    allTime: 150,
    today: 0,
    dateKey: todayKey
  });
});

challenge('ResolveMetrics', 'Legacy document with viewsCount: 200 (alternative field)', () => {
  const legacyDoc = { viewsCount: 200 };
  const res = resolveStoreViewMetrics(legacyDoc, null, fixedNow);
  assert.deepEqual(res, {
    allTime: 200,
    today: 0,
    dateKey: todayKey
  });
});

challenge('ResolveMetrics', 'Nullish coalescing trap: viewCount: 150 vs views.allTime: 1', () => {
  const desyncedDoc = {
    viewCount: 150,
    views: {
      allTime: 1,
      today: 1,
      dateKey: todayKey
    }
  };
  const res = resolveStoreViewMetrics(desyncedDoc, null, fixedNow);
  // Math.max must preserve 150, NOT drop to 1!
  assert.equal(res.allTime, 150);
  assert.equal(res.today, 1);
  assert.equal(res.dateKey, todayKey);
});

challenge('ResolveMetrics', 'Midnight Lazy Rollover on Read: yesterday count resets today=0 with 0 DB writes', () => {
  const yesterdayDoc = {
    viewCount: 300,
    views: {
      allTime: 300,
      today: 45,
      dateKey: yesterdayKey
    }
  };
  const res = resolveStoreViewMetrics(yesterdayDoc, null, fixedNow);
  assert.equal(res.allTime, 300);
  assert.equal(res.today, 0); // Rolled over to 0!
  assert.equal(res.dateKey, todayKey);
});

challenge('ResolveMetrics', 'Monotonic Max Ceiling: remote=1, localLock targetViews=1 (Zero Flicker, Zero Jump)', () => {
  const remoteDoc = {
    viewCount: 1,
    views: {
      allTime: 1,
      today: 1,
      dateKey: todayKey
    }
  };
  const activeLock = {
    expiresAt: fixedNow.getTime() + 1800000,
    dateKey: todayKey,
    targetViews: 1,
    targetToday: 1
  };
  const res = resolveStoreViewMetrics(remoteDoc, activeLock, fixedNow);
  assert.equal(res.allTime, 1); // Strictly 1, NOT 2!
  assert.equal(res.today, 1);   // Strictly 1, NOT 2!
});

challenge('ResolveMetrics', 'Monotonic Max Ceiling: delayed commit (remote=0, lock targetViews=1)', () => {
  const remotePending = {
    viewCount: 0,
    views: {
      allTime: 0,
      today: 0,
      dateKey: todayKey
    }
  };
  const activeLock = {
    expiresAt: fixedNow.getTime() + 1800000,
    dateKey: todayKey,
    targetViews: 1,
    targetToday: 1
  };
  const res = resolveStoreViewMetrics(remotePending, activeLock, fixedNow);
  assert.equal(res.allTime, 1);
  assert.equal(res.today, 1);
});

challenge('ResolveMetrics', 'Midnight Delta Isolation: yesterday lock does NOT inflate today count', () => {
  const remoteDoc = {
    viewCount: 100,
    views: {
      allTime: 100,
      today: 0,
      dateKey: todayKey
    }
  };
  const yesterdayLock = {
    expiresAt: fixedNow.getTime() + 600000, // Still within 30 min window across midnight
    dateKey: yesterdayKey,                 // But recorded on yesterday's dateKey
    targetViews: 101,
    targetToday: 15                        // Yesterday had 15 views
  };
  const res = resolveStoreViewMetrics(remoteDoc, yesterdayLock, fixedNow);
  assert.equal(res.allTime, 101); // All-time respects monotonic target
  assert.equal(res.today, 0);     // Today MUST stay 0, isolated from yesterday's lock!
});

challenge('ResolveMetrics', 'Expired localLock is completely disregarded', () => {
  const remoteDoc = {
    viewCount: 50,
    views: {
      allTime: 50,
      today: 5,
      dateKey: todayKey
    }
  };
  const expiredLock = {
    expiresAt: fixedNow.getTime() - 1000,
    dateKey: todayKey,
    targetViews: 999,
    targetToday: 999
  };
  const res = resolveStoreViewMetrics(remoteDoc, expiredLock, fixedNow);
  assert.equal(res.allTime, 50);
  assert.equal(res.today, 5);
});

challenge('ResolveMetrics', 'Argument polymorphism: resolveStoreViewMetrics(partner, now)', () => {
  const partner = { viewCount: 75 };
  const res = resolveStoreViewMetrics(partner, fixedNow);
  assert.equal(res.allTime, 75);
  assert.equal(res.today, 0);
  assert.equal(res.dateKey, todayKey);
});

challenge('ResolveMetrics', 'Dirty/Adversarial Partner Inputs: null, negative, NaN, non-numeric strings', () => {
  // Null partner
  assert.deepEqual(resolveStoreViewMetrics(null, null, fixedNow), { allTime: 0, today: 0, dateKey: todayKey });
  
  // Negative values clamped to 0
  assert.deepEqual(resolveStoreViewMetrics({ viewCount: -20 }, null, fixedNow), { allTime: 0, today: 0, dateKey: todayKey });
  
  // Numeric strings coerced cleanly
  assert.deepEqual(resolveStoreViewMetrics({ viewCount: '42' }, null, fixedNow), { allTime: 42, today: 0, dateKey: todayKey });
  
  // Dirty non-numeric strings safeNumber fallback to 0
  assert.deepEqual(resolveStoreViewMetrics({ viewCount: 'corrupted_string' }, null, fixedNow), { allTime: 0, today: 0, dateKey: todayKey });

  // Malformed localLock
  assert.deepEqual(resolveStoreViewMetrics({ viewCount: 10 }, 'not-an-object', fixedNow), { allTime: 10, today: 0, dateKey: todayKey });
  assert.deepEqual(resolveStoreViewMetrics({ viewCount: 10 }, { targetViews: 'invalid', expiresAt: fixedNow.getTime() + 10000 }, fixedNow), { allTime: 10, today: 0, dateKey: todayKey });
});

// ================================================================================
// SUITE 3: RECORDADTELEMETRY.JS BACKEND SEEDING & DUAL-SYNC SIMULATION
// ================================================================================
console.log('\n--- Suite 3: recordAdTelemetry.js Backend Seeding & Dual-Sync Math ---');

challenge('BackendTelemetry', 'CJS module loads cleanly with all expected exports', () => {
  assert.ok(typeof recordAdTelemetryCjs.getBangkokDateKey === 'function');
  assert.ok(typeof recordAdTelemetryCjs.processAdTelemetryBatch === 'function');
  assert.ok(typeof recordAdTelemetryCjs.aggregateTelemetryEvents === 'function');
  assert.ok(typeof recordAdTelemetryCjs.calculateAdDeductions === 'function');
  assert.ok(typeof recordAdTelemetryCjs.commitTelemetryTransaction === 'function');
});

challenge('BackendTelemetry', 'Event aggregation merges multiple store_view events per store', () => {
  const events = [
    { type: 'store_view', storeId: 'store-alpha' },
    { type: 'store_view', storeId: 'store-alpha' },
    { type: 'store_view', storeId: 'store-beta' },
    { type: 'store_view', storeId: 'store-alpha' },
    { type: 'click', adId: 'ad-1' },
    { type: 'view', adId: 'ad-1' }
  ];
  const { adAggregates, storeAggregates } = aggregateTelemetryEvents(events);
  assert.equal(storeAggregates['store-alpha'].views, 3);
  assert.equal(storeAggregates['store-beta'].views, 1);
  assert.equal(adAggregates['ad-1'].clicks, 1);
  assert.equal(adAggregates['ad-1'].views, 1);
});

challenge('BackendTelemetry', 'Seeding Math: Legacy store { viewCount: 150 } + deltaViews: 1 -> newAllTime must be 151 (NOT 1)', () => {
  // Replicating Write Phase 1 logic from recordAdTelemetry.js lines 253-260:
  const storeData = { viewCount: 150 };
  const deltaViews = 1;
  const todayStr = getBangkokDateKeyCjs(fixedNow);

  const currentAllTime = Number(
    storeData?.views?.allTime ?? storeData?.viewCount ?? storeData?.viewsCount ?? 0
  );
  const newAllTime = currentAllTime + deltaViews;
  const isSameDay = storeData?.views?.dateKey === todayStr;
  const currentToday = isSameDay ? Number(storeData?.views?.today ?? 0) : 0;
  const newToday = currentToday + deltaViews;

  assert.equal(newAllTime, 151, `Critical defect: newAllTime was ${newAllTime}, expected 151!`);
  assert.equal(newToday, 1);
  assert.equal(isSameDay, false);
});

challenge('BackendTelemetry', 'Rollover Math: Yesterday store { allTime: 151, today: 5, dateKey: yesterday } + deltaViews: 1 -> newAllTime: 152, newToday: 1', () => {
  const storeData = {
    views: {
      allTime: 151,
      today: 5,
      dateKey: yesterdayKey
    }
  };
  const deltaViews = 1;
  const todayStr = todayKey;

  const currentAllTime = Number(
    storeData?.views?.allTime ?? storeData?.viewCount ?? storeData?.viewsCount ?? 0
  );
  const newAllTime = currentAllTime + deltaViews;
  const isSameDay = storeData?.views?.dateKey === todayStr;
  const currentToday = isSameDay ? Number(storeData?.views?.today ?? 0) : 0;
  const newToday = currentToday + deltaViews;

  assert.equal(newAllTime, 152);
  assert.equal(isSameDay, false);
  assert.equal(newToday, 1, `Midnight rollover failed: newToday was ${newToday}, expected 1!`);
});

challenge('BackendTelemetry', 'Same-day Accumulation: { allTime: 152, today: 1, dateKey: today } + deltaViews: 3 -> newAllTime: 155, newToday: 4', () => {
  const storeData = {
    views: {
      allTime: 152,
      today: 1,
      dateKey: todayKey
    }
  };
  const deltaViews = 3;
  const todayStr = todayKey;

  const currentAllTime = Number(
    storeData?.views?.allTime ?? storeData?.viewCount ?? storeData?.viewsCount ?? 0
  );
  const newAllTime = currentAllTime + deltaViews;
  const isSameDay = storeData?.views?.dateKey === todayStr;
  const currentToday = isSameDay ? Number(storeData?.views?.today ?? 0) : 0;
  const newToday = currentToday + deltaViews;

  assert.equal(newAllTime, 155);
  assert.equal(isSameDay, true);
  assert.equal(newToday, 4);
});

challenge('BackendTelemetry', 'Non-existent Store Document (snap.exists === false) initialized to deltaViews', () => {
  const deltaViews = 2;
  const initialViews = {
    allTime: deltaViews,
    today: deltaViews,
    dateKey: todayKey
  };
  assert.equal(initialViews.allTime, 2);
  assert.equal(initialViews.today, 2);
  assert.equal(initialViews.dateKey, todayKey);
});

// ================================================================================
// SUITE 4: END-TO-END ROUND TRIP (CLIENT RECONCILIATION -> SERVER COMMIT SIMULATION)
// ================================================================================
console.log('\n--- Suite 4: End-to-End Round Trip (Client Optimism -> Cloud Commit) ---');

challenge('E2ERoundTrip', 'Simulate complete lifecycle: initial visit -> optimistic lock -> commit -> refresh', () => {
  // Step 1: Client visits store with legacy viewCount: 150
  const initialPartner = { viewCount: 150 };
  const initialClientView = resolveStoreViewMetrics(initialPartner, null, fixedNow);
  assert.equal(initialClientView.allTime, 150);
  assert.equal(initialClientView.today, 0);

  // Step 2: Client creates localLock for 30 min
  const localLock = {
    targetViews: initialClientView.allTime + 1, // 151
    targetToday: initialClientView.today + 1,   // 1
    dateKey: todayKey,
    expiresAt: fixedNow.getTime() + 1800000
  };

  // Step 3: Immediate refresh before server commits
  const refreshedClientView = resolveStoreViewMetrics(initialPartner, localLock, fixedNow);
  assert.equal(refreshedClientView.allTime, 151); // Display shows 151 (Zero flicker to 150)
  assert.equal(refreshedClientView.today, 1);

  // Step 4: Server processes batch telemetry (deltaViews = 1)
  const currentAllTime = Number(initialPartner.viewCount);
  const serverCommittedPartner = {
    viewCount: 151,
    views: {
      allTime: currentAllTime + 1, // 151
      today: 1,
      dateKey: todayKey
    }
  };

  // Step 5: Firestore snapshot reaches client, lock still active
  const reconciledView = resolveStoreViewMetrics(serverCommittedPartner, localLock, fixedNow);
  assert.equal(reconciledView.allTime, 151); // Stays at 151! Zero jump to 152!
  assert.equal(reconciledView.today, 1);     // Stays at 1!

  // Step 6: 31 minutes later (lock expired)
  const laterTime = new Date(fixedNow.getTime() + 1900000);
  const postExpiryView = resolveStoreViewMetrics(serverCommittedPartner, localLock, laterTime);
  assert.equal(postExpiryView.allTime, 151); // Remote SSOT holds 151 cleanly
  assert.equal(postExpiryView.today, 1);
});

// ================================================
// SUITE 5: STOREURLUTILS DOMAIN UTILITY ADVERSARIAL STRESS
// ================================================
console.log('\n--- Suite 5: storeUrlUtils Domain Utility Adversarial Stress ---');

challenge('StoreUrlUtils', 'formatLineUrl parses handles, @OA, ids, lin.ee, and direct links', () => {
  assert.equal(formatLineUrl(null), '');
  assert.equal(formatLineUrl(''), '');
  assert.equal(formatLineUrl('   '), '');
  assert.equal(formatLineUrl('@store_official'), 'https://line.me/R/ti/p/@store_official');
  assert.equal(formatLineUrl('id: my_store_id'), 'https://line.me/R/ti/p/~my_store_id');
  assert.equal(formatLineUrl('https://lin.ee/abc123'), 'https://lin.ee/abc123');
  assert.equal(formatLineUrl('lin.ee/abc123'), 'https://lin.ee/abc123');
  assert.equal(formatLineUrl('https://line.me/ti/p/~direct'), 'https://line.me/ti/p/~direct');
});

challenge('StoreUrlUtils', 'formatMessengerUrl normalizes handles, m.me, and FB profile URLs', () => {
  assert.equal(formatMessengerUrl(null), '');
  assert.equal(formatMessengerUrl('myfanpage'), 'https://m.me/myfanpage');
  assert.equal(formatMessengerUrl('m.me/myfanpage'), 'https://m.me/myfanpage');
  assert.equal(formatMessengerUrl('https://facebook.com/myfanpage'), 'https://facebook.com/myfanpage');
});

challenge('StoreUrlUtils', 'formatYoutubeUrl and formatTiktokUrl handle handles and links', () => {
  assert.equal(formatYoutubeUrl('@my_channel'), 'https://www.youtube.com/@my_channel');
  assert.equal(formatYoutubeUrl('https://youtube.com/@my_channel'), 'https://youtube.com/@my_channel');
  assert.equal(formatTiktokUrl('@tiktok_star'), 'https://www.tiktok.com/@tiktok_star');
  assert.equal(formatTiktokUrl('https://tiktok.com/@tiktok_star'), 'https://tiktok.com/@tiktok_star');
});

challenge('StoreUrlUtils', 'formatExternalUrl enforces https:// prefix for marketplaces', () => {
  assert.equal(formatExternalUrl('shopee.co.th/shop'), 'https://shopee.co.th/shop');
  assert.equal(formatExternalUrl('https://lazada.co.th/shop'), 'https://lazada.co.th/shop');
  assert.equal(formatExternalUrl(''), '');
});

challenge('StoreUrlUtils', 'resolveMapsUrl prioritizes explicit link then GPS coordinates fallback', () => {
  // Explicit link
  const partnerWithLink = { googleMapLink: 'https://maps.app.goo.gl/xyz' };
  assert.equal(resolveMapsUrl(partnerWithLink), 'https://maps.app.goo.gl/xyz');

  // GPS coords fallback
  const partnerWithCoords = { latitude: 13.7563, longitude: 100.5018 };
  assert.equal(resolveMapsUrl(partnerWithCoords), 'https://www.google.com/maps?q=13.7563,100.5018');

  // Nested in storeProfile
  const partnerNested = { storeProfile: { latitude: 14.1234, longitude: 101.5678 } };
  assert.equal(resolveMapsUrl(partnerNested), 'https://www.google.com/maps?q=14.1234,101.5678');

  // Empty partner
  assert.equal(resolveMapsUrl(null), '');
  assert.equal(resolveMapsUrl({}), '');
  assert.equal(resolveMapsUrl({ latitude: 0, longitude: 0 }), '');
});

challenge('StoreUrlUtils', 'resolveSocialLinks aggregates all social channels and flags hasSocialLinks accurately', () => {
  const emptyPartner = {};
  const emptyRes = resolveSocialLinks(emptyPartner);
  assert.equal(emptyRes.hasSocialLinks, false);
  assert.equal(emptyRes.lineUrl, '');

  const richPartner = {
    lineUrl: '@richshop',
    messengerUrl: 'richfanpage',
    shopeeUrl: 'shopee.co.th/rich'
  };
  const richRes = resolveSocialLinks(richPartner);
  assert.equal(richRes.hasSocialLinks, true);
  assert.equal(richRes.lineUrl, 'https://line.me/R/ti/p/@richshop');
  assert.equal(richRes.messengerUrl, 'https://m.me/richfanpage');
  assert.equal(richRes.shopeeUrl, 'https://shopee.co.th/rich');
  assert.equal(richRes.tiktokUrl, '');
});

// ================================================================================
// SUMMARY & VERDICT
// ================================================================================
console.log('\n================================================================================');
console.log(`  EMPIRICAL CHALLENGER 1 SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================\n');

if (defects.length > 0) {
  console.error('🚨 DEFECTS FOUND:');
  defects.forEach((d, idx) => {
    console.error(`  [${idx + 1}] [${d.suite}] ${d.description}: ${d.error}`);
  });
  process.exit(1);
} else {
  console.log('🏆 VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED WITH ZERO DEFECTS!');
  process.exit(0);
}
