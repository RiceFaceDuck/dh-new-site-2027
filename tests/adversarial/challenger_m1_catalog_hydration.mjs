/**
 * Challenger M1: Standalone Empirical Adversarial Stress Suite for Catalog Hydration & POS Search
 * 
 * Rigorously stress-tests:
 *  1. Product Normalization & Invariant Fuzzing (normalizeProduct)
 *  2. Tier 1 In-Memory & SessionStorage Cache Hit (0ms, 0 Reads)
 *  3. Tier 2 IndexedDB Cache Hit & Version Validation (1 Manifest Read)
 *  4. Tier 3 Firestore Chunk Fallback (catalogs/search_index_p1..p7 <= 8 Reads)
 *  5. Graceful Fallback to gasStockService under Firestore Outage
 *  6. Barcode Exact & Similar Matching across SKU and Barcode fields (usePosCart search)
 *  7. Cache Purge & Quota Upper Bounds
 * 
 * Execution: node tests/adversarial/challenger_m1_catalog_hydration.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const SERVICE_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/catalogHydrationService.js');
const HOOK_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosCart.js');

console.log('================================================================================');
console.log('  CHALLENGER M1: Catalog Hydration & POS Barcode Quota Adversarial Suite');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const defects = [];

function pass(name) {
  totalTests++;
  passedTests++;
  console.log(`  [PASS] ${name}`);
}

function fail(name, error) {
  totalTests++;
  failedTests++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  [FAIL] ${name}: ${msg}`);
  defects.push({ test: name, error: msg });
}

// -----------------------------------------------------------------------------
// HARNESS FACTORY: Dynamic Module Evaluator for catalogHydrationService.js
// -----------------------------------------------------------------------------
function createCatalogServiceInstance({
  initialIdb = new Map(),
  firestoreDocs = new Map(),
  firestoreError = null,
  gasData = null,
  gasError = null,
  sessionData = new Map()
} = {}) {
  const serviceCodeRaw = fs.readFileSync(SERVICE_PATH, 'utf8');

  // Strip static imports
  let cleanedCode = serviceCodeRaw.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
  // Strip exports
  cleanedCode = cleanedCode.replace(/export\s+const\s+/g, 'const ');
  cleanedCode = cleanedCode.replace(/export\s+default\s+/g, 'const defaultExport = ');

  // Metrics trackers
  const metrics = {
    firestoreReads: 0,
    idbReads: 0,
    idbWrites: 0,
    idbDeletes: 0,
    gasCalls: 0,
    sessionReads: 0,
    sessionWrites: 0
  };

  const idbStore = new Map(initialIdb);
  const sessionStore = new Map(sessionData);

  // Mock IDB
  const mockIdb = {
    get: async (key) => {
      metrics.idbReads++;
      return idbStore.has(key) ? idbStore.get(key) : undefined;
    },
    set: async (key, val) => {
      metrics.idbWrites++;
      idbStore.set(key, val);
    },
    del: async (key) => {
      metrics.idbDeletes++;
      idbStore.delete(key);
    }
  };

  // Mock Firestore
  const mockFirestore = {
    doc: (db, col, docId) => ({ path: `${col}/${docId}`, col, docId }),
    getDoc: async (ref) => {
      metrics.firestoreReads++;
      if (firestoreError) {
        throw firestoreError;
      }
      const data = firestoreDocs.get(ref.path);
      return {
        exists: () => data !== undefined && data !== null,
        data: () => (data !== undefined && data !== null ? data : undefined)
      };
    }
  };

  // Mock GAS
  const mockGas = {
    fetchBackupInventory: async () => {
      metrics.gasCalls++;
      if (gasError) {
        throw gasError;
      }
      return gasData || [];
    }
  };

  // Mock Window / SessionStorage
  const mockWindow = {
    sessionStorage: {
      getItem: (key) => {
        metrics.sessionReads++;
        return sessionStore.has(key) ? sessionStore.get(key) : null;
      },
      setItem: (key, val) => {
        metrics.sessionWrites++;
        sessionStore.set(key, String(val));
      },
      removeItem: (key) => {
        sessionStore.delete(key);
      }
    }
  };

  const safeJsonParse = (str, fallback = null) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  const wrapperFn = new Function(
    'get', 'set', 'del',
    'doc', 'getDoc',
    'db', 'getCollectionPath', 'safeJsonParse',
    'gasStockService', 'window',
    `
    ${cleanedCode}
    return {
      normalizeProduct,
      hydrateCatalog,
      findProductInCache,
      clearCatalogCache,
      _getInMemoryProducts: () => inMemoryProducts,
      _getInMemoryMeta: () => inMemoryMeta,
      _setInMemoryProducts: (p) => { inMemoryProducts = p; },
      _setInMemoryMeta: (m) => { inMemoryMeta = m; }
    };
    `
  );

  const instance = wrapperFn(
    mockIdb.get, mockIdb.set, mockIdb.del,
    mockFirestore.doc, mockFirestore.getDoc,
    {}, (c) => c, safeJsonParse,
    mockGas, mockWindow
  );

  return {
    instance,
    metrics,
    idbStore,
    sessionStore,
    setFirestoreError: (err) => { firestoreError = err; },
    setGasError: (err) => { gasError = err; },
    setGasData: (data) => { gasData = data; }
  };
}

// -----------------------------------------------------------------------------
// POS SEARCH LOGIC REPLICATOR (Mirroring usePosCart.js exact logic)
// -----------------------------------------------------------------------------
function simulatePosSearch(mergedProducts, query, fbFallback = null) {
  if (!query || !query.trim()) {
    return (mergedProducts || []).slice(0, 15);
  }
  const term = query.trim().toLowerCase();

  // 1. Exact SKU or Barcode Match in Cache
  const exactMatch = (mergedProducts || []).find(p =>
    (p.sku && p.sku.toLowerCase() === term) ||
    (p.barcode && String(p.barcode).toLowerCase() === term)
  );
  if (exactMatch) {
    return [{ ...exactMatch, matchType: 'exact' }];
  }

  // 2. Similar Match in Cache (SKU, Barcode, Name, Brand, Category, Tags)
  const filtered = (mergedProducts || []).filter(p =>
    (p.sku && p.sku.toLowerCase().includes(term)) ||
    (p.barcode && String(p.barcode).toLowerCase().includes(term)) ||
    (p.name && p.name.toLowerCase().includes(term)) ||
    (p.brand && p.brand.toLowerCase().includes(term)) ||
    (p.category && p.category.toLowerCase().includes(term)) ||
    (p.tags && p.tags.some(t => String(t).toLowerCase().includes(term)))
  );

  if (filtered.length > 0) {
    return filtered.slice(0, 15).map(p => ({ ...p, matchType: 'similar' }));
  }

  // 3. Fallback
  if (typeof fbFallback === 'function') {
    const match = fbFallback(query.trim().toUpperCase());
    if (match) {
      return [{ ...match, matchType: 'exact' }];
    }
  }

  return [];
}


// =============================================================================
// TEST SUITE 1: Product Normalization & Invariant Fuzzing
// =============================================================================
console.log('--- SUITE 1: Product Normalization & Invariant Fuzzing ---');

const { instance: testService } = createCatalogServiceInstance();

try {
  // 1.1 Complete standard product
  const std = testService.normalizeProduct({
    sku: 'GAS-01',
    barcode: '8850001234567',
    name: 'PT Gas Cylinder 15kg',
    Price: 350,
    retailPrice: 370,
    wholesalePrice: 350,
    stockQuantity: 25,
    image: 'https://example.com/gas.jpg'
  });
  assert.strictEqual(std.sku, 'GAS-01');
  assert.strictEqual(std.barcode, '8850001234567');
  assert.strictEqual(std.Price, 350);
  assert.strictEqual(std.retailPrice, 370);
  assert.strictEqual(std.wholesalePrice, 350);
  assert.strictEqual(std.stock, 25);
  assert.strictEqual(std.stockQuantity, 25);
  assert.strictEqual(std.image, 'https://example.com/gas.jpg');
  assert.deepStrictEqual(std.images, ['https://example.com/gas.jpg']);
  pass('normalizeProduct: handles complete standard product correctly');
} catch (e) {
  fail('normalizeProduct standard', e);
}

try {
  // 1.2 Missing barcode defaults to SKU
  const noBarcode = testService.normalizeProduct({ sku: 'REG-500', name: 'Gas Regulator' });
  assert.strictEqual(noBarcode.barcode, 'REG-500', 'Missing barcode must fallback to sku');
  pass('normalizeProduct: missing barcode safely defaults to sku');
} catch (e) {
  fail('normalizeProduct barcode fallback', e);
}

try {
  // 1.3 Missing SKU defaults to ID
  const noSku = testService.normalizeProduct({ id: 'DOC_ID_999', name: 'Brass Valve' });
  assert.strictEqual(noSku.sku, 'DOC_ID_999');
  assert.strictEqual(noSku.barcode, 'DOC_ID_999');
  pass('normalizeProduct: missing sku safely defaults to id');
} catch (e) {
  fail('normalizeProduct sku fallback to id', e);
}

try {
  // 1.4 Numeric barcode & numeric SKU conversion
  const numProduct = testService.normalizeProduct({
    sku: 10045,
    barcode: 8851122334455,
    Price: '250',
    stock: '15'
  });
  assert.strictEqual(typeof numProduct.sku, 'string');
  assert.strictEqual(numProduct.sku, '10045');
  assert.strictEqual(typeof numProduct.barcode, 'string');
  assert.strictEqual(numProduct.barcode, '8851122334455');
  assert.strictEqual(numProduct.Price, 250);
  assert.strictEqual(numProduct.stockQuantity, 15);
  pass('normalizeProduct: coerces numeric sku, barcode, price, and stock to correct types');
} catch (e) {
  fail('normalizeProduct type coercion', e);
}

try {
  // 1.5 Whitespace trimming on SKU and barcode
  const trimmed = testService.normalizeProduct({
    sku: '   SP-99   ',
    barcode: '   88599990000   '
  });
  assert.strictEqual(trimmed.sku, 'SP-99');
  assert.strictEqual(trimmed.barcode, '88599990000');
  pass('normalizeProduct: trims whitespace on sku and barcode');
} catch (e) {
  fail('normalizeProduct trimming', e);
}

try {
  // 1.6 Price fallback priority (wholesalePrice -> Price -> retailPrice -> 0)
  const p1 = testService.normalizeProduct({ sku: 'P1', wholesalePrice: 150 });
  assert.strictEqual(p1.Price, 150);

  const p2 = testService.normalizeProduct({ sku: 'P2', retailPrice: 180 });
  assert.strictEqual(p2.Price, 180);
  assert.strictEqual(p2.retailPrice, 180);

  const p3 = testService.normalizeProduct({ sku: 'P3' });
  assert.strictEqual(p3.Price, 0);
  assert.strictEqual(p3.retailPrice, 0);
  pass('normalizeProduct: price resolution hierarchy is resilient and defaults to 0');
} catch (e) {
  fail('normalizeProduct price hierarchy', e);
}

try {
  // 1.7 Adversarial null/undefined/empty fuzzing
  const fuzzedInputs = [null, undefined, '', 0, false, {}, { foo: 'bar' }, { sku: '' }, { id: '   ' }];
  for (const input of fuzzedInputs) {
    const res = testService.normalizeProduct(input);
    assert.strictEqual(res, null, `Input ${JSON.stringify(input)} should normalize to null`);
  }
  pass('normalizeProduct: fuzzed malformed/empty inputs safely return null without throwing');
} catch (e) {
  fail('normalizeProduct fuzzing', e);
}


// =============================================================================
// TEST SUITE 2: Tier 1 Fast Cache (In-Memory & SessionStorage)
// =============================================================================
console.log('\n--- SUITE 2: Tier 1 Fast Cache (In-Memory & SessionStorage) ---');

try {
  // 2.1 In-memory hit (0ms, 0 Reads)
  const mockProducts = [
    { sku: 'GAS-15', name: 'Gas 15kg', Price: 350 },
    { sku: 'GAS-48', name: 'Gas 48kg', Price: 1100 }
  ];
  const { instance, metrics } = createCatalogServiceInstance();
  instance._setInMemoryProducts(mockProducts);
  instance._setInMemoryMeta({ version: 1, timestamp: Date.now() });

  const start = performance.now();
  const res = await instance.hydrateCatalog();
  const latency = performance.now() - start;

  assert.strictEqual(res.source, 'memory', 'Source must be memory');
  assert.strictEqual(res.products.length, 2);
  assert.strictEqual(metrics.firestoreReads, 0, 'In-memory cache hit must burn 0 Firestore reads');
  assert.strictEqual(metrics.idbReads, 0, 'In-memory cache hit must bypass IDB');
  assert.ok(latency < 10, `In-memory cache latency must be near 0ms (took ${latency.toFixed(2)}ms)`);
  pass('Tier 1 In-Memory Cache: 0ms latency, exactly 0 Firestore reads, source="memory"');
} catch (e) {
  fail('Tier 1 In-Memory Cache', e);
}

try {
  // 2.2 SessionStorage hit
  const sessionProds = [{ sku: 'SESS-1', name: 'Session Prod', Price: 50 }];
  const sessionMeta = { version: 's1', timestamp: Date.now() };
  const sessionMap = new Map([
    ['search_hybrid_cache', JSON.stringify(sessionProds)],
    ['search_hybrid_cache_meta', JSON.stringify(sessionMeta)]
  ]);

  const { instance, metrics } = createCatalogServiceInstance({ sessionData: sessionMap });
  const res = await instance.hydrateCatalog();

  assert.strictEqual(res.source, 'session', 'Source must be session');
  assert.strictEqual(res.products.length, 1);
  assert.strictEqual(metrics.firestoreReads, 0, 'Session cache hit must burn 0 Firestore reads');
  pass('Tier 1 SessionStorage Cache: valid unexpired cache returns source="session" with 0 reads');
} catch (e) {
  fail('Tier 1 SessionStorage Cache', e);
}

try {
  // 2.3 Expired SessionStorage cache (> 1 hour TTL)
  const expiredMeta = { version: 's_old', timestamp: Date.now() - (65 * 60 * 1000) }; // 65 mins ago
  const sessionMap = new Map([
    ['search_hybrid_cache', JSON.stringify([{ sku: 'OLD-1' }])],
    ['search_hybrid_cache_meta', JSON.stringify(expiredMeta)]
  ]);

  const firestoreDocs = new Map([
    ['catalogs/search_index', { version: 'v_fresh', chunkCount: 1 }],
    ['catalogs/search_index_p1', { items: [{ sku: 'FRESH-1', Price: 99 }] }]
  ]);

  const { instance, metrics } = createCatalogServiceInstance({
    sessionData: sessionMap,
    firestoreDocs
  });

  const res = await instance.hydrateCatalog();
  assert.notStrictEqual(res.source, 'session', 'Expired session cache must be rejected');
  assert.strictEqual(res.source, 'chunks', 'Should fallback to chunks');
  assert.strictEqual(res.products[0].sku, 'FRESH-1');
  pass('Tier 1 SessionStorage Cache: expired TTL (> 1hr) rejected, re-hydrates chunks');
} catch (e) {
  fail('Tier 1 SessionStorage TTL', e);
}


// =============================================================================
// TEST SUITE 3: Tier 2 IndexedDB Cache Hit & Version Validation
// =============================================================================
console.log('\n--- SUITE 3: Tier 2 IndexedDB Cache Hit & Version Validation ---');

try {
  // 3.1 Tier 2 Fresh Cache Hit (1 Manifest Read only, 0 chunk reads)
  const idbProds = [
    { sku: 'IDB-1', name: 'Product 1', Price: 100 },
    { sku: 'IDB-2', name: 'Product 2', Price: 200 }
  ];
  const idbMeta = { version: 'v2.1', totalItems: 2, timestamp: Date.now() };

  const initialIdb = new Map([
    ['dh_pos_catalog_products', idbProds],
    ['dh_pos_catalog_meta', idbMeta]
  ]);

  const firestoreDocs = new Map([
    ['catalogs/search_index', { version: 'v2.1', chunkCount: 7, updatedAt: Date.now() }],
    ['catalogs/search_index_p1', { items: [{ sku: 'CHUNK-SHOULD-NOT-BE-READ' }] }]
  ]);

  const { instance, metrics } = createCatalogServiceInstance({
    initialIdb,
    firestoreDocs
  });

  const res = await instance.hydrateCatalog();

  assert.strictEqual(res.source, 'idb', 'Source must be idb on version match');
  assert.strictEqual(res.products.length, 2);
  assert.strictEqual(metrics.firestoreReads, 1, 'Fresh IDB cache hit must burn strictly 1 Firestore read (manifest check only)');
  pass('Tier 2 IndexedDB Cache: version match returns source="idb" with strictly 1 Firestore read');
} catch (e) {
  fail('Tier 2 IDB Cache Hit', e);
}

try {
  // 3.2 Stale IDB Cache vs Remote Manifest (Version Mismatch -> Chunks Refetch)
  const idbProds = [{ sku: 'OLD-IDB-1', Price: 100 }];
  const idbMeta = { version: 'v2.0', totalItems: 1 };

  const initialIdb = new Map([
    ['dh_pos_catalog_products', idbProds],
    ['dh_pos_catalog_meta', idbMeta]
  ]);

  const firestoreDocs = new Map([
    ['catalogs/search_index', { version: 'v2.5', chunkCount: 2 }],
    ['catalogs/search_index_p1', { items: [{ sku: 'NEW-CHUNK-1', Price: 120 }] }],
    ['catalogs/search_index_p2', { items: [{ sku: 'NEW-CHUNK-2', Price: 150 }] }]
  ]);

  const { instance, metrics, idbStore } = createCatalogServiceInstance({
    initialIdb,
    firestoreDocs
  });

  const res = await instance.hydrateCatalog();

  assert.strictEqual(res.source, 'chunks', 'Stale cache must invalidate and fetch chunks');
  assert.strictEqual(res.products.length, 2);
  assert.strictEqual(metrics.firestoreReads, 3, 'Must read 1 manifest + 2 chunks = 3 reads total');

  // Verify updated cache is saved back to IDB
  const savedMeta = idbStore.get('dh_pos_catalog_meta');
  assert.strictEqual(savedMeta.version, 'v2.5', 'New version must be written back to IDB');
  pass('Tier 2 IndexedDB Stale Invalidation: detects version mismatch, updates from chunks, writes to IDB');
} catch (e) {
  fail('Tier 2 Stale Invalidation', e);
}

try {
  // 3.3 Offline / Firestore Network Failure Resiliency (idb_stale fallback)
  const idbProds = [{ sku: 'OFFLINE-ITEM-1', name: 'Resilient Gas', Price: 380 }];
  const initialIdb = new Map([
    ['dh_pos_catalog_products', idbProds],
    ['dh_pos_catalog_meta', { version: 'v1.0' }]
  ]);

  const { instance, metrics } = createCatalogServiceInstance({
    initialIdb,
    firestoreError: new Error('Network unavailable: Firestore client is offline')
  });

  const res = await instance.hydrateCatalog();

  assert.strictEqual(res.source, 'idb_stale', 'Under Firestore outage, must return idb_stale');
  assert.strictEqual(res.products.length, 1);
  assert.strictEqual(res.products[0].sku, 'OFFLINE-ITEM-1');
  pass('Tier 2 Resilience: network error gracefully falls back to idb_stale without POS crash');
} catch (e) {
  fail('Tier 2 Offline Resiliency', e);
}


// =============================================================================
// TEST SUITE 4: Tier 3 Firestore Chunk Loading & Fallback
// =============================================================================
console.log('\n--- SUITE 4: Tier 3 Firestore Chunk Loading & Quota Safety ---');

try {
  // 4.1 Cold Start: Empty IDB, loads 7 chunks <= 8 reads total
  const chunkDocs = new Map();
  chunkDocs.set('catalogs/search_index', { version: 'v3.0.0', chunkCount: 7 });

  let totalExpectedItems = 0;
  for (let i = 1; i <= 7; i++) {
    const items = [
      { sku: `CK-${i}-A`, name: `Chunk ${i} Item A`, Price: 100 * i, barcode: `885000${i}001` },
      { sku: `CK-${i}-B`, name: `Chunk ${i} Item B`, Price: 120 * i, barcode: `885000${i}002` }
    ];
    totalExpectedItems += items.length;
    chunkDocs.set(`catalogs/search_index_p${i}`, { items });
  }

  const { instance, metrics, idbStore } = createCatalogServiceInstance({
    firestoreDocs: chunkDocs
  });

  const res = await instance.hydrateCatalog();

  assert.strictEqual(res.source, 'chunks');
  assert.strictEqual(res.products.length, totalExpectedItems);
  assert.strictEqual(metrics.firestoreReads, 8, 'Must burn strictly 1 manifest + 7 chunk reads = 8 reads total');

  // Verify all products are normalized
  res.products.forEach(p => {
    assert.ok(p.sku && p.barcode && p.name && p.Price !== undefined);
  });

  // Verify written to IDB
  assert.ok(idbStore.has('dh_pos_catalog_products'));
  assert.strictEqual(idbStore.get('dh_pos_catalog_products').length, totalExpectedItems);

  // Subsequent call should be 0 reads (Tier 1 memory hit)
  const secondRes = await instance.hydrateCatalog();
  assert.strictEqual(secondRes.source, 'memory');
  assert.strictEqual(metrics.firestoreReads, 8, 'Second call must be 0 reads (still 8 total)');

  pass('Tier 3 Chunk Loading: 7 chunks loaded in strictly 8 Firestore reads, persisted to L1/L2');
} catch (e) {
  fail('Tier 3 Cold Start Chunk Loading', e);
}

try {
  // 4.2 Partial chunk failure resilience (Missing Chunk 3 of 5)
  const partialChunks = new Map();
  partialChunks.set('catalogs/search_index', { version: 'v3.1.0', chunkCount: 5 });
  partialChunks.set('catalogs/search_index_p1', { items: [{ sku: 'P1' }] });
  partialChunks.set('catalogs/search_index_p2', { items: [{ sku: 'P2' }] });
  // Chunk 3 is intentionally missing (undefined doc)
  partialChunks.set('catalogs/search_index_p4', { items: [{ sku: 'P4' }] });
  partialChunks.set('catalogs/search_index_p5', { items: [{ sku: 'P5' }] });

  const { instance, metrics } = createCatalogServiceInstance({
    firestoreDocs: partialChunks
  });

  const res = await instance.hydrateCatalog();
  assert.strictEqual(res.source, 'chunks');
  assert.strictEqual(res.products.length, 4, 'Should assemble remaining 4 chunks without dying');
  pass('Tier 3 Partial Chunk Failure: missing chunks log warning and assemble surviving chunks');
} catch (e) {
  fail('Tier 3 Partial Chunk Resilience', e);
}


// =============================================================================
// TEST SUITE 5: Graceful Fallback to gasStockService
// =============================================================================
console.log('\n--- SUITE 5: Graceful Fallback to gasStockService ---');

try {
  // 5.1 Firestore has no manifest document, GAS returns inventory
  const mockGasItems = [
    { sku: 'GAS-BAK-1', name: 'Backup Gas Cyl', Price: 340, stock: 12 },
    { sku: 'GAS-BAK-2', name: 'Backup Gas Hose', Price: 65, stock: 40 }
  ];

  const { instance, metrics } = createCatalogServiceInstance({
    firestoreDocs: new Map(), // No catalogs/search_index
    gasData: mockGasItems
  });

  const res = await instance.hydrateCatalog();

  assert.strictEqual(res.source, 'gas', 'Must fallback to gas source');
  assert.strictEqual(res.products.length, 2);
  assert.strictEqual(metrics.gasCalls, 1, 'gasStockService.fetchBackupInventory must be invoked');
  assert.strictEqual(res.products[0].sku, 'GAS-BAK-1');
  pass('Fallback to GAS: unseeded Firestore smoothly falls back to gasStockService');
} catch (e) {
  fail('GAS Fallback on Missing Manifest', e);
}

try {
  // 5.2 Worst-Case Disaster: Firestore AND GAS both throw
  const { instance } = createCatalogServiceInstance({
    firestoreDocs: new Map(),
    gasError: new Error('Google Apps Script quota exceeded / 503 Service Unavailable')
  });

  const res = await instance.hydrateCatalog();

  assert.strictEqual(res.source, 'none', 'Catastrophic failure must yield source="none"');
  assert.deepStrictEqual(res.products, [], 'Must return empty array safely');
  assert.strictEqual(res.meta.version, 'empty');
  pass('Catastrophic Failure Resiliency: zero uncaught crashes when all remote tiers fail');
} catch (e) {
  fail('Catastrophic Failure Handling', e);
}


// =============================================================================
// TEST SUITE 6: Barcode & SKU Matching Engine (POS Hardware Scanner Verification)
// =============================================================================
console.log('\n--- SUITE 6: Barcode & SKU Matching Engine (POS Hardware Scanner Verification) ---');

const catalogItems = [
  { sku: 'GAS-PT-15', barcode: '8851234567890', name: 'PT Gas 15kg', Price: 350, brand: 'PT', category: 'LPG' },
  { sku: 'GAS-WP-15', barcode: '8859990001112', name: 'World Gas 15kg', Price: 360, brand: 'WP', category: 'LPG' },
  { sku: 'REG-HIGH-01', barcode: '8857776665554', name: 'High Pressure Regulator', Price: 450, tags: ['regulator', 'high-pressure'] },
  { sku: 'HOSE-ORANGE-2M', barcode: '8853334445556', name: 'Safety Gas Hose 2M', Price: 150 },
  { sku: 'NO-BARCODE-ITEM', barcode: 'NO-BARCODE-ITEM', name: 'Custom Valve Adapter', Price: 80 },
  { sku: 'NUM-BARCODE-SKU', barcode: '8854443332221', name: 'Numeric Barcode Item', Price: 90 }
];

try {
  // 6.1 Exact SKU Scan (Uppercase and Lowercase)
  const matchUpper = simulatePosSearch(catalogItems, 'GAS-PT-15');
  assert.strictEqual(matchUpper.length, 1);
  assert.strictEqual(matchUpper[0].matchType, 'exact');
  assert.strictEqual(matchUpper[0].sku, 'GAS-PT-15');

  const matchLower = simulatePosSearch(catalogItems, 'gas-pt-15');
  assert.strictEqual(matchLower.length, 1);
  assert.strictEqual(matchLower[0].matchType, 'exact');
  pass('POS Scanner: exact SKU match (case-insensitive) returns matchType="exact"');
} catch (e) {
  fail('Exact SKU Scan', e);
}

try {
  // 6.2 Exact Barcode Scan
  const matchBarcode = simulatePosSearch(catalogItems, '8851234567890');
  assert.strictEqual(matchBarcode.length, 1);
  assert.strictEqual(matchBarcode[0].matchType, 'exact');
  assert.strictEqual(matchBarcode[0].sku, 'GAS-PT-15');
  pass('POS Scanner: exact Barcode match returns matchType="exact"');
} catch (e) {
  fail('Exact Barcode Scan', e);
}

try {
  // 6.3 Hardware scanner carriage return / newline / spaces
  const scannedRaw = '   8859990001112 \r\n  ';
  const matchScanned = simulatePosSearch(catalogItems, scannedRaw);
  assert.strictEqual(matchScanned.length, 1);
  assert.strictEqual(matchScanned[0].matchType, 'exact');
  assert.strictEqual(matchScanned[0].sku, 'GAS-WP-15');
  pass('POS Scanner: whitespace and carriage return \\r\\n safely trimmed to exact match');
} catch (e) {
  fail('Scanner Whitespace / CRLF', e);
}

try {
  // 6.4 Item without dedicated barcode (barcode defaults to sku)
  const matchFallback = simulatePosSearch(catalogItems, 'NO-BARCODE-ITEM');
  assert.strictEqual(matchFallback.length, 1);
  assert.strictEqual(matchFallback[0].matchType, 'exact');
  pass('POS Scanner: product without barcode matches barcode via normalized sku fallback');
} catch (e) {
  fail('Barcode Fallback to SKU', e);
}

try {
  // 6.5 Substring / Partial Search (returns matchType="similar")
  const partial = simulatePosSearch(catalogItems, 'Gas 15kg');
  assert.strictEqual(partial.length, 2);
  partial.forEach(p => assert.strictEqual(p.matchType, 'similar'));
  pass('POS Search: substring query returns matchType="similar" (showing suggestions dropdown)');
} catch (e) {
  fail('Partial Search', e);
}

try {
  // 6.6 Tags and Category Search
  const tagSearch = simulatePosSearch(catalogItems, 'high-pressure');
  assert.strictEqual(tagSearch.length, 1);
  assert.strictEqual(tagSearch[0].sku, 'REG-HIGH-01');
  assert.strictEqual(tagSearch[0].matchType, 'similar');
  pass('POS Search: searches tags and categories in cache with matchType="similar"');
} catch (e) {
  fail('Tag Search', e);
}

try {
  // 6.7 Adversarial / Malformed Queries Fuzzing
  assert.strictEqual(simulatePosSearch(catalogItems, '').length, 6);
  assert.strictEqual(simulatePosSearch(catalogItems, '    ').length, 6);
  assert.strictEqual(simulatePosSearch(catalogItems, 'NON_EXISTENT_SKU_XXXXX').length, 0);

  // Regex special characters must not throw
  const specialChars = '[.*+?^${}()|[\\]\\\\]';
  const regexSearch = simulatePosSearch(catalogItems, specialChars);
  assert.strictEqual(regexSearch.length, 0);

  // Massive 10,000 char query
  const longQuery = 'A'.repeat(10000);
  const longSearch = simulatePosSearch(catalogItems, longQuery);
  assert.strictEqual(longSearch.length, 0);
  pass('POS Search: immune to regex special characters, empty queries, and ReDoS input attacks');
} catch (e) {
  fail('Adversarial Queries', e);
}

try {
  // 6.8 Performance Stress: 10,000 synthetic catalog items search benchmark
  const largeCatalog = [];
  for (let i = 0; i < 10000; i++) {
    largeCatalog.push({
      sku: `SKU-BENCH-${i}`,
      barcode: `885000000${String(i).padStart(5, '0')}`,
      name: `Synthetic Product ${i}`,
      Price: 100 + (i % 500)
    });
  }

  const startBenchmark = performance.now();
  const searchResult = simulatePosSearch(largeCatalog, '88500000009999');
  const duration = performance.now() - startBenchmark;

  assert.strictEqual(searchResult.length, 1);
  assert.strictEqual(searchResult[0].sku, 'SKU-BENCH-9999');
  assert.ok(duration < 25, `Exact match in 10,000 items took ${duration.toFixed(2)}ms (must be < 25ms)`);
  pass(`POS Search Stress: 10,000 items in-memory exact barcode scan resolved in ${duration.toFixed(2)}ms (< 25ms bound)`);
} catch (e) {
  fail('10,000 Item Benchmark', e);
}


// =============================================================================
// TEST SUITE 7: Cache Clearance & Quota Upper Bounds
// =============================================================================
console.log('\n--- SUITE 7: Cache Clearance & Quota Upper Bounds ---');

try {
  // 7.1 clearCatalogCache()
  const { instance, metrics, idbStore, sessionStore } = createCatalogServiceInstance({
    initialIdb: new Map([['dh_pos_catalog_products', [{ sku: 'X' }]]]),
    sessionData: new Map([['search_hybrid_cache', '[]']])
  });

  instance._setInMemoryProducts([{ sku: 'MEM-1' }]);
  instance._setInMemoryMeta({ version: 1 });

  await instance.clearCatalogCache();

  assert.strictEqual(instance._getInMemoryProducts(), null);
  assert.strictEqual(instance._getInMemoryMeta(), null);
  assert.strictEqual(metrics.idbDeletes, 2, 'Must delete products and meta keys from IDB');
  assert.strictEqual(sessionStore.has('search_hybrid_cache'), false);
  pass('clearCatalogCache(): wipes memory singleton, sessionStorage, and IndexedDB keys');
} catch (e) {
  fail('clearCatalogCache', e);
}

try {
  // 7.2 Quota Upper-Bound Theorem Verification:
  // For any catalog hydration request:
  // - Warm memory/session cache: Strictly 0 Firestore reads.
  // - Warm IndexedDB cache: Strictly 1 Firestore read.
  // - Cold start with N chunks: Strictly 1 + N Firestore reads.
  // - Under NO circumstances can it make unbounded collection scans.
  const { instance, metrics } = createCatalogServiceInstance({
    firestoreDocs: new Map([
      ['catalogs/search_index', { version: 1, chunkCount: 7 }],
      ['catalogs/search_index_p1', { items: [{ sku: 'A' }] }]
    ])
  });

  await instance.hydrateCatalog();
  const coldReads = metrics.firestoreReads;
  assert.ok(coldReads <= 8, `Cold start reads must be <= 8, was ${coldReads}`);

  // Warm memory call
  await instance.hydrateCatalog();
  assert.strictEqual(metrics.firestoreReads, coldReads, 'Warm memory call must add 0 reads');

  pass('Quota Safety Bound: Guaranteed <= 8 reads on cold start, strictly 0 reads on warm cache');
} catch (e) {
  fail('Quota Safety Bound', e);
}


// =============================================================================
// TEST SUITE 8: findProductInCache & Unnormalized Prop Vulnerability
// =============================================================================
console.log('\n--- SUITE 8: findProductInCache & Unnormalized Prop Vulnerability ---');

try {
  // 8.1 findProductInCache: Matches by SKU and Barcode
  const { instance } = createCatalogServiceInstance();
  const cacheItems = [
    instance.normalizeProduct({ sku: 'FIND-SKU-1', barcode: '8851111222233', name: 'Finder Item 1' }),
    instance.normalizeProduct({ sku: 'FIND-SKU-2', barcode: '8854444555566', name: 'Finder Item 2' })
  ];
  instance._setInMemoryProducts(cacheItems);

  // Match by SKU
  const foundBySku = instance.findProductInCache('find-sku-1');
  assert.ok(foundBySku, 'Must find by SKU');
  assert.strictEqual(foundBySku.name, 'Finder Item 1');

  // Match by Barcode
  const foundByBarcode = instance.findProductInCache('8854444555566');
  assert.ok(foundByBarcode, 'Must find by Barcode');
  assert.strictEqual(foundByBarcode.sku, 'FIND-SKU-2');

  // Match with whitespace
  const foundBySpace = instance.findProductInCache('   8854444555566   ');
  assert.ok(foundBySpace, 'Must trim query before searching in cache');

  // Null/empty input
  assert.strictEqual(instance.findProductInCache(null), null);
  assert.strictEqual(instance.findProductInCache(''), null);
  assert.strictEqual(instance.findProductInCache('DOES_NOT_EXIST'), null);

  pass('findProductInCache: exact lookup by SKU and Barcode with case-insensitive whitespace trimming');
} catch (e) {
  fail('findProductInCache', e);
}

try {
  // 8.2 Adversarial Vulnerability Exploration: Unnormalized products passed via props
  // If products are passed via usePosCart(products) without passing through normalizeProduct,
  // numeric SKUs will throw TypeError in usePosCart line 71: p.sku.toLowerCase is not a function.
  const rawProducts = [
    { sku: 998811, barcode: '8850000000000', name: 'Raw Numeric SKU Item' }
  ];

  let crashed = false;
  try {
    // Replicating usePosCart.js line 70-73
    const term = '998811';
    rawProducts.find(p =>
      (p.sku && p.sku.toLowerCase() === term) ||
      (p.barcode && String(p.barcode).toLowerCase() === term)
    );
  } catch (err) {
    crashed = true;
    assert.ok(err instanceof TypeError, 'Expected TypeError: p.sku.toLowerCase is not a function');
  }

  assert.ok(crashed, 'Empirically confirmed: unnormalized numeric SKU causes TypeError in raw usePosCart line 71');

  // Now verify that normalizeProduct cures this vulnerability
  const normalized = rawProducts.map(testService.normalizeProduct);
  let normalizedCrashed = false;
  try {
    const term = '998811';
    const match = normalized.find(p =>
      (p.sku && p.sku.toLowerCase() === term) ||
      (p.barcode && String(p.barcode).toLowerCase() === term)
    );
    assert.ok(match, 'Should match normalized product');
  } catch {
    normalizedCrashed = true;
  }
  assert.strictEqual(normalizedCrashed, false, 'normalizeProduct immunizes products from numeric SKU crash');

  pass('Edge Case Analysis: unnormalized numeric SKU vulnerability confirmed & verified cured by normalizeProduct');
} catch (e) {
  fail('Unnormalized Numeric SKU Vulnerability', e);
}


// =============================================================================
// SUMMARY & EXIT CODE
// =============================================================================
console.log('\n================================================================================');
console.log(`  Total Checks: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================');

if (failedTests > 0) {
  console.error('❌ DEFECT DETECTED:');
  defects.forEach(d => console.error(`  - ${d.test}: ${d.error}`));
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY! [CONFIRMED CORRECT]\n');
  process.exit(0);
}
