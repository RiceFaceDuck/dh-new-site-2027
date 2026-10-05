import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CUSTOMER_MODAL_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/components/forms/CustomerModal.jsx');

console.log('🧪 [Test Suite] Phase 3: CustomerModal Smart Paste Verification');

// 1. Verify file exists
assert(fs.existsSync(CUSTOMER_MODAL_PATH), 'CustomerModal.jsx must exist');
const modalCode = fs.readFileSync(CUSTOMER_MODAL_PATH, 'utf-8');

// 2. Verify Imports & Hook State
assert(modalCode.includes('import { parseCustomerAddress } from \'dh-shared\''), 'Must import parseCustomerAddress from dh-shared');
assert(modalCode.includes('Sparkles'), 'Must import Sparkles icon');
assert(modalCode.includes('const [rawInputText, setRawInputText] = useState'), 'Must declare rawInputText state');
assert(modalCode.includes('const handlePasteTextChange = (text) =>'), 'Must declare handlePasteTextChange');

// 3. Verify Form State mapping in handlePasteTextChange
assert(modalCode.includes('storeName: parsed.storeName || parsed.accountName || prev.storeName'), 'Must map storeName properly');
assert(modalCode.includes('contactName: parsed.contactName || prev.contactName'), 'Must map contactName properly');
assert(modalCode.includes('firstName: parsed.contactName || prev.firstName'), 'Must map firstName properly');
assert(modalCode.includes('logisticProvider: parsed.logisticProvider || prev.logisticProvider'), 'Must map logisticProvider properly');
assert(modalCode.includes('preferredCourier: parsed.preferredCourier || prev.preferredCourier'), 'Must map preferredCourier properly');
assert(modalCode.includes('zipCode: parsed.zipCode'), 'Must map address.zipCode properly');
assert(modalCode.includes('postalCode: parsed.postalCode'), 'Must map address.postalCode properly');

// 4. Verify JSX UI Component rendered in Form
assert(modalCode.includes('Smart Real-time Parser'), 'Must render Smart Real-time Parser badge');
assert(modalCode.includes('handlePasteTextChange(e.target.value)'), 'Textarea must bind to handlePasteTextChange');
assert(modalCode.includes('วางข้อมูลลูกค้าชุดเดียวที่นี่'), 'Must include paste prompt label');

// 5. Functional Simulation with dh-shared parseCustomerAddress
const parserModulePath = path.resolve(__dirname, '../../dh-shared/src/utils/thaiAddressParser.js');
const { parseCustomerAddress } = await import(`file://${parserModulePath.replace(/\\/g, '/')}`);

const rawSample = `ร้าน ชาเล่ต์คอมพิวเตอร์ คุณ นิตยา แซ่ลี้ 089-1234567 45/1 ม.3 ซอยสุขุมวิท 101/1 แขวงบางจาก เขตพระโขนง กทม 10260 (ส่ง Flash Express ด่วน)`;

let simulatedFormData = {
  accountName: '',
  storeName: '',
  contactName: '',
  firstName: '',
  phone: '',
  email: '',
  lineId: '',
  address: { addressLine: '', subDistrict: '', district: '', province: '', zipCode: '' }
};

// Simulate handlePasteTextChange
const parsed = parseCustomerAddress(rawSample);
simulatedFormData = {
  ...simulatedFormData,
  accountName: parsed.accountName || simulatedFormData.accountName,
  storeName: parsed.storeName || parsed.accountName || simulatedFormData.storeName,
  contactName: parsed.contactName || simulatedFormData.contactName,
  firstName: parsed.contactName || simulatedFormData.firstName,
  phone: parsed.phone || simulatedFormData.phone,
  logisticProvider: parsed.logisticProvider || simulatedFormData.logisticProvider,
  preferredCourier: parsed.preferredCourier || simulatedFormData.preferredCourier,
  address: {
    ...simulatedFormData.address,
    addressLine: parsed.addressLine || simulatedFormData.address.addressLine,
    subDistrict: parsed.subDistrict || simulatedFormData.address.subDistrict,
    district: parsed.district || simulatedFormData.address.district,
    province: parsed.province || simulatedFormData.address.province,
    zipCode: parsed.zipCode || simulatedFormData.address.zipCode,
    postalCode: parsed.postalCode || simulatedFormData.address.postalCode
  }
};

assert.strictEqual(simulatedFormData.storeName, 'ร้าน ชาเล่ต์คอมพิวเตอร์', 'Store name should be ร้าน ชาเล่ต์คอมพิวเตอร์');
assert.strictEqual(simulatedFormData.contactName, 'คุณ นิตยา แซ่ลี้', 'Contact name should be คุณ นิตยา แซ่ลี้');
assert.strictEqual(simulatedFormData.phone, '0891234567', 'Phone should be 0891234567');
assert.strictEqual(simulatedFormData.address.zipCode, '10260', 'ZipCode should be 10260');
assert.strictEqual(simulatedFormData.address.postalCode, '10260', 'PostalCode should be 10260');
assert.strictEqual(simulatedFormData.logisticProvider, 'Flash', 'Logistic provider should be Flash');
assert.strictEqual(simulatedFormData.preferredCourier, 'Flash', 'Preferred courier should be Flash');

console.log('✅ All Phase 3 verifications passed successfully (5/5 checks PASS)!');
