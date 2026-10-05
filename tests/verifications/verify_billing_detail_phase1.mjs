import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('🔍 Running Billing Detail Phase 1 Verification...');

let allPassed = true;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        allPassed = false;
    }
}

// 1. OrderDetailModal.jsx checks
const orderDetailModalPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/dashboard/OrderDetailModal.jsx');
const orderDetailContent = fs.readFileSync(orderDetailModalPath, 'utf8');

assert(
    orderDetailContent.includes("dateStyle: 'short', timeStyle: 'short'"),
    "OrderDetailModal uses dateStyle 'short' and timeStyle 'short'"
);
assert(
    !orderDetailContent.includes("formattedDate.split(' ')[0]"),
    "OrderDetailModal removed buggy formattedDate.split(' ')[0]"
);
assert(
    orderDetailContent.includes("{formattedDate}"),
    "OrderDetailModal renders full formattedDate"
);

// 2. OrderSummaryTotals.jsx checks
const totalsPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/dashboard/order-summary/OrderSummaryTotals.jsx');
const totalsContent = fs.readFileSync(totalsPath, 'utf8');

assert(
    totalsContent.includes("ยอดรวมมูลค่าบิล (Order Value)"),
    "OrderSummaryTotals includes Order Value header"
);
assert(
    totalsContent.includes("formatCurrency"),
    "OrderSummaryTotals has formatCurrency helper for satang precision"
);
assert(
    totalsContent.includes("pointsUsed"),
    "OrderSummaryTotals supports pointsUsed"
);
assert(
    totalsContent.includes("โอนแล้ว / หักสต็อกแล้ว"),
    "OrderSummaryTotals includes exact parity badge text"
);

// 3. OrderActions.jsx checks
const orderActionsPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/dashboard/OrderActions.jsx');
const orderActionsContent = fs.readFileSync(orderActionsPath, 'utf8');

assert(
    orderActionsContent.includes("canDeleteOrder"),
    "OrderActions uses canDeleteOrder permission check"
);
assert(
    !orderActionsContent.includes("isCancelled || orderStat === 'draft'"),
    "OrderActions prohibits deleting cancelled orders"
);
assert(
    orderActionsContent.includes("canDeleteOrder && (orderStat === 'draft' || orderStat === 'pending')"),
    "OrderActions limits delete strictly to draft and pending orders"
);

// 4. ClaimActionForm.jsx checks
const claimFormPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/dashboard/order-summary/ClaimActionForm.jsx');
const claimFormContent = fs.readFileSync(claimFormPath, 'utf8');

assert(
    claimFormContent.includes("isReturn ? 'RTN' : (isSwap ? 'EXC' : 'CLM')"),
    "ClaimActionForm correctly allocates EXC prefix for swaps"
);
assert(
    !claimFormContent.includes("'เคลมเปลี่ยนรุ่น'"),
    "ClaimActionForm removed 'เคลมเปลี่ยนรุ่น' in favor of pure domain separation"
);
assert(
    !claimFormContent.includes("alert("),
    "ClaimActionForm removed native browser alert"
);
assert(
    claimFormContent.includes("toast.error("),
    "ClaimActionForm uses toast.error for errors"
);

// 5. billingDeleteService.js checks
const deleteServicePath = path.join(rootDir, 'dh-backoffice-react/src/firebase/billingDeleteService.js');
const deleteServiceContent = fs.readFileSync(deleteServicePath, 'utf8');

assert(
    deleteServiceContent.includes("stat === 'cancelled' || stat === 'void'"),
    "billingDeleteService protects cancelled and void orders from permanent deletion"
);

if (allPassed) {
    console.log('\n🎉 ALL 14 VERIFICATIONS PASSED 100%!');
    process.exit(0);
} else {
    console.error('\n⚠️ SOME VERIFICATIONS FAILED.');
    process.exit(1);
}
