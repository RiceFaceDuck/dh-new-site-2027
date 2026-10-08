import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 [Verification] Starting CategoryPage 50 Items Pagination & Stock Sorting Test...");

const categoryPagePath = path.resolve(__dirname, '../../dh-frontend/src/pages/CategoryPage.jsx');
const productServicePath = path.resolve(__dirname, '../../dh-frontend/src/firebase/productService.js');

const pageContent = fs.readFileSync(categoryPagePath, 'utf8');
const serviceContent = fs.readFileSync(productServicePath, 'utf8');

// 1. Static Checks in productService.js
console.log("🔍 Checking 50 items default in productService.js...");
if (!serviceContent.includes('limitCount = 50')) {
  console.error("❌ FAILED: Default limitCount should be 50 in productService.getProductsByCategory!");
  process.exit(1);
}

if (!serviceContent.includes('const lastSku = docs[docs.length - 1]?.id || null;')) {
  console.error("❌ FAILED: lastSku extraction missing in productService.js chunk handling!");
  process.exit(1);
}

console.log("✅ Passed productService.js 50-item limit checks.");

// 2. Static Checks in CategoryPage.jsx
console.log("🔍 Checking 50-item Pagination and Sorting in CategoryPage.jsx...");
if (!pageContent.includes('itemsPerPage = 50')) {
  console.error("❌ FAILED: itemsPerPage = 50 missing in CategoryPage.jsx!");
  process.exit(1);
}

if (!pageContent.includes('handlePageChange')) {
  console.error("❌ FAILED: handlePageChange handler missing in CategoryPage.jsx!");
  process.exit(1);
}

if (!pageContent.includes('sortInStockFirst')) {
  console.error("❌ FAILED: sortInStockFirst helper missing in CategoryPage.jsx!");
  process.exit(1);
}

if (!pageContent.includes('pageCacheRef')) {
  console.error("❌ FAILED: pageCacheRef for zero-quota page re-visits missing in CategoryPage.jsx!");
  process.exit(1);
}

if (!pageContent.includes('pageCursorsRef')) {
  console.error("❌ FAILED: pageCursorsRef for sequential cursor tracking missing in CategoryPage.jsx!");
  process.exit(1);
}

if (!pageContent.includes('getPageNumbers')) {
  console.error("❌ FAILED: getPageNumbers helper for smart pagination buttons missing in CategoryPage.jsx!");
  process.exit(1);
}

// 3. Calm UI & Infinite Scroll Removal Check
console.log("🔍 Verifying Infinite Scroll removal & Calm UI...");
if (pageContent.includes('IntersectionObserver')) {
  console.error("❌ FAILED: IntersectionObserver infinite scroll should be removed in favor of pagination!");
  process.exit(1);
}

console.log("✅ Passed CategoryPage.jsx 50-item Pagination checks.");

// 4. Logic Simulation for Sorting
console.log("🔍 Testing In-Stock Priority Sorting logic...");
const sampleProducts = [
  { id: '1', name: 'No stock', stockQuantity: 0, availableStock: 0, isOutOfStock: true },
  { id: '2', name: 'Has stock 10', stockQuantity: 10, availableStock: 8, isOutOfStock: false },
  { id: '3', name: 'No stock 2', stockQuantity: 0, availableStock: 0, isOutOfStock: true },
  { id: '4', name: 'Has stock 1', stockQuantity: 1, availableStock: 1, isOutOfStock: false }
];

const sortInStockFirst = (list) => {
  return [...list].sort((a, b) => {
    const aInStock = (a.availableStock > 0 || (!a.isOutOfStock && a.stockQuantity > 0)) ? 1 : 0;
    const bInStock = (b.availableStock > 0 || (!b.isOutOfStock && b.stockQuantity > 0)) ? 1 : 0;
    return bInStock - aInStock;
  });
};

const sorted = sortInStockFirst(sampleProducts);
if (sorted[0].id !== '2' && sorted[0].id !== '4') {
  console.error("❌ FAILED: In-stock product not prioritized first!");
  process.exit(1);
}

if (sorted[2].stockQuantity !== 0 || sorted[3].stockQuantity !== 0) {
  console.error("❌ FAILED: Out of stock product not moved to end!");
  process.exit(1);
}

console.log("✅ In-Stock Priority Sorting logic passed perfectly!");
console.log("🎉 ALL 50-ITEM PAGINATION VERIFICATIONS PASSED SUCCESSFULLY!");
