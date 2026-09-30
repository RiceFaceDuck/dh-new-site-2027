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

console.log('🔍 [Phase 2 Verification] Verifying Customers Phase 2 Runtime Crash & Service Wiring...');

// 1. Check managerTodoService.js
const managerTodoPath = path.resolve('dh-backoffice-react/src/firebase/managerTodoService.js');
const managerTodoContent = fs.readFileSync(managerTodoPath, 'utf8');
assert(
  managerTodoContent.includes("'CUSTOMER_DELETE_APPROVAL'"),
  'managerTodoService.js defines CUSTOMER_DELETE_APPROVAL in MANAGER_TASK_TYPES'
);

// 2. Check todoStaffService.js
const todoStaffPath = path.resolve('dh-backoffice-react/src/firebase/todo/todoStaffService.js');
const todoStaffContent = fs.readFileSync(todoStaffPath, 'utf8');
assert(
  todoStaffContent.includes('requestCustomerDeletion: async'),
  'todoStaffService.js implements requestCustomerDeletion'
);
assert(
  todoStaffContent.includes("type: 'CUSTOMER_DELETE_APPROVAL'") && todoStaffContent.includes("getCollectionPath('todos')"),
  'todoStaffService.js writes to todos collection with CUSTOMER_DELETE_APPROVAL type'
);

// 3. Check todoService.js facade
const todoServicePath = path.resolve('dh-backoffice-react/src/firebase/todoService.js');
const todoServiceContent = fs.readFileSync(todoServicePath, 'utf8');
assert(
  todoServiceContent.includes('requestCustomerDeletion: todoStaffService.requestCustomerDeletion'),
  'todoService.js exports requestCustomerDeletion through facade'
);

// 4. Check useCustomerHistory.js
const customerHistoryPath = path.resolve('dh-backoffice-react/src/pages/Customers/hooks/useCustomerHistory.js');
const customerHistoryContent = fs.readFileSync(customerHistoryPath, 'utf8');
assert(
  customerHistoryContent.includes('orderData.customerUid'),
  'useCustomerHistory.js checks orderData.customerUid in isOrderMatchForCustomer'
);
assert(
  customerHistoryContent.includes("where('customerUid', 'in', idList)"),
  'useCustomerHistory.js queries claims using customerUid'
);

// 5. Check creditActionService.js
const creditActionPath = path.resolve('dh-backoffice-react/src/firebase/credit/creditActionService.js');
const creditActionContent = fs.readFileSync(creditActionPath, 'utf8');
assert(
  !creditActionContent.includes('.accountName'),
  'creditActionService.js has zero remaining .accountName property access bugs'
);
assert(
  creditActionContent.includes("getCustomerDisplayName(d, '')"),
  'creditActionService.js correctly calls getCustomerDisplayName at line ~105'
);
assert(
  creditActionContent.includes("getCustomerDisplayName(userData, '')"),
  'creditActionService.js correctly calls getCustomerDisplayName with empty fallback at lines ~273 and ~470'
);

console.log(`\n================================`);
console.log(`Phase 2 Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
