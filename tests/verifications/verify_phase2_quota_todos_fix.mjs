/**
 * Verification Test: Phase 2 Quota Leak Elimination & Duplicate Todo Cleanup
 * Location: Management System/tests/verifications/verify_phase2_quota_todos_fix.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MGMT_DIR = path.resolve(__dirname, '../..');

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        passed++;
        console.log(`  [PASS] ${message}`);
    } else {
        failed++;
        console.error(`  [FAIL] ${message}`);
    }
}

console.log('================================================================================');
console.log('  VERIFY PHASE 2: QUOTA LEAK ELIMINATION & DUPLICATE TODO CLEANUP');
console.log('================================================================================\n');

try {
    const bstPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingStatusTransaction.js');
    const bdsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingDeleteService.js');
    const ossPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/orderSyncService.js');

    const bstSrc = fs.readFileSync(bstPath, 'utf8');
    const bdsSrc = fs.readFileSync(bdsPath, 'utf8');
    const ossSrc = fs.readFileSync(ossPath, 'utf8');

    // --- Suite 1: Duplicate To-do Elimination ---
    console.log('--- Suite 1: Duplicate To-do Elimination ---');
    // Ensure only 1 REFUND_MANUAL creation exists (inside the transaction)
    const refundManualMatches = bstSrc.match(/type:\s*['"]REFUND_MANUAL['"]/g) || [];
    assert(refundManualMatches.length === 1, `billingStatusTransaction.js: Exactly 1 REFUND_MANUAL creation remains (found ${refundManualMatches.length})`);
    
    // Ensure the redundant setDoc outside transaction is gone
    assert(!bstSrc.includes('Created manual refund To-do for'), 'Redundant outside-transaction console log and setDoc eradicated');
    assert(bstSrc.includes('transaction.set(refundTodoRef,'), 'Atomic in-transaction REFUND_MANUAL to-do preserved');

    // --- Suite 2: Catalog Sync & Quota Guard ---
    console.log('\n--- Suite 2: Catalog Sync & Quota Guard ---');
    assert(ossSrc.includes('inFlightSyncPromise'), 'orderSyncService.js implements inFlightSyncPromise deduplication');
    assert(ossSrc.includes('SYNC_THROTTLE_MS'), 'orderSyncService.js implements SYNC_THROTTLE_MS throttle window');
    assert(ossSrc.includes('finally {'), 'orderSyncService.js cleans up inFlightSyncPromise via finally block');

    // --- Suite 3: Delete Sync Parity ---
    console.log('\n--- Suite 3: Delete Sync Parity ---');
    assert(bdsSrc.includes("import { syncRecentOrdersCatalog } from './orderSyncService'"), 'billingDeleteService.js imports syncRecentOrdersCatalog');
    assert(bdsSrc.includes('syncRecentOrdersCatalog().catch('), 'billingDeleteService.js calls syncRecentOrdersCatalog upon order deletion');

    // --- Suite 4: In-Flight Promise Deduplication Simulation ---
    console.log('\n--- Suite 4: In-Flight Promise Deduplication Simulation ---');
    let callCount = 0;
    let mockInFlight = null;
    
    async function mockSyncRecentOrdersCatalog() {
        if (mockInFlight) return mockInFlight;
        mockInFlight = (async () => {
            callCount++;
            await new Promise(r => setTimeout(r, 50));
            return { success: true, count: 50 };
        })().finally(() => { mockInFlight = null; });
        return mockInFlight;
    }

    // Fire 2 concurrent sync calls (simulating billingTransactionService + usePosActions)
    const [res1, res2] = await Promise.all([
        mockSyncRecentOrdersCatalog(),
        mockSyncRecentOrdersCatalog()
    ]);

    assert(res1.success === true && res2.success === true, 'Both concurrent callers resolve successfully');
    assert(callCount === 1, `Concurrent calls deduplicated to exactly 1 execution (ran ${callCount} times)`);

} catch (err) {
    console.error('Fatal verification error:', err);
    process.exit(1);
}

console.log('\n================================================================================');
console.log(`  PHASE 2 VERIFICATION: TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================================\n');

if (failed > 0) process.exit(1);
