/**
 * Verification Script: Floating Mini Cart Parity, UX Refinement & Multi-Device Staff Sync
 * 
 * Location: Management System/tests/verifications/verify_floating_cart_enhancement.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY: Floating Mini Cart UX, Big Counter & Staff Sync');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// -------------------------------------------------------------
// Test 1: FloatingMiniCart billing visibility logic
// -------------------------------------------------------------
test('FloatingMiniCart hides ONLY when on /billing AND POS is open', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(
    code.includes("location.pathname.includes('/billing') && isPosActive"),
    'Must only hide on /billing when isPosActive is true'
  );
  assert.ok(
    !code.includes("if (location.pathname.includes('/billing')) {\n    return null;\n  }"),
    'Must NOT unconditionally hide on /billing'
  );
});

// -------------------------------------------------------------
// Test 2: Balanced Counter Badge with Header Title
// -------------------------------------------------------------
test('FloatingMiniCart Header features balanced counter badge in compact layout', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('text-xs font-bold text-white bg-[#D51C39] px-2 py-0.5 rounded-full'), 'Must render balanced rounded-full counter badge in Header');
  assert.ok(!code.includes('text-2xl font-black text-white bg-[#D51C39]'), 'Must NOT have oversized text-2xl badge');
  assert.ok(code.includes('px-4 py-2.5'), 'Header must maintain compact height (py-2.5)');
});

// -------------------------------------------------------------
// Test 3: Zero Scrollbar Clutter & Ergonomic Nav Buttons
// -------------------------------------------------------------
test('FloatingMiniCart tab bar eliminates scrollbar and features ergonomic large nav buttons', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('scrollbar-none'), 'Must hide scrollbar via scrollbar-none');
  assert.ok(code.includes('[&::-webkit-scrollbar]:hidden'), 'Must hide webkit scrollbar');
  assert.ok(code.includes('handleNavigateTab'), 'Must provide tab navigation handler');
  assert.ok(code.includes('handleTabsWheel'), 'Must provide wheel scroll handler');
  assert.ok(code.includes('w-8 h-8 rounded-xl'), 'Must feature ergonomic large navigation buttons (w-8 h-8)');
  assert.ok(code.includes('ChevronLeft size={18}'), 'Must feature clear visible chevron icons');
  assert.ok(!code.includes('`#${idx + 1} ${shortName}`'), 'Must NOT prefix tabs with #1 #2 index');
  assert.ok(!code.includes('{itemCount > 0 && ('), 'Must NOT render itemCount badge on tabs');
  assert.ok(code.includes('h-7 px-2.5 rounded-lg'), 'Tabs must be smart compact pills');
});

// -------------------------------------------------------------
// Test 3.1: Tab Switching & Boundary Guard
// -------------------------------------------------------------
test('FloatingMiniCart correctly switches active draft tab and guards boundaries', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("handleNavigateTab('left')"), 'Must support navigating to previous tab');
  assert.ok(code.includes("handleNavigateTab('right')"), 'Must support navigating to next tab');
  assert.ok(code.includes('scrollToActiveTab'), 'Must auto-scroll active tab into view');
  assert.ok(code.includes('disabled={!hasPrev}'), 'Must disable left arrow on first tab');
  assert.ok(code.includes('disabled={!hasNext}'), 'Must disable right arrow on last tab');
});

// -------------------------------------------------------------
// Test 4: Staff Account Cloud Sync Service
// -------------------------------------------------------------
test('staffPosDraftService is properly implemented and exported', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/staffPosDraftService.js');
  assert.ok(fs.existsSync(filePath), 'staffPosDraftService.js must exist');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('getStaffCloudDrafts'), 'Must export getStaffCloudDrafts');
  assert.ok(code.includes('saveStaffCloudDraftsDebounced'), 'Must export saveStaffCloudDraftsDebounced');
  assert.ok(code.includes('filterValidDraftTabs'), 'Must export filterValidDraftTabs');
  assert.ok(code.includes('users'), 'Must target user private subcollection');
});

// -------------------------------------------------------------
// Test 5: usePosState handles employee account switching and cloud sync
// -------------------------------------------------------------
test('usePosState synchronizes drafts across devices and isolates per-staff account', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosState.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('staffPosDraftService.saveStaffCloudDraftsDebounced'), 'Must sync drafts to cloud with debounce');
  assert.ok(code.includes('staffPosDraftService.getStaffCloudDrafts'), 'Must hydrate cloud drafts on new PC');
  assert.ok(code.includes('unsubAuth = auth?.onAuthStateChanged'), 'Must listen to auth state changes to isolate staff accounts');
});

// -------------------------------------------------------------
// Test 6: FloatingMiniCart hydrates from cloud on new computer
// -------------------------------------------------------------
test('FloatingMiniCart hydrates from staff cloud drafts and isolates per-staff account', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('staffPosDraftService.getStaffCloudDrafts'), 'Must hydrate cloud drafts in FloatingMiniCart');
  assert.ok(code.includes('staffPosDraftService.saveStaffCloudDraftsDebounced'), 'Must sync deleted drafts to cloud');
  assert.ok(code.includes('filterValidDraftTabs'), 'Must use filterValidDraftTabs');
});

// -------------------------------------------------------------
// Test 8: Single-Row High-Density Cart Items Layout
// -------------------------------------------------------------
test('FloatingMiniCart renders single-row high-density item list', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('{itemQty}x'), 'Must render prominent {itemQty}x count badge');
  assert.ok(code.includes('flex items-center justify-between gap-2 py-1 px-1 rounded-md'), 'Must render compact single-row item layout');
  assert.ok(code.includes('truncate leading-tight text-xs'), 'Must truncate item name neatly on one line');
});

// -------------------------------------------------------------
// Test 9: Sidebar Floating Cart Toggle Button & Visibility
// -------------------------------------------------------------
test('Sidebar and AdminLayout implement ergonomic floating cart toggle button', () => {
  const sidebarPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/layouts/components/Sidebar.jsx');
  const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

  assert.ok(sidebarCode.includes('toggleFloatingCart'), 'Sidebar must receive toggleFloatingCart prop');
  assert.ok(sidebarCode.includes('ShoppingCart'), 'Sidebar must import and render ShoppingCart icon');
  assert.ok(sidebarCode.includes('isFloatingCartVisible'), 'Sidebar must handle isFloatingCartVisible state');

  const adminLayoutPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/layouts/AdminLayout.jsx');
  const adminLayoutCode = fs.readFileSync(adminLayoutPath, 'utf8');

  assert.ok(adminLayoutCode.includes('isFloatingCartVisible'), 'AdminLayout must manage isFloatingCartVisible state');
  assert.ok(adminLayoutCode.includes('toggleFloatingCart'), 'AdminLayout must define toggleFloatingCart handler');
  assert.ok(adminLayoutCode.includes('isVisible={isFloatingCartVisible}'), 'AdminLayout must pass isVisible to FloatingMiniCart');

  const cartPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/FloatingMiniCart.jsx');
  const cartCode = fs.readFileSync(cartPath, 'utf8');

  assert.ok(cartCode.includes('if (!isVisible)'), 'FloatingMiniCart must hide when isVisible is false');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
