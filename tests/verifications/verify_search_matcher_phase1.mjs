/**
 * 🔍 Verification Script: Smart Search Matcher & Synonyms Engine
 * Subsystem: dh-frontend Search Engine (Phase 1)
 * Path: Management System/tests/verifications/verify_search_matcher_phase1.mjs
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const searchMatcherPath = path.resolve(__dirname, '../../dh-frontend/src/utils/searchMatcher.js');

const {
  SEARCH_SYNONYMS,
  tokenizeQuery,
  getExpandedTerms,
  buildProductSearchIndexText,
  matchProductQuery,
  filterProductsByQuery
} = await import('file:///' + searchMatcherPath.replace(/\\/g, '/'));

console.log('================================================================');
console.log('🧪 VERIFY: SEARCH MATCHER & SYNONYMS ENGINE (PHASE 1)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function check(testName, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}: ${err.message}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// Test 1: Tokenizer
// -------------------------------------------------------------
check('tokenizeQuery cleans whitespace and lowercases', () => {
  const tokens = tokenizeQuery('  อะแดปเตอร์   DELL  65W   ');
  assert.deepStrictEqual(tokens, ['อะแดปเตอร์', 'dell', '65w']);
});

check('tokenizeQuery handles empty / non-string gracefully', () => {
  assert.deepStrictEqual(tokenizeQuery(''), []);
  assert.deepStrictEqual(tokenizeQuery(null), []);
  assert.deepStrictEqual(tokenizeQuery(undefined), []);
});

// -------------------------------------------------------------
// Test 2: Synonym Expansion
// -------------------------------------------------------------
check('getExpandedTerms expands "อะแดปเตอร์" to include "adapter" and "charger"', () => {
  const terms = getExpandedTerms('อะแดปเตอร์');
  assert.ok(terms.includes('อะแดปเตอร์'));
  assert.ok(terms.includes('adapter'));
  assert.ok(terms.includes('charger'));
});

check('getExpandedTerms expands "หน้าจอ" to include "panel", "screen", "led"', () => {
  const terms = getExpandedTerms('หน้าจอ');
  assert.ok(terms.includes('หน้าจอ'));
  assert.ok(terms.includes('panel'));
  assert.ok(terms.includes('screen'));
  assert.ok(terms.includes('led'));
});

check('getExpandedTerms expands "พัดลม" to include "fan" and "cooling"', () => {
  const terms = getExpandedTerms('พัดลม');
  assert.ok(terms.includes('พัดลม'));
  assert.ok(terms.includes('cooling'));
  assert.ok(terms.includes('fan'));
});

// -------------------------------------------------------------
// Test 3: Realistic Product Matching (Real Database Samples)
// -------------------------------------------------------------
const sampleProducts = [
  {
    id: 'ADAC001',
    sku: 'ADAC001',
    name: 'ACER 12V 1.5A [ 3.0*1.0 ] 18W',
    category: 'adapter',
    brand: 'Acer',
    model: '',
    compatibleModels: ['Acer Aspire One', 'Acer Switch Alpha'],
    retailPrice: 490
  },
  {
    id: 'ADDE002',
    sku: 'ADDE002',
    name: 'DELL 19.5V 3.34A [ 7.4*5.0 ] 65W',
    category: 'adapter',
    brand: 'Dell',
    model: 'Inspiron 3520',
    compatibleModels: ['Dell Latitude 3440', 'Dell Vostro 3500'],
    retailPrice: 590
  },
  {
    id: 'LED13338',
    sku: 'LED13338',
    name: 'LED 13.3 SLIM 40PIN EDP',
    category: 'panel',
    brand: 'Universal',
    compatibleModels: ['MacBook Air A1466', 'Asus ZenBook UX310'],
    retailPrice: 3790
  },
  {
    id: 'FADE045',
    sku: 'FADE045',
    name: 'FAN-DELL INSPIRON 15 3000 SERIES',
    category: 'cooling',
    brand: 'Dell',
    compatibleModels: ['Dell Inspiron 3541', 'Dell Inspiron 3542'],
    retailPrice: 190
  }
];

check('Matching "อะแดปเตอร์" finds ACER & DELL adapters even without "อะแดปเตอร์" in product name', () => {
  const results = filterProductsByQuery(sampleProducts, 'อะแดปเตอร์');
  assert.strictEqual(results.length, 2);
  assert.ok(results.some(p => p.sku === 'ADAC001'));
  assert.ok(results.some(p => p.sku === 'ADDE002'));
});

check('Matching "อแดปเตอร์" finds adapters as well', () => {
  const results = filterProductsByQuery(sampleProducts, 'อแดปเตอร์');
  assert.strictEqual(results.length, 2);
});

check('Matching multi-token "adapter dell 65w" finds specific Dell adapter', () => {
  const results = filterProductsByQuery(sampleProducts, 'adapter dell 65w');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].sku, 'ADDE002');
});

check('Matching "หน้าจอ" finds LED 13.3 SLIM panel', () => {
  const results = filterProductsByQuery(sampleProducts, 'หน้าจอ');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].sku, 'LED13338');
});

check('Matching "พัดลม" finds FAN-DELL cooling product', () => {
  const results = filterProductsByQuery(sampleProducts, 'พัดลม');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].sku, 'FADE045');
});

check('Matching compatible model "Inspiron 3541" finds correct fan', () => {
  const results = filterProductsByQuery(sampleProducts, 'Inspiron 3541');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].sku, 'FADE045');
});

// -------------------------------------------------------------
// Test 4: Targeted Category Chunk Resolver
// -------------------------------------------------------------
const { getTargetCategoryChunkName } = await import('file:///' + searchMatcherPath.replace(/\\/g, '/'));

check('getTargetCategoryChunkName resolves "ลำโพง" to "cat_built in audio"', () => {
  assert.strictEqual(getTargetCategoryChunkName('ลำโพง'), 'cat_built in audio');
  assert.strictEqual(getTargetCategoryChunkName('speaker'), 'cat_built in audio');
});

check('getTargetCategoryChunkName resolves "บานพับ" to "cat_hinge"', () => {
  assert.strictEqual(getTargetCategoryChunkName('บานพับ'), 'cat_hinge');
});

check('getTargetCategoryChunkName resolves "สายแพร" to "cat_cable"', () => {
  assert.strictEqual(getTargetCategoryChunkName('สายแพร'), 'cat_cable');
});

check('getTargetCategoryChunkName resolves "อะแดปเตอร์" to "cat_adapter"', () => {
  assert.strictEqual(getTargetCategoryChunkName('อะแดปเตอร์'), 'cat_adapter');
});

check('getTargetCategoryChunkName resolves "จอ" and "หน้าจอ" to "cat_panel"', () => {
  assert.strictEqual(getTargetCategoryChunkName('จอ 14'), 'cat_panel');
  assert.strictEqual(getTargetCategoryChunkName('หน้าจอ dell'), 'cat_panel');
});

// -------------------------------------------------------------
// Test 5: Related Products Matcher (Zero Dead-End)
// -------------------------------------------------------------
const { findRelatedProducts } = await import('file:///' + searchMatcherPath.replace(/\\/g, '/'));

check('findRelatedProducts suggests partial matches when exact query does not match', () => {
  const catalog = [
    { id: '1', sku: 'LCD14101', name: 'LCD 14.1 30 PIN Samsung', category: 'panel', inStock: true },
    { id: '2', sku: 'LCD15601', name: 'LCD 15.6 SLIM 30 PIN', category: 'panel', inStock: false },
    { id: '3', sku: 'FAN001', name: 'FAN DELL INSPIRON', category: 'cooling', inStock: true }
  ];

  // Exact search: "จอ 14 asus" (ไม่มี asus ใน catalog)
  const exact = filterProductsByQuery(catalog, 'จอ 14 asus');
  assert.strictEqual(exact.length, 0);

  // Related suggestions: ควรแนะนำ item 1 (ตรงทั้ง จอ และ 14) และ item 2 (ตรง จอ)
  const related = findRelatedProducts(catalog, 'จอ 14 asus', []);
  assert.ok(related.length >= 1);
  assert.strictEqual(related[0].id, '1'); // Item 1 มีคะแนนสูงสุดเพราะตรง 2 tokens
});

console.log('\n================================================================');
console.log(`📊 SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

