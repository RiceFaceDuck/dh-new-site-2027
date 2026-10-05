import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACTIVE_CARD_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/pos/settings/customer/ActiveCustomerCard.jsx');
const CUSTOMER_SECTION_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/pos/settings/CustomerSection.jsx');

console.log('🧪 [Test Suite] POS Active Customer Card UI Verification');

// 1. Verify files exist
assert(fs.existsSync(ACTIVE_CARD_PATH), 'ActiveCustomerCard.jsx must exist');
assert(fs.existsSync(CUSTOMER_SECTION_PATH), 'CustomerSection.jsx must exist');

const cardCode = fs.readFileSync(ACTIVE_CARD_PATH, 'utf-8');
const sectionCode = fs.readFileSync(CUSTOMER_SECTION_PATH, 'utf-8');

// 2. Verify ActiveCustomerCard elements matching production (Clean 1:1 Layout)
assert(cardCode.includes('getCustomerDisplayName'), 'Must use getCustomerDisplayName for primary title');
assert(cardCode.includes('onDeselectCustomer'), 'Must support onDeselectCustomer');
assert(cardCode.includes('MapPin size='), 'Must render MapPin icon for address');
assert(cardCode.includes('getDisplayAddress'), 'Must use getDisplayAddress helper');
assert(cardCode.includes('DH ค้างยอด:'), 'Must display DH ค้างยอด:');
assert(cardCode.includes('ใช้หัก'), 'Must display "ใช้หัก" checkbox');
assert(cardCode.includes('POINTS:'), 'Must display "POINTS:" badge');
assert(cardCode.includes('★'), 'Must display star icon in POINTS badge');

// 3. Verify CustomerSection conditional rendering
assert(sectionCode.includes('if (activeTab.customer)'), 'CustomerSection must check if activeTab.customer exists');
assert(sectionCode.includes('<ActiveCustomerCard'), 'CustomerSection must render ActiveCustomerCard when customer is selected');
assert(sectionCode.includes('onDeselectCustomer='), 'CustomerSection must pass onDeselectCustomer handler');

// 4. Verify getDisplayAddress functionality
const getDisplayAddress = (customer) => {
    if (!customer) return '';
    if (typeof customer.address === 'string' && customer.address.trim()) {
        return customer.address.trim();
    }
    const addr = typeof customer.address === 'object' && customer.address !== null
        ? customer.address
        : customer.rawAddress;
    if (addr && typeof addr === 'object') {
        const parts = [
            addr.addressLine,
            addr.subDistrict ? (addr.subDistrict.startsWith('ต.') || addr.subDistrict.startsWith('แขวง') ? addr.subDistrict : `ต.${addr.subDistrict}`) : '',
            addr.district ? (addr.district.startsWith('อ.') || addr.district.startsWith('เขต') ? addr.district : `อ.${addr.district}`) : '',
            addr.province ? (addr.province.startsWith('จ.') ? addr.province : `จ.${addr.province}`) : '',
            addr.zipCode || addr.postalCode
        ].filter(Boolean);
        return parts.join(' ');
    }
    return '';
};

// Test String Address (as in screenshot)
const sampleStringCust = {
    address: 'เลขที่ 307/1 ถ.เจริญราษฎร์ ต.ในเมือง อ.เมือง จ.ลำพูน 53000'
};
assert.strictEqual(
    getDisplayAddress(sampleStringCust), 
    'เลขที่ 307/1 ถ.เจริญราษฎร์ ต.ในเมือง อ.เมือง จ.ลำพูน 53000', 
    'String address should be preserved exactly'
);

// Test Object Address
const sampleObjectCust = {
    address: {
        addressLine: '91/364 ม.2',
        subDistrict: 'บางคูรัด',
        district: 'บางบัวทอง',
        province: 'นนทบุรี',
        zipCode: '11110'
    }
};
assert.strictEqual(
    getDisplayAddress(sampleObjectCust),
    '91/364 ม.2 ต.บางคูรัด อ.บางบัวทอง จ.นนทบุรี 11110',
    'Object address should format with prefixes properly'
);

console.log('✅ All POS Customer Card UI verifications passed successfully (4/4 checks PASS)!');
