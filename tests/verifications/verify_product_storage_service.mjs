import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🧪 Verifying Phase 1: Backoffice Storage Pipeline');
console.log('======================================================\n');

// 1. Check productStorageService methods and implementation
const servicePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/productStorageService.js');
assert.ok(fs.existsSync(servicePath), 'productStorageService.js must exist');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert.ok(serviceContent.includes('uploadProductImage'), 'Must export uploadProductImage method');
assert.ok(serviceContent.includes('compressProductImage'), 'Must export compressProductImage method');
assert.ok(serviceContent.includes('deleteProductImage'), 'Must export deleteProductImage method');
assert.ok(serviceContent.includes("maxSizeMB: 0.3"), 'Compression must enforce maxSizeMB: 0.3 (300KB)');
assert.ok(serviceContent.includes("maxWidthOrHeight: 1200"), 'Compression must enforce maxWidthOrHeight: 1200');
assert.ok(serviceContent.includes("fileType: 'image/webp'"), 'Compression must enforce WebP output');
assert.ok(serviceContent.includes('firebase/storage'), 'Must use authentic Firebase Storage SDK');
console.log('✅ 1. productStorageService structure and parameters verified');

// 2. Check useProductImageUpload hook
const hookPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/inventory/hooks/useProductImageUpload.js');
assert.ok(fs.existsSync(hookPath), 'useProductImageUpload.js hook must exist');
const hookContent = fs.readFileSync(hookPath, 'utf8');
assert.ok(hookContent.includes('productStorageService'), 'Hook must call productStorageService');
assert.ok(hookContent.includes('uploadProductImage'), 'Hook must call uploadProductImage');
assert.ok(hookContent.includes('removeImage'), 'Hook must export removeImage');
assert.ok(hookContent.includes('setCoverImage'), 'Hook must export setCoverImage');
assert.ok(hookContent.includes('toggleVisibility'), 'Hook must export toggleVisibility');
console.log('✅ 2. useProductImageUpload controller hook verified');

// 3. Check ProductImageUpload Pure UI component
const uiPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/inventory/modal/ProductImageUpload.jsx');
assert.ok(fs.existsSync(uiPath), 'ProductImageUpload.jsx must exist');
const uiContent = fs.readFileSync(uiPath, 'utf8');
assert.ok(!uiContent.includes('driveService'), 'ProductImageUpload must NOT import driveService');
assert.ok(uiContent.includes('useProductImageUpload'), 'ProductImageUpload must use useProductImageUpload hook');
assert.ok(uiContent.includes('referrerPolicy="no-referrer"'), 'ProductImageUpload must include referrerPolicy="no-referrer" on images');
assert.ok(uiContent.includes('rounded-[2px]'), 'Must respect 0.1 border radius invariant (rounded-[2px])');
console.log('✅ 3. ProductImageUpload component verified (Decoupled from GAS, no-referrer added)');

// 4. Test deleteProductImage safety guards via imported module
import('../../dh-backoffice-react/src/firebase/productStorageService.js').then(async ({ productStorageService }) => {
  const nullResult = await productStorageService.deleteProductImage(null);
  assert.strictEqual(nullResult, false, 'deleteProductImage(null) must safely return false');

  const emptyResult = await productStorageService.deleteProductImage('');
  assert.strictEqual(emptyResult, false, 'deleteProductImage("") must safely return false');

  const driveResult = await productStorageService.deleteProductImage('https://drive.google.com/thumbnail?id=123');
  assert.strictEqual(driveResult, false, 'deleteProductImage with Google Drive URL must safely return false without calling SDK');

  const externalResult = await productStorageService.deleteProductImage('https://placehold.co/100x100?text=Err');
  assert.strictEqual(externalResult, false, 'deleteProductImage with non-firebase URL must safely return false');

  console.log('✅ 4. deleteProductImage safety guards verified');
  console.log('\n🎉 ALL PHASE 1 CHECKS PASSED PERFECTLY!\n');
}).catch(err => {
  console.error('❌ Error during runtime test:', err);
  process.exit(1);
});
