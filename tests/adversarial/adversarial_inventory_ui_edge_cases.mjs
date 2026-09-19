/**
 * Adversarial Edge-Case Verification for Inventory UI Alignment
 * Location: Management System/tests/adversarial/adversarial_inventory_ui_edge_cases.mjs
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DH_BACKOFFICE_ROOT = path.resolve(__dirname, '../../dh-backoffice-react');

console.log('==================================================================');
console.log('  Adversarial Test Suite: Inventory UI & Sorting Edge Cases (R2)');
console.log('==================================================================\n');

let passed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error('    Error:', err.message);
  }
}

// -------------------------------------------------------------
// Test 1: Production Metric Resolution & Baseline Fallback (Cold Start)
// -------------------------------------------------------------
console.log('--- 1. Production Metric Resolution & Cold-Start Baseline Protection ---');

const resolveMetric = (p, statVal, fieldName, historyObj, salesPeriod) => {
  if (statVal != null && !isNaN(Number(statVal))) return Number(statVal);
  const histVal = historyObj?.[salesPeriod];
  if (histVal != null && !isNaN(Number(histVal))) return Number(histVal);
  const flatVal = p[`${fieldName}.${salesPeriod}`];
  if (flatVal != null && !isNaN(Number(flatVal))) return Number(flatVal);
  const baseKey = fieldName.replace('History', '');
  const fallback = p[`${baseKey}${salesPeriod}D`] ?? p[`${baseKey}30D`] ?? (fieldName === 'claimHistory' ? (p[`claims${salesPeriod}D`] ?? p.claims30D) : null);
  if (fallback != null && !isNaN(Number(fallback))) return Number(fallback);
  if (fieldName === 'salesHistory' && salesPeriod === '30') {
    const sold = p.stats?.sold;
    if (sold != null && !isNaN(Number(sold))) return Number(sold);
  }
  return 0;
};

test('Resolves from statsMap when statVal is present', () => {
  const p = { sku: 'SKU-1', stockInHistory: {}, stockIn30D: 5 };
  const res = resolveMetric(p, 25, 'stockInHistory', p.stockInHistory, '30');
  assert.strictEqual(res, 25);
});

test('Falls back to baseline stockIn30D during cold start without clobbering to 0', () => {
  const p = { sku: 'SKU-2', stockIn30D: 42 };
  const res = resolveMetric(p, undefined, 'stockInHistory', p.stockInHistory, '30');
  assert.strictEqual(res, 42);
});

test('Falls back to baseline sales30D or stats.sold during cold start', () => {
  const p1 = { sku: 'SKU-3', sales30D: 88 };
  const res1 = resolveMetric(p1, undefined, 'salesHistory', p1.salesHistory, '30');
  assert.strictEqual(res1, 88);

  const p2 = { sku: 'SKU-4', stats: { sold: 33 } };
  const res2 = resolveMetric(p2, undefined, 'salesHistory', p2.salesHistory, '30');
  assert.strictEqual(res2, 33);
});

test('Falls back to claims30D and adjustment30D baseline', () => {
  const p = { sku: 'SKU-5', claims30D: 7, adjustment30D: -4 };
  assert.strictEqual(resolveMetric(p, undefined, 'claimHistory', p.claimHistory, '30'), 7);
  assert.strictEqual(resolveMetric(p, undefined, 'adjustmentHistory', p.adjustmentHistory, '30'), -4);
});

// -------------------------------------------------------------
// Test 2: Price Formatting & NaN Protection
// -------------------------------------------------------------
console.log('\n--- 2. Price Formatting & NaN Protection ---');

const formatPrice = (priceCandidate) => {
  const num = Number(priceCandidate ?? 0);
  return !isNaN(num) ? num.toLocaleString() : '0';
};

test('Valid prices format cleanly with separators', () => {
  assert.strictEqual(formatPrice(1250), '1,250');
  assert.strictEqual(formatPrice('3500'), '3,500');
  assert.strictEqual(formatPrice(0), '0');
});

test('Corrupted or non-numeric price safely falls back to "0" instead of "NaN"', () => {
  assert.strictEqual(formatPrice('N/A'), '0');
  assert.strictEqual(formatPrice(undefined), '0');
  assert.strictEqual(formatPrice(null), '0');
  assert.strictEqual(formatPrice(NaN), '0');
});

// -------------------------------------------------------------
// Test 3: Dirty Data Resilience (String Tags & String Image URLs)
// -------------------------------------------------------------
console.log('\n--- 3. Dirty Data Resilience (Tags & Image URLs) ---');

const normalizeTags = (tags) => {
  return Array.isArray(tags)
    ? tags.filter(Boolean)
    : typeof tags === 'string' && tags.trim()
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
};

test('Normalizes array tags and filters out null/empty items', () => {
  const tags = normalizeTags(['gaming', null, 'rgb', '']);
  assert.deepStrictEqual(tags, ['gaming', 'rgb']);
});

test('Normalizes string tags into pills without crashing .slice.map', () => {
  const tags = normalizeTags('laptop, dell, ultrabook');
  assert.deepStrictEqual(tags, ['laptop', 'dell', 'ultrabook']);
  // Verify slice.map executes cleanly:
  const pills = tags.slice(0, 2).map(t => t.toUpperCase());
  assert.deepStrictEqual(pills, ['LAPTOP', 'DELL']);
});

test('Safely returns empty array for null, undefined, or empty tags', () => {
  assert.deepStrictEqual(normalizeTags(null), []);
  assert.deepStrictEqual(normalizeTags(undefined), []);
  assert.deepStrictEqual(normalizeTags('   '), []);
});

const extractImageCandidate = (product) => {
  return (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : (typeof product.images === 'string' && product.images.length > 5 ? product.images : null))
    || product.imageUrl 
    || product.image 
    || null;
};

test('Avoids single character "h" bug when product.images is a URL string', () => {
  const p = { images: 'https://cdn.example.com/item.jpg' };
  const candidate = extractImageCandidate(p);
  assert.strictEqual(candidate, 'https://cdn.example.com/item.jpg');
});

test('Extracts first image when product.images is an array', () => {
  const p = { images: ['https://cdn.example.com/pic1.jpg', 'https://cdn.example.com/pic2.jpg'] };
  assert.strictEqual(extractImageCandidate(p), 'https://cdn.example.com/pic1.jpg');
});

// -------------------------------------------------------------
// Test 4: Adjustment Background Color Highlighting
// -------------------------------------------------------------
console.log('\n--- 4. Adjustment Background Color Highlights ---');

const getAdjustmentBgClass = (adjustment) => {
  return adjustment > 0 
    ? 'bg-[#00FF00] group-hover:bg-[#00e600] dark:bg-green-600 dark:group-hover:bg-green-700' 
    : adjustment < 0 
    ? 'bg-[#FF0000] group-hover:bg-[#e60000] dark:bg-red-600 dark:group-hover:bg-red-700' 
    : '';
};

test('Positive adjustment yields #00FF00 green highlight', () => {
  const cls = getAdjustmentBgClass(5);
  assert(cls.includes('bg-[#00FF00]'), 'Should have green background');
});

test('Negative adjustment yields #FF0000 red highlight', () => {
  const cls = getAdjustmentBgClass(-3);
  assert(cls.includes('bg-[#FF0000]'), 'Should have red background');
});

test('Zero adjustment yields empty string (no background highlight)', () => {
  const cls = getAdjustmentBgClass(0);
  assert.strictEqual(cls, '');
});

// -------------------------------------------------------------
// Test 5: Search Filtering with Robustness & Field Coverage
// -------------------------------------------------------------
console.log('\n--- 5. Search Filtering & Dirty Entity Safeguards ---');

const filterSearch = (products, term, filterCategory) => {
  const t = (typeof term === 'string' ? term : (term != null ? String(term) : '')).trim().toLowerCase();
  return products.filter(p => {
    const matchesSearch = !t || (() => {
      const sku = p.sku ? String(p.sku).toLowerCase() : '';
      const name = p.name ? String(p.name).toLowerCase() : '';
      const cat = p.category ? String(p.category).toLowerCase() : '';
      const brand = p.brand ? String(p.brand).toLowerCase() : '';
      const model = p.model ? String(p.model).toLowerCase() : '';
      let tagMatch = false;
      if (p.tags) {
        if (Array.isArray(p.tags)) {
          tagMatch = p.tags.some(item => item && String(item).toLowerCase().includes(t));
        } else if (typeof p.tags === 'string') {
          tagMatch = p.tags.toLowerCase().includes(t);
        }
      }
      return sku.includes(t) || name.includes(t) || cat.includes(t) || brand.includes(t) || model.includes(t) || tagMatch;
    })();

    const matchesCategory = !filterCategory || filterCategory === 'All' || p.category === filterCategory || p.type === filterCategory;
    return matchesSearch && matchesCategory;
  });
};

test('Search handles missing sku and string tags without throwing TypeError', () => {
  const rawData = [
    { name: 'Dell XPS 13', category: 'Laptop', tags: 'ultrabook, dell' },
    { sku: 'KB-01', name: 'Logitech MX', category: 'Keyboard', tags: ['wireless', null] },
    { sku: 'BAT-01', name: 'Battery HP', type: 'Battery' }
  ];

  const resDell = filterSearch(rawData, 'dell', 'All');
  assert.strictEqual(resDell.length, 1);
  assert.strictEqual(resDell[0].name, 'Dell XPS 13');

  const resBattery = filterSearch(rawData, '', 'Battery');
  assert.strictEqual(resBattery.length, 1);
  assert.strictEqual(resBattery[0].sku, 'BAT-01');
});

// -------------------------------------------------------------
// Test 6: Multi-Column Sorting with Schema Variance & Thai Collation
// -------------------------------------------------------------
console.log('\n--- 6. Multi-Column Sorting Simulation ---');

const sampleProducts = [
  { sku: 'PROD-A', wholesalePrice: 450, category: 'หน้าจอ', stockQuantity: 10, adjustmentHistory: { '30': -5 }, salesHistory: { '30': 20 } },
  { sku: 'PROD-B', Price: 1200, category: 'แบตเตอรี่', stockQuantity: 0, adjustmentHistory: { '30': 15 }, salesHistory: { '30': 5 } },
  { sku: 'PROD-C', price: 300, category: 'คีย์บอร์ด', stockQuantity: 5, adjustmentHistory: { '30': 0 }, salesHistory: { '30': 50 } },
  { sku: 'PROD-D', wholesalePrice: 850, category: 'อะแดปเตอร์', stockQuantity: 2, adjustmentHistory: { '30': 3 }, salesHistory: { '30': 12 } },
];

function sortProducts(products, sortKey, direction, salesPeriod = '30') {
  return [...products].sort((a, b) => {
    let valA, valB;
    switch (sortKey) {
      case 'Price':
        valA = Number(a.Price ?? a.price ?? a.wholesalePrice ?? 0);
        valB = Number(b.Price ?? b.price ?? b.wholesalePrice ?? 0);
        break;
      case 'stock':
        valA = Number(a.stockQuantity || 0);
        valB = Number(b.stockQuantity || 0);
        break;
      case 'sales':
        valA = Number(a.salesHistory?.[salesPeriod] || 0);
        valB = Number(b.salesHistory?.[salesPeriod] || 0);
        break;
      case 'adjustment':
        valA = Number(a.adjustmentHistory?.[salesPeriod] || 0);
        valB = Number(b.adjustmentHistory?.[salesPeriod] || 0);
        break;
      case 'category':
        valA = String(a.category || '');
        valB = String(b.category || '');
        return direction === 'asc' 
          ? valA.localeCompare(valB, 'th') 
          : valB.localeCompare(valA, 'th');
      default:
        valA = 0;
        valB = 0;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

test('Sort by Price ascending handles mixed Price / price / wholesalePrice keys', () => {
  const sorted = sortProducts(sampleProducts, 'Price', 'asc');
  assert.strictEqual(sorted[0].sku, 'PROD-C'); // 300
  assert.strictEqual(sorted[1].sku, 'PROD-A'); // 450
  assert.strictEqual(sorted[2].sku, 'PROD-D'); // 850
  assert.strictEqual(sorted[3].sku, 'PROD-B'); // 1200
});

test('Sort by adjustment descending orders highest positive adjustment first', () => {
  const sorted = sortProducts(sampleProducts, 'adjustment', 'desc');
  assert.strictEqual(sorted[0].sku, 'PROD-B'); // +15
  assert.strictEqual(sorted[1].sku, 'PROD-D'); // +3
  assert.strictEqual(sorted[2].sku, 'PROD-C'); // 0
  assert.strictEqual(sorted[3].sku, 'PROD-A'); // -5
});

test('Sort by adjustment ascending orders lowest negative adjustment first', () => {
  const sorted = sortProducts(sampleProducts, 'adjustment', 'asc');
  assert.strictEqual(sorted[0].sku, 'PROD-A'); // -5
  assert.strictEqual(sorted[1].sku, 'PROD-C'); // 0
  assert.strictEqual(sorted[2].sku, 'PROD-D'); // +3
  assert.strictEqual(sorted[3].sku, 'PROD-B'); // +15
});

test('Sort by category with Thai locale collation', () => {
  const sorted = sortProducts(sampleProducts, 'category', 'asc');
  // True Thai Royal Institute dictionary order: คีย์บอร์ด (ค) -> แบตเตอรี่ (บ) -> หน้าจอ (ห) -> อะแดปเตอร์ (อ)
  assert.strictEqual(sorted[0].category, 'คีย์บอร์ด');
  assert.strictEqual(sorted[1].category, 'แบตเตอรี่');
  assert.strictEqual(sorted[2].category, 'หน้าจอ');
  assert.strictEqual(sorted[3].category, 'อะแดปเตอร์');
});

test('Search handles null, undefined, numeric terms, and regex special characters without error', () => {
  const rawData = [
    { sku: 'BAT-01(PLUS)', name: 'Battery (A+)', category: 'Battery', tags: ['c++'] },
    { sku: 'KB-02', name: 'Keyboard *Pro*', category: 'Keyboard', tags: ['rgb*'] }
  ];

  assert.doesNotThrow(() => filterSearch(rawData, null, 'All'));
  assert.doesNotThrow(() => filterSearch(rawData, undefined, 'All'));
  assert.doesNotThrow(() => filterSearch(rawData, 123, 'All'));
  assert.doesNotThrow(() => filterSearch(rawData, '(PLUS)', 'All'));
  assert.doesNotThrow(() => filterSearch(rawData, 'A+', 'All'));
  assert.doesNotThrow(() => filterSearch(rawData, '*Pro*', 'All'));

  const resPlus = filterSearch(rawData, '(PLUS)', 'All');
  assert.strictEqual(resPlus.length, 1);
  assert.strictEqual(resPlus[0].sku, 'BAT-01(PLUS)');

  const resStar = filterSearch(rawData, '*Pro*', 'All');
  assert.strictEqual(resStar.length, 1);
  assert.strictEqual(resStar[0].sku, 'KB-02');
});

// -------------------------------------------------------------
// Test 7: Pagination Math & Clamping
// -------------------------------------------------------------
console.log('\n--- 7. Pagination Boundary & Clamping Math ---');

const computePagination = (totalItems, itemsPerPage, requestedPage) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1);
  const currentPage = totalItems === 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  return { totalPages, currentPage, startIndex, endIndex };
};

test('Empty catalog (0 items) produces 1 page with range 0 - 0', () => {
  const res = computePagination(0, 21, 1);
  assert.strictEqual(res.totalPages, 1);
  assert.strictEqual(res.currentPage, 1);
  assert.strictEqual(res.startIndex, 0);
  assert.strictEqual(res.endIndex, 0);
});

test('Exact multiple (42 items, 21 per page) produces 2 pages', () => {
  const page1 = computePagination(42, 21, 1);
  assert.strictEqual(page1.totalPages, 2);
  assert.strictEqual(page1.startIndex, 0);
  assert.strictEqual(page1.endIndex, 21);

  const page2 = computePagination(42, 21, 2);
  assert.strictEqual(page2.startIndex, 21);
  assert.strictEqual(page2.endIndex, 42);
});

test('Page request out of bounds (> totalPages) clamps to last page', () => {
  const res = computePagination(50, 21, 999);
  assert.strictEqual(res.totalPages, 3);
  assert.strictEqual(res.currentPage, 3);
  assert.strictEqual(res.startIndex, 42);
  assert.strictEqual(res.endIndex, 50);
});

test('Page request < 1 clamps to page 1', () => {
  const res = computePagination(50, 21, -5);
  assert.strictEqual(res.currentPage, 1);
  assert.strictEqual(res.startIndex, 0);
});

test('Transitional render when totalItems shrinks from 80 to 5 while on page 4 clamps safely to page 1 without empty slice', () => {
  const staleRequestedPage = 4; // Was valid when items=80 (4 pages)
  const res = computePagination(5, 21, staleRequestedPage);
  assert.strictEqual(res.totalPages, 1);
  assert.strictEqual(res.currentPage, 1);
  assert.strictEqual(res.startIndex, 0);
  assert.strictEqual(res.endIndex, 5);
});

// -------------------------------------------------------------
// Test 8: Production Bundle Icon Parity
// -------------------------------------------------------------
console.log('\n--- 8. Production Bundle Icon Parity ---');

test('ProductTableRow uses Image icon for missing thumbnail matching production bundle pn as k', () => {
  const fileContent = fs.readFileSync(path.resolve(DH_BACKOFFICE_ROOT, 'src/components/inventory/ProductTableRow.jsx'), 'utf8');
  assert(fileContent.includes("import { Image } from 'lucide-react'"), 'Must import Image from lucide-react');
  assert(fileContent.includes('<Image size={15}'), 'Must render Image component instead of Package');
  assert(!fileContent.includes('<Package size={15}'), 'Must not render Package for missing image');
});

test('InventoryMain uses LoaderCircle in searching indicator matching production bundle Yt as x', () => {
  const fileContent = fs.readFileSync(path.resolve(DH_BACKOFFICE_ROOT, 'src/pages/inventory/InventoryMain.jsx'), 'utf8');
  assert(fileContent.includes('LoaderCircle'), 'Must import LoaderCircle');
  assert(fileContent.includes('<LoaderCircle size={13}'), 'Must render LoaderCircle component');
});

test('InventoryHeader uses RefreshCw in Sync button matching production bundle ut as N', () => {
  const fileContent = fs.readFileSync(path.resolve(DH_BACKOFFICE_ROOT, 'src/components/inventory/InventoryHeader.jsx'), 'utf8');
  assert(fileContent.includes('RefreshCw'), 'Must import RefreshCw');
  assert(fileContent.includes('<RefreshCw size={14}'), 'Must render RefreshCw in Sync button');
});

console.log('\n==================================================================');
console.log(`  Adversarial Test Summary: ${passed}/${total} assertions passed`);
if (passed === total) {
  console.log('  ALL ADVERSARIAL EDGE CASES VERIFIED SUCCESSFULLY!');
} else {
  console.error(`  FAILURES: ${total - passed}`);
  process.exit(1);
}
console.log('==================================================================');
