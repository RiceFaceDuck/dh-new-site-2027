import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOOK_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerData.js');

console.log('🧪 Starting Verification Suite: Phase 3 Bounded Delta Sync Flow in useCustomerData');

// 1. File Exists
assert(fs.existsSync(HOOK_PATH), 'useCustomerData.js must exist');
console.log('  ✅ PASS: useCustomerData.js exists');

const hookCode = fs.readFileSync(HOOK_PATH, 'utf-8');

// 2. Verify Instant Display from Cache
assert(hookCode.includes('readCachedCustomers()'), 'Must read cache via readCachedCustomers');
assert(hookCode.includes('setCustomers(filterAndSortCustomers(cachedUsers))'), 'Must render instant cached list');
console.log('  ✅ PASS: Instant display from cache (0 Read) preserved');

// 3. Verify Cold Start & Manual Refresh Directory Chunk Fetch
assert(hookCode.includes('currentUsers.length === 0 || !useCache'), 'Directory Chunk must only fetch on cold start or manual refresh');
assert(hookCode.includes('fetchCustomerDirectoryChunk()'), 'Must call fetchCustomerDirectoryChunk');
console.log('  ✅ PASS: Directory chunk fetch is bounded to cold start / manual refresh');

// 4. Verify No Unconditional Return Blocking Delta Query
const hasBlockingReturnInDir = /fetchCustomerDirectoryChunk[\s\S]*?if\s*\(directoryUsers[\s\S]*?return;[\s\S]*?fetchCustomersFromFirestore/.test(hookCode);
assert(!hasBlockingReturnInDir, 'Unconditional return blocking Bounded Delta Query must be eliminated');
console.log('  ✅ PASS: Blocking return removed; Bounded Delta Query path is unlocked');

// 5. Verify Bounded Delta Query Execution
assert(hookCode.includes('currentUsers.length > 0 && lastSync > 0'), 'Must verify currentUsers and lastSync before delta query');
assert(hookCode.includes('fetchCustomersFromFirestore(lastSync, currentUsers)'), 'Must call fetchCustomersFromFirestore with lastSync and currentUsers');
assert(hookCode.includes('if (hasChanges && updatedUsers && updatedUsers.length > 0)'), 'Must guard against unnecessary re-renders when hasChanges is false');
console.log('  ✅ PASS: Bounded Delta Query executed conditionally with hasChanges guard');

// 6. Verify Complete Fallback
assert(hookCode.includes('else if (currentUsers.length === 0)'), 'Must provide complete fallback when cache and chunk are empty');
assert(hookCode.includes('fetchCustomersFromFirestore(0, [])'), 'Fallback must query base users collection');
console.log('  ✅ PASS: Full fallback mechanism intact for fresh environments');

console.log('\n🎉 ALL PHASE 3 VERIFICATIONS PASSED (6/6)');
