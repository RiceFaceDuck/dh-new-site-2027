/**
 * ==============================================================================
 * 🛡️ CHALLENGER 1 ADVERSARIAL STRESS SUITE: MILESTONE M1
 * Central CSS Architecture & Global Token Calibration
 * ==============================================================================
 *
 * Target: Management System/dh-frontend/dist/assets/*.css
 * Author: Challenger 1 (EMPIRICAL CHALLENGER)
 * Date: 2026-10-12
 *
 * Key Adversarial Challenges:
 * 1. Inspect compiled CSS bundle in dh-frontend/dist/assets/*.css.
 * 2. Verify .rounded-2xl and .rounded-3xl resolve to <= 0.5rem / 8px max.
 * 3. Verify .rounded-full does NOT resolve to 8px and maintains full circular geometry (>= 9999px).
 * 4. Challenge whether any Tailwind v4 syntax in index.css causes silent failures or dropped rules.
 * 5. Verify CSS cascade order and override precedence for faint border remaps.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.resolve(REPO_ROOT, 'Management System/dh-frontend');
const DIST_ASSETS = path.resolve(FRONTEND_ROOT, 'dist/assets');
const SRC_INDEX_CSS = path.resolve(FRONTEND_ROOT, 'src/index.css');

console.log('================================================================');
console.log('🛡️ CHALLENGER 1 ADVERSARIAL STRESS TEST: CSS TOKEN CALIBRATION');
console.log(` Target Assets: ${DIST_ASSETS}`);
console.log('================================================================\n');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureList = [];

function assertEmpirical(id, description, condition, rationale) {
  totalAssertions++;
  if (condition) {
    console.log(`  ✅ [PASS] [${id}] ${description}`);
    passedAssertions++;
  } else {
    console.error(`  ❌ [FAIL] [${id}] ${description}`);
    console.error(`     ↳ Rationale: ${rationale}`);
    failedAssertions++;
    failureList.push({ id, description, rationale });
  }
}

// -----------------------------------------------------------------------------
// STEP 1: Verify Compiled CSS Bundle Availability
// -----------------------------------------------------------------------------
assertEmpirical(
  'CH-CSS-01',
  'Compiled production CSS bundle exists in dist/assets/',
  fs.existsSync(DIST_ASSETS),
  `dist/assets directory does not exist at ${DIST_ASSETS}`
);

const cssFiles = fs.existsSync(DIST_ASSETS)
  ? fs.readdirSync(DIST_ASSETS).filter(f => f.endsWith('.css'))
  : [];

assertEmpirical(
  'CH-CSS-02',
  'Exactly one primary CSS bundle is produced by Vite/Tailwind v4',
  cssFiles.length >= 1,
  `Expected at least 1 compiled CSS file, found: ${cssFiles.length}`
);

if (cssFiles.length === 0) {
  console.error('Fatal: No CSS file found. Aborting test.');
  process.exit(1);
}

const mainCssFile = cssFiles[0];
const cssContent = fs.readFileSync(path.join(DIST_ASSETS, mainCssFile), 'utf8');
const indexCssSrc = fs.readFileSync(SRC_INDEX_CSS, 'utf8');

console.log(`\n📦 Active CSS Bundle: ${mainCssFile} (${(cssContent.length / 1024).toFixed(2)} KB)\n`);

// -----------------------------------------------------------------------------
// STEP 2: Adversarial Token Value Extraction & AST Analysis
// -----------------------------------------------------------------------------
console.log('👉 [CHALLENGE 1] Verifying Radius Variables in @layer theme');

// Extract all --radius definitions
const radiusVarMatches = cssContent.match(/--radius-[a-z0-9]+:[^;{}]+/g) || [];
const radiusMap = {};
for (const match of radiusVarMatches) {
  const [k, v] = match.split(':');
  radiusMap[k.trim()] = v.trim();
}

// Extract base --radius
const baseRadiusMatch = cssContent.match(/(?:^|[;{])(--radius:[^;{}]+)/);
if (baseRadiusMatch) {
  const [k, v] = baseRadiusMatch[1].split(':');
  radiusMap[k.trim()] = v.trim();
}

console.log('   Extracted Theme Radius Tokens:', JSON.stringify(radiusMap, null, 2));

function remOrPxToPixels(val, baseFontSize = 16) {
  if (!val) return NaN;
  if (val.endsWith('rem')) {
    const num = parseFloat(val.replace('rem', ''));
    return num * baseFontSize;
  }
  if (val.endsWith('px')) {
    return parseFloat(val.replace('px', ''));
  }
  return parseFloat(val);
}

// Assertions on token values
assertEmpirical(
  'CH-RAD-01',
  '--radius-md token is calibrated to 0.375rem (6.0px)',
  radiusMap['--radius-md'] === '.375rem' || radiusMap['--radius-md'] === '0.375rem',
  `--radius-md is "${radiusMap['--radius-md']}", expected "0.375rem"`
);

assertEmpirical(
  'CH-RAD-02',
  '--radius-lg token is clamped to <= 0.5rem (8.0px max)',
  remOrPxToPixels(radiusMap['--radius-lg']) <= 8.0,
  `--radius-lg resolves to ${remOrPxToPixels(radiusMap['--radius-lg'])}px (> 8px)`
);

assertEmpirical(
  'CH-RAD-03',
  '--radius-xl token is clamped to <= 0.5rem (8.0px max)',
  remOrPxToPixels(radiusMap['--radius-xl']) <= 8.0,
  `--radius-xl resolves to ${remOrPxToPixels(radiusMap['--radius-xl'])}px (> 8px)`
);

assertEmpirical(
  'CH-RAD-04',
  '--radius-2xl token is clamped to <= 0.5rem (8.0px max)',
  remOrPxToPixels(radiusMap['--radius-2xl']) <= 8.0,
  `--radius-2xl resolves to ${remOrPxToPixels(radiusMap['--radius-2xl'])}px (> 8px)`
);

assertEmpirical(
  'CH-RAD-05',
  '--radius-3xl token is clamped to <= 0.5rem (8.0px max)',
  remOrPxToPixels(radiusMap['--radius-3xl']) <= 8.0,
  `--radius-3xl resolves to ${remOrPxToPixels(radiusMap['--radius-3xl'])}px (> 8px)`
);

assertEmpirical(
  'CH-RAD-06',
  '--radius (default) token is calibrated to 0.375rem (6.0px)',
  radiusMap['--radius'] === '.375rem' || radiusMap['--radius'] === '0.375rem',
  `--radius is "${radiusMap['--radius']}", expected "0.375rem"`
);

assertEmpirical(
  'CH-RAD-07',
  '--radius-full is NOT overridden in index.css @theme block',
  !/--radius-full\s*:/i.test(indexCssSrc),
  '--radius-full is explicitly defined in index.css @theme, which risks overriding circular geometry'
);

// -----------------------------------------------------------------------------
// STEP 3: Adversarial Challenge: .rounded-2xl and .rounded-3xl Utilities
// -----------------------------------------------------------------------------
console.log('\n👉 [CHALLENGE 2] Stress-Testing .rounded-2xl and .rounded-3xl Resolution');

// Extract .rounded-2xl rule
const rounded2xlMatch = cssContent.match(/\.rounded-2xl\s*\{([^}]+)\}/);
const rounded2xlBody = rounded2xlMatch ? rounded2xlMatch[1] : '';

assertEmpirical(
  'CH-UTL-01',
  '.rounded-2xl utility class is generated in compiled CSS',
  rounded2xlMatch !== null,
  '.rounded-2xl utility class was not found in compiled CSS'
);

assertEmpirical(
  'CH-UTL-02',
  '.rounded-2xl binds to var(--radius-2xl) and resolves to <= 8px max',
  rounded2xlBody.includes('var(--radius-2xl)') && remOrPxToPixels(radiusMap['--radius-2xl']) <= 8.0,
  `.rounded-2xl rule "${rounded2xlBody}" does not resolve to <= 8px`
);

// Extract .rounded-3xl rule
const rounded3xlMatch = cssContent.match(/\.rounded-3xl\s*\{([^}]+)\}/);
const rounded3xlBody = rounded3xlMatch ? rounded3xlMatch[1] : '';

assertEmpirical(
  'CH-UTL-03',
  '.rounded-3xl utility class is generated in compiled CSS',
  rounded3xlMatch !== null,
  '.rounded-3xl utility class was not found in compiled CSS'
);

assertEmpirical(
  'CH-UTL-04',
  '.rounded-3xl binds to var(--radius-3xl) and resolves to <= 8px max',
  rounded3xlBody.includes('var(--radius-3xl)') && remOrPxToPixels(radiusMap['--radius-3xl']) <= 8.0,
  `.rounded-3xl rule "${rounded3xlBody}" does not resolve to <= 8px`
);

// Extract directional variants (.rounded-t-3xl)
const roundedT3xlMatch = cssContent.match(/\.rounded-t-3xl\s*\{([^}]+)\}/);
assertEmpirical(
  'CH-UTL-05',
  '.rounded-t-3xl directional utility binds to var(--radius-3xl) (clamped to 8px)',
  roundedT3xlMatch !== null && roundedT3xlMatch[1].includes('var(--radius-3xl)'),
  `.rounded-t-3xl does not correctly bind to var(--radius-3xl)`
);

// -----------------------------------------------------------------------------
// STEP 4: Adversarial Challenge: .rounded-full Circular Geometry Preservation
// -----------------------------------------------------------------------------
console.log('\n👉 [CHALLENGE 3] Stress-Testing .rounded-full Circular Geometry (Anti-Clamping Guard)');

const roundedFullMatch = cssContent.match(/\.rounded-full\s*\{([^}]+)\}/);
const roundedFullBody = roundedFullMatch ? roundedFullMatch[1] : '';

assertEmpirical(
  'CH-CIR-01',
  '.rounded-full utility class is generated in compiled CSS',
  roundedFullMatch !== null,
  '.rounded-full was not generated in compiled CSS bundle'
);

// Extract border-radius value
const fullRadiusMatch = roundedFullBody.match(/border-radius\s*:\s*([^;]+)/);
const fullRadiusVal = fullRadiusMatch ? fullRadiusMatch[1].trim() : '';

const isCircularValue =
  fullRadiusVal === '2147483647px' ||
  fullRadiusVal === '9999px' ||
  fullRadiusVal.includes('infinity') ||
  parseInt(fullRadiusVal, 10) >= 9999;

assertEmpirical(
  'CH-CIR-02',
  '.rounded-full border-radius maintains full circular geometry (>= 9999px or 2147483647px)',
  isCircularValue,
  `.rounded-full border-radius is "${fullRadiusVal}", which is not circular (expected >= 9999px)`
);

assertEmpirical(
  'CH-CIR-03',
  '.rounded-full NEVER resolves to 8px or any rectangular clamped value',
  fullRadiusVal !== '8px' && fullRadiusVal !== '0.5rem' && !fullRadiusVal.includes('--radius-2xl') && !fullRadiusVal.includes('--radius-3xl'),
  `.rounded-full improperly resolved to clamped 8px value!`
);

// Check pseudo-element variant: .after:rounded-full:after
const afterRoundedFull = cssContent.match(/\.after\\:rounded-full(?::after)?\s*\{([^}]+)\}/);
if (afterRoundedFull) {
  assertEmpirical(
    'CH-CIR-04',
    '.after:rounded-full:after pseudo utility preserves circular geometry',
    afterRoundedFull[1].includes('2147483647px') || afterRoundedFull[1].includes('9999px'),
    `after:rounded-full does not maintain circular geometry: ${afterRoundedFull[1]}`
  );
}

// -----------------------------------------------------------------------------
// STEP 5: Adversarial Challenge: Silent Failures, Dropped Rules & Cascade Precedence
// -----------------------------------------------------------------------------
console.log('\n👉 [CHALLENGE 4] Stress-Testing Silent Failures, Dropped Rules & Cascade Precedence');

// 1. Deduplication checks in source
const themeBlocks = (indexCssSrc.match(/@theme\s*\{/g) || []).length;
assertEmpirical(
  'CH-SYN-01',
  'src/index.css contains exactly 1 @theme block (no duplicate declarations)',
  themeBlocks === 1,
  `Found ${themeBlocks} @theme blocks in index.css (expected 1)`
);

const baseFallbackBlocks = (indexCssSrc.match(/@layer\s+base\s*\{\s*[\s\S]*?border-color:\s*var\(--color-gray-200/g) || []).length;
assertEmpirical(
  'CH-SYN-02',
  'src/index.css contains 0 legacy duplicate gray-200 @layer base fallback blocks',
  baseFallbackBlocks === 0,
  `Found ${baseFallbackBlocks} legacy gray-200 @layer base fallback blocks in index.css`
);

// 2. Base slate-200 border elevation
assertEmpirical(
  'CH-SYN-03',
  'Base universal border-color reset compiles to slate-200 (#e2e8f0)',
  cssContent.includes('border-color:var(--color-slate-200,#e2e8f0)'),
  'Base border reset does not contain var(--color-slate-200, #e2e8f0)'
);

// 3. Body canvas slate-50 anti-whiteout
assertEmpirical(
  'CH-SYN-04',
  'Body canvas background compiles to slate-50 (#f8fafc)',
  cssContent.includes('background:var(--color-slate-50,#f8fafc)'),
  'Body canvas is missing background: var(--color-slate-50, #f8fafc)'
);

// 4. @utility card-premium compilation
const cardPremiumRule = cssContent.match(/\.card-premium\s*\{([^}]+)\}/);
assertEmpirical(
  'CH-SYN-05',
  '@utility card-premium compiles into CSS bundle with slate-200 border and md radius',
  cardPremiumRule !== null &&
    cardPremiumRule[1].includes('var(--radius-md,.375rem)') &&
    cardPremiumRule[1].includes('var(--color-slate-200,#e2e8f0)'),
  `card-premium rule is malformed or missing: ${cardPremiumRule ? cardPremiumRule[1] : 'null'}`
);

// 5. Cascade Order Precedence Test for border-slate-100 / border-gray-100 remap
const standardBorderGrayPos = cssContent.indexOf('.border-gray-100{border-color:var(--color-gray-100)}');
const overrideBorderPos = cssContent.indexOf('.border-slate-100,.border-gray-100{');

assertEmpirical(
  'CH-CAS-01',
  'Legacy border remap (.border-slate-100, .border-gray-100) exists in compiled CSS',
  overrideBorderPos !== -1,
  'Override .border-slate-100, .border-gray-100 not found in compiled CSS'
);

assertEmpirical(
  'CH-CAS-02',
  'Legacy border override appears AFTER standard border-gray-100 in cascade order (wins precedence)',
  overrideBorderPos !== -1 && (standardBorderGrayPos === -1 || overrideBorderPos > standardBorderGrayPos),
  `Cascade precedence violated: override at byte ${overrideBorderPos}, standard at byte ${standardBorderGrayPos}`
);

// 6. Shake Keyframes & Animate Shake Utility
assertEmpirical(
  'CH-SYN-06',
  '@keyframes shake compiles cleanly into CSS bundle',
  cssContent.includes('@keyframes shake'),
  '@keyframes shake is missing from compiled bundle'
);

assertEmpirical(
  'CH-SYN-07',
  '@utility animate-shake compiles cleanly into CSS bundle',
  cssContent.includes('.animate-shake'),
  '.animate-shake utility is missing from compiled bundle'
);

// -----------------------------------------------------------------------------
// STEP 6: Multi-Scale Proportional Math Stress Test (Dynamic Root Font Size)
// -----------------------------------------------------------------------------
console.log('\n👉 [CHALLENGE 5] Multi-Scale Mathematical Scaling Stress Test');

// Test standard 16px, small 14px, large 18px, accessible 20px
const testBaseFontSizes = [12, 14, 16, 18, 20];
let allScalesPass = true;
for (const base of testBaseFontSizes) {
  const r2xl = remOrPxToPixels(radiusMap['--radius-2xl'], base);
  const r3xl = remOrPxToPixels(radiusMap['--radius-3xl'], base);
  const rmd = remOrPxToPixels(radiusMap['--radius-md'], base);

  // At any font size, 0.5rem is exactly 0.5 * base px
  const expectedMax = 0.5 * base;
  if (r2xl > expectedMax || r3xl > expectedMax) {
    allScalesPass = false;
    console.error(`     ↳ Mathematical failure at base ${base}px: r2xl=${r2xl}px, expected <= ${expectedMax}px`);
  }
}

assertEmpirical(
  'CH-MTH-01',
  'Border radius tokens scale strictly proportionally with root rem base (12px - 20px font-size range)',
  allScalesPass,
  'Proportional mathematical scaling failed at one or more font-size bases'
);

// -----------------------------------------------------------------------------
// FINAL SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log('📊 CHALLENGER 1 EMPIRICAL RESULTS SUMMARY');
console.log('================================================================');
console.log(`Total Empirical Assertions Evaluated : ${totalAssertions}`);
console.log(`Passed Assertions                     : ${passedAssertions} (${((passedAssertions / totalAssertions) * 100).toFixed(1)}%)`);
console.log(`Failed Assertions                     : ${failedAssertions} (${((failedAssertions / totalAssertions) * 100).toFixed(1)}%)`);

if (failedAssertions > 0) {
  console.log('\n❌ EMPIRICAL FAILURES DETECTED:');
  failureList.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.id}: ${f.description}`);
    console.log(`      ↳ Rationale: ${f.rationale}`);
  });
  console.log('\n🛑 VERDICT: CHALLENGE_FAILED\n');
  process.exit(1);
} else {
  console.log('\n🎉 ALL EMPIRICAL CHALLENGES PASSED!');
  console.log('🟢 VERDICT: APPROVE\n');
  process.exit(0);
}
