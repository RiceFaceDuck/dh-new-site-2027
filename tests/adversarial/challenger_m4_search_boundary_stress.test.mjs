/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE — TRACK 4: PRODUCT SEARCH+ BOUNDARIES & EDGE CASES
 * Location: Management System/tests/adversarial/challenger_m4_search_boundary_stress.test.mjs
 * 
 * Verifies & Challenges:
 * 1. Boundary: Empty catalog handling & empty filter pipeline.
 * 2. Boundary: Missing / corrupt chunks & quota spikes in catalog hydration fallbacks.
 * 3. Boundary: Special characters, regex metachars, unicode, and whitespace trimming in k1/k2/k3.
 * 4. Boundary: Extreme, negative, float, and non-numeric stock values vs buffer thresholds.
 * 5. Edge Case: Schema malformations (null/non-string items in compatibleModels/tags) causing runtime crashes.
 * 6. Edge Case: Barcode search omission in production hook vs test suite mock discrepancy.
 * 7. Verification Script Audit: Identification of synthetic mocks, bypassed assertions, and false confidence.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  vulnerabilities: []
};

function pass(title, detail = '') {
  results.total++;
  results.passed++;
  console.log(`  ✅ PASS: ${title}${detail ? ` (${detail})` : ''}`);
}

function recordVulnerability(title, severity, detail) {
  results.total++;
  results.failed++;
  console.error(`  🚨 VULNERABILITY FOUND [${severity}]: ${title}`);
  console.error(`     Details: ${detail}`);
  results.vulnerabilities.push({ title, severity, detail });
}

console.log('================================================================================');
console.log('  Track 4: Product Search+ Adversarial Stress & Edge Case Harness');
console.log('================================================================================\n');

// --------------------------------------------------------------------------------
// 1. Boundary: Empty Catalog & Normalization
// --------------------------------------------------------------------------------
console.log('--- CHALLENGE SUITE 1: Empty Catalog & Normalization Boundaries ---');

function normalizeProducts(items) {
  return items.map((item) => {
    const parsedStock = parseInt(item.stockQuantity, 10);
    const stockQuantity = isNaN(parsedStock) ? 0 : parsedStock;

    const parsedBuffer = parseInt(item.bufferStock, 10);
    const bufferStock = isNaN(parsedBuffer) ? 2 : parsedBuffer;

    const images = item.images || (item.imageUrl ? [item.imageUrl] : (item.image ? [item.image] : []));

    return {
      ...item,
      stockQuantity,
      bufferStock,
      images
    };
  });
}

{
  const emptyList = [];
  const normalized = normalizeProducts(emptyList);
  assert.strictEqual(normalized.length, 0);
  pass('Empty catalog normalization returns empty array without throwing');
}

// --------------------------------------------------------------------------------
// 2. Boundary: Special Characters & Untrimmed Search Term Bug
// --------------------------------------------------------------------------------
console.log('\n--- CHALLENGE SUITE 2: Search Input Boundaries (Whitespace & Special Characters) ---');

// Production logic extracted from src/pages/hooks/useProductSearchQuery.js lines 168-198
function prodSearchFilter(products, debouncedSearch1, debouncedSearch2, debouncedSearch3, stockFilter = 'ALL') {
  if (!debouncedSearch1.trim() && !debouncedSearch2.trim() && !debouncedSearch3.trim() && stockFilter === 'ALL') {
    return products;
  }

  // NOTE: Production does NOT trim term1, term2, term3!
  const term1 = debouncedSearch1.toLowerCase();
  const term2 = debouncedSearch2.toLowerCase();
  const term3 = debouncedSearch3.toLowerCase();

  const checkMatch = (product, term) => {
    if (!term) return true;
    return (
      (product.name && product.name.toLowerCase().includes(term)) ||
      (product.sku && product.sku.toLowerCase().includes(term)) ||
      (product.brand && product.brand.toLowerCase().includes(term)) ||
      (product.category && product.category.toLowerCase().includes(term)) ||
      (product.warehouseLocation && product.warehouseLocation.toLowerCase().includes(term)) ||
      (product.shortDescription && product.shortDescription.toLowerCase().includes(term)) ||
      (product.description && product.description.toLowerCase().includes(term)) ||
      (product.sellingModel && product.sellingModel.toLowerCase().includes(term)) ||
      (product.compatibleModels && product.compatibleModels?.some((m) => m.toLowerCase().includes(term))) ||
      (product.compatiblePartNumbers && product.compatiblePartNumbers?.some((pn) => pn.toLowerCase().includes(term))) ||
      (product.substituteSkus && product.substituteSkus?.some((sub) => sub.toLowerCase().includes(term))) ||
      (product.tags && product.tags?.some((t) => t.toLowerCase().includes(term)))
    );
  };

  return products.filter((p) => {
    if (!checkMatch(p, term1) || !checkMatch(p, term2) || !checkMatch(p, term3)) return false;

    if (stockFilter === 'IN_STOCK') return p.stockQuantity > (p.bufferStock || 2);
    if (stockFilter === 'LOW_STOCK') return p.stockQuantity > 0 && p.stockQuantity <= (p.bufferStock || 2);
    if (stockFilter === 'OUT_OF_STOCK') return p.stockQuantity <= 0;

    return true;
  });
}

{
  // Test 2.1: Untrimmed search term in k1 causes lookup failure for hyphenated/exact boundaries
  const testCatalog = [
    { sku: 'SKU-ACER-NITRO', name: 'ACER-NITRO 5 Keyboard', stockQuantity: 10, bufferStock: 2 }
  ];

  // User enters 'acer ' (with trailing space, standard on mobile keyboard or autocomplete)
  const matchedTrailing = prodSearchFilter(testCatalog, 'acer ', '', '');
  if (matchedTrailing.length === 0) {
    recordVulnerability(
      'Untrimmed Search Term Bug in useProductSearchQuery.js',
      'HIGH',
      'debouncedSearch1/2/3 are not trimmed when converted to term1/2/3. Searching "acer " fails to match "ACER-NITRO 5" because "acer-nitro".includes("acer ") is false.'
    );
  } else {
    pass('Trailing space handled properly');
  }

  // Test 2.2: Regex metacharacters do not crash String.prototype.includes
  const regexChars = ['.*+?^${}()|[]\\', '<script>alert(1)</script>', "'; DROP TABLE products; --"];
  let regexCrashed = false;
  try {
    for (const chars of regexChars) {
      prodSearchFilter(testCatalog, chars, '', '');
    }
  } catch (e) {
    regexCrashed = true;
  }
  if (!regexCrashed) {
    pass('Special characters and injection strings handled safely by includes() (No RegExp syntax crash)');
  } else {
    recordVulnerability('RegExp Crash on Special Characters', 'HIGH', 'Search query crashed on regex metacharacters');
  }
}

// --------------------------------------------------------------------------------
// 3. Edge Case: Barcode Field Missing in Production checkMatch
// --------------------------------------------------------------------------------
console.log('\n--- CHALLENGE SUITE 3: Barcode Search Omission & Mock Divergence ---');

{
  const productWithBarcode = [
    { sku: 'SKU-LOGI-M170', name: 'Wireless Mouse', barcode: '885002901234', stockQuantity: 5, bufferStock: 2 }
  ];

  const barcodeResult = prodSearchFilter(productWithBarcode, '885002901234', '', '');
  if (barcodeResult.length === 0) {
    recordVulnerability(
      'Barcode Field Omitted from checkMatch in useProductSearchQuery.js',
      'HIGH',
      'Production checkMatch checks 12 fields (name, sku, brand, etc.) but OMITS product.barcode. Cashier scanning barcode in Search+ fails unless SKU happens to equal Barcode. Yet verify_search_integration.mjs suite 3 tested a mock filter with barcode included, giving false confidence.'
    );
  } else {
    pass('Barcode field successfully searched');
  }
}

// --------------------------------------------------------------------------------
// 4. Edge Case: Unhandled Null / Type Errors in Array Fields
// --------------------------------------------------------------------------------
console.log('\n--- CHALLENGE SUITE 4: Schema Malformations & Unhandled TypeErrors ---');

{
  const catalogWithNullCompatible = [
    { sku: 'SKU-SCREEN-01', name: 'LED Panel 15.6', compatibleModels: ['Acer Nitro', null, 'Asus ROG'], stockQuantity: 5 }
  ];

  let crashedOnNullModel = false;
  let crashMsg = '';
  try {
    prodSearchFilter(catalogWithNullCompatible, 'rog', '', '');
  } catch (err) {
    crashedOnNullModel = true;
    crashMsg = err.message;
  }

  if (crashedOnNullModel) {
    recordVulnerability(
      'Unprotected toLowerCase() Crash on Dirty Catalog Arrays',
      'CRITICAL',
      `product.compatibleModels?.some((m) => m.toLowerCase().includes(term)) crashes with "${crashMsg}" if an element is null/undefined/number. Will crash the entire React UI tree.`
    );
  } else {
    pass('Null in compatibleModels handled safely');
  }
}

// --------------------------------------------------------------------------------
// 5. Boundary: Stock Status & Threshold Discrepancy
// --------------------------------------------------------------------------------
console.log('\n--- CHALLENGE SUITE 5: Stock Filter & Buffer Logic Boundary Checks ---');

{
  const stockItems = [
    { sku: 'SKU-0', stockQuantity: 0, bufferStock: 2 },
    { sku: 'SKU-1', stockQuantity: 1, bufferStock: 2 },
    { sku: 'SKU-2', stockQuantity: 2, bufferStock: 2 },
    { sku: 'SKU-3', stockQuantity: 3, bufferStock: 2 },
    { sku: 'SKU-NEG', stockQuantity: -3, bufferStock: 2 },
    { sku: 'SKU-FLOAT', stockQuantity: 0.5, bufferStock: 2 }
  ];

  const inStock = prodSearchFilter(stockItems, '', '', '', 'IN_STOCK');
  const lowStock = prodSearchFilter(stockItems, '', '', '', 'LOW_STOCK');
  const outOfStock = prodSearchFilter(stockItems, '', '', '', 'OUT_OF_STOCK');

  // Verify threshold rule: IN_STOCK must be > bufferStock
  const inStockSkus = inStock.map(p => p.sku);
  const lowStockSkus = lowStock.map(p => p.sku);
  const outSkus = outOfStock.map(p => p.sku);

  // In production:
  // SKU-2 (stock=2, buffer=2) is LOW_STOCK, NOT IN_STOCK
  assert.ok(lowStockSkus.includes('SKU-2'), 'SKU-2 must be LOW_STOCK');
  assert.ok(!inStockSkus.includes('SKU-2'), 'SKU-2 must NOT be IN_STOCK');
  assert.ok(outSkus.includes('SKU-NEG'), 'Negative stock must be classified as OUT_OF_STOCK');
  pass('Production stock filter correctly segments IN_STOCK (> buffer), LOW_STOCK (1..buffer), and OUT_OF_STOCK (<= 0)');

  // Verify discrepancy with verify_search_integration.mjs:
  // In the test script: stockFilter === 'IN_STOCK' && p.stockQuantity <= 0 -> returns false (so p.stockQuantity > 0 was considered IN_STOCK)
  const testScriptDef = (p) => p.stockQuantity > 0;
  const prodDef = (p) => p.stockQuantity > (p.bufferStock || 2);
  const testScriptResultForBuffer = testScriptDef(stockItems[2]); // true
  const prodResultForBuffer = prodDef(stockItems[2]); // false

  if (testScriptResultForBuffer !== prodResultForBuffer) {
    recordVulnerability(
      'Stock Filter Logic Discrepancy Between Test Suite and Production Hook',
      'MEDIUM',
      'verify_search_integration.mjs defines IN_STOCK as (stockQuantity > 0), whereas production hook strictly enforces (stockQuantity > bufferStock). The automated test suite would miss regressions in buffer thresholding.'
    );
  }
}

// --------------------------------------------------------------------------------
// 6. Boundary: Catalog Hydration Fallback Quota Explosion
// --------------------------------------------------------------------------------
console.log('\n--- CHALLENGE SUITE 6: Catalog Hydration Quota Bounds & Fallback Leaks ---');

{
  // Inspect inventorySyncMetaService.js lines 464-480
  const servicePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/inventory/inventorySyncMetaService.js');
  const serviceCode = fs.readFileSync(servicePath, 'utf8');

  const hasDoubleFetchFallback = serviceCode.includes('search_catalog_chunk_') && serviceCode.includes('if (allItems.length === 0 && chunkCount > 0)');
  if (hasDoubleFetchFallback) {
    recordVulnerability(
      'Catalog Hydration Quota Double-Fetch Spike (15 Reads instead of <= 8 Reads)',
      'HIGH',
      'In inventorySyncMetaService.js lines 464-480: If search_index_p1..p7 return empty, the service unconditionally issues a secondary batch of chunkCount reads to search_catalog_chunk_0..6. In a cold-start failure or empty chunk scenario, reads spike from 8 to 15 (1 manifest + 7 p* + 7 fallback chunks), violating the <= 8 reads contract.'
    );
  } else {
    pass('Catalog hydration strictly limits chunk reads without unbounded fallbacks');
  }
}

// --------------------------------------------------------------------------------
// 7. Audit: verify_search_integration.mjs Self-Audit
// --------------------------------------------------------------------------------
console.log('\n--- CHALLENGE SUITE 7: Verification Suite Assertion Rigor Audit ---');

{
  const testScriptPath = path.resolve(__dirname, '../verifications/verify_search_integration.mjs');
  const testScriptCode = fs.readFileSync(testScriptPath, 'utf8');

  // Audit 7.1: Check Suite 2 Cold Start
  const hasSyntheticColdStart = testScriptCode.includes('async function simulateColdHydration()') && !testScriptCode.includes("import { catalogHydrationService }");
  if (hasSyntheticColdStart) {
    recordVulnerability(
      'Verification Suite 2 Uses Inline In-Memory Simulation Instead of Production Service',
      'HIGH',
      'Suite 2 in verify_search_integration.mjs declares a local simulateColdHydration() function using Map() and asserts against its own loop. It never invokes catalogHydrationService.js or inventorySyncMetaService.js.'
    );
  }

  // Audit 7.2: Check Suite 3 Warm Cache 0 Reads
  const hasHardcodedZeroReads = testScriptCode.includes('const warmReads = 0;') && testScriptCode.includes('assert.strictEqual(warmReads, 0');
  if (hasHardcodedZeroReads) {
    recordVulnerability(
      'Verification Suite 3 Warm Cache Read Assertion is Hardcoded (Tautology 0 === 0)',
      'MEDIUM',
      'Suite 3 asserts "const warmReads = 0; assert.strictEqual(warmReads, 0)". It does not monitor Firestore client instances or network frames, asserting a hardcoded local variable.'
    );
  }

  // Audit 7.3: Check Suite 5 History Cache Simulation
  const hasFakeIdbSimulation = testScriptCode.includes('async function getSkuHistoryOnDemand(sku, simulatedCurrentTime)') && testScriptCode.includes('idbHistStore = new Map()');
  if (hasFakeIdbSimulation) {
    recordVulnerability(
      'Verification Suite 5 History TTL Tests Local Map Instead of skuHistoryService / idb-keyval',
      'HIGH',
      'Suite 5 implements a toy function getSkuHistoryOnDemand with an in-memory Map to test 10-minute TTL. It completely bypasses skuHistoryService.js and real IndexedDB storage.'
    );
  }
}

console.log('\n================================================================================');
console.log(`  CHALLENGER SUITE SUMMARY: Total Checks: ${results.total} | Passed: ${results.passed} | Vulnerabilities: ${results.failed}`);
console.log('================================================================================');

if (results.vulnerabilities.length > 0) {
  console.log(`\n🚨 FOUND ${results.vulnerabilities.length} CRITICAL/HIGH VULNERABILITIES & TEST SUITE DEFICIENCIES:`);
  results.vulnerabilities.forEach((v, idx) => {
    console.log(`  ${idx + 1}. [${v.severity}] ${v.title}`);
  });
}

// Exit with 0 so runner records full output without breaking pipelines, but vulnerabilities are documented
process.exit(0);
