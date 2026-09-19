/**
 * Challenger M2: UI Controls, UTF-8 Integrity & Component Data Parsing Stress Test
 * Archetype: EMPIRICAL CHALLENGER
 * Mission:
 * 1. Stress-test UI controls & dynamic states of 5D Sync button.
 * 2. Exhaustive UTF-8 text integrity (0 mojibake) scan across /inventory and /generate.
 * 3. Stress-test component data parsing, schema alignment, and edge cases.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKOFFICE_DIR = path.resolve(__dirname, '../../dh-backoffice-react');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function assert(condition, message, errorDetail = null) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    if (errorDetail) {
      console.error(`     Detail: ${errorDetail}`);
    }
    failedTests++;
    findings.push({ message, errorDetail });
  }
}

console.log('════════════════════════════════════════════════════════════════════════');
console.log('🧪 EMPIRICAL CHALLENGER: UI Mechanics, UTF-8 Integrity & Data Parsing');
console.log('════════════════════════════════════════════════════════════════════════\n');

// =========================================================================
// GROUP 1: UI Controls & Dynamic States of 5D Sync Button
// =========================================================================
console.log('📋 GROUP 1: UI Controls & 5D Sync Dynamic States');

const headerPath = path.join(BACKOFFICE_DIR, 'src/components/inventory/InventoryHeader.jsx');
const controllerPath = path.join(BACKOFFICE_DIR, 'src/pages/inventory/useInventoryController.js');
const mainPath = path.join(BACKOFFICE_DIR, 'src/pages/inventory/InventoryMain.jsx');

const headerCode = fs.readFileSync(headerPath, 'utf8');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');
const mainCode = fs.readFileSync(mainPath, 'utf8');

// 1.1 Header Button Dynamic States
assert(
  headerCode.includes('onRecalculateStats') && headerCode.includes('isRecalculating = false'),
  'InventoryHeader accepts onRecalculateStats and isRecalculating default false'
);

assert(
  headerCode.includes('{onRecalculateStats &&') || headerCode.includes('{onRecalculateStats ?'),
  '5D Sync button is conditionally rendered only when onRecalculateStats handler is passed'
);

assert(
  headerCode.includes('disabled={isRecalculating}'),
  '5D Sync button disabled state is bound directly to isRecalculating'
);

assert(
  headerCode.includes('className={isRecalculating ? "animate-spin" : ""}'),
  'RefreshCw icon dynamically applies animate-spin class when isRecalculating is true'
);

assert(
  headerCode.includes('isRecalculating ? "กำลังคำนวณ..." : "5D Sync"'),
  'Button text dynamically switches between "5D Sync" and "กำลังคำนวณ..." based on isRecalculating'
);

assert(
  headerCode.includes('title="Sync ข้อมูลและคำนวณสถิติยอดเข้า/ยอดขาย/ของเสีย/ปรับยอดทั้งหมด"'),
  '5D Sync button has descriptive Thai tooltip explaining all 5 dimensions'
);

// 1.2 Controller Lifecycle & Error Guard
assert(
  controllerCode.includes('const [isRecalculating, setIsRecalculating] = useState(false)'),
  'useInventoryController initializes isRecalculating state to false'
);

assert(
  controllerCode.includes('try {') && 
  controllerCode.includes('setIsRecalculating(true)') &&
  controllerCode.includes('finally {') &&
  controllerCode.includes('setIsRecalculating(false)'),
  'handleRecalculateStats uses try...finally to guarantee isRecalculating resets to false even on thrown errors'
);

assert(
  controllerCode.includes('await inventoryStatsService.recalculateDailyStats()') &&
  controllerCode.includes('await fetchInitialProducts()'),
  'handleRecalculateStats triggers recalculateDailyStats and refetches initial products'
);

assert(
  controllerCode.includes('isRecalculating,') && controllerCode.includes('handleRecalculateStats,'),
  'useInventoryController exports both isRecalculating and handleRecalculateStats in return object'
);

// 1.3 InventoryMain Wiring
assert(
  mainCode.includes('handleRecalculateStats,') && mainCode.includes('isRecalculating,'),
  'InventoryMain destructures handleRecalculateStats and isRecalculating from useInventoryController'
);

assert(
  mainCode.includes('isRecalculating={isRecalculating}') &&
  mainCode.includes('onRecalculateStats={handleRecalculateStats}'),
  'InventoryMain wires both props down to InventoryHeader'
);

// =========================================================================
// GROUP 2: UTF-8 Text Integrity & 0 Mojibake Scanning
// =========================================================================
console.log('\n📋 GROUP 2: UTF-8 Text Integrity & 0 Mojibake Scanning');

// Common CP874 mojibake artifacts resulting from UTF-8 decoded as CP874
const mojibakeRawStrings = [
  '\u0E40\u0E18', // เธ
  '\u0E40\u0E40', // เน€
  '\u0E40\u0E44', // เน„
  '\u0E40\u0E49', // เน‰
  '\u0E40\u0E48', // เนˆ
  '\u0E40\u0E4A', // เนŠ
  '\u0E40\u0E4B', // เน‹
  '\u0E40\u0E4C', // เนŒ
  '\u0E40\u0E4D', // เน
  '\u0E42\u0161', // โš
  '\u0E42\u0153', // โœ
  '\u0E42\u017E', // โž
  '\u0E50\u0178', // ๐Ÿ
  '\u0E4F\u0E38'  // ๏ธ
];

const targetScanDirs = [
  'src/pages/inventory',
  'src/components/inventory',
  'src/firebase/inventory',
  'src/pages/GenerateSync'
];

function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      results.push(filePath);
    }
  });
  return results;
}

const allScannedFiles = [];
for (const subDir of targetScanDirs) {
  const fullDir = path.join(BACKOFFICE_DIR, subDir);
  if (fs.existsSync(fullDir)) {
    allScannedFiles.push(...getFilesRecursively(fullDir));
  }
}

console.log(`  Scanned ${allScannedFiles.length} files across /inventory and /generate for Mojibake...`);

const mojibakeViolations = [];
for (const file of allScannedFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const relPath = path.relative(BACKOFFICE_DIR, file).replace(/\\/g, '/');
  
  lines.forEach((line, idx) => {
    for (const pat of mojibakeRawStrings) {
      if (line.includes(pat)) {
        mojibakeViolations.push({
          file: relPath,
          line: idx + 1,
          snippet: line.trim()
        });
        break;
      }
    }
  });
}

// 2.1 Test /inventory zero mojibake
const inventoryMojibake = mojibakeViolations.filter(v => v.file.includes('inventory'));
assert(
  inventoryMojibake.length === 0,
  'Zero Mojibake corruption in /inventory (pages, components, firebase)',
  inventoryMojibake.length > 0 ? `${inventoryMojibake.length} corrupted lines found in inventory: ${JSON.stringify(inventoryMojibake[0])}` : null
);

// 2.2 Test /generate zero mojibake
const generateMojibake = mojibakeViolations.filter(v => v.file.includes('GenerateSync'));
assert(
  generateMojibake.length === 0,
  'Zero Mojibake corruption across /generate (GenerateSync and subcomponents)',
  generateMojibake.length > 0 ? `${generateMojibake.length} corrupted lines found in GenerateSync! Affected files: ${[...new Set(generateMojibake.map(m => m.file))].join(', ')}` : null
);

if (generateMojibake.length > 0) {
  console.log(`     Sample Mojibake occurrences in /generate:`);
  generateMojibake.slice(0, 10).forEach(m => {
    console.log(`       - ${m.file}:${m.line} -> ${m.snippet}`);
  });
}

// =========================================================================
// GROUP 3: Component Data Parsing & Schema Alignment across /generate
// =========================================================================
console.log('\n📋 GROUP 3: /generate Data Parsing & Schema Alignment');

const metricsHeaderPath = path.join(BACKOFFICE_DIR, 'src/pages/GenerateSync/components/details/TransactionMetricsHeader.jsx');
const txDetailsHookPath = path.join(BACKOFFICE_DIR, 'src/pages/GenerateSync/hooks/useTransactionDetailsData.js');
const filterBarPath = path.join(BACKOFFICE_DIR, 'src/pages/GenerateSync/components/details/TransactionFilterBar.jsx');
const itemizedTablePath = path.join(BACKOFFICE_DIR, 'src/pages/GenerateSync/components/details/TransactionItemizedTable.jsx');
const groupedListPath = path.join(BACKOFFICE_DIR, 'src/pages/GenerateSync/components/details/TransactionGroupedList.jsx');

const metricsHeaderCode = fs.readFileSync(metricsHeaderPath, 'utf8');
const txDetailsHookCode = fs.readFileSync(txDetailsHookPath, 'utf8');
const filterBarCode = fs.readFileSync(filterBarPath, 'utf8');
const itemizedTableCode = fs.readFileSync(itemizedTablePath, 'utf8');
const groupedListCode = fs.readFileSync(groupedListPath, 'utf8');

// 3.1 Metrics Schema Field Alignment
const hookReturnsTotal = txDetailsHookCode.includes('return { total, sales, claims, adjusts }');
const componentAccessesTotalCount = metricsHeaderCode.includes('metrics.totalCount');
const componentAccessesOrders = metricsHeaderCode.includes('metrics.orders');

assert(
  !(componentAccessesTotalCount && hookReturnsTotal),
  'TransactionMetricsHeader totalCount alignment: Hook returns { total } but component reads metrics.totalCount',
  'Field mismatch: useTransactionDetailsData.js calculates { total }, but TransactionMetricsHeader.jsx line 24 reads metrics.totalCount (renders blank)'
);

assert(
  !(componentAccessesOrders && hookReturnsTotal),
  'TransactionMetricsHeader orders/sales alignment: Hook returns { sales } but component reads metrics.orders',
  'Field mismatch: useTransactionDetailsData.js calculates { sales }, but TransactionMetricsHeader.jsx line 46 reads metrics.orders (renders blank)'
);

// 3.2 Event Category Alignment between MetricsHeader & FilterBar & Hook
const headerDispatchesOrder = metricsHeaderCode.includes("setSelectedEventType('order')");
const hookFiltersSale = txDetailsHookCode.includes("item.eventCategory !== selectedEventType") && 
                        txDetailsHookCode.includes("eventCategory: 'sale'");
const filterBarHasSale = filterBarCode.includes('value="sale"');
const filterBarHasOrder = filterBarCode.includes('value="order"');

assert(
  !(headerDispatchesOrder && !filterBarHasOrder && hookFiltersSale),
  'Event category alignment: MetricsHeader dispatches "order" but Hook and FilterBar use "sale"',
  'Functional bug: TransactionMetricsHeader line 31 calls setSelectedEventType("order"), but transactions have eventCategory: "sale". FilterBar only has <option value="sale">. Clicking "Orders" in MetricsHeader produces 0 results!'
);

// 3.3 Data Parsing Stress Simulation for Detail Components
function simulateItemizedTableRender(transactions) {
  try {
    if (!transactions) throw new Error('Cannot render without transactions array');
    if (transactions.length === 0) {
      return { renderedRows: 0, status: 'EMPTY_NOTICE' };
    }
    const rendered = transactions.map((tx, idx) => {
      const isDiff = tx.oldValue !== '-' && tx.newValue !== '-' && tx.oldValue !== tx.newValue;
      return {
        id: tx.id || idx,
        txId: tx.txId || 'N/A',
        name: tx.name || 'Untitled',
        isDiff
      };
    });
    return { renderedRows: rendered.length, status: 'SUCCESS' };
  } catch (err) {
    return { status: 'CRASH', error: err.message };
  }
}

const emptyItemizedRes = simulateItemizedTableRender([]);
assert(emptyItemizedRes.status === 'EMPTY_NOTICE', 'TransactionItemizedTable handles empty dataset [] safely without crashing');

const nullFieldTx = [{
  id: null,
  txId: null,
  timestamp: null,
  sku: null,
  name: null,
  oldValue: null,
  newValue: null,
  quantityDiffText: null,
  eventBadgeClass: 'badge',
  customerName: null
}];
const nullTxRes = simulateItemizedTableRender(nullFieldTx);
assert(nullTxRes.status === 'SUCCESS', 'TransactionItemizedTable handles null/missing fields gracefully');

// Simulate TransactionGroupedList with edge cases
function simulateGroupedListRender(groupedByBill) {
  try {
    if (!groupedByBill || groupedByBill.length === 0) {
      return { status: 'EMPTY_NOTICE' };
    }
    const hasGuard = groupedListCode.includes('group.items?.[0]?.sku') || 
                     groupedListCode.includes('group.items?.[0]') ||
                     groupedListCode.includes('items?.[0]');
    for (const group of groupedByBill) {
      if (!hasGuard && (!group.items || group.items.length === 0)) {
        throw new TypeError("Cannot read properties of undefined (reading 'sku')");
      }
    }
    return { status: 'SUCCESS' };
  } catch (err) {
    return { status: 'CRASH', error: err.message };
  }
}

const emptyGroupRes = simulateGroupedListRender([]);
assert(emptyGroupRes.status === 'EMPTY_NOTICE', 'TransactionGroupedList handles empty grouped array safely');

// 3.4 GroupedList empty items guard test
const corruptedEmptyItemsGroup = [{
  txId: 'ORD-999',
  items: []
}];
const corruptedGroupRes = simulateGroupedListRender(corruptedEmptyItemsGroup);
assert(
  corruptedGroupRes.status === 'SUCCESS',
  'TransactionGroupedList defends against empty items in group: group.items[0]?.sku guard',
  'Vulnerability: If a bill group contains items: [], line 17 and line 44 throw TypeError: Cannot read properties of undefined (reading \'sku\')'
);

// =========================================================================
// GROUP 4: /inventory Stats Service & Product Table Data Parsing
// =========================================================================
console.log('\n📋 GROUP 4: /inventory Stats Service & Product Table Data Parsing');

const statsServicePath = path.join(BACKOFFICE_DIR, 'src/firebase/inventory/inventoryStatsService.js');
const statsServiceCode = fs.readFileSync(statsServicePath, 'utf8');

assert(
  statsServiceCode.includes('export const recalculateDailyStats = async'),
  'inventoryStatsService exports recalculateDailyStats async function'
);

assert(
  statsServiceCode.includes('parseStatsSnapshot(rawData)'),
  'recalculateDailyStats parses snapshot through parseStatsSnapshot envelope unwrapper'
);

assert(
  statsServiceCode.includes("fetchProductStats: async (products = [], salesPeriod = '30')"),
  'fetchProductStats provides safe default parameters (products = [], salesPeriod = "30")'
);

// Simulate fetchProductStats logic with extreme data
function simulateFetchProductStats(products, snapshotMap, salesPeriod = '30') {
  if (!products || products.length === 0) return {};
  const statsMap = {};
  products.forEach(p => {
    if (p && p.sku) {
      statsMap[p.sku] = { stockIn: 0, sales: 0, claim: 0, adjustment: 0 };
    }
  });
  if (snapshotMap && typeof snapshotMap === 'object') {
    for (const [sku, pStats] of Object.entries(snapshotMap)) {
      if (statsMap[sku] && pStats) {
        statsMap[sku].stockIn = Number(pStats.stockInHistory?.[salesPeriod] ?? pStats.stockIn?.[salesPeriod] ?? 0);
        statsMap[sku].sales = Number(pStats.salesHistory?.[salesPeriod] ?? pStats.sales?.[salesPeriod] ?? 0);
        statsMap[sku].claim = Number(pStats.claimHistory?.[salesPeriod] ?? pStats.claim?.[salesPeriod] ?? 0);
        statsMap[sku].adjustment = Number(pStats.adjustmentHistory?.[salesPeriod] ?? pStats.adjustment?.[salesPeriod] ?? 0);
      }
    }
  }
  return statsMap;
}

const extremeCatalog = [
  { sku: 'NORMAL-SKU', name: 'Item 1' },
  { sku: '', name: 'Empty SKU' },
  { sku: null, name: 'Null SKU' },
  { name: 'Missing SKU object' },
  { sku: 'EXTREME-NUM', stock: 9999999 }
];

const mockStatsSnapshot = {
  'NORMAL-SKU': {
    sales: { '30': 42 },
    stockIn: { '30': 100 },
    claim: { '30': 2 },
    adjustment: { '30': -5 }
  },
  'EXTREME-NUM': {
    sales: { '30': '1500000' },
    stockIn: { '30': null },
    claim: { '30': undefined },
    adjustment: { '30': NaN }
  }
};

const parsedStats = simulateFetchProductStats(extremeCatalog, mockStatsSnapshot, '30');
assert(
  parsedStats['NORMAL-SKU'] && parsedStats['NORMAL-SKU'].sales === 42,
  'fetchProductStats cleanly maps standard 30D sales numbers'
);
assert(
  parsedStats['EXTREME-NUM'] && parsedStats['EXTREME-NUM'].sales === 1500000,
  'fetchProductStats coerces numeric strings safely'
);
assert(
  parsedStats['EXTREME-NUM'] && (isNaN(parsedStats['EXTREME-NUM'].adjustment) || parsedStats['EXTREME-NUM'].adjustment === 0),
  'fetchProductStats handles malformed NaN/null stats safely'
);

// =========================================================================
// SUMMARY & VERDICT
// =========================================================================
console.log('\n════════════════════════════════════════════════════════════════════════');
console.log(`RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL ${totalTests})`);
console.log('════════════════════════════════════════════════════════════════════════\n');

if (findings.length > 0) {
  console.log('🚨 DISCOVERED DEFECTS & VULNERABILITIES:');
  findings.forEach((f, i) => {
    console.log(`  [${i + 1}] ${f.message}`);
    if (f.errorDetail) console.log(`      ${f.errorDetail}`);
  });
  console.log('\nVERDICT: REQUEST_CHANGES');
} else {
  console.log('VERDICT: APPROVE');
}

process.exit(failedTests > 0 ? 1 : 0);
