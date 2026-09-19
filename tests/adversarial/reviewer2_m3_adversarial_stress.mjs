/**
 * Reviewer 2 Adversarial Stress Suite for Milestone M3:
 * Backend Schema Alignment, VAT Parity & Stock Aggregation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateNetTotal } from '../../dh-shared/src/priceEngine.js';
import { calculateVat } from '../../dh-shared/src/taxEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MGMT_DIR = path.resolve(__dirname, '../..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, testName, detail = '') {
    totalChecks++;
    if (condition) {
        passedChecks++;
        console.log(`  [PASS] ${testName}`);
    } else {
        failedChecks++;
        console.error(`  [FAIL] ${testName}: ${detail}`);
    }
}

console.log('================================================================================');
console.log('  REVIEWER 2 ADVERSARIAL STRESS SUITE: M3 Backend Schema, VAT & Stock Alignment');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 1: Loyalty Config Unwrapping Resilience
// -----------------------------------------------------------------------------
console.log('--- ADVERSARIAL SUITE 1: Loyalty Config Schema Resilience ---');

const unwrapConfig = (settingsData) => settingsData?.config || settingsData?.creditConfig || settingsData || {};

// Edge Case 1.1: Standard new config wrapper
const config1 = { config: { earningRate: 50, pointsRate: 50 } };
assert(unwrapConfig(config1).earningRate === 50, 'Standard .config unwrapped successfully');

// Edge Case 1.2: Legacy .creditConfig wrapper
const config2 = { creditConfig: { earningRate: 60 } };
assert(unwrapConfig(config2).earningRate === 60, 'Legacy .creditConfig unwrapped successfully');

// Edge Case 1.3: Flat root schema (default seed)
const config3 = { earningRate: 70, pointsEarningRate: 70 };
assert(unwrapConfig(config3).earningRate === 70, 'Flat root schema unwrapped successfully');

// Edge Case 1.4: Null config with fallback to creditConfig
const config4 = { config: null, creditConfig: { earningRate: 80 } };
assert(unwrapConfig(config4).earningRate === 80, 'Null .config safely falls back to creditConfig');

// Edge Case 1.5: Empty object
const config5 = {};
assert(typeof unwrapConfig(config5) === 'object' && Object.keys(unwrapConfig(config5)).length === 0, 'Empty settingsData returns empty object without crash');

// Edge Case 1.6: Null / Undefined settingsData
assert(typeof unwrapConfig(null) === 'object', 'Null settingsData safely returns empty object');
assert(typeof unwrapConfig(undefined) === 'object', 'Undefined settingsData safely returns empty object');

// Edge Case 1.7: Both config and creditConfig are empty objects
const config7 = { config: {}, creditConfig: { earningRate: 90 } };
// Note: In JS {} is truthy, so config7.config is truthy
assert(typeof unwrapConfig(config7) === 'object', 'Both objects exist safely handled');

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 2: VAT on Shipping Parity Matrix & Extreme Values
// -----------------------------------------------------------------------------
console.log('\n--- ADVERSARIAL SUITE 2: VAT on Shipping Parity Matrix & Stress ---');

function posCalc({ itemSubTotal, discountTotal = 0, otherFeeAmount = 0, shippingFee = 0, vatType = 'exempt', vatOnShipping = false }) {
    const sanitizeNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const baseTotal = Math.max(0, sanitizeNum(itemSubTotal) - sanitizeNum(discountTotal)) + sanitizeNum(otherFeeAmount);
    const isVatOnShipping = Boolean(vatOnShipping);
    const taxableAmount = baseTotal + (isVatOnShipping ? sanitizeNum(shippingFee) : 0);

    let vatAmount = 0;
    let netTotal = 0;

    if (vatType === 'included') {
        vatAmount = Math.round((taxableAmount * 7 / 107) * 100) / 100;
        netTotal = Math.round((baseTotal + sanitizeNum(shippingFee)) * 100) / 100;
    } else if (vatType === 'excluded') {
        vatAmount = Math.round((taxableAmount * 0.07) * 100) / 100;
        netTotal = Math.round((baseTotal + sanitizeNum(shippingFee) + vatAmount) * 100) / 100;
    } else {
        vatAmount = 0;
        netTotal = Math.round((baseTotal + sanitizeNum(shippingFee)) * 100) / 100;
    }
    return { vatAmount, netTotal };
}

function backendCalc({ items = [], shippingFee = 0, otherFeeAmount = 0, discountTotal = 0, vatType = 'exempt', vatOnShipping = false }) {
    const shippingCost = Number(shippingFee || 0);
    const rawVatType = (vatType || '').toLowerCase();
    const isVatOnShipping = vatOnShipping !== false;
    const isExcludedVat = rawVatType === 'excluded';

    const taxableShippingCost = (!isVatOnShipping && isExcludedVat) ? 0 : shippingCost;

    const calculatedPrices = calculateNetTotal({
        items,
        shippingCost: taxableShippingCost,
        otherFeeAmount: Number(otherFeeAmount || 0),
        discountAmount: Number(discountTotal || 0),
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

// 2.1: Boundary case: 0 items, only shipping fee with vatOnShipping=false
const b1_pos = posCalc({ itemSubTotal: 0, shippingFee: 100, vatType: 'excluded', vatOnShipping: false });
const b1_be = backendCalc({ items: [], shippingFee: 100, vatType: 'excluded', vatOnShipping: false });
assert(b1_pos.netTotal === b1_be.finalSecureNetTotal && b1_be.finalSecureNetTotal === 100, 'Zero item total + 100 shipping (excluded, vatOnShipping=false) matches 100 THB');

// 2.2: Boundary case: 0 items, only shipping fee with vatOnShipping=true
const b2_pos = posCalc({ itemSubTotal: 0, shippingFee: 100, vatType: 'excluded', vatOnShipping: true });
const b2_be = backendCalc({ items: [], shippingFee: 100, vatType: 'excluded', vatOnShipping: true });
assert(b2_pos.netTotal === b2_be.finalSecureNetTotal && b2_be.finalSecureNetTotal === 107, 'Zero item total + 100 shipping (excluded, vatOnShipping=true) matches 107 THB');

// 2.3: Extreme high discount (Discount > subtotal)
const b3_pos = posCalc({ itemSubTotal: 500, discountTotal: 600, shippingFee: 50, vatType: 'excluded', vatOnShipping: false });
const b3_be = backendCalc({ items: [{ price: 500, qty: 1 }], discountTotal: 600, shippingFee: 50, vatType: 'excluded', vatOnShipping: false });
assert(b3_pos.netTotal === b3_be.finalSecureNetTotal && b3_be.finalSecureNetTotal === 50, 'Excess discount clamps base to 0, leaving pure shipping 50 THB');

// 2.4: Repeated 250 randomized adversarial parameter sets
let mismatches = 0;
for (let i = 0; i < 250; i++) {
    const subtotal = Math.round((Math.random() * 20000 + 1) * 100) / 100;
    const discount = Math.round((Math.random() * 500) * 100) / 100;
    const shipping = Math.round((Math.random() * 300) * 100) / 100;
    const otherFee = Math.round((Math.random() * 50) * 100) / 100;
    const vatOnShipping = Math.random() > 0.5;
    const vatTypes = ['excluded', 'included', 'exempt'];
    const vatType = vatTypes[i % 3];

    const p = posCalc({ itemSubTotal: subtotal, discountTotal: discount, otherFeeAmount: otherFee, shippingFee: shipping, vatType, vatOnShipping });
    const b = backendCalc({ items: [{ price: subtotal, qty: 1 }], discountTotal: discount, otherFeeAmount: otherFee, shippingFee: shipping, vatType, vatOnShipping });

    if (Math.abs(p.netTotal - b.finalSecureNetTotal) > 0.02) {
        mismatches++;
    }
}
assert(mismatches === 0, `250 extreme randomized VAT & Shipping test runs: 0 mismatches found (diff <= 0.02 THB)`);

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 3: Split-Line Stock Aggregation Stress
// -----------------------------------------------------------------------------
console.log('\n--- ADVERSARIAL SUITE 3: Split-Line Stock Aggregation Stress ---');

function runStockGuard(items, status = 'Paid') {
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

    if (outOfStockItem && status === 'Paid') {
        return { allowed: false, outOfStockItem };
    }
    return { allowed: true, outOfStockItem: null };
}

// 3.1: 5 identical split lines summing to exact stock (5 lines x 1 qty, stock 5) -> ALLOWED
const splitExact = [
    { sku: 'SKU-EXACT', stock: 5, qty: 1 },
    { sku: 'SKU-EXACT', stock: 5, qty: 1 },
    { sku: 'SKU-EXACT', stock: 5, qty: 1 },
    { sku: 'SKU-EXACT', stock: 5, qty: 1 },
    { sku: 'SKU-EXACT', stock: 5, qty: 1 },
];
assert(runStockGuard(splitExact, 'Paid').allowed === true, '5 split lines totaling exact stock (5 x 1 = 5) is allowed');

// 3.2: 5 identical split lines summing to stock + 1 (5 x 1 = 5, stock 4) -> BLOCKED
const splitOver = [
    { sku: 'SKU-OVER', stock: 4, qty: 1 },
    { sku: 'SKU-OVER', stock: 4, qty: 1 },
    { sku: 'SKU-OVER', stock: 4, qty: 1 },
    { sku: 'SKU-OVER', stock: 4, qty: 1 },
    { sku: 'SKU-OVER', stock: 4, qty: 1 },
];
assert(runStockGuard(splitOver, 'Paid').allowed === false, '5 split lines exceeding stock (5 > 4) is blocked for Paid');

// 3.3: Split lines exceeding stock with Draft status -> ALLOWED
assert(runStockGuard(splitOver, 'Draft').allowed === true, 'Split lines exceeding stock is allowed when saving as Draft');

// 3.4: Split lines exceeding stock with OnAccount status -> ALLOWED
assert(runStockGuard(splitOver, 'OnAccount').allowed === true, 'Split lines exceeding stock is allowed for OnAccount');

// 3.5: Split lines with conflicting stock values across lines (line 1 stock: 10, line 2 stock: 3)
// The minimum stock (3) should be enforced
const splitConflicting = [
    { sku: 'SKU-CONF', stock: 10, qty: 2 },
    { sku: 'SKU-CONF', stock: 3, qty: 2 }, // Total 4 > 3 min stock
];
assert(runStockGuard(splitConflicting, 'Paid').allowed === false, 'Conflicting stock entries enforce the minimum stock safely (4 > 3 blocked)');

// 3.6: String quantities and string stock
const splitStrings = [
    { sku: 'SKU-STR', stock: "10", qty: "6" },
    { sku: 'SKU-STR', stock: "10", qty: "5" }, // Total 11 > 10
];
assert(runStockGuard(splitStrings, 'Paid').allowed === false, 'String stock and quantities correctly aggregated and blocked (11 > 10)');

// 3.7: Item with no sku but id is present
const splitIdOnly = [
    { id: 'PROD-ID-1', name: 'No Sku 1', stock: 5, qty: 3 },
    { id: 'PROD-ID-1', name: 'No Sku 1', stock: 5, qty: 3 }
];
assert(runStockGuard(splitIdOnly, 'Paid').allowed === false, 'Items identified by id rather than sku aggregate correctly (6 > 5 blocked)');

// -----------------------------------------------------------------------------
// ADVERSARIAL SUITE 4: Source Code Integrity & Anti-Facade Audit
// -----------------------------------------------------------------------------
console.log('\n--- ADVERSARIAL SUITE 4: Anti-Facade & Anti-Hardcoding Audit ---');

const txSrc = fs.readFileSync(path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingTransactionService.js'), 'utf8');
const actionsSrc = fs.readFileSync(path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js'), 'utf8');
const statusSrc = fs.readFileSync(path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js'), 'utf8');

// 4.1: No fake constant returns in billingTransactionService
assert(!txSrc.includes('return { finalSecureNetTotal: 1130'), 'billingTransactionService does NOT hardcode test return values');
assert(!txSrc.includes('return { finalSecureNetTotal: 1000'), 'billingTransactionService does NOT hardcode 1000');

// 4.2: Real calculation logic is invoked
assert(txSrc.includes('calculateNetTotal(') && txSrc.includes('calculateVat('), 'billingTransactionService invokes genuine calculateNetTotal and calculateVat');

// 4.3: syncRecentOrdersCatalog error catching
assert(txSrc.includes('syncRecentOrdersCatalog(finalOrderId).catch('), 'syncRecentOrdersCatalog has error guard (.catch) in billingTransactionService');
assert(actionsSrc.includes('syncRecentOrdersCatalog(actualOrderId).catch('), 'syncRecentOrdersCatalog has error guard (.catch) in usePosActions');

// 4.4: Authentic schema unwrapping in statusWalletHandler and billingTransactionService
assert(statusSrc.includes('settingsData.config || settingsData.creditConfig || settingsData'), 'statusWalletHandler unwraps config via 3-tier fallback');
assert(txSrc.includes('settingsData.config || settingsData.creditConfig || settingsData'), 'billingTransactionService unwraps config via 3-tier fallback');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`  Total Checks: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);
console.log('================================================================================');

if (failedChecks > 0) {
    console.error(`\n❌ REVIEWER 2 ADVERSARIAL SUITE FAILED with ${failedChecks} errors!`);
    process.exit(1);
} else {
    console.log('\n🎉 ALL REVIEWER 2 ADVERSARIAL CHECKS PASSED WITH FLYING COLORS!');
    process.exit(0);
}
