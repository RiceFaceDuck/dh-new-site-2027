import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('🧪 Verifying Storefront & Table Thumbnail No-Referrer');
console.log('======================================================\n');

// 1. Check ProductImageSection.jsx
const productSectionPath = path.resolve(__dirname, '../../dh-frontend/src/components/product/ProductImageSection.jsx');
assert.ok(fs.existsSync(productSectionPath), 'ProductImageSection.jsx must exist');
const productSectionContent = fs.readFileSync(productSectionPath, 'utf8');
assert.ok(productSectionContent.includes('referrerPolicy="no-referrer"'), 'ProductImageSection.jsx thumbnail must have referrerPolicy="no-referrer"');
console.log('✅ 1. ProductImageSection.jsx thumbnail verified with referrerPolicy="no-referrer"');

// 2. Check ImageZoomModal.jsx
const zoomModalPath = path.resolve(__dirname, '../../dh-frontend/src/components/product/ImageZoomModal.jsx');
assert.ok(fs.existsSync(zoomModalPath), 'ImageZoomModal.jsx must exist');
const zoomModalContent = fs.readFileSync(zoomModalPath, 'utf8');
const zoomOccurrences = (zoomModalContent.match(/referrerPolicy="no-referrer"/g) || []).length;
assert.ok(zoomOccurrences >= 2, `ImageZoomModal.jsx must have referrerPolicy on both main and thumbnail images (found ${zoomOccurrences})`);
console.log(`✅ 2. ImageZoomModal.jsx verified (${zoomOccurrences} image tags protected)`);

// 3. Check CartItemCard.jsx
const cartItemPath = path.resolve(__dirname, '../../dh-frontend/src/components/cart/CartItemCard.jsx');
assert.ok(fs.existsSync(cartItemPath), 'CartItemCard.jsx must exist');
const cartItemContent = fs.readFileSync(cartItemPath, 'utf8');
assert.ok(cartItemContent.includes('referrerPolicy="no-referrer"'), 'CartItemCard.jsx must have referrerPolicy="no-referrer"');
console.log('✅ 3. CartItemCard.jsx verified with referrerPolicy="no-referrer"');

// 4. Check CheckoutSummaryItems.jsx
const checkoutPath = path.resolve(__dirname, '../../dh-frontend/src/components/checkout/summary/CheckoutSummaryItems.jsx');
assert.ok(fs.existsSync(checkoutPath), 'CheckoutSummaryItems.jsx must exist');
const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
assert.ok(checkoutContent.includes('referrerPolicy="no-referrer"'), 'CheckoutSummaryItems.jsx must have referrerPolicy="no-referrer"');
console.log('✅ 4. CheckoutSummaryItems.jsx verified with referrerPolicy="no-referrer"');

// 5. Check ProductTableRow.jsx
const tableRowPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/inventory/ProductTableRow.jsx');
assert.ok(fs.existsSync(tableRowPath), 'ProductTableRow.jsx must exist');
const tableRowContent = fs.readFileSync(tableRowPath, 'utf8');
assert.ok(tableRowContent.includes('referrerPolicy="no-referrer"'), 'ProductTableRow.jsx thumbnail must have referrerPolicy="no-referrer"');
console.log('✅ 5. ProductTableRow.jsx thumbnail verified with referrerPolicy="no-referrer"');

console.log('\n🎉 ALL STOREFRONT & INVENTORY THUMBNAIL CHECKS PASSED PERFECTLY!\n');
