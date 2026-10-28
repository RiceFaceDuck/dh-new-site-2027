/**
 * Empirical Verification & Adversarial Stress Suite for Smart Quick Paste,
 * Multi-Phone Parser, Quota Zero-Leak, and Business Name Priority.
 * 
 * Path: Management System/tests/verifications/verify_quick_paste_final_stage.mjs
 * Centralized Test Hub compliance: tests/verifications/ only.
 */

import { register } from 'node:module';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Register ESM loader for extensionless specifiers in dh-backoffice-react
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (e) {
    for (const ext of ['.js', '.jsx', '/index.js', '/index.jsx']) {
      try {
        return await nextResolve(specifier + ext, context);
      } catch (e2) {}
    }
    throw e;
  }
}
`), import.meta.url);

import { pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Import modules under test using file:// URLs for Windows compatibility
const { parseCustomerAddress, parseThaiAddress } = await import(
  pathToFileURL(path.join(projectRoot, 'dh-shared/src/utils/thaiAddressParser.js')).href
);

const {
  normalizePhone,
  normalizeThaiText,
  calculateCustomerMatchScore,
  analyzeProfileGaps,
  computeSafeGapFilling,
  findBestCustomerMatches
} = await import(
  pathToFileURL(path.join(projectRoot, 'dh-backoffice-react/src/pages/Customers/services/customerMatchingService.js')).href
);

const { quickCustomerService } = await import(
  pathToFileURL(path.join(projectRoot, 'dh-backoffice-react/src/components/billing/pos/settings/customer/services/quickCustomerService.js')).href
);

// Test Counters & Reporting
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const findings = [];

function check(title, condition, extraInfo = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ [PASS] ${title} ${extraInfo ? `(${extraInfo})` : ''}`);
  } else {
    failedAssertions++;
    const errMsg = `❌ [FAIL / DISCREPANCY] ${title} ${extraInfo ? `: ${extraInfo}` : ''}`;
    console.error(`  ${errMsg}`);
    findings.push({ title, extraInfo });
  }
}

async function runTestSuite() {
  console.log('='.repeat(80));
  console.log('  STAGE FINAL REVIEW: SMART QUICK PASTE & MULTI-PHONE VERIFICATION SUITE');
  console.log('='.repeat(80));

  // =========================================================================
  // SECTION 1: thaiAddressParser.js - Real-World & Adversarial Vectors
  // =========================================================================
  console.log('\n--- [SECTION 1] thaiAddressParser.js Vectors ---');

  // Vector 1: User's Real Test Vector
  console.log('\n[Vector 1.1] User Prompt Real Test Vector:');
  const v1Input = 'Micro computer & Service (โปษยา ผั่งวิภาส) 081-811-9214, 02-944-4511 เลขที่ 123/45 ถนนรามอินทรา แขวงคันนายาว เขตคันนายาว กทม. 10230';
  const v1 = parseCustomerAddress(v1Input);

  check('Vector 1: storeName extracted', v1.storeName === 'Micro computer & Service', `Got: "${v1.storeName}"`);
  check('Vector 1: accountName equals storeName', v1.accountName === 'Micro computer & Service', `Got: "${v1.accountName}"`);
  check('Vector 1: contactName extracted from parentheses', v1.contactName === 'โปษยา ผั่งวิภาส', `Got: "${v1.contactName}"`);
  check('Vector 1: primary phone is mobile (0818119214)', v1.phone === '0818119214', `Got: "${v1.phone}"`);
  check('Vector 1: phones array contains mobile and landline', 
    Array.isArray(v1.phones) && v1.phones.includes('0818119214') && v1.phones.includes('029444511') && v1.phones.length === 2,
    `Got: ${JSON.stringify(v1.phones)}`
  );
  check('Vector 1: formattedPhones array correctly formatted',
    Array.isArray(v1.formattedPhones) && v1.formattedPhones[0] === '081-811-9214' && v1.formattedPhones[1] === '02-944-4511',
    `Got: ${JSON.stringify(v1.formattedPhones)}`
  );
  check('Vector 1: subDistrict extracted as คันนายาว', v1.subDistrict === 'คันนายาว', `Got: "${v1.subDistrict}"`);
  check('Vector 1: district extracted as คันนายาว', v1.district === 'คันนายาว', `Got: "${v1.district}"`);
  check('Vector 1: postalCode extracted as 10230', v1.postalCode === '10230', `Got: "${v1.postalCode}"`);
  check('Vector 1: zipCode matches postalCode (dual-key)', v1.zipCode === '10230', `Got: "${v1.zipCode}"`);

  // Challenger Deep Inspection on Vector 1 Province & House Number Slash
  const v1ProvinceMatched = (v1.province === 'กรุงเทพมหานคร');
  check('Vector 1 Province: "กทม." resolved to กรุงเทพมหานคร', 
    v1ProvinceMatched, 
    `Actual province: "${v1.province}". Note: thaiAddressParser regex fails when กทม has a period "." (กทม.)`
  );

  const v1SlashPreserved = v1.addressLine.includes('123/45');
  check('Vector 1 Address: House number slash "123/45" preserved',
    v1SlashPreserved,
    `Actual addressLine: "${v1.addressLine}". Note: regex line 78 workingText.replace(/[\\/\\,\\;]/g, ' ') stripped slash to "123 45"`
  );

  // Vector 1.1b: Test same vector with "กทม" (no period) to confirm root cause
  const v1bInput = 'Micro computer & Service (โปษยา ผั่งวิภาส) 081-811-9214, 02-944-4511 เลขที่ 123/45 ถนนรามอินทรา แขวงคันนายาว เขตคันนายาว กทม 10230';
  const v1b = parseCustomerAddress(v1bInput);
  check('Vector 1b: "กทม" (without period) resolves to กรุงเทพมหานคร',
    v1b.province === 'กรุงเทพมหานคร',
    `Got: "${v1b.province}"`
  );

  // Vector 1.2: Multi-phone extraction with various delimiters
  console.log('\n[Vector 1.2] Multi-Phone Delimiters & Prefixes:');

  // Delimiter: Slash '/'
  const slashPhones = parseCustomerAddress('ร้าน A 081-234-5678 / 092-345-6789 กทม 10110');
  check('Multi-Phone Slash "/": extracts 2 mobile phones',
    slashPhones.phones.length === 2 && slashPhones.phones[0] === '0812345678' && slashPhones.phones[1] === '0923456789',
    `Phones: ${JSON.stringify(slashPhones.phones)}`
  );

  // 3+ Phones Stress Test
  const triplePhones = parseCustomerAddress('ร้าน Triple 081-111-1111 / 082-222-2222, 02-333-3333 กทม 10110');
  check('Multi-Phone Stress: 3 phones extracted in single paste',
    triplePhones.phones.length === 3 && triplePhones.phones.includes('0811111111') && triplePhones.phones.includes('0822222222') && triplePhones.phones.includes('023333333'),
    `Phones: ${JSON.stringify(triplePhones.phones)}`
  );

  // Delimiter: Comma ',' with Landline + Mobile
  const commaPhones = parseCustomerAddress('ร้าน B 02-123-4567, 089-999-8888 เชียงใหม่ 50000');
  check('Multi-Phone Comma ",": extracts landline and mobile',
    commaPhones.phones.includes('021234567') && commaPhones.phones.includes('0899998888'),
    `Phones: ${JSON.stringify(commaPhones.phones)}`
  );
  check('Multi-Phone Priority: Mobile 089-999-8888 prioritized over 02-123-4567',
    commaPhones.phone === '0899998888',
    `Primary phone: "${commaPhones.phone}"`
  );

  // International prefix: +66 mobile
  const intlMobile = parseCustomerAddress('ร้าน C +66 81 234 5678 ชลบุรี 20000');
  check('Prefix +66 Mobile: converted to 0812345678',
    intlMobile.phone === '0812345678' && intlMobile.phones[0] === '0812345678',
    `Phone: "${intlMobile.phone}"`
  );

  // International prefix: +66 landline
  const intlLandline = parseCustomerAddress('ร้าน D +66 2 944 4511 นนทบุรี 11000');
  check('Prefix +66 Landline: converted to 029444511 (9 digits)',
    intlLandline.phone === '029444511' && intlLandline.phones[0] === '029444511',
    `Phone: "${intlLandline.phone}"`
  );

  // Keywords: "โทร" and "เบอร์"
  const keywordPhones = parseCustomerAddress('ร้าน E โทร 081-811-9214, เบอร์ 02-944-4511');
  check('Prefix keywords "โทร" / "เบอร์": cleanly extracted and cleaned from address',
    keywordPhones.phones.includes('0818119214') && keywordPhones.phones.includes('029444511'),
    `Phones: ${JSON.stringify(keywordPhones.phones)}`
  );

  // Adversarial: Parenthesized area codes e.g. "(081) 811-9214"
  const parenPhoneInput = parseCustomerAddress('นาย ทดสอบ (081) 811-9214 นนทบุรี 11000');
  check('Adversarial Phone: Parenthesized area code "(081) 811-9214" handled',
    parenPhoneInput.phones.length > 0 && parenPhoneInput.phone === '0818119214',
    `Actual phone: "${parenPhoneInput.phone}". Note: regex /(?:\\+?66|0)[- ]?\\d{1,2}[- ]?\\d{3,4}[- ]?\\d{3,4}/g does not match area code enclosed in parentheses "(081)"`
  );

  // Vector 1.3: Bangkok addresses without explicit "แขวง"/"เขต" keywords
  console.log('\n[Vector 1.3] Bangkok Addresses Without แขวง/เขต Keywords:');
  const bkkNoKeywords = parseCustomerAddress('สะพานสอง วังทองหลาง กทม 10310');
  check('Bangkok Without แขวง/เขต: province extracted as กรุงเทพมหานคร',
    bkkNoKeywords.province === 'กรุงเทพมหานคร',
    `Got province: "${bkkNoKeywords.province}"`
  );
  check('Bangkok Without แขวง/เขต: postalCode extracted as 10310',
    bkkNoKeywords.postalCode === '10310',
    `Got postalCode: "${bkkNoKeywords.postalCode}"`
  );
  check('Bangkok Without แขวง/เขต: addressLine preserves words before province',
    bkkNoKeywords.addressLine.includes('สะพานสอง') && bkkNoKeywords.addressLine.includes('วังทองหลาง'),
    `Got addressLine: "${bkkNoKeywords.addressLine}"`
  );
  const bkkDistrictExtracted = (bkkNoKeywords.district === 'วังทองหลาง');
  check('Bangkok Without แขวง/เขต: subDistrict/district parsed into separate fields',
    bkkDistrictExtracted,
    `Actual district: "${bkkNoKeywords.district}", subDistrict: "${bkkNoKeywords.subDistrict}". Note: without explicit keywords "เขต"/"แขวง", stays in addressLine`
  );

  // Vector 1.4: Normal Single Name Without Parentheses
  console.log('\n[Vector 1.4] Normal Single Name Without Parentheses:');
  const singleNameInput = 'สมชาย เข็มกลัด 0812345678 เลขที่ 99/9 หมู่ 2 ต.บางรักพัฒนา อ.บางบัวทอง จ.นนทบุรี 11110';
  const singleName = parseCustomerAddress(singleNameInput);
  check('Single Name: accountName extracted as สมชาย เข็มกลัด',
    singleName.accountName === 'สมชาย เข็มกลัด',
    `Got: "${singleName.accountName}"`
  );
  check('Single Name: contactName extracted as สมชาย เข็มกลัด',
    singleName.contactName === 'สมชาย เข็มกลัด',
    `Got: "${singleName.contactName}"`
  );
  check('Single Name: phone extracted as 0812345678',
    singleName.phone === '0812345678',
    `Got: "${singleName.phone}"`
  );
  check('Single Name: subDistrict extracted as บางรักพัฒนา',
    singleName.subDistrict === 'บางรักพัฒนา',
    `Got: "${singleName.subDistrict}"`
  );
  check('Single Name: district extracted as บางบัวทอง',
    singleName.district === 'บางบัวทอง',
    `Got: "${singleName.district}"`
  );
  check('Single Name: province extracted as นนทบุรี',
    singleName.province === 'นนทบุรี',
    `Got: "${singleName.province}"`
  );
  check('Single Name: postalCode extracted as 11110',
    singleName.postalCode === '11110',
    `Got: "${singleName.postalCode}"`
  );

  // =========================================================================
  // SECTION 2: customerMatchingService.js - Normalization, Matching & Gap Filling
  // =========================================================================
  console.log('\n--- [SECTION 2] customerMatchingService.js ---');

  // 2.1 normalizePhone tests
  console.log('\n[2.1] normalizePhone assertions:');
  check('normalizePhone mobile 081-811-9214', normalizePhone('081-811-9214') === '0818119214');
  check('normalizePhone +66 81 811 9214', normalizePhone('+66 81 811 9214') === '0818119214');
  check('normalizePhone landline 02-944-4511', normalizePhone('02-944-4511') === '029444511');
  check('normalizePhone +66 2 944 4511', normalizePhone('+66 2 944 4511') === '029444511');
  check('normalizePhone empty / invalid returns empty string', normalizePhone('') === '' && normalizePhone(null) === '');

  // 2.2 Multi-phone array matching against mock directory chunks
  console.log('\n[2.2] Multi-Phone Array In-Memory Matching:');
  const mockDirectory = [
    {
      id: 'cust_001',
      accountId: 'DH-CUST-001',
      storeName: 'Micro computer & Service',
      displayName: 'Micro computer & Service',
      phone: '029444511',
      phones: ['029444511'],
      zipCode: '10230',
      province: 'กรุงเทพมหานคร'
    },
    {
      id: 'cust_002',
      accountId: 'DH-CUST-002',
      storeName: 'สมชาย การค้า',
      displayName: 'สมชาย การค้า',
      phone: '0891234567',
      phones: ['0891234567'],
      zipCode: '11110'
    }
  ];

  const parsedIncoming = {
    storeName: 'Micro computer & Service',
    contactName: 'โปษยา ผั่งวิภาส',
    phone: '0818119214',
    phones: ['0818119214', '029444511'],
    zipCode: '10230'
  };

  const matchScore = calculateCustomerMatchScore(parsedIncoming, mockDirectory[0]);
  check('Match Score on phone + storeName + zip: >= 70 pts',
    matchScore.score >= 70,
    `Score: ${matchScore.score}, Breakdown: ${JSON.stringify(matchScore.breakdown)}`
  );
  check('Match Breakdown includes phone 45 pts', matchScore.breakdown.phone === 45);
  check('Match Breakdown includes name 25 pts', matchScore.breakdown.name === 25);
  check('Match Breakdown includes address zip 10 pts', matchScore.breakdown.address === 10);
  check('Multi-Phone matches across candidate.phones array',
    matchScore.matchReasons.some(r => r.includes('เบอร์โทรศัพท์ตรงกัน')),
    `Reasons: ${matchScore.matchReasons.join(', ')}`
  );

  const bestMatches = findBestCustomerMatches(parsedIncoming, mockDirectory, 35, 3);
  check('findBestCustomerMatches finds cust_001 as top match',
    bestMatches.length > 0 && bestMatches[0].candidate.id === 'cust_001',
    `Top candidate: ${bestMatches[0]?.candidate?.id}`
  );

  // Storefront Golden Record Priority & Bonus Test
  const mockWithStorefront = [
    {
      id: 'cust_manual',
      storeName: 'Micro computer & Service',
      phone: '0818119214',
      isManualCustomer: true,
      creditPoints: 0
    },
    {
      id: 'cust_storefront',
      storeName: 'Micro computer & Service',
      phone: '0818119214',
      email: 'micro@partner.com',
      isWebRegistered: true,
      creditPoints: 250
    }
  ];

  const sfScore = calculateCustomerMatchScore(parsedIncoming, mockWithStorefront[1]);
  check('Storefront Account: +10 pts bonus applied',
    sfScore.breakdown.storefrontBonus === 10,
    `Breakdown: ${JSON.stringify(sfScore.breakdown)}`
  );

  const sfMatches = findBestCustomerMatches(parsedIncoming, mockWithStorefront, 35, 3);
  check('findBestCustomerMatches: Storefront account prioritized over manual entry',
    sfMatches[0]?.candidate?.id === 'cust_storefront',
    `Top Candidate: ${sfMatches[0]?.candidate?.id}`
  );

  // 2.3 Safe Gap Filling with phones and facebook
  console.log('\n[2.3] computeSafeGapFilling Invariant Verification:');
  const existingCandidate = {
    id: 'cust_001',
    accountId: 'DH-CUST-001',
    storeName: 'Micro computer & Service',
    contactName: 'คุณเอ็กซ์', // Existing non-empty field
    phone: '029444511',
    phones: ['029444511'],
    addressLine: '123 ถนนรามอินทรา',
    province: 'กรุงเทพมหานคร',
    lineId: '' // Empty field
    // facebook is missing entirely
  };

  const incomingParsedData = {
    storeName: 'Micro computer & Service (โปษยา)',
    contactName: 'โปษยา ผั่งวิภาส',
    phones: ['0818119214', '029444511'],
    lineId: 'micro_service',
    facebook: 'MicroComputerServiceTH'
  };

  const gapFillResult = computeSafeGapFilling(existingCandidate, incomingParsedData);
  check('Safe Gap Filling reports hasUpdates = true', gapFillResult.hasUpdates === true);
  check('Existing contactName "คุณเอ็กซ์" NOT overwritten',
    gapFillResult.payload.contactName === undefined,
    `Payload contactName: ${gapFillResult.payload.contactName}`
  );
  check('Candidate phones array expanded without duplicates: [029444511, 0818119214]',
    Array.isArray(gapFillResult.payload.phones) &&
    gapFillResult.payload.phones.length === 2 &&
    gapFillResult.payload.phones.includes('029444511') &&
    gapFillResult.payload.phones.includes('0818119214'),
    `Payload phones: ${JSON.stringify(gapFillResult.payload.phones)}`
  );
  check('Missing lineId filled with "micro_service"', gapFillResult.payload.lineId === 'micro_service');
  check('Missing facebook filled with dual-key (facebook & facebookUrl)',
    gapFillResult.payload.facebook === 'MicroComputerServiceTH' &&
    gapFillResult.payload.facebookUrl === 'MicroComputerServiceTH',
    `facebook: ${gapFillResult.payload.facebook}`
  );
  check('payload has updatedAt timestamp', typeof gapFillResult.payload.updatedAt === 'number');

  // =========================================================================
  // SECTION 3: quickCustomerService.js - Payload Construction & Quota Zero-Leak
  // =========================================================================
  console.log('\n--- [SECTION 3] quickCustomerService.js ---');

  // 3.1 Payload construction with phones, storeName, contactName
  console.log('\n[3.1] buildCustomerPayload assertions:');
  const parsedForPayload = {
    accountName: 'Micro computer & Service',
    storeName: 'Micro computer & Service',
    contactName: 'โปษยา ผั่งวิภาส',
    phone: '0818119214',
    phones: ['0818119214', '029444511'],
    email: 'micro@service.com',
    lineId: '@microcomp',
    facebook: 'microservice',
    preferredCourier: 'Flash',
    shippingNotes: 'ห้ามโยน',
    addressLine: '123/45 ถนนรามอินทรา',
    subDistrict: 'คันนายาว',
    district: 'คันนายาว',
    province: 'กรุงเทพมหานคร',
    postalCode: '10230'
  };

  const payload = quickCustomerService.buildCustomerPayload(parsedForPayload, 'Wholesale / Mechanic');
  check('Payload storeName matches business name', payload.storeName === 'Micro computer & Service');
  check('Payload accountName matches business name', payload.accountName === 'Micro computer & Service');
  check('Payload displayName matches business name', payload.displayName === 'Micro computer & Service');
  check('Payload contactName matches secondary person', payload.contactName === 'โปษยา ผั่งวิภาส');
  check('Payload firstName matches secondary person', payload.firstName === 'โปษยา ผั่งวิภาส');
  check('Payload primary phone matches 0818119214', payload.phone === '0818119214');
  check('Payload phones array contains all extracted phones',
    Array.isArray(payload.phones) && payload.phones.length === 2 && payload.phones.includes('029444511'),
    `Phones: ${JSON.stringify(payload.phones)}`
  );
  check('Payload role matches Wholesale / Mechanic', payload.role === 'Wholesale / Mechanic');
  check('Payload Dual-Key courier: preferredCourier & logisticProvider',
    payload.preferredCourier === 'Flash' && payload.logisticProvider === 'Flash'
  );
  check('Payload Dual-Key notes: shippingNotes & logisticNote',
    payload.shippingNotes === 'ห้ามโยน' && payload.logisticNote === 'ห้ามโยน'
  );
  check('Payload Dual-Key facebook: facebook & facebookUrl',
    payload.facebook === 'microservice' && payload.facebookUrl === 'microservice'
  );
  check('Payload structured address object populated',
    payload.address && payload.address.postalCode === '10230' && payload.address.zipCode === '10230'
  );

  // 3.2 In-memory duplicate check (0 read warm cache)
  console.log('\n[3.2] Quota Zero-Leak In-Memory Duplicate Check:');
  const warmCacheExisting = [
    {
      id: 'cust_existing_101',
      storeName: 'Micro computer & Service',
      displayName: 'Micro computer & Service',
      phones: ['029444511'],
      zipCode: '10230'
    }
  ];

  // Spy to verify executeCreateCustomer is NEVER called when duplicates are found
  let firestoreWriteTriggered = false;
  const originalExecuteCreate = quickCustomerService.executeCreateCustomer;
  quickCustomerService.executeCreateCustomer = async () => {
    firestoreWriteTriggered = true;
    return { uid: 'should_not_be_called' };
  };

  const dupResult = await quickCustomerService.checkDuplicateAndCreate(
    parsedForPayload,
    'Wholesale / Mechanic',
    warmCacheExisting
  );

  // Restore original
  quickCustomerService.executeCreateCustomer = originalExecuteCreate;

  check('checkDuplicateAndCreate flags duplicate = true for warm cache match', dupResult.isDuplicate === true);
  check('checkDuplicateAndCreate returns matched candidates',
    Array.isArray(dupResult.duplicates) && dupResult.duplicates.length > 0 && dupResult.duplicates[0].id === 'cust_existing_101',
    `Found: ${dupResult.duplicates?.[0]?.id}`
  );
  check('checkDuplicateAndCreate returned candidate includes matchScore >= 70',
    dupResult.duplicates[0]?.matchScore >= 70,
    `Score: ${dupResult.duplicates?.[0]?.matchScore}`
  );
  check('Quota Zero-Leak: Zero Firestore write/query triggered during in-memory check',
    firestoreWriteTriggered === false,
    `Firestore write triggered: ${firestoreWriteTriggered}`
  );

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`  VERIFICATION RESULTS: ${passedAssertions} / ${totalAssertions} Checks Passed`);
  console.log(`  Passed: ${passedAssertions} | Failed/Discrepancies: ${failedAssertions}`);
  console.log('='.repeat(80));

  if (findings.length > 0) {
    console.log('\n🔍 EMPIRICAL CHALLENGER DISCREPANCIES / EDGE CASES FOUND:');
    findings.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.title}] -> ${f.extraInfo}`);
    });
  } else {
    console.log('\n🎉 ALL CHECKS PASSED PERFECTLY WITH ZERO DISCREPANCIES!');
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
