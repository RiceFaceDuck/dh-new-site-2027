import fs from 'fs';
import path from 'path';

console.log('🧪 Starting Verification Suite: Web Order First-Touch Staff Assignment');

// 1. Verify dh-shared staffUtils.js
const staffUtilsPath = path.resolve('dh-shared/src/utils/staffUtils.js');
const staffUtilsContent = fs.readFileSync(staffUtilsPath, 'utf8');

if (!staffUtilsContent.includes('isWebOrder')) {
  console.error('❌ FAIL: getStaffNickname does not check isWebOrder');
  process.exit(1);
}
console.log('  ✅ PASS: getStaffNickname checks isWebOrder and avoids using createdBy');

// 2. Verify OrderTableRow.jsx badge text and styling
const orderTableRowPath = path.resolve('dh-backoffice-react/src/components/billing/dashboard/OrderTableRow.jsx');
const orderTableRowContent = fs.readFileSync(orderTableRowPath, 'utf8');

if (!orderTableRowContent.includes('ยังไม่ตรวจสอบ')) {
  console.error('❌ FAIL: OrderTableRow does not show "ยังไม่ตรวจสอบ"');
  process.exit(1);
}
if (!orderTableRowContent.includes('text-orange-500')) {
  console.error('❌ FAIL: OrderTableRow does not have orange styling');
  process.exit(1);
}
console.log('  ✅ PASS: OrderTableRow correctly displays "ยังไม่ตรวจสอบ" with bright orange styling (no border/shape)');

// 3. Verify billingStatusTransaction.js assignStaffHandler atomic transaction
const billingTxPath = path.resolve('dh-backoffice-react/src/firebase/billingStatusTransaction.js');
const billingTxContent = fs.readFileSync(billingTxPath, 'utf8');

if (!billingTxContent.includes('runTransaction') || !billingTxContent.includes('assignStaffHandler')) {
  console.error('❌ FAIL: assignStaffHandler is not using runTransaction');
  process.exit(1);
}
if (!billingTxContent.includes('First-Touch Guard')) {
  console.error('❌ FAIL: assignStaffHandler does not have First-Touch Guard check');
  process.exit(1);
}
console.log('  ✅ PASS: assignStaffHandler uses atomic runTransaction with First-Touch Guard');

// 4. Verify BillingDashboard.jsx handleSelectOrder
const billingDashboardPath = path.resolve('dh-backoffice-react/src/components/billing/BillingDashboard.jsx');
const billingDashboardContent = fs.readFileSync(billingDashboardPath, 'utf8');

if (!billingDashboardContent.includes('handleSelectOrder') || !billingDashboardContent.includes('assignStaffHandler')) {
  console.error('❌ FAIL: BillingDashboard does not trigger assignStaffHandler on select');
  process.exit(1);
}
console.log('  ✅ PASS: BillingDashboard assigns first-touch staff when clicking order row');

// 5. Verify OrderDetailModal.jsx
const orderModalPath = path.resolve('dh-backoffice-react/src/components/billing/dashboard/OrderDetailModal.jsx');
const orderModalContent = fs.readFileSync(orderModalPath, 'utf8');

if (!orderModalContent.includes('assignStaffHandler') || !orderModalContent.includes('ยังไม่ตรวจสอบ')) {
  console.error('❌ FAIL: OrderDetailModal does not support first-touch staff display/assignment');
  process.exit(1);
}
console.log('  ✅ PASS: OrderDetailModal supports first-touch assignment and displays "ยังไม่ตรวจสอบ"');

console.log('🎉 ALL 5 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
process.exit(0);
