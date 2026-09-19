/**
 * Independent Forensic Audit Verification Script for Milestone 2
 * Tests the authentic behavior of inventoryStatsService, parseStatsSnapshot,
 * controller wiring, UI prop forwarding, encoding integrity, and grimoire compliance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../dh-backoffice-react');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('🔍 Running Forensic Auditor Independent Verification for Milestone 2...\n');

// 1. Verify parseStatsSnapshot logic directly
console.log('📋 Check 1: parseStatsSnapshot Functional Logic');
import { parseStatsSnapshot } from '../../dh-backoffice-react/src/firebase/inventory/migrationService.js';

assert(typeof parseStatsSnapshot === 'function', 'parseStatsSnapshot is an exported function');
assert(parseStatsSnapshot(null) === null, 'Returns null on null input');
assert(parseStatsSnapshot(undefined) === null, 'Returns null on undefined input');
assert(parseStatsSnapshot('invalid-json') === null, 'Returns null on invalid JSON string');

const directObj = { SKU100: { stockIn: 10 } };
assert(JSON.stringify(parseStatsSnapshot(directObj)) === JSON.stringify(directObj), 'Returns direct stats object unchanged');

const stringifiedObj = JSON.stringify({ SKU200: { sales: 25 } });
assert(parseStatsSnapshot(stringifiedObj)?.SKU200?.sales === 25, 'Correctly parses stringified JSON snapshot');

const wrappedStatsMap = { statsMap: { SKU300: { claim: 3 } } };
assert(parseStatsSnapshot(wrappedStatsMap)?.SKU300?.claim === 3, 'Unwraps statsMap envelope correctly');

const wrappedStatsBySku = { statsBySku: { SKU400: { adjustment: -2 } } };
assert(parseStatsSnapshot(wrappedStatsBySku)?.SKU400?.adjustment === -2, 'Unwraps statsBySku envelope correctly');

// 2. Verify inventoryStatsService.js implementation & structure
console.log('\n📋 Check 2: inventoryStatsService.js Forensic Code Inspection');
const statsServicePath = path.join(ROOT_DIR, 'src/firebase/inventory/inventoryStatsService.js');
assert(fs.existsSync(statsServicePath), 'inventoryStatsService.js exists');

const statsCode = fs.readFileSync(statsServicePath, 'utf8');

// Check for forbidden facade patterns
assert(!statsCode.includes('return [] // mock'), 'No mock returns in inventoryStatsService');
assert(!statsCode.includes('return {} // fake'), 'No fake pass returns in inventoryStatsService');
assert(statsCode.includes('export const recalculateDailyStats = async'), 'recalculateDailyStats is exported directly');
assert(statsCode.includes('recalculateDailyStats,'), 'recalculateDailyStats is included in default object export');
assert(statsCode.includes('recalculateInventoryStats: recalculateDailyStats'), 'Alias recalculateInventoryStats is supported');

// Check IDB cache purge keys
const requiredPurgeKeys = ['IDB_STATS_CACHE_KEY', 'IDB_STATS_MAP_KEY', 'IDB_STATS_SNAPSHOT_KEY', 'inventory_stats_cache', 'inventory_stats_map', 'inventory_stats_snapshot'];
for (const key of requiredPurgeKeys) {
  assert(statsCode.includes(key), `Purges cache key: ${key}`);
}

// Check Firestore snapshot fetch
assert(statsCode.includes("doc(db, getCollectionPath('catalogs'), 'inventory_stats_snapshot')"), 'References real Firestore catalogs/inventory_stats_snapshot document');
assert(statsCode.includes('await getDoc(snapshotRef)'), 'Performs real getDoc query on Firestore snapshot document');
assert(statsCode.includes('parseStatsSnapshot(rawData)'), 'Parses snapshot with parseStatsSnapshot');

// 3. Verify useInventoryController.js Forensic Code Inspection
console.log('\n📋 Check 3: useInventoryController.js Forensic Code Inspection');
const controllerPath = path.join(ROOT_DIR, 'src/pages/inventory/useInventoryController.js');
assert(fs.existsSync(controllerPath), 'useInventoryController.js exists');

const controllerCode = fs.readFileSync(controllerPath, 'utf8');

assert(controllerCode.includes("import { inventoryStatsService } from '../../firebase/inventory/inventoryStatsService'"), 'Authentic import of inventoryStatsService');
assert(controllerCode.includes('const [isRecalculating, setIsRecalculating] = useState(false)'), 'Initializes isRecalculating state with false');
assert(controllerCode.includes('setIsRecalculating(true)'), 'Sets isRecalculating to true before async operations');
assert(controllerCode.includes('await inventoryStatsService.recalculateDailyStats()'), 'Awaits recalculateDailyStats()');
assert(controllerCode.includes('await fetchInitialProducts()'), 'Awaits fetchInitialProducts() to rehydrate UI');
assert(controllerCode.includes('setIsRecalculating(false)'), 'Resets isRecalculating to false in finally block');

// Check controller return object
assert(/return\s*\{[\s\S]*isRecalculating,[\s\S]*handleRecalculateStats,[\s\S]*\}/.test(controllerCode), 'Exports isRecalculating and handleRecalculateStats in return statement');

// 4. Verify InventoryHeader.jsx Forensic Code Inspection
console.log('\n📋 Check 4: InventoryHeader.jsx Forensic Code Inspection');
const headerPath = path.join(ROOT_DIR, 'src/components/inventory/InventoryHeader.jsx');
assert(fs.existsSync(headerPath), 'InventoryHeader.jsx exists');

const headerCode = fs.readFileSync(headerPath, 'utf8');
assert(headerCode.includes('onRecalculateStats,'), 'Props includes onRecalculateStats');
assert(headerCode.includes('isRecalculating = false'), 'Props includes isRecalculating default false');
assert(headerCode.includes('onClick={onRecalculateStats}'), 'Button triggers onRecalculateStats on click');
assert(headerCode.includes('disabled={isRecalculating}'), 'Button is disabled while recalculating');
assert(headerCode.includes('animate-spin'), 'Spinner spins while isRecalculating is true');
assert(headerCode.includes('5D Sync'), 'Button text includes 5D Sync label');

// 5. Verify InventoryMain.jsx Prop Forwarding & Mojibake Cleansing
console.log('\n📋 Check 5: InventoryMain.jsx Forensic Code Inspection');
const mainPath = path.join(ROOT_DIR, 'src/pages/inventory/InventoryMain.jsx');
assert(fs.existsSync(mainPath), 'InventoryMain.jsx exists');

const mainCode = fs.readFileSync(mainPath, 'utf8');
assert(mainCode.includes('isRecalculating,'), 'Destructures isRecalculating from controller');
assert(mainCode.includes('handleRecalculateStats,'), 'Destructures handleRecalculateStats from controller');
assert(mainCode.includes('isRecalculating={isRecalculating}'), 'Forwards isRecalculating prop to InventoryHeader');
assert(mainCode.includes('onRecalculateStats={handleRecalculateStats}'), 'Forwards onRecalculateStats prop to InventoryHeader');

// Check encoding: zero Mojibake
const mojibakeIndicators = ['เธ', 'เน€', 'โš', 'เธเ', 'เธณ'];
let foundMojibake = false;
for (const marker of mojibakeIndicators) {
  if (mainCode.includes(marker) || controllerCode.includes(marker)) {
    foundMojibake = true;
    break;
  }
}
assert(!foundMojibake, 'Zero Mojibake / ANSI corruption detected in InventoryMain and useInventoryController');

// 6. Verify ssr memory master_inventory.md XML Structure
console.log('\n📋 Check 6: ssr memory master_inventory.md XML Structure');
const grimoirePath = path.join(ROOT_DIR, 'src/pages/inventory/ssr memory master_inventory.md');
assert(fs.existsSync(grimoirePath), 'ssr memory master_inventory.md exists on disk');

const grimoireCode = fs.readFileSync(grimoirePath, 'utf8');
const expectedTags = ['<workflow>', '</workflow>', '<core_schema>', '</core_schema>', '<rules_and_conditions>', '</rules_and_conditions>', '<techniques>', '</techniques>', '<lessons_learned>', '</lessons_learned>'];
for (const tag of expectedTags) {
  assert(grimoireCode.includes(tag), `Grimoire contains XML tag ${tag}`);
}

console.log(`\n======================================================`);
console.log(`Auditor Verification Results: ${passedTests} passed, ${failedTests} failed`);
console.log(`======================================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
