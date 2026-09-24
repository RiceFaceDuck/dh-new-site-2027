/**
 * Automated Verification: Thai Address & Customer Data Parser
 * Path: Management System/tests/verifications/verify_thai_address_parser.mjs
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

console.log('🧪 Starting Verification Suite: Thai Address & Customer Parser (Phase 1)');

// 1. Export Integrity Check
console.log('\n--- Suite 1: Export Integrity ---');
assert(typeof parseCustomerAddress === 'function', 'parseCustomerAddress is exported from dh-shared root');
assert(typeof parseThaiAddress === 'function', 'parseThaiAddress alias is exported from dh-shared root');
assert(typeof getCustomerDisplayName === 'function', 'getCustomerDisplayName is preserved in dh-shared root');

// 2. Multi-line Standard Customer Info
console.log('\n--- Suite 2: Multi-line Standard Paste ---');
const sample1 = `สมชาย ใจดี
081-234-5678
123/45 หมู่ 6 ต.บางรักพัฒนา อ.บางบัวทอง จ.นนทบุรี 11110`;

const res1 = parseCustomerAddress(sample1);
assert(res1.accountName === 'สมชาย ใจดี', `accountName parsed correctly: "${res1.accountName}"`);
assert(res1.phone === '0812345678', `phone normalized to 10 digits: "${res1.phone}"`);
assert(res1.formattedPhone === '081-234-5678', `formattedPhone formatted with dashes: "${res1.formattedPhone}"`);
assert(res1.subDistrict === 'บางรักพัฒนา', `subDistrict extracted: "${res1.subDistrict}"`);
assert(res1.district === 'บางบัวทอง', `district extracted: "${res1.district}"`);
assert(res1.province === 'นนทบุรี', `province extracted: "${res1.province}"`);
assert(res1.postalCode === '11110', `postalCode extracted: "${res1.postalCode}"`);

// 3. Dirty String with Prefixes, Courier, and Shipping Notes
console.log('\n--- Suite 3: Dirty String with Courier & Notes ---');
const sample2 = `ชื่อ: สมหญิง ยิ้มแย้ม โทร: 0929998888 ที่อยู่จัดส่ง: 88 ซ.รามคำแหง 24 แขวงหัวหมาก เขตบางกะปิ จังหวัดกรุงเทพ 10240 ขนส่ง Flash
หมายเหตุ: ฝากของไว้ที่ป้อมยาม`;

const res2 = parseCustomerAddress(sample2);
assert(res2.accountName === 'สมหญิง ยิ้มแย้ม', `accountName stripped label: "${res2.accountName}"`);
assert(res2.phone === '0929998888', `phone extracted: "${res2.phone}"`);
assert(res2.preferredCourier === 'Flash', `preferredCourier detected: "${res2.preferredCourier}"`);
assert(res2.shippingNotes === 'ฝากของไว้ที่ป้อมยาม', `shippingNotes extracted: "${res2.shippingNotes}"`);
assert(res2.postalCode === '10240', `postalCode extracted: "${res2.postalCode}"`);
assert(res2.subDistrict === 'หัวหมาก', `subDistrict (แขวง) extracted: "${res2.subDistrict}"`);
assert(res2.district === 'บางกะปิ', `district (เขต) extracted: "${res2.district}"`);

// 4. International Phone (+66), Email, Line ID
console.log('\n--- Suite 4: International Phone (+66), Email, Line ID ---');
const sample3 = `นายช่าง ซ่อมคอม
+66891234567
tech@dhnotebook.com
Line: dh_repair_service
99/9 ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000`;

const res3 = parseCustomerAddress(sample3);
assert(res3.accountName === 'นายช่าง ซ่อมคอม', `accountName extracted: "${res3.accountName}"`);
assert(res3.phone === '0891234567', `+66 normalized to leading 0: "${res3.phone}"`);
assert(res3.formattedPhone === '089-123-4567', `formattedPhone: "${res3.formattedPhone}"`);
assert(res3.email === 'tech@dhnotebook.com', `email extracted: "${res3.email}"`);
assert(res3.lineId === 'dh_repair_service', `lineId extracted: "${res3.lineId}"`);
assert(res3.province === 'ขอนแก่น', `province extracted: "${res3.province}"`);

// 5. Edge Cases & Null Safety
console.log('\n--- Suite 5: Null Guards & Edge Cases ---');
const emptyRes = parseCustomerAddress(null);
assert(emptyRes && emptyRes.accountName === '', 'null returns empty object without throwing');
const undefRes = parseCustomerAddress(undefined);
assert(undefRes && undefRes.phone === '', 'undefined returns empty object without throwing');
const numRes = parseCustomerAddress(12345);
assert(numRes && numRes.postalCode === '', 'non-string returns empty object without throwing');

// Summary
console.log(`\n========================================`);
console.log(`Summary: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
