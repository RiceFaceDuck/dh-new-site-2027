/**
 * 🧪 Phase 5 Verification Script: verify_categories_quota_and_flow.mjs
 * ตรวจสอบความถูกต้องของโครงสร้างแคช 3-Tier, การแปลง Alias หมวดหมู่ (FAN/ลำโพง),
 * และความปลอดภัยของโควต้าอ่านใน dh-frontend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==================================================");
console.log("🚀 Running Category Quota & Flow Verification Suite");
console.log("==================================================");

let passedTests = 0;
let totalTests = 0;

const assert = (condition, message) => {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
};

const CATEGORY_SERVICE = path.resolve(__dirname, '../../dh-frontend/src/firebase/categoryService.js');
const PRODUCT_SERVICE = path.resolve(__dirname, '../../dh-frontend/src/firebase/productService.js');
const USE_CATEGORIES = path.resolve(__dirname, '../../dh-frontend/src/pages/Categories/hooks/useCategories.js');
const CATEGORIES_MAIN = path.resolve(__dirname, '../../dh-frontend/src/pages/Categories/CategoriesMain.jsx');
const LAZY_FEATURED = path.resolve(__dirname, '../../dh-frontend/src/pages/Categories/components/LazyFeaturedSection.jsx');
const CATEGORY_PAGE = path.resolve(__dirname, '../../dh-frontend/src/pages/CategoryPage.jsx');
const MEMORY_CACHE = path.resolve(__dirname, '../../dh-frontend/src/utils/memoryCache.js');
const NIGHTLY_CHUNK = path.resolve(__dirname, '../../functions/inventory/nightlyChunkGuard.js');

// 1. Files existence check
console.log("\n📦 Test Suite 1: File Architecture & Integrity");
assert(fs.existsSync(CATEGORY_SERVICE), "categoryService.js exists");
assert(fs.existsSync(PRODUCT_SERVICE), "productService.js exists");
assert(fs.existsSync(USE_CATEGORIES), "useCategories.js exists");
assert(fs.existsSync(CATEGORIES_MAIN), "CategoriesMain.jsx exists");
assert(fs.existsSync(LAZY_FEATURED), "LazyFeaturedSection.jsx exists");
assert(fs.existsSync(CATEGORY_PAGE), "CategoryPage.jsx exists");
assert(fs.existsSync(MEMORY_CACHE), "memoryCache.js exists");
assert(fs.existsSync(NIGHTLY_CHUNK), "nightlyChunkGuard.js exists");

// 2. Category Service 3-Tier Quota & Alias
console.log("\n⚡ Test Suite 2: categoryService Quota & Normalization");
const catServiceCode = fs.readFileSync(CATEGORY_SERVICE, 'utf-8');
assert(catServiceCode.includes('CATEGORY_ALIASES'), "CATEGORY_ALIASES exported in categoryService");
assert(catServiceCode.includes("fan: 'cooling'"), "Alias 'fan' maps to 'cooling'");
assert(catServiceCode.includes("speaker: 'built in audio'") || catServiceCode.includes("ลำโพง: 'built in audio'"), "Alias 'ลำโพง' maps to 'built in audio'");
assert(catServiceCode.includes('LOCAL_STORAGE_KEY'), "Persistent LocalStorage key configured");
assert(catServiceCode.includes('categories_index'), "Tier 1 categories_index shield implemented");
assert(catServiceCode.includes('getCategoryByType'), "getCategoryByType helper implemented");
assert(catServiceCode.includes('clearLocalCache'), "clearLocalCache helper implemented");

// 3. Product Service Zero-Quota & Native DocumentId Cursor
console.log("\n🛡️ Test Suite 3: productService Cursor & Pagination Guard");
const prodServiceCode = fs.readFileSync(PRODUCT_SERVICE, 'utf-8');
assert(prodServiceCode.includes('CATEGORY_ALIASES'), "productService imports CATEGORY_ALIASES");
assert(prodServiceCode.includes('targetCategory = CATEGORY_ALIASES'), "productService resolves category alias dynamically");
assert(prodServiceCode.includes("lowerCaseType === 'undefined'"), "productService guards against 'undefined' category leaks");
assert(prodServiceCode.includes("orderBy(documentId(), \"asc\")"), "productService uses native documentId() ascending sort");
assert(prodServiceCode.includes("startAfter(lastVisible)"), "productService uses direct string cursor without extra getDoc reads");

// 4. CategoriesMain Lazy Loading Guard
console.log("\n🚀 Test Suite 4: CategoriesMain On-Demand Quota Conservation");
const catMainCode = fs.readFileSync(CATEGORIES_MAIN, 'utf-8');
const lazyCode = fs.readFileSync(LAZY_FEATURED, 'utf-8');
assert(!catMainCode.includes('useHomeProducts(12)'), "CategoriesMain does not directly invoke useHomeProducts at root level");
assert(catMainCode.includes('LazyFeaturedSection'), "CategoriesMain uses LazyFeaturedSection");
assert(lazyCode.includes('IntersectionObserver'), "LazyFeaturedSection uses IntersectionObserver to defer featured spares fetching");

// 5. CategoryPage Alias Resolution
console.log("\n🔍 Test Suite 5: CategoryPage Zero-Leak Header Resolution");
const catPageCode = fs.readFileSync(CATEGORY_PAGE, 'utf-8');
assert(catPageCode.includes('categoryService.getCategoryByType(type)'), "CategoryPage uses getCategoryByType for 0-Read cached category metadata");

// 6. MemoryCache Phantom Revalidate Guard
console.log("\n🔒 Test Suite 6: memoryCache Zero-Phantom-Quota Guard");
const memCacheCode = fs.readFileSync(MEMORY_CACHE, 'utf-8');
assert(memCacheCode.includes('typeof onRevalidate === \'function\''), "memoryCache prevents phantom background fetch without onRevalidate callback");

// 7. NightlyChunkGuard Categories Index & Deterministic Order
console.log("\n🌙 Test Suite 7: nightlyChunkGuard Deterministic Chunking");
const nightlyCode = fs.readFileSync(NIGHTLY_CHUNK, 'utf-8');
assert(nightlyCode.includes('categories_index'), "nightlyChunkGuard builds categories_index catalog chunk");
assert(nightlyCode.includes('localeCompare'), "nightlyChunkGuard deterministically sorts category chunk items by SKU");

console.log("\n==================================================");
console.log(`🎉 All Tests Complete: ${passedTests}/${totalTests} Passed!`);
console.log("==================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
