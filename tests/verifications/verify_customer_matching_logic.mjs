import assert from 'node:assert/strict';
import {
  normalizePhone,
  normalizeThaiText,
  calculateCustomerMatchScore,
  analyzeProfileGaps,
  computeSafeGapFilling,
  findBestCustomerMatches
} from '../../dh-backoffice-react/src/pages/Customers/services/customerMatchingService.js';

console.log('🧪 Starting Phase 1 Verification: Customer Matching & Gap Analysis Service\n');

// 1. Test normalizePhone
console.log('Test 1: normalizePhone');
assert.equal(normalizePhone('088-917-8651'), '0889178651');
assert.equal(normalizePhone('+66889178651'), '0889178651');
assert.equal(normalizePhone('66889178651'), '0889178651');
assert.equal(normalizePhone('088 917 8651'), '0889178651');
assert.equal(normalizePhone(''), '');
assert.equal(normalizePhone(null), '');
console.log('  ✅ normalizePhone passed all cases.\n');

// 2. Test normalizeThaiText
console.log('Test 2: normalizeThaiText');
assert.equal(normalizeThaiText('ร้านคอมโปรฟิกซ์'), 'คอมโปรฟิกซ์');
assert.equal(normalizeThaiText('ช่างคอมโปรฟิกซ์'), 'คอมโปรฟิกซ์');
assert.equal(normalizeThaiText('คุณ ภวัต บุญมา'), 'ภวัตบุญมา');
assert.equal(normalizeThaiText('บจก. ดีไอวาย คอมพิวเตอร์'), 'ดีไอวายคอมพิวเตอร์');
assert.equal(normalizeThaiText('  คอมโปรฟิกซ์  '), 'คอมโปรฟิกซ์');
console.log('  ✅ normalizeThaiText prefix stripping passed all cases.\n');

// 3. Test calculateCustomerMatchScore (Exact Name & Thai Prefix Tolerance)
console.log('Test 3: calculateCustomerMatchScore with Thai prefix tolerance');
const parsedInput = {
  customerName: 'ร้านคอมโปรฟิกซ์',
  phone: '088-917-8651',
  zipCode: '11110'
};

const candidateA = {
  id: 'FYSISLBP',
  accountId: 'FYSISLBP',
  storeName: 'คอมโปรฟิกซ์',
  email: 'comprofix1998@gmail.com',
  creditPoints: 1000,
  tier: 'SILVER',
  role: 'Customer (สิทธิเดิม)',
  phone: '', // missing
  isManualCustomer: false // Web/Partner account!
};

const matchA = calculateCustomerMatchScore(parsedInput, candidateA);
console.log('  Score for Candidate A (FYSISLBP):', matchA.score, matchA.breakdown);
assert.ok(matchA.score >= 35, `Score should be at least 35 (name + storefront bonus), got ${matchA.score}`);
assert.equal(matchA.breakdown.name, 25, 'Normalized name should match 100% (25 pts)');
assert.equal(matchA.breakdown.storefrontBonus, 10, 'Should receive storefront bonus (+10 pts)');
console.log('  ✅ Scoring and storefront boost passed.\n');

// 4. Test analyzeProfileGaps
console.log('Test 4: analyzeProfileGaps');
const fullParsed = {
  customerName: 'คุณภวัต',
  storeName: 'ร้านคอมโปรฟิกซ์',
  phone: '088-917-8651',
  addressLine: '91/364 ม.2 พฤกษา14บี',
  subDistrict: 'บางคูรัด',
  district: 'บางบัวทอง',
  province: 'นนทบุรี',
  zipCode: '11110',
  preferredCourier: 'Flash Express'
};

const gaps = analyzeProfileGaps(candidateA, fullParsed);
console.log('  Existing Items:', gaps.existingItems.map(i => `${i.label}: ${i.value}`));
console.log('  Missing Items:', gaps.missingItems.map(i => i.label));
console.log('  Fillable Items:', gaps.fillableItems.map(i => `${i.label}: ${i.value}`));

assert.ok(gaps.missingItems.some(i => i.field === 'phone'), 'Must detect missing phone');
assert.ok(gaps.missingItems.some(i => i.field === 'address'), 'Must detect missing address');
assert.ok(gaps.missingItems.some(i => i.field === 'logistic'), 'Must detect missing courier');
assert.ok(gaps.fillableItems.some(i => i.field === 'phone'), 'Must detect fillable phone');
assert.ok(gaps.isStorefront === true, 'Must identify as storefront/partner');
console.log('  ✅ Gap Analysis successfully identified missing and fillable fields.\n');

// 5. Test computeSafeGapFilling (Strict Invariant: No Overwrites + Dual-Key Parity)
console.log('Test 5: computeSafeGapFilling');
const candidateExisting = {
  id: 'FYSISLBP',
  accountId: 'FYSISLBP',
  storeName: 'คอมโปรฟิกซ์',
  email: 'comprofix1998@gmail.com',
  phone: '', // empty -> should fill
  phoneNumber: '', // empty -> should fill
  contactName: 'นายศักดิ์', // already has value -> MUST NOT OVERWRITE
  addressLine: '', // empty -> should fill
  zipCode: '' // empty -> should fill
};

const fillResult = computeSafeGapFilling(candidateExisting, fullParsed);
console.log('  Generated Payload:', fillResult.payload);

assert.equal(fillResult.hasUpdates, true);
assert.equal(fillResult.payload.phone, '0889178651', 'Should set phone');
assert.equal(fillResult.payload.phoneNumber, '0889178651', 'Should set phoneNumber for dual-key parity');
assert.equal(fillResult.payload.contactName, undefined, 'Must NEVER overwrite existing contactName');
assert.equal(fillResult.payload.addressLine, '91/364 ม.2 พฤกษา14บี');
assert.equal(fillResult.payload.zipCode, '11110');
assert.equal(fillResult.payload.postalCode, '11110', 'Should set postalCode for dual-key parity');
assert.equal(fillResult.payload.preferredCourier, 'Flash Express');
assert.equal(fillResult.payload.logisticProvider, 'Flash Express', 'Should set logisticProvider for dual-key parity');
console.log('  ✅ Safe Gap-Filling strictly preserved existing data and enforced dual-key parity.\n');

// 6. Test findBestCustomerMatches (Ranking & Tiebreak)
console.log('Test 6: findBestCustomerMatches in-memory evaluation');
const directoryList = [
  { id: 'CUST1', accountId: 'CUST1', storeName: 'ร้านสมชายการช่าง', phone: '0811111111' },
  candidateA, // COMPROFIX (Name match + storefront bonus)
  { id: 'J4KDJZEK', accountId: 'J4KDJZEK', storeName: 'ร้านคอมโปรฟิกซ์', phone: '0889178651', isManualCustomer: true }
];

const matches = findBestCustomerMatches(fullParsed, directoryList, 30);
console.log('  Top Matches Found:', matches.length);
matches.forEach((m, idx) => {
  console.log(`    #${idx + 1}: ${m.candidate.storeName} (${m.candidate.accountId}) - Score: ${m.score} pts [${m.matchReasons.join(', ')}]`);
});

assert.ok(matches.length >= 2, 'Should find both Comprofix accounts');
assert.ok(matches[0].score >= matches[1].score, 'Top match must have highest score');
console.log('  ✅ In-memory ranking and candidate filtering passed.\n');

console.log('🎉 ALL PHASE 1 VERIFICATION TESTS PASSED SUCCESSFULLY! (Zero Errors)');
