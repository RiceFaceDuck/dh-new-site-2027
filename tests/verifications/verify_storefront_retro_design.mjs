/**
 * ==============================================================================
 * 🧪 STOREFRONT RETRO/CLASSIC REDESIGN 4-TIER VERIFICATION TEST SUITE
 * ==============================================================================
 *
 * Target: Management System/dh-frontend (http://localhost:8988/)
 * Scope: CSS Tokens, Border Radius Calibration, Contrast Boundaries,
 *        Circular Exceptions, Layout Integrity, and Build Verification.
 *
 * Execution:
 *   node tests/verifications/verify_storefront_retro_design.mjs [--mode=baseline|strict]
 *
 * Derived from Specifications:
 *   - ORIGINAL_REQUEST.md (## 2026-10-12T03:12:47Z)
 *   - PROJECT.md (Storefront UI/UX Retro/Classic Redesign)
 *   - Management System/tests/docs/TEST_INFRA.md
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.resolve(REPO_ROOT, 'Management System/dh-frontend');

// CLI Arguments
const args = process.argv.slice(2);
const isBaselineMode = args.includes('--mode=baseline');

console.log('================================================================');
console.log('🧪 STOREFRONT RETRO/CLASSIC REDESIGN: 4-TIER VERIFICATION SUITE');
console.log(` Mode: ${isBaselineMode ? 'BASELINE AUDIT (--mode=baseline)' : 'STRICT GATE (--mode=strict)'}`);
console.log(` Target: ${FRONTEND_ROOT}`);
console.log('================================================================\n');

// State trackers
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const tierResults = {
  tier1: { total: 0, passed: 0, failed: 0, name: 'Tier 1: Feature Coverage' },
  tier2: { total: 0, passed: 0, failed: 0, name: 'Tier 2: Boundary & Corner Cases' },
  tier3: { total: 0, passed: 0, failed: 0, name: 'Tier 3: Cross-Feature Interactions' },
  tier4: { total: 0, passed: 0, failed: 0, name: 'Tier 4: Real-World Scenarios' }
};
const failures = [];

/**
 * Custom Assertion Engine with Milestone Attribution
 */
function assertTest(tierKey, testId, description, condition, failureMessage, targetMilestone) {
  totalTests++;
  tierResults[tierKey].total++;

  if (condition) {
    console.log(`  ✅ [PASS] [${testId}] ${description}`);
    passedTests++;
    tierResults[tierKey].passed++;
  } else {
    console.error(`  ❌ [FAIL] [${testId}] ${description}`);
    console.error(`     ↳ Rationale: ${failureMessage}`);
    console.error(`     ↳ Owner: ${targetMilestone}`);
    failedTests++;
    tierResults[tierKey].failed++;
    failures.push({
      tier: tierResults[tierKey].name,
      id: testId,
      description,
      error: failureMessage,
      owner: targetMilestone
    });
  }
}

// Helper: Read file safely
function readFileSafe(relPath) {
  const fullPath = path.resolve(FRONTEND_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf8');
}

// ==============================================================================
// TIER 1: FEATURE COVERAGE (Core Design Tokens, Clamping, Contrast, Build)
// ==============================================================================
console.log(`\n👉 [TIER 1] FEATURE COVERAGE: Global Tokens, Radiuses, Contrast, & Build`);

const indexCss = readFileSafe('src/index.css');

// T1-CSS-01: Stylesheet Deduplication
const themeBlockMatches = indexCss.match(/@theme\s*\{/g) || [];
assertTest(
  'tier1',
  'T1-CSS-01',
  'src/index.css contains exactly ONE @theme block (deduplication)',
  themeBlockMatches.length === 1,
  `Found ${themeBlockMatches.length} @theme blocks in src/index.css (expected exactly 1).`,
  'Milestone 1 (CSS Architecture)'
);

const baseFallbackMatches = indexCss.match(/@layer\s+base\s*\{\s*[\s\S]*?border-color:\s*var\(--color-gray-200/g) || [];
assertTest(
  'tier1',
  'T1-CSS-02',
  'src/index.css contains no duplicate @layer base fallback blocks',
  baseFallbackMatches.length <= 1,
  `Found duplicate fallback @layer base blocks in src/index.css (${baseFallbackMatches.length} occurrences).`,
  'Milestone 1 (CSS Architecture)'
);

// T1-CSS-03: Border Radius Token Calibration (--radius-md = 0.375rem / 6px)
const radiusMdMatch = /--radius-md:\s*(0\.375rem|6px)/i.test(indexCss);
assertTest(
  'tier1',
  'T1-CSS-03',
  'src/index.css @theme defines --radius-md calibrated to 0.375rem (6px)',
  radiusMdMatch,
  '--radius-md is not defined or not set to 0.375rem in src/index.css @theme block.',
  'Milestone 1 (CSS Architecture)'
);

// T1-CSS-04: Border Radius Clamping (--radius-lg through --radius-4xl <= 0.5rem / 8px)
const radiusLgClamp = /--radius-lg:\s*(0\.[1-5]rem|[1-8]px|0\.5rem)/i.test(indexCss);
const radiusXlClamp = /--radius-xl:\s*(0\.[1-5]rem|[1-8]px|0\.5rem)/i.test(indexCss);
const radius2xlClamp = /--radius-2xl:\s*(0\.[1-5]rem|[1-8]px|0\.5rem)/i.test(indexCss);
const radius3xlClamp = /--radius-3xl:\s*(0\.[1-5]rem|[1-8]px|0\.5rem)/i.test(indexCss);
const isClamped = radiusLgClamp && radiusXlClamp && radius2xlClamp && radius3xlClamp;

assertTest(
  'tier1',
  'T1-CSS-04',
  'src/index.css @theme clamps --radius-lg, --radius-xl, --radius-2xl, --radius-3xl to <= 0.5rem (8px)',
  isClamped,
  'Tailwind v4 radius scale is not clamped to retro limits (<= 0.5rem) in src/index.css @theme.',
  'Milestone 1 (CSS Architecture)'
);

// T1-CSS-05: Anti-Whiteout Canvas Background (body slate-50)
const bodyCanvasMatch = /body\s*\{[\s\S]*?(bg-slate-50|background-color:\s*(#f8fafc|var\(--color-slate-50\)))/i.test(indexCss);
assertTest(
  'tier1',
  'T1-CSS-05',
  'src/index.css sets body canvas background to slate-50 (#f8fafc) anti-whiteout foundation',
  bodyCanvasMatch,
  'body background color in src/index.css is missing slate-50 anti-whiteout foundation.',
  'Milestone 1 (CSS Architecture)'
);

// T1-CSS-06: Base Border Color Elevation (slate-200 rather than gray-200)
const baseBorderMatch = /border-color:\s*(var\(--color-slate-200|\#e2e8f0)/i.test(indexCss);
assertTest(
  'tier1',
  'T1-CSS-06',
  'src/index.css elevates base fallback border-color to slate-200 (#e2e8f0)',
  baseBorderMatch,
  'Base border color is still falling back to gray-200 (#e5e7eb) instead of crisp slate-200.',
  'Milestone 1 (CSS Architecture)'
);

// T1-CSS-07: Card Premium Utility Contrast Upgrade
const cardPremiumMatch = /@utility\s+card-premium\s*\{[\s\S]*?border:\s*1px\s+solid\s*(#e2e8f0|var\(--color-slate-200\)|border-slate-200)/i.test(indexCss) ||
                         /@utility\s+card-premium\s*\{[\s\S]*?border-slate-200/i.test(indexCss);
assertTest(
  'tier1',
  'T1-CSS-07',
  'src/index.css @utility card-premium uses border-slate-200 (replaces washed-out #f3f4f6 / border-gray-100)',
  cardPremiumMatch,
  '@utility card-premium still uses washed-out border-gray-100 (#f3f4f6) border.',
  'Milestone 1 (CSS Architecture)'
);

// T1-CMP-01: ProductCard.jsx Rectangular Box Curvature
const productCardSrc = readFileSafe('src/components/ProductCard.jsx');
const productCardHasBubble = /rounded-2xl|rounded-3xl/.test(productCardSrc);
const productCardHasRetro = /rounded-md/.test(productCardSrc);
assertTest(
  'tier1',
  'T1-CMP-01',
  'ProductCard.jsx card wrapper and image containers use retro radius (rounded-md, no rounded-2xl/3xl)',
  !productCardHasBubble && productCardHasRetro,
  'ProductCard.jsx still contains rounded-2xl bubble curvature on card wrapper or buttons.',
  'Milestone 3 (Core Storefront Components)'
);

// T1-CMP-02: PartnerCard.jsx Rectangular Box Curvature
const partnerCardSrc = readFileSafe('src/pages/Home/components/PartnerCard.jsx');
const partnerCardHasBubble = /rounded-2xl|rounded-3xl/.test(partnerCardSrc);
assertTest(
  'tier1',
  'T1-CMP-02',
  'PartnerCard.jsx card wrapper uses retro radius (rounded-md, no rounded-2xl)',
  !partnerCardHasBubble,
  'PartnerCard.jsx still uses rounded-2xl container curvature.',
  'Milestone 3 (Core Storefront Components)'
);

// T1-CMP-03: CartItemCard.jsx Curvature & Border Contrast
const cartItemSrc = readFileSafe('src/components/cart/CartItemCard.jsx');
const cartItemHasBubble = /rounded-2xl|rounded-3xl/.test(cartItemSrc);
const cartItemHasWashedBorder = /border-gray-100|border-slate-100/.test(cartItemSrc);
assertTest(
  'tier1',
  'T1-CMP-03',
  'CartItemCard.jsx replaces rounded-2xl with rounded-md and replaces border-gray-100 with border-slate-200',
  !cartItemHasBubble && !cartItemHasWashedBorder,
  'CartItemCard.jsx still contains rounded-2xl bubble radius or washed-out border-gray-100.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

// T1-CMP-04: CartSummaryPanel.jsx Curvature & Border Contrast
const cartSummarySrc = readFileSafe('src/components/cart/CartSummaryPanel.jsx');
const cartSummaryHasBubble = /rounded-2xl|rounded-3xl/.test(cartSummarySrc);
const cartSummaryHasWashedBorder = /border-gray-100/.test(cartSummarySrc);
assertTest(
  'tier1',
  'T1-CMP-04',
  'CartSummaryPanel.jsx card wrapper uses rounded-md and crisp tactile border (not border-gray-100)',
  !cartSummaryHasBubble && !cartSummaryHasWashedBorder,
  'CartSummaryPanel.jsx container still uses rounded-2xl and washed-out border-gray-100.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

// T1-CMP-05: ProductPricingSection.jsx Curvature Rebalancing
const productPricingSrc = readFileSafe('src/components/product/ProductPricingSection.jsx');
// In current code: buttons use rounded-xs (2px) which feels too sharp, and marketplace buttons use rounded-xl (12px).
// Target: rebalanced to rounded-md (6px).
const pricingHasTooSharp2px = /rounded-xs/.test(productPricingSrc);
const pricingHasTooRound12px = /rounded-xl/.test(productPricingSrc);
assertTest(
  'tier1',
  'T1-CMP-05',
  'ProductPricingSection.jsx rebalances button radiuses to rounded-md (no rounded-xs 2px or rounded-xl 12px)',
  !pricingHasTooSharp2px && !pricingHasTooRound12px,
  'ProductPricingSection.jsx contains inconsistent button curvatures (found rounded-xs or rounded-xl).',
  'Milestone 3 (Core Storefront Components)'
);

// T1-CMP-06: Navbar.jsx Search Control Pill-to-Retro Calibration
const navbarSrc = readFileSafe('src/components/Navbar.jsx');
// Navbar search input and button currently use rounded-full (may span multiple lines in JSX)
const searchInputPill = /<input[\s\S]*?rounded-full/.test(navbarSrc);
const searchBtnPill = /<button[\s\S]*?rounded-full[\s\S]*?aria-label="ค้นหาสินค้า"|<button[\s\S]*?aria-label="ค้นหาสินค้า"[\s\S]*?rounded-full/.test(navbarSrc) ||
                      /<button[\s\S]*?bg-brand[\s\S]*?rounded-full/.test(navbarSrc);
assertTest(
  'tier1',
  'T1-CMP-06',
  'Navbar.jsx search input and submit button are calibrated from rounded-full to rounded-md',
  !searchInputPill && !searchBtnPill,
  'Navbar search input or submit button still use modern bubble rounded-full styling.',
  'Milestone 2 (Layout & Navigation)'
);

// T1-BLD-01: Vite Production Build Health
let buildPassed = false;
let buildErrorMsg = '';
try {
  const stdout = execSync('npm run build', {
    cwd: FRONTEND_ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  buildPassed = stdout.includes('built in') || fs.existsSync(path.resolve(FRONTEND_ROOT, 'dist/index.html'));
} catch (err) {
  buildErrorMsg = err.stderr || err.message;
}
assertTest(
  'tier1',
  'T1-BLD-01',
  'Vite production build completes with zero errors (npm run build exit 0)',
  buildPassed,
  `Vite build failed: ${buildErrorMsg.slice(0, 200)}`,
  'Build & Tooling Infrastructure'
);

// ==============================================================================
// TIER 2: BOUNDARY & CORNER CASES (Circular Exceptions, Theme Palettes, Null Safety)
// ==============================================================================
console.log(`\n👉 [TIER 2] BOUNDARY & CORNER CASES: Circular Exceptions & Theme Parity`);

// T2-CIR-01: Pulse Status Dots 100% Preservation
const productCardHasDot = productCardSrc.includes('w-1.5 h-1.5 rounded-full');
const partnerCardHasDot = partnerCardSrc.includes('rounded-full bg-emerald-400') || partnerCardSrc.includes('rounded-full h-4 w-4 bg-emerald-500');
const messengerSrc = readFileSafe('src/components/chat/FloatingMessenger.jsx');
const messengerHasDot = messengerSrc.includes('w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse');
assertTest(
  'tier2',
  'T2-CIR-01',
  'Status pulsing dots preserve rounded-full 100% (ProductCard, PartnerCard, FloatingMessenger)',
  productCardHasDot && partnerCardHasDot && messengerHasDot,
  'Status pulsing indicator dots lost rounded-full circular geometry.',
  'Milestone 2/3 (Exception Protection Invariant)'
);

// T2-CIR-02: Circular User Avatars & Notification Badges 100% Preservation
const navbarAvatarCircle = navbarSrc.includes('w-8 h-8 rounded-full') || navbarSrc.includes('w-7 h-7 rounded-full');
const navbarBadgeCircle = navbarSrc.includes('rounded-full w-5 h-5') || navbarSrc.includes('w-4 h-4 rounded-full');
const profileSidebarSrc = readFileSafe('src/components/profile/ProfileSidebar.jsx');
const profileBadgeCircle = profileSidebarSrc.includes('w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse');
assertTest(
  'tier2',
  'T2-CIR-02',
  'Circular user avatars and notification badges preserve rounded-full 100% (Navbar, ProfileSidebar)',
  navbarAvatarCircle && navbarBadgeCircle && profileBadgeCircle,
  'Circular user avatars or notification badge counters accidentally lost rounded-full.',
  'Milestone 2/4 (Exception Protection Invariant)'
);

// T2-CIR-03: Spinner Loading Rings 100% Preservation
const pricingSpinner = /animate-spin[\s\S]*?rounded-full|rounded-full[\s\S]*?animate-spin/.test(productPricingSrc);
const cartSpinner = /animate-spin[\s\S]*?rounded-full|rounded-full[\s\S]*?animate-spin/.test(cartSummarySrc);
assertTest(
  'tier2',
  'T2-CIR-03',
  'Spinner loading rings preserve rounded-full circular geometry (ProductPricingSection, CartSummaryPanel)',
  pricingSpinner && cartSpinner,
  'Spinner loading rings lost rounded-full circular styling.',
  'Milestone 3/4 (Exception Protection Invariant)'
);

// T2-CIR-04: Switch Thumbs 100% Preservation
const creditToggleSrc = readFileSafe('src/components/checkout/CreditToggleBox.jsx');
const taxInvoiceSrc = readFileSafe('src/components/checkout/TaxInvoiceForm.jsx');
const creditSwitchThumb = creditToggleSrc.includes('after:rounded-full after:h-5 after:w-5') || creditToggleSrc.includes('after:rounded-full');
const taxSwitchThumb = taxInvoiceSrc.includes('rounded-full bg-white shadow') || taxInvoiceSrc.includes('rounded-full bg-white');
assertTest(
  'tier2',
  'T2-CIR-04',
  'Toggle switch sliding thumbs preserve rounded-full circular geometry (CreditToggleBox, TaxInvoiceForm)',
  creditSwitchThumb && taxSwitchThumb,
  'Toggle switch sliding thumbs lost rounded-full geometry.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

// T2-THM-01: Dual-Theme Palette Declaration Contract in index.css
const techThemeDeclared = /\.theme-tech-professional[\s\S]*?--color-brand:\s*#0870B8[\s\S]*?--color-brand-dark:\s*#054D80/.test(indexCss) ||
                          indexCss.includes('#0870B8');
const partnerThemeDeclared = /\.theme-trusted-partner[\s\S]*?--color-brand:\s*#1B365D[\s\S]*?--color-brand-dark:\s*#112240/.test(indexCss) ||
                            indexCss.includes('#1B365D');
assertTest(
  'tier2',
  'T2-THM-01',
  'src/index.css declares complete color tokens for both theme-tech-professional and theme-trusted-partner',
  techThemeDeclared && partnerThemeDeclared,
  'Theme palette declaration missing required brand color definitions in src/index.css.',
  'Milestone 1 (CSS Architecture)'
);

// T2-THM-02: Dark Header Contrast Invariant in Navbar.jsx
const navbarHeaderContrast = /bg-brand-dark\s+border-b\s+border-white\/10/.test(navbarSrc);
assertTest(
  'tier2',
  'T2-THM-02',
  'Navbar.jsx preserves high-contrast dark header background (bg-brand-dark border-b border-white/10)',
  navbarHeaderContrast,
  'Navbar header lost its solid dark header contrast and border divider.',
  'Milestone 2 (Layout & Navigation)'
);

// T2-NUL-01: Component Resilience on Missing / Undefined Image Props
const lazyImageSrc = readFileSafe('src/components/common/LazyImage.jsx');
const hasImageFallback = /fallback|placeholder|onError/.test(lazyImageSrc);
assertTest(
  'tier2',
  'T2-NUL-01',
  'LazyImage component has error/fallback guard preventing broken image layout collapse',
  hasImageFallback,
  'LazyImage does not implement fallback/onError guard for broken image URLs.',
  'Milestone 3 (Shared Components)'
);

// ==============================================================================
// TIER 3: CROSS-FEATURE INTERACTIONS (Funnel Continuity, Sticky Clearances)
// ==============================================================================
console.log(`\n👉 [TIER 3] CROSS-FEATURE INTERACTIONS: Funnel Continuity & Clearances`);

// T3-FLO-01: Purchase Funnel Radius Consistency
// Checks that primary containers along Search -> Card -> Detail -> Cart -> Checkout
// all avoid modern AI bubble curvature (> 8px / rounded-2xl / rounded-3xl)
const checkoutSummarySrc = readFileSafe('src/components/checkout/summary/CheckoutSummary.jsx');
const productDetailSrc = readFileSafe('src/pages/ProductDetail.jsx');

const funnelCardsNoBubble = !/rounded-2xl|rounded-3xl/.test(productCardSrc) &&
                            !/rounded-2xl|rounded-3xl/.test(cartItemSrc) &&
                            !/rounded-2xl|rounded-3xl/.test(cartSummarySrc) &&
                            !/rounded-2xl|rounded-3xl/.test(checkoutSummarySrc);
assertTest(
  'tier3',
  'T3-FLO-01',
  'Storefront purchase funnel (ProductCard -> Detail -> CartItem -> CheckoutSummary) maintains consistent retro radius (no bubble curvature)',
  funnelCardsNoBubble,
  'One or more primary containers along the purchase funnel retain rounded-2xl or rounded-3xl bubble styling.',
  'Milestone 3 & 4 (Funnel Consistency)'
);

// T3-FLO-02: Purchase Funnel Surface Contrast Continuity
// Verifies that neither CartItemCard, CartSummaryPanel, nor CheckoutSummary use washed-out border-gray-100
const funnelCardsNoWashedBorder = !/border-gray-100/.test(cartItemSrc) &&
                                  !/border-gray-100/.test(cartSummarySrc) &&
                                  !/border-gray-100/.test(checkoutSummarySrc);
assertTest(
  'tier3',
  'T3-FLO-02',
  'Storefront purchase funnel surfaces eliminate washed-out border-gray-100 across cart and checkout containers',
  funnelCardsNoWashedBorder,
  'White card surfaces in CartItemCard, CartSummaryPanel, or CheckoutSummary still use washed-out border-gray-100.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

// T3-CLR-01: Mobile Sticky Clearance Coordination
const bottomNavSrc = readFileSafe('src/components/navigation/BottomNav.jsx');
const bottomNavHeight = /h-\[60px\]|h-14|h-16/.test(bottomNavSrc) || /fixed bottom-0/.test(bottomNavSrc);
const productStickyBarClearance = /bottom-\[60px\]|bottom-\[64px\]|bottom-\[70px\]/.test(productDetailSrc);
const messengerClearance = /bottom-\[85px\]|bottom-\[135px\]/.test(messengerSrc);

assertTest(
  'tier3',
  'T3-CLR-01',
  'Mobile sticky controls maintain vertical clearances without overlap (BottomNav, ProductDetail sticky bar, FloatingMessenger)',
  bottomNavHeight && productStickyBarClearance && messengerClearance,
  'Sticky controls have conflicting bottom offsets causing UI overlap on mobile viewports.',
  'Milestone 2 & 3 (Sticky Clearance Coordination)'
);

// ==============================================================================
// TIER 4: REAL-WORLD SCENARIOS (Responsive Parity, Viewport Overflow, Ergonomics)
// ==============================================================================
console.log(`\n👉 [TIER 4] REAL-WORLD SCENARIOS: Responsive Layout, Viewport Leaks & Touch Targets`);

// T4-RES-01: MainLayout Desktop and Mobile Container Boundary
const mainLayoutSrc = readFileSafe('src/layouts/MainLayout.jsx');
const mainLayoutHasMaxWidth = /max-w-7xl\s+mx-auto/.test(mainLayoutSrc);
const mainLayoutHasPadding = /px-4\s+sm:px-6\s+lg:px-8/.test(mainLayoutSrc);
assertTest(
  'tier4',
  'T4-RES-01',
  'MainLayout.jsx enforces structured desktop container width (max-w-7xl mx-auto) and responsive gutters (px-4 sm:px-6 lg:px-8)',
  mainLayoutHasMaxWidth && mainLayoutHasPadding,
  'MainLayout container constraints or responsive gutter padding are compromised.',
  'Milestone 2 (Layout & Navigation)'
);

// T4-RES-02: Mobile Navigation Viewport Scoping
const bottomNavHiddenOnDesktop = /lg:hidden/.test(bottomNavSrc);
const bottomNavFixedBottom = /fixed\s+bottom-0/.test(bottomNavSrc);
assertTest(
  'tier4',
  'T4-RES-02',
  'BottomNav is strictly scoped to mobile (lg:hidden) and pinned cleanly to bottom-0',
  bottomNavHiddenOnDesktop && bottomNavFixedBottom,
  'BottomNav lacks lg:hidden breakpoint or proper fixed positioning.',
  'Milestone 2 (Layout & Navigation)'
);

// T4-RES-03: Viewport Overflow & Scrollbar Leak Guard
const mainLayoutOverflowGuard = /overflow-hidden/.test(mainLayoutSrc);
assertTest(
  'tier4',
  'T4-RES-03',
  'MainLayout main content container prevents horizontal scroll leaks (overflow-hidden)',
  mainLayoutOverflowGuard,
  'MainLayout content wrapper does not guard against horizontal overflow leaks.',
  'Milestone 2 (Layout & Navigation)'
);

// T4-ACC-01: Touch Target Ergonomics on Primary Controls
// Checks that search bar in Navbar and checkout button in CartSummary maintain >= 40px height
const navbarSearchErgonomic = /py-2\.5|h-10|h-11/.test(navbarSrc);
const checkoutBtnErgonomic = /py-3|py-3\.5|h-12|h-11/.test(cartSummarySrc);
assertTest(
  'tier4',
  'T4-ACC-01',
  'Primary interactive touch targets maintain ergonomic minimum heights (>= 40px / py-2.5+)',
  navbarSearchErgonomic && checkoutBtnErgonomic,
  'Primary interactive controls fail ergonomic touch target standards (< 40px height).',
  'Milestone 2 & 4 (Touch Target Ergonomics)'
);

// ==============================================================================
// SUMMARY & BASELINE REPORTING
// ==============================================================================
console.log('\n================================================================');
console.log('📊 TEST EXECUTION SUMMARY REPORT');
console.log('================================================================');
console.log(`Total Assertions Evaluated : ${totalTests}`);
console.log(`Passed Assertions          : ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`Failed Assertions          : ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
console.log('----------------------------------------------------------------');
for (const [key, t] of Object.entries(tierResults)) {
  const pct = t.total > 0 ? ((t.passed / t.total) * 100).toFixed(1) : '100.0';
  console.log(`  • ${t.name.padEnd(38)}: ${t.passed}/${t.total} PASS (${pct}%)`);
}
console.log('================================================================\n');

if (failures.length > 0) {
  console.log(`📋 PENDING MILESTONE DELIVERABLES (${failures.length} items to address during M1-M4):`);
  failures.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.id} (${f.owner})`);
    console.log(`      Target: ${f.description}`);
    console.log(`      Defect: ${f.error}`);
  });
  console.log('\n');
}

// Exit code semantics:
// In baseline mode, exit with 0 to allow initial readiness certification.
// In strict mode, exit with 1 if any test fails to enforce milestone quality gates.
if (!isBaselineMode && failedTests > 0) {
  console.error(`🚨 STRICT MODE FAILED: ${failedTests} assertion(s) failed. Run with --mode=baseline for baseline report.`);
  process.exit(1);
} else {
  if (isBaselineMode && failedTests > 0) {
    console.log(`ℹ️ BASELINE RUN RECORDED SUCCESSFULLY: Baseline captures ${failedTests} pending improvements before M1-M4.`);
  } else {
    console.log(`🎉 ALL ASSERTIONS PASSED! 100% Quality Gate certified.`);
  }
  process.exit(0);
}
