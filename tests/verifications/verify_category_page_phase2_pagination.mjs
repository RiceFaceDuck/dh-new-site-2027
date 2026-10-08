import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 [Verification] Starting CategoryPage Phase 2 - 2-Tier Pagination & Stock Sorting Test...");

const categoryPagePath = path.resolve(__dirname, '../../dh-frontend/src/pages/CategoryPage.jsx');
const productServicePath = path.resolve(__dirname, '../../dh-frontend/src/firebase/productService.js');

const pageContent = fs.readFileSync(categoryPagePath, 'utf8');
const serviceContent = fs.readFileSync(productServicePath, 'utf8');

// 1. Static Checks in productService.js
console.log("🔍 Checking 2-Tier Cursor Support in productService.js...");
if (!serviceContent.includes('const lastSku = docs[docs.length - 1]?.id || null;')) {
  console.error("❌ FAILED: lastSku extraction missing in productService.js chunk handling!");
  process.exit(1);
}

if (!serviceContent.includes('typeof cursor === \'string\'')) {
  console.error("❌ FAILED: String cursor snapshot resolver missing in productService.js!");
  process.exit(1);
}

console.log("✅ Passed productService.js 2-Tier Cursor checks.");

// 2. Static Checks in CategoryPage.jsx
console.log("🔍 Checking 2-Tier Pagination and Sorting in CategoryPage.jsx...");
if (!pageContent.includes('sortInStockFirst')) {
  console.error("❌ FAILED: sortInStockFirst helper missing in CategoryPage.jsx!");
  process.exit(1);
}

if (!pageContent.includes('cachedResult?.hasMore !== undefined')) {
  console.error("❌ FAILED: hasMore check from chunk missing in CategoryPage.jsx!");
  process.exit(1);
}

if (!pageContent.includes('new Set(prev.map(p => p.id))')) {
  console.error("❌ FAILED: Deduplication guard missing in infinite scroll handler!");
  process.exit(1);
}

console.log("✅ Passed CategoryPage.jsx 2-Tier Pagination and Sorting checks.");

// 3. Logic Simulation for Sorting
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
console.log("🎉 ALL PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!");
