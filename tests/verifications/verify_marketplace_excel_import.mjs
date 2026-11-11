import assert from 'assert';
import { 
  DEFAULT_COLUMN_MAPPINGS, 
  getColumnMappings, 
  getValueByAliases, 
  isHeaderMatching 
} from '../../dh-backoffice-react/src/components/inventory/import/columnMappingService.js';
import { detectRowChanges } from '../../dh-backoffice-react/src/components/inventory/import/excelDiffService.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Marketplace Excel Import Verification Suite...');

// 1. Verify EXPECTED_HEADERS in useExcelImport.js contains Marketplace columns
console.log('\n[Test 1] Checking EXPECTED_HEADERS in useExcelImport.js...');
const useExcelImportContent = fs.readFileSync(
  path.resolve('dh-backoffice-react/src/components/inventory/hooks/useExcelImport.js'),
  'utf-8'
);

assert(useExcelImportContent.includes("'Shopee'"), 'EXPECTED_HEADERS must include Shopee');
assert(useExcelImportContent.includes("'Lazada'"), 'EXPECTED_HEADERS must include Lazada');
assert(useExcelImportContent.includes("'TikTok'"), 'EXPECTED_HEADERS must include TikTok');
assert(useExcelImportContent.includes("'Facebook'"), 'EXPECTED_HEADERS must include Facebook');
console.log('✅ EXPECTED_HEADERS includes all 4 marketplace columns.');

// 2. Verify DEFAULT_COLUMN_MAPPINGS
console.log('\n[Test 2] Checking DEFAULT_COLUMN_MAPPINGS aliases...');
assert(DEFAULT_COLUMN_MAPPINGS.shopee.includes('Shopee'), 'shopee aliases missing Shopee');
assert(DEFAULT_COLUMN_MAPPINGS.shopee.includes('ลิงก์ Shopee'), 'shopee aliases missing ลิงก์ Shopee');
assert(DEFAULT_COLUMN_MAPPINGS.lazada.includes('Lazada'), 'lazada aliases missing Lazada');
assert(DEFAULT_COLUMN_MAPPINGS.tiktok.includes('TikTok'), 'tiktok aliases missing TikTok');
assert(DEFAULT_COLUMN_MAPPINGS.facebook.includes('Facebook'), 'facebook aliases missing Facebook');
console.log('✅ DEFAULT_COLUMN_MAPPINGS configured correctly.');

// 3. Test alias recognition with various user input headers
console.log('\n[Test 3] Testing flexible header recognition...');
const sampleRow = {
  'SKU': 'TEST-001',
  'ลิงก์ Shopee': 'https://s.shopee.co.th/test1',
  'LAZADA LINK': 'https://s.lazada.co.th/test2',
  'TikTok': 'https://shop.tiktok.com/test3',
  'FacebookUrl': 'https://facebook.com/test4'
};

const mappings = DEFAULT_COLUMN_MAPPINGS;
assert.strictEqual(getValueByAliases(sampleRow, mappings.shopee), 'https://s.shopee.co.th/test1');
assert.strictEqual(getValueByAliases(sampleRow, mappings.lazada), 'https://s.lazada.co.th/test2');
assert.strictEqual(getValueByAliases(sampleRow, mappings.tiktok), 'https://shop.tiktok.com/test3');
assert.strictEqual(getValueByAliases(sampleRow, mappings.facebook), 'https://facebook.com/test4');
console.log('✅ Flexible alias matching works accurately.');

// 4. Test detectRowChanges for externalLinks diffs
console.log('\n[Test 4] Testing detectRowChanges diff detection...');
const existingProduct = {
  sku: 'TEST-001',
  name: 'Existing Screen',
  stockQuantity: 10,
  externalLinks: {
    shopee: 'https://s.shopee.co.th/old',
    lazada: '',
    tiktok: '',
    facebook: 'https://facebook.com/old'
  }
};

const updatedItem = {
  sku: 'TEST-001',
  name: 'Existing Screen',
  stockQuantity: 10,
  externalLinks: {
    shopee: 'https://s.shopee.co.th/new',     // Changed
    lazada: 'https://s.lazada.co.th/brand-new', // Added
    tiktok: '',                                // Unchanged empty
    facebook: 'https://facebook.com/old'       // Unchanged identical
  }
};

const diffs = detectRowChanges(updatedItem, existingProduct);
console.log('Detected diffs:', diffs);

assert.strictEqual(diffs.length, 2, 'Should detect exactly 2 link changes (Shopee and Lazada)');
const shopeeDiff = diffs.find(d => d.field === 'Shopee');
assert(shopeeDiff, 'Shopee diff must exist');
assert.strictEqual(shopeeDiff.old, 'https://s.shopee.co.th/old');
assert.strictEqual(shopeeDiff.new, 'https://s.shopee.co.th/new');

const lazadaDiff = diffs.find(d => d.field === 'Lazada');
assert(lazadaDiff, 'Lazada diff must exist');
assert.strictEqual(lazadaDiff.old, '-');
assert.strictEqual(lazadaDiff.new, 'https://s.lazada.co.th/brand-new');
console.log('✅ Diff detection correctly identifies changed and newly added links.');

console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
