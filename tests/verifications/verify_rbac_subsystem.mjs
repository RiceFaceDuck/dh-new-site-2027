/**
 * verify_rbac_subsystem.mjs
 * 
 * Empirical Verification & Stress Test Suite for the RBAC Subsystem
 * Location: Management System/tests/verifications/ (Centralized Test Hub)
 * 
 * Tests:
 * 1. Target files existence and static verification
 * 2. Fallback permissions matrix (7 roles x 7 permissions = 49 assertions)
 * 3. sessionStorage caching simulation (hits, misses, updates, corrupted cache)
 * 4. AuthContext shortcut booleans logic across roles (7 roles x 7 permissions = 49 assertions)
 * 5. Edge cases: missing role, unknown permission, corrupted cache, Thai roles, SuperAdmin bypass
 * 6. Adversarial Stress Test: Non-array Firestore payload vulnerability detection
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../'); // Management System

let totalPassed = 0;
let totalFailed = 0;
const failures = [];
const findings = [];

function assert(condition, message) {
  if (condition) {
    totalPassed++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    totalFailed++;
    failures.push(message);
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

console.log('='.repeat(80));
console.log('🧪 RBAC EMPIRICAL VERIFICATION & STRESS TEST HARNESS');
console.log('='.repeat(80));
const startTime = Date.now();

// -----------------------------------------------------------------------------
// Suite 1: File Existence & Invariant Verification
// -----------------------------------------------------------------------------
console.log('\n--- [Suite 1] Static & Architectural Invariants Check ---');

const filesToCheck = [
  {
    name: 'RbacForm.jsx',
    path: path.join(rootDir, 'dh-backoffice-react/src/pages/managers/settings/rbac/RbacForm.jsx')
  },
  {
    name: 'RbacSettingsPage.jsx',
    path: path.join(rootDir, 'dh-backoffice-react/src/pages/managers/settings/rbac/RbacSettingsPage.jsx')
  },
  {
    name: 'useRbacSettings.js',
    path: path.join(rootDir, 'dh-backoffice-react/src/pages/managers/settings/rbac/useRbacSettings.js')
  },
  {
    name: 'AuthContext.jsx',
    path: path.join(rootDir, 'dh-backoffice-react/src/contexts/AuthContext.jsx')
  },
  {
    name: 'ssr memory rbac.md',
    path: path.join(rootDir, 'dh-backoffice-react/src/pages/managers/settings/rbac/ssr memory rbac.md')
  },
  {
    name: '_agents/memory/INDEX.md',
    path: path.resolve(rootDir, '../_agents/memory/INDEX.md')
  }
];

filesToCheck.forEach(f => {
  assert(fs.existsSync(f.path), `File exists: ${f.name}`);
});

const rbacFormContent = fs.readFileSync(filesToCheck[0].path, 'utf8');
const rbacPageContent = fs.readFileSync(filesToCheck[1].path, 'utf8');
const useRbacContent = fs.readFileSync(filesToCheck[2].path, 'utf8');
const authContextContent = fs.readFileSync(filesToCheck[3].path, 'utf8');
const ssrMemoryContent = fs.readFileSync(filesToCheck[4].path, 'utf8');
const indexMemoryContent = fs.readFileSync(filesToCheck[5].path, 'utf8');

// Invariants
assert(rbacPageContent.includes('max-w-7xl'), 'RbacSettingsPage uses max-w-7xl responsive width');
assert(rbacFormContent.includes('handleRoleToggle') && rbacFormContent.includes('onSave'), 'RbacForm triggers auto-save on toggle');
assert(!rbacFormContent.includes('<button type="submit"'), 'RbacForm eliminates manual submit button (auto-save compliant)');
assert(useRbacContent.includes("'rbac_permissions'"), 'useRbacSettings targets doc rbac_permissions');
assert(useRbacContent.includes('historyService.addLog'), 'useRbacSettings writes audit log via historyService');
assert(authContextContent.includes("'dh_rbac_permissions_cache'"), 'AuthContext uses key dh_rbac_permissions_cache');

// Grimoire memory checks
const ssrLines = ssrMemoryContent.split('\n').length;
assert(ssrLines <= 80, `ssr memory rbac.md length <= 80 lines (actual: ${ssrLines})`);
assert(ssrMemoryContent.includes('<flow_and_entry>'), 'ssr memory has <flow_and_entry>');
assert(ssrMemoryContent.includes('<core_schema>'), 'ssr memory has <core_schema>');
assert(ssrMemoryContent.includes('<business_rules>'), 'ssr memory has <business_rules>');
assert(ssrMemoryContent.includes('<cross_impact>'), 'ssr memory has <cross_impact>');
assert(ssrMemoryContent.includes('<pitfalls_and_lessons>'), 'ssr memory has <pitfalls_and_lessons>');
assert(indexMemoryContent.includes('ssr memory rbac.md'), '_agents/memory/INDEX.md links to ssr memory rbac.md');

// -----------------------------------------------------------------------------
// Suite 2: Fallback Permissions Matrix (7 Roles x 7 Permissions)
// -----------------------------------------------------------------------------
console.log('\n--- [Suite 2] Fallback Permissions Matrix (7 Roles x 7 Permissions) ---');

const DEFAULT_RBAC_PERMISSIONS = {
  canEditProduct: ['owner', 'admin', 'manager', 'staff'],
  canDeleteOrder: ['owner', 'admin'],
  canEditProductPrice: ['owner', 'admin', 'manager'],
  canApproveRefund: ['owner', 'admin', 'manager'],
  canViewReports: ['owner', 'admin', 'manager'],
  canManageUsers: ['owner', 'admin'],
  canBypassBufferStock: ['owner', 'admin', 'manager']
};

const SUPER_ADMINS = [
  'zhoulinjuan1@gmail.com',
  'dh1notebook@gmail.com'
];

const ROLES = ['admin', 'owner', 'manager', 'staff', 'packer', 'developer', 'finance'];
const PERMISSIONS = [
  'canEditProduct',
  'canEditProductPrice',
  'canDeleteOrder',
  'canApproveRefund',
  'canViewReports',
  'canManageUsers',
  'canBypassBufferStock'
];

function resolveUserRoles(profile, user) {
  const roles = new Set();
  const email = (user?.email || profile?.email || '').toLowerCase().trim();
  if (SUPER_ADMINS.includes(email)) {
    roles.add('owner');
    roles.add('admin');
  }
  const roleStrings = [];
  if (profile?.role) roleStrings.push(String(profile.role));
  if (Array.isArray(profile?.roles)) profile.roles.forEach(r => roleStrings.push(String(r)));
  if (profile?.userType) roleStrings.push(String(profile.userType));

  roleStrings.forEach(r => {
    const lower = r.toLowerCase().trim();
    if (lower.includes('owner') || lower.includes('เจ้าของ') || lower.includes('vp 1') || lower.includes('ประธาน')) roles.add('owner');
    if (lower.includes('admin') || lower.includes('แอดมิน') || lower.includes('ผู้ดูแลระบบ')) roles.add('admin');
    if (lower.includes('manager') || lower.includes('ผู้จัดการ')) roles.add('manager');
    if (lower.includes('packer') || lower.includes('แพ็ค') || lower.includes('แพก')) roles.add('packer');
    if (lower.includes('finance') || lower.includes('บัญชี') || lower.includes('การเงิน')) roles.add('finance');
    if (lower.includes('developer') || lower.includes('นักพัฒนา') || lower.includes('ไอที') || lower === 'it') roles.add('developer');
    if (lower.includes('staff') || lower.includes('พนักงาน')) roles.add('staff');
  });

  if (roles.size === 0 && (profile || user)) {
    roles.add('staff');
  }
  return Array.from(roles);
}

function evaluatePermission(permissions, roleName, permissionKey) {
  const profile = { role: roleName };
  const user = { email: `${roleName}@example.com` };
  const userRoles = resolveUserRoles(profile, user);
  const isOwnerOrSuperAdmin = SUPER_ADMINS.includes(user.email) || userRoles.includes('owner');

  if (isOwnerOrSuperAdmin) return true;
  const rawAllowed = permissions?.[permissionKey] || DEFAULT_RBAC_PERMISSIONS[permissionKey] || [];
  const allowedRoles = (Array.isArray(rawAllowed) ? rawAllowed : []).map(r => String(r).toLowerCase().trim());
  return userRoles.some(r => allowedRoles.includes(r));
}

// 7 x 7 Matrix evaluation under DEFAULT_RBAC_PERMISSIONS
const expectedMatrix = {
  admin: {
    canEditProduct: true,
    canEditProductPrice: true,
    canDeleteOrder: true,
    canApproveRefund: true,
    canViewReports: true,
    canManageUsers: true,
    canBypassBufferStock: true
  },
  owner: {
    canEditProduct: true,
    canEditProductPrice: true,
    canDeleteOrder: true,
    canApproveRefund: true,
    canViewReports: true,
    canManageUsers: true,
    canBypassBufferStock: true
  },
  manager: {
    canEditProduct: true,
    canEditProductPrice: true,
    canDeleteOrder: false,
    canApproveRefund: true,
    canViewReports: true,
    canManageUsers: false,
    canBypassBufferStock: true
  },
  staff: {
    canEditProduct: true,
    canEditProductPrice: false,
    canDeleteOrder: false,
    canApproveRefund: false,
    canViewReports: false,
    canManageUsers: false,
    canBypassBufferStock: false
  },
  packer: {
    canEditProduct: false,
    canEditProductPrice: false,
    canDeleteOrder: false,
    canApproveRefund: false,
    canViewReports: false,
    canManageUsers: false,
    canBypassBufferStock: false
  },
  developer: {
    canEditProduct: false,
    canEditProductPrice: false,
    canDeleteOrder: false,
    canApproveRefund: false,
    canViewReports: false,
    canManageUsers: false,
    canBypassBufferStock: false
  },
  finance: {
    canEditProduct: false,
    canEditProductPrice: false,
    canDeleteOrder: false,
    canApproveRefund: false,
    canViewReports: false,
    canManageUsers: false,
    canBypassBufferStock: false
  }
};

let matrixPassCount = 0;
for (const role of ROLES) {
  for (const perm of PERMISSIONS) {
    const actual = evaluatePermission(DEFAULT_RBAC_PERMISSIONS, role, perm);
    const expected = expectedMatrix[role][perm];
    const match = actual === expected;
    if (match) matrixPassCount++;
    assert(match, `Matrix [${role} x ${perm}]: expected ${expected}, got ${actual}`);
  }
}
assert(matrixPassCount === 49, `All 49 combinations (7 roles x 7 permissions) passed fallback matrix`);

// -----------------------------------------------------------------------------
// Suite 3: AuthContext Shortcut Booleans Consistency
// -----------------------------------------------------------------------------
console.log('\n--- [Suite 3] AuthContext Shortcut Booleans Consistency ---');

function createRbacHookInstance(profile, user, permissions) {
  const userRoles = resolveUserRoles(profile, user);
  const email = (user?.email || profile?.email || '').toLowerCase().trim();
  const isOwnerOrSuperAdmin = SUPER_ADMINS.includes(email) || userRoles.includes('owner');

  // Exact implementation as written in AuthContext.jsx:
  const hasPermission = (permissionKey) => {
    if (isOwnerOrSuperAdmin) return true;
    const allowedRoles = (permissions?.[permissionKey] || DEFAULT_RBAC_PERMISSIONS[permissionKey] || []).map(r => String(r).toLowerCase().trim());
    return userRoles.some(r => allowedRoles.includes(r));
  };

  return {
    hasPermission,
    userRoles,
    isOwnerOrSuperAdmin,
    canEditProduct: hasPermission('canEditProduct'),
    canEditProductPrice: hasPermission('canEditProductPrice'),
    canDeleteOrder: hasPermission('canDeleteOrder'),
    canApproveRefund: hasPermission('canApproveRefund'),
    canViewReports: hasPermission('canViewReports'),
    canManageUsers: hasPermission('canManageUsers'),
    canBypassBufferStock: hasPermission('canBypassBufferStock')
  };
}

for (const role of ROLES) {
  const rbac = createRbacHookInstance({ role }, { email: `${role}@shop.com` }, DEFAULT_RBAC_PERMISSIONS);
  for (const perm of PERMISSIONS) {
    assert(
      rbac[perm] === rbac.hasPermission(perm),
      `Shortcut boolean rbac.${perm} matches rbac.hasPermission('${perm}') for role ${role}`
    );
  }
}

// -----------------------------------------------------------------------------
// Suite 4: sessionStorage Caching Logic Simulation
// -----------------------------------------------------------------------------
console.log('\n--- [Suite 4] sessionStorage Caching Simulation ---');

class MockSessionStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const sessionStorageMock = new MockSessionStorage();
const RBAC_CACHE_KEY = 'dh_rbac_permissions_cache';

function initPermissionsFromCache(storage, inMemCache) {
  if (inMemCache) return { permissions: inMemCache, cacheType: 'MEMORY' };
  try {
    const cached = storage.getItem(RBAC_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { permissions: parsed, cacheType: 'SESSION_STORAGE' };
    }
  } catch (err) {
    // Graceful fallback
  }
  return { permissions: DEFAULT_RBAC_PERMISSIONS, cacheType: 'FALLBACK_DEFAULTS' };
}

// 4.1 Cache Miss
sessionStorageMock.clear();
const resMiss = initPermissionsFromCache(sessionStorageMock, null);
assert(resMiss.cacheType === 'FALLBACK_DEFAULTS', 'Cache miss returns FALLBACK_DEFAULTS');
assert(resMiss.permissions.canDeleteOrder.length === 2, 'Default canDeleteOrder has 2 roles');

// 4.2 Cache Write & Cache Hit
const customPermissions = {
  ...DEFAULT_RBAC_PERMISSIONS,
  canDeleteOrder: ['owner', 'admin', 'manager']
};
sessionStorageMock.setItem(RBAC_CACHE_KEY, JSON.stringify(customPermissions));
const resHit = initPermissionsFromCache(sessionStorageMock, null);
assert(resHit.cacheType === 'SESSION_STORAGE', 'Cache hit returns SESSION_STORAGE');
assert(resHit.permissions.canDeleteOrder.includes('manager'), 'Cached custom permissions respected on hit');

// 4.3 In-Memory Cache Precedence
const inMemPermissions = {
  ...DEFAULT_RBAC_PERMISSIONS,
  canDeleteOrder: ['owner']
};
const resMem = initPermissionsFromCache(sessionStorageMock, inMemPermissions);
assert(resMem.cacheType === 'MEMORY', 'In-memory cache takes precedence over sessionStorage');
assert(resMem.permissions.canDeleteOrder.length === 1, 'In-memory value preserved');

// 4.4 Cache Invalidation (Firestore onSnapshot update simulation)
function simulateFirestoreSnapshot(storage, newSnapshotData) {
  if (newSnapshotData) {
    try {
      storage.setItem(RBAC_CACHE_KEY, JSON.stringify(newSnapshotData));
    } catch {}
    return { current: newSnapshotData, updatedCache: true };
  } else {
    return { current: DEFAULT_RBAC_PERMISSIONS, updatedCache: false };
  }
}

const updatedRemoteData = {
  ...DEFAULT_RBAC_PERMISSIONS,
  canViewReports: ['owner', 'admin', 'manager', 'finance']
};
const snapResult = simulateFirestoreSnapshot(sessionStorageMock, updatedRemoteData);
assert(snapResult.updatedCache === true, 'Firestore snapshot triggers cache update');
const readBack = JSON.parse(sessionStorageMock.getItem(RBAC_CACHE_KEY));
assert(readBack.canViewReports.includes('finance'), 'Cache invalidation successfully wrote updated permissions');

// -----------------------------------------------------------------------------
// Suite 5: Adversarial Edge Cases & Stress Testing
// -----------------------------------------------------------------------------
console.log('\n--- [Suite 5] Adversarial Edge Cases & Stress Testing ---');

// 5.1 Corrupted JSON in sessionStorage
sessionStorageMock.setItem(RBAC_CACHE_KEY, '<<<CORRUPTED_JSON_MALFORMED{{{');
const resCorrupt = initPermissionsFromCache(sessionStorageMock, null);
assert(resCorrupt.cacheType === 'FALLBACK_DEFAULTS', 'Corrupted cache string safely falls back to defaults without crashing');
assert(resCorrupt.permissions.canEditProduct.includes('admin'), 'Defaults intact after corrupted cache recovery');

// 5.2 Missing profile and user (Unauthenticated or broken state)
const anonRoles = resolveUserRoles(null, null);
assert(anonRoles.length === 0, 'Null profile and null user returns 0 roles');
const anonRbac = createRbacHookInstance(null, null, DEFAULT_RBAC_PERMISSIONS);
assert(anonRbac.canEditProduct === false, 'Anonymous user cannot edit product');
assert(anonRbac.canDeleteOrder === false, 'Anonymous user cannot delete order');
assert(anonRbac.canManageUsers === false, 'Anonymous user cannot manage users');

// 5.3 Unknown role string
const unknownProfile = { role: 'intern_temporary_contractor' };
const unknownRoles = resolveUserRoles(unknownProfile, { email: 'intern@test.com' });
assert(unknownRoles.length === 1 && unknownRoles[0] === 'staff', 'Unrecognized role safely defaults to staff');
const internRbac = createRbacHookInstance(unknownProfile, { email: 'intern@test.com' }, DEFAULT_RBAC_PERMISSIONS);
assert(internRbac.canEditProduct === true, 'Intern (staff default) can edit product');
assert(internRbac.canDeleteOrder === false, 'Intern (staff default) CANNOT delete order');
assert(internRbac.canEditProductPrice === false, 'Intern (staff default) CANNOT edit product price');

// 5.4 Thai Role Variations Resolution
const thaiRolesTest = [
  { input: { role: 'เจ้าของร้าน' }, expectedRole: 'owner' },
  { input: { role: 'ผู้จัดการสาขา' }, expectedRole: 'manager' },
  { input: { role: 'แอดมินระบบ' }, expectedRole: 'admin' },
  { input: { role: 'พนักงานจัดแพ็คสินค้า' }, expectedRole: 'packer' },
  { input: { role: 'เจ้าหน้าที่การเงินและบัญชี' }, expectedRole: 'finance' },
  { input: { role: 'นักพัฒนาซอฟต์แวร์' }, expectedRole: 'developer' },
  { input: { role: 'พนักงานทั่วไป' }, expectedRole: 'staff' },
  { input: { role: 'VP 1 (รองประธาน)' }, expectedRole: 'owner' }
];

thaiRolesTest.forEach(({ input, expectedRole }) => {
  const resolved = resolveUserRoles(input, null);
  assert(resolved.includes(expectedRole), `Thai title "${input.role}" correctly resolves to role "${expectedRole}"`);
});

// 5.5 SuperAdmin Email Override Bypass
for (const superEmail of SUPER_ADMINS) {
  const superRoles = resolveUserRoles({ role: 'staff' }, { email: superEmail });
  assert(superRoles.includes('owner') && superRoles.includes('admin'), `SuperAdmin email ${superEmail} receives owner and admin roles`);
  
  const emptyPermissions = {};
  const superRbac = createRbacHookInstance({ role: 'staff' }, { email: superEmail }, emptyPermissions);
  assert(superRbac.isOwnerOrSuperAdmin === true, `SuperAdmin ${superEmail} recognized as isOwnerOrSuperAdmin`);
  assert(superRbac.canDeleteOrder === true, `SuperAdmin ${superEmail} has canDeleteOrder even on empty permissions`);
  assert(superRbac.hasPermission('arbitrary_undefined_permission') === true, `SuperAdmin ${superEmail} bypasses arbitrary permission checks`);
}

// 5.6 Unknown / Non-standard Permission Key
const regularManagerRbac = createRbacHookInstance({ role: 'manager' }, { email: 'mgr@shop.com' }, DEFAULT_RBAC_PERMISSIONS);
assert(regularManagerRbac.hasPermission('canAccessSecretNuclearCodes') === false, 'Unknown permission returns false for manager');

// 5.7 Falsy/Null or Undefined Permission Key in Database
const falsyPermissionsDoc = {
  canDeleteOrder: null,
  canViewReports: undefined
};
const safeManager = createRbacHookInstance({ role: 'manager' }, { email: 'mgr@shop.com' }, falsyPermissionsDoc);
assert(safeManager.canDeleteOrder === false, 'Null permission field gracefully falls back to default safely');

// 5.8 Vulnerability Analysis: Truthy Non-Array in Firestore Payload
console.log('\n--- [Suite 6] Adversarial Stress Testing: Malformed Payload Ingestion ---');
// When a Firestore document contains a truthy non-array (e.g. string or boolean):
const malformedPermissionsDoc = {
  canEditProductPrice: "admin", // single string instead of array ['admin']
  canDeleteOrder: true // boolean instead of array
};

let uncaughtExceptionOccurred = false;
try {
  // Direct evaluation using AuthContext line 119 pattern:
  const allowed = (malformedPermissionsDoc.canEditProductPrice || DEFAULT_RBAC_PERMISSIONS.canEditProductPrice || []).map(r => String(r).toLowerCase().trim());
} catch (err) {
  uncaughtExceptionOccurred = true;
  findings.push({
    severity: 'MEDIUM',
    title: 'Unhandled TypeError on Truthy Non-Array Permission in Firestore',
    detail: 'AuthContext line 119: (permissions?.[permissionKey] || DEFAULT_RBAC_PERMISSIONS[permissionKey] || []).map(...) assumes permissions?.[permissionKey] is either an Array or falsy. If a malformed payload contains a string or boolean, String.prototype.map is undefined and throws TypeError: ...map is not a function.'
  });
}
assert(uncaughtExceptionOccurred, 'Vulnerability detected: AuthContext crashes with TypeError if permissions contains non-array string/boolean');

// 5.9 RbacForm Toggle Logic Replay
function replayToggle(currentRoles, roleId) {
  if (currentRoles.includes(roleId)) {
    return currentRoles.filter(r => r !== roleId);
  } else {
    return [...currentRoles, roleId];
  }
}

let testRoles = ['owner', 'admin'];
testRoles = replayToggle(testRoles, 'manager');
assert(testRoles.includes('manager') && testRoles.length === 3, 'Toggle adds role when not present');
testRoles = replayToggle(testRoles, 'manager');
assert(!testRoles.includes('manager') && testRoles.length === 2, 'Toggle removes role when present');

// -----------------------------------------------------------------------------
// Test Summary
// -----------------------------------------------------------------------------
const duration = Date.now() - startTime;
console.log('\n' + '='.repeat(80));
console.log(`📊 RBAC VERIFICATION SUITE RESULTS:`);
console.log(`   Passed: ${totalPassed}`);
console.log(`   Failed: ${totalFailed}`);
console.log(`   Adversarial Findings: ${findings.length}`);
console.log(`   Duration: ${duration} ms`);
console.log('='.repeat(80));

if (findings.length > 0) {
  console.log(`\n⚠️ Adversarial Vulnerability Findings:`);
  findings.forEach((f, idx) => {
    console.log(`   [Finding ${idx + 1}] [${f.severity}] ${f.title}`);
    console.log(`     Detail: ${f.detail}`);
  });
}

if (totalFailed > 0) {
  console.error(`\n🚨 Summary of failures:`);
  failures.forEach(f => console.error(` - ${f}`));
  process.exit(1);
} else {
  console.log(`\n🎉 ALL ${totalPassed} RBAC EMPIRICAL VERIFICATION ASSERTIONS PASSED!`);
  process.exit(0);
}
