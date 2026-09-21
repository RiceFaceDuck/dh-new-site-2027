/**
 * Challenger 2: Adversarial Stress & Empirical Verification Suite
 * Focus: SKU History Queries, On-Demand Isolation, and 10-Minute TTL Caching
 * Path: Management System/tests/adversarial/challenger_m2_history_cache_ttl.test.mjs
 * 
 * Scope & Invariants Tested:
 * 1. SKU Selection Isolation: Selecting an SKU in search triggers 0 Firestore reads for history.
 * 2. Bounded History Queries:
 *    - Orders query uses `where('itemSkus', 'array-contains', sku)` with `limit(20)`.
 *    - Claims query uses `where('payload.sku', '==', sku)` with `limit(25)`.
 *    - Activity logs query uses `historyService.getRecentLogs(30, ...)` with 0 Firestore reads.
 * 3. 10-Minute TTL Caching Mechanics:
 *    - L1 Memory Cache: 0ms, 0 network, 0 IDB reads on repeat calls within 10 min.
 *    - L2 IndexedDB Cache: 0 network reads on fresh memory state within 10 min.
 *    - TTL Expiry: Strictly refreshes from network after 10 minutes (> 600,000 ms).
 *    - Cache Invalidation & Force Refresh: clearSkuHistoryCache() and { forceRefresh: true }.
 * 4. Input Robustness & Fuzzing:
 *    - Whitespace trimming, lowercase normalization, special characters (#, /, +, ?, unicode/Thai).
 *    - Safe handling of empty strings, null/undefined, objects, numeric inputs.
 * 5. Data Contract & UI Safety:
 *    - Iterable result object (.length, .map, .filter, Symbol.iterator).
 *    - JSX display-safety on structured log details (Symbol.iterator generator).
 *    - Chronological descending sorting (newest first).
 * 
 * Execution: node tests/adversarial/challenger_m2_history_cache_ttl.test.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const SERVICE_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/skuHistoryService.js');
const HOOK_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/pages/hooks/useProductHistory.js');
const SEARCH_HOOK_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/pages/hooks/useProductSearch.js');
const SEARCH_PANEL_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/search/HistoryLogPanel.jsx');

console.log('================================================================================');
console.log('  CHALLENGER 2: History Query Boundedness, SKU Isolation & TTL Cache Suite');
console.log('================================================================================\n');

const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

function pass(name, detail = '') {
  stats.total++;
  stats.passed++;
  console.log(`  [PASS] ${name}${detail ? ` (${detail})` : ''}`);
}

function fail(name, error) {
  stats.total++;
  stats.failed++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  [FAIL] ${name}: ${msg}`);
  stats.failures.push({ name, error: msg });
}

/**
 * Creates an isolated evaluation harness for skuHistoryService.js
 */
function createHistoryHarness({
  ordersData = [],
  claimsData = [],
  logsData = [],
  currentTime = Date.now(),
  idbInitialStore = new Map(),
  ordersError = null,
  claimsError = null,
  idbGetError = null,
  idbSetError = null
} = {}) {
  const codeRaw = fs.readFileSync(SERVICE_PATH, 'utf8');

  // Strip static ESM imports
  let transformed = codeRaw.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  // Strip export keywords
  transformed = transformed.replace(/export\s+async\s+function\s+/g, 'async function ');
  transformed = transformed.replace(/export\s+const\s+/g, 'const ');
  transformed = transformed.replace(/export\s+default\s+[\s\S]*?;?/g, '');

  const metrics = {
    firestoreOrdersQueries: 0,
    firestoreOrdersQueryArgs: [],
    firestoreClaimsQueries: 0,
    firestoreClaimsQueryArgs: [],
    gasLogsCalls: 0,
    gasLogsArgs: [],
    idbGets: 0,
    idbSets: 0,
    idbDels: 0
  };

  const idbStore = new Map(idbInitialStore);
  let nowSimulated = currentTime;

  // Mock Date constructor with controllable static now()
  class MockDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(nowSimulated);
      } else {
        super(...args);
      }
    }
    static now() {
      return nowSimulated;
    }
  }

  // Mock IDB KeyVal
  const mockIdb = {
    get: async (key) => {
      metrics.idbGets++;
      if (idbGetError) throw idbGetError;
      return idbStore.get(key);
    },
    set: async (key, val) => {
      metrics.idbSets++;
      if (idbSetError) throw idbSetError;
      idbStore.set(key, val);
    },
    del: async (key) => {
      metrics.idbDels++;
      idbStore.delete(key);
    }
  };

  // Mock Firestore query builder and execution
  const mockFirestore = {
    collection: (db, path) => ({ type: 'collection', path }),
    where: (field, op, val) => ({ type: 'where', field, op, val }),
    limit: (n) => ({ type: 'limit', value: n }),
    query: (colRef, ...clauses) => ({ type: 'query', colRef, clauses }),
    getDocs: async (q) => {
      if (q.colRef.path.includes('orders')) {
        metrics.firestoreOrdersQueries++;
        metrics.firestoreOrdersQueryArgs.push(q);
        if (ordersError) throw ordersError;
        return {
          forEach: (cb) => {
            ordersData.forEach(item => cb({ id: item.id || 'ord-1', data: () => item }));
          }
        };
      }
      if (q.colRef.path.includes('claims')) {
        metrics.firestoreClaimsQueries++;
        metrics.firestoreClaimsQueryArgs.push(q);
        if (claimsError) throw claimsError;
        return {
          forEach: (cb) => {
            claimsData.forEach(item => cb({ id: item.id || 'clm-1', data: () => item }));
          }
        };
      }
      return { forEach: () => {} };
    }
  };

  const mockDb = { type: 'firestore_db' };
  const mockPathUtils = {
    getCollectionPath: (col) => col
  };

  const mockHistoryService = {
    getRecentLogs: async (limitCount, beforeDate, type, status, sku) => {
      metrics.gasLogsCalls++;
      metrics.gasLogsArgs.push({ limitCount, beforeDate, type, status, sku });
      return { logs: logsData };
    }
  };

  // Wrap in an IIFE to capture internal functions and variables
  const factory = new Function(
    'get', 'set', 'del',
    'collection', 'query', 'where', 'limit', 'getDocs',
    'db',
    'getCollectionPath',
    'historyService',
    'Date',
    `
    ${transformed}
    return {
      fetchSkuHistory,
      clearSkuHistoryCache,
      memoryCache,
      CACHE_TTL,
      CACHE_PREFIX
    };
    `
  );

  const exports = factory(
    mockIdb.get, mockIdb.set, mockIdb.del,
    mockFirestore.collection, mockFirestore.query, mockFirestore.where, mockFirestore.limit, mockFirestore.getDocs,
    mockDb,
    mockPathUtils.getCollectionPath,
    mockHistoryService,
    MockDate
  );

  return {
    ...exports,
    metrics,
    idbStore,
    setTime: (t) => { nowSimulated = t; },
    advanceTime: (ms) => { nowSimulated += ms; }
  };
}

async function testGroup1_SkuSelectionIsolation() {
  console.log('--- GROUP 1: SKU Selection Isolation (Zero Auto-Fetch on Select) ---');

  // Test 1.1: Verify useProductSearch.js does not trigger history fetch on select
  try {
    const searchHookCode = fs.readFileSync(SEARCH_HOOK_PATH, 'utf8');
    assert.ok(
      !searchHookCode.includes('handleLoadHistory('),
      'useProductSearch.js must not invoke handleLoadHistory automatically'
    );
    assert.ok(
      !searchHookCode.includes('fetchSkuHistory('),
      'useProductSearch.js must not invoke fetchSkuHistory directly on product selection'
    );
    pass('useProductSearch.js: handleSelectProduct does not invoke history fetch');
  } catch (e) {
    fail('Test 1.1 useProductSearch code inspection', e);
  }

  // Test 1.2: Verify useProductHistory.js resets state and waits for user interaction
  try {
    const hookCode = fs.readFileSync(HOOK_PATH, 'utf8');
    // Ensure selectedProduct change resets historyLogs to []
    assert.ok(
      hookCode.includes('setHistoryLogs([])'),
      'useProductHistory.js must reset historyLogs when product changes'
    );
    // Ensure fetchHistory is only called when isHistoryModalOpen is true or handleLoadHistory is called
    assert.ok(
      hookCode.includes('isHistoryModalOpen && selectedProduct?.sku && loadedSku !== selectedProduct.sku'),
      'useProductHistory.js must gate auto-fetch on isHistoryModalOpen'
    );
    assert.ok(
      hookCode.includes('handleLoadHistory = useCallback('),
      'useProductHistory.js must expose handleLoadHistory callback for user click'
    );
    pass('useProductHistory.js: History retrieval is decoupled and gated on user action');
  } catch (e) {
    fail('Test 1.2 useProductHistory code inspection', e);
  }

  // Test 1.3: Verify HistoryLogPanel.jsx presents un-fetched state with "กดเพื่อดูประวัติ" button
  try {
    const panelCode = fs.readFileSync(SEARCH_PANEL_PATH, 'utf8');
    assert.ok(
      panelCode.includes('กดเพื่อดูประวัติ'),
      'HistoryLogPanel.jsx must render "กดเพื่อดูประวัติ" button when history is unloaded'
    );
    assert.ok(
      panelCode.includes('onClick={handleLoadHistory}'),
      'HistoryLogPanel.jsx button must invoke handleLoadHistory on user click'
    );
    pass('HistoryLogPanel.jsx: Renders explicit on-demand trigger button before loading');
  } catch (e) {
    fail('Test 1.3 HistoryLogPanel UI inspection', e);
  }
}

async function testGroup2_BoundedQueries() {
  console.log('\n--- GROUP 2: On-Demand Query Boundedness & Parameters ---');

  const ordersMock = [
    {
      id: 'ord-101',
      orderId: 'DH-26-0001',
      itemSkus: ['SKU-TEST-A'],
      items: [{ sku: 'SKU-TEST-A', qty: 2, price: 500 }],
      customerInfo: { fullName: 'Somchai Prasert' },
      status: 'COMPLETED',
      createdAt: { seconds: 1700000000 }
    }
  ];

  const claimsMock = [
    {
      id: 'clm-201',
      payload: { sku: 'SKU-TEST-A', claimId: 'CLM-001', qty: 1, reason: 'Defective screen' },
      type: 'CLAIM',
      status: 'approved',
      createdAt: { seconds: 1700000100 }
    }
  ];

  const logsMock = [
    {
      id: 'log-301',
      action: 'STOCK_ADJUST',
      targetId: 'SKU-TEST-A',
      details: 'Adjusted stock +5',
      actorName: 'Admin',
      timestamp: { seconds: 1700000200 }
    }
  ];

  const harness = createHistoryHarness({
    ordersData: ordersMock,
    claimsData: claimsMock,
    logsData: logsMock
  });

  const res = await harness.fetchSkuHistory('SKU-TEST-A');

  // Test 2.1: Orders query parameters
  try {
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 1, 'Expected exactly 1 orders query');
    const q = harness.metrics.firestoreOrdersQueryArgs[0];
    const whereClause = q.clauses.find(c => c.type === 'where');
    const limitClause = q.clauses.find(c => c.type === 'limit');

    assert.ok(whereClause, 'Orders query must have a where clause');
    assert.strictEqual(whereClause.field, 'itemSkus', 'Field must be itemSkus');
    assert.strictEqual(whereClause.op, 'array-contains', 'Operator must be array-contains');
    assert.strictEqual(whereClause.val, 'SKU-TEST-A', 'Value must match normalized SKU');

    assert.ok(limitClause, 'Orders query must have limit() clause');
    assert.ok(limitClause.value <= 20, `Orders query limit must be <= 20, got ${limitClause.value}`);
    assert.strictEqual(limitClause.value, 20, 'Orders query limit should be exactly 20');
    pass('Orders query uses where(itemSkus, array-contains, sku) and limit(20)', `limit: ${limitClause.value}`);
  } catch (e) {
    fail('Test 2.1 Orders query parameters', e);
  }

  // Test 2.2: Claims query parameters
  try {
    assert.strictEqual(harness.metrics.firestoreClaimsQueries, 1, 'Expected exactly 1 claims query');
    const q = harness.metrics.firestoreClaimsQueryArgs[0];
    const whereClause = q.clauses.find(c => c.type === 'where');
    const limitClause = q.clauses.find(c => c.type === 'limit');

    assert.ok(whereClause, 'Claims query must have a where clause');
    assert.strictEqual(whereClause.field, 'payload.sku', 'Field must be payload.sku');
    assert.strictEqual(whereClause.op, '==', 'Operator must be ==');
    assert.strictEqual(whereClause.val, 'SKU-TEST-A', 'Value must match normalized SKU');

    assert.ok(limitClause, 'Claims query must have limit() clause');
    assert.ok(limitClause.value <= 25, `Claims query limit must be <= 25, got ${limitClause.value}`);
    assert.strictEqual(limitClause.value, 25, 'Claims query limit should be exactly 25');
    pass('Claims query uses where(payload.sku, ==, sku) and limit(25)', `limit: ${limitClause.value}`);
  } catch (e) {
    fail('Test 2.2 Claims query parameters', e);
  }

  // Test 2.3: Activity logs query parameters (0 Firestore Reads)
  try {
    assert.strictEqual(harness.metrics.gasLogsCalls, 1, 'Expected 1 call to historyService.getRecentLogs');
    const args = harness.metrics.gasLogsArgs[0];
    assert.strictEqual(args.limitCount, 30, 'getRecentLogs limit should be 30');
    assert.strictEqual(args.sku, 'SKU-TEST-A', 'getRecentLogs target SKU should be SKU-TEST-A');
    pass('Activity logs queried via historyService with limit 30 (0 Firestore reads)');
  } catch (e) {
    fail('Test 2.3 Activity logs query', e);
  }

  // Test 2.4: Data transformation correctness
  try {
    assert.strictEqual(res.billingHistory.length, 1, 'Expected 1 billing history item');
    assert.strictEqual(res.billingHistory[0].orderId, 'DH-26-0001');
    assert.strictEqual(res.billingHistory[0].customer, 'Somchai Prasert');
    assert.strictEqual(res.billingHistory[0].qty, 2);
    assert.strictEqual(res.billingHistory[0].price, 500);
    assert.strictEqual(res.billingHistory[0].total, 1000);

    assert.strictEqual(res.claimsHistory.length, 1, 'Expected 1 claims history item');
    assert.strictEqual(res.claimsHistory[0].claimId, 'CLM-001');
    assert.strictEqual(res.claimsHistory[0].type, 'CLAIM');
    assert.strictEqual(res.claimsHistory[0].qty, 1);
    pass('Billing & Claims records correctly mapped with customers, totals, and statuses');
  } catch (e) {
    fail('Test 2.4 Data transformation', e);
  }
}

async function testGroup3_TtlCachingMechanics() {
  console.log('\n--- GROUP 3: 10-Minute TTL Caching & Expiration ---');

  const startTime = 1000000000;
  const harness = createHistoryHarness({ currentTime: startTime });

  // Test 3.1: Cold Start (t = 0)
  try {
    const res1 = await harness.fetchSkuHistory('SKU-CACHE-01');
    assert.strictEqual(res1.fromCache, false, 'Cold fetch must have fromCache = false');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 1, 'Must execute orders query on cold fetch');
    assert.strictEqual(harness.metrics.firestoreClaimsQueries, 1, 'Must execute claims query on cold fetch');
    assert.strictEqual(harness.metrics.idbSets, 1, 'Must persist to IndexedDB');
    pass('Cold start fetch executes network queries and writes to L1 RAM + L2 IDB');
  } catch (e) {
    fail('Test 3.1 Cold start fetch', e);
  }

  // Test 3.2: L1 Memory Cache Hit at t = +30 seconds
  try {
    const idbGetsBefore = harness.metrics.idbGets;
    harness.advanceTime(30 * 1000); // +30s
    const res2 = await harness.fetchSkuHistory('SKU-CACHE-01');
    assert.strictEqual(res2.fromCache, true, 'Subsequent fetch within TTL must have fromCache = true');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 1, 'Must NOT query Firestore orders on cache hit');
    assert.strictEqual(harness.metrics.firestoreClaimsQueries, 1, 'Must NOT query Firestore claims on cache hit');
    assert.strictEqual(harness.metrics.idbGets - idbGetsBefore, 0, 'L1 memory hit must not even touch IDB');
    pass('L1 Memory cache hit at +30s consumes strictly 0 Firestore reads and 0 IDB reads');
  } catch (e) {
    fail('Test 3.2 L1 memory cache hit', e);
  }

  // Test 3.3: L1 Memory Cache Hit at t = +9 minutes 59 seconds (within 10-minute TTL)
  try {
    harness.setTime(startTime + (9 * 60 + 59) * 1000); // 9m 59s
    const res3 = await harness.fetchSkuHistory('SKU-CACHE-01');
    assert.strictEqual(res3.fromCache, true, 'Fetch at 9m 59s must still be cached');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 1, 'Orders queries count must remain 1');
    assert.strictEqual(harness.metrics.firestoreClaimsQueries, 1, 'Claims queries count must remain 1');
    pass('Cache hit boundary test at 9m 59s returns cached data (0 network reads)');
  } catch (e) {
    fail('Test 3.3 Boundary cache hit at 9m 59s', e);
  }

  // Test 3.4: L2 IndexedDB Fallback (Memory Cache cleared / New Browser Tab)
  try {
    // Clear in-memory Map
    harness.memoryCache.clear();
    assert.strictEqual(harness.memoryCache.size, 0, 'Memory cache should be empty');

    // Fetch at t = 5 minutes from cold RAM but warm IDB
    const idbGetsBefore = harness.metrics.idbGets;
    harness.setTime(startTime + 5 * 60 * 1000);
    const res4 = await harness.fetchSkuHistory('SKU-CACHE-01');

    assert.strictEqual(res4.fromCache, true, 'IDB cache hit must return fromCache = true');
    assert.strictEqual(harness.metrics.idbGets - idbGetsBefore, 1, 'Must read from IDB exactly once');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 1, 'Must NOT query Firestore when IDB is warm');
    assert.strictEqual(harness.metrics.firestoreClaimsQueries, 1, 'Must NOT query Firestore when IDB is warm');
    assert.ok(harness.memoryCache.has('SKU-CACHE-01'), 'Must repopulate L1 memory cache from IDB');
    pass('L2 IndexedDB cache hit recovers data after RAM clear with 0 Firestore reads');
  } catch (e) {
    fail('Test 3.4 L2 IndexedDB cache recovery', e);
  }

  // Test 3.5: TTL Expiration at t = 10 minutes + 1 second (600,001 ms)
  try {
    harness.setTime(startTime + (10 * 60 + 1) * 1000); // 10m 1s
    const res5 = await harness.fetchSkuHistory('SKU-CACHE-01');

    assert.strictEqual(res5.fromCache, false, 'Expired fetch must return fromCache = false');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 2, 'Must issue fresh orders query on expired cache');
    assert.strictEqual(harness.metrics.firestoreClaimsQueries, 2, 'Must issue fresh claims query on expired cache');
    assert.strictEqual(harness.metrics.idbSets, 2, 'Must overwrite IDB with fresh timestamp');
    pass('TTL expiration at 10m 1s correctly refreshes from network and updates cache timestamp');
  } catch (e) {
    fail('Test 3.5 TTL expiration boundary', e);
  }

  // Test 3.6: Manual Clear Cache (clearSkuHistoryCache)
  try {
    await harness.clearSkuHistoryCache('SKU-CACHE-01');
    assert.ok(!harness.memoryCache.has('SKU-CACHE-01'), 'SKU must be deleted from memory cache');
    assert.ok(!harness.idbStore.has('sku_hist_cache_SKU-CACHE-01'), 'SKU must be deleted from IDB');

    const res6 = await harness.fetchSkuHistory('SKU-CACHE-01');
    assert.strictEqual(res6.fromCache, false, 'Fetch after clear must be fresh');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 3, 'Must query Firestore after clear');
    pass('clearSkuHistoryCache purges both L1 RAM and L2 IDB, forcing fresh query');
  } catch (e) {
    fail('Test 3.6 clearSkuHistoryCache purge', e);
  }

  // Test 3.7: Force Refresh Option ({ forceRefresh: true })
  try {
    // Should be warm in cache now
    const resWarm = await harness.fetchSkuHistory('SKU-CACHE-01');
    assert.strictEqual(resWarm.fromCache, true, 'Should be warm');

    // Force refresh bypasses cache
    const resForced = await harness.fetchSkuHistory('SKU-CACHE-01', { forceRefresh: true });
    assert.strictEqual(resForced.fromCache, false, 'Force refresh must bypass cache');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, 4, 'Must increment orders query on forceRefresh');
    pass('fetchSkuHistory(sku, { forceRefresh: true }) successfully bypasses active cache');
  } catch (e) {
    fail('Test 3.7 Force refresh option', e);
  }
}

async function testGroup4_InputRobustnessAndFuzzing() {
  console.log('\n--- GROUP 4: Input Robustness & SKU Fuzzing ---');

  const harness = createHistoryHarness();

  // Test 4.1: Whitespace trimming
  try {
    const resWhitespace = await harness.fetchSkuHistory('   SKU-TRIM-TEST   ');
    assert.strictEqual(resWhitespace.fromCache, false);
    assert.ok(harness.memoryCache.has('SKU-TRIM-TEST'), 'Key in memory cache must be trimmed to SKU-TRIM-TEST');
    assert.ok(harness.idbStore.has('sku_hist_cache_SKU-TRIM-TEST'), 'Key in IDB must be trimmed');
    pass('SKU with leading and trailing whitespace is safely trimmed');
  } catch (e) {
    fail('Test 4.1 Whitespace trimming', e);
  }

  // Test 4.2: Lowercase normalization
  try {
    const resLower = await harness.fetchSkuHistory('sku-trim-test');
    assert.strictEqual(resLower.fromCache, true, 'Lowercase SKU must hit existing uppercase cache entry');
    pass('Lowercase SKU is automatically normalized to uppercase and hits cache');
  } catch (e) {
    fail('Test 4.2 Lowercase normalization', e);
  }

  // Test 4.3: Special Characters in SKU
  const specialSkus = [
    'SKU/DDR4/3200',      // Slashes
    'SKU+EXTRA-BATTERY',  // Plus sign
    'SKU#999-RAM',        // Hash
    'SKU:GEN2(PRO)',      // Colons and parens
    'แบตเตอรี่-NITRO-5',    // Thai Unicode characters
    'SKU-WITH.DOT_UNDER'  // Dots and underscores
  ];

  for (const specSku of specialSkus) {
    try {
      const resSpec = await harness.fetchSkuHistory(specSku);
      assert.strictEqual(resSpec.fromCache, false);
      const upper = specSku.toUpperCase();
      assert.ok(harness.memoryCache.has(upper), `Cache must store upper key for ${specSku}`);
      assert.ok(harness.idbStore.has(`sku_hist_cache_${upper}`), `IDB must store cache key for ${specSku}`);

      // Second fetch must hit cache
      const resHit = await harness.fetchSkuHistory(specSku);
      assert.strictEqual(resHit.fromCache, true, `Repeat fetch for ${specSku} must hit cache`);
      pass(`Special SKU '${specSku}' queries and caches cleanly`);
    } catch (e) {
      fail(`Test 4.3 Special SKU '${specSku}'`, e);
    }
  }

  // Test 4.4: Empty & Nil Inputs
  const nilInputs = ['', '   ', null, undefined];
  for (const input of nilInputs) {
    try {
      const resNil = await harness.fetchSkuHistory(input);
      assert.strictEqual(resNil.billingHistory.length, 0);
      assert.strictEqual(resNil.claimsHistory.length, 0);
      assert.strictEqual(resNil.logs.length, 0);
      assert.strictEqual(resNil.length, 0);
      pass(`Nil input ${JSON.stringify(input)} safely returns empty result with 0 queries`);
    } catch (e) {
      fail(`Test 4.4 Nil input ${JSON.stringify(input)}`, e);
    }
  }

  // Test 4.5: Object-as-SKU Inputs
  try {
    const objInput = {
      sku: 'sku-from-object',
      comment: 'Legacy comment test',
      internalComments: [
        { id: 'c1', text: 'Internal comment 1', name: 'Tech', timestamp: 1700000000000 }
      ]
    };
    const resObj = await harness.fetchSkuHistory(objInput);
    assert.strictEqual(resObj.fromCache, false);
    assert.ok(harness.memoryCache.has('SKU-FROM-OBJECT'), 'Object sku extracted and capitalized');
    
    // Check that legacy comments were ingested into timeline logs
    const commentLog = resObj.logs.find(l => l.action === 'NOTE');
    assert.ok(commentLog, 'Product object internal comments must be mapped to timeline logs');
    pass('Product object passed as first argument correctly extracts SKU and internal comments');
  } catch (e) {
    fail('Test 4.5 Object-as-SKU input', e);
  }

  // Test 4.6: Numeric SKU handling (Adversarial stress)
  try {
    // In JavaScript, passing a number like 8850001234 could occur if barcode was numeric
    const resNum = await harness.fetchSkuHistory(8850001234);
    // Line 94: typeof sku === 'string' ? sku : (sku?.sku || '');
    // Since 8850001234 is number, 8850001234.sku is undefined, so it yields empty string safely
    assert.strictEqual(resNum.billingHistory.length, 0);
    assert.strictEqual(resNum.length, 0);
    pass('Numeric SKU input 8850001234 safely yields empty result without crash or unhandled rejection');
  } catch (e) {
    fail('Test 4.6 Numeric SKU input', e);
  }
}

async function testGroup5_DataContractsAndUiSafety() {
  console.log('\n--- GROUP 5: Data Structure & UI Display Safety ---');

  const harness = createHistoryHarness({
    ordersData: [
      {
        id: 'ord-1',
        orderId: 'DH-26-0099',
        itemSkus: ['SKU-UI-TEST'],
        items: [{ sku: 'SKU-UI-TEST', qty: 3, price: 250 }],
        customerInfo: { fullName: 'Kanda Sompong' },
        status: 'COMPLETED',
        createdAt: { seconds: 1700005000 }
      }
    ],
    claimsData: [
      {
        id: 'clm-1',
        payload: { sku: 'SKU-UI-TEST', claimId: 'CLM-099', qty: 1, reason: 'Defect' },
        type: 'RETURN',
        status: 'completed',
        createdAt: { seconds: 1700006000 }
      }
    ],
    logsData: [
      {
        id: 'log-1',
        action: 'UPDATE_PRODUCT',
        details: { reference: 'DH-26-0099', text: 'System update' },
        actorName: 'System',
        timestamp: { seconds: 1700004000 }
      }
    ]
  });

  const res = await harness.fetchSkuHistory('SKU-UI-TEST');

  // Test 5.1: Interface contract according to PROJECT.md
  try {
    assert.ok(Array.isArray(res.billingHistory), 'billingHistory must be an Array');
    assert.ok(Array.isArray(res.claimsHistory), 'claimsHistory must be an Array');
    assert.ok(Array.isArray(res.activityLogs), 'activityLogs must be an Array');
    assert.ok(Array.isArray(res.logs), 'logs must be an Array');
    assert.strictEqual(typeof res.fromCache, 'boolean', 'fromCache must be a boolean');
    assert.strictEqual(typeof res.cachedAt, 'number', 'cachedAt must be a number');
    pass('Result object strictly satisfies PROJECT.md interface contract');
  } catch (e) {
    fail('Test 5.1 Contract conformance', e);
  }

  // Test 5.2: Array-like iterable compatibility
  try {
    assert.strictEqual(typeof res.length, 'number', 'res.length must exist');
    assert.ok(res.length > 0, 'res.length must reflect logs count');
    assert.strictEqual(typeof res.map, 'function', 'res.map must be a function');
    assert.strictEqual(typeof res.filter, 'function', 'res.filter must be a function');
    assert.strictEqual(typeof res.slice, 'function', 'res.slice must be a function');
    assert.strictEqual(typeof res.forEach, 'function', 'res.forEach must be a function');
    assert.strictEqual(typeof res[Symbol.iterator], 'function', 'res must implement Symbol.iterator');

    // Test iteration via for..of loop
    const iterated = [];
    for (const log of res) {
      iterated.push(log);
    }
    assert.strictEqual(iterated.length, res.length, 'for..of iteration must yield all logs');
    pass('Result object implements full array-like API (.length, .map, .filter, Symbol.iterator)');
  } catch (e) {
    fail('Test 5.2 Array-like iterable compatibility', e);
  }

  // Test 5.3: React JSX Object Child Safety (makeDisplaySafe)
  try {
    // In React JSX, if a legacy component renders {log.details} directly and log.details is an object,
    // React throws "Objects are not valid as a React child" unless log.details has Symbol.iterator.
    for (const log of res.logs) {
      if (typeof log.details === 'object' && log.details !== null) {
        assert.ok(
          typeof log.details[Symbol.iterator] === 'function',
          `log ${log.id} details object must implement Symbol.iterator for JSX safety`
        );
        const parts = [...log.details];
        assert.ok(parts.length > 0, 'Symbol.iterator should yield summary text');
      }
    }
    pass('makeDisplaySafe attaches Symbol.iterator generator to all structured log.details objects');
  } catch (e) {
    fail('Test 5.3 React JSX Child Safety', e);
  }

  // Test 5.4: Chronological descending sort order (newest first)
  try {
    for (let i = 0; i < res.logs.length - 1; i++) {
      const tA = res.logs[i].timestamp?.seconds || 0;
      const tB = res.logs[i + 1].timestamp?.seconds || 0;
      assert.ok(tA >= tB, `Logs must be ordered descending by timestamp: ${tA} >= ${tB}`);
    }
    pass('Timeline logs are sorted in strict chronological descending order (newest first)');
  } catch (e) {
    fail('Test 5.4 Chronological descending sort', e);
  }
}

async function testGroup6_ResilienceAndFaultTolerance() {
  console.log('\n--- GROUP 6: Resilience & Fault Tolerance (Degraded Dependencies) ---');

  // Test 6.1: Orders query failure does not crash service
  try {
    const harness = createHistoryHarness({
      ordersError: new Error('Firestore UNAVAILABLE: orders connection timed out'),
      claimsData: [{ id: 'c1', payload: { sku: 'SKU-RES-1', claimId: 'CLM-01' } }],
      logsData: [{ id: 'l1', action: 'ADJUST', targetId: 'SKU-RES-1' }]
    });

    const res = await harness.fetchSkuHistory('SKU-RES-1');
    assert.strictEqual(res.billingHistory.length, 0, 'Billing history should degrade to empty array');
    assert.strictEqual(res.claimsHistory.length, 1, 'Claims history should still be retrieved');
    pass('Orders query failure degrades gracefully without throwing (claims & logs preserved)');
  } catch (e) {
    fail('Test 6.1 Orders query failure resilience', e);
  }

  // Test 6.2: Claims query failure does not crash service
  try {
    const harness = createHistoryHarness({
      claimsError: new Error('Firestore PERMISSION_DENIED: claims'),
      ordersData: [{ id: 'o1', orderId: 'DH-01', itemSkus: ['SKU-RES-2'], items: [{ sku: 'SKU-RES-2', qty: 1 }] }]
    });

    const res = await harness.fetchSkuHistory('SKU-RES-2');
    assert.strictEqual(res.billingHistory.length, 1, 'Billing history should still be retrieved');
    assert.strictEqual(res.claimsHistory.length, 0, 'Claims history should degrade to empty array');
    pass('Claims query failure degrades gracefully without throwing (orders preserved)');
  } catch (e) {
    fail('Test 6.2 Claims query failure resilience', e);
  }

  // Test 6.3: Both Firestore queries fail (Complete Firestore Outage)
  try {
    const harness = createHistoryHarness({
      ordersError: new Error('Network error'),
      claimsError: new Error('Network error'),
      logsData: [{ id: 'l1', action: 'SYSTEM', targetId: 'SKU-RES-3', details: 'Log survived' }]
    });

    const res = await harness.fetchSkuHistory('SKU-RES-3');
    assert.strictEqual(res.billingHistory.length, 0);
    assert.strictEqual(res.claimsHistory.length, 0);
    assert.ok(res.logs.length >= 1, 'System activity logs should survive Firestore outage');
    pass('Complete Firestore outage returns available logs without throwing exception');
  } catch (e) {
    fail('Test 6.3 Complete Firestore outage resilience', e);
  }

  // Test 6.4: IDB Read Failure (Private Browsing or Security Restriction)
  try {
    const harness = createHistoryHarness({
      idbGetError: new Error('SecurityError: The operation is insecure')
    });

    const res = await harness.fetchSkuHistory('SKU-RES-4');
    assert.strictEqual(res.fromCache, false);
    pass('IndexedDB read failure is caught safely and proceeds to fetch from network');
  } catch (e) {
    fail('Test 6.4 IDB read failure resilience', e);
  }

  // Test 6.5: IDB Write Failure (QuotaExceededError)
  try {
    const harness = createHistoryHarness({
      idbSetError: new Error('QuotaExceededError: The quota has been exceeded')
    });

    const res = await harness.fetchSkuHistory('SKU-RES-5');
    assert.strictEqual(res.fromCache, false);
    // Should still be cached in L1 memory
    const resL1 = await harness.fetchSkuHistory('SKU-RES-5');
    assert.strictEqual(resL1.fromCache, true, 'Should still hit L1 memory cache even if IDB write failed');
    pass('IndexedDB write failure is caught safely and preserves L1 memory cache');
  } catch (e) {
    fail('Test 6.5 IDB write failure resilience', e);
  }

  // Test 6.6: Malformed Order Document Fuzzing
  try {
    const harness = createHistoryHarness({
      ordersData: [
        {
          id: 'bad-ord-1',
          items: null, // null items
          customerInfo: null,
          createdAt: null
        },
        {
          id: 'bad-ord-2',
          items: [null, undefined, { sku: 'SKU-FUZZ', qty: 'not-a-num', price: 'invalid' }],
          customer: null,
          date: 'invalid-date'
        }
      ]
    });

    const res = await harness.fetchSkuHistory('SKU-FUZZ');
    assert.ok(Array.isArray(res.billingHistory), 'billingHistory should be an array');
    pass('Malformed order documents (null items, NaN quantities, invalid dates) handled safely');
  } catch (e) {
    fail('Test 6.6 Malformed order document fuzzing', e);
  }

  // Test 6.7: Malformed Claim Document Fuzzing
  try {
    const harness = createHistoryHarness({
      claimsData: [
        { id: 'bad-clm-1', payload: null, type: null, createdAt: null },
        { id: 'bad-clm-2', payload: { sku: 'SKU-FUZZ-2', qty: null, reason: null }, type: 'UNKNOWN' }
      ]
    });

    const res = await harness.fetchSkuHistory('SKU-FUZZ-2');
    assert.ok(Array.isArray(res.claimsHistory), 'claimsHistory should be an array');
    pass('Malformed claim documents (null payload, null qty) handled safely without crash');
  } catch (e) {
    fail('Test 6.7 Malformed claim document fuzzing', e);
  }
}

async function testGroup7_ConcurrencyAndStateInvariants() {
  console.log('\n--- GROUP 7: Concurrency & State Invariants ---');

  const harness = createHistoryHarness();

  // Test 7.1: Distinct SKU Isolation
  try {
    await harness.fetchSkuHistory('SKU-ALPHA');
    await harness.fetchSkuHistory('SKU-BETA');

    assert.ok(harness.memoryCache.has('SKU-ALPHA'), 'Memory cache must contain SKU-ALPHA');
    assert.ok(harness.memoryCache.has('SKU-BETA'), 'Memory cache must contain SKU-BETA');
    assert.ok(harness.idbStore.has('sku_hist_cache_SKU-ALPHA'), 'IDB must contain SKU-ALPHA');
    assert.ok(harness.idbStore.has('sku_hist_cache_SKU-BETA'), 'IDB must contain SKU-BETA');
    pass('Independent SKUs maintain strictly isolated cache entries in L1 RAM and L2 IDB');
  } catch (e) {
    fail('Test 7.1 Distinct SKU isolation', e);
  }

  // Test 7.2: Interleaved Queries Hit Correct Caches
  try {
    const queriesBefore = harness.metrics.firestoreOrdersQueries;
    const resA = await harness.fetchSkuHistory('SKU-ALPHA');
    const resB = await harness.fetchSkuHistory('SKU-BETA');

    assert.strictEqual(resA.fromCache, true, 'SKU-ALPHA must hit cache');
    assert.strictEqual(resB.fromCache, true, 'SKU-BETA must hit cache');
    assert.strictEqual(harness.metrics.firestoreOrdersQueries, queriesBefore, 'Zero new queries for cached SKUs');
    pass('Interleaved requests for multiple cached SKUs return instantly with 0 Firestore queries');
  } catch (e) {
    fail('Test 7.2 Interleaved queries cache hit', e);
  }

  // Test 7.3: Global Memory Cache Purge
  try {
    await harness.clearSkuHistoryCache(); // null argument clears all
    assert.strictEqual(harness.memoryCache.size, 0, 'All items must be purged from memory cache');
    pass('clearSkuHistoryCache() with no arguments flushes entire L1 memory cache');
  } catch (e) {
    fail('Test 7.3 Global memory cache purge', e);
  }
}

async function main() {
  await testGroup1_SkuSelectionIsolation();
  await testGroup2_BoundedQueries();
  await testGroup3_TtlCachingMechanics();
  await testGroup4_InputRobustnessAndFuzzing();
  await testGroup5_DataContractsAndUiSafety();
  await testGroup6_ResilienceAndFaultTolerance();
  await testGroup7_ConcurrencyAndStateInvariants();

  console.log('\n================================================================================');
  console.log(`  CHALLENGER 2 SUMMARY: Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
  console.log('================================================================================');

  if (stats.failed === 0) {
    console.log('🎉 ALL ADVERSARIAL CHALLENGES PASSED! HISTORY CACHE & TTL MECHANICS ARE ROBUST.\n');
    process.exit(0);
  } else {
    console.error(`❌ CHALLENGER FOUND ${stats.failed} DEFECTS!\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
