import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { calculatePromotionDiscount } from '../../dh-shared/src/priceEngine.js';

console.log('================================================================');
console.log('🧪 OPERATION FINAL REVIEW: PROMOTIONS & DISCOUNTS AUDIT & UPGRADE');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function verify(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`         ${err.message}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// Test Group 1: Math & Calculation Engine (dh-shared/priceEngine.js)
// -------------------------------------------------------------
console.log('👉 [1/7] Testing Pricing Engine & Financial Calculations');

verify('calculatePromotionDiscount handles FIXED_AMOUNT correctly without 0 baht bug', () => {
  const items = [{ sku: 'NB-DELL-5520', price: 15000, quantity: 1 }];
  const promo = { type: 'FIXED_AMOUNT', value: 1500, minSpend: 10000 };
  const discount = calculatePromotionDiscount(15000, items, promo);
  assert.strictEqual(discount, 1500, 'FIXED_AMOUNT must yield exactly 1500 baht');
});

verify('calculatePromotionDiscount clamps FIXED_AMOUNT to total applicable item value', () => {
  const items = [{ sku: 'MOUSE-PAD', price: 200, quantity: 1 }];
  const promo = { type: 'FIXED_AMOUNT', value: 500, minSpend: 0 };
  const discount = calculatePromotionDiscount(200, items, promo);
  assert.strictEqual(discount, 200, 'Discount must not exceed subtotal of applicable items (200 baht)');
});

verify('calculatePromotionDiscount handles PERCENTAGE and maxDiscount ceiling', () => {
  const items = [{ sku: 'LAPTOP-PRO', price: 40000, quantity: 1 }];
  const promo = { type: 'PERCENTAGE', value: 10, maxDiscount: 2000, minSpend: 20000 };
  const discount = calculatePromotionDiscount(40000, items, promo);
  assert.strictEqual(discount, 2000, 'Discount must be capped at maxDiscount (2000 baht)');
});

verify('calculatePromotionDiscount handles case-insensitive SKU matching', () => {
  const items = [{ sku: 'dell-g15-5520', price: 30000, quantity: 1 }];
  const promo = { type: 'FIXED_AMOUNT', value: 2000, applicableSkus: ['DELL-G15-5520'] };
  const discount = calculatePromotionDiscount(30000, items, promo);
  assert.strictEqual(discount, 2000, 'Must match lower-case item SKU with uppercase promo SKU');
});

// -------------------------------------------------------------
// Test Group 2: POS Billing & Atomic Quota Updates
// -------------------------------------------------------------
console.log('\n👉 [2/7] Testing POS Billing & Atomic Quota Transaction');

const billingTxPath = path.resolve('Management System/dh-backoffice-react/src/firebase/billingTransactionService.js');
const billingTxContent = fs.readFileSync(billingTxPath, 'utf8');

verify('billingTransactionService resolves appliedPromotion and appliedPromotions array', () => {
  assert(
    billingTxContent.includes('const promosList = Array.isArray(orderData.appliedPromotions)') &&
    billingTxContent.includes('orderData.appliedPromotion'),
    'Must resolve both appliedPromotions array and appliedPromotion singular object'
  );
  assert(
    billingTxContent.includes('quotaUsed: increment('),
    'Must increment quotaUsed atomically in transaction'
  );
});

const posActionsPath = path.resolve('Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
const posActionsContent = fs.readFileSync(posActionsPath, 'utf8');

verify('usePosActions provides appliedPromotions array and enforces quota guard', () => {
  assert(
    posActionsContent.includes('appliedPromotions: activeTab.appliedPromoDetails ? [activeTab.appliedPromoDetails] : []'),
    'Must pass appliedPromotions array to billingTransactionService'
  );
  assert(
    posActionsContent.includes('quotaLimit') && posActionsContent.includes('quotaUsed'),
    'handleApplyPromotion must verify quota limits before applying'
  );
});

// -------------------------------------------------------------
// Test Group 3: Security Rules & RBAC Permissions
// -------------------------------------------------------------
console.log('\n👉 [3/7] Testing Security Rules & RBAC Protection');

const rulesPath = path.resolve('Management System/firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

verify('firestore.rules locks promotion & freebie mutation to isManagerOrAdmin()', () => {
  assert(
    rulesContent.includes("match /promotions/{promoId}") &&
    rulesContent.includes("allow create, delete: if isManagerOrAdmin();"),
    'Promotion create/delete must be locked to isManagerOrAdmin'
  );
  assert(
    rulesContent.includes("match /freebies/{freebieId}") &&
    rulesContent.includes("allow create, delete: if isManagerOrAdmin();"),
    'Freebie create/delete must be locked to isManagerOrAdmin'
  );
});

verify('firestore.rules enforces quota ceiling on client quotaUsed updates', () => {
  assert(
    rulesContent.includes("request.resource.data.get('quotaUsed', 0) <= resource.data.quotaLimit"),
    'Must ensure quotaUsed cannot exceed quotaLimit via client updates'
  );
});

// -------------------------------------------------------------
// Test Group 4: UI Accessibility & Action Clarity
// -------------------------------------------------------------
console.log('\n👉 [4/7] Testing UI Accessibility, Mojibake Fixes & Guardrails');

const promoTablePath = path.resolve('Management System/dh-backoffice-react/src/pages/managers/components/promotion/PromotionTable.jsx');
const promoTableContent = fs.readFileSync(promoTablePath, 'utf8');

verify('PromotionTable action buttons are permanently visible (no hover required)', () => {
  assert(
    !promoTableContent.includes('opacity-0 group-hover:opacity-100'),
    'Action buttons must not hide behind group-hover opacity-0'
  );
  assert(
    promoTableContent.includes('ไม่มีขั้นต่ำ') && promoTableContent.includes('ลูกค้าทุกคน'),
    'Labels must be clean and not duplicate text'
  );
});

const promoModalPath = path.resolve('Management System/dh-backoffice-react/src/components/billing/pos/layout/PromoModal.jsx');
const promoModalContent = fs.readFileSync(promoModalPath, 'utf8');

verify('PromoModal displays badges for customerType, dates, minQty, and SKUs', () => {
  assert(promoModalContent.includes('isCustomerEligible'), 'Must flag customerType mismatch');
  assert(promoModalContent.includes('isNotExpired') && promoModalContent.includes('isStarted'), 'Must flag expired or inactive date range');
  assert(promoModalContent.includes('isQtyEligible'), 'Must flag minQty not met');
  assert(promoModalContent.includes('isProductEligible'), 'Must flag SKU/product mismatch');
});

const promoCardPath = path.resolve('Management System/dh-backoffice-react/src/components/todo/cards/PromotionCard.jsx');
const promoCardContent = fs.readFileSync(promoCardPath, 'utf8');

verify('PromotionCard has clean Thai text and binds promotion values', () => {
  assert(!promoCardContent.includes('เธ'), 'Must have zero mojibake text');
  assert(
    promoCardContent.includes('promoType') && promoCardContent.includes('promoValue'),
    'Must bind promoType and promoValue to display actual discounts'
  );
});

// -------------------------------------------------------------
// Test Group 5: Schema Registry & GA4 Telemetry
// -------------------------------------------------------------
console.log('\n👉 [5/7] Testing Central Schema Registry & GA4 Analytics');

const schemaKeysPath = path.resolve('Management System/dh-shared/src/firebase/schemaKeys.js');
const schemaKeysContent = fs.readFileSync(schemaKeysPath, 'utf8');

verify('schemaKeys.js registers PROMOTIONS and FREEBIES collections', () => {
  assert(schemaKeysContent.includes("PROMOTIONS: 'promotions'"), 'Must register PROMOTIONS');
  assert(schemaKeysContent.includes("FREEBIES: 'freebies'"), 'Must register FREEBIES');
});

const analyticsServicePath = path.resolve('Management System/dh-frontend/src/firebase/promotionAnalyticsService.js');
const analyticsServiceContent = fs.readFileSync(analyticsServicePath, 'utf8');

verify('promotionAnalyticsService is non-blocking and emits GA4 events', () => {
  assert(analyticsServiceContent.includes('trackPromotionView'), 'Must export trackPromotionView');
  assert(analyticsServiceContent.includes('trackPromotionSelect'), 'Must export trackPromotionSelect');
  assert(analyticsServiceContent.includes('logEvent(analytics,'), 'Must invoke logEvent safely');
});

const cartPromoPath = path.resolve('Management System/dh-frontend/src/components/cart/CartActivePromotions.jsx');
const cartPromoContent = fs.readFileSync(cartPromoPath, 'utf8');

verify('CartActivePromotions and PrivilegeSelector integrate telemetry', () => {
  assert(cartPromoContent.includes('trackPromotionView'), 'CartActivePromotions must call trackPromotionView');
  const privSelPath = path.resolve('Management System/dh-frontend/src/components/checkout/PrivilegeSelector.jsx');
  const privSelContent = fs.readFileSync(privSelPath, 'utf8');
  assert(privSelContent.includes('trackPromotionSelect'), 'PrivilegeSelector must call trackPromotionSelect');
});

// -------------------------------------------------------------
// Test Group 6: Watchlist Zero-Read IndexedDB SKU Validation
// -------------------------------------------------------------
console.log('\n👉 [6/7] Testing Watchlist Zero-Read IDB SKU Validation');

const promoServicePath = path.resolve('Management System/dh-backoffice-react/src/firebase/promotionService.js');
const promoServiceContent = fs.readFileSync(promoServicePath, 'utf8');

verify('promotionService uses inventorySyncMetaService L1/L2 cache before Firestore fallback', () => {
  assert(
    promoServiceContent.includes('inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: false })'),
    'Must check inventorySyncMetaService first for zero network reads'
  );
  assert(
    promoServiceContent.includes('catalogSkuMap.set('),
    'Must map SKUs for O(1) in-memory lookup'
  );
  assert(
    promoServiceContent.includes('.toUpperCase()') && promoServiceContent.includes('.trim()'),
    'Must match SKUs case-insensitively and trimmed'
  );
  assert(
    promoServiceContent.includes("where('sku', 'in', chunk)"),
    'Must retain Firestore chunked query fallback'
  );
});

// -------------------------------------------------------------
// Test Group 7: Local Grimoire Protocol Compliance
// -------------------------------------------------------------
console.log('\n👉 [7/7] Testing Local Grimoire Protocol (ssr memory promotions.md)');

const grimoirePath = path.resolve('Management System/dh-backoffice-react/src/pages/managers/ssr memory promotions.md');
verify('ssr memory promotions.md exists and complies with 80-line / 6KB limit', () => {
  assert(fs.existsSync(grimoirePath), 'Grimoire file must exist');
  const content = fs.readFileSync(grimoirePath, 'utf8');
  const lines = content.split('\n').length;
  const bytes = Buffer.byteLength(content, 'utf8');
  assert(lines <= 80, `Grimoire lines (${lines}) must be <= 80`);
  assert(bytes <= 6144, `Grimoire bytes (${bytes}) must be <= 6KB`);
  assert(content.includes('<flow_and_entry>'), 'Must have <flow_and_entry>');
  assert(content.includes('<core_schema>'), 'Must have <core_schema>');
  assert(content.includes('<business_rules>'), 'Must have <business_rules>');
  assert(content.includes('<cross_impact>'), 'Must have <cross_impact>');
  assert(content.includes('<pitfalls_and_lessons>'), 'Must have <pitfalls_and_lessons>');
});

console.log('\n================================================================');
console.log(`📊 FINAL RESULT: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
