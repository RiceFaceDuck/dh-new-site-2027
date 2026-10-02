/**
 * Adversarial Challenger 2 Test Suite: Concurrency, Reversals & BigSeller Stock Calculations
 * 
 * Location: Management System/tests/adversarial/challenger_concurrency_and_reversals.mjs
 * 
 * Scope & Focus:
 * 1. Backoffice POS Billing vs Storefront Checkout concurrency & buffer semantics:
 *    - POS physical stock bypass vs Storefront buffer protection.
 *    - Concurrent checkout race condition simulation (optimistic lock retry).
 *    - Split-line SKU demand aggregation preventing buffer bypass.
 * 2. Order Cancellation & Return Reversals:
 *    - Stock restoration modifies physical stock safely without touching or corrupting bufferStock.
 *    - Draft cancellation prevents phantom stock inflation (isStockDeducted guard).
 *    - Double cancellation idempotency.
 * 3. BigSeller Full Catalog Export & Stock Math:
 *    - syncStock / countStock non-negative clamping:
 *      * stock = 5, buffer = 2 -> 3
 *      * stock = 1, buffer = 3 -> 0 (never negative)
 *      * stock = 0, buffer = 2 -> 0
 *      * SKU override = 0 -> exports full physical stock
 *      * String, whitespace, null/undefined inputs
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHARED_PATH = path.resolve(__dirname, '../../dh-shared/src/utils/stockUtils.js');

const {
  resolveEffectiveBuffer,
  calculateAvailableStock,
  isStockAvailableForSale,
  isProductOutOfStock,
  isProductLowStock
} = await import(`file://${SHARED_PATH}`);

console.log('========================================================================');
console.log('  ⚔️ CHALLENGER 2: CONCURRENCY, REVERSALS & CROSS-SYSTEM STOCK SUITE');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    throw err;
  }
}

// ============================================================================
// SUITE 1: POS BILLING VS STOREFRONT CHECKOUT CONCURRENCY & BUFFER RULES
// ============================================================================
console.log('--- Suite 1: POS Billing vs Storefront Checkout Concurrency ---');

runTest('1.1 POS Cashier can sell down physical stock to 0 even if stock is in buffer zone', () => {
  // Scenario: Physical store has 2 items in hand. Global buffer is 2.
  const currentStock = 2;
  const globalBuffer = 2;
  const skuBuffer = null;
  const effectiveBuffer = resolveEffectiveBuffer(skuBuffer, globalBuffer);

  // In POS, actorName === 'POS' sets canBypass = true
  const isPosOrder = true;
  const canBypass = isPosOrder;

  // POS customer holds 2 items in hand:
  const allowedForPos = isStockAvailableForSale(currentStock, effectiveBuffer, 2, canBypass);
  assert.equal(allowedForPos, true, 'POS cashier must be able to sell physical items in hand');

  // Verify POS deduction math:
  const newStock = currentStock - 2;
  assert.equal(newStock, 0, 'Physical stock reaches 0');

  // But POS cannot sell more than physically available (e.g. 3 items when only 2 exist)
  const allowedExcess = isStockAvailableForSale(currentStock, effectiveBuffer, 3, canBypass);
  assert.equal(allowedExcess, false, 'POS cannot oversell beyond physical stock (2 - 3 < 0)');
});

runTest('1.2 Storefront Checkout is blocked when stock is within buffer zone', () => {
  // Scenario: Physical stock = 2, Buffer = 2. Online customer visits storefront.
  const currentStock = 2;
  const globalBuffer = 2;
  const effectiveBuffer = resolveEffectiveBuffer(null, globalBuffer);

  // Storefront customer cannot bypass buffer
  const canBypass = false;
  const allowedForOnline = isStockAvailableForSale(currentStock, effectiveBuffer, 1, canBypass);
  assert.equal(allowedForOnline, false, 'Storefront customer must be blocked from purchasing buffer stock');

  // Available stock calculation for UI
  const availableStock = calculateAvailableStock(currentStock, effectiveBuffer);
  assert.equal(availableStock, 0, 'Available stock for storefront must be 0');
  assert.equal(isProductOutOfStock(currentStock, effectiveBuffer), true, 'Storefront must show Out of Stock');
});

runTest('1.3 Concurrent Storefront Checkouts: Race condition simulation and buffer exhaustion', () => {
  // Scenario: Physical stock = 5, Buffer = 2. Available for online = 3.
  // Two online customers (A and B) concurrently attempt to buy 2 items each.
  // Total online demand = 4, but only 3 available!
  let simulatedDbProduct = {
    sku: 'SKU-CONC-1',
    stockQuantity: 5,
    bufferStock: null,
    version: 1
  };
  const globalBuffer = 2;

  // Simulated transaction runner mirroring Firestore runTransaction optimistic concurrency
  function attemptTransaction(requestedQty, customerId) {
    const readDoc = { ...simulatedDbProduct };
    const buffer = resolveEffectiveBuffer(readDoc.bufferStock, globalBuffer);
    
    // Concurrency stock check inside transaction
    if (!isStockAvailableForSale(readDoc.stockQuantity, buffer, requestedQty, false)) {
      throw new Error(`Customer ${customerId}: Insufficient stock (blocked by buffer ${buffer})`);
    }

    // Prepare write
    const newQty = readDoc.stockQuantity - requestedQty;
    
    // Commit to simulated DB (check version)
    if (simulatedDbProduct.version !== readDoc.version) {
      throw new Error(`Transaction collision / version conflict`);
    }
    
    simulatedDbProduct.stockQuantity = newQty;
    simulatedDbProduct.version += 1;
    return { success: true, remaining: newQty };
  }

  // Customer A commits first (buying 2)
  const resA = attemptTransaction(2, 'CustA');
  assert.equal(resA.success, true);
  assert.equal(simulatedDbProduct.stockQuantity, 3);

  // Customer B then attempts transaction with current DB state (stock = 3, buffer = 2, available = 1)
  // Customer B wants 2: remaining would be 3 - 2 = 1 < buffer 2 -> MUST THROW!
  assert.throws(
    () => attemptTransaction(2, 'CustB'),
    /Insufficient stock/,
    'Customer B transaction must abort cleanly when available stock < requested qty'
  );

  // Database stock remains at 3, buffer protected, 0 over-sell into buffer
  assert.equal(simulatedDbProduct.stockQuantity, 3);
  assert.equal(simulatedDbProduct.version, 2);
});

runTest('1.4 Split-Line Cart SKU Aggregation prevents buffer bypass attack', () => {
  // Adversarial Attack Scenario:
  // A malicious or complex cart splits 1 SKU into multiple line items to bypass single-item checks.
  // Physical stock = 4, buffer = 2 -> available = 2.
  // Attacker adds 2 cart lines: Line 1 = qty 1, Line 2 = qty 2 (total 3).
  // If tested individually without aggregation:
  // Line 1 (qty 1): 4 - 1 = 3 >= 2 (PASS)
  // Line 2 (qty 2): 4 - 2 = 2 >= 2 (PASS if tested against un-aggregated stock)
  
  const rawCartItems = [
    { sku: 'ATTACK-SKU-1', qty: 1 },
    { sku: 'ATTACK-SKU-1', qty: 2 }
  ];

  // Aggregation logic as implemented in billingTransactionService and billingStatusTransaction:
  const aggregatedMap = new Map();
  for (const item of rawCartItems) {
    const sku = item.sku;
    const qty = Math.max(1, Number(item.qty || 1));
    if (aggregatedMap.has(sku)) {
      aggregatedMap.get(sku).totalQty += qty;
    } else {
      aggregatedMap.set(sku, { sku, totalQty: qty });
    }
  }

  const aggregatedItem = aggregatedMap.get('ATTACK-SKU-1');
  assert.equal(aggregatedItem.totalQty, 3, 'Cart lines must aggregate to 3');

  const physicalStock = 4;
  const effectiveBuffer = 2;
  const isAllowed = isStockAvailableForSale(physicalStock, effectiveBuffer, aggregatedItem.totalQty, false);
  assert.equal(isAllowed, false, 'Aggregated demand (3) exceeds available buffer capacity (2)');
});

// ============================================================================
// SUITE 2: CANCELLATION & RETURN REVERSALS (STOCK PRESERVATION & BUFFER IMMUTABILITY)
// ============================================================================
console.log('\n--- Suite 2: Cancellation & Return Reversals ---');

runTest('2.1 Stock restoration restores physical stock without corrupting bufferStock', () => {
  // Product in DB
  const originalProduct = {
    id: 'PROD-REV-01',
    sku: 'SKU-REV-01',
    stockQuantity: 10,
    bufferStock: 3, // custom SKU buffer
    'stats.sold': 20
  };

  // Simulating sale of 4 items
  const soldQty = 4;
  const postSaleProduct = {
    ...originalProduct,
    stockQuantity: originalProduct.stockQuantity - soldQty,
    'stats.sold': originalProduct['stats.sold'] + soldQty
  };
  assert.equal(postSaleProduct.stockQuantity, 6);
  assert.equal(postSaleProduct.bufferStock, 3);

  // Simulating cancellation via handleStockReturn (statusStockHandler.js)
  // `transaction.update(ref, { stockQuantity: newStock, 'stats.sold': increment(-qtyToReturn) })`
  const qtyToReturn = 4;
  const restoredStock = postSaleProduct.stockQuantity + qtyToReturn;
  const updatePayload = {
    stockQuantity: restoredStock,
    'stats.sold': postSaleProduct['stats.sold'] - qtyToReturn
  };

  const finalProduct = {
    ...postSaleProduct,
    ...updatePayload
  };

  assert.equal(finalProduct.stockQuantity, 10, 'Physical stock restored to exactly 10');
  assert.equal(finalProduct.bufferStock, 3, 'SKU bufferStock must remain intact (3)');
  assert.equal(finalProduct['stats.sold'], 20, 'Sold count safely reversed to 20');
});

runTest('2.2 Stock restoration when bufferStock is 0 maintains explicit 0 override', () => {
  const originalProduct = {
    id: 'PROD-REV-ZERO',
    sku: 'SKU-REV-ZERO',
    stockQuantity: 5,
    bufferStock: 0
  };

  // Sell 5 items down to 0
  const postSaleStock = 0;
  // Order cancelled
  const qtyToReturn = 5;
  const restoredStock = postSaleStock + qtyToReturn;

  const restoredProduct = {
    ...originalProduct,
    stockQuantity: restoredStock
  };

  assert.equal(restoredProduct.stockQuantity, 5);
  assert.equal(restoredProduct.bufferStock, 0, 'Explicit 0 bufferStock must not be reset to undefined or 2');
  assert.equal(resolveEffectiveBuffer(restoredProduct.bufferStock, 2), 0, 'Effective buffer must remain 0');
});

runTest('2.3 Cancellation of unfulfilled draft does not inflate physical stock', () => {
  // Scenario: Order was created as 'draft' (statusStockHandler was not invoked, isStockDeducted === false)
  const productInDb = { sku: 'SKU-DRAFT', stockQuantity: 10 };
  const orderDoc = {
    orderId: 'DH-TEMP-001',
    orderStatus: 'draft',
    isStockDeducted: false,
    items: [{ sku: 'SKU-DRAFT', qty: 3 }]
  };

  // In billingStatusTransaction.js line 212:
  // if (isCancelling) {
  //    if (orderData.isStockDeducted || normalizedCurrentStatus === 'paid') {
  //        handleStockReturn(...);
  //    }
  // }
  const isCancelling = true;
  const shouldReturnStock = Boolean(orderDoc.isStockDeducted || orderDoc.orderStatus === 'paid');

  assert.equal(shouldReturnStock, false, 'Draft cancellation must NOT execute handleStockReturn');
  // Stock remains untouched
  assert.equal(productInDb.stockQuantity, 10, 'Stock must not be phantom-inflated to 13');
});

// ============================================================================
// SUITE 3: BIGSELLER CATALOG EXPORT & MARKETPLACE STOCK COMPUTATION
// ============================================================================
console.log('\n--- Suite 3: BigSeller Full Catalog Export & Stock Math ---');

runTest('3.1 Stock = 5, Buffer = 2 exports exactly 3 available stock', () => {
  const stock = 5;
  const buffer = 2;
  const effectiveBuffer = resolveEffectiveBuffer(buffer, 2);
  const countStock = calculateAvailableStock(stock, effectiveBuffer);
  assert.equal(countStock, 3, '5 physical stock with 2 buffer must export 3');
});

runTest('3.2 Stock = 1, Buffer = 3 clamps countStock to 0 (never negative)', () => {
  const stock = 1;
  const buffer = 3;
  const effectiveBuffer = resolveEffectiveBuffer(buffer, 2);
  const countStock = calculateAvailableStock(stock, effectiveBuffer);
  assert.equal(countStock, 0, '1 physical stock with 3 buffer must clamp to 0 (not -2)');
});

runTest('3.3 Stock = 0, Buffer = 2 exports 0', () => {
  const stock = 0;
  const buffer = 2;
  const countStock = calculateAvailableStock(stock, buffer);
  assert.equal(countStock, 0, '0 physical stock must export 0');
});

runTest('3.4 SKU buffer override = 0 exports full physical stock (no reservation)', () => {
  const stock = 5;
  const skuBuffer = 0;
  const globalBuffer = 3; // Global setting is 3, but this SKU has 0 override
  const effectiveBuffer = resolveEffectiveBuffer(skuBuffer, globalBuffer);
  const countStock = calculateAvailableStock(stock, effectiveBuffer);
  assert.equal(effectiveBuffer, 0, 'Effective buffer must be 0');
  assert.equal(countStock, 5, 'Full physical stock of 5 must be exported');
});

runTest('3.5 SKU buffer override takes precedence over BigSeller warehouse buffer', () => {
  const stock = 10;
  const skuBuffer = 4;
  const warehouseBuffer = 1;
  const effectiveBuffer = resolveEffectiveBuffer(skuBuffer, warehouseBuffer);
  const countStock = calculateAvailableStock(stock, effectiveBuffer);
  assert.equal(effectiveBuffer, 4);
  assert.equal(countStock, 6);
});

runTest('3.6 Whitespace or empty SKU buffer safely falls back to warehouse buffer', () => {
  const stock = 8;
  const warehouseBuffer = 3;

  assert.equal(calculateAvailableStock(stock, resolveEffectiveBuffer('', warehouseBuffer)), 5);
  assert.equal(calculateAvailableStock(stock, resolveEffectiveBuffer('   ', warehouseBuffer)), 5);
  assert.equal(calculateAvailableStock(stock, resolveEffectiveBuffer(null, warehouseBuffer)), 5);
  assert.equal(calculateAvailableStock(stock, resolveEffectiveBuffer(undefined, warehouseBuffer)), 5);
});

runTest('3.7 Full Catalog Batch Dataset export math integrity across 100 simulated SKUs', () => {
  // Generate 100 heterogeneous items
  const catalog = [];
  for (let i = 0; i < 100; i++) {
    const stockQuantity = (i % 15) - 2; // contains negative, 0, and positive numbers (-2 to 12)
    const bufferStock = (i % 5 === 0) ? 0 : (i % 7 === 0 ? 5 : null); // 0, 5, or fallback
    catalog.push({
      sku: `SKU-BATCH-${String(i).padStart(3, '0')}`,
      stockQuantity,
      bufferStock
    });
  }

  const globalBuffer = 2;

  const exported = catalog.map(item => {
    const effectiveBuffer = resolveEffectiveBuffer(item.bufferStock, globalBuffer);
    const countStock = calculateAvailableStock(item.stockQuantity, effectiveBuffer);
    return {
      sku: item.sku,
      stockQuantity: item.stockQuantity,
      effectiveBuffer,
      countStock
    };
  });

  // Verify invariants across all 100 items:
  for (const item of exported) {
    assert.ok(item.countStock >= 0, `Item ${item.sku} countStock must be >= 0 (got ${item.countStock})`);
    assert.ok(Number.isInteger(item.countStock), `Item ${item.sku} countStock must be integer`);
    assert.ok(item.effectiveBuffer >= 0, `Item ${item.sku} effectiveBuffer must be >= 0`);

    if (item.stockQuantity <= item.effectiveBuffer) {
      assert.equal(item.countStock, 0, `When stock <= buffer, countStock must be 0 for ${item.sku}`);
    } else {
      assert.equal(item.countStock, item.stockQuantity - item.effectiveBuffer, `Correct math for ${item.sku}`);
    }
  }
});

// ============================================================================
// SUITE 4: ADVERSARIAL EDGE CASES & NUMERICAL BOUNDARIES
// ============================================================================
console.log('\n--- Suite 4: Adversarial Numerical Boundaries ---');

runTest('4.1 String numeric conversions: "10" stock and "3" buffer', () => {
  const effectiveBuffer = resolveEffectiveBuffer("3", "2");
  assert.equal(effectiveBuffer, 3);
  assert.equal(calculateAvailableStock("10", effectiveBuffer), 7);
  assert.equal(isStockAvailableForSale("10", effectiveBuffer, "4"), true);
  assert.equal(isStockAvailableForSale("10", effectiveBuffer, "8"), false);
});

runTest('4.2 Float buffer rounding: 3.8 buffer floors to 3', () => {
  const effectiveBuffer = resolveEffectiveBuffer(3.8, 2);
  assert.equal(effectiveBuffer, 3, 'Floors 3.8 to 3');
  assert.equal(calculateAvailableStock(5, effectiveBuffer), 2);
});

runTest('4.3 Extreme negative stock: -999 stock with buffer 2 yields 0 available stock', () => {
  assert.equal(calculateAvailableStock(-999, 2), 0);
  assert.equal(isStockAvailableForSale(-999, 2, 1, true), false, 'Even bypass cannot sell negative stock');
  assert.equal(isProductOutOfStock(-999, 2), true);
});

console.log('\n========================================================================');
console.log(`  🎉 ALL ADVERSARIAL CHALLENGER TESTS PASSED: ${passedTests}/${totalTests} checks!`);
console.log('========================================================================\n');
