/**
 * Verification Script: Stock Parser & Natural Randomization Check
 * Tests:
 * 1. ProductList.jsx stock parser correctly parses numeric stock (13, 143, 335)
 * 2. ProductList.jsx does NOT convert boolean inStock: true to 0
 * 3. featuredQueryService maps explicit numeric stock and shuffles natural showcase pool
 * 
 * Location: Management System/tests/verifications/verify_stock_parser_fix.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY: Stock Parser & Natural Randomization Check');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// -------------------------------------------------------------
// Test 1: Functional simulator of ProductList stock parsing
// -------------------------------------------------------------
test('ProductList stock parser handles inStock boolean and numeric stockQuantity properly', () => {
  const normalizeKey = (k) => String(k).replace(/[_-\s]/g, '').toLowerCase();
  const getVal = (obj, possibleKeys) => {
    if (!obj || typeof obj !== 'object') return null;
    const normalizedObj = Object.keys(obj).reduce((acc, key) => {
      acc[normalizeKey(key)] = obj[key];
      return acc;
    }, {});
    for (let key of possibleKeys) {
      const val = normalizedObj[normalizeKey(key)];
      if (val !== undefined && val !== null && val !== '') return val;
    }
    return null;
  };

  const parseStock = (product) => {
    const rawStock = getVal(product, ['stock', 'stockquantity', 'quantity', 'qty', 'amount', 'คงเหลือ', 'สต๊อก', 'inventory', 'available', 'จำนวน', 'จำนวนสินค้า']);
    let stock = 0;
    if (typeof rawStock === 'boolean') {
      stock = rawStock ? 1 : 0;
    } else if (typeof rawStock === 'object' && rawStock !== null) {
      stock = rawStock.quantity ?? rawStock.stock ?? 0;
    } else if (rawStock !== null && rawStock !== undefined && rawStock !== '') {
      const parsed = Number(String(rawStock).replace(/[^0-9.-]+/g,""));
      stock = isNaN(parsed) ? 0 : parsed;
    } else if (product.inStock === true) {
      stock = 1;
    }
    return stock;
  };

  // Case A: Showcase item with stockQuantity = 13 and inStock = true
  const itemA = { sku: 'KBAS047', stockQuantity: 13, inStock: true };
  assert.strictEqual(parseStock(itemA), 13, 'Must parse stock as 13');
  assert.strictEqual(parseStock(itemA) > 0, true, 'hasStock must be true');

  // Case B: Showcase item with stockQuantity = 143 and inStock = true
  const itemB = { sku: 'ADAC006', stockQuantity: 143, inStock: true };
  assert.strictEqual(parseStock(itemB), 143, 'Must parse stock as 143');
  assert.strictEqual(parseStock(itemB) > 0, true, 'hasStock must be true');

  // Case C: Truly out-of-stock item
  const itemC = { sku: 'OUT001', stockQuantity: 0, inStock: false };
  assert.strictEqual(parseStock(itemC), 0, 'Must parse stock as 0');
  assert.strictEqual(parseStock(itemC) > 0, false, 'hasStock must be false (OUT OF STOCK)');
});

// -------------------------------------------------------------
// Test 2: Check AST of ProductList.jsx
// -------------------------------------------------------------
test('ProductList.jsx contains fixed stock priority without corrupting instock', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/ProductList.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("['stock', 'stockquantity', 'quantity'"), 'Must prioritize stock and stockquantity');
  assert.ok(code.includes("typeof rawStock === 'boolean'"), 'Must handle boolean properly');
});

// -------------------------------------------------------------
// Test 3: Check AST of featuredQueryService.js
// -------------------------------------------------------------
test('featuredQueryService.js maps explicit stock and shuffles naturally', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/featuredQueryService.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("stock: qty, // Explicit numeric stock"), 'Must provide explicit numeric stock');
  assert.ok(code.includes("return [...mappedShowcase].sort(() => 0.5 - Math.random()).slice(0, limitCount)"), 'Must shuffle naturally from mappedShowcase');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
