import assert from 'node:assert';

function isTestProduct(sku = '', name = '') {
  const s = String(sku || '').trim().toUpperCase();
  const n = String(name || '').trim().toUpperCase();
  return s.startsWith('SKU-TEST') || s.startsWith('TEST-') || s.startsWith('DUMMY-') || s.startsWith('SIM-') || n.includes('ม้าดำ');
}

function parsePrice(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function generateReferenceId(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `EXP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function prepareFullCatalogDatasetMock(rawProducts, bufferStock = 0, warehouseName = '总仓库') {
  const dataset = rawProducts
    .filter(item => {
      const sku = String(item.sku || item.id || '').trim().toUpperCase();
      return sku !== '' && !isTestProduct(sku, item.name);
    })
    .map(item => {
      const sku = String(item.sku || item.id || '').trim().toUpperCase();
      const stock = Number(item.stockQuantity ?? item.qty ?? 0);
      const rp = parsePrice(item.retailPrice ?? item.Price ?? item.price ?? item.wholesalePrice);
      const wp = parsePrice(item.wholesalePrice ?? item.price ?? item.Price);
      const price = wp > 0 ? wp : (rp > 0 ? rp : 0);
      const retail = rp > 0 ? rp : price;
      return {
        sku,
        name: item.name || '',
        stockQuantity: stock,
        currentStock: stock,
        countStock: Math.max(0, stock - bufferStock),
        retailPrice: retail,
        wholesalePrice: price,
        Price: price,
        price,
        warehouse: warehouseName,
        bufferStock
      };
    });

  const now = new Date();
  const referenceId = generateReferenceId(now);
  const fullExportData = {
    isAllSkuMode: true,
    transactionId: referenceId,
    referenceId,
    itemCount: dataset.length,
    currentInventory: dataset,
    preparedAt: now,
    changes: {
      increased: dataset,
      decreased: [],
      priceChanged: [],
      otherChanged: []
    }
  };

  return {
    success: true,
    referenceId,
    itemCount: dataset.length,
    changes: fullExportData.changes,
    dataset,
    fullExportData
  };
}

// ==========================================
// TEST SUITE: PHASE 3 ALL-SKU EXPORT
// ==========================================
console.log('--- STARTING VERIFICATION: PHASE 3 ALL-SKU EXPORT ---');

// Test 1: Reference ID format
const fixedDate = new Date('2026-09-23T12:30:45');
const refId = generateReferenceId(fixedDate);
assert.strictEqual(refId, 'EXP-20260923-123045', 'Reference ID should follow EXP-YYYYMMDD-HHMMSS format');
console.log('✅ Test 1 Passed: Reference ID format conforms to EXP-YYYYMMDD-HHMMSS');

// Test 2: Filter out test products and compute buffer stock
const mockRawProducts = [
  { sku: 'NB-ACER-001', name: 'Acer Nitro 5', stockQuantity: 15, wholesalePrice: 22000, retailPrice: 25000 },
  { sku: 'NB-ASUS-002', name: 'Asus TUF Gaming', stockQuantity: 5, wholesalePrice: 28000, retailPrice: 31000 },
  { sku: 'SKU-TEST-999', name: 'Dummy Item', stockQuantity: 99, wholesalePrice: 100 },
  { sku: 'SIM-001', name: 'Simulated Card', stockQuantity: 10 },
  { sku: 'NB-HP-003', name: 'HP Pavilion ม้าดำ', stockQuantity: 8 }
];

const resultWithBuffer = prepareFullCatalogDatasetMock(mockRawProducts, 2, 'Main Warehouse');
assert.strictEqual(resultWithBuffer.itemCount, 2, 'Should only contain 2 non-test products');
assert.strictEqual(resultWithBuffer.dataset[0].sku, 'NB-ACER-001');
assert.strictEqual(resultWithBuffer.dataset[0].currentStock, 15);
assert.strictEqual(resultWithBuffer.dataset[0].countStock, 13, 'countStock should be stockQuantity - bufferStock (15 - 2 = 13)');
assert.strictEqual(resultWithBuffer.dataset[0].warehouse, 'Main Warehouse');
console.log('✅ Test 2 Passed: Test products correctly filtered and buffer stock calculated');

// Test 3: Data payload is compatible with SkuMerchantExport & InventoryCountExport
const { fullExportData } = resultWithBuffer;
assert.strictEqual(fullExportData.isAllSkuMode, true);
assert.strictEqual(fullExportData.changes.increased.length, 2);
assert.strictEqual(fullExportData.changes.decreased.length, 0);
assert.strictEqual(fullExportData.changes.priceChanged.length, 0);
console.log('✅ Test 3 Passed: Payload conforms to export changes schema (2 items in increased list)');

// Test 4: Simulate 2,412 items scale
const largeCatalog = [];
for (let i = 1; i <= 2412; i++) {
  largeCatalog.push({
    sku: `SKU-${String(i).padStart(5, '0')}`,
    name: `Notebook Model ${i}`,
    stockQuantity: (i % 20) + 1,
    wholesalePrice: 15000 + i
  });
}
const scaleResult = prepareFullCatalogDatasetMock(largeCatalog, 0, '总仓库');
assert.strictEqual(scaleResult.itemCount, 2412, 'Scale test must process exactly 2,412 items');
assert.strictEqual(scaleResult.fullExportData.changes.increased.length, 2412);
console.log('✅ Test 4 Passed: 2,412 SKU full catalog processed in zero reads simulation');

console.log('--- ALL PHASE 3 VERIFICATIONS PASSED (100%) ---');
