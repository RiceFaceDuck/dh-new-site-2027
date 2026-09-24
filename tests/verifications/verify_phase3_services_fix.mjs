/**
 * Verification Test: Phase 3 Service Reliability & Deep Search Optimization
 * Location: Management System/tests/verifications/verify_phase3_services_fix.mjs
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
console.log('  VERIFY PHASE 3: SERVICE RELIABILITY & DEEP SEARCH OPTIMIZATION');
console.log('================================================================================\n');

try {
    const bpsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingPrintService.js');
    const bqsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingQueryService.js');
    const memoryPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/ssr memory billing.md');

    const bpsSrc = fs.readFileSync(bpsPath, 'utf8');
    const bqsSrc = fs.readFileSync(bqsPath, 'utf8');
    const memorySrc = fs.readFileSync(memoryPath, 'utf8');

    // --- Suite 1: billingPrintService Multi-Tenant / Dynamic Path Guard ---
    console.log('--- Suite 1: billingPrintService Dynamic Collection Path ---');
    assert(bpsSrc.includes("import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils'"), 'billingPrintService.js imports getCollectionPath');
    assert(bpsSrc.includes("getCollectionPath('orders')"), 'billingPrintService.js uses getCollectionPath for orders collection');
    assert(!bpsSrc.includes("doc(db, 'orders'"), 'billingPrintService.js does not hardcode raw orders collection');
    assert(bpsSrc.includes('increment(1)'), 'billingPrintService.js atomic increment for printCount preserved');

    // --- Suite 2: billingQueryService Cache-First & Quota Optimization ---
    console.log('\n--- Suite 2: billingQueryService Cache-First & Quota Optimization ---');
    assert(bqsSrc.includes("import { readCachedOrders } from './orderCacheService'"), 'billingQueryService.js imports readCachedOrders');
    assert(bqsSrc.includes("const { orders: cached } = readCachedOrders()"), 'billingQueryService.js checks cached orders first');
    assert(bqsSrc.includes("limit(50)"), 'billingQueryService.js reduced fallback limit from 300 to 50 to prevent quota leak');
    assert(!bqsSrc.includes("limit(300)"), 'billingQueryService.js completely removed limit(300) query');
    assert(bqsSrc.includes("termLower"), 'billingQueryService.js preserves full-text search filtering across inOrderId, inCustomer, etc.');

    // --- Suite 3: Local Grimoire / SSR Memory Updates ---
    console.log('\n--- Suite 3: Local Grimoire / SSR Memory Updates ---');
    assert(memorySrc.includes('Deep Search Quota Fallback'), 'ssr memory billing.md records Lesson 11 on deep search fallback');

    console.log('\n================================================================================');
    console.log(`  PHASE 3 VERIFICATION SUMMARY: ${passed}/${total} assertions passed`);
    if (failed > 0) {
        console.error(`  ⚠️ FAILED: ${failed} assertions failed!`);
        process.exit(1);
    } else {
        console.log('  🎉 ALL PHASE 3 VERIFICATIONS PASSED SUCCESSFULLY!');
        console.log('================================================================================\n');
        process.exit(0);
    }
} catch (err) {
    console.error('Fatal error during Phase 3 verification:', err);
    process.exit(1);
}
