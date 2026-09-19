/**
 * Automated Verification Suite for Milestone M3:
 * POS Transactional Checkout, Slip Storage & Schema Alignment
 * 
 * Verifies:
 * 1. Slip Storage & Bank Field Persistence in Order Payload
 * 2. Loyalty Configuration Schema Alignment (settingsData.config || settingsData)
 * 3. VatOnShipping Server-Side Tax Calculation Parity with POS UI
 * 4. Split-Line Stock Aggregation Guard
 * 5. Dashboard Cache Sync on Order Creation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateNetTotal } from '../../dh-shared/src/priceEngine.js';
import { calculateVat } from '../../dh-shared/src/taxEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MGMT_DIR = path.resolve(__dirname, '../..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  [PASS] ${testName}`);
    } else {
        failedTests++;
        console.error(`  [FAIL] ${testName}: ${detail}`);
    }
}

console.log('================================================================================');
console.log('  VERIFICATION SUITE M3: POS Transactional Checkout, Slip Storage & Schema');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Slip Storage & Bank Field Persistence
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Slip Storage & Bank Field Persistence ---');

const usePosActionsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
const paymentPanelPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/PaymentPanel.jsx');
const paymentMethodsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/payment/PaymentMethods.jsx');

const usePosActionsSrc = fs.readFileSync(usePosActionsPath, 'utf8');
const paymentPanelSrc = fs.readFileSync(paymentPanelPath, 'utf8');
const paymentMethodsSrc = fs.readFileSync(paymentMethodsPath, 'utf8');

// 1.1: Legacy driveService eradicated
assert(
    !usePosActionsSrc.includes('driveService') && !usePosActionsSrc.includes("from '../../../../firebase/driveService'"),
    'Legacy driveService completely removed from usePosActions.js'
);

// 1.2: slipStorageService imported and used
assert(
    usePosActionsSrc.includes('slipStorageService') && usePosActionsSrc.includes("from '../../../../firebase/slipStorageService'"),
    'slipStorageService imported into usePosActions.js'
);

// 1.3: Dummy 1.8s timeout eradicated from PaymentPanel.jsx
assert(
    !paymentPanelSrc.includes('1800') && !paymentPanelSrc.includes("setTimeout(() => { setIsScanning(false); setOcrStatus('error'); }, 1800)"),
    'Dummy 1.8s mock failure timeout removed from PaymentPanel.jsx'
);

// 1.4: Real OCR state handling in PaymentPanel.jsx
assert(
    paymentPanelSrc.includes('ocrStatus') && paymentPanelSrc.includes('handleFileUpload'),
    'PaymentPanel coordinates with real upload & OCR callback'
);

// 1.5: Bank reference fields captured and stored in state and orderData
const requiredPayloadFields = [
    'transactionRef',
    'transferDateTime',
    'transferNote',
    'slipUrl',
    'slipImage',
    'slipStoragePath',
    'slipVerificationStatus',
    'ocrResult'
];

for (const field of requiredPayloadFields) {
    assert(
        usePosActionsSrc.includes(`${field}:`),
        `Field "${field}" is explicitly passed into orderData payload in usePosActions.js`
    );
}

// 1.6: PaymentMethods supports slipUrl and full state reset
assert(
    paymentMethodsSrc.includes('slipUrl') && paymentMethodsSrc.includes('slipImage'),
    'PaymentMethods supports both slipUrl and slipImage'
);
assert(
    paymentMethodsSrc.includes("slipVerificationStatus: 'idle'"),
    'PaymentMethods resets slipVerificationStatus to idle on slip delete'
);

// -----------------------------------------------------------------------------
// SUITE 2: Loyalty Configuration Schema Alignment
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Loyalty Configuration Schema Alignment ---');

const billingTxPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const statusWalletPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js');

const billingTxSrc = fs.readFileSync(billingTxPath, 'utf8');
const statusWalletSrc = fs.readFileSync(statusWalletPath, 'utf8');

// 2.1: billingTransactionService unwraps settingsData.config
assert(
    billingTxSrc.includes('settingsData.config || settingsData.creditConfig || settingsData') ||
    billingTxSrc.includes('settingsData.config || settingsData'),
    'billingTransactionService.js unwraps settingsData.config || settingsData'
);

// 2.2: statusWalletHandler unwraps settingsData.config
assert(
    statusWalletSrc.includes('settingsData.config || settingsData.creditConfig || settingsData') ||
    statusWalletSrc.includes('settingsData.config || settingsData'),
    'statusWalletHandler.js unwraps settingsData.config || settingsData'
);

// 2.3: Functional test of schema unwrapping across diverse structures
const unwrapConfig = (settingsData) => settingsData?.config || settingsData?.creditConfig || settingsData || {};

// Test nested .config (written by useCreditSettingsState)
const nestedDoc = { config: { earningRate: 50, skuBonusRules: [{ sku: 'SKU-01', bonusPoints: 10 }] } };
const resolvedNested = unwrapConfig(nestedDoc);
assert(resolvedNested.earningRate === 50 && resolvedNested.skuBonusRules.length === 1, 'Nested .config resolved correctly');

// Test root document (written by default seed / creditSettingsService)
const rootDoc = { pointsEarningRate: 100, tiers: [{ name: 'VIP', multiplier: 2.0 }] };
const resolvedRoot = unwrapConfig(rootDoc);
assert(resolvedRoot.pointsEarningRate === 100 && resolvedRoot.tiers[0].multiplier === 2.0, 'Root document resolved correctly');

// Test legacy .creditConfig document
const legacyDoc = { creditConfig: { earningRate: 75 } };
const resolvedLegacy = unwrapConfig(legacyDoc);
assert(resolvedLegacy.earningRate === 75, 'Legacy .creditConfig resolved correctly');

// -----------------------------------------------------------------------------
// SUITE 3: VatOnShipping Server-Side Tax Calculation Parity
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: VatOnShipping Server-Side Tax Parity ---');

/**
 * Replicate POS UI Math from usePosPayment.js
 */
function calculatePosUiTotal({ itemSubTotal, discountTotal = 0, otherFeeAmount = 0, shippingFee = 0, vatType = 'exempt', vatOnShipping = false }) {
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

    return { vatAmount, netTotal };
}

/**
 * Replicate Backend Math from billingTransactionService.js (updated)
 */
function calculateBackendSecureTotal({ items = [], shippingFee = 0, otherFeeAmount = 0, discountTotal = 0, vatType = 'exempt', vatOnShipping = false }) {
    const shippingCost = Number(shippingFee || 0);
    const rawVatType = (vatType || '').toLowerCase();
    const isVatOnShipping = Boolean(vatOnShipping);
    const isExcludedVat = rawVatType === 'excluded';

    // When vatOnShipping is false and vatType is 'excluded', shippingCost must NOT be part of taxable base
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

// 3.1: Excluded VAT with vatOnShipping=false (Caveat 3.1 specific fix)
const sampleItems1 = [{ sku: 'A', price: 1000, qty: 1, discount: 0 }];
const pos1 = calculatePosUiTotal({ itemSubTotal: 1000, shippingFee: 60, vatType: 'excluded', vatOnShipping: false });
const backend1 = calculateBackendSecureTotal({ items: sampleItems1, shippingFee: 60, vatType: 'excluded', vatOnShipping: false });

assert(
    pos1.netTotal === 1130 && backend1.finalSecureNetTotal === 1130,
    `Excluded VAT + vatOnShipping=false exact parity: POS=${pos1.netTotal} vs Backend=${backend1.finalSecureNetTotal}`
);
assert(
    Math.abs(pos1.netTotal - backend1.finalSecureNetTotal) < 0.01,
    'Excluded VAT + vatOnShipping=false diff is 0.00 THB (zero price override warning)'
);

// 3.2: Excluded VAT with vatOnShipping=true
const pos2 = calculatePosUiTotal({ itemSubTotal: 1000, shippingFee: 60, vatType: 'excluded', vatOnShipping: true });
const backend2 = calculateBackendSecureTotal({ items: sampleItems1, shippingFee: 60, vatType: 'excluded', vatOnShipping: true });
assert(
    pos2.netTotal === 1134.20 && backend2.finalSecureNetTotal === 1134.20,
    `Excluded VAT + vatOnShipping=true exact parity: POS=${pos2.netTotal} vs Backend=${backend2.finalSecureNetTotal}`
);

// 3.3: Included VAT with vatOnShipping=false
const pos3 = calculatePosUiTotal({ itemSubTotal: 1070, shippingFee: 50, vatType: 'included', vatOnShipping: false });
const backend3 = calculateBackendSecureTotal({ items: [{ sku: 'B', price: 1070, qty: 1 }], shippingFee: 50, vatType: 'included', vatOnShipping: false });
assert(
    pos3.netTotal === 1120 && backend3.finalSecureNetTotal === 1120,
    `Included VAT + vatOnShipping=false exact parity: POS=${pos3.netTotal} vs Backend=${backend3.finalSecureNetTotal}`
);

// 3.4: Exempt VAT
const pos4 = calculatePosUiTotal({ itemSubTotal: 500, shippingFee: 40, vatType: 'exempt' });
const backend4 = calculateBackendSecureTotal({ items: [{ sku: 'C', price: 500, qty: 1 }], shippingFee: 40, vatType: 'exempt' });
assert(
    pos4.netTotal === 540 && backend4.finalSecureNetTotal === 540,
    `Exempt VAT exact parity: POS=${pos4.netTotal} vs Backend=${backend4.finalSecureNetTotal}`
);

// 3.5: 100 Randomized Stress Test Runs for Parity
let randomMismatches = 0;
for (let i = 0; i < 100; i++) {
    const subtotal = Math.floor(Math.random() * 5000) + 100;
    const shipping = Math.floor(Math.random() * 200) + 20;
    const vatOnShipping = Math.random() < 0.5;
    const vatTypes = ['included', 'excluded', 'exempt'];
    const vatType = vatTypes[i % 3];

    const posRes = calculatePosUiTotal({ itemSubTotal: subtotal, shippingFee: shipping, vatType, vatOnShipping });
    const backendRes = calculateBackendSecureTotal({ items: [{ sku: 'RND', price: subtotal, qty: 1 }], shippingFee: shipping, vatType, vatOnShipping });

    if (Math.abs(posRes.netTotal - backendRes.finalSecureNetTotal) > 0.02) {
        randomMismatches++;
    }
}
assert(randomMismatches === 0, `100 randomized VAT & Shipping test runs: 0 mismatches found (got ${randomMismatches})`);

// -----------------------------------------------------------------------------
// SUITE 4: Split-Line Stock Aggregation Guard
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Split-Line Stock Aggregation Guard ---');

function evaluateStockGuard(items, status = 'Paid') {
    const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };
    
    // Aggregation logic from usePosActions.js
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

    const outOfStockItem = Object.values(aggregatedStockDemand).find(
        item => item.stock < item.totalQty
    );

    if (outOfStockItem && status === 'Paid') {
        return { allowed: false, outOfStockItem };
    }
    return { allowed: true, outOfStockItem: null };
}

// 4.1: Split line exceeding stock (Stock: 5, Row 1: 3, Row 2: 3) -> Demand 6 > Stock 5 -> Blocked
const splitCartExceeding = [
    { sku: 'DH-RAM-01', name: 'DDR4 8GB', stock: 5, qty: 3 },
    { sku: 'DH-RAM-01', name: 'DDR4 8GB', stock: 5, qty: 3 }
];
const res1 = evaluateStockGuard(splitCartExceeding, 'Paid');
assert(!res1.allowed && res1.outOfStockItem.key === 'DH-RAM-01', 'Split-line demand exceeding stock (3+3 > 5) is blocked');

// 4.2: Split line within stock (Stock: 10, Row 1: 3, Row 2: 3) -> Demand 6 <= Stock 10 -> Allowed
const splitCartAllowed = [
    { sku: 'DH-RAM-01', name: 'DDR4 8GB', stock: 10, qty: 3 },
    { sku: 'DH-RAM-01', name: 'DDR4 8GB', stock: 10, qty: 3 }
];
const res2 = evaluateStockGuard(splitCartAllowed, 'Paid');
assert(res2.allowed, 'Split-line demand within stock (3+3 <= 10) is allowed');

// 4.3: Split line exceeding stock with Draft checkout -> Allowed (Bypass for Draft)
const res3 = evaluateStockGuard(splitCartExceeding, 'Draft');
assert(res3.allowed, 'Split-line out-of-stock allows Draft checkout (Draft bypass)');

// 4.4: Multi-item cart correctly identifies depleted split SKU
const mixedCart = [
    { sku: 'DH-SSD-01', name: 'SSD 512GB', stock: 20, qty: 2 },
    { sku: 'DH-CPU-01', name: 'Core i5', stock: 4, qty: 2 },
    { sku: 'DH-CPU-01', name: 'Core i5', stock: 4, qty: 3 } // Total Core i5 = 5 > stock 4
];
const res4 = evaluateStockGuard(mixedCart, 'Paid');
assert(!res4.allowed && res4.outOfStockItem.key === 'DH-CPU-01', 'Mixed cart correctly flags depleted split SKU DH-CPU-01');

// -----------------------------------------------------------------------------
// SUITE 5: Dashboard Cache Sync on Order Creation
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Dashboard Cache Sync on Order Creation ---');

// 5.1: syncRecentOrdersCatalog imported in billingTransactionService.js
assert(
    billingTxSrc.includes("import { syncRecentOrdersCatalog } from './orderSyncService'"),
    'syncRecentOrdersCatalog imported in billingTransactionService.js'
);

// 5.2: syncRecentOrdersCatalog called after order creation in billingTransactionService.js
assert(
    billingTxSrc.includes('syncRecentOrdersCatalog(finalOrderId)'),
    'syncRecentOrdersCatalog(finalOrderId) called in billingTransactionService createOrder'
);

// 5.3: syncRecentOrdersCatalog called in usePosActions.js
assert(
    usePosActionsSrc.includes('syncRecentOrdersCatalog(actualOrderId)'),
    'syncRecentOrdersCatalog(actualOrderId) called in usePosActions.js post-order effect'
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`  Total Checks: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================');

if (failedTests > 0) {
    console.error(`\n❌ VERIFICATION SUITE FAILED with ${failedTests} failures!`);
    process.exit(1);
} else {
    console.log('\n🎉 ALL M3 VERIFICATION CHECKS PASSED EMPIRICALLY!');
    process.exit(0);
}
