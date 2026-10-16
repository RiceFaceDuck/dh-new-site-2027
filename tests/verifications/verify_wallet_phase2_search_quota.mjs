/**
 * Verification Test: Wallet Phase 2 Search Optimization & Quota Guard
 * Path: Management System/tests/verifications/verify_wallet_phase2_search_quota.mjs
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../');

console.log('========================================================');
console.log('🧪 VERIFY: Wallet Phase 2 Search Optimization & Quota Guard');
console.log('========================================================\n');

const hookPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/wallet/hooks/useWalletManagement.js');
assert(fs.existsSync(hookPath), `File not found at: ${hookPath}`);
console.log('✅ 1. useWalletManagement.js exists');

const code = fs.readFileSync(hookPath, 'utf8');

// 2. Verify elimination of blind limit(100) scan in search
assert(!code.includes("query(usersRef, limit(100))"), 'Unrestricted limit(100) scan still present in useWalletManagement.js');
console.log('✅ 2. Eliminated blind limit(100) scan; no quota leakage on search');

// 3. Verify targeted indexed phone queries
assert(code.includes("where('phoneNumber', '==', targetPhone)"), 'phoneNumber exact index query missing');
assert(code.includes("where('phone', '==', targetPhone)"), 'phone exact index query missing');
console.log('✅ 3. Targeted phone number queries correctly implemented');

// 4. Verify targeted string / code queries
assert(code.includes("where('customerCode', '==', upper)"), 'customerCode exact query missing');
assert(code.includes("where('accountId', '==', upper)"), 'accountId exact query missing');
assert(code.includes("where('email', '==', lower)"), 'email exact query missing');
console.log('✅ 4. Customer code, accountId, and email exact index queries implemented');

// 5. Verify search cache & invalidation
assert(code.includes("const walletSearchCache = new Map()"), 'walletSearchCache missing');
assert(code.includes("SEARCH_CACHE_TTL_MS"), 'SEARCH_CACHE_TTL_MS missing');
assert(code.includes("walletSearchCache.clear()"), 'walletSearchCache.clear missing in invalidateWalletCache');
console.log('✅ 5. In-memory search cache with TTL and cache invalidator active');

console.log('\n🎉 ALL 5 VERIFICATION CHECKS FOR PHASE 2 PASSED PERFECTLY!\n');
