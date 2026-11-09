import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('='.repeat(80));
console.log('  ⚔️ EMPIRICAL CHALLENGER: MILESTONE 3 SRP & UI CONFORMANCE SUITE');
console.log('  Target: StoreProfile components SRP, Calm UI, rounded-[2px]');
console.log('='.repeat(80));

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Suite 1: StoreViewBadge Conformance (Calm UI, Dual-Period, rounded-[2px])
// -----------------------------------------------------------------------------
console.log('\n--- Suite 1: StoreViewBadge Calm UI & Dual-Period Invariants ---');

test('StoreViewBadge 1.1: Component file length is strictly under 60 lines', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreViewBadge.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.trim().split('\n').length;
  assert.ok(lines < 60, `StoreViewBadge lines (${lines}) must be < 60`);
});

test('StoreViewBadge 1.2: Calm UI compliance: strictly ZERO animations (no animate-pulse, no animate-spin)', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreViewBadge.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(!code.includes('animate-pulse'), 'Must not contain animate-pulse');
  assert.ok(!code.includes('animate-spin'), 'Must not contain animate-spin');
  assert.ok(!code.includes('animate-bounce'), 'Must not contain animate-bounce');
});

test('StoreViewBadge 1.3: Border Radius 0.1 invariant (rounded-[2px])', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreViewBadge.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('rounded-[2px]'), 'Must enforce rounded-[2px]');
});

test('StoreViewBadge 1.4: Displays both allTime and today view counts with thousands separator', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreViewBadge.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('.toLocaleString()'), 'Must format numbers using toLocaleString()');
  assert.ok(code.includes('todayViewCount') || code.includes('todayVal'), 'Must support today view count');
  assert.ok(code.includes('views?.today') || code.includes('todayVal'), 'Must support nested views object');
});

// -----------------------------------------------------------------------------
// Suite 2: StoreActionButtons Extraction & StoreProfileHero Integration
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: StoreActionButtons Extraction & Hero Integration ---');

test('StoreActionButtons 2.1: StoreActionButtons extracted and length < 80 lines', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreActionButtons.jsx');
  assert.ok(fs.existsSync(filePath), 'StoreActionButtons.jsx must exist');
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.trim().split('\n').length;
  assert.ok(lines < 80, `StoreActionButtons lines (${lines}) must be < 80 lines`);
});

test('StoreActionButtons 2.2: Uses resolveMapsUrl from storeUrlUtils', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreActionButtons.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes("import { resolveMapsUrl } from '../utils/storeUrlUtils'"), 'Must import resolveMapsUrl from storeUrlUtils');
  assert.ok(code.includes('resolveMapsUrl(partner)'), 'Must call resolveMapsUrl(partner)');
});

test('StoreActionButtons 2.3: Preserves existing button styling and radii (Buttons Exception)', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreActionButtons.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('rounded-xl'), 'Must preserve rounded-xl button styling per Buttons Exception');
  assert.ok(code.includes('bg-emerald-600'), 'Preserves Phone button');
  assert.ok(code.includes('bg-sky-600'), 'Preserves Maps button');
  assert.ok(code.includes('bg-slate-700'), 'Preserves Share button');
});

test('StoreProfileHero 2.4: Hero renders StoreActionButtons and passes todayViewCount to StoreViewBadge', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreProfileHero.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('StoreActionButtons'), 'Hero must import and render StoreActionButtons');
  assert.ok(code.includes('<StoreActionButtons partner={partner} />'), 'Must render StoreActionButtons component');
  assert.ok(code.includes('todayViewCount'), 'Hero must extract todayViewCount from useStoreStats');
  assert.ok(code.includes('todayViewCount={todayViewCount}'), 'Must pass todayViewCount to StoreViewBadge');
});

// -----------------------------------------------------------------------------
// Suite 3: StoreProfileInfo Decomposition & SRP (< 80 lines each)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: StoreProfileInfo God Component Decomposition (< 80 lines each) ---');

const subcomponents = [
  { name: 'StoreProfileDetails.jsx', maxLines: 80 },
  { name: 'StoreLocationCard.jsx', maxLines: 80 },
  { name: 'StoreContactChannels.jsx', maxLines: 80 },
  { name: 'StoreCertifications.jsx', maxLines: 80 },
  { name: 'StoreProfileInfo.jsx', maxLines: 80 }
];

for (const { name, maxLines } of subcomponents) {
  test(`Decomposition 3.${name}: File exists and length is strictly < ${maxLines} lines`, () => {
    const filePath = path.resolve(REPO_ROOT, `Management System/dh-frontend/src/pages/StoreProfile/components/${name}`);
    assert.ok(fs.existsSync(filePath), `${name} must exist`);
    const code = fs.readFileSync(filePath, 'utf8');
    const lines = code.trim().split('\n').length;
    assert.ok(lines < maxLines, `${name} has ${lines} lines, which exceeds maximum ${maxLines}`);
  });
}

test('Decomposition 3.5: StoreLocationCard uses resolveMapsUrl from storeUrlUtils', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreLocationCard.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes("import { resolveMapsUrl } from '../utils/storeUrlUtils'"), 'Must import resolveMapsUrl');
  assert.ok(code.includes('rounded-[2px]'), 'Must apply rounded-[2px]');
});

test('Decomposition 3.6: StoreContactChannels uses resolveSocialLinks from storeUrlUtils', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreContactChannels.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes("import { resolveSocialLinks } from '../utils/storeUrlUtils'"), 'Must import resolveSocialLinks');
  assert.ok(code.includes('rounded-[2px]'), 'Must apply rounded-[2px]');
});

test('Decomposition 3.7: StoreCertifications applies rounded-[2px]', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreCertifications.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('rounded-[2px]'), 'Must apply rounded-[2px]');
});

test('Decomposition 3.8: StoreProfileInfo is pure container assembling all 4 subcomponents', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreProfileInfo.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('StoreProfileDetails'), 'Must import StoreProfileDetails');
  assert.ok(code.includes('StoreContactChannels'), 'Must import StoreContactChannels');
  assert.ok(code.includes('StoreLocationCard'), 'Must import StoreLocationCard');
  assert.ok(code.includes('StoreCertifications'), 'Must import StoreCertifications');
  assert.ok(code.includes('PartnerReviews'), 'Must import PartnerReviews');
  assert.ok(code.includes('GalleryLightbox'), 'Must import GalleryLightbox');
});

// -----------------------------------------------------------------------------
// Suite 4: StoreRecommendedProducts Hook Extraction
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Recommended Products Custom Hook Decoupling ---');

test('Hook 4.1: useStoreRecommendedProducts custom hook exists and encapsulates query logic', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreRecommendedProducts.js');
  assert.ok(fs.existsSync(filePath), 'useStoreRecommendedProducts.js must exist');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('getRandomFeaturedProducts'), 'Must call getRandomFeaturedProducts');
  assert.ok(code.includes('useInView'), 'Must encapsulate useInView');
});

test('Component 4.2: StoreRecommendedProducts is pure presentation component (< 40 lines)', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/StoreRecommendedProducts.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.trim().split('\n').length;
  assert.ok(lines < 40, `StoreRecommendedProducts lines (${lines}) must be < 40`);
  assert.ok(code.includes('useStoreRecommendedProducts'), 'Must use custom hook');
  assert.ok(!code.includes('featuredQueryService'), 'Must NOT call featuredQueryService directly (pure UI)');
});

// -----------------------------------------------------------------------------
// Suite 5: PartnerReviews rounded-[2px] Invariant
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: PartnerReviews Border Radius 0.1 Invariant ---');

test('PartnerReviews 5.1: Zero rounded-2xl remaining in PartnerReviews.jsx', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/PartnerReviews.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(!code.includes('rounded-2xl'), 'All rounded-2xl must be replaced with rounded-[2px]');
  assert.ok(code.includes('rounded-[2px]'), 'Must use rounded-[2px] for cards, form, review items, and reply containers');
});

test('PartnerReviews 5.2: Buttons exception preserved (submit button maintains rounded-lg)', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components/PartnerReviews.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  assert.ok(code.includes('rounded-lg font-medium hover:bg-brand-dark'), 'Submit button retains rounded-lg');
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log(`  RESULT: Total: ${totalCount} | Passed: ${passCount} | Failed: 0`);
console.log('='.repeat(80));
console.log('\n🎉 ALL MILESTONE 3 SRP & UI CONFORMANCE INVARIANTS VERIFIED 100%!');
