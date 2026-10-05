/**
 * Automated Verification: Phase 1 Enhanced Customer & Thai Address Parser
 * Location: Management System/tests/verifications/verify_phase1_customer_parser_enhanced.mjs
 */

import { parseCustomerAddress, parseThaiAddress, getCustomerDisplayName } from '../../dh-shared/index.js';

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

console.log('🧪 Starting Verification Suite: Phase 1 Enhanced Customer Parser');

// 1. Suite 1: User's Real Problem Case (Shop + Contact Person)
console.log('\n--- Suite 1: Real Case (Shop + Contact Person Separation) ---');
const userSample = `น.ส.รัตติกาล มณี
ร้านมัดคอม เลขที่116/2 โครงการซีพาร์ค ห้อง46/2 ต.แก้วนวรัฐ ต.วัดเกต อ.เมือง จ.เชียงใหม่ 50000
โทร. 094 6251717`;

const res1 = parseCustomerAddress(userSample);
assert(res1.accountName === 'ร้านมัดคอม', `accountName correctly extracted shop: "${res1.accountName}"`);
assert(res1.storeName === 'ร้านมัดคอม', `storeName matches shop: "${res1.storeName}"`);
assert(res1.contactName === 'น.ส.รัตติกาล มณี', `contactName correctly extracted recipient: "${res1.contactName}"`);
assert(res1.phone === '0946251717', `phone normalized to 10 digits: "${res1.phone}"`);
assert(res1.formattedPhone === '094-625-1717', `formattedPhone formatted: "${res1.formattedPhone}"`);
assert(res1.subDistrict === 'วัดเกต', `subDistrict extracted real subdistrict: "${res1.subDistrict}"`);
assert(res1.district === 'เมือง', `district extracted: "${res1.district}"`);
assert(res1.province === 'เชียงใหม่', `province extracted: "${res1.province}"`);
assert(res1.postalCode === '50000', `postalCode extracted: "${res1.postalCode}"`);
assert(res1.zipCode === '50000', `zipCode dual-key matches: "${res1.zipCode}"`);
assert(res1.addressLine.includes('เลขที่116/2 โครงการซีพาร์ค ห้อง46/2 ต.แก้วนวรัฐ'), `addressLine contains full address without shop name: "${res1.addressLine}"`);
assert(!res1.addressLine.includes('ร้านมัดคอม'), 'addressLine does NOT contain shop name');
assert(!res1.addressLine.includes('น.ส.รัตติกาล มณี'), 'addressLine does NOT contain person name');

// 2. Suite 2: Company + Person Inverted Order
console.log('\n--- Suite 2: Inverted Order (Company + Person) ---');
const invertedSample = `คุณ ภวัต บุญมา
บริษัท ดีเอช โน๊ตบุ๊ค จำกัด
065-4428822 91/364 ม.2 ต.บางคูรัด อ.บางบัวทอง จ.นนทบุรี 11110`;

const res2 = parseCustomerAddress(invertedSample);
assert(res2.accountName === 'บริษัท ดีเอช โน๊ตบุ๊ค จำกัด', `accountName extracted company: "${res2.accountName}"`);
assert(res2.contactName === 'คุณ ภวัต บุญมา', `contactName extracted person: "${res2.contactName}"`);
assert(res2.addressLine === '91/364 ม.2', `addressLine extracted cleanly: "${res2.addressLine}"`);
assert(res2.subDistrict === 'บางคูรัด', `subDistrict extracted: "${res2.subDistrict}"`);
assert(res2.district === 'บางบัวทอง', `district extracted: "${res2.district}"`);
assert(res2.province === 'นนทบุรี', `province extracted: "${res2.province}"`);

// 3. Suite 3: Courier, Shipping Notes & Social Media Dual-Key Parity
console.log('\n--- Suite 3: Courier, Notes & Dual-Key Schema Parity ---');
const sampleSocial = `ร้านไอทีคอมพิวเตอร์
คุณ สิทธิชัย ช่างซ่อม
Line: @itcomputer
Facebook: fb.com/itcom
Email: it@computer.com
99/1 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000
ขนส่ง KEX
หมายเหตุ: โทรแจ้งก่อนส่งของ`;

const res3 = parseCustomerAddress(sampleSocial);
assert(res3.preferredCourier === 'KEX', `preferredCourier: "${res3.preferredCourier}"`);
assert(res3.logisticProvider === 'KEX', `logisticProvider matches preferredCourier`);
assert(res3.shippingNotes === 'โทรแจ้งก่อนส่งของ', `shippingNotes: "${res3.shippingNotes}"`);
assert(res3.logisticNote === 'โทรแจ้งก่อนส่งของ', `logisticNote matches shippingNotes`);
assert(res3.postalCode === '40000', `postalCode matches 40000`);
assert(res3.zipCode === '40000', `zipCode matches postalCode`);
assert(res3.email === 'it@computer.com', `email: "${res3.email}"`);
assert(res3.lineId === '@itcomputer', `lineId: "${res3.lineId}"`);
assert(res3.facebook === 'fb.com/itcom', `facebook: "${res3.facebook}"`);
assert(res3.facebookUrl === 'fb.com/itcom', `facebookUrl matches facebook`);

// 4. Suite 4: Null Safety & Edge Cases
console.log('\n--- Suite 4: Null Guards & Edge Cases ---');
const emptyRes = parseCustomerAddress(null);
assert(emptyRes && emptyRes.accountName === '', 'null returns clean empty object');
assert(emptyRes.zipCode === '' && emptyRes.postalCode === '', 'null returns empty dual-key zip/postal');
const undefRes = parseCustomerAddress(undefined);
assert(undefRes && undefRes.phone === '', 'undefined returns clean empty object');
const numRes = parseCustomerAddress(12345);
assert(numRes && numRes.postalCode === '', 'number returns clean empty object');

// Summary
console.log(`\n========================================`);
console.log(`Summary: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
