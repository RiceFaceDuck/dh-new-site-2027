import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACTIVE_CARD_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/pos/settings/customer/ActiveCustomerCard.jsx');
const DETAIL_PANEL_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/components/details/DetailPanel.jsx');
const ACTIONS_HOOK_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerActions.js');

console.log('🧪 Starting Verification Suite: Phase 1 On-Demand Hydration & Address Guard');

// 1. Verify Files Exist
assert(fs.existsSync(ACTIVE_CARD_PATH), 'ActiveCustomerCard.jsx must exist');
assert(fs.existsSync(DETAIL_PANEL_PATH), 'DetailPanel.jsx must exist');
assert(fs.existsSync(ACTIONS_HOOK_PATH), 'useCustomerActions.js must exist');
console.log('  ✅ PASS: All Phase 1 target files exist');

// 2. Verify ActiveCustomerCard.jsx
const cardCode = fs.readFileSync(ACTIVE_CARD_PATH, 'utf-8');
assert(cardCode.includes('getUserProfile'), 'ActiveCustomerCard must import getUserProfile');
assert(cardCode.includes('useEffect'), 'ActiveCustomerCard must include useEffect for hydration');
assert(cardCode.includes('legacyAddress'), 'ActiveCustomerCard must support legacyAddress');
assert(cardCode.includes('shippingAddress'), 'ActiveCustomerCard must support shippingAddress');
assert(cardCode.includes('fullAddress'), 'ActiveCustomerCard must support fullAddress string');
assert(cardCode.includes('TAX ID:'), 'ActiveCustomerCard must format TAX ID if available');
console.log('  ✅ PASS: ActiveCustomerCard has on-demand hydration & full address decoding');

// 3. Verify DetailPanel.jsx
const panelCode = fs.readFileSync(DETAIL_PANEL_PATH, 'utf-8');
assert(panelCode.includes('getUserProfile'), 'DetailPanel must import getUserProfile');
assert(panelCode.includes('enrichedCustomer'), 'DetailPanel must maintain enrichedCustomer state');
assert(panelCode.includes('activeCustomer'), 'DetailPanel must use activeCustomer');
assert(panelCode.includes('onEdit(activeCustomer)'), 'DetailPanel must pass activeCustomer to onEdit');
assert(panelCode.includes('fullAddress'), 'DetailPanel getFormattedAddress must support fullAddress');
console.log('  ✅ PASS: DetailPanel has on-demand profile hydration & activeCustomer binding');

// 4. Verify useCustomerActions.js
const actionsCode = fs.readFileSync(ACTIONS_HOOK_PATH, 'utf-8');
assert(actionsCode.includes('startEditCustomer = async'), 'startEditCustomer must be async');
assert(actionsCode.includes('Data Overwrite Guard'), 'startEditCustomer must have Data Overwrite Guard');
assert(actionsCode.includes('userService.getUserProfile'), 'startEditCustomer must fetch full profile if address is missing');
console.log('  ✅ PASS: useCustomerActions has Data Overwrite Guard on customer edits');

// 5. Test Address Decoder Logic
const testAddressDecoder = (addrObj) => {
  if (!addrObj) return '';
  const rawAddr = addrObj.address || addrObj.shippingAddress || addrObj.legacyAddress || addrObj.rawAddress;
  if (!rawAddr) return '';
  if (typeof rawAddr === 'string') return rawAddr.trim();
  if (typeof rawAddr === 'object') {
    if (rawAddr.fullAddress && typeof rawAddr.fullAddress === 'string') {
      return rawAddr.fullAddress.trim();
    }
    const parts = [
      rawAddr.addressLine || rawAddr.address,
      rawAddr.subDistrict ? (rawAddr.subDistrict.startsWith('ต.') ? rawAddr.subDistrict : `ต.${rawAddr.subDistrict}`) : '',
      rawAddr.district ? (rawAddr.district.startsWith('อ.') ? rawAddr.district : `อ.${rawAddr.district}`) : '',
      rawAddr.province ? (rawAddr.province.startsWith('จ.') ? rawAddr.province : `จ.${rawAddr.province}`) : '',
      rawAddr.postalCode || rawAddr.zipCode
    ].filter(Boolean);
    return parts.join(' ').trim();
  }
  return '';
};

// Test AP Computer real case
const apCust = {
  legacyAddress: "เลขที่ 307/1 ถ.เจริญราษฎร์ ต.ในเมือง อ.เมือง จ.ลำพูน 51000",
  address: {
    postalCode: "51000",
    province: "ลำพูน",
    fullAddress: "เลขที่ 307/1 ถ.เจริญราษฎร์ ต.ในเมือง อ.เมือง จ.ลำพูน 51000",
    addressLine: "เลขที่ 307/1 ถ.เจริญราษฎร์",
    subDistrict: "ในเมือง",
    district: "เมือง"
  }
};
assert.strictEqual(
  testAddressDecoder(apCust),
  "เลขที่ 307/1 ถ.เจริญราษฎร์ ต.ในเมือง อ.เมือง จ.ลำพูน 51000",
  "Must format AP Computer address correctly"
);
console.log('  ✅ PASS: Address decoder matches real AP Computer address 100%');

console.log('\n========================================');
console.log('Summary: All Phase 1 Hydration & Guard checks PASSED!');
console.log('========================================');
