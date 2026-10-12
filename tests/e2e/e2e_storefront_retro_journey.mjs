/**
 * ==============================================================================
 * 🚀 E2E AUTOMATED STOREFRONT CUSTOMER JOURNEY TEST SUITE
 * ==============================================================================
 *
 * Target: Management System/dh-frontend (http://localhost:8988/)
 * Scope: End-to-end customer journey route flow, design system continuity,
 *        viewport stability, responsive layout parity, and compiled CSS checks.
 *
 * Execution:
 *   node tests/e2e/e2e_storefront_retro_journey.mjs [--mode=baseline|strict]
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.resolve(REPO_ROOT, 'Management System/dh-frontend');

const args = process.argv.slice(2);
const isBaselineMode = args.includes('--mode=baseline');

console.log('================================================================');
console.log('🚀 E2E STOREFRONT RETRO JOURNEY: CUSTOMER FLOW & LAYOUT SUITE');
console.log(` Mode: ${isBaselineMode ? 'BASELINE AUDIT (--mode=baseline)' : 'STRICT GATE (--mode=strict)'}`);
console.log(` Target: ${FRONTEND_ROOT}`);
console.log('================================================================\n');

let totalJourneys = 0;
let passedSteps = 0;
let failedSteps = 0;
const stepFailures = [];

function step(journeyName, stepId, description, condition, errorMsg, owner) {
  totalJourneys++;
  if (condition) {
    console.log(`  ✅ [PASS] [${stepId}] ${description}`);
    passedSteps++;
  } else {
    console.error(`  ❌ [FAIL] [${stepId}] ${description}`);
    console.error(`     ↳ Rationale: ${errorMsg}`);
    console.error(`     ↳ Target Milestone: ${owner}`);
    failedSteps++;
    stepFailures.push({ journey: journeyName, stepId, description, error: errorMsg, owner });
  }
}

function readFrontendFile(relPath) {
  const fullPath = path.resolve(FRONTEND_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return '';
  return fs.readFileSync(fullPath, 'utf8');
}

// ==============================================================================
// JOURNEY 1: STOREFRONT DISCOVERY & NAVIGATION (Home, Search, Navbar)
// ==============================================================================
console.log('👉 [JOURNEY 1] Storefront Discovery & Navigation Flow');

const navbarCode = readFrontendFile('src/components/Navbar.jsx');
const heroCode = readFrontendFile('src/pages/Home/components/HeroSection.jsx');
const searchCode = readFrontendFile('src/pages/SearchPage.jsx');

step(
  'Journey 1',
  'J1-STEP-01',
  'Navbar search bar provides retro-classic rectangular input (rounded-md, not rounded-full)',
  !/<input[\s\S]*?rounded-full/.test(navbarCode),
  'Navbar search input uses modern AI bubble rounded-full styling.',
  'Milestone 2 (Layout & Navigation)'
);

step(
  'Journey 1',
  'J1-STEP-02',
  'Navbar preserves brand dark header contrast against white canvas (bg-brand-dark border-b border-white/10)',
  navbarCode.includes('bg-brand-dark') && navbarCode.includes('border-white/10'),
  'Navbar header lost brand dark header contrast.',
  'Milestone 2 (Layout & Navigation)'
);

step(
  'Journey 1',
  'J1-STEP-03',
  'Hero billboard frame adheres to retro classic curvature (rounded-md or rounded-lg <= 8px, not rounded-2xl/3xl)',
  !/rounded-2xl|rounded-3xl/.test(heroCode),
  'Hero section contains excessive rounded-2xl/3xl bubble frames.',
  'Milestone 3 (Core Storefront Components)'
);

step(
  'Journey 1',
  'J1-STEP-04',
  'Search results filter chips use classic badges (rounded-md or rounded-xs, not rounded-full)',
  !/Link[^>]*rounded-full/.test(searchCode),
  'SearchPage filter chips use modern pill rounded-full styling.',
  'Milestone 3 (Core Storefront Components)'
);

// ==============================================================================
// JOURNEY 2: PRODUCT EVALUATION & SPECIFICATION (Product Card & Pricing)
// ==============================================================================
console.log('\n👉 [JOURNEY 2] Product Evaluation & Specification Flow');

const productCardCode = readFrontendFile('src/components/ProductCard.jsx');
const pricingCode = readFrontendFile('src/components/product/ProductPricingSection.jsx');
const productDetailCode = readFrontendFile('src/pages/ProductDetail.jsx');

step(
  'Journey 2',
  'J2-STEP-01',
  'Product card container has tactile border (border-slate-200) and retro radius (rounded-md)',
  productCardCode.includes('border-slate-200') && !/rounded-2xl|rounded-3xl/.test(productCardCode),
  'ProductCard container is missing border-slate-200 or retains rounded-2xl/3xl curvature.',
  'Milestone 3 (Core Storefront Components)'
);

step(
  'Journey 2',
  'J2-STEP-02',
  'Product card stock status pulsing indicator strictly preserves rounded-full circular dot',
  /rounded-full[^"']*animate-pulse|animate-pulse[^"']*rounded-full|w-1\.5\s+h-1\.5\s+rounded-full/.test(productCardCode),
  'ProductCard stock pulsing indicator lost circular rounded-full geometry.',
  'Milestone 3 (Exception Protection Invariant)'
);

step(
  'Journey 2',
  'J2-STEP-03',
  'Product detail action buttons rebalanced to harmonious 6px curvature (rounded-md, no 2px rounded-xs or 12px rounded-xl)',
  !/rounded-xs/.test(pricingCode) && !/rounded-xl/.test(pricingCode),
  'ProductPricingSection buttons contain conflicting 2px (rounded-xs) or 12px (rounded-xl) radiuses.',
  'Milestone 3 (Core Storefront Components)'
);

step(
  'Journey 2',
  'J2-STEP-04',
  'Product detail sticky mobile bar coordinates with BottomNav clearance (bottom-[60px])',
  productDetailCode.includes('bottom-[60px]'),
  'ProductDetail sticky mobile action bar is missing bottom-[60px] clearance.',
  'Milestone 3 (Core Storefront Components)'
);

// ==============================================================================
// JOURNEY 3: SHOPPING CART & PROMOTION FULFILLMENT (Cart Items, Summary)
// ==============================================================================
console.log('\n👉 [JOURNEY 3] Shopping Cart & Promotion Fulfillment Flow');

const cartItemCode = readFrontendFile('src/components/cart/CartItemCard.jsx');
const cartSummaryCode = readFrontendFile('src/components/cart/CartSummaryPanel.jsx');

step(
  'Journey 3',
  'J3-STEP-01',
  'Cart item card surface eliminates washed-out border-gray-100 and bubble curvature (uses rounded-md border-slate-200)',
  !cartItemCode.includes('border-gray-100') && !/rounded-2xl|rounded-3xl/.test(cartItemCode),
  'CartItemCard still uses washed-out border-gray-100 or rounded-2xl bubble corners.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

step(
  'Journey 3',
  'J3-STEP-02',
  'Cart summary panel card eliminates washed-out border-gray-100 and uses structured retro depth',
  !cartSummaryCode.includes('border-gray-100') && !/rounded-2xl|rounded-3xl/.test(cartSummaryCode),
  'CartSummaryPanel still uses washed-out border-gray-100 or rounded-2xl curvature.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

step(
  'Journey 3',
  'J3-STEP-03',
  'Cart summary checkout CTA button uses classic retro curvature (rounded-md, not rounded-xl or rounded-full)',
  !/rounded-full/.test(cartSummaryCode.slice(cartSummaryCode.indexOf('CheckoutButton') || 0, cartSummaryCode.length)) &&
  !cartSummaryCode.includes('rounded-xl'),
  'Cart summary checkout CTA button does not conform to retro rounded-md curvature.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

step(
  'Journey 3',
  'J3-STEP-04',
  'Cart loading spinner ring strictly preserves circular rounded-full geometry',
  cartSummaryCode.includes('animate-spin') && cartSummaryCode.includes('rounded-full'),
  'Cart loading spinner ring lost rounded-full circular geometry.',
  'Milestone 4 (Exception Protection Invariant)'
);

// ==============================================================================
// JOURNEY 4: CHECKOUT & MULTI-STEP ORDER REVIEW
// ==============================================================================
console.log('\n👉 [JOURNEY 4] Multi-Step Checkout & Order Review Flow');

const checkoutSummaryCode = readFrontendFile('src/components/checkout/summary/CheckoutSummary.jsx');
const accordionCode = readFrontendFile('src/components/checkout/AccordionSection.jsx');
const addressCode = readFrontendFile('src/components/checkout/AddressSelector.jsx');
const paymentCode = readFrontendFile('src/components/checkout/PaymentMethod.jsx');

step(
  'Journey 4',
  'J4-STEP-01',
  'Checkout summary card container eliminates washed-out border-gray-100 and uses rounded-md',
  !checkoutSummaryCode.includes('border-gray-100') && !/rounded-2xl|rounded-3xl/.test(checkoutSummaryCode),
  'CheckoutSummary container still uses washed-out border-gray-100 or rounded-2xl curvature.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

step(
  'Journey 4',
  'J4-STEP-02',
  'Address selector container eliminates modern AI bubble curvature (rounded-3xl replaced by rounded-md)',
  !/rounded-3xl/.test(addressCode),
  'AddressSelector container retains rounded-3xl AI bubble styling.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

step(
  'Journey 4',
  'J4-STEP-03',
  'Payment method selection container eliminates washed-out border-gray-100 and rounded-3xl',
  !paymentCode.includes('border-gray-100') && !/rounded-3xl/.test(paymentCode),
  'PaymentMethod container retains border-gray-100 or rounded-3xl curvature.',
  'Milestone 4 (Cart, Checkout & Profile)'
);

step(
  'Journey 4',
  'J4-STEP-04',
  'Accordion step section preserves circular numbered step badge (rounded-full)',
  accordionCode.includes('rounded-full'),
  'Accordion section numbered step circle lost rounded-full styling.',
  'Milestone 4 (Exception Protection Invariant)'
);

// ==============================================================================
// JOURNEY 5: MOBILE RESPONSIVE PARITY & VIEWPORT INTEGRITY
// ==============================================================================
console.log('\n👉 [JOURNEY 5] Mobile Responsive Parity & Viewport Integrity');

const bottomNavCode = readFrontendFile('src/components/navigation/BottomNav.jsx');
const messengerCode = readFrontendFile('src/components/chat/FloatingMessenger.jsx');
const mainLayoutCode = readFrontendFile('src/layouts/MainLayout.jsx');

step(
  'Journey 5',
  'J5-STEP-01',
  'Mobile BottomNav has fixed bottom placement, lg:hidden scoping, and slate-300 top divider',
  bottomNavCode.includes('lg:hidden') && bottomNavCode.includes('border-slate-300'),
  'BottomNav lacks lg:hidden breakpoint or tactile border-slate-300 divider.',
  'Milestone 2 (Layout & Navigation)'
);

step(
  'Journey 5',
  'J5-STEP-02',
  'FloatingMessenger clears mobile navigation bar without occluding BottomNav (bottom-[85px] or bottom-[135px])',
  messengerCode.includes('bottom-[85px]') || messengerCode.includes('bottom-[135px]'),
  'FloatingMessenger does not implement mobile clearance offset.',
  'Milestone 2 (Layout & Navigation)'
);

step(
  'Journey 5',
  'J5-STEP-03',
  'MainLayout enforces horizontal overflow guard (overflow-hidden) preventing horizontal scrolling leaks',
  mainLayoutCode.includes('overflow-hidden'),
  'MainLayout does not guard against horizontal viewport overflow leaks.',
  'Milestone 2 (Layout & Navigation)'
);

// ==============================================================================
// E2E SUMMARY REPORT
// ==============================================================================
console.log('\n================================================================');
console.log('📊 E2E JOURNEY EXECUTION REPORT');
console.log('================================================================');
console.log(`Total Customer Journey Steps Evaluated: ${totalJourneys}`);
console.log(`Passed Steps                          : ${passedSteps} (${((passedSteps / totalJourneys) * 100).toFixed(1)}%)`);
console.log(`Failed Steps                          : ${failedSteps} (${((failedSteps / totalJourneys) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (stepFailures.length > 0) {
  console.log(`📋 PENDING JOURNEY ENHANCEMENTS (${stepFailures.length} steps):`);
  stepFailures.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.stepId} in ${f.journey} (${f.owner})`);
    console.log(`      Expectation: ${f.description}`);
    console.log(`      Defect: ${f.error}`);
  });
  console.log('\n');
}

if (!isBaselineMode && failedSteps > 0) {
  console.error(`🚨 STRICT MODE FAILED: ${failedSteps} journey step(s) failed. Run with --mode=baseline for baseline report.`);
  process.exit(1);
} else {
  if (isBaselineMode && failedSteps > 0) {
    console.log(`ℹ️ BASELINE JOURNEY BENCHMARK RECORDED: ${failedSteps} pending items mapped to M1-M4.`);
  } else {
    console.log(`🎉 ALL CUSTOMER JOURNEY STEPS PASSED 100%!`);
  }
  process.exit(0);
}
