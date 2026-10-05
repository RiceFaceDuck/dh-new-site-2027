import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_SERVICE_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/customerAdminService.js');
const CACHE_SERVICE_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/services/customerCacheService.js');

console.log('🧪 Starting Verification Suite: Phase 2 Directory Chunk Sync & Mutation Wire');

// 1. Files Exist
assert(fs.existsSync(ADMIN_SERVICE_PATH), 'customerAdminService.js must exist');
assert(fs.existsSync(CACHE_SERVICE_PATH), 'customerCacheService.js must exist');
console.log('  ✅ PASS: customerAdminService.js and customerCacheService.js exist');

// 2. Verify Imports in customerAdminService.js
const adminCode = fs.readFileSync(ADMIN_SERVICE_PATH, 'utf-8');
assert(adminCode.includes('syncCustomerToDirectoryChunk'), 'customerAdminService must import syncCustomerToDirectoryChunk');
assert(adminCode.includes('cascadeDisableCustomer'), 'customerAdminService must import cascadeDisableCustomer');
assert(adminCode.includes('cascadeDeleteCustomer'), 'customerAdminService must import cascadeDeleteCustomer');
console.log('  ✅ PASS: customerAdminService imports are fully intact');

// 3. Verify createManualCustomer Chunk Sync Wire
assert(adminCode.includes('await syncCustomerToDirectoryChunk('), 'customerAdminService must call syncCustomerToDirectoryChunk');
const createSyncMatch = /createManualCustomer[\s\S]*?syncCustomerToDirectoryChunk[\s\S]*?'upsert'[\s\S]*?return docRef\.id/.test(adminCode);
assert(createSyncMatch, 'createManualCustomer must call syncCustomerToDirectoryChunk with upsert before returning');
assert(adminCode.includes('Non-blocking directory chunk sync error on create'), 'createManualCustomer must wrap sync in non-blocking try/catch');
console.log('  ✅ PASS: createManualCustomer connects to syncCustomerToDirectoryChunk (upsert, non-blocking)');

// 4. Verify updateCustomerProfile Chunk Sync Wire
const updateSyncMatch = /updateCustomerProfile[\s\S]*?syncCustomerToDirectoryChunk[\s\S]*?'upsert'[\s\S]*?return \{ success: true \}/.test(adminCode);
assert(updateSyncMatch, 'updateCustomerProfile must call syncCustomerToDirectoryChunk with upsert before returning');
assert(adminCode.includes('Non-blocking directory chunk sync error on update'), 'updateCustomerProfile must wrap sync in non-blocking try/catch');
console.log('  ✅ PASS: updateCustomerProfile connects to syncCustomerToDirectoryChunk (upsert, non-blocking)');

// 5. Verify deleteCustomer Chunk Sync Wire
const deleteSyncMatch = /deleteCustomer[\s\S]*?syncCustomerToDirectoryChunk[\s\S]*?'delete'[\s\S]*?return \{ success: true \}/.test(adminCode);
assert(deleteSyncMatch, 'deleteCustomer must call syncCustomerToDirectoryChunk with delete before returning');
assert(adminCode.includes('Non-blocking directory chunk sync error on delete'), 'deleteCustomer must wrap sync in non-blocking try/catch');
console.log('  ✅ PASS: deleteCustomer connects to syncCustomerToDirectoryChunk (delete, non-blocking)');

// 6. Verify syncCustomerToDirectoryChunk Schema & Integrity in customerCacheService.js
const cacheCode = fs.readFileSync(CACHE_SERVICE_PATH, 'utf-8');
assert(cacheCode.includes('syncCustomerToDirectoryChunk = async'), 'syncCustomerToDirectoryChunk must be exported');
assert(cacheCode.includes('runTransaction(db,'), 'syncCustomerToDirectoryChunk must use runTransaction');
assert(cacheCode.includes('writeCachedCustomers(updatedItems)'), 'syncCustomerToDirectoryChunk must write to local cache');
assert(cacheCode.includes('address: customer.address || null'), 'syncCustomerToDirectoryChunk must preserve address');
assert(cacheCode.includes('legacyAddress: customer.legacyAddress || null'), 'syncCustomerToDirectoryChunk must preserve legacyAddress');
assert(cacheCode.includes('shippingAddress: customer.shippingAddress || null'), 'syncCustomerToDirectoryChunk must preserve shippingAddress');
assert(cacheCode.includes('taxId: customer.taxId || null'), 'syncCustomerToDirectoryChunk must preserve taxId');
assert(cacheCode.includes('shippingNotes: customer.shippingNotes || customer.logisticNote'), 'syncCustomerToDirectoryChunk must preserve dual-key shippingNotes');
assert(cacheCode.includes('contactName: customer.contactName || customer.firstName'), 'syncCustomerToDirectoryChunk must preserve dual-key contactName');
console.log('  ✅ PASS: syncCustomerToDirectoryChunk preserves full address, dual-keys, and atomic transaction');

console.log('\n🎉 ALL PHASE 2 VERIFICATIONS PASSED (6/6)');
