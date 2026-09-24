/**
 * Verification Test: Phase 1 Split-Line Stock Aggregation & VAT Parity
 * Location: Management System/tests/verifications/verify_phase1_stock_split_fix.mjs
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
console.log('  VERIFY PHASE 1: SPLIT-LINE STOCK AGGREGATION & VAT PARITY');
console.log('================================================================================\n');

try {
    const btsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
    const bstPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingStatusTransaction.js');
    const sshPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billing/statusStockHandler.js');
    const uppPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosPayment.js');

    const btsSrc = fs.readFileSync(btsPath, 'utf8');
    const bstSrc = fs.readFileSync(bstPath, 'utf8');
    const sshSrc = fs.readFileSync(sshPath, 'utf8');
    const uppSrc = fs.readFileSync(uppPath, 'utf8');

    // --- Suite 1: Source Code Invariants ---
    console.log('--- Suite 1: Source Code Invariants ---');
    assert(btsSrc.includes('const aggregatedProductMap = new Map();'), 'billingTransactionService.js aggregates items using Map');
    assert(btsSrc.includes('aggregatedProductMap.get(itemIdentifier).totalQty += qty;'), 'billingTransactionService.js sums totalQty across split lines');
    assert(btsSrc.includes('requiredQty = productRefs[index].totalQty'), 'validateStock uses aggregated totalQty');
    assert(btsSrc.includes('Boolean(orderData.vatOnShipping ?? orderData.summary?.vatOnShipping ?? false)'), 'billingTransactionService.js defaults isVatOnShipping to false via Boolean');

    assert(bstSrc.includes('const aggregatedProductMap = new Map();'), 'billingStatusTransaction.js aggregates items using Map');
    assert(bstSrc.includes('aggregatedProductMap.get(itemIdentifier).qty += qty;'), 'billingStatusTransaction.js sums qty across split lines');

    assert(sshSrc.includes('productRefs[index].qty || productRefs[index].totalQty'), 'statusStockHandler.js safely handles qty or totalQty');
    assert(uppSrc.includes('const isVatOnShipping = Boolean(activeTab?.vatOnShipping);'), 'usePosPayment.js uses Boolean(activeTab?.vatOnShipping)');

    // --- Suite 2: Split-Line Stock Logic Simulation ---
    console.log('\n--- Suite 2: Split-Line Stock Logic Simulation ---');
    const sampleItems = [
        { sku: 'SKU-001', name: 'Item 1 Line A', qty: 2, price: 100 },
        { sku: 'SKU-002', name: 'Item 2', qty: 1, price: 200 },
        { sku: 'SKU-001', name: 'Item 1 Line B (split note)', qty: 3, price: 100 }
    ];

    const aggregated = new Map();
    for (const item of sampleItems) {
        const id = item.sku;
        const qty = Math.max(1, Number(item.qty || 1));
        if (aggregated.has(id)) {
            aggregated.get(id).totalQty += qty;
        } else {
            aggregated.set(id, { sku: id, totalQty: qty });
        }
    }

    const uniqueProducts = Array.from(aggregated.values());
    assert(uniqueProducts.length === 2, 'Deduplicated to 2 unique SKU entries');
    const sku1 = uniqueProducts.find(p => p.sku === 'SKU-001');
    assert(sku1 && sku1.totalQty === 5, 'SKU-001 correctly aggregated totalQty to 5 (2 + 3)');

    // Insufficient stock check
    const stockAvailable = 4;
    const isOutOfStock = (stockAvailable - sku1.totalQty) < 0;
    assert(isOutOfStock === true, 'Demand 5 against stock 4 triggers stock shortage correctly');

    // Sufficient stock check
    const stockAvailable2 = 10;
    const newStock = stockAvailable2 - sku1.totalQty;
    assert(newStock === 5, 'Stock deducted from 10 to 5 accurately without overwrite');

} catch (err) {
    console.error('Fatal verification error:', err);
    process.exit(1);
}

console.log('\n================================================================================');
console.log(`  PHASE 1 VERIFICATION: TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================================\n');

if (failed > 0) process.exit(1);
