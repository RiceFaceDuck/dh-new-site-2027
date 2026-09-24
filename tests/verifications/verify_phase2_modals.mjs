/**
 * Automated Verification: Phase 2 In-App Legal Modals (VatInfoModal & ShippingInfoModal)
 * Path: Management System/tests/verifications/verify_phase2_modals.mjs
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

console.log('🧪 Starting Verification Suite: Phase 2 Legal In-App Modals');

const rootDir = fs.existsSync(path.resolve('Management System/dh-backoffice-react/src'))
    ? path.resolve('Management System/dh-backoffice-react/src')
    : path.resolve('dh-backoffice-react/src');

// 1. Check VatInfoModal.jsx
console.log('\n--- Suite 1: VatInfoModal Integrity ---');
const vatModalPath = path.join(rootDir, 'components/billing/pos/modals/VatInfoModal.jsx');
assert(fs.existsSync(vatModalPath), 'VatInfoModal.jsx file exists');
const vatContent = fs.readFileSync(vatModalPath, 'utf-8');
assert(vatContent.includes('มาตรา 86/4'), 'Contains Revenue Code Section 86/4 reference');
assert(vatContent.includes('มาตรา 79 (1)'), 'Contains Revenue Code Section 79 (1) reference');
assert(vatContent.includes('ป. 86/2542'), 'Contains Order P. 86/2542 reference');
assert(vatContent.includes('Scale'), 'Uses Scale icon');

// 2. Check ShippingInfoModal.jsx
console.log('\n--- Suite 2: ShippingInfoModal Integrity ---');
const shipModalPath = path.join(rootDir, 'components/billing/pos/modals/ShippingInfoModal.jsx');
assert(fs.existsSync(shipModalPath), 'ShippingInfoModal.jsx file exists');
const shipContent = fs.readFileSync(shipModalPath, 'utf-8');
assert(shipContent.includes('ป. 120/2545'), 'Contains Order P. 120/2545 reference');
assert(shipContent.includes('มาตรา 77/2 & 82/3'), 'Contains Revenue Code Section 77/2 & 82/3 reference');
assert(shipContent.includes('Reimbursement'), 'Contains Reimbursement method');
assert(shipContent.includes('Truck'), 'Uses Truck icon');

// 3. Check PosSystem wiring
console.log('\n--- Suite 3: PosSystem Integration ---');
const posSystemPath = path.join(rootDir, 'components/billing/PosSystem.jsx');
const posContent = fs.readFileSync(posSystemPath, 'utf-8');
assert(posContent.includes('import VatInfoModal from'), 'PosSystem imports VatInfoModal');
assert(posContent.includes('import ShippingInfoModal from'), 'PosSystem imports ShippingInfoModal');
assert(posContent.includes('isVatModalOpen'), 'PosSystem maintains isVatModalOpen state');
assert(posContent.includes('isShippingModalOpen'), 'PosSystem maintains isShippingModalOpen state');
assert(posContent.includes('<VatInfoModal'), 'PosSystem renders VatInfoModal');
assert(posContent.includes('<ShippingInfoModal'), 'PosSystem renders ShippingInfoModal');
assert(posContent.includes('onOpenVatModal='), 'PosSystem passes onOpenVatModal to PaymentPanel');
assert(posContent.includes('onOpenShippingModal='), 'PosSystem passes onOpenShippingModal to PaymentPanel');

// 4. Check PaymentPanel wiring
console.log('\n--- Suite 4: PaymentPanel & BillSummary Wiring ---');
const paymentPanelPath = path.join(rootDir, 'components/billing/pos/PaymentPanel.jsx');
const paymentContent = fs.readFileSync(paymentPanelPath, 'utf-8');
assert(paymentContent.includes('onOpenVatModal') && paymentContent.includes('onOpenShippingModal'), 'PaymentPanel receives both modal callbacks');
assert(paymentContent.includes('onOpenVatModal={onOpenVatModal}') && paymentContent.includes('onOpenShippingModal={onOpenShippingModal}'), 'PaymentPanel forwards callbacks to BillSummary');

// 5. Check Dev Server Response on localhost:3168/billing
console.log('\n--- Suite 5: Dev Server Health Check ---');
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
