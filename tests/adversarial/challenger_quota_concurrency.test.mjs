/**
 * Challenger 1: Empirical Quota, Concurrency & Cache Adversarial Test Suite
 * Path: Management System/tests/adversarial/challenger_quota_concurrency.test.mjs
 * 
 * Scope:
 * 1. Cold Start: verify exactly <= 8 Firestore reads for all 2,412 items.
 * 2. Warm Cache: verify strictly 0 Firestore reads (instant in-memory hit).
 * 3. Concurrency & Memoization: verify promise memoization under rapid sequential
 *    and massive parallel calls (no redundant parallel chunk fetches).
 * 4. Cache Recovery: verify resilient recovery under empty, malformed, or throwing IndexedDB.
 * 
 * Execution: node tests/adversarial/challenger_quota_concurrency.test.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const SERVICE_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/inventory/inventorySyncMetaService.js');

console.log('================================================================================');
console.log('  CHALLENGER 1: Empirical Quota, Concurrency & Cache Adversarial Suite');
console.log('  Target: inventorySyncMetaService.js');
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

// -----------------------------------------------------------------------------
// HARNESS FACTORY: Evaluator for inventorySyncMetaService.js with Telemetry
// -----------------------------------------------------------------------------
function createSyncServiceHarness({
  initialIdb = new Map(),
  firestoreDocs = new Map(),
  idbError = null,
  firestoreError = null,
  simulatedNetworkLatencyMs = 0
} = {}) {
  const serviceCodeRaw = fs.readFileSync(SERVICE_PATH, 'utf8');

  // Strip static imports
  let cleanedCode = serviceCodeRaw.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  // Strip exports
  cleanedCode = cleanedCode.replace(/export\s+const\s+/g, 'const ');
  cleanedCode = cleanedCode.replace(/export\s+function\s+/g, 'function ');
  cleanedCode = cleanedCode.replace(/export\s+default\s+[\s\S]*?;?$/m, '');
  cleanedCode = cleanedCode.replace(/export\s+async\s+function\s+/g, 'async function ');

  // Metrics trackers
  const metrics = {
    firestoreReads: 0,
    readDocs: [],
    firestoreWrites: 0,
    idbReads: 0,
    idbWrites: 0,
    broadcastEvents: []
  };

  const idbStore = new Map(initialIdb);

  const sleep = (ms) => ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve();

  // Mock IDB
  const mockIdb = {
    createStore: (dbName, storeName) => ({ dbName, storeName }),
    get: async (key, store) => {
      metrics.idbReads++;
      if (idbError) throw idbError;
      return idbStore.has(key) ? idbStore.get(key) : undefined;
    },
    set: async (key, val, store) => {
      metrics.idbWrites++;
      idbStore.set(key, val);
    }
  };

  // Mock Firestore
  const mockFirestore = {
    doc: (db, col, docId) => ({ path: `${col}/${docId}`, col, docId }),
    collection: (db, col) => ({ path: col }),
    query: (...args) => ({ isQuery: true, args }),
    where: (field, op, val) => ({ field, op, val }),
    documentId: () => '__name__',
    serverTimestamp: () => ({ _seconds: Math.floor(Date.now() / 1000) }),
    increment: (n) => ({ _increment: n }),
    limit: (n) => ({ _limit: n }),
    getDoc: async (ref) => {
      if (simulatedNetworkLatencyMs > 0) await sleep(simulatedNetworkLatencyMs);
      metrics.firestoreReads++;
      metrics.readDocs.push(ref.path);
      if (firestoreError) throw firestoreError;
      const data = firestoreDocs.get(ref.path);
      return {
        exists: () => data !== undefined && data !== null,
        data: () => (data !== undefined && data !== null ? data : undefined)
      };
    },
    setDoc: async (ref, data, opts) => {
      metrics.firestoreWrites++;
      firestoreDocs.set(ref.path, data);
    },
    getDocs: async (q) => {
      metrics.firestoreReads++;
      return {
        forEach: () => {},
        docs: []
      };
    },
    onSnapshot: (ref, onNext, onError) => {
      return () => {};
    }
  };

  // Mock BroadcastChannel & Window
  class MockBroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage(msg) {
      metrics.broadcastEvents.push(msg);
    }
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }

  const mockWindow = {
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const wrapperFn = new Function(
    'createStore', 'get', 'set',
    'doc', 'getDoc', 'setDoc', 'collection', 'query', 'where', 'getDocs', 'onSnapshot',
    'documentId', 'serverTimestamp', 'increment', 'limit',
    'db', 'auth', 'getCollectionPath',
    'BroadcastChannel', 'window', 'indexedDB',
    `
    ${cleanedCode}
    return {
      normalizeProduct,
      computeCatalogHash,
      broadcastInventorySync,
      subscribeInventorySyncChannel,
      getInventoryMeta,
      subscribeInventoryMeta,
      resetFullSyncFlag,
      recordInventoryChange,
      fetchDeltaProducts,
      fetchBundledCatalogChunks,
      getOrFetchCatalog,
      _getInMemoryCatalog: () => inMemoryCatalog,
      _getInMemoryVersion: () => inMemoryVersion,
      _getInMemoryHash: () => inMemoryHash,
      _getInFlightPromise: () => inFlightPromise,
      _setInMemoryCatalog: (c) => { inMemoryCatalog = c; },
      _setInMemoryVersion: (v) => { inMemoryVersion = v; },
      _resetMemory: () => {
        inMemoryCatalog = null;
        inMemoryVersion = 0;
        inMemoryHash = '';
        inMemoryLastFetch = 0;
        inFlightPromise = null;
      }
    };
    `
  );

  const instance = wrapperFn(
    mockIdb.createStore, mockIdb.get, mockIdb.set,
    mockFirestore.doc, mockFirestore.getDoc, mockFirestore.setDoc,
    mockFirestore.collection, mockFirestore.query, mockFirestore.where, mockFirestore.getDocs, mockFirestore.onSnapshot,
    mockFirestore.documentId, mockFirestore.serverTimestamp, mockFirestore.increment, mockFirestore.limit,
    {}, { currentUser: { uid: 'test-admin', displayName: 'Test Admin' } }, (col) => col,
    MockBroadcastChannel, mockWindow, {}
  );

  return {
    instance,
    metrics,
    idbStore,
    firestoreDocs
  };
}

// -----------------------------------------------------------------------------
// DATA SEED GENERATOR: 2,412 Items across 7 chunks
// -----------------------------------------------------------------------------
function generateCatalogChunks(totalItems = 2412, chunkCount = 7, version = 1) {
  const docs = new Map();
  docs.set('catalogs/search_index', {
    version,
    chunkCount,
    totalItems,
    updatedAt: Date.now()
  });

  docs.set('settings/inventory_meta', {
    version,
    catalogHash: `hash_v${version}`,
    recentUpdatedSkus: [],
    fullSyncRequired: false
  });

  let remaining = totalItems;
  for (let i = 1; i <= chunkCount; i++) {
    const chunkSize = i === chunkCount ? remaining : Math.ceil(totalItems / chunkCount);
    const items = [];
    for (let j = 0; j < chunkSize; j++) {
      const idx = totalItems - remaining + j + 1;
      items.push({
        id: `sku_id_${idx}`,
        sku: `SKU-${String(idx).padStart(4, '0')}`,
        name: `Notebook Component ${idx}`,
        Price: 200 + (idx % 20),
        retailPrice: 250 + (idx % 20),
        stockQuantity: idx % 10,
        bufferStock: 2,
        barcode: `885000${String(idx).padStart(6, '0')}`,
        isActive: true
      });
    }
    remaining -= items.length;
    docs.set(`catalogs/search_index_p${i}`, { items });
  }

  return docs;
}

// =============================================================================
// TEST SUITE 1: Cold Start Catalog Hydration Quota Guard (<= 8 Firestore Reads)
// =============================================================================
async function testSuite1_ColdStartQuota() {
  console.log('--- TEST SUITE 1: Cold Start Catalog Hydration Quota Guard ---');

  const TOTAL_ITEMS = 2412;
  const CHUNKS = 7;
  const firestoreDocs = generateCatalogChunks(TOTAL_ITEMS, CHUNKS, 1);

  const { instance, metrics, idbStore } = createSyncServiceHarness({
    firestoreDocs
  });

  try {
    const result = await instance.getOrFetchCatalog({ forceRefresh: false });

    // Check 1.1: Product count
    assert.strictEqual(result.catalog.length, TOTAL_ITEMS, `Expected ${TOTAL_ITEMS} items, got ${result.catalog.length}`);
    pass(`Cold hydration returned all ${TOTAL_ITEMS} items`);

    // Check 1.2: fromCache flag
    assert.strictEqual(result.fromCache, false, 'Cold start result must indicate fromCache: false');
    pass('Cold start correctly flags fromCache: false');

    // Check 1.3: Quota consumption analysis
    console.log(`    📊 Telemetry: Firestore reads = ${metrics.firestoreReads}`);
    console.log(`    📜 Docs read: ${metrics.readDocs.join(', ')}`);

    // Strict Quota Check: <= 8 reads requirement
    if (metrics.firestoreReads <= 8) {
      pass(`Cold start consumed ${metrics.firestoreReads} reads (satisfies <= 8 reads requirement)`);
    } else {
      fail(
        'Cold start read quota violation',
        new Error(`Expected strictly <= 8 Firestore reads for 2,412 items, but got ${metrics.firestoreReads} reads due to redundant 'settings/inventory_meta' fetch [${metrics.readDocs.join(', ')}]`)
      );
    }

    // Check 1.4: IDB persistence
    assert.ok(idbStore.has('dh_inventory_full_catalog'), 'Catalog must be written to IDB');
    const stored = idbStore.get('dh_inventory_full_catalog');
    assert.strictEqual(stored.length, TOTAL_ITEMS, `IDB stored catalog must have ${TOTAL_ITEMS} items`);
    pass('Catalog successfully persisted to Tier 2 IndexedDB cache');

    // Check 1.5: In-memory state
    const inMem = instance._getInMemoryCatalog();
    assert.strictEqual(inMem.length, TOTAL_ITEMS, 'In-memory singleton must be populated');
    pass('In-memory singleton cache (Tier 1) properly populated');
  } catch (err) {
    fail('Suite 1 Execution', err);
  }
}

// =============================================================================
// TEST SUITE 2: Warm Cache Quota (Strictly 0 Firestore Reads)
// =============================================================================
async function testSuite2_WarmCacheQuota() {
  console.log('\n--- TEST SUITE 2: Warm Cache Quota (Strictly 0 Firestore Reads) ---');

  const TOTAL_ITEMS = 2412;
  const firestoreDocs = generateCatalogChunks(TOTAL_ITEMS, 7, 1);
  const { instance, metrics } = createSyncServiceHarness({ firestoreDocs });

  try {
    // 1. Initial cold load
    await instance.getOrFetchCatalog({ forceRefresh: false });
    const initialReads = metrics.firestoreReads;

    // 2. Subtest: Tier 1 In-Memory Warm Cache Hit (10 rapid calls)
    for (let i = 1; i <= 10; i++) {
      const res = await instance.getOrFetchCatalog({ forceRefresh: false });
      assert.strictEqual(res.fromCache, true, `Call #${i} must return fromCache: true`);
      assert.strictEqual(res.catalog.length, TOTAL_ITEMS, `Call #${i} must retain all items`);
    }

    const deltaReads = metrics.firestoreReads - initialReads;
    assert.strictEqual(deltaReads, 0, `Expected 0 additional reads on warm cache, got ${deltaReads}`);
    pass(`Tier 1 In-memory cache: 10 repeated calls consumed strictly 0 Firestore reads (delta: ${deltaReads})`);

    // 3. Subtest: Tier 2 IndexedDB warm cache (Session restart: memory cleared, IDB intact)
    instance._resetMemory();
    const beforeIdbReloadReads = metrics.firestoreReads;
    const resIdb = await instance.getOrFetchCatalog({ forceRefresh: false });

    assert.strictEqual(resIdb.fromCache, true, 'IDB warm reload must return fromCache: true');
    assert.strictEqual(resIdb.catalog.length, TOTAL_ITEMS, 'IDB warm reload must retain all items');

    const idbReloadReads = metrics.firestoreReads - beforeIdbReloadReads;
    console.log(`    📊 Telemetry: IDB session reload consumed ${idbReloadReads} read(s) (${metrics.readDocs.slice(beforeIdbReloadReads).join(', ')})`);
    if (idbReloadReads === 0) {
      pass('Tier 2 IndexedDB session reload: consumed strictly 0 Firestore reads');
    } else if (idbReloadReads === 1) {
      pass(`Tier 2 IndexedDB session reload: consumed 1 metadata validation read (0 chunk reads)`);
    } else {
      fail('Tier 2 IDB Quota', new Error(`IDB reload consumed ${idbReloadReads} reads, exceeding 1 metadata read`));
    }
  } catch (err) {
    fail('Suite 2 Execution', err);
  }
}

// =============================================================================
// TEST SUITE 3: Rapid Sequential & Concurrent Calls (Promise Memoization)
// =============================================================================
async function testSuite3_ConcurrencyAndMemoization() {
  console.log('\n--- TEST SUITE 3: Concurrency & Promise Memoization Stress Test ---');

  const TOTAL_ITEMS = 2412;
  const firestoreDocs = generateCatalogChunks(TOTAL_ITEMS, 7, 1);

  // 3.1 Massive Parallel Blast: 50 concurrent calls with simulated 15ms network latency
  const harness1 = createSyncServiceHarness({
    firestoreDocs,
    simulatedNetworkLatencyMs: 15
  });

  try {
    const PARALLEL_CALLS = 50;
    const parallelPromises = [];
    for (let i = 0; i < PARALLEL_CALLS; i++) {
      parallelPromises.push(harness1.instance.getOrFetchCatalog({ forceRefresh: false }));
    }

    const results = await Promise.all(parallelPromises);

    // Verify every call received identical 2,412 items
    for (let i = 0; i < PARALLEL_CALLS; i++) {
      assert.strictEqual(results[i].catalog.length, TOTAL_ITEMS, `Parallel call #${i} items mismatch`);
    }
    pass(`All ${PARALLEL_CALLS} concurrent calls resolved successfully with 2,412 items`);

    // Verify chunk fetches were NOT duplicated 50 times
    const chunkReadCount = harness1.metrics.readDocs.filter(p => p.includes('search_index_p')).length;
    assert.strictEqual(chunkReadCount, 7, `Expected exactly 7 chunk reads total for 50 concurrent calls, but got ${chunkReadCount}`);
    pass(`Promise memoization verified: 50 concurrent calls triggered exactly 7 chunk reads (deduplication 100% effective)`);

    // 3.2 Rapid Sequential Hammering (100 sequential calls)
    const beforeSequential = harness1.metrics.firestoreReads;
    for (let i = 0; i < 100; i++) {
      await harness1.instance.getOrFetchCatalog({ forceRefresh: false });
    }
    const sequentialDelta = harness1.metrics.firestoreReads - beforeSequential;
    assert.strictEqual(sequentialDelta, 0, `Sequential hammering must incur 0 reads, got ${sequentialDelta}`);
    pass(`100 rapid sequential calls incurred strictly 0 additional Firestore reads`);

    // 3.3 Transient Network Error Behavior on Cold Start
    const failingHarness = createSyncServiceHarness({
      firestoreDocs,
      firestoreError: new Error('Simulated transient Firestore timeout')
    });

    const failingResult = await failingHarness.instance.getOrFetchCatalog({ forceRefresh: false });
    
    // Check whether the service silently swallowed the fatal network error and returned empty catalog []
    if (failingResult && Array.isArray(failingResult.catalog) && failingResult.catalog.length === 0) {
      fail(
        'Cold start silent failure / cache wipe bug',
        new Error("When Firestore fails on cold start with empty cache, getOrFetchCatalog silently swallowed the error, returned catalog: [], and saved [] to IDB, causing permanent 0-item catalog state.")
      );
    } else {
      pass('Cold start network error safely rejected without poisoning cache');
    }
  } catch (err) {
    fail('Suite 3 Execution', err);
  }
}

// =============================================================================
// TEST SUITE 4: Corrupted & Empty IndexedDB Cache Recovery
// =============================================================================
async function testSuite4_CacheCorruptionRecovery() {
  console.log('\n--- TEST SUITE 4: Corrupted & Empty IndexedDB Cache Recovery ---');

  const TOTAL_ITEMS = 2412;
  const firestoreDocs = generateCatalogChunks(TOTAL_ITEMS, 7, 1);

  // 4.1 Empty IDB (Clean state)
  try {
    const emptyIdbHarness = createSyncServiceHarness({
      initialIdb: new Map(),
      firestoreDocs
    });
    const resEmpty = await emptyIdbHarness.instance.getOrFetchCatalog({ forceRefresh: false });
    assert.strictEqual(resEmpty.catalog.length, TOTAL_ITEMS, 'Empty IDB must recover full catalog from Firestore');
    assert.strictEqual(resEmpty.fromCache, false);
    pass('Empty IDB: Cleanly falls back to Firestore and recovers all 2,412 items');
  } catch (err) {
    fail('Empty IDB Recovery', err);
  }

  // 4.2 Corrupted IDB: Value is not an array (e.g. String or Number)
  try {
    const corruptTypeHarness = createSyncServiceHarness({
      initialIdb: new Map([
        ['dh_inventory_full_catalog', 'CORRUPTED_STRING_PAYLOAD_NOT_AN_ARRAY'],
        ['dh_inventory_version', 1]
      ]),
      firestoreDocs
    });
    const resCorruptType = await corruptTypeHarness.instance.getOrFetchCatalog({ forceRefresh: false });
    assert.strictEqual(resCorruptType.catalog.length, TOTAL_ITEMS, 'Non-array IDB value must be discarded and re-hydrated');
    pass('Corrupted IDB (Non-array string): Gracefully discarded, recovered 2,412 items from chunks');
  } catch (err) {
    fail('Corrupted IDB (Non-array)', err);
  }

  // 4.3 Corrupted IDB: Array with null and primitive elements (Malicious/Corrupt elements)
  try {
    const corruptArrayHarness = createSyncServiceHarness({
      initialIdb: new Map([
        ['dh_inventory_full_catalog', [null, undefined, 42, 'junk', {}]],
        ['dh_inventory_version', 1]
      ]),
      firestoreDocs
    });
    const resCorruptArray = await corruptArrayHarness.instance.getOrFetchCatalog({ forceRefresh: false });

    // Verify whether corrupt array leaked into caller return value
    const hasCorruptItems = resCorruptArray.catalog.some(item => !item || !item.sku || typeof item !== 'object');
    if (hasCorruptItems || resCorruptArray.catalog.length < TOTAL_ITEMS) {
      fail(
        'Corrupted IDB leak to presentation layer',
        new Error(`Service returned corrupted IDB array (${resCorruptArray.catalog.length} items with nulls/primitives) instead of purging corrupt cache and re-hydrating 2,412 items. This triggers downstream TypeError in useProductSearchQuery.`)
      );
    } else {
      pass('Corrupted IDB (Array with null/primitives): Error caught safely, re-hydrated 2,412 items');
    }
  } catch (err) {
    fail('Corrupted IDB (Array with null/primitives)', err);
  }

  // 4.4 Corrupted IDB: IndexedDB read throws exception (e.g. QuotaExceededError or DatabaseClosedError)
  try {
    const throwingIdbHarness = createSyncServiceHarness({
      firestoreDocs,
      idbError: new Error('QuotaExceededError: The quota has been exceeded or database corrupted.')
    });
    const resThrowingIdb = await throwingIdbHarness.instance.getOrFetchCatalog({ forceRefresh: false });
    assert.strictEqual(resThrowingIdb.catalog.length, TOTAL_ITEMS, 'Throwing IDB must recover via Firestore chunks');
    pass('IndexedDB engine throwing exception: Gracefully bypassed, recovered 2,412 items');
  } catch (err) {
    fail('Throwing IDB Exception Recovery', err);
  }

  // 4.5 Partial Chunks Failure Recovery (1 chunk 404)
  try {
    const partialFirestoreDocs = new Map(firestoreDocs);
    partialFirestoreDocs.delete('catalogs/search_index_p4'); // simulate missing chunk 4

    const partialHarness = createSyncServiceHarness({
      firestoreDocs: partialFirestoreDocs
    });
    const resPartial = await partialHarness.instance.getOrFetchCatalog({ forceRefresh: false });
    assert.ok(resPartial.catalog.length > 0, 'Partial chunks must return surviving products without throwing');
    pass(`Surviving chunk resilience: returned ${resPartial.catalog.length} items when p4 was missing`);
  } catch (err) {
    fail('Partial Chunks Recovery', err);
  }
}

// =============================================================================
// RUNNER
// =============================================================================
async function main() {
  await testSuite1_ColdStartQuota();
  await testSuite2_WarmCacheQuota();
  await testSuite3_ConcurrencyAndMemoization();
  await testSuite4_CacheCorruptionRecovery();

  console.log('\n================================================================================');
  console.log(`  CHALLENGER 1 RESULTS: Total: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);
  console.log('================================================================================');

  if (defects.length > 0) {
    console.error('\n⚠️ EMPIRICAL DEFECTS FOUND:');
    defects.forEach((d, i) => {
      console.error(`  ${i + 1}. [${d.test}]: ${d.error}`);
    });
    console.log('\nVERDICT: REQUEST_CHANGES');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADVERSARIAL STRESS CHECKS PASSED EMPIRICALLY!');
    console.log('VERDICT: APPROVE');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
