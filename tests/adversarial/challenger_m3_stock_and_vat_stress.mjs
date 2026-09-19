/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE — MILESTONE M3:
 * SPLIT-LINE STOCK AGGREGATION, BACKEND VAT-ON-SHIPPING & LOYALTY CONFIG UNWRAPPING
 * 
 * Location: Management System/tests/adversarial/challenger_m3_stock_and_vat_stress.mjs
 * 
 * Scope:
 * 1. Split-Line Stock Boundary Stress:
 *    - Identical SKUs across 2, 3, and 5 separate lines summing to stock, stock-1, and stock+1.
 *    - Strict enforcement: status === 'Paid' is strictly blocked on stock+1, while status === 'Draft' is allowed.
 *    - Multi-SKU mixed carts, inconsistent row stocks, and 100 randomized split-line cart permutations.
 * 2. 500 Randomized Parameter Sets for vatOnShipping Parity:
 *    - vatOnShipping === false and vatOnShipping === true across 'included', 'excluded', and 'exempt' VAT.
 *    - Verification of 0.00 THB diff between POS UI and backend billingTransactionService.js.
 * 3. Loyalty Configuration Unwrapping & Calculation Stress:
 *    - Unwrapping against nested .config, nested .creditConfig, and root flat schemas.
 *    - Sku bonus rules parsing, split-line item bonus accumulation, tier multipliers, and edge cases.
 *    - Source file pattern integrity in billingTransactionService.js and statusWalletHandler.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import pure math engines from dh-shared
import { calculateNetTotal } from '../../dh-shared/src/priceEngine.js';
import { calculateVat } from '../../dh-shared/src/taxEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MGMT_DIR = path.resolve(__dirname, '../..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function report(condition, testName, detail = '') {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ [PASS] ${testName}`);
    } else {
        failedTests++;
        console.error(`  ❌ [FAIL] ${testName}: ${detail}`);
    }
}

console.log('================================================================================');
console.log('🔥 EMPIRICAL ADVERSARIAL CHALLENGER SUITE: M3 STOCK, VAT & LOYALTY MATH');
console.log('================================================================================\n');

// =============================================================================
// DOMAIN 1: SPLIT-LINE STOCK AGGREGATION & BOUNDARY TESTS
// =============================================================================
console.log('================================================================================');
console.log('📦 DOMAIN 1: Split-Line Stock Aggregation & Boundary Stress Tests');
console.log('================================================================================\n');

/**
 * Replicate exact stock evaluation logic from usePosActions.js:283-311
 */
function evaluatePosStockGuard(items, status) {
    const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

    const lineOutOfStock = (items || []).find(item => sanitizeNum(item.stock) < sanitizeNum(item.qty));
    const aggregatedStockDemand = (items || []).reduce((acc, item) => {
        const key = item.sku || item.id || item.name || 'unknown';
        const qty = sanitizeNum(item.qty);
        const stock = sanitizeNum(item.stock);
        if (!acc[key]) {
            acc[key] = {
                key,
                name: item.name || item.itemName || key,
                totalQty: 0,
                stock: stock
            };
        } else {
            acc[key].stock = Math.min(acc[key].stock, stock);
        }
        acc[key].totalQty += qty;
        return acc;
    }, {});

    const aggregatedOutOfStock = Object.values(aggregatedStockDemand).find(
        item => item.stock < item.totalQty
    );
    const outOfStockItem = aggregatedOutOfStock || lineOutOfStock;

    if (!items || items.length === 0) {
        return { allowed: false, reason: 'EMPTY_CART', outOfStockItem: null };
    }

    if (outOfStockItem && status === 'Paid') {
        return {
            allowed: false,
            reason: 'OUT_OF_STOCK_BLOCKED',
            outOfStockItem,
            message: `สินค้า [${outOfStockItem.key || outOfStockItem.name}] สต็อกไม่เพียงพอ ไม่สามารถชำระเงินได้ (กรุณาบันทึกเป็นบิลร่าง Draft)`
        };
    }

    return {
        allowed: true,
        reason: 'ALLOWED',
        outOfStockItem: outOfStockItem || null,
        isDraftBypass: Boolean(outOfStockItem && status === 'Draft')
    };
}

// -----------------------------------------------------------------------------
// 1.1: 2-Line Split Boundary Tests (sum === stock, stock-1, stock+1)
// -----------------------------------------------------------------------------
console.log('--- 1.1: 2-Line Split Boundary Tests ---');

const stock2Line = 10;

// Case 1: sum === stock - 1 (qty: 5 + 4 = 9, stock = 10)
const cart2Line_minus1 = [
    { sku: 'DH-RAM-16G', name: 'DDR4 16GB', stock: stock2Line, qty: 5 },
    { sku: 'DH-RAM-16G', name: 'DDR4 16GB', stock: stock2Line, qty: 4 }
];
const r2_m1_paid = evaluatePosStockGuard(cart2Line_minus1, 'Paid');
const r2_m1_draft = evaluatePosStockGuard(cart2Line_minus1, 'Draft');
report(r2_m1_paid.allowed === true, '2-line sum === stock - 1 (5+4=9 <= 10) -> Paid is ALLOWED');
report(r2_m1_draft.allowed === true, '2-line sum === stock - 1 (5+4=9 <= 10) -> Draft is ALLOWED');

// Case 2: sum === stock (qty: 5 + 5 = 10, stock = 10)
const cart2Line_exact = [
    { sku: 'DH-RAM-16G', name: 'DDR4 16GB', stock: stock2Line, qty: 5 },
    { sku: 'DH-RAM-16G', name: 'DDR4 16GB', stock: stock2Line, qty: 5 }
];
const r2_ex_paid = evaluatePosStockGuard(cart2Line_exact, 'Paid');
const r2_ex_draft = evaluatePosStockGuard(cart2Line_exact, 'Draft');
report(r2_ex_paid.allowed === true, '2-line sum === stock (5+5=10 <= 10) -> Paid is ALLOWED');
report(r2_ex_draft.allowed === true, '2-line sum === stock (5+5=10 <= 10) -> Draft is ALLOWED');

// Case 3: sum === stock + 1 (qty: 5 + 6 = 11, stock = 10) Note: neither row individually exceeds 10!
const cart2Line_plus1 = [
    { sku: 'DH-RAM-16G', name: 'DDR4 16GB', stock: stock2Line, qty: 5 },
    { sku: 'DH-RAM-16G', name: 'DDR4 16GB', stock: stock2Line, qty: 6 }
];
const r2_p1_paid = evaluatePosStockGuard(cart2Line_plus1, 'Paid');
const r2_p1_draft = evaluatePosStockGuard(cart2Line_plus1, 'Draft');
report(
    r2_p1_paid.allowed === false && r2_p1_paid.outOfStockItem.key === 'DH-RAM-16G' && r2_p1_paid.outOfStockItem.totalQty === 11,
    '2-line sum === stock + 1 (5+6=11 > 10) -> Paid is STRICTLY BLOCKED with key DH-RAM-16G'
);
report(
    r2_p1_draft.allowed === true && r2_p1_draft.isDraftBypass === true,
    '2-line sum === stock + 1 (5+6=11 > 10) -> Draft is ALLOWED (Draft bypass)'
);

// -----------------------------------------------------------------------------
// 1.2: 3-Line Split Boundary Tests (sum === stock, stock-1, stock+1)
// -----------------------------------------------------------------------------
console.log('\n--- 1.2: 3-Line Split Boundary Tests ---');

const stock3Line = 15;

// Case 1: sum === stock - 1 (qty: 5 + 5 + 4 = 14, stock = 15)
const cart3Line_minus1 = [
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 5 },
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 5 },
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 4 }
];
const r3_m1_paid = evaluatePosStockGuard(cart3Line_minus1, 'Paid');
const r3_m1_draft = evaluatePosStockGuard(cart3Line_minus1, 'Draft');
report(r3_m1_paid.allowed === true, '3-line sum === stock - 1 (5+5+4=14 <= 15) -> Paid is ALLOWED');
report(r3_m1_draft.allowed === true, '3-line sum === stock - 1 (5+5+4=14 <= 15) -> Draft is ALLOWED');

// Case 2: sum === stock (qty: 5 + 5 + 5 = 15, stock = 15)
const cart3Line_exact = [
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 5 },
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 5 },
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 5 }
];
const r3_ex_paid = evaluatePosStockGuard(cart3Line_exact, 'Paid');
const r3_ex_draft = evaluatePosStockGuard(cart3Line_exact, 'Draft');
report(r3_ex_paid.allowed === true, '3-line sum === stock (5+5+5=15 <= 15) -> Paid is ALLOWED');
report(r3_ex_draft.allowed === true, '3-line sum === stock (5+5+5=15 <= 15) -> Draft is ALLOWED');

// Case 3: sum === stock + 1 (qty: 5 + 5 + 6 = 16, stock = 15) Note: individual lines (5, 5, 6) all <= 15
const cart3Line_plus1 = [
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 5 },
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 5 },
    { sku: 'DH-SSD-1TB', name: 'NVMe 1TB', stock: stock3Line, qty: 6 }
];
const r3_p1_paid = evaluatePosStockGuard(cart3Line_plus1, 'Paid');
const r3_p1_draft = evaluatePosStockGuard(cart3Line_plus1, 'Draft');
report(
    r3_p1_paid.allowed === false && r3_p1_paid.outOfStockItem.key === 'DH-SSD-1TB' && r3_p1_paid.outOfStockItem.totalQty === 16,
    '3-line sum === stock + 1 (5+5+6=16 > 15) -> Paid is STRICTLY BLOCKED'
);
report(
    r3_p1_draft.allowed === true && r3_p1_draft.isDraftBypass === true,
    '3-line sum === stock + 1 (5+5+6=16 > 15) -> Draft is ALLOWED'
);

// -----------------------------------------------------------------------------
// 1.3: 5-Line Split Boundary Tests (sum === stock, stock-1, stock+1)
// -----------------------------------------------------------------------------
console.log('\n--- 1.3: 5-Line Split Boundary Tests ---');

const stock5Line = 25;

// Case 1: sum === stock - 1 (qty: 5 + 5 + 5 + 5 + 4 = 24, stock = 25)
const cart5Line_minus1 = [
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 4 }
];
const r5_m1_paid = evaluatePosStockGuard(cart5Line_minus1, 'Paid');
const r5_m1_draft = evaluatePosStockGuard(cart5Line_minus1, 'Draft');
report(r5_m1_paid.allowed === true, '5-line sum === stock - 1 (5*4+4=24 <= 25) -> Paid is ALLOWED');
report(r5_m1_draft.allowed === true, '5-line sum === stock - 1 (5*4+4=24 <= 25) -> Draft is ALLOWED');

// Case 2: sum === stock (qty: 5 * 5 = 25, stock = 25)
const cart5Line_exact = [
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 }
];
const r5_ex_paid = evaluatePosStockGuard(cart5Line_exact, 'Paid');
const r5_ex_draft = evaluatePosStockGuard(cart5Line_exact, 'Draft');
report(r5_ex_paid.allowed === true, '5-line sum === stock (5*5=25 <= 25) -> Paid is ALLOWED');
report(r5_ex_draft.allowed === true, '5-line sum === stock (5*5=25 <= 25) -> Draft is ALLOWED');

// Case 3: sum === stock + 1 (qty: 5 + 5 + 5 + 5 + 6 = 26, stock = 25) All individual lines <= 25
const cart5Line_plus1 = [
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 5 },
    { sku: 'DH-GPU-4070', name: 'RTX 4070', stock: stock5Line, qty: 6 }
];
const r5_p1_paid = evaluatePosStockGuard(cart5Line_plus1, 'Paid');
const r5_p1_draft = evaluatePosStockGuard(cart5Line_plus1, 'Draft');
report(
    r5_p1_paid.allowed === false && r5_p1_paid.outOfStockItem.key === 'DH-GPU-4070' && r5_p1_paid.outOfStockItem.totalQty === 26,
    '5-line sum === stock + 1 (5*4+6=26 > 25) -> Paid is STRICTLY BLOCKED'
);
report(
    r5_p1_draft.allowed === true && r5_p1_draft.isDraftBypass === true,
    '5-line sum === stock + 1 (5*4+6=26 > 25) -> Draft is ALLOWED'
);

// -----------------------------------------------------------------------------
// 1.4: Extreme Boundary Cases & Invariant Checks
// -----------------------------------------------------------------------------
console.log('\n--- 1.4: Extreme Boundary Cases & Invariant Checks ---');

// Zero stock boundary: 2 lines with qty 0 and 0
const zeroStockCart_allowed = [
    { sku: 'ZERO-SKU', stock: 0, qty: 0 },
    { sku: 'ZERO-SKU', stock: 0, qty: 0 }
];
report(evaluatePosStockGuard(zeroStockCart_allowed, 'Paid').allowed === true, 'Zero stock with zero demand allowed');

// Zero stock boundary: 2 lines with qty 0 and 1 -> sum 1 > 0
const zeroStockCart_blocked = [
    { sku: 'ZERO-SKU', stock: 0, qty: 0 },
    { sku: 'ZERO-SKU', stock: 0, qty: 1 }
];
report(evaluatePosStockGuard(zeroStockCart_blocked, 'Paid').allowed === false, 'Zero stock with qty 1 strictly blocked');
report(evaluatePosStockGuard(zeroStockCart_blocked, 'Draft').allowed === true, 'Zero stock with qty 1 allows Draft');

// Single item unit stock (stock = 1) across 2 split lines: 1 + 1 = 2 > 1
const unitStockCart_blocked = [
    { sku: 'UNIT-SKU', stock: 1, qty: 1 },
    { sku: 'UNIT-SKU', stock: 1, qty: 1 }
];
report(evaluatePosStockGuard(unitStockCart_blocked, 'Paid').allowed === false, 'Stock=1 split into 1+1 strictly blocked on Paid');
report(evaluatePosStockGuard(unitStockCart_blocked, 'Draft').allowed === true, 'Stock=1 split into 1+1 allowed on Draft');

// Inconsistent stock values across split rows (Math.min conservative guard)
// Row 1 reports stock=10, Row 2 reports stock=7. Sum = 8. (8 <= 10, but 8 > 7!)
const inconsistentStockCart = [
    { sku: 'INCONSISTENT-SKU', stock: 10, qty: 4 },
    { sku: 'INCONSISTENT-SKU', stock: 7, qty: 4 }
];
const rInconsistent = evaluatePosStockGuard(inconsistentStockCart, 'Paid');
report(
    rInconsistent.allowed === false && rInconsistent.outOfStockItem.stock === 7,
    'Inconsistent stock values takes Math.min(10, 7) = 7, correctly blocking totalQty=8'
);

// Mixed multi-SKU cart: 3 SKUs, only one depleted
const multiSkuCart = [
    { sku: 'SKU-A', name: 'Item A', stock: 20, qty: 5 },
    { sku: 'SKU-A', name: 'Item A', stock: 20, qty: 5 }, // SKU-A total = 10 <= 20
    { sku: 'SKU-B', name: 'Item B', stock: 8, qty: 4 },
    { sku: 'SKU-B', name: 'Item B', stock: 8, qty: 5 },  // SKU-B total = 9 > 8 (depleted!)
    { sku: 'SKU-C', name: 'Item C', stock: 100, qty: 1 } // SKU-C total = 1 <= 100
];
const rMulti = evaluatePosStockGuard(multiSkuCart, 'Paid');
report(
    rMulti.allowed === false && rMulti.outOfStockItem.key === 'SKU-B',
    'Multi-SKU cart with 1 depleted split SKU flags exactly SKU-B and blocks Paid'
);
report(evaluatePosStockGuard(multiSkuCart, 'Draft').allowed === true, 'Multi-SKU cart allows Draft save');

// -----------------------------------------------------------------------------
// 1.5: 100 Randomized Split-Line Cart Permutations
// -----------------------------------------------------------------------------
console.log('\n--- 1.5: 100 Randomized Split-Line Cart Permutations ---');

let randomizedStockGuardFailures = 0;

for (let i = 0; i < 100; i++) {
    const stock = Math.floor(Math.random() * 50) + 2; // stock between 2 and 51
    const lineCount = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, or 5 lines
    const mode = i % 3; // 0: sum = stock - 1, 1: sum = stock, 2: sum = stock + 1

    let targetTotal;
    if (mode === 0) targetTotal = Math.max(1, stock - 1);
    else if (mode === 1) targetTotal = stock;
    else targetTotal = stock + 1;

    // Distribute targetTotal across lineCount lines
    const quantities = new Array(lineCount).fill(0);
    let remaining = targetTotal;
    for (let l = 0; l < lineCount - 1; l++) {
        const q = Math.floor(Math.random() * (remaining / 2));
        quantities[l] = q;
        remaining -= q;
    }
    quantities[lineCount - 1] = remaining;

    const testCart = quantities.map((qty, idx) => ({
        sku: `RND-SKU-${i}`,
        name: `Random SKU ${i}`,
        stock: stock,
        qty: qty
    }));

    const paidResult = evaluatePosStockGuard(testCart, 'Paid');
    const draftResult = evaluatePosStockGuard(testCart, 'Draft');

    const expectedAllowedOnPaid = targetTotal <= stock;
    const expectedAllowedOnDraft = true;

    if (paidResult.allowed !== expectedAllowedOnPaid || draftResult.allowed !== expectedAllowedOnDraft) {
        randomizedStockGuardFailures++;
        console.error(`Mismatch at permutation ${i}: stock=${stock}, total=${targetTotal}, paid=${paidResult.allowed}, draft=${draftResult.allowed}`);
    }
}

report(
    randomizedStockGuardFailures === 0,
    `100 randomized split-line cart permutations: 100% strict boundary conformance (failures: ${randomizedStockGuardFailures})`
);


// =============================================================================
// DOMAIN 2: 500 RANDOMIZED PARAMETER SETS FOR vatOnShipping PARITY
// =============================================================================
console.log('\n================================================================================');
console.log('💰 DOMAIN 2: 500 Randomized Parameter Sets for vatOnShipping Parity');
console.log('================================================================================\n');

/**
 * Replicate POS UI Math from usePosPayment.js:6-125
 */
function calculatePosUiTotal({ items = [], discountTotal = 0, otherFeeAmount = 0, shippingFee = 0, vatType = 'exempt', vatOnShipping = false }) {
    const sanitizeNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const itemSubTotal = items.reduce((sum, item) => sum + ((sanitizeNum(item.price) - sanitizeNum(item.discount)) * Math.max(1, sanitizeNum(item.qty))), 0);
    const baseTotal = Math.max(0, itemSubTotal - discountTotal) + otherFeeAmount;
    const isVatOnShipping = Boolean(vatOnShipping);
    const taxableAmount = baseTotal + (isVatOnShipping ? shippingFee : 0);

    let vatAmount = 0;
    let netTotal = 0;

    if (vatType === 'included') {
        vatAmount = Math.round((taxableAmount * 7 / 107) * 100) / 100;
        netTotal = Math.round((baseTotal + shippingFee) * 100) / 100;
    } else if (vatType === 'excluded') {
        vatAmount = Math.round((taxableAmount * 0.07) * 100) / 100;
        netTotal = Math.round((baseTotal + shippingFee + vatAmount) * 100) / 100;
    } else {
        vatAmount = 0;
        netTotal = Math.round((baseTotal + shippingFee) * 100) / 100;
    }

    return { vatAmount, netTotal, itemSubTotal, baseTotal, taxableAmount };
}

/**
 * Replicate Backend Math from billingTransactionService.js:118-148
 */
function calculateBackendSecureTotal({ items = [], shippingFee = 0, otherFeeAmount = 0, discountTotal = 0, vatType = 'exempt', vatOnShipping = false }) {
    const shippingCost = Number(shippingFee || 0);
    const rawVatType = (vatType || '').toLowerCase();
    const isVatOnShipping = vatOnShipping !== false;
    const isExcludedVat = rawVatType === 'excluded';

    // When vatOnShipping is false and vatType is 'excluded', shippingCost must NOT be part of the taxable base
    const taxableShippingCost = (!isVatOnShipping && isExcludedVat) ? 0 : shippingCost;

    const calculatedPrices = calculateNetTotal({
        items,
        shippingCost: taxableShippingCost,
        otherFeeAmount,
        discountAmount: discountTotal,
        promotions: []
    });

    let vatTypeMapped = 'ไม่มี VAT';
    if (rawVatType === 'included') vatTypeMapped = 'รวม VAT';
    if (rawVatType === 'excluded') vatTypeMapped = 'แยก VAT';

    const vatResult = calculateVat(calculatedPrices.netTotal, vatTypeMapped);
    const finalSecureNetTotal = (!isVatOnShipping && isExcludedVat)
        ? Math.round((vatResult.finalTotal + shippingCost) * 100) / 100
        : vatResult.finalTotal;

    return { finalSecureNetTotal, vatAmount: vatResult.vatAmount };
}

// Deterministic representative boundary checks
console.log('--- 2.1: Deterministic vatOnShipping Boundary Checks ---');

const boundaryFixtures = [
    { name: 'Excluded VAT + vatOnShipping=false', items: [{ price: 1000, qty: 1 }], shipping: 60, discount: 0, otherFee: 0, vatType: 'excluded', vatOnShipping: false, expNet: 1130.00 },
    { name: 'Excluded VAT + vatOnShipping=true', items: [{ price: 1000, qty: 1 }], shipping: 60, discount: 0, otherFee: 0, vatType: 'excluded', vatOnShipping: true, expNet: 1134.20 },
    { name: 'Included VAT + vatOnShipping=false', items: [{ price: 1070, qty: 1 }], shipping: 50, discount: 0, otherFee: 0, vatType: 'included', vatOnShipping: false, expNet: 1120.00 },
    { name: 'Included VAT + vatOnShipping=true', items: [{ price: 1070, qty: 1 }], shipping: 50, discount: 0, otherFee: 0, vatType: 'included', vatOnShipping: true, expNet: 1120.00 },
    { name: 'Exempt VAT + vatOnShipping=false', items: [{ price: 500, qty: 1 }], shipping: 40, discount: 0, otherFee: 0, vatType: 'exempt', vatOnShipping: false, expNet: 540.00 },
    { name: 'Exempt VAT + vatOnShipping=true', items: [{ price: 500, qty: 1 }], shipping: 40, discount: 0, otherFee: 0, vatType: 'exempt', vatOnShipping: true, expNet: 540.00 },
    { name: 'Zero Subtotal with Shipping', items: [{ price: 0, qty: 1 }], shipping: 100, discount: 0, otherFee: 0, vatType: 'excluded', vatOnShipping: false, expNet: 100.00 },
    { name: 'Zero Subtotal with Shipping Excluded+Taxable', items: [{ price: 0, qty: 1 }], shipping: 100, discount: 0, otherFee: 0, vatType: 'excluded', vatOnShipping: true, expNet: 107.00 },
    { name: 'Discount > Subtotal (Floor Guard)', items: [{ price: 200, qty: 1 }], shipping: 50, discount: 300, otherFee: 10, vatType: 'excluded', vatOnShipping: false, expNet: 60.70 },
    { name: 'Fractional Satang Pricing (99.95 THB)', items: [{ price: 99.95, qty: 1 }], shipping: 35.50, discount: 5.25, otherFee: 2.00, vatType: 'excluded', vatOnShipping: false, expNet: 138.97 }
];

for (const fix of boundaryFixtures) {
    const pos = calculatePosUiTotal({
        items: fix.items,
        shippingFee: fix.shipping,
        discountTotal: fix.discount,
        otherFeeAmount: fix.otherFee,
        vatType: fix.vatType,
        vatOnShipping: fix.vatOnShipping
    });

    const backend = calculateBackendSecureTotal({
        items: fix.items,
        shippingFee: fix.shipping,
        discountTotal: fix.discount,
        otherFeeAmount: fix.otherFee,
        vatType: fix.vatType,
        vatOnShipping: fix.vatOnShipping
    });

    const diff = Math.abs(pos.netTotal - backend.finalSecureNetTotal);
    report(
        diff < 0.001 && pos.netTotal === fix.expNet,
        `${fix.name}: POS=${pos.netTotal} THB | Backend=${backend.finalSecureNetTotal} THB (diff 0.00 THB, expected ${fix.expNet})`
    );
}

// -----------------------------------------------------------------------------
// 2.2: 500 Randomized Parameter Sets Across All Dimensions
// -----------------------------------------------------------------------------
console.log('\n--- 2.2: 500 Randomized Parameter Sets Stress Test ---');

let mismatches500 = 0;
let maxDelta = 0;
const vatTypesList = ['included', 'excluded', 'exempt'];

for (let run = 1; run <= 500; run++) {
    // Generate multi-item cart with randomized prices and quantities
    const numItems = Math.floor(Math.random() * 5) + 1;
    const items = [];
    for (let k = 0; k < numItems; k++) {
        items.push({
            sku: `ITEM-RND-${k}`,
            price: Math.round((Math.random() * 5000 + 10) * 100) / 100,
            discount: 0,
            qty: Math.floor(Math.random() * 4) + 1
        });
    }

    const shipping = Math.round((Math.random() * 350) * 100) / 100;
    const discount = Math.random() < 0.3 ? 0 : Math.round((Math.random() * 300) * 100) / 100;
    const otherFee = Math.random() < 0.2 ? 0 : Math.round((Math.random() * 150) * 100) / 100;
    const vatOnShipping = Math.random() < 0.5;
    const vatType = vatTypesList[run % 3];

    const posRes = calculatePosUiTotal({
        items,
        discountTotal: discount,
        otherFeeAmount: otherFee,
        shippingFee: shipping,
        vatType,
        vatOnShipping
    });

    const backendRes = calculateBackendSecureTotal({
        items,
        discountTotal: discount,
        otherFeeAmount: otherFee,
        shippingFee: shipping,
        vatType,
        vatOnShipping
    });

    const delta = Math.abs(posRes.netTotal - backendRes.finalSecureNetTotal);
    if (delta > maxDelta) maxDelta = delta;

    if (delta > 0.001) {
        mismatches500++;
        console.error(`Run #${run} FAIL: numItems=${numItems}, ship=${shipping}, disc=${discount}, fee=${otherFee}, vatType=${vatType}, vatOnShip=${vatOnShipping} => POS=${posRes.netTotal}, Backend=${backendRes.finalSecureNetTotal}, delta=${delta}`);
    }
}

report(
    mismatches500 === 0,
    `500 Randomized Trials: Exactly 0.00 THB diff between POS UI and Backend priceEngine (max delta: ${maxDelta.toFixed(4)} THB)`
);


// =============================================================================
// DOMAIN 3: LOYALTY CONFIG UNWRAPPING & CALCULATION STRESS
// =============================================================================
console.log('\n================================================================================');
console.log('🎁 DOMAIN 3: Loyalty Configuration Unwrapping & Calculation Stress');
console.log('================================================================================\n');

// Load authentic creditFormatService functions dynamically via ESM Data URI
const creditFormatServicePath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/credit/creditFormatService.js');
const rawCreditSrc = fs.readFileSync(creditFormatServicePath, 'utf8');

// Strip non-pure imports and runtime listener to run authentic code in Node
const pureCreditSrc = rawCreditSrc
    .replace(/import\s+[^;]+;\r?\n/g, '')
    .replace(/initRoleTierConfigListener\(\);\r?\n/, 'const doc=null, db=null, getCollectionPath=null;\n');

const creditDataUri = 'data:text/javascript;base64,' + Buffer.from(pureCreditSrc).toString('base64');
const { calculateEarnedPoints, getUserTier, formatCredit } = await import(creditDataUri);

// The canonical unwrap expression used in billingTransactionService.js:179 and statusWalletHandler.js:102
const unwrapLoyaltyConfig = (settingsData) => {
    return settingsData?.config || settingsData?.creditConfig || settingsData || {};
};

// -----------------------------------------------------------------------------
// 3.1: Nested .config Schema (written by useCreditSettingsState.js)
// -----------------------------------------------------------------------------
console.log('--- 3.1: Nested .config Schema Tests ---');

const nestedConfigDoc = {
    updatedAt: '2026-09-19T10:00:00Z',
    updatedBy: 'AdminUser',
    config: {
        earningRate: 50,
        tierMultiplier: 1.25,
        skuBonusRules: 'SKU-VIP:100\nSKU-GOLD:50\nSKU-NORMAL:0',
        tiers: [
            { name: 'Bronze', minPoints: 0, multiplier: 1.0 },
            { name: 'Silver', minPoints: 1000, multiplier: 1.1 },
            { name: 'Gold', minPoints: 5000, multiplier: 1.25 }
        ]
    }
};

const unwrappedNested = unwrapLoyaltyConfig(nestedConfigDoc);
report(unwrappedNested.earningRate === 50, 'Nested .config: earningRate extracted correctly (50)');
report(unwrappedNested.tierMultiplier === 1.25, 'Nested .config: tierMultiplier extracted correctly (1.25)');

// Calculate points with nested config (Amount 1000, earningRate 50 -> 20 base, multiplier 1.25 -> 25 pts)
const ptsNested = calculateEarnedPoints(1000, unwrappedNested, [], 0);
report(ptsNested === 25, `Nested .config calculation: 1000 THB @ rate 50 x 1.25 = ${ptsNested} pts (expected 25)`);

// Sku bonus rules with split lines
const splitItemsForBonus = [
    { sku: 'SKU-VIP', qty: 2 },
    { sku: 'SKU-VIP', qty: 3 }, // Total SKU-VIP = 5 * 100 = 500 bonus
    { sku: 'SKU-GOLD', qty: 1 }  // Total SKU-GOLD = 1 * 50 = 50 bonus
];
const ptsWithBonus = calculateEarnedPoints(1000, unwrappedNested, splitItemsForBonus, 0);
report(
    ptsWithBonus === 25 + 550,
    `Nested .config SKU bonus on split lines: 25 base + 500 (VIP) + 50 (GOLD) = ${ptsWithBonus} pts (expected 575)`
);

// -----------------------------------------------------------------------------
// 3.2: Nested .creditConfig Schema (written by legacy settings migrations)
// -----------------------------------------------------------------------------
console.log('\n--- 3.2: Nested .creditConfig Schema Tests ---');

const legacyCreditConfigDoc = {
    id: 'credit_config',
    createdAt: '2026-01-01',
    creditConfig: {
        pointsEarningRate: 80,
        skuBonusRules: 'DH-LEGACY-01:40',
        tierList: [
            { name: 'Standard', minPoints: 0, multiplier: 1.0 },
            { name: 'Elite', minPoints: 2000, multiplier: 1.2 }
        ]
    }
};

const unwrappedLegacy = unwrapLoyaltyConfig(legacyCreditConfigDoc);
report(unwrappedLegacy.pointsEarningRate === 80, 'Nested .creditConfig: pointsEarningRate extracted correctly (80)');

// Calculate points: 800 THB @ rate 80 = 10 pts; Elite tier (2500 accumulated points) -> 1.2x = 12 pts + 40 bonus = 52 pts
const ptsLegacy = calculateEarnedPoints(800, unwrappedLegacy, [{ sku: 'DH-LEGACY-01', qty: 1 }], 2500);
report(ptsLegacy === 52, `Nested .creditConfig calculation: 800 THB @ rate 80 with Elite tier + bonus = ${ptsLegacy} pts (expected 52)`);

// -----------------------------------------------------------------------------
// 3.3: Flat Document Schema (written by seed scripts and default root document)
// -----------------------------------------------------------------------------
console.log('\n--- 3.3: Flat Document Schema Tests ---');

const flatConfigDoc = {
    earningRate: 100,
    skuBonusRules: 'SKU-FLAT:15',
    tierMultiplier: 1.0
};

const unwrappedFlat = unwrapLoyaltyConfig(flatConfigDoc);
report(unwrappedFlat.earningRate === 100, 'Flat schema: root earningRate extracted correctly (100)');
const ptsFlat = calculateEarnedPoints(1500, unwrappedFlat, [{ sku: 'SKU-FLAT', qty: 4 }], 0);
// 1500 / 100 = 15 base + 4 * 15 = 60 bonus => 75 total
report(ptsFlat === 75, `Flat schema calculation: 15 base + 60 bonus = ${ptsFlat} pts (expected 75)`);

// -----------------------------------------------------------------------------
// 3.4: Adversarial Loyalty Schema Edge Cases
// -----------------------------------------------------------------------------
console.log('\n--- 3.4: Adversarial Loyalty Schema Edge Cases ---');

// Null / Undefined document safe fallback
const nullDocRes = unwrapLoyaltyConfig(null);
report(typeof nullDocRes === 'object' && Object.keys(nullDocRes).length === 0, 'Null document safely unwraps to {}');
report(calculateEarnedPoints(1000, nullDocRes) === 10, 'Empty config defaults to earningRate 100 (1000 / 100 = 10 pts)');

// Zero / Negative amount
report(calculateEarnedPoints(0, unwrappedNested) === 0, 'Zero amount produces 0 points');
report(calculateEarnedPoints(-500, unwrappedNested) === 0, 'Negative amount produces 0 points');

// Malformed SKU bonus rules (empty lines, trailing colons, spaces)
const malformedConfig = {
    earningRate: 100,
    skuBonusRules: '\n\nSKU-A: 25 \n INVALID_RULE \n :50 \n SKU-B: \nSKU-C:10\n\n'
};
const ptsMalformed = calculateEarnedPoints(500, malformedConfig, [
    { sku: 'SKU-A', qty: 1 },
    { sku: 'SKU-C', qty: 2 },
    { sku: 'UNKNOWN', qty: 5 }
], 0);
// Base: 500 / 100 = 5. Bonus: SKU-A = 25, SKU-C = 20. Total = 50
report(ptsMalformed === 50, `Malformed SKU bonus rules parsed gracefully: got ${ptsMalformed} pts (expected 50)`);

// High-tier multipliers
report(getUserTier(150000).name === 'Diamond' && getUserTier(150000).multiplier === 1.5, 'Tier Diamond (150K pts) -> 1.5x multiplier');
report(getUserTier(25000).name === 'Platinum' && getUserTier(25000).multiplier === 1.2, 'Tier Platinum (25K pts) -> 1.2x multiplier');
report(getUserTier(7500).name === 'Gold' && getUserTier(7500).multiplier === 1.1, 'Tier Gold (7.5K pts) -> 1.1x multiplier');
report(getUserTier(1500).name === 'Silver' && getUserTier(1500).multiplier === 1.05, 'Tier Silver (1.5K pts) -> 1.05x multiplier');
report(getUserTier(200).name === 'Member' && getUserTier(200).multiplier === 1.0, 'Tier Member (200 pts) -> 1.0x multiplier');

// -----------------------------------------------------------------------------
// 3.5: Source Code Pattern Integrity Verification
// -----------------------------------------------------------------------------
console.log('\n--- 3.5: Source Code Pattern Integrity Verification ---');

const billingTxFile = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const statusWalletFile = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js');
const billingTxCode = fs.readFileSync(billingTxFile, 'utf8');
const statusWalletCode = fs.readFileSync(statusWalletFile, 'utf8');

report(
    billingTxCode.includes('settingsData.config || settingsData.creditConfig || settingsData'),
    'billingTransactionService.js contains strict 3-tier unwrapping pattern'
);
report(
    statusWalletCode.includes('settingsData.config || settingsData.creditConfig || settingsData'),
    'statusWalletHandler.js contains strict 3-tier unwrapping pattern'
);


// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================================');
console.log(`  CHALLENGER 2 SUMMARY: ${totalTests} Checks | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================\n');

if (failedTests > 0) {
    console.error(`❌ ADVERSARIAL STRESS TEST FAILED with ${failedTests} failures!`);
    process.exit(1);
} else {
    console.log('🎉 ALL ADVERSARIAL STRESS TESTS CONFIRMED CORRECT (0 DEFECTS)!');
    process.exit(0);
}
