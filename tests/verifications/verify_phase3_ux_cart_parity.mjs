/**
 * Phase 3 Verification Script: UX & Cart Parity Check
 * Tests:
 * 1. ProductList.jsx handleAddToCart does not block guest users
 * 2. ProductList.jsx provides consistent optimistic feedback
 * 
 * Location: Management System/tests/verifications/verify_phase3_ux_cart_parity.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY PHASE 3: UX & Cart Parity Check');
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
// Test 1: Verify ProductList.jsx does not block guest cart
// -------------------------------------------------------------
test('ProductList.jsx does not block unauthenticated users from adding to cart', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/ProductList.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(!code.includes('กรุณาเข้าสู่ระบบก่อนหยิบสินค้าใส่ตะกร้า'), 'Must remove auth restriction on adding to cart');
  assert.ok(code.includes('addToCart(product, 1)'), 'Must call addToCart');
  assert.ok(code.includes('showToast("เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว!", "success")'), 'Must display success toast');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
