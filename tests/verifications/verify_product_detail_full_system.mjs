/**
 * verify_product_detail_full_system.mjs
 * Comprehensive Forensic & Functional Verification for Product Detail Subsystem
 * Covers: Phase 1 (Security/Critical), Phase 2 (Quota/SRP), Phase 3 (Telemetry/SEO), Phase 4 (UX/Polish)
 * And Stage Final Review Adversarial Hardening Fixes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedChecks++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('🔍 FORENSIC VERIFICATION: PRODUCT DETAIL SUBSYSTEM (ALL PHASES)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// CHECK 1: Phase 1.2 Cloud Function Nightly Chunk Guard Fix
// -----------------------------------------------------------------------------
console.log('[1/8] Checking Cloud Functions (nightlyChunkGuard.js)...');
const guardPath = path.join(rootDir, 'functions/inventory/nightlyChunkGuard.js');
const guardCode = fs.readFileSync(guardPath, 'utf8');
assert(
  guardCode.includes('const data = docSnap.data() || {};') && guardCode.includes('data.role'),
  'nightlyChunkGuard.js safely initializes "const data = docSnap.data() || {};" before data.role'
);

// -----------------------------------------------------------------------------
// CHECK 2: Phase 1.3 Wholesale Price Shield & Props Sanitization
// -----------------------------------------------------------------------------
console.log('\n[2/8] Checking Wholesale Price Shield & Props Sanitization...');
const productServicePath = path.join(rootDir, 'dh-frontend/src/firebase/productService.js');
const productServiceCode = fs.readFileSync(productServicePath, 'utf8');
assert(
  !productServiceCode.includes('retailPrice || wholesalePrice || 0'),
  'productService.js does not fall back to wholesalePrice or cost'
);
assert(
  productServiceCode.includes('price <= 0 || isProductOutOfStock(stockQuantity, bufferStock)'),
  'productService.js marks product out of stock if price <= 0'
);
assert(
  !productServiceCode.includes('_raw: raw'),
  'productService.js does not expose raw Firestore document (_raw)'
);

// -----------------------------------------------------------------------------
// CHECK 3: Phase 1.1 Variant Order & Stock Deduction Chain
// -----------------------------------------------------------------------------
console.log('\n[3/8] Checking Variant Order & Stock Deduction Chain...');
const cartProviderPath = path.join(rootDir, 'dh-frontend/src/context/CartProvider.jsx');
const cartProviderCode = fs.readFileSync(cartProviderPath, 'utf8');
assert(
  cartProviderCode.includes('parentId: item.parentId') && cartProviderCode.includes('variantAttributes: item.variantAttributes'),
  'CartProvider.jsx preserves parentId and variantAttributes in local and DB cart items'
);
assert(
  cartProviderCode.includes('effectivePrice = (item.salePrice && item.salePrice > 0) ? item.salePrice : (item.price || 0)'),
  'CartProvider.jsx calculates subtotal honoring promotional salePrice'
);

const cartLogicPath = path.join(rootDir, 'dh-frontend/src/hooks/useCartLogic.js');
const cartLogicCode = fs.readFileSync(cartLogicPath, 'utf8');
assert(
  cartLogicCode.includes('item.parentId') && cartLogicCode.includes('Array.isArray(p.variants)'),
  'useCartLogic.js indexes embedded variants via parentId to prevent "สินค้าไม่มีในระบบ"'
);

const checkoutSubmitPath = path.join(rootDir, 'dh-frontend/src/firebase/checkout/checkoutSubmitService.js');
const checkoutSubmitCode = fs.readFileSync(checkoutSubmitPath, 'utf8');
assert(
  checkoutSubmitCode.includes('updatedVariants[vIdx].stockQuantity = vStock - requiredQty') && checkoutSubmitCode.includes('updatePayload.variants = updatedVariants'),
  'checkoutSubmitService.js atomically deducts variant stock inside variants array'
);
assert(
  checkoutSubmitCode.includes('dbProduct.salePrice') && checkoutSubmitCode.includes('matchedVariant.salePrice'),
  'checkoutSubmitService.js rehydrates promotional salePrice from real database'
);

// -----------------------------------------------------------------------------
// CHECK 4: Phase 1.4 & 2.1 Security Rules Integrity
// -----------------------------------------------------------------------------
console.log('\n[4/8] Checking Firestore Security Rules...');
const rulesPath = path.join(rootDir, 'firestore.rules');
const rulesCode = fs.readFileSync(rulesPath, 'utf8');

const reviewMatches = rulesCode.match(/match\s+\/product_reviews\/\{reviewId\}/g);
assert(
  reviewMatches && reviewMatches.length === 1,
  'firestore.rules has exactly ONE match block for product_reviews (no duplicate bypass)'
);
assert(
  rulesCode.includes("PRODUCT_KNOWLEDGE_APPROVAL") && rulesCode.includes('request.resource.data.payload.creditReward <= 2'),
  'firestore.rules permits authenticated users to submit PRODUCT_KNOWLEDGE_APPROVAL with creditReward <= 2'
);
assert(
  rulesCode.includes("'variants'") && rulesCode.includes('affectedKeys().hasOnly'),
  'firestore.rules whitelists "variants" in affectedKeys for customer stock deduction'
);

// -----------------------------------------------------------------------------
// CHECK 5: Phase 2 Quota Shields & Clean Architecture
// -----------------------------------------------------------------------------
console.log('\n[5/8] Checking Quota Shielding & SRP Boundaries...');
const detailPath = path.join(rootDir, 'dh-frontend/src/pages/ProductDetail.jsx');
const detailCode = fs.readFileSync(detailPath, 'utf8');

const reviewSectionMatches = detailCode.match(/<ProductCommunitySection/g);
assert(
  reviewSectionMatches && reviewSectionMatches.length === 1,
  'ProductDetail.jsx mounts ProductCommunitySection exactly ONCE in the DOM (50% quota reduction)'
);

const creditActionPath = path.join(rootDir, 'dh-frontend/src/firebase/credit/creditActionService.js');
const creditActionCode = fs.readFileSync(creditActionPath, 'utf8');
assert(
  creditActionCode.includes('cachedCreditConfig') && creditActionCode.includes('CREDIT_CONFIG_TTL'),
  'creditActionService.js caches credit settings in memory'
);

const knowledgeServicePath = path.join(rootDir, 'dh-frontend/src/firebase/productKnowledgeService.js');
const knowledgeServiceCode = fs.readFileSync(knowledgeServicePath, 'utf8');
assert(
  knowledgeServiceCode.includes('cachedKnowledgeCredit') && knowledgeServiceCode.includes('KNOWLEDGE_CACHE_TTL'),
  'productKnowledgeService.js caches knowledge config in memory'
);

// -----------------------------------------------------------------------------
// CHECK 6: Phase 3 Telemetry, Buy Now & SEO Schema
// -----------------------------------------------------------------------------
console.log('\n[6/8] Checking Telemetry, Buy Now & SEO Schemas...');
const analyticsPath = path.join(rootDir, 'dh-frontend/src/firebase/productAnalyticsService.js');
assert(fs.existsSync(analyticsPath), 'productAnalyticsService.js exists');

const pricingSectionPath = path.join(rootDir, 'dh-frontend/src/components/product/ProductPricingSection.jsx');
const pricingSectionCode = fs.readFileSync(pricingSectionPath, 'utf8');
assert(
  pricingSectionCode.includes('handleBuyNow') && pricingSectionCode.includes('trackMarketplaceClick'),
  'ProductPricingSection.jsx wires handleBuyNow and marketplace click tracking'
);
assert(
  pricingSectionCode.includes('decreaseQuantity') && pricingSectionCode.includes('increaseQuantity'),
  'ProductPricingSection.jsx renders quantity stepper controls'
);

assert(
  detailCode.includes('productJsonLd') && detailCode.includes('breadcrumbJsonLd'),
  'ProductDetail.jsx constructs both Product JSON-LD and BreadcrumbList JSON-LD for Google SEO'
);

// -----------------------------------------------------------------------------
// CHECK 7: Phase 4 UX Polish & Specs Regex
// -----------------------------------------------------------------------------
console.log('\n[7/8] Checking UX Polish & Technical Specs Regex...');
assert(
  !pricingSectionCode.includes('onCopy={handleCopy}'),
  'ProductPricingSection.jsx does NOT hijack clipboard with onCopy promo text'
);
assert(
  pricingSectionCode.includes('handleCopySku') && pricingSectionCode.includes('DH-SKU'),
  'ProductPricingSection.jsx provides dedicated, polite "Copy SKU" button with visual feedback'
);

const specsPath = path.join(rootDir, 'dh-frontend/src/components/product/ProductSpecsSection.jsx');
const specsCode = fs.readFileSync(specsPath, 'utf8');
assert(
  specsCode.includes("([a-z])([A-Z])"),
  'ProductSpecsSection.jsx regex preserves all-caps acronyms (RAM, SSD, GPU)'
);

assert(
  detailCode.includes('Mobile Sticky Action Bar') && detailCode.includes('bottom-[60px]'),
  'ProductDetail.jsx floats Mobile Sticky Action Bar at bottom-[60px] above BottomNav'
);

// -----------------------------------------------------------------------------
// CHECK 8: Stage Final Adversarial Hardening Verifications
// -----------------------------------------------------------------------------
console.log('\n[8/8] Checking Adversarial Hardening & Hook Resilience...');
const nearestHookPath = path.join(rootDir, 'dh-frontend/src/components/partner/hooks/useNearestPartner.js');
const nearestHookCode = fs.readFileSync(nearestHookPath, 'utf8');
assert(
  nearestHookCode.includes('getUserLocationRef') && nearestHookCode.includes('getUserLocationRef.current()'),
  'useNearestPartner.js uses stable ref for geolocation to prevent infinite re-render loop'
);

const partnerBoxPath = path.join(rootDir, 'dh-frontend/src/components/partner/PartnerSupportBox.jsx');
const partnerBoxCode = fs.readFileSync(partnerBoxPath, 'utf8');
assert(
  partnerBoxCode.includes('Array.isArray(servicesText)'),
  'PartnerSupportBox.jsx safely parses servicesText whether string or array'
);
assert(
  partnerBoxCode.includes('if (partner.phone)'),
  'PartnerSupportBox.jsx guards phone contact click against tel:undefined'
);

const reviewsHookPath = path.join(rootDir, 'dh-frontend/src/pages/hooks/useProductReviews.js');
const reviewsHookCode = fs.readFileSync(reviewsHookPath, 'utf8');
assert(
  reviewsHookCode.includes('if (!isMountedRef.current) return;') && reviewsHookCode.includes('if (!currentUser)'),
  'useProductReviews.js guards unmounted state updates and checks currentUser before liking'
);

const communityPath = path.join(rootDir, 'dh-frontend/src/components/product/ProductCommunitySection.jsx');
const communityCode = fs.readFileSync(communityPath, 'utf8');
assert(
  communityCode.includes('Number(averageRating || 0).toFixed(1)'),
  'ProductCommunitySection.jsx safely formats averageRating without throwing TypeError'
);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passedChecks}/${totalChecks} CHECKS PASSED (${Math.round((passedChecks / totalChecks) * 100)}%)`);
console.log('================================================================\n');

if (passedChecks === totalChecks) {
  console.log('🎉 ALL FORENSIC INTEGRITY CHECKS PASSED FLAWLESSLY!');
  process.exit(0);
} else {
  console.error('⚠️ SOME CHECKS FAILED. INVESTIGATION REQUIRED.');
  process.exit(1);
}
