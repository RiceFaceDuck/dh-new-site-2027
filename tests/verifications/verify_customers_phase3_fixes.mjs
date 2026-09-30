import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('🔍 [Phase 3 Verification] Verifying Customers Phase 3 Financial & Storage Safety...');

// 1. Check CustomerRefundModal.jsx
const modalPath = path.resolve('dh-backoffice-react/src/components/customers/CustomerRefundModal.jsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');

assert(
  modalContent.includes("import { slipStorageService } from '../../firebase/slipStorageService'"),
  'CustomerRefundModal.jsx imports slipStorageService'
);

assert(
  modalContent.includes('slipStorageService.uploadSlip'),
  'CustomerRefundModal.jsx uploads slip via slipStorageService.uploadSlip'
);

assert(
  !modalContent.includes('เธ'),
  'CustomerRefundModal.jsx contains zero Thai Mojibake characters'
);

assert(
  modalContent.includes('฿${totalRefundable.toLocaleString'),
  'CustomerRefundModal.jsx formats currency with ฿ symbol'
);

// 2. Check customerRefundService.js
const servicePath = path.resolve('dh-backoffice-react/src/firebase/customerRefundService.js');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert(
  serviceContent.includes("sanitizedSlipUrl.startsWith('data:image/')"),
  'customerRefundService.js guards against raw Base64 data URLs'
);

assert(
  serviceContent.includes('sanitizedSlipUrl.length > 2000'),
  'customerRefundService.js guards against oversized URLs > 2000 chars'
);

assert(
  !serviceContent.includes('slipUrl: slipUrl || null'),
  'customerRefundService.js replaces all direct slipUrl writes with sanitizedSlipUrl'
);

console.log(`\n================================`);
console.log(`Phase 3 Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
