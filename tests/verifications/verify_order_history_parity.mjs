import fs from 'fs';
import path from 'path';

console.log('--- Verifying Order History Schema & Storefront Parity ---');

const baseDir = process.cwd();

// 1. Check useHistoryOrders.js
const hookPath = path.join(baseDir, 'dh-frontend/src/components/profile/tabs/history/useHistoryOrders.js');
const hookContent = fs.readFileSync(hookPath, 'utf8');

const checks = [
  { name: "Queries customer.uid", test: hookContent.includes("where('customer.uid', '==', user.uid)") },
  { name: "Queries userId", test: hookContent.includes("where('userId', '==', user.uid)") },
  { name: "Queries customerId", test: hookContent.includes("where('customerId', '==', user.uid)") },
  { name: "No composite index orderBy('createdAt')", test: !hookContent.includes("orderBy('createdAt'") },
  { name: "Client-side sort & dedupe present", test: hookContent.includes("list.sort(") && hookContent.includes("ordersMap.set") }
];

// 2. Check HistoryItemCard.jsx
const cardPath = path.join(baseDir, 'dh-frontend/src/components/profile/tabs/history/HistoryItemCard.jsx');
const cardContent = fs.readFileSync(cardPath, 'utf8');

checks.push(
  { name: "HistoryItemCard uses finalPayable fallback", test: cardContent.includes("finalPayable") },
  { name: "HistoryItemCard checks order.netTotal", test: cardContent.includes("order.netTotal") },
  { name: "HistoryItemCard checks order.finalTotal", test: cardContent.includes("order.finalTotal") }
);

// 3. Check TabHistory.jsx
const tabPath = path.join(baseDir, 'dh-frontend/src/components/profile/tabs/TabHistory.jsx');
const tabContent = fs.readFileSync(tabPath, 'utf8');

checks.push(
  { name: "TabHistory supports approved status", test: tabContent.includes("'approved'") },
  { name: "TabHistory supports paid status", test: tabContent.includes("'paid'") }
);

// 4. Check billingTransactionService.js
const billingServicePath = path.join(baseDir, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const billingServiceContent = fs.readFileSync(billingServicePath, 'utf8');

checks.push(
  { name: "billingTransactionService sets userId", test: billingServiceContent.includes("userId: validCustomerUid") },
  { name: "billingTransactionService sets customerId", test: billingServiceContent.includes("customerId: validCustomerUid") },
  { name: "billingTransactionService populates totals", test: billingServiceContent.includes("totals: {") }
);

// 5. Check usePosActions.js
const posActionsPath = path.join(baseDir, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
const posActionsContent = fs.readFileSync(posActionsPath, 'utf8');

checks.push(
  { name: "usePosActions sets userId in orderData", test: posActionsContent.includes("userId: validCustUid") }
);

let allPassed = true;
checks.forEach(c => {
  if (c.test) {
    console.log(`✅ PASS: ${c.name}`);
  } else {
    console.error(`❌ FAIL: ${c.name}`);
    allPassed = false;
  }
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL ORDER HISTORY PARITY CHECKS PASSED!');
  process.exit(0);
}
