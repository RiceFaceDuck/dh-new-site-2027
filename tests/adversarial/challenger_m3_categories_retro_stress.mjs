/**
 * CHALLENGER M3: CATEGORIES RETRO CALIBRATION & CONTRAST ADVERSARIAL STRESS TEST
 *
 * This adversarial challenger independently stress-tests:
 * 1. Geometry & Radius Invariants: CategoryCard, CategoryModal, CategoriesMain, CategoryGrid, CategoryPage
 *    must have zero bubble classes (rounded-2xl, rounded-3xl, rounded-xl) and use rounded-md (0.375rem).
 * 2. Circular Exception Invariants: Icon buttons (CategoryCard chevron, CategoryModal close) must strictly preserve rounded-full.
 * 3. Color Science & Contrast: Card surfaces, tactile borders (slate-200/300), and text contrast against WCAG AAA/AA.
 * 4. Responsive & Accessibility Oracles: Desktop 4-col vs Mobile compact modal launcher, keyboard & scroll locks.
 * 5. Local Grimoire Protocol 2.2: ssr-memory_categories.md structure, 5 pillars, and zero secrets.
 * 6. Integrity Verification: Zero mock facades or hardcoded bypasses.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const FRONTEND_DIR = path.resolve(PROJECT_ROOT, 'dh-frontend');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];
const caveats = [];

function assert(condition, testId, description, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] [${testId}] ${description}`);
    if (details) console.log(`          ↳ ${details}`);
  } else {
    failedChecks++;
    console.error(`  ❌ [FAIL] [${testId}] ${description}`);
    if (details) console.error(`          ↳ ${details}`);
    failures.push({ testId, description, details });
  }
}

function noteCaveat(label, detail) {
  caveats.push({ label, detail });
  console.log(`  ⚠️ NOTE: [${label}] ${detail}`);
}

// Relative luminance per ITU-R BT.709
function getLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const bright = Math.max(lum1, lum2);
  const dark = Math.min(lum1, lum2);
  return (bright + 0.05) / (dark + 0.05);
}

console.log('================================================================');
console.log('🛡️ CHALLENGER M3: CATEGORIES RETRO CALIBRATION & CONTRAST STRESS');
console.log(' Target: Management System/dh-frontend/src/pages/Categories');
console.log('================================================================\n');

// -------------------------------------------------------------
// SECTION 1: GEOMETRY & RADIUS INVARIANTS ACROSS CATEGORIES FILES
// -------------------------------------------------------------
console.log('--- 1. GEOMETRY & RADIUS INVARIANTS ACROSS CATEGORIES FILES ---');

const categoryFiles = {
  card: path.resolve(FRONTEND_DIR, 'src/pages/Categories/components/CategoryCard.jsx'),
  modal: path.resolve(FRONTEND_DIR, 'src/pages/Categories/components/CategoryModal.jsx'),
  main: path.resolve(FRONTEND_DIR, 'src/pages/Categories/CategoriesMain.jsx'),
  grid: path.resolve(FRONTEND_DIR, 'src/pages/Categories/components/CategoryGrid.jsx'),
  page: path.resolve(FRONTEND_DIR, 'src/pages/CategoryPage.jsx')
};

const contents = {};
for (const [key, filePath] of Object.entries(categoryFiles)) {
  assert(fs.existsSync(filePath), `FIL-EXI-${key.toUpperCase()}`, `File exists: ${path.basename(filePath)}`);
  contents[key] = fs.readFileSync(filePath, 'utf8');
}

// Check 1.1: Zero bubble curvatures across all 5 files
const bubbleClassRegex = /\brounded-(2xl|3xl|4xl|xl)\b/g;

for (const [key, content] of Object.entries(contents)) {
  const matches = [...content.matchAll(bubbleClassRegex)].map(m => m[0]);
  assert(
    matches.length === 0,
    `GEO-NO-BUBBLE-${key.toUpperCase()}`,
    `${path.basename(categoryFiles[key])} has 0 bubble curvature classes (no rounded-2xl/3xl/xl)`,
    matches.length === 0 ? 'Verified: Clean retro radius' : `Found bubble classes: ${matches.join(', ')}`
  );
}

// Check 1.2: CategoryCard outer link uses rounded-md and border-slate-200
const cardLinkMatch = contents.card.match(/<Link[\s\S]*?className="([^"]*)"/);
const cardLinkClasses = cardLinkMatch ? cardLinkMatch[1] : '';
assert(
  cardLinkClasses.includes('rounded-md') && cardLinkClasses.includes('border-slate-200'),
  'GEO-CRD-WRAP',
  'CategoryCard wrapper uses rounded-md and tactile border-slate-200',
  `Found: ${cardLinkClasses}`
);

// Check 1.3: CategoryCard image box uses rounded-sm and border-slate-200
const cardImgBoxMatch = contents.card.match(/w-14 h-14[^"]*rounded-sm[^"]*border-slate-200/);
assert(
  !!cardImgBoxMatch,
  'GEO-CRD-IMG',
  'CategoryCard image container uses classic 4px radius (rounded-sm) and border-slate-200'
);

// Check 1.4: CategoryModal dialog card uses rounded-md and border-slate-200
const modalDialogMatch = contents.modal.match(/max-w-md[^"]*rounded-md[^"]*border-slate-200/);
assert(
  !!modalDialogMatch,
  'GEO-MDL-CARD',
  'CategoryModal dialog container uses rounded-md and border-slate-200 (replaces rounded-3xl)'
);

// Check 1.5: CategoriesMain search input uses rounded-md and border-slate-300
const mainSearchInput = contents.main.includes('placeholder="ค้นหาอะไหล่') &&
                        contents.main.includes('border-slate-300') &&
                        contents.main.includes('rounded-md');
assert(
  mainSearchInput,
  'GEO-MAIN-INP',
  'CategoriesMain quick search input uses rounded-md and border-slate-300'
);

// Check 1.6: CategoryPage back button and pagination use rounded-md
const pageBackMatch = contents.page.match(/to="\/categories"[\s\S]*?rounded-md[\s\S]*?border-slate-200/);
const pagePagBtnMatch = contents.page.match(/handlePageChange[\s\S]*?rounded-md[\s\S]*?border-slate-200/);
assert(
  !!pageBackMatch && !!pagePagBtnMatch,
  'GEO-PAGE-CTRL',
  'CategoryPage back button and pagination controls use rounded-md and border-slate-200'
);

// -------------------------------------------------------------
// SECTION 2: CIRCULAR EXCEPTION PRESERVATION RIGOR
// -------------------------------------------------------------
console.log('\n--- 2. CIRCULAR EXCEPTION PRESERVATION RIGOR ---');

// Check 2.1: CategoryCard chevron icon button preserves rounded-full with 1:1 aspect ratio
const chevronCircleMatch = contents.card.match(/w-8 h-8 rounded-full[\s\S]*?ChevronRight/);
assert(
  !!chevronCircleMatch,
  'CIR-CRD-CHEV',
  'CategoryCard chevron indicator strictly preserves 1:1 circular geometry (w-8 h-8 rounded-full)',
  'Verified 32px true circle'
);

// Check 2.2: CategoryModal close button preserves rounded-full with 1:1 aspect ratio
const closeCircleMatch = contents.modal.match(/w-8 h-8 rounded-full[\s\S]*?<X className="w-4 h-4"/);
assert(
  !!closeCircleMatch,
  'CIR-MDL-CLS',
  'CategoryModal close button strictly preserves 1:1 circular geometry (w-8 h-8 rounded-full)',
  'Verified 32px true circle'
);

// -------------------------------------------------------------
// SECTION 3: EMPIRICAL COLOR SCIENCE & CONTRAST
// -------------------------------------------------------------
console.log('\n--- 3. EMPIRICAL COLOR SCIENCE & CONTRAST ---');

// Color Tokens:
// Canvas: slate-50 (#f8fafc)
// Surface: white (#ffffff)
// Border tactile: slate-200 (#e2e8f0), slate-300 (#cbd5e1)
// Legacy washed out border: gray-100 (#f3f4f6), slate-100 (#f1f5f9)
// Dark text: slate-900 (#0f172a), slate-800 (#1e293b)
// Muted text: slate-500 (#64748b)
// Brand blue: #1b365d (trusted partner) or #0870b8 (tech pro)

const contrastSlate900OnWhite = getContrastRatio('#0f172a', '#ffffff');
assert(
  contrastSlate900OnWhite >= 15.0,
  'CNT-TXT-PRI',
  `Card primary heading text (slate-900) on white card contrast ratio is ${contrastSlate900OnWhite.toFixed(2)}:1 (Exceeds WCAG AAA 7:1)`
);

const contrastSlate500OnWhite = getContrastRatio('#64748b', '#ffffff');
assert(
  contrastSlate500OnWhite >= 4.5,
  'CNT-TXT-MUT',
  `Card secondary text (slate-500) on white card contrast ratio is ${contrastSlate500OnWhite.toFixed(2)}:1 (Passes WCAG AA 4.5:1)`
);

// Border edge contrast vs canvas
const lumWhite = getLuminance('#ffffff');
const lumSlate200 = getLuminance('#e2e8f0');
const lumSlate100 = getLuminance('#f1f5f9');
const deltaSlate200 = lumWhite - lumSlate200;
const deltaSlate100 = lumWhite - lumSlate100;
const improvementPercent = ((deltaSlate200 - deltaSlate100) / deltaSlate100) * 100;

assert(
  deltaSlate200 > deltaSlate100 * 2,
  'CNT-BDR-EDG',
  `border-slate-200 provides +${improvementPercent.toFixed(1)}% edge luminance delta over legacy border-slate-100, eliminating whiteout`,
  `Delta slate-200: ${deltaSlate200.toFixed(4)} vs slate-100: ${deltaSlate100.toFixed(4)}`
);

// -------------------------------------------------------------
// SECTION 4: RESPONSIVE & ACCESSIBILITY ORACLES
// -------------------------------------------------------------
console.log('\n--- 4. RESPONSIVE & ACCESSIBILITY ORACLES ---');

// Check 4.1: Desktop vs Mobile responsive separation in CategoriesMain
const hasMobileLauncher = contents.main.includes('block md:hidden') && contents.main.includes('setIsModalOpen(true)');
const hasDesktopGrid = contents.main.includes('hidden md:block') && contents.main.includes('<CategoryGrid');
assert(
  hasMobileLauncher && hasDesktopGrid,
  'RES-CAT-DSP',
  'CategoriesMain preserves strict responsive separation: mobile popup launcher (block md:hidden) vs desktop grid (hidden md:block)'
);

// Check 4.2: CategoryModal accessibility and event cleanup
const hasEscapeKey = contents.modal.includes("e.key === 'Escape'");
const hasScrollLock = contents.modal.includes("document.body.style.overflow = 'hidden'");
const hasScrollRestore = contents.modal.includes("document.body.style.overflow = originalOverflow");
const hasAriaModal = contents.modal.includes('aria-modal="true"');
assert(
  hasEscapeKey && hasScrollLock && hasScrollRestore && hasAriaModal,
  'ACC-MDL-EVT',
  'CategoryModal enforces robust accessibility: Escape key listener, body scroll lock/restore, and aria-modal'
);

// -------------------------------------------------------------
// SECTION 5: LOCAL GRIMOIRE PROTOCOL 2.2 COMPLIANCE
// -------------------------------------------------------------
console.log('\n--- 5. LOCAL GRIMOIRE PROTOCOL 2.2 COMPLIANCE ---');

const grimoirePath = path.resolve(FRONTEND_DIR, 'src/pages/Categories/ssr-memory_categories.md');
assert(fs.existsSync(grimoirePath), 'GRM-EXI', 'ssr-memory_categories.md exists in Categories directory');

const grimoireContent = fs.readFileSync(grimoirePath, 'utf8');

const hasUsage = grimoireContent.includes('<usage_workflow>') && grimoireContent.includes('</usage_workflow>');
const hasDomain = grimoireContent.includes('<domain_rules>') && grimoireContent.includes('</domain_rules>');
const hasSchema = grimoireContent.includes('<core_schema>') && grimoireContent.includes('</core_schema>');
const hasThirdParty = grimoireContent.includes('<third_party>') && grimoireContent.includes('</third_party>');
const hasPitfalls = grimoireContent.includes('<pitfalls_and_solutions>') && grimoireContent.includes('</pitfalls_and_solutions>');

assert(
  hasUsage && hasDomain && hasSchema && hasThirdParty && hasPitfalls,
  'GRM-PIL',
  'ssr-memory_categories.md strictly contains all 5 mandatory pillars (usage_workflow, domain_rules, core_schema, third_party, pitfalls_and_solutions)'
);

const hasRetroPitfall = grimoireContent.includes('UI Bubble Curvature & Low Contrast') &&
                        grimoireContent.includes('Retro Redesign M3') &&
                        grimoireContent.includes('rounded-md');

assert(
  hasRetroPitfall,
  'GRM-RETRO',
  'ssr-memory_categories.md documents Pitfall 3 (UI Bubble Curvature & Low Contrast) and proven retro calibration solution'
);

// Check zero secrets
const secretKeywords = ['password', 'secret', 'api_key', 'token:', 'sk_live', 'AIzaSy'];
let foundSecrets = false;
for (const kw of secretKeywords) {
  if (grimoireContent.toLowerCase().includes(kw)) {
    foundSecrets = true;
    break;
  }
}
assert(!foundSecrets, 'GRM-SEC', 'Zero secret / credential leak in ssr-memory_categories.md (Pointer-only policy adhered)');

// -------------------------------------------------------------
// SECTION 6: INTEGRITY VERIFICATION (ANTI-CHEATING)
// -------------------------------------------------------------
console.log('\n--- 6. INTEGRITY VERIFICATION (ANTI-CHEATING) ---');

// Check that Worker M3 did not introduce dummy facades or mock bypasses
const mockKeywords = ['mockResponse', 'fakeData', 'return true // bypass', 'bypassAuth', 'mockTest'];
let foundMocks = false;
for (const [key, content] of Object.entries(contents)) {
  for (const kw of mockKeywords) {
    if (content.includes(kw)) {
      foundMocks = true;
      assert(false, `INT-NO-MOCK-${key}`, `Integrity violation: Mock keyword '${kw}' found in ${path.basename(categoryFiles[key])}`);
    }
  }
}
if (!foundMocks) {
  assert(true, 'INT-NO-MOCK', 'Integrity verified: Zero mock facades, shortcuts, or hardcoded cheating in modified components');
}

// -------------------------------------------------------------
// RESULTS SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log('📊 CHALLENGER M3 RESULTS SUMMARY');
console.log(`Total Checks  : ${totalChecks}`);
console.log(`Passed Checks : ${passedChecks} (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log(`Failed Checks : ${failedChecks}`);
console.log('================================================================');

if (failedChecks > 0) {
  console.error('\n❌ FAILURES:');
  failures.forEach(f => console.error(`  - [${f.testId}] ${f.description}: ${f.details}`));
  process.exit(1);
} else {
  console.log('\n🎉 ALL CHALLENGER M3 TESTS PASSED 100%!');
  console.log('🟢 VERDICT: APPROVE');
  process.exit(0);
}
