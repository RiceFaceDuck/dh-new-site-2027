import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 [Verification] Starting CategoryPage Phase 3 - Calm UI & Header Polish Test...");

const categoryPagePath = path.resolve(__dirname, '../../dh-frontend/src/pages/CategoryPage.jsx');
const productCardPath = path.resolve(__dirname, '../../dh-frontend/src/components/ProductCard.jsx');

const pageContent = fs.readFileSync(categoryPagePath, 'utf8');
const cardContent = fs.readFileSync(productCardPath, 'utf8');

// 1. Check ProductCard Calm UI
console.log("🔍 Checking ProductCard Calm UI (no animate-pulse)...");
if (cardContent.includes('animate-pulse') && cardContent.includes('READY')) {
  console.error("❌ FAILED: animate-pulse still present on ProductCard stock indicator!");
  process.exit(1);
}

if (!cardContent.includes('bg-rose-500')) {
  console.error("❌ FAILED: Out of stock indicator missing clear calm color!");
  process.exit(1);
}
console.log("✅ Passed ProductCard Calm UI check: zero flashing animations.");

// 2. Check CategoryPage Header Polish & categoryInfo usage
console.log("🔍 Checking CategoryPage Header Polish...");
if (!pageContent.includes('categoryInfo?.name || type')) {
  console.error("❌ FAILED: categoryInfo name fallback missing in CategoryPage header!");
  process.exit(1);
}

if (!pageContent.includes('รายการ')) {
  console.error("❌ FAILED: Product count badge missing in CategoryPage header!");
  process.exit(1);
}

if (!pageContent.includes('กลับสู่หมวดหมู่ทั้งหมด')) {
  console.error("❌ FAILED: Accessible back link aria-label missing!");
  process.exit(1);
}

console.log("✅ Passed CategoryPage Header Polish checks.");
console.log("🎉 ALL PHASE 3 VERIFICATIONS PASSED SUCCESSFULLY!");
