/**
 * Verification Suite: Billing Backdrop Click & Sidebar New Bill Button Tweaks
 * Location: Management System/tests/verifications/verify_billing_backdrop_and_sidebar_tweaks.mjs
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

console.log('🧪 Starting Verification Suite: Billing Backdrop & Sidebar Tweaks');

const baseDir = path.resolve('Management System/dh-backoffice-react/src');

// 1. OrderDetailModal Backdrop Click
console.log('\n--- Test 1: OrderDetailModal Backdrop Click ---');
const orderDetailModalPath = path.join(baseDir, 'components/billing/dashboard/OrderDetailModal.jsx');
assert(fs.existsSync(orderDetailModalPath), 'OrderDetailModal.jsx exists');
const orderDetailContent = fs.readFileSync(orderDetailModalPath, 'utf-8');

assert(orderDetailContent.includes('onClick={handleCloseModal}'), 'Outer backdrop wrapper has onClick={handleCloseModal}');
assert(orderDetailContent.includes('onClick={(e) => e.stopPropagation()}'), 'Inner modal dialog has e.stopPropagation()');

// 2. ReceiptTemplate Backdrop Click
console.log('\n--- Test 2: ReceiptTemplate Backdrop Click ---');
const receiptTemplatePath = path.join(baseDir, 'components/billing/pos/ReceiptTemplate.jsx');
assert(fs.existsSync(receiptTemplatePath), 'ReceiptTemplate.jsx exists');
const receiptContent = fs.readFileSync(receiptTemplatePath, 'utf-8');

assert(receiptContent.includes('onClick={onClose}'), 'Outer backdrop wrapper has onClick={onClose}');
assert(receiptContent.includes('onClick={(e) => e.stopPropagation()}'), 'A5 viewer / toolbar stops event propagation');

// 3. Sidebar New Bill (+) Button
console.log('\n--- Test 3: Sidebar New Bill Button ---');
const sidebarPath = path.join(baseDir, 'layouts/components/Sidebar.jsx');
assert(fs.existsSync(sidebarPath), 'Sidebar.jsx exists');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

assert(sidebarContent.includes('useNavigate'), 'Sidebar imports useNavigate');
assert(sidebarContent.includes('Plus'), 'Sidebar imports Plus icon');
assert(sidebarContent.includes('handleCreateNewBill'), 'Sidebar defines handleCreateNewBill function');
assert(sidebarContent.includes("new CustomEvent('dh_open_new_bill')"), 'Sidebar dispatches dh_open_new_bill event');
assert(sidebarContent.includes("item.path === '/billing'"), 'Sidebar checks for /billing path to render button');
assert(sidebarContent.includes("title=\"สร้างบิลใหม่ (POS)\""), 'Sidebar renders (+) button with tooltip');

console.log('\n========================================');
console.log(`Summary: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('========================================');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
