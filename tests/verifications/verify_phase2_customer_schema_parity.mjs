/**
 * Automated Verification: Phase 2 Customer Schema Parity & Dual-Key Alignment
 * Location: Management System/tests/verifications/verify_phase2_customer_schema_parity.mjs
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

console.log('🧪 Starting Verification Suite: Phase 2 Customer Schema Parity & Dual-Key Alignment');

const rootDir = fs.existsSync(path.resolve('Management System/dh-backoffice-react/src'))
    ? path.resolve('Management System/dh-backoffice-react/src')
    : path.resolve('dh-backoffice-react/src');

// 1. Check QuickAddCustomerModal buildCustomerPayload
console.log('\n--- Suite 1: QuickAddCustomerModal Dual-Key Alignment ---');
const quickAddPath = path.join(rootDir, 'components/billing/pos/settings/customer/QuickAddCustomerModal.jsx');
assert(fs.existsSync(quickAddPath), 'QuickAddCustomerModal.jsx exists');
const quickAddContent = fs.readFileSync(quickAddPath, 'utf-8');
assert(quickAddContent.includes('contactName: contact || name'), 'buildCustomerPayload sets contactName');
assert(quickAddContent.includes('storeName: name'), 'buildCustomerPayload sets storeName');
assert(quickAddContent.includes('postalCode: zip') && quickAddContent.includes('zipCode: zip'), 'buildCustomerPayload sets dual-key postalCode and zipCode');
assert(quickAddContent.includes('preferredCourier: courier') && quickAddContent.includes('logisticProvider: courier'), 'buildCustomerPayload sets dual-key courier fields');
assert(quickAddContent.includes('shippingNotes: notes') && quickAddContent.includes('logisticNote: notes'), 'buildCustomerPayload sets dual-key note fields');
assert(quickAddContent.includes('facebook: fb') && quickAddContent.includes('facebookUrl: fb'), 'buildCustomerPayload sets dual-key facebook fields');

// 2. Check ShippingInfoSection Dual-Key Binding
console.log('\n--- Suite 2: ShippingInfoSection Dual-Key Binding ---');
const shippingSectionPath = path.join(rootDir, 'pages/Customers/components/forms/sections/ShippingInfoSection.jsx');
assert(fs.existsSync(shippingSectionPath), 'ShippingInfoSection.jsx exists');
const shippingContent = fs.readFileSync(shippingSectionPath, 'utf-8');
assert(shippingContent.includes('address.zipCode || address.postalCode'), 'ShippingInfoSection reads both zipCode and postalCode');
assert(shippingContent.includes("handleChange('address.zipCode', e.target.value)") && shippingContent.includes("handleChange('address.postalCode', e.target.value)"), 'ShippingInfoSection syncs both zipCode and postalCode');
assert(shippingContent.includes('formData.logisticProvider || formData.preferredCourier'), 'ShippingInfoSection reads both logisticProvider and preferredCourier');
assert(shippingContent.includes('formData.logisticNote || formData.shippingNotes'), 'ShippingInfoSection reads both logisticNote and shippingNotes');

// 3. Check ContactInfoSection Dual-Key Binding
console.log('\n--- Suite 3: ContactInfoSection Dual-Key Binding ---');
const contactSectionPath = path.join(rootDir, 'pages/Customers/components/forms/sections/ContactInfoSection.jsx');
assert(fs.existsSync(contactSectionPath), 'ContactInfoSection.jsx exists');
const contactContent = fs.readFileSync(contactSectionPath, 'utf-8');
assert(contactContent.includes('formData.contactName || formData.firstName'), 'ContactInfoSection reads both contactName and firstName');
assert(contactContent.includes('formData.facebookUrl || formData.facebook'), 'ContactInfoSection reads both facebookUrl and facebook');

// 4. Check CustomerAdminService createManualCustomer Normalization
console.log('\n--- Suite 4: CustomerAdminService createManualCustomer Normalization ---');
const adminServicePath = path.join(rootDir, 'firebase/customerAdminService.js');
assert(fs.existsSync(adminServicePath), 'customerAdminService.js exists');
const adminContent = fs.readFileSync(adminServicePath, 'utf-8');
assert(adminContent.includes('contactName: resolvedContact'), 'createManualCustomer normalizes contactName');
assert(adminContent.includes('firstName: resolvedContact'), 'createManualCustomer normalizes firstName');
assert(adminContent.includes('logisticProvider: data.logisticProvider || data.preferredCourier'), 'createManualCustomer normalizes dual-key logisticProvider');
assert(adminContent.includes('shippingNotes: data.shippingNotes || data.logisticNote'), 'createManualCustomer normalizes dual-key shippingNotes');

// 5. Check CustomerDuplicateComparisonModal Email Detection
console.log('\n--- Suite 5: CustomerDuplicateComparisonModal Email Detection ---');
const dupModalPath = path.join(rootDir, 'pages/Customers/components/forms/CustomerDuplicateComparisonModal.jsx');
assert(fs.existsSync(dupModalPath), 'CustomerDuplicateComparisonModal.jsx exists');
const dupContent = fs.readFileSync(dupModalPath, 'utf-8');
assert(dupContent.includes("where('email', '==', email)"), 'checkPotentialDuplicates queries email for duplicates');
assert(dupContent.includes('อีเมลตรงกัน'), 'checkPotentialDuplicates adds email duplicate reason');

// Summary
console.log(`\n========================================`);
console.log(`Summary: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
