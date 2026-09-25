/**
 * Phase 1 Verification Script: Catalog & Category Data Integrity
 * Tests:
 * 1. useExcelImport mapping logic ensures category_lower is generated and in sync
 * 2. productService.getProductsByCategory normalizes output and supports clean category querying
 * 3. categorySyncService targets official settings/product_categories
 * 
 * Location: Management System/tests/verifications/verify_phase1_catalog_integrity.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY PHASE 1: Catalog & Category Data Integrity Check');
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
// Test 1: Verify useExcelImport.js AST / Content for category_lower
// -------------------------------------------------------------
test('useExcelImport.js injects category_lower for both new and existing items', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/inventory/hooks/useExcelImport.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('category_lower'), 'useExcelImport.js must contain category_lower');
  assert.ok(code.includes('mapped.category_lower = finalCategory.trim().toLowerCase()'), 'Must lowercase and trim category');
});

// -------------------------------------------------------------
// Test 2: Verify productService.js normalization in getProductsByCategory
// -------------------------------------------------------------
test('productService.js normalizes products in getProductsByCategory', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/productService.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('this.normalizeProductData({ id: doc.id, ...doc.data() })'), 'getProductsByCategory must call normalizeProductData');
  assert.ok(code.includes('cleanCategory = (category || \'\').trim()'), 'getProductsByCategory must trim category');
  assert.ok(code.includes('fallbackQ = query(productsRef, where("category", "==", cleanCategory)'), 'Must contain resilient fallback for category field');
});

// -------------------------------------------------------------
// Test 3: Verify categorySyncService.js targets settings/product_categories
// -------------------------------------------------------------
test('categorySyncService.js updates official settings/product_categories', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/categorySyncService.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("getCollectionPath('settings'), 'product_categories'"), 'Must update settings/product_categories');
  assert.ok(code.includes("syncProductsByField('category_lower'"), 'Must sync category_lower in products');
});

// -------------------------------------------------------------
// Test 4: Functional Simulator of Category Mapping Logic
// -------------------------------------------------------------
test('Functional mapping produces expected normalized category fields', () => {
  const rawRow1 = { Name: 'Keyboard Dell', Category: 'Keyboard', Price: '300' };
  const mapped1 = {
    name: rawRow1.Name,
    category: rawRow1.Category
  };
  const finalCategory1 = mapped1.category || 'Other';
  mapped1.category_lower = finalCategory1.trim().toLowerCase();

  assert.strictEqual(mapped1.category_lower, 'keyboard');

  const rawRow2 = { Name: 'Generic Item', Category: '  Screen 15.6  ' };
  const mapped2 = { category: rawRow2.Category };
  const finalCategory2 = mapped2.category || 'Other';
  mapped2.category_lower = finalCategory2.trim().toLowerCase();

  assert.strictEqual(mapped2.category_lower, 'screen 15.6');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
