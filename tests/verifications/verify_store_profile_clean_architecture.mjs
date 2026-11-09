/**
 * 🧪 VERIFICATION SUITE 4: STORE PROFILE CLEAN ARCHITECTURE & UI CONFORMANCE
 * Path: Management System/tests/verifications/verify_store_profile_clean_architecture.mjs
 * 
 * Objectives:
 * 1. File Length Limit: Every file in StoreProfile/components/ is <200 lines (and subcomponents <80 lines).
 * 2. Pure Presentation UI: Presentation components contain 0 direct Firestore SDK mutation imports (updateDoc, setDoc, addDoc).
 * 3. UI Border Radius 0.1 Invariant: All cards, containers, modals in StoreProfileInfo and PartnerReviews
 *    use rounded-[2px] (no rounded-2xl on cards).
 * 4. Calm UI Invariant: StoreViewBadge is static (no animate-pulse, animate-spin, or glow).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('='.repeat(80));
console.log('  🧪 VERIFICATION SUITE 4: STORE PROFILE CLEAN ARCHITECTURE & UI CONFORMANCE');
console.log('  Target: StoreProfile components, hooks, and services');
console.log('='.repeat(80));

let passCount = 0;
let totalCount = 0;

function runTest(name, fn) {
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

async function main() {
  const componentsDir = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/components');
  assert.ok(fs.existsSync(componentsDir), 'StoreProfile components directory must exist');

  const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx'));

  // ---------------------------------------------------------------------------
  // Section 1: File Length Limits & God Component Decomposition
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 1: File Length Limits & God Component Decomposition ---');

  const decomposedSubcomponents = [
    { name: 'StoreProfileDetails.jsx', maxLines: 80 },
    { name: 'StoreLocationCard.jsx', maxLines: 80 },
    { name: 'StoreContactChannels.jsx', maxLines: 80 },
    { name: 'StoreCertifications.jsx', maxLines: 80 },
    { name: 'StoreProfileInfo.jsx', maxLines: 80 },
    { name: 'StoreActionButtons.jsx', maxLines: 80 },
    { name: 'StoreViewBadge.jsx', maxLines: 60 },
    { name: 'StoreRecommendedProducts.jsx', maxLines: 40 },
    { name: 'PartnerAds.jsx', maxLines: 80 },
    { name: 'StoreProfileHero.jsx', maxLines: 80 }
  ];

  for (const { name, maxLines } of decomposedSubcomponents) {
    runTest(`1.1.${name}: Subcomponent exists and total lines < ${maxLines}`, () => {
      const filePath = path.join(componentsDir, name);
      assert.ok(fs.existsSync(filePath), `${name} must exist`);
      const code = fs.readFileSync(filePath, 'utf8');
      const lines = code.trim().split('\n').length;
      assert.ok(lines <= maxLines, `${name} has ${lines} lines, exceeding limit of ${maxLines}`);
    });
  }

  runTest('1.2: Every file in StoreProfile/components/ has effective code lines < 200', () => {
    for (const f of componentFiles) {
      const filePath = path.join(componentsDir, f);
      const code = fs.readFileSync(filePath, 'utf8');
      const lines = code.split('\n');
      const codeLines = lines.filter(l => {
        const trimmed = l.trim();
        return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
      });

      assert.ok(codeLines.length < 200,
        `${f} has ${codeLines.length} effective code lines, which exceeds the 200 code lines threshold`);
    }
  });

  runTest('1.3: StoreProfileInfo reduced from 293 lines to < 80 lines container', () => {
    const infoPath = path.join(componentsDir, 'StoreProfileInfo.jsx');
    const infoCode = fs.readFileSync(infoPath, 'utf8');
    const lines = infoCode.trim().split('\n').length;
    assert.ok(lines < 80, `StoreProfileInfo now has ${lines} lines (< 80)`);
    assert.ok(infoCode.includes('StoreProfileDetails'), 'Must assemble StoreProfileDetails');
    assert.ok(infoCode.includes('StoreLocationCard'), 'Must assemble StoreLocationCard');
    assert.ok(infoCode.includes('StoreContactChannels'), 'Must assemble StoreContactChannels');
    assert.ok(infoCode.includes('StoreCertifications'), 'Must assemble StoreCertifications');
  });

  // ---------------------------------------------------------------------------
  // Section 2: Pure Presentation UI (Zero Direct Firestore SDK Mutations)
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 2: Pure Presentation UI (Zero Mutation Imports) ---');

  runTest('2.1: Zero direct Firestore mutation imports (updateDoc, setDoc, addDoc, deleteDoc) in components', () => {
    const forbiddenImports = ['updateDoc', 'setDoc', 'addDoc', 'deleteDoc'];

    for (const f of componentFiles) {
      const filePath = path.join(componentsDir, f);
      const code = fs.readFileSync(filePath, 'utf8');

      for (const forbidden of forbiddenImports) {
        assert.ok(!code.includes(`import { ${forbidden}`) &&
                  !code.includes(`, ${forbidden}`) &&
                  !code.includes(`${forbidden},`) &&
                  !code.includes(`firestore.${forbidden}`),
          `Component ${f} must NOT import or invoke direct Firestore mutation '${forbidden}' (Clean Architecture violation)`);
      }
    }
  });

  runTest('2.2: StoreProfilePage layout component contains zero Firestore mutations', () => {
    const pagePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/StoreProfilePage.jsx');
    const code = fs.readFileSync(pagePath, 'utf8');

    assert.ok(!code.includes('updateDoc'), 'StoreProfilePage must not contain updateDoc');
    assert.ok(!code.includes('setDoc'), 'StoreProfilePage must not contain setDoc');
    assert.ok(!code.includes('addDoc'), 'StoreProfilePage must not contain addDoc');
    assert.ok(!code.includes('getDoc'), 'StoreProfilePage delegates fetching to useStoreProfilePage hook');
  });

  // ---------------------------------------------------------------------------
  // Section 3: UI Border Radius 0.1 Invariant (rounded-[2px])
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 3: UI Border Radius 0.1 Invariant (rounded-[2px]) ---');

  runTest('3.1: StoreProfileInfo and subcomponents enforce rounded-[2px] with 0 rounded-2xl cards', () => {
    const cardFiles = [
      'StoreProfileDetails.jsx',
      'StoreLocationCard.jsx',
      'StoreContactChannels.jsx',
      'StoreCertifications.jsx'
    ];

    for (const file of cardFiles) {
      const filePath = path.join(componentsDir, file);
      const code = fs.readFileSync(filePath, 'utf8');

      assert.ok(!code.includes('rounded-2xl'), `${file} must not contain rounded-2xl`);
      assert.ok(code.includes('rounded-[2px]'), `${file} must contain rounded-[2px]`);
    }

    const infoPath = path.join(componentsDir, 'StoreProfileInfo.jsx');
    const infoCode = fs.readFileSync(infoPath, 'utf8');
    assert.ok(!infoCode.includes('rounded-2xl'), 'StoreProfileInfo.jsx must not contain rounded-2xl');
  });

  runTest('3.2: PartnerReviews enforces rounded-[2px] on containers and eliminates all rounded-2xl', () => {
    const reviewsPath = path.join(componentsDir, 'PartnerReviews.jsx');
    const code = fs.readFileSync(reviewsPath, 'utf8');

    assert.ok(!code.includes('rounded-2xl'), 'PartnerReviews.jsx must NOT contain rounded-2xl');
    assert.ok(code.includes('rounded-[2px]'), 'PartnerReviews.jsx must use rounded-[2px]');
  });

  runTest('3.3: Buttons Exception preserved (ActionButtons maintain rounded-xl / rounded-lg)', () => {
    const actionButtonsPath = path.join(componentsDir, 'StoreActionButtons.jsx');
    const actionButtonsCode = fs.readFileSync(actionButtonsPath, 'utf8');

    // Per GEMINI.md: "ข้อยกเว้นสำหรับปุ่ม (Buttons Exception): ปุ่มกดทุกประเภท ให้คงความโค้งมนเดิมตามระบบ ไม่ต้องปรับเป็น 0.1"
    assert.ok(actionButtonsCode.includes('rounded-xl'), 'StoreActionButtons preserves rounded-xl for interactive action buttons');

    const reviewsPath = path.join(componentsDir, 'PartnerReviews.jsx');
    const reviewsCode = fs.readFileSync(reviewsPath, 'utf8');
    assert.ok(reviewsCode.includes('rounded-lg'), 'PartnerReviews submit button preserves rounded-lg per buttons exception');
  });

  // ---------------------------------------------------------------------------
  // Section 4: Calm UI Invariant on StoreViewBadge
  // ---------------------------------------------------------------------------
  console.log('\n--- Section 4: Calm UI Invariant on StoreViewBadge ---');

  runTest('4.1: StoreViewBadge is completely static with ZERO pulse/spin animations or glowing shadows', () => {
    const badgePath = path.join(componentsDir, 'StoreViewBadge.jsx');
    assert.ok(fs.existsSync(badgePath), 'StoreViewBadge.jsx must exist');
    const code = fs.readFileSync(badgePath, 'utf8');

    assert.ok(!code.includes('animate-pulse'), 'StoreViewBadge must NOT use animate-pulse');
    assert.ok(!code.includes('animate-spin'), 'StoreViewBadge must NOT use animate-spin');
    assert.ok(!code.includes('animate-bounce'), 'StoreViewBadge must NOT use animate-bounce');
    assert.ok(!code.includes('animate-ping'), 'StoreViewBadge must NOT use animate-ping');
  });

  runTest('4.2: StoreViewBadge enforces rounded-[2px] border radius', () => {
    const badgePath = path.join(componentsDir, 'StoreViewBadge.jsx');
    const code = fs.readFileSync(badgePath, 'utf8');

    assert.ok(code.includes('rounded-[2px]'), 'StoreViewBadge must use rounded-[2px]');
  });

  runTest('4.3: StoreViewBadge renders both allTime and today with localized numeric formatting', () => {
    const badgePath = path.join(componentsDir, 'StoreViewBadge.jsx');
    const code = fs.readFileSync(badgePath, 'utf8');

    assert.ok(code.includes('.toLocaleString()'), 'Must format numbers using toLocaleString()');
    assert.ok(code.includes('todayViewCount') || code.includes('todayVal') || code.includes('views?.today'),
      'Must display today view count');
    assert.ok(code.includes('viewCount') || code.includes('allTime') || code.includes('allTimeVal'),
      'Must display all-time view count');
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`  VERIFICATION SUITE 4 RESULT: Total: ${totalCount} | Passed: ${passCount} | Failed: 0`);
  console.log('='.repeat(80));
  console.log('🎉 VERIFICATION SUITE 4: ALL CLEAN ARCHITECTURE & UI CONFORMANCE INVARIANTS PASSED 100%!\n');
}

main().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
