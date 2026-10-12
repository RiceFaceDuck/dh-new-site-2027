/**
 * ==============================================================================
 * ⚔️ ADVERSARIAL CHALLENGER SUITE: MILESTONE M2 RETRO NAVIGATION PARITY
 * ==============================================================================
 *
 * Reviewer 2 Adversarial Stress Test:
 * - Subcomponent extraction purity (NavAvatar, CartBadge)
 * - AST token compliance (no rounded-full/rounded-2xl on rectangular boxes)
 * - Circular exception preservation
 * - Mobile clearances & touch targets
 * - Dropdown elevation tokens (border-slate-200, shadow-xl)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.resolve(REPO_ROOT, 'Management System/dh-frontend');

let passCount = 0;
let failCount = 0;

function assert(id, desc, condition, details) {
  if (condition) {
    console.log(`  ✅ [PASS] [${id}] ${desc}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] [${id}] ${desc}`);
    if (details) console.error(`     ↳ Details: ${details}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('⚔️ CHALLENGER M2: NAVIGATION & LAYOUT ADVERSARIAL STRESS TEST');
console.log('================================================================\n');

// 1. Read files
const navbarPath = path.resolve(FRONTEND_ROOT, 'src/components/Navbar.jsx');
const mainLayoutPath = path.resolve(FRONTEND_ROOT, 'src/layouts/MainLayout.jsx');
const bottomNavPath = path.resolve(FRONTEND_ROOT, 'src/components/navigation/BottomNav.jsx');
const messengerPath = path.resolve(FRONTEND_ROOT, 'src/components/chat/FloatingMessenger.jsx');

const navbarCode = fs.readFileSync(navbarPath, 'utf8');
const mainLayoutCode = fs.readFileSync(mainLayoutPath, 'utf8');
const bottomNavCode = fs.readFileSync(bottomNavPath, 'utf8');
const messengerCode = fs.readFileSync(messengerPath, 'utf8');

// Challenge 1: Subcomponent Extraction Purity
const navAvatarSrc = navbarCode.slice(navbarCode.indexOf('const NavAvatar ='), navbarCode.indexOf('const CartBadge ='));
assert(
  'CH-M2-01',
  'NavAvatar is defined as an isolated presentation component without direct hook/state calls',
  navbarCode.includes('const NavAvatar = ({ photoURL, navAvatarError, setNavAvatarError, email, getInitial }) =>') &&
  !/useCart|useAuth|useNavigate|useState|useEffect/.test(navAvatarSrc),
  'NavAvatar illegally accesses external hooks or stores directly instead of pure props flow'
);

assert(
  'CH-M2-02',
  'CartBadge is defined as a pure functional component taking only count prop',
  navbarCode.includes('const CartBadge = ({ count }) =>') &&
  navbarCode.includes('if (!count || count <= 0) return null;') &&
  navbarCode.includes("count > 99 ? '99+' : count"),
  'CartBadge is missing defensive null/zero guard or 99+ ceiling'
);

// Challenge 2: Navbar Search Bar & Action Buttons Curvature
assert(
  'CH-M2-03',
  'Navbar search input uses rounded-md and border-slate-300 (no rounded-full or rounded-2xl)',
  navbarCode.includes('rounded-md focus:outline-hidden') &&
  navbarCode.includes('border-slate-300') &&
  !/<input[^>]*rounded-full/.test(navbarCode),
  'Search input retains rounded-full pill or lacks slate-300 border'
);

assert(
  'CH-M2-04',
  'Navbar search button uses rounded-md and hover:bg-brand-dark',
  navbarCode.includes('aria-label="ค้นหาสินค้า" className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand text-white p-1.5 rounded-md hover:bg-brand-dark transition-colors shadow-xs"'),
  'Search submit button is not calibrated to rounded-md'
);

// Challenge 3: Profile Dropdown Elevation & Contrast
assert(
  'CH-M2-05',
  'Dropdown container uses rounded-md shadow-xl border border-slate-200',
  navbarCode.includes('absolute right-0 mt-3 w-64 bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden'),
  'Dropdown menu container does not use retro rounded-md border-slate-200 shadow-xl'
);

assert(
  'CH-M2-06',
  'Dropdown dividers elevated from border-slate-100 to border-slate-200',
  navbarCode.includes('border-b border-slate-200') &&
  navbarCode.includes('border-t border-slate-200') &&
  !navbarCode.includes('border-slate-100'),
  'Found legacy washed-out border-slate-100 inside Navbar.jsx'
);

assert(
  'CH-M2-07',
  'Dropdown menu links and logout button calibrated to rounded-md (no rounded-xl)',
  !navbarCode.includes('rounded-xl') &&
  navbarCode.includes('แดชบอร์ดส่วนตัว') &&
  navbarCode.includes('เครดิต & กระเป๋าเงิน'),
  'Found residual rounded-xl classes inside Navbar.jsx dropdown'
);

// Challenge 4: Circular Avatar & Indicator Exceptions Protection
assert(
  'CH-M2-08',
  'Circular avatar image and fallback initials strictly maintain rounded-full circular geometry',
  navbarCode.includes('w-8 h-8 rounded-full object-contain') &&
  navbarCode.includes('w-8 h-8 rounded-full bg-linear-to-br'),
  'Avatar geometry degraded from rounded-full'
);

assert(
  'CH-M2-09',
  'CartBadge strictly maintains rounded-full circular geometry',
  navbarCode.includes('rounded-full w-5 h-5 flex items-center justify-center'),
  'CartBadge lost rounded-full geometry'
);

// Challenge 5: MainLayout Anti-Whiteout & Mobile Clearance
assert(
  'CH-M2-10',
  'MainLayout footer wrapper divider elevated to border-t border-slate-200 (no border-gray-100)',
  mainLayoutCode.includes('hidden lg:block mt-auto border-t border-slate-200') &&
  !mainLayoutCode.includes('border-t border-gray-100'),
  'MainLayout still contains washed-out border-gray-100'
);

assert(
  'CH-M2-11',
  'MainLayout main container enforces pb-32 mobile clearance and overflow-hidden',
  mainLayoutCode.includes('pb-32 md:pb-12') &&
  mainLayoutCode.includes('overflow-hidden') &&
  mainLayoutCode.includes('max-w-7xl mx-auto'),
  'MainLayout missing pb-32 clearance or overflow-hidden guard'
);

// Challenge 6: BottomNav Parity
assert(
  'CH-M2-12',
  'BottomNav is strictly scoped to mobile (lg:hidden) and features pb-safe and border-slate-300',
  bottomNavCode.includes('lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-200 border-t border-slate-300') &&
  bottomNavCode.includes('pb-safe'),
  'BottomNav missing mobile scoping, pb-safe, or tactile border-slate-300'
);

// Challenge 7: FloatingMessenger Window Curvature & Clearances
assert(
  'CH-M2-13',
  'FloatingMessenger chat window uses rounded-md shadow-xl border border-slate-200 (no rounded-3xl)',
  messengerCode.includes('rounded-md shadow-xl border border-slate-200 overflow-hidden') &&
  !messengerCode.includes('rounded-3xl'),
  'FloatingMessenger still contains rounded-3xl bubble curvature'
);

assert(
  'CH-M2-14',
  'FloatingMessenger tooltip uses rounded-md shadow-xl border border-slate-700',
  messengerCode.includes('rounded-md shadow-xl border border-slate-700'),
  'FloatingMessenger tooltip is not calibrated to rounded-md border-slate-700'
);

assert(
  'CH-M2-15',
  'FloatingMessenger maintains mobile bottom clearance without occluding BottomNav',
  messengerCode.includes("isProductDetail ? 'bottom-[135px]' : 'bottom-[85px]'"),
  'FloatingMessenger lacks dynamic bottom clearance offset'
);

console.log('\n================================================================');
console.log(`📊 CHALLENGER SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
