/**
 * ==============================================================================
 * 🛡️ CHALLENGER M3: EMPIRICAL ADVERSARIAL TEST SUITE
 * Domain Cards, Product Pricing Section, Button Curvature & Circular Invariants
 * ==============================================================================
 *
 * Target: Milestone M3 deliverables:
 *   - Management System/dh-frontend/src/components/product/ProductPricingSection.jsx
 *   - Management System/dh-frontend/src/components/ProductCard.jsx
 *   - Management System/dh-frontend/src/pages/Home/components/PartnerCard.jsx
 *   - Management System/dh-frontend/src/pages/Home/components/FeaturedSpares.jsx
 *   - Management System/dh-frontend/src/pages/ProductDetail.jsx
 *   - Management System/dh-frontend/src/pages/Categories/ (CategoryCard, CategoryModal, CategoriesMain)
 *
 * Key Challenges:
 *   1. ProductPricingSection: Strict regex/AST scan proving ZERO occurrences of rounded-xs or rounded-xl
 *   2. ProductCard & PartnerCard: Stock indicator dot and online indicator dot remain pure circular geometry (rounded-full) across all states
 *   3. Domain card curvature: 0.3rem - 0.5rem (rounded-sm to rounded-md) across cards, inputs, buttons, steppers, and containers
 *   4. State invariance: stock status toggle (READY vs OUT OF STOCK) preserves dot geometry without squircle deformation
 *   5. Tactile contrast & depth: border-slate-200 / border-slate-300 borders and structured shadows
 *
 * Execution:
 *   node tests/adversarial/challenger_m3_card_pricing_stress.mjs
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.resolve(REPO_ROOT, 'Management System/dh-frontend');

console.log('================================================================');
console.log('🛡️ CHALLENGER M3: DOMAIN CARDS & PRICING ADVERSARIAL STRESS SUITE');
console.log(` Target: ${FRONTEND_ROOT}`);
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const findings = [];
const caveats = [];

function check(id, title, testFn) {
  totalChecks++;
  try {
    const detail = testFn();
    passedChecks++;
    console.log(`✅ [PASS] [${id}] ${title}`);
    if (detail) console.log(`          ↳ ${detail}`);
  } catch (err) {
    failedChecks++;
    console.error(`❌ [FAIL] [${id}] ${title}`);
    console.error(`          ↳ ${err.message}`);
    findings.push({ id, title, error: err.message });
  }
}

function readFileSafe(relPath) {
  const fullPath = path.resolve(FRONTEND_ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `Target file does not exist: ${fullPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

// Load source files
const pricingSrc = readFileSafe('src/components/product/ProductPricingSection.jsx');
const productCardSrc = readFileSafe('src/components/ProductCard.jsx');
const partnerCardSrc = readFileSafe('src/pages/Home/components/PartnerCard.jsx');
const featuredSparesSrc = readFileSafe('src/pages/Home/components/FeaturedSpares.jsx');
const productDetailSrc = readFileSafe('src/pages/ProductDetail.jsx');
const categoryCardSrc = readFileSafe('src/pages/Categories/components/CategoryCard.jsx');
const categoryModalSrc = readFileSafe('src/pages/Categories/components/CategoryModal.jsx');
const categoriesMainSrc = readFileSafe('src/pages/Categories/CategoriesMain.jsx');

console.log('--- CHALLENGE 1: PRODUCT PRICING SECTION STRICT CURVATURE & SCAN ---');

// 1.1 Strict regex scan for ZERO rounded-xs occurrences
check('C1-PRC-01', 'ProductPricingSection: ZERO occurrences of rounded-xs (2px) anywhere in file', () => {
  const matches = pricingSrc.match(/\brounded-xs\b/g);
  assert.strictEqual(matches, null, `Found ${matches?.length} occurrence(s) of rounded-xs in ProductPricingSection.jsx`);
  return 'Confirmed 0 occurrences of rounded-xs across entire file';
});

// 1.2 Strict regex scan for ZERO rounded-xl occurrences
check('C1-PRC-02', 'ProductPricingSection: ZERO occurrences of rounded-xl (12px) anywhere in file', () => {
  const matches = pricingSrc.match(/\brounded-xl\b/g);
  assert.strictEqual(matches, null, `Found ${matches?.length} occurrence(s) of rounded-xl in ProductPricingSection.jsx`);
  return 'Confirmed 0 occurrences of rounded-xl across entire file';
});

// 1.3 Strict scan for arbitrary pixel curvature overrides (rounded-[2px], rounded-[12px], etc.)
check('C1-PRC-03', 'ProductPricingSection: ZERO arbitrary pixel-bracket radiuses rounded-[...px]', () => {
  const matches = pricingSrc.match(/rounded-\[\d+px\]/g);
  assert.strictEqual(matches, null, `Found arbitrary bracketed radius overrides: ${matches?.join(', ')}`);
  return 'Zero arbitrary bracketed radius overrides detected';
});

// 1.4 Strict scan for bubble curvature (rounded-2xl, rounded-3xl)
check('C1-PRC-04', 'ProductPricingSection: ZERO rounded-2xl or rounded-3xl bubble curvature', () => {
  const matches = pricingSrc.match(/\brounded-(?:2xl|3xl)\b/g);
  assert.strictEqual(matches, null, `Found bubble curvature: ${matches?.join(', ')}`);
  return 'Zero rounded-2xl / rounded-3xl classes detected';
});

// 1.5 Quantity stepper container curvature
check('C1-PRC-05', 'Quantity stepper container uses calibrated rounded-md (6px) with slate-200 border', () => {
  const stepperContainer = pricingSrc.match(/<div className="([^"]*rounded-md[^"]*)"[\s\S]*?aria-label="ลดจำนวน"/);
  assert.ok(stepperContainer, 'Could not find quantity stepper container with rounded-md before decrease button');
  const classes = stepperContainer[1];
  assert.ok(classes.includes('rounded-md'), 'Quantity stepper missing rounded-md');
  assert.ok(classes.includes('border-slate-200'), 'Quantity stepper missing border-slate-200');
  assert.ok(!classes.includes('rounded-xs') && !classes.includes('rounded-xl'), 'Quantity stepper has invalid curvature');
  return `Stepper container classes: ${classes}`;
});

// 1.6 Add to Cart button curvature
check('C1-PRC-06', 'Add to Cart primary button strictly uses rounded-md across all state branches', () => {
  const btnMatch = pricingSrc.match(/<button[\s\S]*?onClick=\{handleAddToCart\}[\s\S]*?className=\{`([^`]+)`\}/);
  assert.ok(btnMatch, 'Add to cart button missing rounded-md class');
  const baseClasses = btnMatch[1];
  assert.ok(baseClasses.includes('rounded-md'), 'Add to cart base missing rounded-md');
  assert.ok(!baseClasses.includes('rounded-xs') && !baseClasses.includes('rounded-xl'), 'Add to cart contains invalid radius');
  return 'Add to cart button wrapper verified with rounded-md';
});

// 1.7 Buy Now CTA button curvature
check('C1-PRC-07', 'Buy Now CTA button strictly uses rounded-md with brand background', () => {
  const buyNowMatch = pricingSrc.match(/<button[\s\S]*?onClick=\{handleBuyNow\}[\s\S]*?className="([^"]+)"/);
  assert.ok(buyNowMatch, 'Buy Now button missing');
  const classes = buyNowMatch[1];
  assert.ok(classes.includes('rounded-md') && classes.includes('bg-brand'), 'Buy Now button missing rounded-md or bg-brand');
  return 'Buy Now button verified with rounded-md';
});

// 1.8 Marketplace buttons curvature (Shopee & Lazada)
check('C1-PRC-08', 'Shopee and Lazada marketplace buttons strictly use rounded-md (rebalancing legacy 12px)', () => {
  const shopeeMatch = pricingSrc.match(/href=\{shopeeUrl\}[\s\S]*?className="([^"]+)"/);
  const lazadaMatch = pricingSrc.match(/href=\{lazadaUrl\}[\s\S]*?className="([^"]+)"/);
  assert.ok(shopeeMatch, 'Shopee button missing');
  assert.ok(lazadaMatch, 'Lazada button missing');
  assert.ok(shopeeMatch[1].includes('rounded-md'), 'Shopee button missing rounded-md');
  assert.ok(lazadaMatch[1].includes('rounded-md'), 'Lazada button missing rounded-md');
  assert.ok(!pricingSrc.includes('rounded-xl') && !pricingSrc.includes('rounded-2xl'), 'Found obsolete rounded-xl on marketplace links');
  return 'Both Shopee and Lazada buttons rebalanced to rounded-md';
});

// 1.9 Status and Shipping metric boxes curvature
check('C1-PRC-09', 'Status and Shipping info boxes strictly use rounded-md border-slate-200 shadow-xs', () => {
  const statusBoxes = [...pricingSrc.matchAll(/<div className="bg-slate-50 p-3 rounded-md border border-slate-200 shadow-xs[^"]*"/g)];
  assert.strictEqual(statusBoxes.length, 2, `Expected 2 status/shipping boxes with rounded-md border-slate-200, found ${statusBoxes.length}`);
  return 'Both Status and Shipping summary boxes calibrated to rounded-md border-slate-200';
});

// 1.10 Loading spinner strictly preserves circular geometry
check('C1-PRC-10', 'Processing loading spinner strictly preserves rounded-full animate-spin', () => {
  const spinnerMatch = pricingSrc.match(/border-cyber-emerald border-t-transparent rounded-full animate-spin/);
  assert.ok(spinnerMatch, 'Loading spinner missing rounded-full or animate-spin');
  return 'Loading spinner maintains pure circular geometry (rounded-full)';
});

console.log('\n--- CHALLENGE 2: PRODUCTCARD STOCK INDICATOR & GEOMETRY INVARIANCE ---');

// 2.1 Outer card container curvature and contrast
check('C2-CRD-01', 'ProductCard outer container uses rounded-md border border-slate-200 shadow-sm', () => {
  const cardMatch = productCardSrc.match(/className="([^"]*rounded-md border border-slate-200[^"]*shadow-sm hover:shadow-md[^"]*)"/);
  assert.ok(cardMatch, 'ProductCard container missing rounded-md, border-slate-200, or shadow-sm');
  assert.ok(!productCardSrc.includes('rounded-2xl') && !productCardSrc.includes('rounded-3xl'), 'Found legacy bubble classes');
  return 'ProductCard container verified with rounded-md and slate-200 border';
});

// 2.2 Product image container curvature and contrast
check('C2-CRD-02', 'ProductCard image box uses rounded-sm border border-slate-200', () => {
  const imgBoxMatch = productCardSrc.match(/className="([^"]*rounded-sm[^"]*border border-slate-200[^"]*)"/);
  assert.ok(imgBoxMatch, 'Image container missing rounded-sm or border-slate-200');
  assert.ok(!productCardSrc.includes('border-slate-100') && !productCardSrc.includes('border-gray-100'), 'Image box uses washed-out border-slate-100');
  return 'ProductCard image container calibrated to rounded-sm border-slate-200';
});

// 2.3 Stock status badge container uses retro curvature (not bubble pill)
check('C2-CRD-03', 'Stock status badge container uses retro rounded-md border border-slate-200/70', () => {
  const badgeContainer = productCardSrc.match(/<div className="([^"]*rounded-md border border-slate-200\/70[^"]*)">/);
  assert.ok(badgeContainer, 'Stock badge container missing rounded-md or border-slate-200/70');
  return 'Stock badge container uses classic retro rounded-md';
});

// 2.4 Stock indicator dot geometry invariance across states
check('C2-CRD-04', 'Stock indicator dot maintains 1:1 circular geometry (w-1.5 h-1.5 rounded-full) across ALL states', () => {
  // Extract dot element
  const dotMatch = productCardSrc.match(/<span className=\{`w-1\.5 h-1\.5 rounded-full \$\{(?:hasStock \? 'bg-emerald-500' : 'bg-rose-500'|[^}]+)\}`\}>/);
  assert.ok(dotMatch, 'Stock indicator dot missing w-1.5 h-1.5 rounded-full');
  
  // Adversarial stress test: check in-stock vs out-of-stock color mapping
  const inStockClass = dotMatch[0].replace('${hasStock ? \'bg-emerald-500\' : \'bg-rose-500\'}', 'bg-emerald-500');
  const outOfStockClass = dotMatch[0].replace('${hasStock ? \'bg-emerald-500\' : \'bg-rose-500\'}', 'bg-rose-500');
  
  assert.ok(inStockClass.includes('w-1.5 h-1.5 rounded-full'), 'In-stock state broke circular geometry');
  assert.ok(outOfStockClass.includes('w-1.5 h-1.5 rounded-full'), 'Out-of-stock state broke circular geometry');
  assert.ok(!dotMatch[0].includes('animate-pulse'), 'Calm UI Invariant: indicator dot must be static (no animate-pulse)');
  return 'Indicator dot preserves 6px circular geometry across both READY and OUT OF STOCK states';
});

// 2.5 Add to cart button curvature across states
check('C2-CRD-05', 'ProductCard add-to-cart button strictly uses rounded-md across all action states', () => {
  const btnMatch = productCardSrc.match(/className=\{`w-full py-2 rounded-md flex items-center justify-center[^`]*\$\{([^}]+)\}`\}/);
  assert.ok(btnMatch, 'Add-to-cart button missing base rounded-md class');
  
  // Verify state expressions do NOT override border-radius
  const dynamicClasses = btnMatch[1];
  assert.ok(!dynamicClasses.includes('rounded-'), 'Dynamic state branch overrides button border-radius');
  return 'Button wrapper enforces rounded-md invariant regardless of addingState or hasStock';
});

console.log('\n--- CHALLENGE 3: PARTNERCARD ONLINE STATUS & RETRO POLISH ---');

// 3.1 Card wrapper curvature
check('C3-PTN-01', 'PartnerCard outer wrapper uses rounded-md border border-slate-200 shadow-sm', () => {
  const wrapperMatch = partnerCardSrc.match(/className="([^"]*rounded-md flex items-center[^"]*border border-slate-200 shadow-sm[^"]*)"/);
  assert.ok(wrapperMatch, 'PartnerCard wrapper missing rounded-md, border-slate-200, or shadow-sm');
  assert.ok(!partnerCardSrc.includes('rounded-2xl'), 'PartnerCard wrapper still uses rounded-2xl');
  return 'PartnerCard outer wrapper calibrated to rounded-md border-slate-200';
});

// 3.2 Avatar image and blur backdrop curvature
check('C3-PTN-02', 'PartnerCard avatar blur backdrop and image strictly use rounded-md', () => {
  const blurMatch = partnerCardSrc.match(/rounded-md blur-md/);
  const imgMatch = partnerCardSrc.match(/<LazyImage[^>]*rounded-md/);
  assert.ok(blurMatch, 'Avatar blur backdrop missing rounded-md');
  assert.ok(imgMatch, 'Avatar image missing rounded-md');
  assert.ok(!partnerCardSrc.includes('rounded-xl'), 'Avatar container still uses rounded-xl');
  return 'Avatar image and ambient glow match rounded-md geometry';
});

// 3.3 Online status indicator dot: multi-layer circular geometry
check('C3-PTN-03', 'Online status dot maintains dual-layer circular geometry (rounded-full) without squircle distortion', () => {
  const pingRing = partnerCardSrc.match(/animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/);
  const solidDot = partnerCardSrc.match(/relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white/);
  assert.ok(pingRing, 'Ping ring missing rounded-full or 1:1 aspect ratio');
  assert.ok(solidDot, 'Solid dot missing rounded-full or 1:1 aspect ratio (h-4 w-4)');
  return 'Dual-layer online dot maintains 16px true circular geometry (rounded-full)';
});

// 3.4 Distance badges retro calibration (no pill bubble)
check('C3-PTN-04', 'Distance display badges strictly use rounded-md border border-slate-200 (replaces rounded-full pill)', () => {
  const badges = [...partnerCardSrc.matchAll(/className="inline-flex items-center[^"]*rounded-md[^"]*border border-slate-200 shadow-xs"/g)];
  assert.strictEqual(badges.length, 2, `Expected 2 distance badge variants (formatted and unknown) with rounded-md border-slate-200, found ${badges.length}`);
  
  // Verify no rounded-full remains on distance badges
  const pillBadges = partnerCardSrc.match(/className="inline-flex items-center[^"]*rounded-full/);
  assert.strictEqual(pillBadges, null, 'Found distance badge still using rounded-full pill curvature');
  return 'Distance badges calibrated from bubble pill to rounded-md border-slate-200';
});

// 3.5 View Profile action link button curvature
check('C3-PTN-05', 'View Profile link button strictly uses rounded-md (rebalancing legacy rounded-xl 12px)', () => {
  const linkMatch = partnerCardSrc.match(/<Link[\s\S]*?to=\{`\/store\/[\s\S]*?className="([^"]+)"/);
  assert.ok(linkMatch, 'Could not find View Profile Link element');
  const classes = linkMatch[1];
  assert.ok(classes.includes('rounded-md'), `View Profile link missing rounded-md. Got: ${classes}`);
  assert.ok(!classes.includes('rounded-xl') && !classes.includes('rounded-full'), 'View Profile link contains invalid radius');
  return `View Profile link classes verified with rounded-md: ${classes.slice(0, 60)}...`;
});

console.log('\n--- CHALLENGE 4: DOMAIN CARDS & CATEGORY ARCHITECTURE STRESS AUDIT ---');

// 4.1 FeaturedSpares section curvature
check('C4-DOM-01', 'FeaturedSpares: CTA link, skeleton placeholders, and empty states calibrated to retro geometry', () => {
  const ctaMatch = featuredSparesSrc.match(/<Link[\s\S]*?to="\/categories"[\s\S]*?className="([^"]+)"/);
  assert.ok(ctaMatch, 'CTA link missing');
  assert.ok(ctaMatch[1].includes('rounded-md') && ctaMatch[1].includes('border-slate-300'), 'CTA link missing rounded-md border border-slate-300');
  
  const skeletonMatch = featuredSparesSrc.match(/className="([^"]*rounded-md[^"]*border border-slate-200[^"]*animate-pulse[^"]*)"/);
  assert.ok(skeletonMatch, 'Skeleton card missing rounded-md border border-slate-200');
  
  const emptyMatch = featuredSparesSrc.match(/className="([^"]*rounded-md[^"]*border-2 border-dashed border-slate-300[^"]*)"/);
  assert.ok(emptyMatch, 'Empty state missing rounded-md border-2 border-dashed border-slate-300');
  
  assert.ok(!featuredSparesSrc.includes('rounded-2xl') && !featuredSparesSrc.includes('rounded-3xl'), 'Found legacy bubble classes in FeaturedSpares');
  return 'FeaturedSpares all 3 element types conform to retro rounded-md geometry';
});

// 4.2 CategoryCard retro calibration & icon button circle preservation
check('C4-DOM-02', 'CategoryCard: card wrapper uses rounded-md border-slate-200 while action button strictly preserves w-8 h-8 rounded-full', () => {
  const cardMatch = categoryCardSrc.match(/<Link[\s\S]*?to=\{`\/category\/[\s\S]*?className="([^"]+)"/);
  assert.ok(cardMatch, 'Could not find CategoryCard Link container');
  const cardClasses = cardMatch[1];
  assert.ok(cardClasses.includes('rounded-md'), 'CategoryCard missing rounded-md');
  assert.ok(cardClasses.includes('border-slate-200'), 'CategoryCard missing border-slate-200');

  const imgBoxMatch = categoryCardSrc.match(/<div[\s\S]*?className="([^"]*w-14 h-14[^"]*)"/);
  assert.ok(imgBoxMatch, 'Could not find CategoryCard image container');
  assert.ok(imgBoxMatch[1].includes('rounded-sm'), 'Image box missing rounded-sm');

  const iconBtnMatch = categoryCardSrc.match(/className="([^"]*rounded-full[^"]*)"[\s\S]*?<ChevronRight/);
  assert.ok(iconBtnMatch, 'Could not find CategoryCard action button with rounded-full');
  assert.ok(iconBtnMatch[1].includes('w-8 h-8') && iconBtnMatch[1].includes('rounded-full'), 'Action button must be w-8 h-8 rounded-full');
  return 'CategoryCard card wrapper is rounded-md and action button is w-8 h-8 rounded-full';
});

// 4.3 CategoryModal dialog curvature and search input
check('C4-DOM-03', 'CategoryModal: dialog uses rounded-md shadow-2xl and search input uses rounded-md border-slate-300', () => {
  const dialogMatch = categoryModalSrc.match(/<div className="([^"]*bg-white[^"]*rounded-md[^"]*shadow-2xl[^"]*border border-slate-200[^"]*)"/);
  assert.ok(dialogMatch, 'CategoryModal dialog missing rounded-md shadow-2xl border-slate-200');

  const searchInputMatch = categoryModalSrc.match(/<input[\s\S]*?placeholder="ค้นหาชื่อหมวดหมู่\.\.\."[\s\S]*?className="([^"]+)"/);
  assert.ok(searchInputMatch, 'CategoryModal search input missing');
  assert.ok(searchInputMatch[1].includes('rounded-md'), 'Search input missing rounded-md');
  assert.ok(searchInputMatch[1].includes('border-slate-300'), 'Search input missing border-slate-300');

  const closeBtnMatch = categoryModalSrc.match(/<button[\s\S]*?onClick=\{onClose\}[\s\S]*?className="([^"]+)"[\s\S]*?aria-label="ปิดหน้าต่าง"/);
  assert.ok(closeBtnMatch, 'CategoryModal close button missing');
  assert.ok(closeBtnMatch[1].includes('rounded-full'), 'Close button missing rounded-full');
  return 'CategoryModal dialog, search input, and close button conform to specification';
});

// 4.4 CategoriesMain search bar and launcher card
check('C4-DOM-04', 'CategoriesMain: search input and launcher card use rounded-md without bubble curvature', () => {
  const searchInputMatch = categoriesMainSrc.match(/<input[\s\S]*?placeholder="ค้นหาอะไหล่, รหัส PN, หรือรุ่น\.\.\."[\s\S]*?className="([^"]+)"/);
  assert.ok(searchInputMatch, 'CategoriesMain search input missing');
  const searchClasses = searchInputMatch[1];
  assert.ok(searchClasses.includes('rounded-md'), 'Search input missing rounded-md');
  assert.ok(searchClasses.includes('border-slate-300'), 'Search input missing border-slate-300');

  const launcherMatch = categoriesMainSrc.match(/setIsModalOpen\(true\)[\s\S]*?className="([^"]+)"/);
  assert.ok(launcherMatch, 'Mobile launcher card missing');
  const launcherClasses = launcherMatch[1];
  assert.ok(launcherClasses.includes('rounded-md'), 'Launcher card missing rounded-md');
  assert.ok(launcherClasses.includes('border-slate-200'), 'Launcher card missing border-slate-200');
  return 'CategoriesMain search input and launcher card conform to retro standards';
});

// 4.5 ProductDetail main layout containers
check('C4-DOM-05', 'ProductDetail: gallery, breadcrumb, and sticky bottom bar use rounded-md', () => {
  const galleryMatch = productDetailSrc.match(/<div className="([^"]*bg-white[^"]*rounded-md[^"]*border border-slate-200[^"]*)"[\s\S]*?<ProductImageSection/);
  assert.ok(galleryMatch, 'ProductDetail gallery card missing rounded-md border-slate-200');

  const breadcrumbMatch = productDetailSrc.match(/<nav className="([^"]+)"[\s\S]*?หน้าแรก/);
  assert.ok(breadcrumbMatch, 'Breadcrumb navigation missing');
  assert.ok(breadcrumbMatch[1].includes('rounded-md') && breadcrumbMatch[1].includes('border-slate-200'), 'Breadcrumb missing rounded-md border-slate-200');

  const stickyBarMatch = productDetailSrc.match(/<div className="fixed bottom-\[60px\][\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  assert.ok(stickyBarMatch, 'Sticky bar missing');
  assert.ok(stickyBarMatch[0].includes('rounded-md'), 'Sticky bar buttons missing rounded-md');
  return 'ProductDetail gallery, breadcrumb, and sticky mobile action buttons conform to rounded-md';
});

console.log('\n--- CHALLENGE 5: ADVERSARIAL AST & CODEBASE TOKEN INTEGRITY ---');

// 5.1 AST / Tokenizer scan across ALL M3 target files for forbidden tokens
check('C5-AST-01', 'Multi-file AST scan: ZERO occurrences of rounded-2xl or rounded-3xl in any M3 target component', () => {
  const targetFiles = [
    'src/components/ProductCard.jsx',
    'src/pages/Home/components/PartnerCard.jsx',
    'src/pages/Home/components/FeaturedSpares.jsx',
    'src/components/product/ProductPricingSection.jsx',
    'src/pages/ProductDetail.jsx',
    'src/pages/Categories/components/CategoryCard.jsx',
    'src/pages/Categories/components/CategoryModal.jsx',
    'src/pages/Categories/CategoriesMain.jsx'
  ];

  const violations = [];
  for (const relPath of targetFiles) {
    const src = readFileSafe(relPath);
    // Find all occurrences of rounded-2xl or rounded-3xl
    const matches = [...src.matchAll(/\b(rounded-(?:2xl|3xl))\b/g)];
    if (matches.length > 0) {
      violations.push(`${relPath}: ${matches.map(m => m[1]).join(', ')}`);
    }
  }

  assert.strictEqual(violations.length, 0, `Forbidden bubble curvature found in M3 components:\n${violations.join('\n')}`);
  return `Audited 8 target M3 files: 0 bubble curvature occurrences found`;
});

// 5.2 AST / Tokenizer scan across all M3 files for washed-out border-gray-100 or border-slate-100 on primary cards
check('C5-AST-02', 'Multi-file AST scan: Card containers use tactile border-slate-200 (no washed-out border-gray-100)', () => {
  const cardSources = [
    { file: 'ProductCard.jsx', src: productCardSrc },
    { file: 'PartnerCard.jsx', src: partnerCardSrc },
    { file: 'CategoryCard.jsx', src: categoryCardSrc },
    { file: 'FeaturedSpares.jsx', src: featuredSparesSrc }
  ];

  for (const { file, src } of cardSources) {
    assert.ok(src.includes('border-slate-200') || src.includes('border-slate-300'), `${file} is missing tactile border-slate-200/300`);
    assert.ok(!src.includes('border-gray-100'), `${file} contains washed-out border-gray-100`);
  }
  return 'All primary M3 card containers enforce tactile border-slate-200/300 contrast';
});

// 5.3 Verify calm UI invariant: no distracting pulse animation on in-stock product cards
check('C5-CLM-01', 'Calm UI Invariant: ProductCard stock badge does NOT contain animate-pulse or animate-spin', () => {
  const badgeSection = productCardSrc.match(/<div className="absolute top-2 left-2[\s\S]*?<\/div>/);
  assert.ok(badgeSection, 'Could not locate stock badge block in ProductCard.jsx');
  assert.ok(!badgeSection[0].includes('animate-pulse'), 'Calm UI violation: in-stock badge uses animate-pulse');
  assert.ok(!badgeSection[0].includes('animate-spin'), 'Calm UI violation: in-stock badge uses animate-spin');
  return 'Stock badge indicator conforms to Calm UI invariant (static dot)';
});

// 5.4 Production Vite Build Compilation Check
check('C5-BLD-01', 'Production build compiles successfully with zero errors (npm run build exit code 0)', () => {
  let buildOutput = '';
  try {
    buildOutput = execSync('cmd /c "npm run build"', {
      cwd: FRONTEND_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (err) {
    throw new Error(`Production build failed: ${err.stderr || err.message}`);
  }

  assert.ok(buildOutput.includes('built in') || fs.existsSync(path.resolve(FRONTEND_ROOT, 'dist/index.html')), 'Build did not produce index.html or build confirmation');
  return 'Vite production build passed cleanly with exit code 0';
});

console.log('================================================================');
console.log('📊 CHALLENGER M3 EMPIRICAL RESULTS SUMMARY');
console.log(`Total Empirical Checks Evaluated : ${totalChecks}`);
console.log(`Passed Checks                     : ${passedChecks} (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log(`Failed Checks                     : ${failedChecks} (${((failedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log('================================================================\n');

if (failedChecks === 0) {
  console.log('🎉 ALL EMPIRICAL CHALLENGES PASSED!');
  console.log('🟢 VERDICT: APPROVE');
} else {
  console.log(`❌ ${failedChecks} CHALLENGE(S) FAILED!`);
  console.log('🔴 VERDICT: CHALLENGE_FAILED');
  process.exitCode = 1;
}
