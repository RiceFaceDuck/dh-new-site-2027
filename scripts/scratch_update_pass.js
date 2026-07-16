const fs = require('fs');
const path = 'c:\\\\DH Notebook\\\\Management System\\\\.agents\\\\memory\\\\Audit Checklist.md';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/@STAT:🔴FAIL \| @EV:Found in `checkoutOrderActionService.js` \(Frontend\); `cancelOrder` blindly updates stock/g, '@STAT:🟢PASS | @EV:Fixed in `checkoutOrderActionService.js` (Frontend); `cancelOrder` safely restores stock using set with merge and avoids negative quotas');
content = content.replace(/@STAT:🔴FAIL \| @EV:Found in `cancelActionService.js` \(Backoffice\); `approveCancel` deducts refund from wallet/g, '@STAT:🟢PASS | @EV:Fixed in `cancelActionService.js` (Backoffice); `approveCancel` checks wallet balance before deduction to prevent negative balance exploitation');
content = content.replace(/@STAT:🔴FAIL \| @EV:Found in `checkoutOrderActionService.js` \(Frontend\); `cancelOrder` decrements Promotion\/Freebie/g, '@STAT:🟢PASS | @EV:Fixed in `checkoutOrderActionService.js` (Frontend); `cancelOrder` clamps quotas at 0 to prevent leakages');

fs.writeFileSync(path, content);
console.log('Updated checklist successfully');
