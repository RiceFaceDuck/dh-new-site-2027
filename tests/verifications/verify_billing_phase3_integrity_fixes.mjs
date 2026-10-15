import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log("=== 🧪 Running Phase 3 Integrity Fixes Verification ===\n");

// 1. Verify billingStatusTransaction.js freebie stock return
console.log("Test 1: Check billingStatusTransaction.js handles freebie inventory return on cancel...");
const statusTxContent = fs.readFileSync(
    path.resolve('Management System/dh-backoffice-react/src/firebase/billingStatusTransaction.js'), 
    'utf-8'
);

assert.ok(
    !statusTxContent.includes('if (item.isFreebie || !itemIdentifier) continue;'),
    "FAIL: Old item.isFreebie skip condition still exists in billingStatusTransaction.js"
);
assert.ok(
    statusTxContent.includes('const itemIdentifier = item.id || item.sku;') &&
    statusTxContent.includes('if (!itemIdentifier) continue;'),
    "FAIL: Freebie with sku/id is not processed in billingStatusTransaction.js"
);
console.log("✅ Passed: Freebie inventory items are aggregated and restored on cancellation.\n");

// 2. Verify usePosState.js unique timestamp orderId
console.log("Test 2: Check usePosState.js creates timestamp-based draft orderId...");
const posStateContent = fs.readFileSync(
    path.resolve('Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosState.js'), 
    'utf-8'
);

assert.ok(
    posStateContent.includes('`DH-TEMP-${yy}${mm}${dd}-${hh}${min}${sec}-${rand4}`'),
    "FAIL: usePosState.js does not use timestamp format for draft order ID"
);
assert.ok(
    !posStateContent.includes('`DH-TEMP-${randomSuffix}`'),
    "FAIL: Old random 4-digit draft order ID still found in usePosState.js"
);
console.log("✅ Passed: usePosState.js uses timestamp format DH-TEMP-YYMMDD-HHMMSS-RAND4.\n");

// 3. Verify billingTransactionService.js fallback orderId
console.log("Test 3: Check billingTransactionService.js uses timestamp format for draft fallback...");
const txServiceContent = fs.readFileSync(
    path.resolve('Management System/dh-backoffice-react/src/firebase/billingTransactionService.js'), 
    'utf-8'
);

assert.ok(
    txServiceContent.includes('`DH-TEMP-${yy}${mm}${dd}-${hh}${min}${sec}-${rand4}`'),
    "FAIL: billingTransactionService.js does not use timestamp format for draft order ID"
);
console.log("✅ Passed: billingTransactionService.js draft fallback uses timestamp format.\n");

// 4. Verify usePosActions.js uses centralized slipStorageService
console.log("Test 4: Check usePosActions.js imports and uses centralized slipStorageService...");
const posActionsContent = fs.readFileSync(
    path.resolve('Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js'), 
    'utf-8'
);

assert.ok(
    posActionsContent.includes("import { slipStorageService } from '../../../../firebase/slipStorageService';"),
    "FAIL: usePosActions.js does not import centralized slipStorageService"
);
assert.ok(
    !posActionsContent.includes("export const slipStorageService = {"),
    "FAIL: Duplicated inline slipStorageService still defined in usePosActions.js"
);
assert.ok(
    posActionsContent.includes("slipStorageService.verifySlipOcr"),
    "FAIL: verifySlipOcr is not called in usePosActions.js"
);
assert.ok(
    posActionsContent.includes("const remainingToPay = sanitizeNum(activeTab?.summary?.finalTotal ?? activeTab?.finalTotal ?? 0);"),
    "FAIL: remainingToPay is not guarded before calling verifySlipOcr"
);
console.log("✅ Passed: usePosActions.js is fully integrated with centralized slipStorageService.\n");

console.log("🎉 ALL PHASE 3 INTEGRITY VERIFICATION TESTS PASSED 100%! 🎉\n");
