const fs = require('fs');
const path = 'c:\\\\DH Notebook\\\\Management System\\\\.agents\\\\memory\\\\Audit Checklist.md';
let content = fs.readFileSync(path, 'utf8');

const newItems = `
# --- NEW SYSTEM STABILITY DEEP DIVE AUDIT (AI FOUND) ---
@ID:P3-STB-004 | @PHASE:Phase3 | @CAT:STB | @SEV:🔴Critical | @STAT:🔴FAIL | @EV:Found in \`checkoutOrderActionService.js\` (Frontend); \`cancelOrder\` blindly updates stock using \`transaction.update(pRef)\` without checking if product exists. If a product was hard-deleted, this throws an error and permanently blocks order cancellation. | @REF:Firestore Transactions & Schema | @TASK: Verify that System Stability Audit: Fix blind transaction.update without existence check in Frontend Order Cancellation.
@ID:P3-SEC-006 | @PHASE:Phase3 | @CAT:SEC | @SEV:🔴Critical | @STAT:🔴FAIL | @EV:Found in \`cancelActionService.js\` (Backoffice); \`approveCancel\` deducts refund from wallet blindly via \`increment(-refundAmount)\`. If the customer already spent the refunded wallet balance, their wallet will become negative, effectively allowing them to steal products/money. | @REF:Wallet & Financial Logic | @TASK: Verify that Wallet & Financial Logic: Prevent negative wallet balances when Managers cancel previously approved Return Requests.
@ID:P3-DATA-030 | @PHASE:Phase3 | @CAT:DATA | @SEV:🟠High | @STAT:🔴FAIL | @EV:Found in \`checkoutOrderActionService.js\` (Frontend); \`cancelOrder\` decrements Promotion/Freebie \`quotaUsed\` via \`increment(-1)\` without boundary checking. If canceled out of sync, \`quotaUsed\` can become negative, unintentionally granting extra quotas to other users. | @REF:Promotion Logic | @TASK: Verify that Promotion Logic: Clamp quotaUsed decrement to minimum 0 during Order Cancellation to prevent quota leaks.
`;

content += newItems;
fs.writeFileSync(path, content);
console.log('Appended successfully');
