import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');

const rowSrc = fs.readFileSync(path.join(root, 'dh-backoffice-react/src/components/inventory/ProductTableRow.jsx'), 'utf8');
const tableSrc = fs.readFileSync(path.join(root, 'dh-backoffice-react/src/components/inventory/ProductTable.jsx'), 'utf8');
const uploadSrc = fs.readFileSync(path.join(root, 'dh-backoffice-react/src/components/inventory/modal/ProductImageUpload.jsx'), 'utf8');

// 1. ProductTableRow: no /user-bg.jpg fallback, uses local ImageOff state & reports storage errors
assert(!rowSrc.includes('handleImageError'), 'ProductTableRow should not fallback to /user-bg.jpg via handleImageError');
assert(!rowSrc.includes('user-bg.jpg'), 'ProductTableRow must not reference user-bg.jpg');
assert(rowSrc.includes('ImageOff'), 'ProductTableRow must render ImageOff icon on broken images');
assert(rowSrc.includes('firebasestorage.googleapis.com'), 'ProductTableRow must detect Firebase Storage errors');
assert(rowSrc.includes('onStorageImageError'), 'ProductTableRow must report storage errors to ProductTable');

// 2. ProductTable: Storage Health Banner with threshold >= 5 and Calm UI (no animate-pulse)
assert(tableSrc.includes('STORAGE_ERROR_ALERT_THRESHOLD = 5'), 'ProductTable must define threshold = 5');
assert(tableSrc.includes('role="alert"'), 'ProductTable must render accessible alert banner');
assert(!tableSrc.includes('animate-pulse'), 'Storage Health Banner must obey Calm UI (no animate-pulse)');
assert(tableSrc.includes('onStorageImageError={handleStorageImageError}'), 'ProductTable must wire error handler to rows');

// 3. ProductImageUpload: zero external placehold.co dependency + local retry control
assert(!uploadSrc.includes('placehold.co'), 'ProductImageUpload must not depend on external placehold.co');
assert(uploadSrc.includes('ImageOff'), 'ProductImageUpload must show local ImageOff state');
assert(uploadSrc.includes('handleRetryImages'), 'ProductImageUpload must provide retry button');

console.log('✅ Phase 2 Verification PASSED (Zero /user-bg.jpg fallback, zero placehold.co, Storage Health Banner & Calm UI verified)');
