/**
 * Verification Script: Storefront Category Navigation Parity & Route Architecture
 * Location: Management System/tests/verifications/verify_category_navigation_parity.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY: Category Navigation Parity & Route Architecture');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// -------------------------------------------------------------
// Test 1: BottomNav.jsx routes to /categories with LayoutGrid
// -------------------------------------------------------------
test('BottomNav.jsx points "หมวดหมู่" to /categories with LayoutGrid icon', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/navigation/BottomNav.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';"), 'Must import LayoutGrid');
  assert.ok(code.includes("{ path: '/categories', label: 'หมวดหมู่', icon: LayoutGrid }"), 'navItems must link to /categories with LayoutGrid');
  assert.ok(code.includes("location.pathname.startsWith('/categories')"), 'isActive must match /categories');
  assert.ok(!code.includes("{ path: '/category/all'"), 'Must NOT contain /category/all in navItems');
});

// -------------------------------------------------------------
// Test 2: App.jsx has redirect route for /category/all
// -------------------------------------------------------------
test('App.jsx redirects /category/all to /categories', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/App.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes('<Route path="/category/all" element={<Navigate to="/categories" replace />} />'), 'Must contain redirect route in App.jsx');
});

// -------------------------------------------------------------
// Test 3: CategoryPage.jsx has fallback redirect for type === "all"
// -------------------------------------------------------------
test('CategoryPage.jsx contains defense-in-depth Navigate guard for type === all', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/CategoryPage.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("type.trim().toLowerCase() === 'all'"), 'Must check for type === all');
  assert.ok(code.includes('<Navigate to="/categories" replace />'), 'Must redirect to /categories');
});

// -------------------------------------------------------------
// Test 4: productService.js has zero-quota guard for all
// -------------------------------------------------------------
test('productService.js protects Firestore quota when category is all', () => {
  const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/productService.js');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("lowerCaseType === 'all'"), 'Must have zero-quota guard for all');
  assert.ok(code.includes("return { docs: [], lastDoc: null };"), 'Must return empty without making Firestore queries');
});

// -------------------------------------------------------------
// Test 5: HeroButtonConfig & storefrontSettingsService link to /categories
// -------------------------------------------------------------
test('HeroButtonConfig and storefrontSettingsService default to /categories', () => {
  const configPath = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/pages/managers/components/theme/HeroConfigTab/HeroButtonConfig.jsx');
  const configCode = fs.readFileSync(configPath, 'utf8');
  assert.ok(configCode.includes("{ label: 'หมวดหมู่อะไหล่ทั้งหมด', path: '/categories' }"), 'Hero quick link must point to /categories');
  assert.ok(configCode.includes("secondaryButton = { label: 'SHOP SPARES', link: '/categories'"), 'Hero default secondary button must point to /categories');

  const servicePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/storefrontSettingsService.js');
  const serviceCode = fs.readFileSync(servicePath, 'utf8');
  assert.ok(serviceCode.includes("link: '/categories'"), 'Storefront service secondary button must point to /categories');
});

console.log(`\n================================================================`);
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log(`================================================================\n`);

if (failed > 0) process.exit(1);
