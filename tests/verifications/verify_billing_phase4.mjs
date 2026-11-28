import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { mapRoleToClaims } = require('../../functions/auth/userClaimsTrigger.js');

// 1. B14: Verify all 7 previously-missing staff roles map to isStaff: true
const expectedStaffRoles = [
  'finance',
  'developer',
  'admin ฝ่ายขาย',
  'จัดแพ็ค',
  'การบัญชี',
  'อื่นๆ',
  'vp 1'
];
for (const role of expectedStaffRoles) {
  const claims = mapRoleToClaims(role);
  assert.equal(claims.isStaff, true, `Role "${role}" MUST have isStaff: true`);
}
assert.equal(mapRoleToClaims('vp 1').isManager, true, 'vp 1 must have isManager: true');
assert.equal(mapRoleToClaims('จัดแพ็ค').role, 'packer', 'จัดแพ็ค must map to packer');
assert.equal(mapRoleToClaims('customer').isStaff, false, 'customer must remain isStaff: false');

// 2. B14/B15: Validate JSON syntax of firebase.json and firestore.indexes.json
const fbJson = JSON.parse(fs.readFileSync('c:/_DH Notebook/Management System/firebase.json', 'utf8'));
for (const site of fbJson.hosting) {
  const cspHeader = site.headers.flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy');
  assert.ok(cspHeader.value.includes('https://*.cloudfunctions.net'), `CSP for ${site.site} must allow *.cloudfunctions.net`);
  assert.ok(cspHeader.value.includes('https://*.a.run.app'), `CSP for ${site.site} must allow *.a.run.app`);
}

const indexesJson = JSON.parse(fs.readFileSync('c:/_DH Notebook/Management System/firestore.indexes.json', 'utf8'));
assert.ok(Array.isArray(indexesJson.indexes), 'firestore.indexes.json must parse cleanly');

// 3. B15: Verify slipStorageService uses asia-southeast1 and does not set fake verified fallback
const slipSrc = fs.readFileSync('c:/_DH Notebook/Management System/dh-backoffice-react/src/firebase/slipStorageService.js', 'utf8');
assert.ok(slipSrc.includes("getFunctions(app, 'asia-southeast1')"), 'slipStorageService must target asia-southeast1');
assert.ok(slipSrc.includes('ocrData: null'), 'fallback OCR must return ocrData: null');

console.log('✅ verify_billing_phase4: ALL ASSERTIONS PASSED');
