/**
 * Automated Verification: Phase 3 Smart Quick Paste 2-Step Customer Modal
 * Path: Management System/tests/verifications/verify_phase3_customer_modal.mjs
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

console.log('🧪 Starting Verification Suite: Phase 3 Smart Quick Paste 2-Step Customer Modal');

const rootDir = fs.existsSync(path.resolve('Management System/dh-backoffice-react/src'))
    ? path.resolve('Management System/dh-backoffice-react/src')
    : path.resolve('dh-backoffice-react/src');

// 1. Check QuickAddCustomerModal.jsx
console.log('\n--- Suite 1: QuickAddCustomerModal 2-Step Architecture ---');
const modalPath = path.join(rootDir, 'components/billing/pos/settings/customer/QuickAddCustomerModal.jsx');
assert(fs.existsSync(modalPath), 'QuickAddCustomerModal.jsx file exists');
const modalContent = fs.readFileSync(modalPath, 'utf-8');

assert(modalContent.includes('parseCustomerAddress'), 'Imports and uses parseCustomerAddress from dh-shared');
assert(modalContent.includes('CustomerDuplicateComparisonModal'), 'Imports CustomerDuplicateComparisonModal');
assert(modalContent.includes('checkPotentialDuplicates'), 'Imports checkPotentialDuplicates');
assert(modalContent.includes('fetchRoleTierConfig'), 'Implements fetchRoleTierConfig');
assert(modalContent.includes('lookupWebAccountByEmail'), 'Implements lookupWebAccountByEmail');
assert(modalContent.includes('modalStep === 1'), 'Supports Step 1 (Smart Quick Paste)');
assert(modalContent.includes('modalStep === 2'), 'Supports Step 2 (Web Account Linking & Points)');
assert(modalContent.includes('ร้านช่าง'), 'Defaults role selection towards ร้านช่าง / wholesale');
assert(modalContent.includes('Real-time Parser'), 'Displays Real-time Parser badge');

// 2. Check CustomerDuplicateComparisonModal
console.log('\n--- Suite 2: CustomerDuplicateComparisonModal & Potential Duplicates ---');
const dupModalPath = path.join(rootDir, 'pages/Customers/components/forms/CustomerDuplicateComparisonModal.jsx');
assert(fs.existsSync(dupModalPath), 'CustomerDuplicateComparisonModal.jsx exists');
const dupContent = fs.readFileSync(dupModalPath, 'utf-8');
assert(dupContent.includes('export const checkPotentialDuplicates'), 'Exports checkPotentialDuplicates function');
assert(dupContent.includes('onSelectExisting') && dupContent.includes('onOverwriteExisting') && dupContent.includes('onForceCreateNew'), 'Supports selection, overwrite, and force-create callbacks');

// 3. Check CustomerSection Integration
console.log('\n--- Suite 3: CustomerSection Wiring ---');
const custSectionPath = path.join(rootDir, 'components/billing/pos/settings/CustomerSection.jsx');
const custSectionContent = fs.readFileSync(custSectionPath, 'utf-8');
assert(custSectionContent.includes('QuickAddCustomerModal'), 'CustomerSection imports QuickAddCustomerModal');
assert(custSectionContent.includes('isQuickAddModalOpen'), 'CustomerSection manages isQuickAddModalOpen state');
assert(custSectionContent.includes('+ เพิ่มลูกค้าใหม่'), 'CustomerSection renders yellow quick add button');

// 4. Check Dev Server Response on localhost:3168/billing
console.log('\n--- Suite 4: Dev Server Health Check ---');
try {
    const res = await fetch('http://localhost:3168/billing');
    assert(res.status === 200, `Dev server /billing responds HTTP ${res.status}`);
} catch (e) {
    assert(false, `Dev server connection failed: ${e.message}`);
}

// Summary
console.log(`\n========================================`);
console.log(`Summary: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
