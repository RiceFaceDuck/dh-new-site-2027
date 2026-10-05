import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUICK_ADD_MODAL_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/pos/settings/customer/QuickAddCustomerModal.jsx');

console.log('🧪 [Test Suite] Phase 4: Billing Step 1 UI & Dual-Key State Sync Verification');

// 1. Verify file exists
assert(fs.existsSync(QUICK_ADD_MODAL_PATH), 'QuickAddCustomerModal.jsx must exist');
const modalCode = fs.readFileSync(QUICK_ADD_MODAL_PATH, 'utf-8');

// 2. Verify Icon Imports
assert(modalCode.includes('Truck'), 'Must import Truck icon');
assert(modalCode.includes('UserCheck'), 'Must import UserCheck icon');
assert(modalCode.includes('MessageSquare'), 'Must import MessageSquare icon');

// 3. Verify Step 1 UI Inputs
assert(modalCode.includes('ชื่อผู้รับ / ผู้ติดต่อ (Contact Person)'), 'Must render contact person input label');
assert(modalCode.includes("handleFieldChange('contactName'"), 'Must bind contactName input');

assert(modalCode.includes('อีเมล (Email)'), 'Must render email input label');
assert(modalCode.includes("handleFieldChange('email'"), 'Must bind email input');

assert(modalCode.includes('Line ID'), 'Must render Line ID input label');
assert(modalCode.includes("handleFieldChange('lineId'"), 'Must bind lineId input');

assert(modalCode.includes('ขนส่งที่ต้องการ (Courier)'), 'Must render preferred courier input label');
assert(modalCode.includes("handleFieldChange('preferredCourier'"), 'Must bind preferredCourier input');

assert(modalCode.includes('หมายเหตุจัดส่ง (Shipping Notes)'), 'Must render shipping notes input label');
assert(modalCode.includes("handleFieldChange('shippingNotes'"), 'Must bind shippingNotes input');

// 4. Verify Dual-Key Synchronization in handleFieldChange
assert(modalCode.includes("if (field === 'preferredCourier') next.logisticProvider = value;"), 'handleFieldChange must sync logisticProvider');
assert(modalCode.includes("if (field === 'shippingNotes') next.logisticNote = value;"), 'handleFieldChange must sync logisticNote');
assert(modalCode.includes("if (field === 'contactName') next.firstName = value;"), 'handleFieldChange must sync firstName');
assert(modalCode.includes("if (field === 'postalCode') next.zipCode = value;"), 'handleFieldChange must sync zipCode');

// 5. Functional Simulation of Step 1 Flow
let state = {
    accountName: 'ร้านเอ็นดูไอที',
    contactName: 'คุณ สมชาย สบายดี',
    firstName: 'คุณ สมชาย สบายดี',
    phone: '0812345678',
    postalCode: '50200',
    zipCode: '50200',
    email: 'somchai@enduit.com',
    lineId: '@enduit',
    addressLine: '123/4 หมู่บ้านสุขใจ',
    subDistrict: 'สุเทพ',
    district: 'เมือง',
    province: 'เชียงใหม่',
    preferredCourier: 'Kerry',
    logisticProvider: 'Kerry',
    shippingNotes: 'โทรแจ้งก่อนเข้าส่ง',
    logisticNote: 'โทรแจ้งก่อนเข้าส่ง'
};

// Simulate handleFieldChange behavior
const simulateFieldChange = (currentState, field, value) => {
    const next = { ...currentState, [field]: value };
    if (field === 'postalCode') next.zipCode = value;
    if (field === 'zipCode') next.postalCode = value;
    if (field === 'preferredCourier') next.logisticProvider = value;
    if (field === 'logisticProvider') next.preferredCourier = value;
    if (field === 'shippingNotes') next.logisticNote = value;
    if (field === 'logisticNote') next.shippingNotes = value;
    if (field === 'contactName') next.firstName = value;
    if (field === 'firstName') next.contactName = value;
    return next;
};

// Simulate user modifying courier
state = simulateFieldChange(state, 'preferredCourier', 'Flash');
assert.strictEqual(state.preferredCourier, 'Flash', 'preferredCourier should update');
assert.strictEqual(state.logisticProvider, 'Flash', 'logisticProvider should auto-sync');

// Simulate user modifying contact name
state = simulateFieldChange(state, 'contactName', 'คุณ สมศรี มีทรัพย์');
assert.strictEqual(state.contactName, 'คุณ สมศรี มีทรัพย์', 'contactName should update');
assert.strictEqual(state.firstName, 'คุณ สมศรี มีทรัพย์', 'firstName should auto-sync');

// Simulate user modifying shipping notes
state = simulateFieldChange(state, 'shippingNotes', 'ฝากป้อมยาม');
assert.strictEqual(state.shippingNotes, 'ฝากป้อมยาม', 'shippingNotes should update');
assert.strictEqual(state.logisticNote, 'ฝากป้อมยาม', 'logisticNote should auto-sync');

console.log('✅ All Phase 4 verifications passed successfully (5/5 checks PASS)!');
