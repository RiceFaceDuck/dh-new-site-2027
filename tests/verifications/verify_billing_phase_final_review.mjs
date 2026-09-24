/**
 * DH NOTEBOOK: COMPREHENSIVE PHASE FINAL REVIEW VERIFICATION
 * Phase Name: Billing System & UI Parity Cloning (โคลนระบบและหน้าต่างตั้งค่าบิลขายจาก Production)
 * Path: Management System/tests/verifications/verify_billing_phase_final_review.mjs
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { parseCustomerAddress } from '../../dh-shared/src/utils/thaiAddressParser.js';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

console.log('================================================================================');
console.log('🔍 DH NOTEBOOK: PHASE FINAL REVIEW — BILLING SYSTEM PARITY CLONING');
console.log('================================================================================\n');

const rootDir = fs.existsSync(path.resolve('Management System/dh-backoffice-react/src'))
    ? path.resolve('Management System/dh-backoffice-react/src')
    : path.resolve('dh-backoffice-react/src');

// -------------------------------------------------------------
// Suite 1: Shared Address Parser (Phase 1)
// -------------------------------------------------------------
console.log('--- 1. Shared Thai Address Parser Integrity (Phase 1) ---');
const parsedStandard = parseCustomerAddress('สมชาย ใจดี 081-234-5678 123/45 ม.2 ต.บางรักพัฒนา อ.บางบัวทอง จ.นนทบุรี 11110');
assert(parsedStandard.accountName === 'สมชาย ใจดี', 'Parsed account name');
assert(parsedStandard.phone === '0812345678', 'Parsed and normalized phone');
assert(parsedStandard.province === 'นนทบุรี', 'Parsed province');
assert(parsedStandard.postalCode === '11110', 'Parsed postal code');

const sampleDirty = `ชื่อ: สมหญิง ยิ้มแย้ม โทร: 0929998888 ที่อยู่จัดส่ง: 88 ซ.รามคำแหง 24 แขวงหัวหมาก เขตบางกะปิ จังหวัดกรุงเทพ 10240 ขนส่ง Flash
หมายเหตุ: ฝากของไว้ที่ป้อมยาม`;
const parsedDirty = parseCustomerAddress(sampleDirty);
assert(parsedDirty.accountName === 'สมหญิง ยิ้มแย้ม', 'Cleaned name prefixes');
assert(parsedDirty.preferredCourier === 'Flash', 'Extracted courier');
assert(parsedDirty.shippingNotes === 'ฝากของไว้ที่ป้อมยาม', 'Extracted shipping notes');

// -------------------------------------------------------------
// Suite 2: Legal In-App Modals (Phase 2)
// -------------------------------------------------------------
console.log('\n--- 2. Legal In-App Modals (Phase 2) ---');
const vatModalPath = path.join(rootDir, 'components/billing/pos/modals/VatInfoModal.jsx');
const shipModalPath = path.join(rootDir, 'components/billing/pos/modals/ShippingInfoModal.jsx');
assert(fs.existsSync(vatModalPath), 'VatInfoModal.jsx exists');
assert(fs.existsSync(shipModalPath), 'ShippingInfoModal.jsx exists');

const vatContent = fs.readFileSync(vatModalPath, 'utf-8');
const shipContent = fs.readFileSync(shipModalPath, 'utf-8');
assert(vatContent.includes('86/4') && vatContent.includes('79 (1)'), 'VatInfoModal cites Sec 86/4 & 79(1)');
assert(shipContent.includes('120/2545') && shipContent.includes('77/2'), 'ShippingInfoModal cites Order P.120/2545');

// -------------------------------------------------------------
// Suite 3: Smart Quick Paste 2-Step Customer Modal (Phase 3)
// -------------------------------------------------------------
console.log('\n--- 3. Smart Quick Paste 2-Step Customer Modal (Phase 3) ---');
const quickAddPath = path.join(rootDir, 'components/billing/pos/settings/customer/QuickAddCustomerModal.jsx');
assert(fs.existsSync(quickAddPath), 'QuickAddCustomerModal.jsx exists');
const quickAddContent = fs.readFileSync(quickAddPath, 'utf-8');
assert(quickAddContent.includes('parseCustomerAddress'), 'Integrates parseCustomerAddress');
assert(quickAddContent.includes('CustomerDuplicateComparisonModal'), 'Integrates duplicate comparison modal');
assert(quickAddContent.includes('fetchRoleTierConfig'), 'Integrates dynamic role config lookup');
assert(quickAddContent.includes('lookupWebAccountByEmail'), 'Integrates web account email lookup');

// -------------------------------------------------------------
// Suite 4: BillingMain Navigation & Quota Isolation (Phase 4)
// -------------------------------------------------------------
console.log('\n--- 4. BillingMain Navigation & Quota Guard (Phase 4) ---');
const billingMainPath = path.join(rootDir, 'pages/billing/BillingMain.jsx');
assert(fs.existsSync(billingMainPath), 'BillingMain.jsx exists');
const billingMainContent = fs.readFileSync(billingMainPath, 'utf-8');
assert(billingMainContent.includes('dh_open_new_bill'), 'Listens to dh_open_new_bill event');
assert(billingMainContent.includes('dh_resume_draft'), 'Listens to dh_resume_draft event');
assert(billingMainContent.includes('PosViewWrapper'), 'Isolates customer queries inside PosViewWrapper');

// -------------------------------------------------------------
// Suite 5: Signature Asymmetrical UI Rounded Corners
// -------------------------------------------------------------
console.log('\n--- 5. Signature Top-Right Rounded Corner UI Polish ---');
const togglePath = path.join(rootDir, 'components/billing/pos/settings/panel/ToggleGroup.jsx');
const promoPath = path.join(rootDir, 'components/billing/pos/settings/panel/PromotionSettings.jsx');
const discountPath = path.join(rootDir, 'components/billing/pos/settings/panel/DiscountSettings.jsx');
const notePath = path.join(rootDir, 'components/billing/pos/settings/panel/NoteSettings.jsx');
const custSectionPath = path.join(rootDir, 'components/billing/pos/settings/CustomerSection.jsx');

const toggleContent = fs.readFileSync(togglePath, 'utf-8');
const promoContent = fs.readFileSync(promoPath, 'utf-8');
const discountContent = fs.readFileSync(discountPath, 'utf-8');
const noteContent = fs.readFileSync(notePath, 'utf-8');
const custSectionContent = fs.readFileSync(custSectionPath, 'utf-8');

assert(toggleContent.includes('rounded-none rounded-tr-md'), 'ToggleGroup outer container has rounded-tr-md');
assert(toggleContent.includes('rounded-none rounded-tr-sm'), 'ToggleGroup buttons have rounded-tr-sm');
assert(promoContent.includes('rounded-none rounded-tr-sm'), 'Promo buttons have rounded-tr-sm');
assert(promoContent.includes('rounded-none rounded-tr-md'), 'Promo cards have rounded-tr-md');
assert(discountContent.includes('rounded-none rounded-tr-md'), 'Discount inputs have rounded-tr-md');
assert(noteContent.includes('rounded-none rounded-tr-md'), 'Print Note textarea has rounded-tr-md');
assert(custSectionContent.includes('rounded-none rounded-tr-sm'), 'Quick Add button has rounded-tr-sm');

// -------------------------------------------------------------
// Suite 6: Dev Server Route Availability Check
// -------------------------------------------------------------
console.log('\n--- 6. Dev Server Health Check (http://localhost:3168/billing) ---');
const checkDevServer = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3168/billing', (res) => {
            assert(res.statusCode === 200, `Dev server /billing responds HTTP ${res.statusCode} OK`);
            resolve();
        });
        req.on('error', (e) => {
            assert(false, `Dev server /billing reachable: ${e.message}`);
            resolve();
        });
        req.setTimeout(3000, () => {
            req.destroy();
            assert(false, 'Dev server request timed out');
            resolve();
        });
    });
};

await checkDevServer();

console.log('\n================================================================================');
console.log(`  PHASE FINAL REVIEW TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================================\n');

if (failed === 0) {
    console.log('🎉 PHASE FINAL REVIEW VERIFICATION SUITE: 100% PASS (ALL CRITERIA SATISFIED)');
    process.exit(0);
} else {
    console.error(`❌ PHASE FINAL REVIEW VERIFICATION FAILED: ${failed} issue(s) detected.`);
    process.exit(1);
}
