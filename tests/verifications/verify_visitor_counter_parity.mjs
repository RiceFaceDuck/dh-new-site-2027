/**
 * 🧪 Test Suite: Visitor Counter Storefront & Backoffice Parity
 * Location: Management System/tests/verifications/verify_visitor_counter_parity.mjs
 * 
 * Verifies:
 * 1. Data Service Contract & Two-Tier Caching (SessionStorage + TTL)
 * 2. Hook & State Architecture (Clean Architecture separation)
 * 3. Storefront UI Invariants (Border Radius 0.1, Calm UI static badges)
 * 4. Dual-Display Parity: PC Footer Placement + Mobile/Tablet Bottom Navigation Placement
 * 5. Backoffice Live Preview Parity
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('================================================================');
console.log('🧪 VERIFICATION SUITE: ALL-TIME VISITOR COUNTER PARITY');
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = [];

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`         Reason: ${err.message}`);
    failedChecks.push({ title, error: err.message });
  }
}

// -------------------------------------------------------------
// Group 1: Service & Caching Architecture
// -------------------------------------------------------------
console.log('👉 [1/4] Auditing Client Service & Quota Discipline');

const serviceFile = path.resolve(rootDir, 'dh-frontend/src/firebase/webTrafficClientService.js');
check('webTrafficClientService.js exists in dh-frontend', () => {
  assert(fs.existsSync(serviceFile), 'File not found');
});

const serviceCode = fs.readFileSync(serviceFile, 'utf8');

check('webTrafficClientService connects to settings/web_traffic doc', () => {
  assert(serviceCode.includes("COLLECTION_NAME = 'settings'"), 'Collection mismatch');
  assert(serviceCode.includes("DOC_ID = 'web_traffic'"), 'Doc ID mismatch');
});

check('webTrafficClientService enforces Two-Tier SessionStorage Cache with TTL', () => {
  assert(serviceCode.includes('sessionStorage.getItem'), 'Missing sessionStorage read');
  assert(serviceCode.includes('sessionStorage.setItem'), 'Missing sessionStorage write');
  assert(serviceCode.includes('CACHE_EXPIRY_MS'), 'Missing cache TTL expiry check');
  assert(serviceCode.includes('safeJsonParse'), 'Missing safeJsonParse guard');
});

check('webTrafficClientService exports getAllTimeVisitors with safe fallback', () => {
  assert(serviceCode.includes('getAllTimeVisitors'), 'Missing getAllTimeVisitors method');
  assert(serviceCode.includes('return 0;'), 'Missing safe fallback return');
});

// -------------------------------------------------------------
// Group 2: Hook & Clean Architecture
// -------------------------------------------------------------
console.log('\n👉 [2/4] Auditing Hook & Presentation Decoupling');

const hookFile = path.resolve(rootDir, 'dh-frontend/src/hooks/useWebTrafficAllTime.js');
check('useWebTrafficAllTime.js exists in dh-frontend', () => {
  assert(fs.existsSync(hookFile), 'File not found');
});

const hookCode = fs.readFileSync(hookFile, 'utf8');

check('useWebTrafficAllTime manages loading state and Thai number formatting', () => {
  assert(hookCode.includes('useWebTrafficAllTime'), 'Missing export');
  assert(hookCode.includes('toLocaleString'), 'Missing number formatting');
  assert(hookCode.includes('loading'), 'Missing loading state');
  assert(hookCode.includes('isMounted'), 'Missing unmount guard');
});

// -------------------------------------------------------------
// Group 3: Presentation UI & Design System Invariants
// -------------------------------------------------------------
console.log('\n👉 [3/4] Auditing Presentation Invariants (Border Radius & Calm UI)');

const badgeFile = path.resolve(rootDir, 'dh-frontend/src/components/common/VisitorCounterBadge.jsx');
check('VisitorCounterBadge.jsx exists in dh-frontend', () => {
  assert(fs.existsSync(badgeFile), 'File not found');
});

const badgeCode = fs.readFileSync(badgeFile, 'utf8');

check('VisitorCounterBadge enforces Border Radius 0.1 invariant (rounded-[2px])', () => {
  assert(badgeCode.includes('rounded-[2px]'), 'Missing rounded-[2px]');
});

check('VisitorCounterBadge complies with Calm UI (zero blinking/pulsing animation)', () => {
  assert(!badgeCode.includes('animate-pulse'), 'Calm UI violation: animate-pulse found');
  assert(!badgeCode.includes('animate-spin'), 'Calm UI violation: animate-spin found');
  assert(!badgeCode.includes('animate-ping'), 'Calm UI violation: animate-ping found');
});

check('VisitorCounterBadge supports both footer-dark and mobile-card variants', () => {
  assert(badgeCode.includes("variant === 'mobile-card'"), 'Missing mobile-card variant');
  assert(badgeCode.includes('footer-dark'), 'Missing footer-dark variant');
  assert(badgeCode.includes('ผู้เข้าชมทั้งหมด:'), 'Missing Thai label');
});

// -------------------------------------------------------------
// Group 4: Layout Integration (PC, Mobile, & Backoffice Preview)
// -------------------------------------------------------------
console.log('\n👉 [4/4] Auditing Layout Integration & Backoffice Parity');

const pcBrandFile = path.resolve(rootDir, 'dh-frontend/src/components/footer/FooterBrand.jsx');
const pcBrandCode = fs.readFileSync(pcBrandFile, 'utf8');

check('FooterBrand renders VisitorCounterBadge on PC footer beneath trust badges', () => {
  assert(pcBrandCode.includes('VisitorCounterBadge'), 'Missing VisitorCounterBadge in FooterBrand');
  assert(pcBrandCode.includes('variant="footer-dark"'), 'Missing footer-dark variant in FooterBrand');
  const badgeIdx = pcBrandCode.indexOf('activeBadges.map');
  const counterIdx = pcBrandCode.indexOf('<VisitorCounterBadge');
  assert(badgeIdx !== -1 && counterIdx !== -1 && counterIdx > badgeIdx, 'Counter must be beneath trust badges');
});

const mainLayoutFile = path.resolve(rootDir, 'dh-frontend/src/layouts/MainLayout.jsx');
const mainLayoutCode = fs.readFileSync(mainLayoutFile, 'utf8');

check('MainLayout renders VisitorCounterBadge for Mobile/Tablet (< lg) above BottomNav', () => {
  assert(mainLayoutCode.includes('VisitorCounterBadge'), 'Missing VisitorCounterBadge in MainLayout');
  assert(mainLayoutCode.includes('variant="mobile-card"'), 'Missing mobile-card variant in MainLayout');
  assert(mainLayoutCode.includes('lg:hidden'), 'Must be targeted for mobile/tablet screens');
  const counterIdx = mainLayoutCode.indexOf('VisitorCounterBadge');
  const bottomNavIdx = mainLayoutCode.indexOf('<BottomNav');
  assert(counterIdx < bottomNavIdx, 'Mobile counter must appear before BottomNav in layout order');
});

const boPreviewFile = path.resolve(rootDir, 'dh-backoffice-react/src/pages/managers/components/footer/LiveStorefrontPreview.jsx');
const boPreviewCode = fs.readFileSync(boPreviewFile, 'utf8');

check('LiveStorefrontPreview renders all-time visitor counter in backoffice footer settings', () => {
  assert(boPreviewCode.includes('ผู้เข้าชมทั้งหมด:'), 'Missing Thai label in LiveStorefrontPreview');
  assert(boPreviewCode.includes('useWebTrafficStats'), 'Missing useWebTrafficStats in LiveStorefrontPreview');
  assert(boPreviewCode.includes('rounded-[2px]'), 'Missing rounded-[2px] in LiveStorefrontPreview');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 VERIFICATION AUDIT FINISHED: ${passedChecks}/${totalChecks} PASSED`);
console.log('================================================================');

if (failedChecks.length > 0) {
  console.error('\n❌ FAILED CHECKS:');
  failedChecks.forEach(f => console.error(`  - ${f.title}: ${f.error}`));
  process.exit(1);
} else {
  console.log('🎉 ALL PARITY AUDIT CHECKS PASSED WITH 100% SUCCESS!\n');
}
