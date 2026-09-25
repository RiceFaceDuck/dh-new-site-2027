import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('  🧪 VERIFY: Navbar & AuthProvider Integration Check');
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

// Test 1: Verify App.jsx wraps with AuthProvider
test('App.jsx mounts AuthProvider at root level', () => {
  const appPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/App.jsx');
  const code = fs.readFileSync(appPath, 'utf8');

  assert.ok(code.includes("import { AuthProvider } from './context/AuthContext';"), 'Must import AuthProvider');
  assert.ok(code.includes('<AuthProvider>'), 'Must render opening AuthProvider tag');
  assert.ok(code.includes('</AuthProvider>'), 'Must render closing AuthProvider tag');
  
  // AuthProvider should enclose ToastProvider and CartProvider
  const authOpenIndex = code.indexOf('<AuthProvider>');
  const toastOpenIndex = code.indexOf('<ToastProvider>');
  const authCloseIndex = code.lastIndexOf('</AuthProvider>');
  const toastCloseIndex = code.lastIndexOf('</ToastProvider>');

  assert.ok(authOpenIndex < toastOpenIndex, 'AuthProvider must wrap ToastProvider');
  assert.ok(authCloseIndex > toastCloseIndex, 'AuthProvider must close outside ToastProvider');
});

// Test 2: Verify AuthContext safely merges currentUser
test('AuthContext.jsx constructs robust currentUser with profile and auth data', () => {
  const authContextPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/context/AuthContext.jsx');
  const code = fs.readFileSync(authContextPath, 'utf8');

  assert.ok(code.includes('mergedUser'), 'Must create mergedUser');
  assert.ok(code.includes('displayName: profile?.displayName || profile?.name || profile?.accountName'), 'Must fallback displayName to profile name');
  assert.ok(code.includes('currentUser: mergedUser'), 'Must expose mergedUser as currentUser');
});

// Test 3: Verify Navbar consumption contract
test('Navbar and useNavbarAuth contract are aligned', () => {
  const navAuthPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/hooks/useNavbarAuth.js');
  const navbarPath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/components/Navbar.jsx');

  const navAuthCode = fs.readFileSync(navAuthPath, 'utf8');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');

  assert.ok(navAuthCode.includes("const { currentUser, logout } = useAuth();"), 'useNavbarAuth must consume useAuth()');
  assert.ok(navbarCode.includes("const {"), 'Navbar must destructure useNavbarAuth');
  assert.ok(navbarCode.includes("currentUser,"), 'Navbar must access currentUser');
  assert.ok(navbarCode.includes("{!currentUser ? ("), 'Navbar must switch on currentUser existence');
});

console.log('\n================================================================');
console.log(`  Summary: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
