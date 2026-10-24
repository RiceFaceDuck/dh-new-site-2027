/**
 * 🧪 Verification Suite: Customer Ads & Omni-Search Parity
 * Path: Management System/tests/verifications/verify_customer_ads_and_omni_search.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEARCH_SERVICE = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/services/customerSearchService.js');
const FILTERS_HOOK = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerFilters.js');
const CUSTOMERS_HOOK = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomers.js');
const ROW_COMPONENT = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/components/layout/CustomerRow.jsx');
const HEADER_COMPONENT = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/components/layout/CustomerHeader.jsx');

console.log('================================================================');
console.log('🧪 VERIFY: CUSTOMER ADS & OMNI-SEARCH ENGINE');
console.log('================================================================\n');

// 1. Files exist
assert(fs.existsSync(SEARCH_SERVICE), 'customerSearchService.js must exist');
assert(fs.existsSync(FILTERS_HOOK), 'useCustomerFilters.js must exist');
assert(fs.existsSync(CUSTOMERS_HOOK), 'useCustomers.js must exist');
assert(fs.existsSync(ROW_COMPONENT), 'CustomerRow.jsx must exist');
assert(fs.existsSync(HEADER_COMPONENT), 'CustomerHeader.jsx must exist');
console.log('  ✅ [PASS] 1. All target files exist');

// 2. customerSearchService exports fetchCustomerAdsIndex & enrichCustomerWithAdData
const searchCode = fs.readFileSync(SEARCH_SERVICE, 'utf-8');
assert(searchCode.includes('export const fetchCustomerAdsIndex'), 'Must export fetchCustomerAdsIndex');
assert(searchCode.includes('CUSTOMER_ADS_CACHE_KEY'), 'Must define CUSTOMER_ADS_CACHE_KEY');
assert(searchCode.includes('export const clearCustomerAdsCache'), 'Must export clearCustomerAdsCache');
assert(searchCode.includes('export const enrichCustomerWithAdData'), 'Must export enrichCustomerWithAdData');
assert(searchCode.includes("getCollectionPath('partner_ads')"), 'Must read partner_ads collection');
console.log('  ✅ [PASS] 2. customerSearchService provides cached Ads index & enrich helpers');

// 3. useCustomers wires Ads index
const hookCode = fs.readFileSync(CUSTOMERS_HOOK, 'utf-8');
assert(hookCode.includes('fetchCustomerAdsIndex'), 'useCustomers must call fetchCustomerAdsIndex');
assert(hookCode.includes('enrichCustomerWithAdData'), 'useCustomers must enrich customers with ad data');
console.log('  ✅ [PASS] 3. useCustomers orchestrates ads index hydration');

// 4. CustomerRow renders Megaphone ad title subline
const rowCode = fs.readFileSync(ROW_COMPONENT, 'utf-8');
assert(rowCode.includes('Megaphone'), 'CustomerRow must import Megaphone icon');
assert(rowCode.includes('adStoreTitle'), 'CustomerRow must extract adStoreTitle');
assert(rowCode.includes('showAdBadge'), 'CustomerRow must condition ad badge display');
console.log('  ✅ [PASS] 4. CustomerRow visual badge for ads verified');

// 5. CustomerHeader placeholder
const headerCode = fs.readFileSync(HEADER_COMPONENT, 'utf-8');
assert(headerCode.includes('โฆษณา'), 'CustomerHeader placeholder must mention โฆษณา');
console.log('  ✅ [PASS] 5. CustomerHeader placeholder updated');

// 6. Test Filter Logic in isolation
// Simulate useCustomerFilters filtering logic
const mockCustomers = [
  {
    id: '7QCIEaAuxiU9d1cYuaO7WJIoZfn1',
    uid: '7QCIEaAuxiU9d1cYuaO7WJIoZfn1',
    accountId: '7QCIEAAU',
    accountName: 'อภิชาติ เอี้ยวสุวรรณ',
    displayName: 'อภิชาติ เอี้ยวสุวรรณ',
    phone: '095-275-5617',
    adStoreTitle: 'ดีไวซ์ ไอที',
    adSearchBlob: 'ดีไวซ์ ไอที ซ่อมโน๊ตบุ๊คภูเก็ต ซ่อมคอมภูเก็ต ซ่อมแมคบุ๊คภูเก็ต ซ่อมโน้ตบุค แม็คบุค ปริ้นเตอร์ มือถือ ข้าง แอดไวซ์ ภูเก็ต business_card 0952755617 7qcieaau',
    address: {
      addressLine: '156/52',
      subDistrict: 'ตลาดใหญ่',
      district: 'เมือง',
      province: 'ภูเก็ต',
      zipCode: '83000'
    }
  },
  {
    id: 'JMsiF3bfJzNS0EByDZVfIP2wwPu2',
    uid: 'JMsiF3bfJzNS0EByDZVfIP2wwPu2',
    accountId: 'JMSIF3BF',
    accountName: 'krittin krutnorasing',
    displayName: 'krittin krutnorasing',
    phone: '095-272-6574',
    adStoreTitle: 'ซ่อมคอมฮับ',
    adSearchBlob: 'ซ่อมคอมฮับ รับซ่อมคอมพิวเตอร์ โน้ตบุ๊ก หาดใหญ่ สงขลา business_card 0952726574 jmsif3bf',
    address: {
      addressLine: '99/1',
      subDistrict: 'หาดใหญ่',
      district: 'หาดใหญ่',
      province: 'สงขลา',
      zipCode: '90110'
    }
  }
];

function testFilter(customers, searchTerm) {
  const lower = searchTerm.toLowerCase().trim();
  const cleanDigitsSearch = lower.replace(/\D/g, '');
  const tokens = lower.split(/\s+/).filter(Boolean);

  return customers.filter(c => {
    const rawPhone = c.phone || c.phoneNumber || '';
    const cleanPhone = String(rawPhone).replace(/\D/g, '');
    const phoneMatch = (cleanDigitsSearch.length >= 3 && cleanPhone.includes(cleanDigitsSearch)) ||
                       (rawPhone && rawPhone.toLowerCase().includes(lower));

    let addressText = '';
    const addr = c.address || c.legacyAddress || c.shippingAddress;
    if (typeof addr === 'string') {
      addressText = addr.toLowerCase();
    } else if (addr && typeof addr === 'object') {
      addressText = [
        addr.fullAddress,
        addr.addressLine,
        addr.address,
        addr.subDistrict,
        addr.subdistrict,
        addr.district,
        addr.amphur,
        addr.province,
        addr.changwat,
        addr.zipCode,
        addr.postalCode
      ].filter(Boolean).join(' ').toLowerCase();
    }

    const adText = [
      c.adStoreTitle,
      c.adSearchBlob,
      c.storeProfile?.storeName,
      c.storeProfile?.description,
      c.storeProfile?.services,
      c.storeProfile?.landmarks,
      c.storeProfile?.openHours
    ].filter(Boolean).join(' ').toLowerCase();

    const extraText = [
      c.taxId,
      c.taxInfo?.taxId,
      c.logisticProvider,
      c.preferredCourier,
      c.shippingNotes,
      c.logisticNote,
      c.lineId,
      c.facebook,
      c.facebookUrl,
      c.storeWebsite,
      c.websiteUrl
    ].filter(Boolean).join(' ').toLowerCase();

    const isBasicMatch = (
      (c.accountId && c.accountId.toLowerCase().includes(lower)) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(lower)) ||
      (c.accountName && c.accountName.toLowerCase().includes(lower)) ||
      (c.displayName && c.displayName.toLowerCase().includes(lower)) ||
      (c.storeName && c.storeName.toLowerCase().includes(lower)) ||
      (c.contactName && c.contactName.toLowerCase().includes(lower)) ||
      (c.firstName && c.firstName.toLowerCase().includes(lower)) ||
      (c.lastName && c.lastName.toLowerCase().includes(lower)) ||
      (c.email && c.email.toLowerCase().includes(lower)) ||
      phoneMatch ||
      (c.id && c.id.toLowerCase().includes(lower)) ||
      (c.uid && c.uid.toLowerCase().includes(lower)) ||
      (addressText && addressText.includes(lower)) ||
      (adText && adText.includes(lower)) ||
      (extraText && extraText.includes(lower))
    );

    if (isBasicMatch) return true;

    if (tokens.length > 1) {
      const combinedSearchBlob = [
        c.accountId,
        c.customerCode,
        c.accountName,
        c.displayName,
        c.storeName,
        c.contactName,
        c.firstName,
        c.lastName,
        c.email,
        rawPhone,
        cleanPhone,
        c.id,
        c.uid,
        addressText,
        adText,
        extraText
      ].filter(Boolean).join(' ').toLowerCase();

      return tokens.every(token => combinedSearchBlob.includes(token));
    }

    return false;
  });
}

// Test A: Search by Ad Title "ดีไวซ์ ไอที"
const resA = testFilter(mockCustomers, 'ดีไวซ์ ไอที');
assert.strictEqual(resA.length, 1);
assert.strictEqual(resA[0].accountId, '7QCIEAAU');
console.log('  ✅ [PASS] 6A. Search by ad title "ดีไวซ์ ไอที" matches customer 7QCIEAAU');

// Test B: Search by Ad Description "ซ่อมคอมภูเก็ต"
const resB = testFilter(mockCustomers, 'ซ่อมคอมภูเก็ต');
assert.strictEqual(resB.length, 1);
assert.strictEqual(resB[0].accountId, '7QCIEAAU');
console.log('  ✅ [PASS] 6B. Search by ad description "ซ่อมคอมภูเก็ต" matches customer 7QCIEAAU');

// Test C: Search by Multi-Token "ดีไวซ์ ภูเก็ต"
const resC = testFilter(mockCustomers, 'ดีไวซ์ ภูเก็ต');
assert.strictEqual(resC.length, 1);
assert.strictEqual(resC[0].accountId, '7QCIEAAU');
console.log('  ✅ [PASS] 6C. Multi-token search "ดีไวซ์ ภูเก็ต" matches customer 7QCIEAAU');

// Test D: Search by Address SubDistrict "ตลาดใหญ่"
const resD = testFilter(mockCustomers, 'ตลาดใหญ่');
assert.strictEqual(resD.length, 1);
assert.strictEqual(resD[0].accountId, '7QCIEAAU');
console.log('  ✅ [PASS] 6D. Address search "ตลาดใหญ่" matches customer 7QCIEAAU');

// Test E: Search by Clean Digits Phone "0952755617"
const resE = testFilter(mockCustomers, '0952755617');
assert.strictEqual(resE.length, 1);
assert.strictEqual(resE[0].accountId, '7QCIEAAU');
console.log('  ✅ [PASS] 6E. Clean digits phone search "0952755617" matches customer 7QCIEAAU');

// Test F: Search by Another Ad Title "ซ่อมคอมฮับ"
const resF = testFilter(mockCustomers, 'ซ่อมคอมฮับ');
assert.strictEqual(resF.length, 1);
assert.strictEqual(resF[0].accountId, 'JMSIF3BF');
console.log('  ✅ [PASS] 6F. Search by ad title "ซ่อมคอมฮับ" matches customer JMSIF3BF');

console.log('\n🎉 ALL CUSTOMER ADS & OMNI-SEARCH TESTS PASSED (11/11)');
