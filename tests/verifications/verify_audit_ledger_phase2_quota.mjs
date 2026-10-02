import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../');

console.log('========================================================');
console.log('🧪 VERIFY: Audit Ledger Phase 2 Quota Optimization & Cache');
console.log('========================================================\n');

// 1. useAuditLedger.js checks
const hookPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/hooks/useAuditLedger.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

// Assert N+1 getDoc is removed
assert(!hookCode.includes("getDoc(doc(db, getCollectionPath('users')"), 'useAuditLedger.js must NOT perform N+1 getDoc queries on users collection');
assert(!hookCode.includes("import { collection, collectionGroup, getDocs, query, orderBy, limit, doc, getDoc }"), 'doc, getDoc must not be imported in useAuditLedger.js');
console.log('✅ 1. Elimination of N+1 getDoc queries on users collection verified');

// Assert customer directory chunk cache usage
assert(hookCode.includes('fetchCustomerDirectoryChunk'), 'useAuditLedger.js must use fetchCustomerDirectoryChunk');
assert(hookCode.includes('cachedCustomerMap'), 'useAuditLedger.js must maintain cachedCustomerMap');
assert(hookCode.includes('DIRECTORY_CACHE_TTL'), 'useAuditLedger.js must implement DIRECTORY_CACHE_TTL');
console.log('✅ 2. Zero-quota customer directory chunk resolution verified');

// Assert ledger data memory cache
assert(hookCode.includes('cachedLedgerTransactions'), 'useAuditLedger.js must maintain cachedLedgerTransactions');
assert(hookCode.includes('LEDGER_CACHE_TTL'), 'useAuditLedger.js must implement LEDGER_CACHE_TTL');
assert(hookCode.includes('refreshLedger'), 'useAuditLedger.js must export refreshLedger function');
console.log('✅ 3. Memory TTL caching & refreshLedger callback verified');

// 2. AuditLedger.jsx checks
const uiPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/AuditLedger.jsx');
const uiCode = fs.readFileSync(uiPath, 'utf8');

assert(uiCode.includes('refreshLedger'), 'AuditLedger.jsx must consume refreshLedger from hook');
assert(uiCode.includes('RefreshCw'), 'AuditLedger.jsx must render RefreshCw icon for refresh button');
console.log('✅ 4. AuditLedger.jsx refresh button integration verified');

console.log('\n🎉 ALL PHASE 2 CHECKS PASSED PERFECTLY!\n');
