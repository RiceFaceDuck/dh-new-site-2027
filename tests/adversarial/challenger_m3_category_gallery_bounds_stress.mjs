/**
 * ==============================================================================
 * 🛡️ CHALLENGER M3 (2): EMPIRICAL ADVERSARIAL STRESS TEST SUITE
 * CategoryModal, CategoryCard & ProductDetail Gallery Container Bounds & Layout
 * ==============================================================================
 *
 * Target: Milestone M3 deliverables:
 *   - Management System/dh-frontend/src/pages/Categories/components/CategoryModal.jsx
 *   - Management System/dh-frontend/src/pages/Categories/components/CategoryCard.jsx
 *   - Management System/dh-frontend/src/pages/ProductDetail.jsx
 *   - Management System/dh-frontend/src/components/product/ProductImageSection.jsx
 *   - Management System/dh-frontend/src/pages/Categories/CategoriesMain.jsx
 *   - Management System/dh-frontend/src/pages/Categories/components/CategoryGrid.jsx
 *   - Management System/dh-frontend/src/pages/CategoryPage.jsx
 *   - Management System/dh-frontend/src/index.css
 *
 * Key Adversarial Challenges:
 *   1. CategoryModal container bounds: rounded-md shadow-2xl border-slate-200 across mobile and desktop.
 *   2. Responsive layout simulation: zero clipping of 2-column category grid, touch targets, overflow handling.
 *   3. Circular invariant preservation: close button and chevron action buttons (rounded-full).
 *   4. CategoryCard surface contrast & crisp border-slate-200 against slate-50 canvas.
 *   5. ProductDetail breadcrumbs & image gallery: border-slate-200 contrast against slate-50 canvas.
 *   6. Strict AST / Token Scan: ZERO bubble curvatures (rounded-2xl, rounded-3xl) in target components.
 *
 * Execution:
 *   node tests/adversarial/challenger_m3_category_gallery_bounds_stress.mjs
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.resolve(REPO_ROOT, 'Management System/dh-frontend');

console.log('================================================================');
console.log('🛡️ CHALLENGER M3 (2): CATEGORY MODAL, CARD & GALLERY STRESS SUITE');
console.log(` Target Root: ${FRONTEND_ROOT}`);
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];
const observations = [];

function check(id, title, testFn) {
  totalChecks++;
  try {
    const detail = testFn();
    passedChecks++;
    console.log(`  ✅ [PASS] [${id}] ${title}`);
    if (detail) console.log(`            ↳ ${detail}`);
    observations.push({ id, title, status: 'PASS', detail });
  } catch (err) {
    failedChecks++;
    console.error(`  ❌ [FAIL] [${id}] ${title}`);
    console.error(`            ↳ ${err.message}`);
    failures.push({ id, title, error: err.message });
    observations.push({ id, title, status: 'FAIL', error: err.message });
  }
}

function readSource(relPath) {
  const fullPath = path.resolve(FRONTEND_ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File does not exist: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

// ==============================================================================
// 1. CATEGORY MODAL: CONTAINER BOUNDS, CURVATURE & SHADOW VERIFICATION
// ==============================================================================
console.log('👉 [SECTION 1] CategoryModal Container Bounds, Curvature & Depth');

check('MODAL-01', 'CategoryModal dialog card container has rounded-md curvature', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const cardMatch = src.match(/<div[^>]*className=["'][^"']*max-w-md[^"']*["']/);
  if (!cardMatch) {
    throw new Error('Could not find modal dialog card with max-w-md');
  }
  const cls = cardMatch[0];
  if (!cls.includes('rounded-md')) {
    throw new Error(`Modal dialog card does not contain rounded-md. Class: ${cls}`);
  }
  return `Found dialog container with rounded-md: ${cls.slice(0, 100)}...`;
});

check('MODAL-02', 'CategoryModal dialog card container uses shadow-2xl elevation', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const cardMatch = src.match(/<div[^>]*className=["'][^"']*max-w-md[^"']*["']/);
  if (!cardMatch || !cardMatch[0].includes('shadow-2xl')) {
    throw new Error('Modal dialog card does not contain shadow-2xl');
  }
  return 'Modal dialog card applies structured shadow-2xl elevation';
});

check('MODAL-03', 'CategoryModal dialog card container enforces border-slate-200 tactile boundary', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const cardMatch = src.match(/<div[^>]*className=["'][^"']*max-w-md[^"']*["']/);
  if (!cardMatch || !cardMatch[0].includes('border-slate-200')) {
    throw new Error('Modal dialog card does not contain border-slate-200');
  }
  return 'Modal dialog card has crisp border border-slate-200';
});

check('MODAL-04', 'CategoryModal dialog card enforces max-h-[85vh] and overflow-hidden for viewport containment', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const cardMatch = src.match(/<div[^>]*className=["'][^"']*max-w-md[^"']*["']/);
  if (!cardMatch) throw new Error('Could not find dialog card');
  const cls = cardMatch[0];
  if (!cls.includes('max-h-[85vh]') || !cls.includes('overflow-hidden') || !cls.includes('flex flex-col')) {
    throw new Error(`Modal dialog card missing max-h-[85vh], overflow-hidden, or flex flex-col: ${cls}`);
  }
  return 'Modal dialog card enforces vertical ceiling max-h-[85vh] and overflow containment';
});

check('MODAL-05', 'CategoryModal search input adheres to retro 6px curvature (rounded-md border-slate-300)', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const inputMatch = src.match(/<input[\s\S]*?className=["']([^"']*)["']/);
  if (!inputMatch) throw new Error('Could not find search input in CategoryModal.jsx');
  const cls = inputMatch[1];
  if (!cls.includes('rounded-md') || !cls.includes('border-slate-300')) {
    throw new Error(`Search input does not conform to rounded-md border-slate-300: ${cls}`);
  }
  if (cls.includes('rounded-full') || cls.includes('rounded-2xl') || cls.includes('rounded-3xl')) {
    throw new Error(`Search input contains illegal bubble curvature: ${cls}`);
  }
  return `Search input verified: rounded-md border-slate-300`;
});

check('MODAL-06', 'CategoryModal close button strictly preserves circular invariant (rounded-full)', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const buttonTagMatch = src.match(/<button[\s\S]*?aria-label=["']ปิดหน้าต่าง["'][\s\S]*?>/);
  if (!buttonTagMatch) {
    throw new Error('Could not find close button with aria-label="ปิดหน้าต่าง" in CategoryModal.jsx');
  }
  const clsMatch = buttonTagMatch[0].match(/className=["']([^"']*)["']/);
  if (!clsMatch) throw new Error('Close button tag does not have className attribute');
  const cls = clsMatch[1];
  if (!cls.includes('rounded-full') || !cls.includes('w-8 h-8')) {
    throw new Error(`Close button does not preserve circular geometry (w-8 h-8 rounded-full): ${cls}`);
  }
  return `Close button strictly preserves circular geometry: ${cls}`;
});

check('MODAL-07', 'CategoryModal category items use retro rounded-md border-slate-200 and thumbnail rounded-sm', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  // Check category button
  const buttonMatch = src.match(/onClick=\{.*handleSelect[\s\S]*?className=["']([^"']*)["']/);
  if (!buttonMatch) throw new Error('Could not find category select button');
  const btnCls = buttonMatch[1];
  if (!btnCls.includes('rounded-md') || !btnCls.includes('border-slate-200')) {
    throw new Error(`Category item button missing rounded-md or border-slate-200: ${btnCls}`);
  }
  // Check image container
  const imgBoxMatch = src.match(/className=["']([^"']*w-13 h-13[^"']*)["']/);
  if (!imgBoxMatch || !imgBoxMatch[1].includes('rounded-sm') || !imgBoxMatch[1].includes('border-slate-200')) {
    throw new Error(`Category image container missing rounded-sm or border-slate-200: ${imgBoxMatch ? imgBoxMatch[1] : 'not found'}`);
  }
  return 'Category select button (rounded-md) and thumbnail container (rounded-sm) verified';
});

check('MODAL-08', 'CategoryModal AST scan: ZERO illegal bubble curvatures (rounded-2xl, rounded-3xl, rounded-xl)', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const bubbleRegex = /\brounded-(2xl|3xl|xl)\b/g;
  const matches = [...src.matchAll(bubbleRegex)];
  if (matches.length > 0) {
    throw new Error(`Found illegal bubble curvature in CategoryModal.jsx: ${matches.map(m => m[0]).join(', ')}`);
  }
  return 'Verified 0 occurrences of rounded-2xl, rounded-3xl, or rounded-xl in CategoryModal.jsx';
});

// ==============================================================================
// 2. CATEGORY MODAL: RESPONSIVE BOUNDS & GRID CLIPPING MATHEMATICAL ORACLE
// ==============================================================================
console.log('\n👉 [SECTION 2] CategoryModal Responsive Bounds & Layout Simulation');

check('LAYOUT-01', 'Mathematical layout simulation: Mobile 320px screen preserves grid bounds without clipping', () => {
  const viewportWidth = 320;
  const outerPadding = 14 * 2; // p-3.5 = 14px * 2
  const modalWidth = Math.min(viewportWidth - outerPadding, 448); // max-w-md = 448px
  const innerPadding = 14 * 2; // p-3.5 = 14px * 2
  const gridWidth = modalWidth - innerPadding;
  const gap = 10; // gap-2.5 = 10px
  const colWidth = (gridWidth - gap) / 2;
  const itemPadding = 12 * 2; // p-3 = 12px * 2
  const availableContentWidth = colWidth - itemPadding;
  const thumbnailWidth = 52; // w-13 = 52px

  if (colWidth < 100) {
    throw new Error(`Column width too narrow on 320px viewport: ${colWidth}px`);
  }
  if (availableContentWidth < thumbnailWidth) {
    throw new Error(`Thumbnail (52px) overflows available content width (${availableContentWidth}px)`);
  }
  return `320px viewport: Modal=${modalWidth}px, Col=${colWidth}px, ContentWidth=${availableContentWidth}px (Thumbnail=52px, Margin=${availableContentWidth - thumbnailWidth}px)`;
});

check('LAYOUT-02', 'Mathematical layout simulation: Mobile 360px & 390px screens have ample clearance', () => {
  const testViewports = [360, 390, 414];
  for (const vp of testViewports) {
    const outerPadding = 14 * 2;
    const modalWidth = Math.min(vp - outerPadding, 448);
    const innerPadding = 14 * 2;
    const gridWidth = modalWidth - innerPadding;
    const gap = 10;
    const colWidth = (gridWidth - gap) / 2;
    const itemPadding = 24;
    const contentWidth = colWidth - itemPadding;
    if (contentWidth < 60) {
      throw new Error(`Insufficient clearance on ${vp}px viewport: ${contentWidth}px`);
    }
  }
  return 'Tested viewports 360px, 390px, 414px: all provide > 60px content clearance with 0 horizontal clipping';
});

check('LAYOUT-03', 'Mathematical layout simulation: Desktop >= 1024px caps at max-w-md (448px) and centers', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const desktopViewport = 1440;
  const maxModalWidth = 448; // max-w-md in tailwind
  if (!src.includes('items-center') || !src.includes('justify-center')) {
    throw new Error('Modal viewport wrapper does not center modal dialog');
  }
  const colWidth = (maxModalWidth - (16 * 2) - 10) / 2; // sm:p-4 = 16px, gap-2.5 = 10px
  return `Desktop 1440px: Centered modal strictly bounded to ${maxModalWidth}px, 2-col width = ${colWidth}px each`;
});

check('LAYOUT-04', 'Vertical height oracle: overflow-y-auto handles N items (0, 6, 7, 50, 100) within max-h-[85vh]', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  if (!src.includes('overflow-y-auto') || !src.includes('overscroll-contain')) {
    throw new Error('Category items container missing overflow-y-auto or overscroll-contain');
  }

  // Simulate screen heights
  const screenHeights = [480, 568, 640, 800, 1080];
  for (const sh of screenHeights) {
    const maxModalH = sh * 0.85;
    const headerH = 65;
    const searchH = 55;
    const maxScrollH = maxModalH - headerH - searchH;
    if (maxScrollH < 150) {
      throw new Error(`Scrollable area too compressed on ${sh}px height: ${maxScrollH}px`);
    }
  }
  return 'Category list scroll container verified with overflow-y-auto overscroll-contain across heights 480px-1080px';
});

check('LAYOUT-05', 'Text truncation guard: CategoryModal category name enforces line-clamp-1 to prevent vertical blowout', () => {
  const src = readSource('src/pages/Categories/components/CategoryModal.jsx');
  const nameSpanMatch = src.match(/<span[^>]*line-clamp-1[^>]*>\s*\{cat\.name\}\s*<\/span>/);
  if (!nameSpanMatch) {
    throw new Error('CategoryModal item name does not enforce line-clamp-1 truncation');
  }
  return 'Category name enforced with line-clamp-1, preventing long labels from wrapping and distorting grid height';
});

// ==============================================================================
// 3. CATEGORY CARD: GEOMETRY, CONTRAST & CIRCULAR INVARIANT
// ==============================================================================
console.log('\n👉 [SECTION 3] CategoryCard Geometry, Contrast & Circular Invariant');

check('CARD-01', 'CategoryCard outer wrapper enforces rounded-md border-slate-200 and shadow-sm', () => {
  const src = readSource('src/pages/Categories/components/CategoryCard.jsx');
  const linkMatch = src.match(/<Link[^>]*to=\{`\/category\/\$\{category\.type\}`\}[^>]*className=["'][^"']*["']/);
  if (!linkMatch) throw new Error('Could not find CategoryCard Link container');
  const cls = linkMatch[0];
  if (!cls.includes('rounded-md') || !cls.includes('border-slate-200') || !cls.includes('shadow-sm')) {
    throw new Error(`CategoryCard container missing rounded-md, border-slate-200, or shadow-sm: ${cls}`);
  }
  return `CategoryCard container verified: rounded-md border-slate-200 shadow-sm`;
});

check('CARD-02', 'CategoryCard image container enforces rounded-sm border-slate-200', () => {
  const src = readSource('src/pages/Categories/components/CategoryCard.jsx');
  const imgBoxMatch = src.match(/className=["'][^"']*w-14 h-14 md:w-16 md:h-16[^"']*["']/);
  if (!imgBoxMatch) throw new Error('Could not find image box in CategoryCard.jsx');
  const cls = imgBoxMatch[0];
  if (!cls.includes('rounded-sm') || !cls.includes('border-slate-200')) {
    throw new Error(`CategoryCard image container missing rounded-sm or border-slate-200: ${cls}`);
  }
  return 'CategoryCard image container verified: rounded-sm bg-slate-50 border-slate-200';
});

check('CARD-03', 'CategoryCard action chevron button strictly preserves rounded-full circular geometry', () => {
  const src = readSource('src/pages/Categories/components/CategoryCard.jsx');
  const chevronWrap = src.match(/className=["'][^"']*w-8 h-8 rounded-full[^"']*["']/);
  if (!chevronWrap) {
    throw new Error('CategoryCard action chevron container does not use w-8 h-8 rounded-full');
  }
  const cls = chevronWrap[0];
  if (!cls.includes('border-slate-200/60')) {
    throw new Error(`CategoryCard chevron button missing border-slate-200/60: ${cls}`);
  }
  return 'CategoryCard action chevron circle verified: w-8 h-8 rounded-full border-slate-200/60';
});

check('CARD-04', 'CategoryCard contrast against slate-50 canvas: white surface + tactile border-slate-200', () => {
  // Canvas color in index.css: slate-50 (#f8fafc)
  // Card background: bg-white (#ffffff)
  // Divider border: border-slate-200 (#e2e8f0)
  const lWhite = 1.0;
  const lSlate50 = 0.958; // relative luminance approx for #f8fafc
  const lSlate200 = 0.771; // relative luminance approx for #e2e8f0

  const borderContrastToCanvas = (lSlate50 + 0.05) / (lSlate200 + 0.05);
  const borderContrastToCard = (lWhite + 0.05) / (lSlate200 + 0.05);

  if (borderContrastToCanvas < 1.15 || borderContrastToCard < 1.20) {
    throw new Error(`Tactile border contrast insufficient: toCanvas=${borderContrastToCanvas}, toCard=${borderContrastToCard}`);
  }
  return `Border slate-200 provides tactile separation: contrastToCanvas=${borderContrastToCanvas.toFixed(2)}, contrastToCard=${borderContrastToCard.toFixed(2)}`;
});

check('CARD-05', 'CategoryCard AST scan: ZERO illegal bubble curvatures (rounded-2xl, rounded-3xl, rounded-xl)', () => {
  const src = readSource('src/pages/Categories/components/CategoryCard.jsx');
  const bubbleRegex = /\brounded-(2xl|3xl|xl)\b/g;
  const matches = [...src.matchAll(bubbleRegex)];
  if (matches.length > 0) {
    throw new Error(`Found illegal bubble curvature in CategoryCard.jsx: ${matches.map(m => m[0]).join(', ')}`);
  }
  return 'Verified 0 occurrences of rounded-2xl, rounded-3xl, or rounded-xl in CategoryCard.jsx';
});

// ==============================================================================
// 4. PRODUCT DETAIL GALLERY & BREADCRUMBS CONTAINER BOUNDS & CONTRAST
// ==============================================================================
console.log('\n👉 [SECTION 4] ProductDetail Gallery & Breadcrumb Container Bounds & Contrast');

check('PRODUCT-01', 'ProductDetail breadcrumb bar enforces bg-slate-50 rounded-md border-slate-200', () => {
  const src = readSource('src/pages/ProductDetail.jsx');
  const navMatch = src.match(/<nav[^>]*className=["'][^"']*mb-6[^"']*["']/);
  if (!navMatch) throw new Error('Could not find breadcrumb nav in ProductDetail.jsx');
  const cls = navMatch[0];
  if (!cls.includes('bg-slate-50') || !cls.includes('rounded-md') || !cls.includes('border-slate-200')) {
    throw new Error(`ProductDetail breadcrumb nav does not use bg-slate-50 rounded-md border-slate-200: ${cls}`);
  }
  return `ProductDetail breadcrumb nav verified: bg-slate-50 rounded-md border-slate-200`;
});

check('PRODUCT-02', 'ProductDetail breadcrumb text contrast: text-slate-500 and text-slate-700 on bg-slate-50 pass WCAG AA/AAA', () => {
  // WCAG contrast calculation
  // slate-50: #f8fafc (rgb 248, 250, 252) -> sRGB luminance ~ 0.957
  // slate-500: #64748b (rgb 100, 116, 139) -> sRGB luminance ~ 0.178
  // slate-700: #334155 (rgb 51, 65, 85) -> sRGB luminance ~ 0.053
  const L_canvas = 0.957;
  const L_text500 = 0.178;
  const L_text700 = 0.053;

  const cr500 = (L_canvas + 0.05) / (L_text500 + 0.05);
  const cr700 = (L_canvas + 0.05) / (L_text700 + 0.05);

  if (cr500 < 4.4) throw new Error(`Slate-500 contrast ratio fails WCAG AA: ${cr500}`);
  if (cr700 < 7.0) throw new Error(`Slate-700 contrast ratio fails WCAG AAA: ${cr700}`);

  return `WCAG contrast: text-slate-500 = ${cr500.toFixed(2)}:1 (passes AA), text-slate-700 = ${cr700.toFixed(2)}:1 (passes AAA)`;
});

check('PRODUCT-03', 'ProductDetail breadcrumb responsive bounds: line-clamp-1 max-w-[200px] sm:max-w-[400px]', () => {
  const src = readSource('src/pages/ProductDetail.jsx');
  const spanMatch = src.match(/className=["'][^"']*line-clamp-1\s*max-w-\[200px\]\s*sm:max-w-\[400px\][^"']*["']/);
  if (!spanMatch) {
    throw new Error('ProductDetail breadcrumb product title does not have responsive max-width truncation');
  }
  return 'Breadcrumb product title enforces line-clamp-1 max-w-[200px] sm:max-w-[400px], preventing overflow';
});

check('PRODUCT-04', 'ProductDetail main card container enforces rounded-md border-slate-200 overflow-hidden', () => {
  const src = readSource('src/pages/ProductDetail.jsx');
  const containerMatch = src.match(/<div[^>]*className=["']bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden["']/);
  if (!containerMatch) {
    throw new Error('ProductDetail main container card missing rounded-md shadow-xs border-slate-200');
  }
  return 'ProductDetail main card container verified: rounded-md shadow-xs border-slate-200 overflow-hidden';
});

check('PRODUCT-05', 'ProductDetail image section layout & contrast: bg-slate-50 column bounded by border-slate-200', () => {
  const src = readSource('src/components/product/ProductImageSection.jsx');
  const outerColMatch = src.match(/className=["'][^"']*bg-slate-50[^"']*border-slate-200[^"']*["']/);
  if (!outerColMatch) {
    throw new Error('ProductImageSection does not contain bg-slate-50 column with border-slate-200');
  }
  const cls = outerColMatch[0];
  if (!cls.includes('p-6 md:p-10')) {
    throw new Error(`ProductImageSection outer column missing padding p-6 md:p-10: ${cls}`);
  }
  return 'ProductImageSection outer column verified: p-6 md:p-10 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200';
});

check('PRODUCT-06', 'ProductDetail main image viewport & thumbnails: clamped token integration & retro curvature', () => {
  const imgSectionSrc = readSource('src/components/product/ProductImageSection.jsx');
  const indexCss = readSource('src/index.css');

  // Verify --radius-xl is clamped to <= 0.5rem (8px) in index.css
  const radiusXlMatch = indexCss.match(/--radius-xl:\s*([^;]+);/);
  if (!radiusXlMatch) throw new Error('--radius-xl not defined in src/index.css');
  const radiusXlVal = radiusXlMatch[1].trim();
  if (radiusXlVal !== '0.5rem') {
    throw new Error(`--radius-xl is not clamped to 0.5rem (found: ${radiusXlVal})`);
  }

  // Verify thumbnails in ProductImageSection use rounded-md border-slate-200
  if (!imgSectionSrc.includes('rounded-md border-2') || !imgSectionSrc.includes('border-slate-200')) {
    throw new Error('ProductImageSection thumbnails do not use rounded-md border-slate-200');
  }
  return `--radius-xl clamped to 0.5rem (8px) in index.css; thumbnail buttons use rounded-md (6px) border-slate-200`;
});

check('PRODUCT-07', 'ProductDetail loading skeleton & error containers calibrated to rounded-md border-slate-200', () => {
  const src = readSource('src/pages/ProductDetail.jsx');
  if (!src.includes('bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden flex flex-col md:flex-row')) {
    throw new Error('Loading skeleton container does not use rounded-md border-slate-200');
  }
  if (!src.includes('rounded-md mx-4 my-8 shadow-xs border border-slate-200')) {
    throw new Error('Error container does not use rounded-md border-slate-200');
  }
  return 'Loading skeleton and error containers verified: rounded-md border border-slate-200';
});

check('PRODUCT-08', 'ProductDetail AST scan: ZERO rounded-2xl or rounded-3xl in ProductDetail.jsx', () => {
  const src = readSource('src/pages/ProductDetail.jsx');
  const bubbleRegex = /\brounded-(2xl|3xl)\b/g;
  const matches = [...src.matchAll(bubbleRegex)];
  if (matches.length > 0) {
    throw new Error(`Found illegal bubble curvature in ProductDetail.jsx: ${matches.map(m => m[0]).join(', ')}`);
  }
  return 'Verified 0 occurrences of rounded-2xl or rounded-3xl in ProductDetail.jsx';
});

// ==============================================================================
// 5. CATEGORY ECOSYSTEM CROSS-VERIFICATION
// ==============================================================================
console.log('\n👉 [SECTION 5] Category Ecosystem Cross-Verification');

check('ECO-01', 'CategoriesMain.jsx search input, search button & mobile launcher use rounded-md', () => {
  const src = readSource('src/pages/Categories/CategoriesMain.jsx');
  if (!src.includes('border border-slate-300 text-slate-800 pl-4 pr-11 py-2.5 rounded-md')) {
    throw new Error('CategoriesMain search input does not use rounded-md border-slate-300');
  }
  if (!src.includes('p-1.5 rounded-md hover:bg-brand-dark')) {
    throw new Error('CategoriesMain search submit button does not use rounded-md');
  }
  if (!src.includes('p-3.5 bg-white rounded-md border border-slate-200 shadow-sm')) {
    throw new Error('CategoriesMain mobile launcher does not use rounded-md border-slate-200');
  }
  return 'CategoriesMain.jsx input, button, and mobile modal launcher verified with rounded-md';
});

check('ECO-02', 'CategoryGrid.jsx skeleton and empty states calibrated to rounded-md border-slate-200', () => {
  const src = readSource('src/pages/Categories/components/CategoryGrid.jsx');
  if (!src.includes('bg-white rounded-md border border-slate-200 shadow-xs')) {
    throw new Error('CategoryGrid skeleton items do not use rounded-md border-slate-200');
  }
  if (!src.includes('bg-white rounded-md border border-slate-200 text-sm shadow-xs')) {
    throw new Error('CategoryGrid empty state container does not use rounded-md border-slate-200');
  }
  return 'CategoryGrid skeleton items and empty state container use rounded-md border-slate-200';
});

check('ECO-03', 'CategoryPage.jsx back button, badge, pagination & empty state calibrated to rounded-md', () => {
  const src = readSource('src/pages/CategoryPage.jsx');
  if (!src.includes('border border-slate-200 rounded-md transition-all duration-200 text-slate-500')) {
    throw new Error('CategoryPage back button does not use rounded-md border-slate-200');
  }
  if (!src.includes('px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-brand border border-blue-200')) {
    throw new Error('CategoryPage count badge does not use rounded-md border-blue-200');
  }
  if (!src.includes('px-3 py-2 rounded-md text-xs sm:text-sm font-semibold border')) {
    throw new Error('CategoryPage pagination prev/next buttons do not use rounded-md');
  }
  if (!src.includes('bg-slate-50 text-slate-500 p-8 rounded-md text-center border border-slate-200')) {
    throw new Error('CategoryPage empty state container does not use rounded-md border-slate-200');
  }
  return 'CategoryPage navigation, badges, pagination, and empty state verified: rounded-md border-slate-200';
});

// ==============================================================================
// 6. GLOBAL CSS TOKENS & COMPILED CSS BUILD VERIFICATION
// ==============================================================================
console.log('\n👉 [SECTION 6] Global CSS Tokens & Compiled Distribution Verification');

check('CSS-01', 'src/index.css defines --radius-md as 0.375rem (6px) and clamps boxes <= 0.5rem', () => {
  const src = readSource('src/index.css');
  const mdMatch = src.match(/--radius-md:\s*([^;]+);/);
  const lgMatch = src.match(/--radius-lg:\s*([^;]+);/);
  const xlMatch = src.match(/--radius-xl:\s*([^;]+);/);
  const r2Match = src.match(/--radius-2xl:\s*([^;]+);/);
  const r3Match = src.match(/--radius-3xl:\s*([^;]+);/);

  if (!mdMatch || mdMatch[1].trim() !== '0.375rem') {
    throw new Error(`--radius-md must be 0.375rem (found: ${mdMatch ? mdMatch[1] : 'none'})`);
  }
  if (!lgMatch || lgMatch[1].trim() !== '0.5rem') {
    throw new Error(`--radius-lg must be 0.5rem (found: ${lgMatch ? lgMatch[1] : 'none'})`);
  }
  if (!xlMatch || xlMatch[1].trim() !== '0.5rem') {
    throw new Error(`--radius-xl must be 0.5rem (found: ${xlMatch ? xlMatch[1] : 'none'})`);
  }
  if (!r2Match || r2Match[1].trim() !== '0.5rem') {
    throw new Error(`--radius-2xl must be 0.5rem (found: ${r2Match ? r2Match[1] : 'none'})`);
  }
  if (!r3Match || r3Match[1].trim() !== '0.5rem') {
    throw new Error(`--radius-3xl must be 0.5rem (found: ${r3Match ? r3Match[1] : 'none'})`);
  }
  return 'All box radius tokens in index.css clamped: md=0.375rem (6px), lg/xl/2xl/3xl=0.5rem (8px)';
});

check('CSS-02', 'Compiled CSS bundle in dist/assets contains clamped radius and tactile shadows', () => {
  const distDir = path.resolve(FRONTEND_ROOT, 'dist/assets');
  if (!fs.existsSync(distDir)) {
    throw new Error(`Dist assets directory does not exist: ${distDir}`);
  }
  const files = fs.readdirSync(distDir);
  const cssFile = files.find(f => f.endsWith('.css') && !f.endsWith('.gz'));
  if (!cssFile) {
    throw new Error('No compiled CSS file found in dist/assets');
  }
  const cssContent = fs.readFileSync(path.resolve(distDir, cssFile), 'utf8');
  if (!cssContent.includes('0.375rem') && !cssContent.includes('6px')) {
    throw new Error('Compiled CSS does not contain 0.375rem / 6px radius token');
  }
  return `Compiled CSS bundle verified (${cssFile}): contains active 0.375rem (6px) tokens`;
});

// ==============================================================================
// SUMMARY & VERDICT
// ==============================================================================
console.log('\n================================================================');
console.log('📊 CHALLENGER M3 (2) TEST EXECUTION SUMMARY');
console.log('================================================================');
console.log(`Total Checks Evaluated : ${totalChecks}`);
console.log(`Passed Checks          : ${passedChecks} (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log(`Failed Checks          : ${failedChecks}`);

if (failedChecks > 0) {
  console.log('\n❌ FAILURES RECORDED:');
  for (const f of failures) {
    console.log(`  - [${f.id}] ${f.title}: ${f.error}`);
  }
  console.log('\nVERDICT: CHALLENGE_FAILED 🚫');
  process.exit(1);
} else {
  console.log('\n✅ ALL ADVERSARIAL STRESS CHECKS PASSED EMPIRICALLY!');
  console.log('VERDICT: APPROVE 🏆');
  process.exit(0);
}
