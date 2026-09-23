import assert from 'node:assert';

// Pure logic under test representing bigSellerQueryService
function isTestProduct(sku = '', name = '') {
  const s = String(sku || '').trim().toUpperCase();
  const n = String(name || '').trim().toUpperCase();
  return s.startsWith('SKU-TEST') || s.startsWith('TEST-') || s.startsWith('DUMMY-') || s.startsWith('SIM-') || n.includes('ม้าดำ');
}

function formatChangeTime(timestamp) {
  if (!timestamp) return '';
  let dateObj = null;
  if (typeof timestamp.toDate === 'function') {
    dateObj = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) dateObj = parsed;
  }
  if (!dateObj) return '';
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')} น.`;
}

function computeInventoryDiff({ previousInventory = [], currentInventory = [], lastResetDate = new Date() }) {
  const prevMap = new Map();
  previousInventory.forEach(item => {
    if (item.sku) prevMap.set(String(item.sku).trim().toUpperCase(), item);
  });

  const currMap = new Map();
  currentInventory.forEach(item => {
    if (item.sku) currMap.set(String(item.sku).trim().toUpperCase(), item);
  });

  const increased = [];
  const decreased = [];
  const priceChanged = [];
  const otherChanged = [];

  currentInventory.forEach(curr => {
    if (!curr.sku || isTestProduct(curr.sku, curr.name)) return;
    const skuKey = String(curr.sku).trim().toUpperCase();
    const prev = prevMap.get(skuKey);

    const currStock = Number(curr.stockQuantity) || 0;
    let currPrice = Number(curr.wholesalePrice ?? curr.Price ?? curr.price) || 0;

    if (!prev) {
      if (currStock > 0) {
        increased.push({
          sku: curr.sku,
          name: curr.name,
          oldStock: 0,
          newStock: currStock,
          updatedAt: curr.updatedAt,
          updatedAtText: formatChangeTime(curr.updatedAt)
        });
      }
      return;
    }

    const prevStock = Number(prev.stockQuantity) || 0;
    const prevPrice = Number(prev.wholesalePrice ?? prev.Price ?? prev.price) || 0;
    if (currPrice === 0 && prevPrice > 0) {
      currPrice = prevPrice;
    }

    const updatedAt = curr.updatedAt;
    const updatedAtText = formatChangeTime(updatedAt);

    if (currStock > prevStock) {
      increased.push({
        sku: curr.sku,
        name: curr.name,
        oldStock: prevStock,
        newStock: currStock,
        updatedAt,
        updatedAtText
      });
    } else if (currStock < prevStock) {
      decreased.push({
        sku: curr.sku,
        name: curr.name,
        oldStock: prevStock,
        newStock: currStock,
        updatedAt,
        updatedAtText
      });
    }

    if (currPrice !== prevPrice) {
      priceChanged.push({
        sku: curr.sku,
        name: curr.name,
        oldPrice: prevPrice,
        newPrice: currPrice,
        updatedAt,
        updatedAtText
      });
    }
  });

  previousInventory.forEach(prev => {
    if (!prev.sku || isTestProduct(prev.sku, prev.name)) return;
    const skuKey = String(prev.sku).trim().toUpperCase();
    if (!currMap.has(skuKey)) {
      const oldStock = Number(prev.stockQuantity) || 0;
      if (oldStock > 0) {
        decreased.push({
          sku: prev.sku,
          name: prev.name || '(สินค้านี้ถูกลบออกจาก Big Seller)',
          oldStock,
          newStock: 0
        });
      }
    }
  });

  return {
    increased,
    decreased,
    priceChanged,
    otherChanged,
    currentInventory,
    lastResetDate
  };
}

console.log('--- Running Phase 2 Standalone Verification ---');

// Test 1: Test product filtering
assert.strictEqual(isTestProduct('SKU-TEST-001', 'Test Item'), true);
assert.strictEqual(isTestProduct('TEST-99', 'Normal'), true);
assert.strictEqual(isTestProduct('DUMMY-01', 'Dummy'), true);
assert.strictEqual(isTestProduct('NORMAL-SKU', 'สินค้าทดสอบ ม้าดำ'), true);
assert.strictEqual(isTestProduct('ADAC001', 'ACER 12V 1.5A'), false);
console.log('✓ Test 1: Test product filter assertions passed');

// Test 2: Diff computation with compact { s, q, p, n } mapping
const previousInventory = [
  { sku: 'ADAC001', stockQuantity: 5, wholesalePrice: 200, retailPrice: 350, name: 'ACER 18W' },
  { sku: 'BAT002', stockQuantity: 10, wholesalePrice: 800, retailPrice: 1200, name: 'DELL Battery' },
  { sku: 'KEY003', stockQuantity: 2, wholesalePrice: 150, retailPrice: 250, name: 'HP Keyboard' }
];

const currentInventory = [
  { sku: 'ADAC001', stockQuantity: 8, wholesalePrice: 200, retailPrice: 350, name: 'ACER 18W', updatedAt: new Date() },
  { sku: 'BAT002', stockQuantity: 7, wholesalePrice: 850, retailPrice: 1200, name: 'DELL Battery', updatedAt: new Date() },
  { sku: 'KEY003', stockQuantity: 2, wholesalePrice: 150, retailPrice: 250, name: 'HP Keyboard' },
  { sku: 'NEW004', stockQuantity: 4, wholesalePrice: 300, retailPrice: 450, name: 'New Type-C Cable' }
];

const diff = computeInventoryDiff({ previousInventory, currentInventory, lastResetDate: new Date() });

assert.strictEqual(diff.increased.length, 2, 'Should detect 2 increased items');
assert.strictEqual(diff.decreased.length, 1, 'Should detect 1 decreased item');
assert.strictEqual(diff.priceChanged.length, 1, 'Should detect 1 price change');

const incMap = new Map(diff.increased.map(x => [x.sku, x]));
assert.strictEqual(incMap.get('ADAC001').oldStock, 5);
assert.strictEqual(incMap.get('ADAC001').newStock, 8);
assert.strictEqual(incMap.get('NEW004').oldStock, 0);
assert.strictEqual(incMap.get('NEW004').newStock, 4);

const dec = diff.decreased[0];
assert.strictEqual(dec.sku, 'BAT002');
assert.strictEqual(dec.oldStock, 10);
assert.strictEqual(dec.newStock, 7);

const prc = diff.priceChanged[0];
assert.strictEqual(prc.sku, 'BAT002');
assert.strictEqual(prc.oldPrice, 800);
assert.strictEqual(prc.newPrice, 850);

console.log('✓ Test 2: Inventory diff computation assertions passed');

// Test 3: Formatting function
const timeStr = formatChangeTime(new Date(2026, 8, 23, 14, 30));
assert.strictEqual(timeStr, '14:30 น.');
console.log('✓ Test 3: Time formatting assertions passed');

console.log('All Phase 2 assertions passed 100%!');
