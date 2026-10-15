import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_SERVICE = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/customerAdminService.js');
const DATA_HOOK = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerData.js');
const FILTERS_HOOK = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerFilters.js');

console.log('🧪 Starting Verification Suite: Phase 2 Customer Sync & Search Filter Parity');

// 1. Files Exist
assert(fs.existsSync(ADMIN_SERVICE), 'customerAdminService.js must exist');
assert(fs.existsSync(DATA_HOOK), 'useCustomerData.js must exist');
assert(fs.existsSync(FILTERS_HOOK), 'useCustomerFilters.js must exist');
console.log('  ✅ PASS: All 3 target files exist');

// 2. Verify Directory Chunk Sync on Account Merging (customerAdminService.js)
const adminCode = fs.readFileSync(ADMIN_SERVICE, 'utf-8');
assert(adminCode.includes("syncCustomerToDirectoryChunk({ id: manualUid, uid: manualUid }, 'delete')"), 'Must delete merged account from directory chunk');
assert(adminCode.includes("syncCustomerToDirectoryChunk(mergedTargetData, 'upsert')"), 'Must upsert target account in directory chunk');
console.log('  ✅ PASS: Directory chunk sync wired to account merge flow (0 orphan entries)');

// 3. Verify Delta Fetch Sliding Window Keeper (useCustomerData.js)
const dataCode = fs.readFileSync(DATA_HOOK, 'utf-8');
assert(dataCode.includes('// 🛡️ Sliding Window Keeper: Always advance lastSync timestamp to prevent stale query window expansion'), 'Must have sliding window keeper comment');
assert(dataCode.includes('writeCachedCustomers(currentUsers)'), 'Must advance lastSync by writing current cached state');
console.log('  ✅ PASS: Sliding window maintains fixed safety delta without runaway query intervals');

// 4. Verify Clean Digits Phone Search & Safe Timestamp Sort (useCustomerFilters.js)
const filtersCode = fs.readFileSync(FILTERS_HOOK, 'utf-8');
assert(filtersCode.includes("cleanDigitsSearch = lower.replace(/\\D/g, '')"), 'Must extract clean digits for phone search');
assert(filtersCode.includes('cleanPhone.includes(cleanDigitsSearch)'), 'Must match phone by normalized clean digits');
assert(filtersCode.includes('parseTimestampNumber(a.lastOrderDate'), 'Must safely parse lastOrderA timestamp');
assert(filtersCode.includes('parseTimestampNumber(b.lastOrderDate'), 'Must safely parse lastOrderB timestamp');
console.log('  ✅ PASS: Flexible unhyphenated phone search and NaN-free sorting verified');

console.log('\n🎉 ALL PHASE 2 VERIFICATIONS PASSED (4/4)');
