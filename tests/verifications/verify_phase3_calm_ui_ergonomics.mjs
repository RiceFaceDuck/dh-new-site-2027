import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('🧪 Starting Phase 3 Calm UI & Ergonomics Verification Script...');

let failedTests = 0;

// 1. Check AfterSalesServiceBottomPanel.jsx (No animate-ping)
console.log('\n--- 1. Checking AfterSalesServiceBottomPanel.jsx for Calm UI ---');
const afterSalesPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/dashboard/order-summary/AfterSalesServiceBottomPanel.jsx');
const afterSalesContent = fs.readFileSync(afterSalesPath, 'utf8');
if (afterSalesContent.includes('animate-ping')) {
  console.error('  ❌ FAIL: animate-ping still found in AfterSalesServiceBottomPanel.jsx');
  failedTests++;
} else {
  console.log('  ✓ animate-ping successfully removed (Calm UI compliant)');
}

// 2. Check BillingDashboard.jsx (No animate-bounce)
console.log('\n--- 2. Checking BillingDashboard.jsx for Calm UI ---');
const dashboardPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/BillingDashboard.jsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
if (dashboardContent.includes('animate-bounce')) {
  console.error('  ❌ FAIL: animate-bounce still found in BillingDashboard.jsx');
  failedTests++;
} else {
  console.log('  ✓ animate-bounce successfully removed (Calm UI compliant)');
}

// 3. Check OrderTableRow.jsx (No animate-pulse)
console.log('\n--- 3. Checking OrderTableRow.jsx for Calm UI ---');
const orderTableRowPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/dashboard/OrderTableRow.jsx');
const orderTableRowContent = fs.readFileSync(orderTableRowPath, 'utf8');
if (orderTableRowContent.includes('animate-pulse')) {
  console.error('  ❌ FAIL: animate-pulse still found in OrderTableRow.jsx');
  failedTests++;
} else {
  console.log('  ✓ animate-pulse successfully removed from status badges (Calm UI compliant)');
}

// 4. Check usePosShortcuts.js (Alt + N shortcut)
console.log('\n--- 4. Checking usePosShortcuts.js for Alt + N shortcut ---');
const shortcutsPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosShortcuts.js');
const shortcutsContent = fs.readFileSync(shortcutsPath, 'utf8');
if (shortcutsContent.includes("e.altKey && (e.key === 'n' || e.key === 'N')") && shortcutsContent.includes('createNewTab')) {
  console.log('  ✓ Alt + N shortcut successfully wired to createNewTab');
} else {
  console.error('  ❌ FAIL: Alt + N shortcut missing or createNewTab not invoked');
  failedTests++;
}

// 5. Check PosSystem.jsx (Tablet Responsive & Props Wiring)
console.log('\n--- 5. Checking PosSystem.jsx for Tablet Responsive & Shortcuts Wiring ---');
const posSystemPath = path.join(rootDir, 'dh-backoffice-react/src/components/billing/PosSystem.jsx');
const posSystemContent = fs.readFileSync(posSystemPath, 'utf8');
const hasResponsiveClasses = posSystemContent.includes('overflow-y-auto lg:overflow-hidden');
const hasShortcutsPassing = posSystemContent.includes('handleFileUpload: actions.handleFileUpload, createNewTab');

if (hasResponsiveClasses && hasShortcutsPassing) {
  console.log('  ✓ Tablet responsive layout configured (overflow-y-auto lg:overflow-hidden)');
  console.log('  ✓ createNewTab passed to usePosShortcuts');
} else {
  console.error('  ❌ FAIL: Responsive layout or createNewTab prop missing');
  failedTests++;
}

console.log('\n----------------------------------------');
if (failedTests === 0) {
  console.log('✅ All Phase 3 Calm UI & Ergonomics Checks Passed Successfully!');
  process.exit(0);
} else {
  console.error(`❌ ${failedTests} checks failed!`);
  process.exit(1);
}
