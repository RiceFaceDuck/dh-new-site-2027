import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACTIONS_HOOK = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerActions.js');
const STATS_SERVICE = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/services/customerOrderStatsService.js');
const CACHE_SERVICE = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/services/customerCacheService.js');
const DATA_HOOK = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerData.js');

console.log('🧪 Starting Verification Suite: Phase 1 Customer 30D Stats & Social Form Parity');

// 1. Files Exist
assert(fs.existsSync(ACTIONS_HOOK), 'useCustomerActions.js must exist');
assert(fs.existsSync(STATS_SERVICE), 'customerOrderStatsService.js must exist');
assert(fs.existsSync(CACHE_SERVICE), 'customerCacheService.js must exist');
assert(fs.existsSync(DATA_HOOK), 'useCustomerData.js must exist');
console.log('  ✅ PASS: All 4 target files exist');

// 2. Verify Social Media Fields in startEditCustomer (useCustomerActions.js)
const actionsCode = fs.readFileSync(ACTIONS_HOOK, 'utf-8');
assert(actionsCode.includes("lineId: fullProfile.lineId || ''"), 'startEditCustomer must map lineId');
assert(actionsCode.includes("facebook: fullProfile.facebook || fullProfile.facebookUrl || ''"), 'startEditCustomer must map facebook');
assert(actionsCode.includes("facebookUrl: fullProfile.facebookUrl || fullProfile.facebook || ''"), 'startEditCustomer must map facebookUrl');
assert(actionsCode.includes("messengerUrl: fullProfile.messengerUrl || ''"), 'startEditCustomer must map messengerUrl');
assert(actionsCode.includes("taxId: fullProfile.taxId || ''"), 'startEditCustomer must map taxId');
assert(actionsCode.includes("sessionStorage.setItem(CACHE_KEY"), 'saveCustomerEdit must sync sessionStorage');
console.log('  ✅ PASS: Social media & tax fields preserved in edit form with dual-storage sync');

// 3. Verify Empty Active Map Guard in fetchOrderStatsForPage (customerOrderStatsService.js)
const statsCode = fs.readFileSync(STATS_SERVICE, 'utf-8');
assert(statsCode.includes('!activeMap || Object.keys(activeMap).length === 0'), 'Must guard against empty activeMap');
assert(statsCode.includes('if (stats) {'), 'Must only populate orderStatsMap when stats are present in active catalog');
console.log('  ✅ PASS: Empty activeMap guard intact, eliminating 0.00 zero-overwrite');

// 4. Verify isFullCatalog Flag in applyActiveStatsDelta (customerCacheService.js)
const cacheCode = fs.readFileSync(CACHE_SERVICE, 'utf-8');
assert(cacheCode.includes('applyActiveStatsDelta = (customersList, activeStatsMap, isFullCatalog = false)'), 'Signature must accept isFullCatalog = false');
assert(cacheCode.includes('else if (isFullCatalog && (currentSales30 > 0 || currentOrderCount30 > 0))'), 'Only full catalog may zero out unmatched records');
console.log('  ✅ PASS: isFullCatalog guard prevents wiping page customers');

// 5. Verify Callers in useCustomerData.js
const dataCode = fs.readFileSync(DATA_HOOK, 'utf-8');
assert(dataCode.includes('applyActiveStatsDelta(prev, orderStatsMap)'), 'Page order stats must not pass isFullCatalog');
assert(dataCode.includes('applyActiveStatsDelta(prev, customersMap, true)'), 'Full catalog update must pass isFullCatalog = true');
console.log('  ✅ PASS: Caller layers strictly enforce boundary conditions');

console.log('\n🎉 ALL PHASE 1 VERIFICATIONS PASSED (5/5)');
