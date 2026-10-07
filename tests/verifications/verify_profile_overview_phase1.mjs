import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🚀 Running Verification Test: Profile Overview Phase 1 (Role Mapping & Maps Regex)');

// 1. Verify Regex in PersonalInfoForm.jsx
const personalInfoPath = path.resolve('dh-frontend/src/components/profile/forms/PersonalInfoForm.jsx');
assert(fs.existsSync(personalInfoPath), 'PersonalInfoForm.jsx exists');
const personalInfoSrc = fs.readFileSync(personalInfoPath, 'utf8');

// Test that regex matches all Google Maps domains
const regexMatch = personalInfoSrc.match(/const isValidMapUrl = \(url\) => \{[\s\S]*?return (\/.*?\/[i]?)\.test\(url\.trim\(\)\);/);
assert(regexMatch, 'isValidMapUrl implementation exists with test method');

const regexStr = regexMatch[1];
const regex = eval(regexStr);

const validUrls = [
  'https://goo.gl/maps/abc',
  'http://goo.gl/maps/abc',
  'https://maps.app.goo.gl/xyz',
  'maps.app.goo.gl/xyz',
  'https://www.google.com/maps/place/xyz',
  'https://google.com/maps/@13,100',
  'https://maps.google.com/?q=13,100',
  'https://maps.google.com/maps?daddr=13.7,100.5',
  'https://maps.google.co.th/maps?q=bangkok',
  'http://maps.google.com/dir',
  'maps.google.com/?cid=12345'
];

validUrls.forEach((u) => {
  assert.strictEqual(regex.test(u), true, `URL should be valid: ${u}`);
});

const invalidUrls = [
  'https://facebook.com',
  'https://notgoogle.com/maps',
  'random text'
];

invalidUrls.forEach((u) => {
  assert.strictEqual(regex.test(u), false, `URL should be invalid: ${u}`);
});
console.log('✅ 1. Google Maps URL regex verified for all domains');

// 2. Verify Role Mapping in TabOverview.jsx
const tabOverviewPath = path.resolve('dh-frontend/src/components/profile/tabs/TabOverview.jsx');
assert(fs.existsSync(tabOverviewPath), 'TabOverview.jsx exists');
const tabOverviewSrc = fs.readFileSync(tabOverviewPath, 'utf8');

assert(tabOverviewSrc.includes('getRoleDisplayName'), 'getRoleDisplayName is defined and used');
assert(tabOverviewSrc.includes('ผู้ดูแลระบบ (Admin)'), 'Admin role display is handled');
assert(tabOverviewSrc.includes('ผู้จัดการ (Manager)'), 'Manager role display is handled');
assert(tabOverviewSrc.includes('พาร์ทเนอร์ (Partner VIP)'), 'Partner VIP role display is handled');
assert(tabOverviewSrc.includes('ร้านช่าง / ราคาส่ง (Wholesale)'), 'Wholesale role display is handled');
assert(tabOverviewSrc.includes('คู่ค้าองค์กร (Enterprise)'), 'Enterprise role display is handled');
assert(tabOverviewSrc.includes('user: propUser'), 'propUser is accepted in TabOverview signature');

console.log('✅ 2. Role Label Mapping & propUser interface verified');

console.log('🎉 ALL PHASE 1 VERIFICATION TESTS PASSED SUCCESSFULLY!');
