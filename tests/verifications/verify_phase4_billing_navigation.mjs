/**
 * Automated Verification: Phase 4 BillingMain Navigation & Global Event Handlers
 * Path: Management System/tests/verifications/verify_phase4_billing_navigation.mjs
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

console.log('🧪 Starting Verification Suite: Phase 4 BillingMain Navigation & Event Handlers');

const rootDir = path.resolve('Management System/dh-backoffice-react/src');

// 1. Check BillingMain.jsx Navigation & Event Listeners
console.log('\n--- Suite 1: BillingMain Navigation & Global Events ---');
const billingMainPath = path.join(rootDir, 'pages/billing/BillingMain.jsx');
assert(fs.existsSync(billingMainPath), 'BillingMain.jsx file exists');
const billingMainContent = fs.readFileSync(billingMainPath, 'utf-8');

assert(billingMainContent.includes('location.state?.newBill'), 'Handles location.state.newBill navigation');
assert(billingMainContent.includes('location.state?.initialDraft'), 'Handles location.state.initialDraft navigation');
assert(billingMainContent.includes('dh_open_new_bill'), 'Listens to window CustomEvent "dh_open_new_bill"');
assert(billingMainContent.includes('dh_resume_draft'), 'Listens to window CustomEvent "dh_resume_draft"');
assert(billingMainContent.includes('isNewBillRequest={isNewBillRequest}'), 'Passes isNewBillRequest to PosViewWrapper');
assert(billingMainContent.includes('onNewBillHandled='), 'Passes onNewBillHandled to PosViewWrapper');

// 2. Check PosSystem Integration
console.log('\n--- Suite 2: PosSystem Event Reception ---');
const posSystemPath = path.join(rootDir, 'components/billing/PosSystem.jsx');
const posContent = fs.readFileSync(posSystemPath, 'utf-8');

assert(posContent.includes('isNewBillRequest') && posContent.includes('onNewBillHandled'), 'PosSystem accepts isNewBillRequest and onNewBillHandled');
assert(posContent.includes('isNewBillHandledRef'), 'PosSystem manages isNewBillHandledRef guard');
assert(posContent.includes('lastResumeIdRef'), 'PosSystem manages lastResumeIdRef guard');

// 3. Check Dev Server Response on localhost:3168/billing
console.log('\n--- Suite 3: Dev Server Health Check ---');
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
