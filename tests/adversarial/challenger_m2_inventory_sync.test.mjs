/**
 * Challenger M2: Inventory 5D Sync & Generate Page Verification Suite
 * Verifies that the 5D Stock Recalculation subsystem, inventory controller wiring,
 * UI header buttons, encoding integrity, and Generate pages meet all criteria.
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

console.log('🧪 Starting Challenger M2: Inventory & 5D Sync Verification...\n');

// 1. Verify inventoryStatsService.js
console.log('📋 Test Group 1: inventoryStatsService.js');
const statsServicePath = path.join(ROOT_DIR, 'src/firebase/inventory/inventoryStatsService.js');
assert(fs.existsSync(statsServicePath), 'inventoryStatsService.js exists on disk');

const statsContent = fs.readFileSync(statsServicePath, 'utf8');
assert(statsContent.includes('export const recalculateDailyStats = async'), 'Exports recalculateDailyStats function');
assert(statsContent.includes('recalculateDailyStats,'), 'inventoryStatsService object contains recalculateDailyStats');
assert(statsContent.includes('del(IDB_STATS_CACHE_KEY)'), 'Purges IDB_STATS_CACHE_KEY');
assert(statsContent.includes('del(IDB_STATS_MAP_KEY)'), 'Purges IDB_STATS_MAP_KEY');
assert(statsContent.includes('del(IDB_STATS_SNAPSHOT_KEY)'), 'Purges IDB_STATS_SNAPSHOT_KEY');
assert(statsContent.includes('inventory_stats_snapshot'), 'Fetches inventory_stats_snapshot from Firestore');
assert(statsContent.includes('parseStatsSnapshot'), 'Uses parseStatsSnapshot to process raw snapshot data');

// 2. Verify useInventoryController.js
console.log('\n📋 Test Group 2: useInventoryController.js');
const controllerPath = path.join(ROOT_DIR, 'src/pages/inventory/useInventoryController.js');
assert(fs.existsSync(controllerPath), 'useInventoryController.js exists on disk');

const controllerContent = fs.readFileSync(controllerPath, 'utf8');
assert(controllerContent.includes('inventoryStatsService'), 'Imports inventoryStatsService');
assert(controllerContent.includes('const [isRecalculating, setIsRecalculating] = useState(false)'), 'Declares isRecalculating state');
assert(controllerContent.includes('handleRecalculateStats = useCallback(async'), 'Implements handleRecalculateStats callback');
assert(controllerContent.includes('inventoryStatsService.recalculateDailyStats()'), 'handleRecalculateStats calls recalculateDailyStats()');
assert(controllerContent.includes('fetchInitialProducts()'), 'handleRecalculateStats refetches initial products');
assert(controllerContent.includes('handleRecalculateStats,') && controllerContent.includes('isRecalculating,'), 'Returns handleRecalculateStats and isRecalculating in controller object');

// Check for Mojibake in useInventoryController.js
const mojibakeRegex = /[\u0E00-\u0E7F]*[เธ|เน|โš|๐Ÿ][\u0E00-\u0E7F]*/;
const controllerHasMojibake = controllerContent.includes('เธ') || controllerContent.includes('เน€') || controllerContent.includes('โš');
assert(!controllerHasMojibake, 'useInventoryController.js has zero Mojibake corruption');
assert(controllerContent.includes('คุณไม่สามารถใช้งานได้'), 'Clean Thai text in permission alert');
assert(controllerContent.includes('เกิดข้อผิดพลาดในการบันทึกข้อมูล'), 'Clean Thai text in save error alert');

// 3. Verify InventoryHeader.jsx
console.log('\n📋 Test Group 3: InventoryHeader.jsx');
const headerPath = path.join(ROOT_DIR, 'src/components/inventory/InventoryHeader.jsx');
assert(fs.existsSync(headerPath), 'InventoryHeader.jsx exists on disk');

const headerContent = fs.readFileSync(headerPath, 'utf8');
assert(headerContent.includes('onRecalculateStats'), 'Accepts onRecalculateStats in props');
assert(headerContent.includes('isRecalculating'), 'Accepts isRecalculating in props');
assert(headerContent.includes('{onRecalculateStats &&'), 'Guards 5D Sync button with onRecalculateStats');
assert(headerContent.includes('onClick={onRecalculateStats}'), '5D Sync button triggers onRecalculateStats');
assert(headerContent.includes('disabled={isRecalculating}'), '5D Sync button disables when isRecalculating');
assert(headerContent.includes('isRecalculating ? "animate-spin" : ""'), 'RefreshCw icon spins during recalculation');
assert(headerContent.includes('5D Sync'), 'Button text shows "5D Sync"');
assert(headerContent.includes('กำลังคำนวณ...'), 'Button text shows "กำลังคำนวณ..." during recalculation');
assert(headerContent.includes('title="Sync ข้อมูลและคำนวณสถิติยอดเข้า/ยอดขาย/ของเสีย/ปรับยอดทั้งหมด"'), 'Title attribute correctly specifies 5D sync function');

// 4. Verify InventoryMain.jsx
console.log('\n📋 Test Group 4: InventoryMain.jsx');
const mainPath = path.join(ROOT_DIR, 'src/pages/inventory/InventoryMain.jsx');
assert(fs.existsSync(mainPath), 'InventoryMain.jsx exists on disk');

const mainContent = fs.readFileSync(mainPath, 'utf8');
assert(mainContent.includes('handleRecalculateStats,'), 'Destructures handleRecalculateStats from useInventoryController');
assert(mainContent.includes('isRecalculating,'), 'Destructures isRecalculating from useInventoryController');
assert(mainContent.includes('onRecalculateStats={handleRecalculateStats}'), 'Forwards onRecalculateStats prop to InventoryHeader');
assert(mainContent.includes('isRecalculating={isRecalculating}'), 'Forwards isRecalculating prop to InventoryHeader');

const mainHasMojibake = mainContent.includes('เธ') || mainContent.includes('เน€') || mainContent.includes('โš');
assert(!mainHasMojibake, 'InventoryMain.jsx has zero Mojibake corruption');
assert(mainContent.includes('กำลังโหลดคลังสินค้า...'), 'Clean Thai text in loading indicator');
assert(mainContent.includes('คู่มือการใช้งาน: ระบบคลังสินค้า (Inventory)'), 'Clean Thai text in guide modal title');

// 5. Verify /generate and /generate/details/:referenceId
console.log('\n📋 Test Group 5: /generate and /generate/details/:referenceId');
const generateIndexPath = path.join(ROOT_DIR, 'src/pages/GenerateSync/index.jsx');
assert(fs.existsSync(generateIndexPath), 'GenerateSync index.jsx exists on disk');

const generateDetailsPath = path.join(ROOT_DIR, 'src/pages/GenerateSync/GenerateSyncDetails.jsx');
assert(fs.existsSync(generateDetailsPath), 'GenerateSyncDetails.jsx exists on disk');

const detailSubcomponents = [
  'TransactionMetricsHeader.jsx',
  'TransactionFilterBar.jsx',
  'TransactionItemizedTable.jsx',
  'TransactionGroupedList.jsx'
];

for (const comp of detailSubcomponents) {
  const compPath = path.join(ROOT_DIR, 'src/pages/GenerateSync/components/details', comp);
  assert(fs.existsSync(compPath), `Detail component ${comp} exists on disk`);
  const content = fs.readFileSync(compPath, 'utf8');
  assert(content.includes('export default'), `${comp} exports a default React component`);
}

// 6. Verify ssr memory master_inventory.md
console.log('\n📋 Test Group 6: ssr memory master_inventory.md');
const memoryPath = path.join(ROOT_DIR, 'src/pages/inventory/ssr memory master_inventory.md');
assert(fs.existsSync(memoryPath), 'ssr memory master_inventory.md exists on disk');
const memoryContent = fs.readFileSync(memoryPath, 'utf8');
assert(memoryContent.includes('<workflow>'), 'Contains <workflow> section');
assert(memoryContent.includes('<core_schema>'), 'Contains <core_schema> section');
assert(memoryContent.includes('<rules_and_conditions>'), 'Contains <rules_and_conditions> section');
assert(memoryContent.includes('<techniques>'), 'Contains <techniques> section');
assert(memoryContent.includes('<lessons_learned>'), 'Contains <lessons_learned> section');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
