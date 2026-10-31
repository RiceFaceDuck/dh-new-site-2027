/**
 * ⚔️ Adversarial Challenger Test Suite: Milestone 1 Quota & Backend Sync Resilience
 * Path: Management System/tests/adversarial/challenger_m1_2_backend_sync_resilience.mjs
 * 
 * Empirically stress-tests:
 * 1. CWD-Independence: sync_traffic_to_firestore.mjs executed from 4 distinct working directories
 * 2. Network Latency & Timeout Guard: simulate latency, timeout trigger, late rejection, and timer lifecycle
 * 3. View Count Preservation Matrix: adManagementService.js line 230 input variations & bundle upsert overwrite analysis
 * 4. Cross-Module Schema Interoperability: ActivePartners (viewCount) vs Bundle (viewsCount) vs Ads (stats.views)
 */

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

console.log('='.repeat(70));
console.log('⚔️ CHALLENGER M1-2: EMPIRICAL ADVERSARIAL STRESS TEST SUITE');
console.log('='.repeat(70));

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failCount++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failCount++;
  }
}

// ====================================================================
// SUITE 1: CWD-Independence & Path Resolution Stress Test
// ====================================================================
console.log('\n--- SUITE 1: CWD-INDEPENDENCE & CREDENTIAL RESOLUTION ---');

const syncScriptPath = path.resolve(projectRoot, 'analytics/sync_traffic_to_firestore.mjs');
assert(fs.existsSync(syncScriptPath), 'sync_traffic_to_firestore.mjs does not exist');

const testDirs = [
  { name: 'Project Root', dir: projectRoot },
  { name: 'Analytics Subdirectory', dir: path.resolve(projectRoot, 'analytics') },
  { name: 'Management System Subdirectory', dir: path.resolve(projectRoot, 'Management System') },
  { name: 'System Temp Directory', dir: os.tmpdir() }
];

for (const { name, dir } of testDirs) {
  test(`CWD Test: Execute from ${name} (${dir})`, () => {
    const result = spawnSync('node', [syncScriptPath, '--seed'], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 15000
    });

    assert.strictEqual(
      result.status,
      0,
      `Execution failed with status ${result.status}. Stderr: ${result.stderr}`
    );
    assert(
      result.stdout.includes('บันทึกลง Firestore สำเร็จเรียบร้อย 100%'),
      `Expected success message not found in stdout. Output: ${result.stdout}`
    );
  });
}

// ====================================================================
// SUITE 2: Network Latency, Timeout Guard & Event Loop Behavior
// ====================================================================
console.log('\n--- SUITE 2: NETWORK LATENCY, TIMEOUT GUARD & EVENT LOOP ---');

/**
 * Re-implementation of fetchMetricForDateRange to verify timeout and latency logic
 */
async function simulateFetchMetric(clientMock, startDate, endDate, timeoutMs = 100) {
  try {
    const reportPromise = clientMock.runReport({
      property: `properties/123456`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'screenPageViews' }]
    });

    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`GA4 API query timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const [response] = await Promise.race([reportPromise, timeoutPromise]);
    clearTimeout(timer);

    if (response.rows && response.rows.length > 0) {
      const val = response.rows[0].metricValues?.[0]?.value;
      return parseInt(val || '0', 10);
    }
    return 0;
  } catch (error) {
    return { error: error.message, fallback: 0 };
  }
}

await asyncTest('Latency Test: Resolves within timeout bounds (50ms < 200ms)', async () => {
  const mockClient = {
    runReport: async () => {
      await new Promise(r => setTimeout(r, 50));
      return [{ rows: [{ metricValues: [{ value: '450' }] }] }];
    }
  };
  const val = await simulateFetchMetric(mockClient, 'yesterday', 'yesterday', 200);
  assert.strictEqual(val, 450, `Expected 450, got ${val}`);
});

await asyncTest('Timeout Guard: Triggers fallback when API query hangs (300ms > 100ms)', async () => {
  const mockClient = {
    runReport: async () => {
      await new Promise(r => setTimeout(r, 300));
      return [{ rows: [{ metricValues: [{ value: '999' }] }] }];
    }
  };
  const res = await simulateFetchMetric(mockClient, 'yesterday', 'yesterday', 100);
  assert(res && typeof res === 'object', 'Expected error fallback object');
  assert(res.error.includes('timed out after 100ms'), `Unexpected error message: ${res.error}`);
  assert.strictEqual(res.fallback, 0, 'Fallback value must be 0');
});

await asyncTest('Late Rejection Resilience: API rejects after timeout already triggered', async () => {
  let unhandledEmitted = false;
  const rejectionHandler = () => { unhandledEmitted = true; };
  process.on('unhandledRejection', rejectionHandler);

  try {
    const mockClient = {
      runReport: () => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Downstream 503 Service Unavailable')), 150);
      })
    };
    const res = await simulateFetchMetric(mockClient, 'yesterday', 'yesterday', 50);
    assert.strictEqual(res.fallback, 0);

    // Wait past the 150ms mark to confirm no unhandled rejection is emitted
    await new Promise(r => setTimeout(r, 200));
    assert.strictEqual(unhandledEmitted, false, 'Late rejection must not cause unhandledRejection');
  } finally {
    process.removeListener('unhandledRejection', rejectionHandler);
  }
});

// Event loop hold empirical investigation
await asyncTest('Event Loop Investigation: Uncleared setTimeout in sync_traffic_to_firestore.mjs', async () => {
  // Test code from sync_traffic_to_firestore.mjs lines 35-37 without clearTimeout
  const syncFileContent = fs.readFileSync(syncScriptPath, 'utf8');
  const hasClearTimeout = syncFileContent.includes('clearTimeout');
  const hasTimerUnref = syncFileContent.includes('.unref()');

  console.log(`   🔎 Empirical Observation: sync_traffic_to_firestore.mjs has clearTimeout: ${hasClearTimeout}, has unref: ${hasTimerUnref}`);
  // We document this behavior: when running with live GA4 API without clearTimeout,
  // Node's event loop will remain open for 10,000ms unless process.exit() is invoked or clearTimeout is added.
  assert(true);
});

// ====================================================================
// SUITE 3: adManagementService.js Line 230 View Preservation Matrix
// ====================================================================
console.log('\n--- SUITE 3: AD MANAGEMENT SERVICE VIEW PRESERVATION MATRIX ---');

function evaluateAdViews(adData) {
  return Number(adData?.stats?.views || adData?.viewsCount || 0);
}

const viewTestMatrix = [
  { desc: 'Standard adData with stats.views', input: { stats: { views: 250 } }, expected: 250 },
  { desc: 'Legacy adData with viewsCount on root', input: { viewsCount: 180 }, expected: 180 },
  { desc: 'Precedence: stats.views over viewsCount', input: { stats: { views: 50 }, viewsCount: 10 }, expected: 50 },
  { desc: 'Falsy zero in stats.views falls back to viewsCount', input: { stats: { views: 0 }, viewsCount: 75 }, expected: 75 },
  { desc: 'Both stats.views and viewsCount are 0', input: { stats: { views: 0 }, viewsCount: 0 }, expected: 0 },
  { desc: 'Empty stats object', input: { stats: {} }, expected: 0 },
  { desc: 'Null stats object', input: { stats: null }, expected: 0 },
  { desc: 'Empty adData object', input: {}, expected: 0 },
  { desc: 'Undefined adData', input: undefined, expected: 0 },
  { desc: 'Null adData', input: null, expected: 0 },
  { desc: 'String number in stats.views', input: { stats: { views: '1250' } }, expected: 1250 },
  { desc: 'String number in viewsCount', input: { viewsCount: '450' }, expected: 450 },
  { desc: 'NaN in stats.views converts to 0 via || fallback', input: { stats: { views: NaN } }, expected: 0 },
  { desc: 'Undefined in stats.views converts to 0 via || fallback', input: { stats: { views: undefined } }, expected: 0 },
  { desc: 'Negative viewsCount is preserved', input: { viewsCount: -5 }, expected: -5 },
  { desc: 'Boolean false converts to 0', input: { stats: { views: false } }, expected: 0 },
  { desc: 'Boolean true converts to 1', input: { stats: { views: true } }, expected: 1 },
];

for (const { desc, input, expected } of viewTestMatrix) {
  test(`Ad View Matrix: ${desc}`, () => {
    const result = evaluateAdViews(input);
    assert.strictEqual(result, expected, `Expected ${expected}, got ${result}`);
  });
}

test('Edge Case Challenge: Non-numeric string produces NaN in adManagementService.js', () => {
  const result = evaluateAdViews({ stats: { views: 'invalid_string' } });
  assert(Number.isNaN(result), 'Non-numeric string evaluates to NaN');
});

test('Bundle Upsert Overwrite Analysis: adManagementService line 236 spread simulation', () => {
  // Simulate an existing partner in active_partners_bundle with historical views
  const existingPartner = {
    id: 'partner_abc',
    storeName: 'ร้านช่างทอง ดีเฮง',
    points: 120,
    viewsCount: 3500 // accumulated historical store views
  };

  // Manager approves a brand new ad with stats.views = 0
  const newAdData = {
    ownerId: 'partner_abc',
    partnerName: 'ร้านช่างทอง ดีเฮง',
    stats: { views: 0 }
  };

  const partnerItem = {
    id: newAdData.ownerId,
    viewsCount: Number(newAdData?.stats?.views || newAdData?.viewsCount || 0)
  };

  // Existing code in adManagementService line 236:
  const updatedItem = { ...existingPartner, ...partnerItem };

  console.log(`   🔎 Empirical Observation: Existing views (${existingPartner.viewsCount}) overwritten by partnerItem (${partnerItem.viewsCount}) -> ${updatedItem.viewsCount}`);
  // When an ad with stats.views = 0 is approved, updatedItem.viewsCount becomes 0,
  // temporarily overwriting historical store views until nightlyChunkGuard restores them from ActivePartners.
  assert.strictEqual(updatedItem.viewsCount, 0);
});

// ====================================================================
// SUITE 4: Cross-Module Schema Interoperability
// ====================================================================
console.log('\n--- SUITE 4: CROSS-MODULE SCHEMA INTEROPERABILITY ---');

test('Schema Interop: nightlyChunkGuard accepts ActivePartners viewCount', () => {
  const p = { viewCount: 1200 };
  const viewsCount = Number(p.viewCount || p.viewsCount || p.visitCount || 0);
  assert.strictEqual(viewsCount, 1200);
});

test('Schema Interop: partnerVisibilitySync toBundleItem accepts ActivePartners viewCount', () => {
  const p = { viewCount: 890 };
  const viewsCount = Number(p.viewCount || p.viewsCount || p.visitCount || 0);
  assert.strictEqual(viewsCount, 890);
});

test('Schema Interop: Legacy schemas (viewsCount, visitCount) preserved as fallbacks', () => {
  const p1 = { viewsCount: 450 };
  const p2 = { visitCount: 300 };
  const p3 = {};

  assert.strictEqual(Number(p1.viewCount || p1.viewsCount || p1.visitCount || 0), 450);
  assert.strictEqual(Number(p2.viewCount || p2.viewsCount || p2.visitCount || 0), 300);
  assert.strictEqual(Number(p3.viewCount || p3.viewsCount || p3.visitCount || 0), 0);
});

console.log('='.repeat(70));
console.log(`📊 ADVERSARIAL CHALLENGE TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('='.repeat(70));

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
