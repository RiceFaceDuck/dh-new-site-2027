import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log("=== 🧪 Running Phase 4 UI & Receipt Fixes Verification ===\n");

// 1. Verify ReceiptItems.jsx line clamp styling
console.log("Test 1: Check ReceiptItems.jsx uses line-clamp-2 for A5 printing...");
const receiptItemsContent = fs.readFileSync(
    path.resolve('Management System/dh-backoffice-react/src/components/billing/pos/receipt/ReceiptItems.jsx'), 
    'utf-8'
);

assert.ok(
    receiptItemsContent.includes('line-clamp-2 break-words'),
    "FAIL: ReceiptItems.jsx does not use line-clamp-2 break-words"
);
assert.ok(
    !receiptItemsContent.includes('truncate whitespace-nowrap overflow-hidden text-ellipsis'),
    "FAIL: Old truncate whitespace-nowrap still present in ReceiptItems.jsx"
);
console.log("✅ Passed: ReceiptItems.jsx displays product names up to 2 lines without truncation.\n");

// 2. Verify PosSystem.jsx imports convertToThaiBahtText from dh-shared
console.log("Test 2: Check PosSystem.jsx imports convertToThaiBahtText from dh-shared...");
const posSystemContent = fs.readFileSync(
    path.resolve('Management System/dh-backoffice-react/src/components/billing/PosSystem.jsx'), 
    'utf-8'
);

assert.ok(
    posSystemContent.includes("import { convertToThaiBahtText } from 'dh-shared';"),
    "FAIL: PosSystem.jsx does not import convertToThaiBahtText from dh-shared"
);
assert.ok(
    !posSystemContent.includes("const convertToThaiBahtText = (number) => {"),
    "FAIL: Old local duplicate convertToThaiBahtText function still exists in PosSystem.jsx"
);
console.log("✅ Passed: PosSystem.jsx cleanly imports convertToThaiBahtText from dh-shared.\n");

// 3. Verify CartTableRow.jsx guards against negative row totals
console.log("Test 3: Check CartTableRow.jsx guards row totals with Math.max(0, ...)...");
const cartRowContent = fs.readFileSync(
    path.resolve('Management System/dh-backoffice-react/src/components/billing/pos/cart/CartTableRow.jsx'), 
    'utf-8'
);

assert.ok(
    cartRowContent.includes("Math.max(0, (Number(item.price) || 0) - (Number(item.discount) || 0))"),
    "FAIL: CartTableRow.jsx does not guard unit price minus discount with Math.max(0, ...)"
);
console.log("✅ Passed: CartTableRow.jsx prevents negative row totals.\n");

// 4. Test convertToThaiBahtText logic directly
console.log("Test 4: Verify convertToThaiBahtText behavior from dh-shared...");
import { pathToFileURL } from 'url';
const moduleUrl = pathToFileURL(path.resolve('Management System/dh-shared/src/utils/formatters/numberFormatter.js')).href;
const { convertToThaiBahtText } = await import(moduleUrl);

assert.strictEqual(convertToThaiBahtText(0), "ศูนย์บาทถ้วน");
assert.strictEqual(convertToThaiBahtText(150), "หนึ่งร้อยห้าสิบบาทถ้วน");
assert.strictEqual(convertToThaiBahtText(1234.50), "หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์");
assert.strictEqual(convertToThaiBahtText(-50), "ลบห้าสิบบาทถ้วน");
console.log("✅ Passed: convertToThaiBahtText accurately converts numbers, satang, and negative values.\n");

console.log("🎉 ALL PHASE 4 UI & RECEIPT VERIFICATION TESTS PASSED 100%! 🎉\n");
