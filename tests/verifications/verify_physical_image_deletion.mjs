import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🧪 Verifying Phase 2: Physical Storage Deletion');
console.log('======================================================\n');

// 1. Check useProductImageUpload.js session deletion
const hookPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/inventory/hooks/useProductImageUpload.js');
assert.ok(fs.existsSync(hookPath), 'useProductImageUpload.js hook must exist');
const hookContent = fs.readFileSync(hookPath, 'utf8');
assert.ok(hookContent.includes('sessionUploadedUrls'), 'Hook must track sessionUploadedUrls');
assert.ok(hookContent.includes('productStorageService.deleteProductImage'), 'Hook must call deleteProductImage for session uploads');
console.log('✅ 1. useProductImageUpload session deletion logic verified');

// 2. Check useInventoryController.js onSave commit deletion
const controllerPath = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/inventory/useInventoryController.js');
assert.ok(fs.existsSync(controllerPath), 'useInventoryController.js must exist');
const controllerContent = fs.readFileSync(controllerPath, 'utf8');
assert.ok(controllerContent.includes('productStorageService.deleteProductImage'), 'useInventoryController must trigger deleteProductImage on removed images upon save');
assert.ok(controllerContent.includes('removedImages'), 'useInventoryController must compute diff of removed images');
console.log('✅ 2. useInventoryController save commit physical deletion verified');

// 3. Test runtime safety guards
import('../../dh-backoffice-react/src/firebase/productStorageService.js').then(async ({ productStorageService }) => {
  // Test Drive URL bypass
  const driveResult = await productStorageService.deleteProductImage('https://drive.google.com/thumbnail?id=1sFakW_3Xi6P-Xo46McO7Jes4L1JPyvYG&sz=w1000');
  assert.strictEqual(driveResult, false, 'Must safely skip Google Drive links');

  // Test external URL bypass
  const externalResult = await productStorageService.deleteProductImage('https://images.unsplash.com/photo-123');
  assert.strictEqual(externalResult, false, 'Must safely skip external links');

  console.log('✅ 3. Storage deletion safety guards verified');
  console.log('\n🎉 ALL PHASE 2 PHYSICAL DELETION CHECKS PASSED!\n');
}).catch(err => {
  console.error('❌ Error during runtime test:', err);
  process.exit(1);
});
