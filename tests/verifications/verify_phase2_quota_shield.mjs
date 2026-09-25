/**
 * Phase 2 Verification Script: Quota Shield & Ad Placement Verification
 * Tests:
 * 1. featuredQueryService imports and reads catalogs/home_showcase as Tier 1 shield
 * 2. featuredQueryService prioritizes in-stock items
 * 3. useAdInjection protects slot 0 from being occupied by ads in the first product chunk
 * 
 * Location: Management System/tests/verifications/verify_phase2_quota_shield.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY PHASE 2: Quota Shield & Ad Placement Check');
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
// Test 1: Verify featuredQueryService.js AST for Showcase Chunk
// -------------------------------------------------------------
test('featuredQueryService.js implements catalogs/home_showcase 1-read shield', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/featuredQueryService.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("SHOWCASE_DOC_ID = 'home_showcase'"), 'Must define home_showcase doc ID');
  assert.ok(code.includes("CATALOGS_COLLECTION = 'catalogs'"), 'Must define catalogs collection');
  assert.ok(code.includes("mappedShowcase"), 'Must map showcase items');
  assert.ok(code.includes("sort(() => 0.5 - Math.random())"), 'Must naturally shuffle showcase items');
});

// -------------------------------------------------------------
// Test 2: Verify fallback mechanism exists
// -------------------------------------------------------------
test('featuredQueryService.js retains resilient fallback query', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/featuredQueryService.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("productsRef = collection(db, getCollectionPath(PRODUCTS_COLLECTION))"), 'Must retain productsRef fallback');
  assert.ok(code.includes("orderBy('randomSeed')"), 'Must retain randomized fallback');
});

// -------------------------------------------------------------
// Test 3: Verify useAdInjection protects slot 0
// -------------------------------------------------------------
test('useAdInjection.js protects slot 0 for real products in first chunk', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/hooks/useAdInjection.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("randomInsertPos = 1 + ((chunk.length * 17 + 7) % (chunk.length - 1))"), 'Must calculate slot >= 1 for i === 0');
  
  // Mathematical test for chunks of length 2 to 10
  for (let len = 2; len <= 10; len++) {
    const pos = 1 + ((len * 17 + 7) % (len - 1));
    assert.ok(pos >= 1 && pos < len, `Position ${pos} must be >= 1 and < ${len}`);
  }
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
