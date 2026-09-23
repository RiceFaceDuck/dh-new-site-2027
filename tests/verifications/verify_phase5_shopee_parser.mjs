import assert from 'node:assert';
import * as XLSX from '../../dh-backoffice-react/node_modules/xlsx/xlsx.mjs';

function detectHeaderLayout(ws, range, maxRows = 25) {
  const endRow = Math.min(range.e.r, maxRows - 1);
  let bestHeaderRow = -1;
  let maxMatches = 0;
  let detectedCols = { skuCol: -1, stockCol: -1, priceCol: -1 };

  const skuKeywords = ['เลข sku', 'รหัส sku', 'sku', 'parent sku', 'variation sku', 'model sku', 'item sku'];
  const priceKeywords = ['ราคา', 'ราคาสินค้า', 'price', 'unit price', 'selling price', 'retail price', 'ราคาขาย'];
  const stockKeywords = ['จำนวนสต็อก', 'สต็อก', 'คลัง', 'จำนวนคลัง', 'stock', 'inventory', 'quantity', 'qty'];

  for (let r = range.s.r; r <= endRow; ++r) {
    let matches = 0;
    let tempCols = { skuCol: -1, stockCol: -1, priceCol: -1 };

    for (let c = range.s.c; c <= range.e.c; ++c) {
      const cellAddr = XLSX.utils.encode_cell({ c, r });
      const cell = ws[cellAddr];
      if (!cell || cell.v === undefined || cell.v === null) continue;

      const val = String(cell.v).trim().toLowerCase();
      if (!val) continue;

      if (tempCols.skuCol === -1 && skuKeywords.some(kw => val.includes(kw))) {
        tempCols.skuCol = c;
        matches++;
      } else if (tempCols.priceCol === -1 && priceKeywords.some(kw => val.includes(kw))) {
        tempCols.priceCol = c;
        matches++;
      } else if (tempCols.stockCol === -1 && stockKeywords.some(kw => val.includes(kw))) {
        tempCols.stockCol = c;
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestHeaderRow = r;
      detectedCols = { ...tempCols };
    }
  }

  if (bestHeaderRow !== -1 && (detectedCols.skuCol === -1 || detectedCols.priceCol === -1 || detectedCols.stockCol === -1)) {
    const neighborRows = [bestHeaderRow - 1, bestHeaderRow + 1].filter(r => r >= range.s.r && r <= endRow);
    for (const nr of neighborRows) {
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellAddr = XLSX.utils.encode_cell({ c, r: nr });
        const cell = ws[cellAddr];
        if (!cell || cell.v === undefined || cell.v === null) continue;

        const val = String(cell.v).trim().toLowerCase();
        if (!val) continue;

        if (detectedCols.skuCol === -1 && skuKeywords.some(kw => val.includes(kw))) {
          detectedCols.skuCol = c;
        }
        if (detectedCols.priceCol === -1 && priceKeywords.some(kw => val.includes(kw))) {
          detectedCols.priceCol = c;
        }
        if (detectedCols.stockCol === -1 && stockKeywords.some(kw => val.includes(kw))) {
          detectedCols.stockCol = c;
        }
      }
    }
  }

  const finalHeaderRow = bestHeaderRow >= 0 ? bestHeaderRow : 1;
  const skuCol = detectedCols.skuCol >= 0 ? detectedCols.skuCol : 5;
  const stockCol = detectedCols.stockCol >= 0 ? detectedCols.stockCol : 6;
  const priceCol = detectedCols.priceCol >= 0 ? detectedCols.priceCol : 7;
  const dataStartRow = finalHeaderRow + 1;

  return {
    headerRow: finalHeaderRow,
    dataStartRow,
    skuCol,
    stockCol,
    priceCol
  };
}

// ==========================================
// TEST SUITE: PHASE 5 SHOPEE TEMPLATE PARSER
// ==========================================
console.log('--- STARTING VERIFICATION: PHASE 5 SHOPEE PARSER ---');

// Test 1: Multi-row header with instructions at row 0, category at row 1, headers at row 2
const wsData = [
  ['ข้อความเตือน: ห้ามลบคอลัมน์หรือสลับตำแหน่ง', '', '', '', '', '', '', ''],
  ['ข้อมูลพื้นฐาน', '', '', '', 'ข้อมูลการขาย', '', ''],
  ['Item ID', 'ชื่อสินค้า', 'ตัวเลือก', 'รหัสสินค้า', 'เลข SKU', 'คลัง', 'ราคา', 'สถานะ'],
  ['1001', 'Asus Gaming', 'ดำ', 'ASUS-01', 'NB-ASUS-ROG', 5, 35900, 'ปกติ'],
  ['1002', 'Acer Aspire', 'เงิน', 'ACER-02', 'nb-acer-asp', 12, 18900, 'ปกติ']
];

const ws = XLSX.utils.aoa_to_sheet(wsData);
const range = XLSX.utils.decode_range(ws['!ref']);
const layout = detectHeaderLayout(ws, range, 25);

assert.strictEqual(layout.headerRow, 2, 'Should accurately detect row 2 as primary header row');
assert.strictEqual(layout.dataStartRow, 3, 'Data rows must start at row 3');
assert.strictEqual(layout.skuCol, 4, 'SKU column detected at index 4 (col E)');
assert.strictEqual(layout.stockCol, 5, 'Stock column detected at index 5 (col F)');
assert.strictEqual(layout.priceCol, 6, 'Price column detected at index 6 (col G)');
console.log('✅ Test 1 Passed: 3-tier multi-row header layout detected accurately');

// Test 2: Satang rounding and case-insensitive SKU matching simulation
const inventoryMap = new Map();
inventoryMap.set('NB-ASUS-ROG', { sku: 'NB-ASUS-ROG', stockQuantity: 9, price: 34990.556 });
inventoryMap.set('NB-ACER-ASP', { sku: 'NB-ACER-ASP', stockQuantity: 15, price: 17500 });

let updatedCount = 0;
for (let R = layout.dataStartRow; R <= range.e.r; ++R) {
  const skuCell = ws[XLSX.utils.encode_cell({ c: layout.skuCol, r: R })];
  const skuStr = String(skuCell.v).trim().toUpperCase();
  const item = inventoryMap.get(skuStr);
  if (item) {
    const stockCell = XLSX.utils.encode_cell({ c: layout.stockCol, r: R });
    ws[stockCell] = { v: item.stockQuantity, t: 'n' };

    const priceCell = XLSX.utils.encode_cell({ c: layout.priceCol, r: R });
    const roundedPrice = Math.round(item.price * 100) / 100;
    ws[priceCell] = { v: roundedPrice, t: 'n' };
    updatedCount++;
  }
}

assert.strictEqual(updatedCount, 2, 'Must match and update both items including lowercase SKU');
const rogPriceCell = ws[XLSX.utils.encode_cell({ c: layout.priceCol, r: 3 })];
assert.strictEqual(rogPriceCell.v, 34990.56, 'Price 34990.556 must be rounded to 34990.56 (Satang precision)');

const rogStockCell = ws[XLSX.utils.encode_cell({ c: layout.stockCol, r: 3 })];
assert.strictEqual(rogStockCell.v, 9, 'Stock must be updated to 9');
console.log('✅ Test 2 Passed: Satang rounding and case-insensitive matching verified');

console.log('--- ALL PHASE 5 SHOPEE PARSER VERIFICATIONS PASSED (100%) ---');
