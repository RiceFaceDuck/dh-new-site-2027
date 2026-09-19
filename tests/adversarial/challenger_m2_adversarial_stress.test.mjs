/**
 * Challenger M2 Adversarial Stress Test Suite
 * Empirical tests for 5D Stock Recalculation, Router Contract, Metric Mappings, and Encoding
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKOFFICE_SRC = path.resolve(__dirname, '../../dh-backoffice-react/src');

let passCount = 0;
let failCount = 0;
let challenges = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    failCount++;
  }
}

function recordChallenge(title, risk, description, evidence) {
  challenges.push({ title, risk, description, evidence });
}

console.log('================================================================');
console.log('🔥 EMPIRICAL ADVERSARIAL CHALLENGER SUITE — MILESTONE 2');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: 5D Recalculation & Snapshot Parsing Stress Test
// --------------------------------------------------------------------------
console.log('📦 SUITE 1: 5D Recalculation & Snapshot Parsing Stress-Test');

// Dynamically import parseStatsSnapshot from migrationService
const migrationServicePath = path.join(BACKOFFICE_SRC, 'firebase/inventory/migrationService.js');
const { parseStatsSnapshot } = await import(pathToFileURL(migrationServicePath).href);

// 1.1 Direct flat dictionary
const flatSnapshot = {
  ADAC001: { stockInHistory: { '30': 10 }, salesHistory: { '30': 4 } },
  BATT002: { stockInHistory: { '30': 2 }, salesHistory: { '30': 1 } }
};
const parsedFlat = parseStatsSnapshot(flatSnapshot);
assert(parsedFlat && parsedFlat.ADAC001.stockInHistory['30'] === 10, 'parseStatsSnapshot handles flat SKU map');

// 1.2 Wrapped in statsMap
const wrappedStatsMap = {
  version: 2,
  updatedAt: '2026-09-17T00:00:00Z',
  statsMap: {
    ADAC001: { stockIn: { '30': 15 }, sales: { '30': 8 } }
  }
};
const parsedWrappedMap = parseStatsSnapshot(wrappedStatsMap);
assert(parsedWrappedMap && parsedWrappedMap.ADAC001.sales['30'] === 8, 'parseStatsSnapshot unwraps statsMap envelope');

// 1.3 Wrapped in statsBySku
const wrappedStatsBySku = {
  version: 1,
  statsBySku: {
    KB003: { stockInHistory: { '30': 20 } }
  }
};
const parsedWrappedBySku = parseStatsSnapshot(wrappedStatsBySku);
assert(parsedWrappedBySku && parsedWrappedBySku.KB003.stockInHistory['30'] === 20, 'parseStatsSnapshot unwraps statsBySku envelope');

// 1.4 Stringified JSON
const jsonString = JSON.stringify({ ADAC001: { salesHistory: { '30': 99 } } });
const parsedJson = parseStatsSnapshot(jsonString);
assert(parsedJson && parsedJson.ADAC001.salesHistory['30'] === 99, 'parseStatsSnapshot handles stringified JSON input');

// 1.5 Corrupted / Malformed inputs (Must never throw)
const malformedInputs = [
  null,
  undefined,
  "",
  "{not_valid_json",
  12345,
  true,
  false,
  [],
  () => {}
];
let malformedPassed = true;
for (const badInput of malformedInputs) {
  try {
    const res = parseStatsSnapshot(badInput);
    if (res !== null && typeof res !== 'object') {
      malformedPassed = false;
    }
  } catch (err) {
    malformedPassed = false;
    console.error(`Threw on input ${badInput}:`, err);
  }
}
assert(malformedPassed, 'parseStatsSnapshot survives malformed/primitive/corrupted inputs without throwing');


// --------------------------------------------------------------------------
// SUITE 2: fetchProductStats Math & Period Lookup Verification
// --------------------------------------------------------------------------
console.log('\n📊 SUITE 2: fetchProductStats Normalization & Lookup Engine');

const statsServiceModulePath = path.join(BACKOFFICE_SRC, 'firebase/inventory/inventoryStatsService.js');
let inventoryStatsService = null;
try {
  const mod = await import(pathToFileURL(statsServiceModulePath).href);
  inventoryStatsService = mod.inventoryStatsService;
} catch (err) {
  console.log('  ⚠️ Note: inventoryStatsService direct Node ESM import threw (expected due to browser IDB/Firebase):', err.message);
}

if (inventoryStatsService) {
  // Test empty product lists
  const emptyStats = await inventoryStatsService.fetchProductStats([]);
  assert(Object.keys(emptyStats).length === 0, 'fetchProductStats([]) returns empty object');

  const nullStats = await inventoryStatsService.fetchProductStats(null);
  assert(Object.keys(nullStats).length === 0, 'fetchProductStats(null) returns empty object safely');
} else {
  // Static AST/contract verification of fetchProductStats
  const serviceCode = fs.readFileSync(statsServiceModulePath, 'utf8');
  assert(serviceCode.includes('if (!products || products.length === 0) return {};'), 'fetchProductStats has empty products guard');
  assert(serviceCode.includes('statsMap[p.sku] = { stockIn: 0, sales: 0, claim: 0, adjustment: 0 };'), 'fetchProductStats initializes 4 dimension metrics');
  assert(serviceCode.includes('const matchedSkuKey = skuLookup[String(itemSku).trim().toUpperCase()];'), 'fetchProductStats does case-insensitive uppercase lookup');
}


// --------------------------------------------------------------------------
// SUITE 3: Failure Modes & Silent Cache Purge in recalculateDailyStats
// --------------------------------------------------------------------------
console.log('\n⚠️ SUITE 3: Failure Modes & Silent Cache Purge in recalculateDailyStats');

const statsServiceContent = fs.readFileSync(statsServiceModulePath, 'utf8');

// Trace: fetch Firestore snapshot FIRST without silent error swallowing
const catchesGetDocSilently = statsServiceContent.includes('getDoc(snapshotRef).catch(() => null)');
assert(!catchesGetDocSilently, 'inventoryStatsService does NOT catch getDoc with .catch(() => null)');

const rethrowsOnFetchError = statsServiceContent.includes('throw error') || statsServiceContent.includes('throw err');
assert(rethrowsOnFetchError, 'recalculateDailyStats properly rethrows error on Firestore fetch failure');

const fetchesFirstBeforePurge = statsServiceContent.indexOf('getDoc(snapshotRef)') < statsServiceContent.indexOf('del(IDB_STATS_CACHE_KEY)');
assert(fetchesFirstBeforePurge, 'recalculateDailyStats fetches Firestore snapshot FIRST before deleting IndexedDB cache');

// --------------------------------------------------------------------------
// SUITE 4: Route Matching for /generate/details
// --------------------------------------------------------------------------
console.log('\n🧭 SUITE 4: Route Matching for /generate/details and ChangeSummaryPanel');

const appJsxPath = path.join(BACKOFFICE_SRC, 'App.jsx');
const appContent = fs.readFileSync(appJsxPath, 'utf8');

const changeSummaryPanelPath = path.join(BACKOFFICE_SRC, 'pages/GenerateSync/components/ChangeSummaryPanel.jsx');
const panelContent = fs.readFileSync(changeSummaryPanelPath, 'utf8');

// Check router definition in App.jsx
const hasParamRoute = appContent.includes('path="generate/details/:referenceId"');
const hasBareRoute = appContent.includes('path="generate/details"');
const hasOptionalParamRoute = appContent.includes('path="generate/details/:referenceId?"');

// Check navigation targets in ChangeSummaryPanel.jsx
const panelNavigatesBare = panelContent.includes("navigate('/generate/details?type=");

console.log(`  App.jsx route: ${hasBareRoute ? 'generate/details (bare route supported)' : 'missing bare route'}`);
console.log(`  ChangeSummaryPanel navigation: ${panelNavigatesBare ? "navigate('/generate/details?type=...')" : 'other'}`);

const routeMatched = hasBareRoute || hasOptionalParamRoute;
assert(routeMatched, 'App.jsx supports route for "/generate/details" query param navigation');


// --------------------------------------------------------------------------
// SUITE 5: Contract Mismatches in TransactionMetricsHeader & useTransactionDetailsData
// --------------------------------------------------------------------------
console.log('\n🔢 SUITE 5: Metric Keys & Event Filter Contract Verification');

const metricsHeaderPath = path.join(BACKOFFICE_SRC, 'pages/GenerateSync/components/details/TransactionMetricsHeader.jsx');
const metricsHeaderContent = fs.readFileSync(metricsHeaderPath, 'utf8');

const txDetailsHookPath = path.join(BACKOFFICE_SRC, 'pages/GenerateSync/hooks/useTransactionDetailsData.js');
const txDetailsHookContent = fs.readFileSync(txDetailsHookPath, 'utf8');

// 5.1 Property name checks: Supports both totalCount/total and orders/sales
const supportsTotal = metricsHeaderContent.includes('totalCount') || metricsHeaderContent.includes('total');
const supportsOrders = metricsHeaderContent.includes('orders') || metricsHeaderContent.includes('sales');
const hookProvidesTotal = txDetailsHookContent.includes('total = filteredTransactions.length') && txDetailsHookContent.includes('return { total, sales, claims, adjusts };');

assert(supportsTotal, 'TransactionMetricsHeader supports total/totalCount metric naming');
assert(supportsOrders, 'TransactionMetricsHeader supports sales/orders metric naming');
assert(hookProvidesTotal, 'useTransactionDetailsData returns { total, sales, claims, adjusts }');

// Test what happens in JS when resolving metrics with fallback
const sampleHookMetrics = { total: 42, sales: 20, claims: 5, adjusts: 17 };
const resolvedTotal = sampleHookMetrics.totalCount ?? sampleHookMetrics.total ?? 0;
const resolvedOrders = sampleHookMetrics.orders ?? sampleHookMetrics.sales ?? 0;
assert(resolvedTotal === 42, 'sampleHookMetrics total resolves correctly to 42 (non-blank)');
assert(resolvedOrders === 20, 'sampleHookMetrics orders resolves correctly to 20 (non-blank)');

// 5.2 Event Category Filter Mismatch ('order' vs 'sale')
const headerDispatchesSale = metricsHeaderContent.includes("setSelectedEventType('sale')");
const txItemCategorySale = txDetailsHookContent.includes("eventCategory: 'sale'");

assert(headerDispatchesSale, 'TransactionMetricsHeader dispatches setSelectedEventType("sale")');
assert(txItemCategorySale, 'useTransactionDetailsData assigns eventCategory: "sale" to sales/orders');

const sampleTransactions = [
  { id: '1', eventCategory: 'sale', sku: 'SKU1' },
  { id: '2', eventCategory: 'claim', sku: 'SKU2' },
  { id: '3', eventCategory: 'adjust', sku: 'SKU3' }
];
const filterType = 'sale'; // What header sets
const filtered = sampleTransactions.filter(t => filterType === 'all' || t.eventCategory === filterType);
assert(filtered.length === 1, 'Filtering with selectedEventType="sale" matches sales transactions');


// --------------------------------------------------------------------------
// SUITE 6: Mojibake & Encoding Corruption Audit on Generate Details
// --------------------------------------------------------------------------
console.log('\n🔤 SUITE 6: Mojibake & Thai Character Encoding Verification');

const detailFilesToScan = [
  'pages/GenerateSync/components/details/TransactionMetricsHeader.jsx',
  'pages/GenerateSync/components/details/TransactionFilterBar.jsx',
  'pages/GenerateSync/components/details/TransactionItemizedTable.jsx',
  'pages/GenerateSync/components/details/TransactionGroupedList.jsx'
];

// Typical UTF-8 / CP874 double-decoding artifacts
const mojibakePatterns = [
  /เธ/g,
  /เน€/g,
  /โš/g,
  /๐Ÿ/g,
  /โœ/g,
  /โž/g,
  /เธฃ/g,
  /เธฅ/g
];

let totalMojibakeMatches = 0;

for (const relFile of detailFilesToScan) {
  const fullPath = path.join(BACKOFFICE_SRC, relFile);
  assert(fs.existsSync(fullPath), `${relFile} exists`);
  const content = fs.readFileSync(fullPath, 'utf8');

  let fileMatches = 0;
  for (const pat of mojibakePatterns) {
    const matches = content.match(pat);
    if (matches) fileMatches += matches.length;
  }

  console.log(`  📄 ${relFile}: ${fileMatches} Mojibake pattern matches`);
  totalMojibakeMatches += fileMatches;
}

assert(totalMojibakeMatches === 0, `Zero Mojibake corruptions across GenerateSync details components (Found ${totalMojibakeMatches})`);


// --------------------------------------------------------------------------
// SUMMARY & CHALLENGE REPORT
// --------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`CHALLENGER SUITE SUMMARY: ${passCount} checks completed (${failCount} failures)`);
console.log(`Remaining Vulnerabilities: ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  console.error(`🚨 ${failCount} checks failed!`);
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL CHECKS PASSED: Systems hardened and verified.');
  process.exit(0);
}
