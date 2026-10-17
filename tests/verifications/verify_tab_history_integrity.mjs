import fs from 'fs';
import path from 'path';

console.log('--- Verifying TabHistory & Order History Integrity ---');

const baseDir = process.cwd();

// 1. HistoryItemCard.jsx checks
const cardPath = path.join(baseDir, 'dh-frontend/src/components/profile/tabs/history/HistoryItemCard.jsx');
const cardContent = fs.readFileSync(cardPath, 'utf8');

const checks = [
  { name: "HistoryItemCard uses item.qty ?? item.quantity fallback", test: cardContent.includes("Number(item.qty ?? item.quantity ?? 1)") },
  { name: "HistoryItemCard avoids NaN by computing lineTotal with itemQuantity", test: cardContent.includes("const lineTotal = Number(item.total ?? (priceToShow * itemQuantity))") },
  { name: "HistoryItemCard displays lineTotal.toLocaleString()", test: cardContent.includes("฿{lineTotal.toLocaleString()}") },
  { name: "HistoryItemCard calculates subtotal fallback chain", test: cardContent.includes("order.totals?.subtotal ?? order.subTotal ?? order.subtotal") }
];

// 2. driveService.js checks
const driveServicePath = path.join(baseDir, 'dh-frontend/src/firebase/driveService.js');
const driveServiceContent = fs.readFileSync(driveServicePath, 'utf8');

checks.push(
  { name: "driveService exports uploadImage", test: driveServiceContent.includes("uploadImage: async") }
);

// 3. UploadSlipModal.jsx & useUploadSlip.js checks
const slipModalPath = path.join(baseDir, 'dh-frontend/src/components/profile/tabs/history/UploadSlipModal.jsx');
const slipModalContent = fs.readFileSync(slipModalPath, 'utf8');

const useUploadSlipPath = path.join(baseDir, 'dh-frontend/src/components/profile/tabs/history/useUploadSlip.js');
const useUploadSlipContent = fs.readFileSync(useUploadSlipPath, 'utf8');

checks.push(
  { name: "UploadSlipModal uses payable fallback", test: slipModalContent.includes("selectedOrder.netTotal ?? selectedOrder.finalTotal") },
  { name: "useUploadSlip calculates payableAmount fallback", test: useUploadSlipContent.includes("const payableAmount = Number(") }
);

// 4. checkoutOrderActionService.js checks
const checkoutActionPath = path.join(baseDir, 'dh-frontend/src/firebase/checkout/checkoutOrderActionService.js');
const checkoutActionContent = fs.readFileSync(checkoutActionPath, 'utf8');

checks.push(
  { name: "cancelOrder supports customer.uid and customerId", test: checkoutActionContent.includes("orderData.userId || orderData.customer?.uid || orderData.customerId") }
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
  console.log('\n🎉 ALL TAB HISTORY INTEGRITY CHECKS PASSED!');
  process.exit(0);
}
