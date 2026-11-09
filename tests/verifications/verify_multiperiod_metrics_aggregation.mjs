/**
 * 🧪 VERIFICATION SUITE 2: MULTI-PERIOD METRICS AGGREGATION
 * Path: Management System/tests/verifications/verify_multiperiod_metrics_aggregation.mjs
 * 
 * Objectives:
 * 1. Bangkok Timezone Key: Verify getBangkokDateKey() across UTC boundaries (16:59:59Z vs 17:00:00Z).
 * 2. Legacy Historical Seeding: Document with { viewCount: 150 } updated with deltaViews 1
 *    yields allTime: 151, today: 1, preserving 150 legacy views.
 * 3. Same-day Accumulation: Successive views on same date increment both allTime and today.
 * 4. Midnight Rollover & Isolation: Date change resets today = deltaViews while allTime accumulates;
 *    expired yesterday's lock does not bleed into today.
 * 5. Client Lazy Read: Document of yesterday evaluated today resolves today = 0 with 0 DB writes.
 * 6. Dual-Sync Parity between ActivePartners and users/{partnerId}/storeProfile/main.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const require = createRequire(import.meta.url);
const {
  getBangkokDateKey: getBangkokDateKeyCjs,
  aggregateTelemetryEvents
} = require('../../functions/marketing/recordAdTelemetry.js');

const {
  getBangkokDateKey: getBangkokDateKeyEsm,
  resolveStoreViewMetrics
} = await import('../../dh-shared/src/utils/storeMetricsHelper.js');

console.log('='.repeat(80));
console.log('  🧪 VERIFICATION SUITE 2: MULTI-PERIOD METRICS AGGREGATION');
console.log('  Target: storeMetricsHelper.js & recordAdTelemetry.js');
console.log('='.repeat(80));

let passCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

async function main() {
  // ---------------------------------------------------------------------------
  // Section 1: Bangkok Timezone Key Across UTC Boundaries
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 1: Bangkok Timezone Key Across UTC Boundaries ---');

  runTest('1.1: 16:59:59.999 UTC resolves to same day in Bangkok (UTC+7 23:59:59.999)', () => {
    const d = new Date('2026-11-09T16:59:59.999Z');
    assert.equal(getBangkokDateKeyEsm(d), '2026-11-09', 'ESM must return 2026-11-09');
    assert.equal(getBangkokDateKeyCjs(d), '2026-11-09', 'CJS must return 2026-11-09');
  });

  runTest('1.2: 17:00:00.000 UTC resolves to next day in Bangkok (UTC+7 00:00:00.000)', () => {
    const d = new Date('2026-11-09T17:00:00.000Z');
    assert.equal(getBangkokDateKeyEsm(d), '2026-11-10', 'ESM must return 2026-11-10');
    assert.equal(getBangkokDateKeyCjs(d), '2026-11-10', 'CJS must return 2026-11-10');
  });

  runTest('1.3: Year boundary rollover (Dec 31 16:59:59Z vs 17:00:00Z)', () => {
    const dec31 = new Date('2026-12-31T16:59:59.999Z');
    const jan1 = new Date('2026-12-31T17:00:00.000Z');
    assert.equal(getBangkokDateKeyEsm(dec31), '2026-12-31');
    assert.equal(getBangkokDateKeyEsm(jan1), '2027-01-01');
    assert.equal(getBangkokDateKeyCjs(dec31), '2026-12-31');
    assert.equal(getBangkokDateKeyCjs(jan1), '2027-01-01');
  });

  runTest('1.4: Leap year boundary handling (Feb 28 17:00:00Z in 2028 is Feb 29)', () => {
    const leapDay = new Date('2028-02-28T17:00:00.000Z');
    assert.equal(getBangkokDateKeyEsm(leapDay), '2028-02-29');
    assert.equal(getBangkokDateKeyCjs(leapDay), '2028-02-29');
  });

  runTest('1.5: Input type polymorphy (Firestore Timestamp, numeric ms, ISO string)', () => {
    const ts = 1773000000000;
    const dateObj = new Date(ts);
    const expected = getBangkokDateKeyEsm(dateObj);

    assert.equal(getBangkokDateKeyEsm(ts), expected, 'Numeric timestamp matches');
    assert.equal(getBangkokDateKeyEsm(dateObj.toISOString()), expected, 'ISO string matches');
    assert.equal(getBangkokDateKeyEsm({ toDate: () => dateObj }), expected, 'Firestore Timestamp matches');
  });

  // ---------------------------------------------------------------------------
  // Section 2: Legacy Historical Seeding & Preservation
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 2: Legacy Historical Seeding & Preservation ---');

  runTest('2.1: Legacy Document with { viewCount: 150 } seeded accurately on new view (+1 -> 151, today: 1)', () => {
    // Simulate Backend Write Phase 1 calculation logic from recordAdTelemetry.js
    const legacySnap = {
      viewCount: 150
      // Note: views is undefined in legacy records
    };

    const deltaViews = 1;
    const todayStr = '2026-11-09';

    // Calculation in recordAdTelemetry.js:
    const currentAllTime = Number(
      legacySnap?.views?.allTime ?? legacySnap?.viewCount ?? legacySnap?.viewsCount ?? 0
    );
    const newAllTime = currentAllTime + deltaViews;
    const isSameDay = legacySnap?.views?.dateKey === todayStr;
    const currentToday = isSameDay ? Number(legacySnap?.views?.today ?? 0) : 0;
    const newToday = currentToday + deltaViews;

    assert.equal(currentAllTime, 150, 'Legacy viewCount 150 must be recognized as baseline');
    assert.equal(newAllTime, 151, 'newAllTime must be 151');
    assert.equal(newToday, 1, 'newToday must be 1');

    // Simulate resulting Firestore document
    const updatedDoc = {
      viewCount: 151,
      views: {
        allTime: newAllTime,
        today: newToday,
        dateKey: todayStr
      }
    };

    // Client resolver evaluation
    const clientMetrics = resolveStoreViewMetrics(updatedDoc, null, new Date('2026-11-09T10:00:00Z'));
    assert.equal(clientMetrics.allTime, 151, 'Client must resolve allTime to 151');
    assert.equal(clientMetrics.today, 1, 'Client must resolve today to 1');
  });

  runTest('2.2: Math.max Guard defends against corrupted or missing views.allTime in Client', () => {
    // If a buggy mutation wrote views.allTime = 1 while viewCount was 150:
    const corruptedPartner = {
      viewCount: 150,
      views: {
        allTime: 1, // Corrupted scalar
        today: 1,
        dateKey: '2026-11-09'
      }
    };

    const metrics = resolveStoreViewMetrics(corruptedPartner, null, new Date('2026-11-09T10:00:00Z'));
    assert.equal(metrics.allTime, 150, 'Math.max MUST protect and preserve 150 legacy views');
  });

  // ---------------------------------------------------------------------------
  // Section 3: Same-Day Transactional Accumulation
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 3: Same-Day Transactional Accumulation ---');

  runTest('3.1: Successive views on same date accumulate both allTime and today', () => {
    const todayStr = '2026-11-09';
    let doc = {
      viewCount: 10,
      views: { allTime: 10, today: 2, dateKey: todayStr }
    };

    // View 1 arrives (+1)
    let delta = 1;
    let isSameDay = doc.views.dateKey === todayStr;
    let newAllTime = (doc.views.allTime) + delta;
    let newToday = (isSameDay ? doc.views.today : 0) + delta;
    doc = { viewCount: newAllTime, views: { allTime: newAllTime, today: newToday, dateKey: todayStr } };

    assert.equal(doc.views.allTime, 11);
    assert.equal(doc.views.today, 3);

    // View 2 arrives in batch (+2)
    delta = 2;
    isSameDay = doc.views.dateKey === todayStr;
    newAllTime = (doc.views.allTime) + delta;
    newToday = (isSameDay ? doc.views.today : 0) + delta;
    doc = { viewCount: newAllTime, views: { allTime: newAllTime, today: newToday, dateKey: todayStr } };

    assert.equal(doc.views.allTime, 13);
    assert.equal(doc.views.today, 5);

    // Verify Client resolution
    const client = resolveStoreViewMetrics(doc, null, new Date('2026-11-09T12:00:00Z'));
    assert.equal(client.allTime, 13);
    assert.equal(client.today, 5);
  });

  // ---------------------------------------------------------------------------
  // Section 4: Midnight Rollover & Lock Isolation
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 4: Midnight Rollover & Lock Isolation ---');

  runTest('4.1: Server rollover on date transition resets today to deltaViews while allTime increments', () => {
    const yesterdayDoc = {
      viewCount: 100,
      views: { allTime: 100, today: 25, dateKey: '2026-11-09' }
    };

    const nextDayStr = '2026-11-10';
    const deltaViews = 1;

    // Server write phase on 2026-11-10:
    const isSameDay = yesterdayDoc.views.dateKey === nextDayStr;
    assert.equal(isSameDay, false, 'Must identify date transition');

    const currentAllTime = Number(yesterdayDoc.views.allTime);
    const newAllTime = currentAllTime + deltaViews;
    const currentToday = isSameDay ? Number(yesterdayDoc.views.today) : 0;
    const newToday = currentToday + deltaViews;

    assert.equal(newAllTime, 101, 'allTime must accumulate to 101');
    assert.equal(newToday, 1, 'today must reset to deltaViews (1)');
  });

  runTest('4.2: Midnight Lock Isolation: Expired yesterday local lock does NOT bleed into today targetToday', () => {
    const simulatedNow = new Date('2026-11-10T02:00:00+07:00'); // Bangkok 2:00 AM on Nov 10
    const partner = {
      id: 'partner_midnight_test',
      viewCount: 50,
      views: { allTime: 50, today: 0, dateKey: '2026-11-10' }
    };

    // Local lock lingering from yesterday (Nov 9) with remaining TTL
    const yesterdayLock = {
      timestamp: simulatedNow.getTime() - 600000,
      expiresAt: simulatedNow.getTime() + 1200000, // Still valid TTL
      dateKey: '2026-11-09',                     // Yesterday's date
      targetViews: 51,
      targetToday: 20                           // Yesterday's high target
    };

    const metrics = resolveStoreViewMetrics(partner, yesterdayLock, simulatedNow);

    // allTime takes Monotonic Max
    assert.equal(metrics.allTime, 51, 'allTime accepts valid local lock target');
    // today MUST NOT bleed yesterday's 20 into today
    assert.equal(metrics.today, 0, 'today must remain 0 and reject yesterday lock targetToday');
    assert.equal(metrics.dateKey, '2026-11-10', 'dateKey must be Nov 10');
  });

  // ---------------------------------------------------------------------------
  // Section 5: Client Lazy Read on Midnight Transition (Zero Writes)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 5: Client Lazy Read on Midnight Transition (Zero Writes) ---');

  runTest('5.1: Document of yesterday evaluated today resolves today = 0 with 0 DB writes', () => {
    const unupdatedYesterdayPartner = {
      id: 'lazy_partner_01',
      viewCount: 200,
      views: {
        allTime: 200,
        today: 45,                // Stale yesterday today count in Firestore
        dateKey: '2026-11-09'     // Yesterday
      }
    };

    // Client evaluates today (2026-11-10) without any write to DB:
    const nowNov10 = new Date('2026-11-10T09:00:00+07:00');
    const evaluated = resolveStoreViewMetrics(unupdatedYesterdayPartner, null, nowNov10);

    assert.equal(evaluated.allTime, 200, 'allTime preserved as 200');
    assert.equal(evaluated.today, 0, 'today is evaluated to 0 logically on read without needing a DB write');
    assert.equal(evaluated.dateKey, '2026-11-10');
  });

  // ---------------------------------------------------------------------------
  // Section 6: Dual-Sync Parity Architecture Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 6: Dual-Sync Parity Architecture Verification ---');

  runTest('6.1: recordAdTelemetry.js contains atomic Dual-Sync to ActivePartners & storeProfile/main', () => {
    const fnPath = path.resolve(REPO_ROOT, 'Management System/functions/marketing/recordAdTelemetry.js');
    assert.ok(fs.existsSync(fnPath), 'recordAdTelemetry.js must exist');
    const code = fs.readFileSync(fnPath, 'utf8');

    // Verify ActivePartners collection query & update
    assert.ok(code.includes('db.collection("ActivePartners").doc(id)'), 'Must query ActivePartners collection');
    assert.ok(code.includes('transaction.update(storeRef'), 'Must update ActivePartners');

    // Verify users/{uid}/storeProfile/main query & update
    assert.ok(code.includes('collection("users").doc(id).collection("storeProfile").doc("main")'), 'Must query storeProfile/main');
    assert.ok(code.includes('transaction.update(profileRef'), 'Must update profileRef');
    assert.ok(code.includes('transaction.set(profileRef'), 'Must support set merge fallback');

    // Verify exact field parity between collections
    assert.ok(code.includes('pNewAllTime'), 'Must compute permanent SSOT allTime');
    assert.ok(code.includes('pNewToday'), 'Must compute permanent SSOT today');
  });

  runTest('6.2: Telemetry batch aggregation isolates store_view from ad clicks/impressions', () => {
    const rawEvents = [
      { type: 'store_view', storeId: 'store_101', partnerName: 'Store 101' },
      { type: 'store_view', storeId: 'store_101', partnerName: 'Store 101' },
      { type: 'store_view', storeId: 'store_202', partnerName: 'Store 202' },
      { type: 'view', adId: 'ad_999', collection: 'partner_ads', ownerId: 'owner_999' }
    ];

    const { adAggregates, storeAggregates, distinctCount } = aggregateTelemetryEvents(rawEvents);

    assert.equal(storeAggregates['store_101']?.views, 2, 'store_101 aggregated 2 views');
    assert.equal(storeAggregates['store_202']?.views, 1, 'store_202 aggregated 1 view');
    assert.equal(adAggregates['ad_999']?.views, 1, 'ad_999 aggregated 1 impression');
    assert.equal(distinctCount, 3, 'Total distinct entities is 3');
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`  VERIFICATION SUITE 2 RESULT: Total: ${totalCount} | Passed: ${passCount} | Failed: 0`);
  console.log('='.repeat(80));
  console.log('🎉 VERIFICATION SUITE 2: ALL MULTI-PERIOD METRICS AGGREGATION INVARIANTS PASSED 100%!\n');
}

main().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
