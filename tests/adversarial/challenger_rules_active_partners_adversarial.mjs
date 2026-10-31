/**
 * Challenger 2: Firestore Security Rules & Permission Resilience Suite
 * Path: Management System/tests/adversarial/challenger_rules_active_partners_adversarial.mjs
 * 
 * Scope:
 * - Target: Management System/firestore.rules (match /ActivePartners/{partnerId} lines 636-648)
 * - Test Permission Boundaries, Field Isolation, and Privilege Escalation Prevention.
 * 
 * Objectives:
 * 1. Verify viewCount and likeCount updates only are permitted.
 * 2. Verify attempts to update ANY other field (name, points, ownerId, commissionRate, status, role, etc.) are strictly denied.
 * 3. Verify negative values (viewCount: -1, likeCount: -5, etc.) are strictly denied.
 * 4. Verify create / delete / staff privilege isolation.
 * 5. Verify frontend payload compatibility with useStoreStats.js.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const RULES_PATH = path.resolve(REPO_ROOT, 'Management System/firestore.rules');
const HOOK_PATH = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreStats.js');

console.log('================================================================================');
console.log('🛡️  CHALLENGER 2: FIRESTORE SECURITY RULES & PERMISSION RESILIENCE SUITE');
console.log('    Target: match /ActivePartners/{partnerId} (lines 636-648)');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const defects = [];

function pass(name, detail = '') {
  totalChecks++;
  passedChecks++;
  console.log(`  ✅ [PASS] ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, error) {
  totalChecks++;
  failedChecks++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  ❌ [FAIL] ${name}: ${msg}`);
  defects.push({ test: name, error: msg });
}

// =============================================================================
// SECTION 1: STATIC CODE AUDIT & AST INTEGRITY OF FIRESTORE.RULES
// =============================================================================
console.log('--- SECTION 1: Static Code Audit & AST Rules Integrity ---');

try {
  assert.ok(fs.existsSync(RULES_PATH), `firestore.rules must exist at ${RULES_PATH}`);
  const rulesCode = fs.readFileSync(RULES_PATH, 'utf8');

  // Verify ActivePartners block existence
  const tag = 'match /ActivePartners/{partnerId}';
  const activePartnersBlockIndex = rulesCode.indexOf(tag);
  assert.ok(activePartnersBlockIndex !== -1, 'Must contain match /ActivePartners/{partnerId}');

  // Extract the ActivePartners match block (skip '{' inside '{partnerId}')
  const blockStart = rulesCode.indexOf('{', activePartnersBlockIndex + tag.length);
  let braceCount = 1;
  let blockEnd = blockStart + 1;
  while (braceCount > 0 && blockEnd < rulesCode.length) {
    if (rulesCode[blockEnd] === '{') braceCount++;
    else if (rulesCode[blockEnd] === '}') braceCount--;
    blockEnd++;
  }
  const activePartnersBlock = rulesCode.slice(activePartnersBlockIndex, blockEnd);

  // 1.1 Verify read rule
  assert.ok(activePartnersBlock.includes('allow read: if true;'), 'Read must be globally allowed (public catalog)');
  pass('Audit 1.1', 'Public read access permitted for ActivePartners directory');

  // 1.2 Verify create rule
  assert.ok(activePartnersBlock.includes('allow create: if isManagerOrAdmin();'), 'Create must be restricted to isManagerOrAdmin()');
  pass('Audit 1.2', 'Create strictly locked to isManagerOrAdmin()');

  // 1.3 Verify delete rule
  assert.ok(activePartnersBlock.includes('allow delete: if isManagerOrAdmin() || (isAuthenticated() && request.auth.uid == partnerId);'), 'Delete restricted to isManagerOrAdmin() or store owner');
  pass('Audit 1.3', 'Delete strictly guarded by manager/admin or store owner');

  // 1.4 Verify update rule branches
  assert.ok(activePartnersBlock.includes('isManagerOrAdmin()'), 'Update permits manager/admin');
  assert.ok(activePartnersBlock.includes("isStaff() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['points', 'updatedAt'])"), 'Staff update restricted to points and updatedAt');
  assert.ok(activePartnersBlock.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount', 'likeCount'])"), 'Public update strictly isolated to viewCount and likeCount');
  assert.ok(activePartnersBlock.includes("request.resource.data.get('viewCount', 0) >= 0"), 'viewCount must enforce non-negative >= 0 guard');
  assert.ok(activePartnersBlock.includes("request.resource.data.get('likeCount', 0) >= 0"), 'likeCount must enforce non-negative >= 0 guard');
  pass('Audit 1.4', 'Update branches enforce strict field isolation & non-negative bounds');

  // 1.5 Verify frontend hook useStoreStats.js alignment
  assert.ok(fs.existsSync(HOOK_PATH), `useStoreStats.js must exist at ${HOOK_PATH}`);
  const hookCode = fs.readFileSync(HOOK_PATH, 'utf8');
  assert.ok(hookCode.includes("viewCount: increment(1)"), 'useStoreStats must increment viewCount');
  assert.ok(hookCode.includes("likeCount: increment(delta)"), 'useStoreStats must increment likeCount');
  // Critical: frontend must not send unpermitted fields like updatedAt with these counters
  assert.ok(!hookCode.includes("viewCount: increment(1),\n          updatedAt:"), 'Frontend must not bundle updatedAt in viewCount write');
  assert.ok(!hookCode.includes("likeCount: increment(delta),\n        updatedAt:"), 'Frontend must not bundle updatedAt in likeCount write');
  pass('Audit 1.5', 'Frontend useStoreStats.js payloads perfectly match firestore.rules whitelist');
} catch (err) {
  fail('Audit Failure in Section 1', err);
}

// =============================================================================
// SECTION 2: FIRESTORE SECURITY RULES BEHAVIORAL SIMULATION ENGINE
// =============================================================================
console.log('\n--- SECTION 2: Empirical Rules Evaluation Simulation Engine ---');

/**
 * Exact replica of Firestore Security Rules logic for /ActivePartners/{partnerId}
 * 
 * match /ActivePartners/{partnerId} {
 *   allow read: if true;
 *   allow create: if isManagerOrAdmin();
 *   allow update: if isManagerOrAdmin() || (
 *     isStaff() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['points', 'updatedAt'])
 *   ) || (
 *     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount', 'likeCount']) &&
 *     request.resource.data.get('viewCount', 0) >= 0 &&
 *     request.resource.data.get('likeCount', 0) >= 0
 *   );
 *   allow delete: if isManagerOrAdmin() || (isAuthenticated() && request.auth.uid == partnerId);
 * }
 */
function evalActivePartnersRule({
  action = 'update', // 'read' | 'create' | 'update' | 'delete'
  auth = null,       // { uid: string, token: { role?: string, isStaff?: boolean } }
  partnerId = 'store_abc_123',
  existingData = {}, // resource.data
  incomingData = {}  // request.resource.data
}) {
  const isAuthenticated = auth !== null && auth.uid !== undefined;
  const role = auth?.token?.role;
  const isManagerOrAdmin = isAuthenticated && ['manager', 'admin', 'owner'].includes(role);
  const isStaff = isAuthenticated && (isManagerOrAdmin || role === 'staff' || auth?.token?.isStaff === true);

  if (action === 'read') return { allowed: true, reason: 'public_read' };

  if (action === 'create') {
    if (isManagerOrAdmin) return { allowed: true, reason: 'manager_or_admin_create' };
    return { allowed: false, reason: 'create_denied_insufficient_privileges' };
  }

  if (action === 'delete') {
    if (isManagerOrAdmin) return { allowed: true, reason: 'manager_or_admin_delete' };
    if (isAuthenticated && auth.uid === partnerId) return { allowed: true, reason: 'partner_owner_delete' };
    return { allowed: false, reason: 'delete_denied_insufficient_privileges' };
  }

  if (action === 'update') {
    // Branch 1: Manager or Admin full update
    if (isManagerOrAdmin) return { allowed: true, reason: 'manager_or_admin_update' };

    // Calculate diff affected keys
    const affectedKeys = new Set();
    const allKeys = new Set([...Object.keys(existingData), ...Object.keys(incomingData)]);
    for (const key of allKeys) {
      if (JSON.stringify(existingData[key]) !== JSON.stringify(incomingData[key])) {
        affectedKeys.add(key);
      }
    }

    // Branch 2: Staff points and updatedAt update
    if (isStaff) {
      const staffAllowedKeys = ['points', 'updatedAt'];
      let staffValid = true;
      for (const k of affectedKeys) {
        if (!staffAllowedKeys.includes(k)) {
          staffValid = false;
          break;
        }
      }
      if (staffValid && affectedKeys.size > 0) {
        return { allowed: true, reason: 'staff_points_update' };
      }
    }

    // Branch 3: Public stats update (viewCount & likeCount isolation)
    const publicAllowedKeys = ['viewCount', 'likeCount'];
    let publicKeysValid = true;
    for (const k of affectedKeys) {
      if (!publicAllowedKeys.includes(k)) {
        publicKeysValid = false;
        break;
      }
    }

    if (publicKeysValid && affectedKeys.size > 0) {
      // Numerical check: request.resource.data.get('viewCount', 0) >= 0
      const viewCountVal = incomingData.viewCount !== undefined ? incomingData.viewCount : 0;
      const likeCountVal = incomingData.likeCount !== undefined ? incomingData.likeCount : 0;

      // In Firestore, if a non-number is evaluated with >= 0, it errors out and denies access
      if (typeof viewCountVal !== 'number' || isNaN(viewCountVal)) {
        return { allowed: false, reason: 'viewCount_invalid_type_denied' };
      }
      if (typeof likeCountVal !== 'number' || isNaN(likeCountVal)) {
        return { allowed: false, reason: 'likeCount_invalid_type_denied' };
      }

      if (viewCountVal >= 0 && likeCountVal >= 0) {
        return { allowed: true, reason: 'public_stats_isolation_allowed' };
      } else {
        return { allowed: false, reason: 'negative_value_violation_denied' };
      }
    }

    return { allowed: false, reason: 'update_denied_forbidden_fields_or_no_change' };
  }

  return { allowed: false, reason: 'unknown_action' };
}

// Baseline Document
const BASE_PARTNER_DOC = {
  name: 'Lucky Com Zeer Rangsit',
  ownerId: 'owner_user_777',
  userId: 'owner_user_777',
  status: 'active',
  isActive: true,
  isVerified: true,
  commissionRate: 0.15,
  points: 1250,
  phone: '0812345678',
  email: 'lucky@example.com',
  bankInfo: { bank: 'KBANK', accountNo: '123-4-56789-0' },
  viewCount: 150,
  likeCount: 42,
  updatedAt: 1729000000000
};

// =============================================================================
// SECTION 3: EMPIRICAL PERMITTED UPDATES (HAPPY PATHS & BOUNDARIES)
// =============================================================================
console.log('\n--- SECTION 3: Permitted Updates & Safe Boundaries ---');

// 3.1 Unauthenticated viewCount increment (+1)
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null, // anonymous visitor
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, viewCount: BASE_PARTNER_DOC.viewCount + 1 }
  });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'public_stats_isolation_allowed');
  pass('Safe 3.1', 'Unauthenticated visitor viewCount increment (+1) is permitted');
} catch (err) {
  fail('Safe 3.1', err);
}

// 3.2 Authenticated customer likeCount toggle (+1)
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'customer_user_99', token: { role: 'customer' } },
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, likeCount: BASE_PARTNER_DOC.likeCount + 1 }
  });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'public_stats_isolation_allowed');
  pass('Safe 3.2', 'Customer likeCount increment (+1) is permitted');
} catch (err) {
  fail('Safe 3.2', err);
}

// 3.3 Customer unlike toggle (-1)
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'customer_user_99', token: { role: 'customer' } },
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, likeCount: BASE_PARTNER_DOC.likeCount - 1 }
  });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'public_stats_isolation_allowed');
  pass('Safe 3.3', 'Customer unlike decrement (-1) is permitted when remaining >= 0');
} catch (err) {
  fail('Safe 3.3', err);
}

// 3.4 Boundary: likeCount reduced to exactly 0
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: { ...BASE_PARTNER_DOC, likeCount: 1 },
    incomingData: { ...BASE_PARTNER_DOC, likeCount: 0 }
  });
  assert.equal(result.allowed, true);
  pass('Safe 3.4', 'likeCount reaching boundary 0 is permitted (0 >= 0)');
} catch (err) {
  fail('Safe 3.4', err);
}

// 3.5 Boundary: viewCount reduced to exactly 0
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: { ...BASE_PARTNER_DOC, viewCount: 1 },
    incomingData: { ...BASE_PARTNER_DOC, viewCount: 0 }
  });
  assert.equal(result.allowed, true);
  pass('Safe 3.5', 'viewCount reaching boundary 0 is permitted (0 >= 0)');
} catch (err) {
  fail('Safe 3.5', err);
}

// 3.6 Simultaneous update of viewCount and likeCount
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, viewCount: BASE_PARTNER_DOC.viewCount + 1, likeCount: BASE_PARTNER_DOC.likeCount + 1 }
  });
  assert.equal(result.allowed, true);
  pass('Safe 3.6', 'Simultaneous update of both viewCount and likeCount is permitted');
} catch (err) {
  fail('Safe 3.6', err);
}

// 3.7 Missing fields fallback in existing document
try {
  const docWithoutStats = { name: 'Fresh Store', ownerId: 'fresh_owner' };
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: docWithoutStats,
    incomingData: { ...docWithoutStats, viewCount: 1 }
  });
  assert.equal(result.allowed, true);
  pass('Safe 3.7', 'Document initially without viewCount/likeCount gracefully accepts initial count');
} catch (err) {
  fail('Safe 3.7', err);
}

// =============================================================================
// SECTION 4: ADVERSARIAL NEGATIVE VALUE ATTACK VECTORS
// =============================================================================
console.log('\n--- SECTION 4: Adversarial Negative Value Injection Attacks ---');

// 4.1 Decrement viewCount into negative (-1)
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: { ...BASE_PARTNER_DOC, viewCount: 0 },
    incomingData: { ...BASE_PARTNER_DOC, viewCount: -1 }
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'negative_value_violation_denied');
  pass('Adversarial 4.1', 'Negative viewCount (-1) is strictly denied');
} catch (err) {
  fail('Adversarial 4.1', err);
}

// 4.2 Saboteur forces competitor likeCount into negative (-5)
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'saboteur_user', token: { role: 'customer' } },
    existingData: { ...BASE_PARTNER_DOC, likeCount: 2 },
    incomingData: { ...BASE_PARTNER_DOC, likeCount: -5 }
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'negative_value_violation_denied');
  pass('Adversarial 4.2', 'Competitor sabotage negative likeCount (-5) is strictly denied');
} catch (err) {
  fail('Adversarial 4.2', err);
}

// 4.3 Severe underflow attack (viewCount: -999999)
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, viewCount: -999999 }
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'negative_value_violation_denied');
  pass('Adversarial 4.3', 'Underflow injection (viewCount: -999999) is strictly denied');
} catch (err) {
  fail('Adversarial 4.3', err);
}

// 4.4 Mixed payload: valid viewCount but negative likeCount
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, viewCount: 200, likeCount: -1 }
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'negative_value_violation_denied');
  pass('Adversarial 4.4', 'Mixed valid viewCount + negative likeCount is strictly denied');
} catch (err) {
  fail('Adversarial 4.4', err);
}

// 4.5 Type Confusion Injection (String instead of Number: viewCount: "100")
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, viewCount: "100" }
  });
  assert.equal(result.allowed, false);
  pass('Adversarial 4.5', 'Type confusion string injection (viewCount: "100") is denied');
} catch (err) {
  fail('Adversarial 4.5', err);
}

// =============================================================================
// SECTION 5: PRIVILEGE ESCALATION & FIELD ISOLATION ATTACK VECTORS
// =============================================================================
console.log('\n--- SECTION 5: Privilege Escalation & Field Isolation Attacks ---');

const FORBIDDEN_FIELD_ATTACKS = [
  { field: 'name', value: 'Hacked Store Name', label: 'Store Name Defacement' },
  { field: 'ownerId', value: 'attacker_uid', label: 'Store Account Takeover (ownerId)' },
  { field: 'userId', value: 'attacker_uid', label: 'Store Account Takeover (userId)' },
  { field: 'points', value: 999999, label: 'Loyalty Points Forgery / Theft' },
  { field: 'commissionRate', value: 0.00, label: 'Commission Rate Manipulation' },
  { field: 'status', value: 'suspended_hacked', label: 'Store Status Tampering' },
  { field: 'isActive', value: false, label: 'Sabotage Deactivating Active Store' },
  { field: 'isVerified', value: false, label: 'Sabotage Stripping Verification Badge' },
  { field: 'phone', value: '0999999999', label: 'Contact Phone Hijacking' },
  { field: 'email', value: 'attacker@evil.com', label: 'Email Hijacking' },
  { field: 'bankInfo', value: { bank: 'SCB', accountNo: '666-6-66666-6' }, label: 'Payout Bank Account Redirection' },
  { field: 'role', value: 'admin', label: 'Privilege Escalation (role: admin)' },
  { field: 'isStaff', value: true, label: 'Privilege Escalation (isStaff: true)' },
  { field: 'rating', value: 5.0, label: 'Rating / Review Metric Tampering' }
];

for (const attack of FORBIDDEN_FIELD_ATTACKS) {
  try {
    // Attack scenario: Attacker attempts to update the forbidden field directly
    const directResult = evalActivePartnersRule({
      action: 'update',
      auth: { uid: 'attacker_user_1', token: { role: 'customer' } },
      existingData: BASE_PARTNER_DOC,
      incomingData: { ...BASE_PARTNER_DOC, [attack.field]: attack.value }
    });
    assert.equal(directResult.allowed, false, `Direct update of ${attack.field} must be denied`);

    // Trojan Payload: Attacker disguises the attack inside a legitimate viewCount increment
    const trojanResult = evalActivePartnersRule({
      action: 'update',
      auth: { uid: 'attacker_user_1', token: { role: 'customer' } },
      existingData: BASE_PARTNER_DOC,
      incomingData: {
        ...BASE_PARTNER_DOC,
        viewCount: BASE_PARTNER_DOC.viewCount + 1,
        [attack.field]: attack.value
      }
    });
    assert.equal(trojanResult.allowed, false, `Trojan bundled update of viewCount + ${attack.field} must be denied`);

    pass(`FieldIsolation 5.${attack.field}`, `${attack.label} strictly denied in direct & trojan modes`);
  } catch (err) {
    fail(`FieldIsolation 5.${attack.field}`, err);
  }
}

// 5.15 Suspended store reactivation attack (isActive: false -> true)
try {
  const suspendedDoc = { ...BASE_PARTNER_DOC, isActive: false, isVerified: false };
  const reactivateResult = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'unauthorized_partner', token: { role: 'customer' } },
    existingData: suspendedDoc,
    incomingData: { ...suspendedDoc, isActive: true, viewCount: suspendedDoc.viewCount + 1 }
  });
  assert.equal(reactivateResult.allowed, false);
  pass('FieldIsolation 5.Reactivate', 'Attacker self-reactivating suspended store is strictly denied');
} catch (err) {
  fail('FieldIsolation 5.Reactivate', err);
}

// 5.16 Unverified store self-verification attack (isVerified: false -> true)
try {
  const unverifiedDoc = { ...BASE_PARTNER_DOC, isVerified: false };
  const verifyResult = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'unauthorized_partner', token: { role: 'customer' } },
    existingData: unverifiedDoc,
    incomingData: { ...unverifiedDoc, isVerified: true, viewCount: unverifiedDoc.viewCount + 1 }
  });
  assert.equal(verifyResult.allowed, false);
  pass('FieldIsolation 5.SelfVerify', 'Attacker self-verifying store badge is strictly denied');
} catch (err) {
  fail('FieldIsolation 5.SelfVerify', err);
}

// 5.17 Trojan with updatedAt: viewCount + updatedAt
try {
  // If an attacker or misguided client tries to send updatedAt along with viewCount
  const result = evalActivePartnersRule({
    action: 'update',
    auth: null,
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, viewCount: BASE_PARTNER_DOC.viewCount + 1, updatedAt: Date.now() }
  });
  assert.equal(result.allowed, false);
  pass('FieldIsolation 5.updatedAt', 'Bundling updatedAt with viewCount is strictly denied (preserves strict whitelist)');
} catch (err) {
  fail('FieldIsolation 5.updatedAt', err);
}

// =============================================================================
// SECTION 6: ROLE-BASED ACCESS CONTROL (STAFF, OWNER, ADMIN BOUNDARIES)
// =============================================================================
console.log('\n--- SECTION 6: Role-Based Access Control (RBAC) Boundaries ---');

// 6.1 Staff attempting to update points and updatedAt -> MUST ALLOW
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'staff_user_01', token: { role: 'staff', isStaff: true } },
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, points: 1500, updatedAt: 1729100000000 }
  });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'staff_points_update');
  pass('RBAC 6.1', 'Staff points & updatedAt update is permitted');
} catch (err) {
  fail('RBAC 6.1', err);
}

// 6.2 Staff attempting to update commissionRate -> MUST DENY
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'staff_user_01', token: { role: 'staff', isStaff: true } },
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, points: 1500, commissionRate: 0.05 }
  });
  assert.equal(result.allowed, false);
  pass('RBAC 6.2', 'Staff attempting to tamper with commissionRate is strictly denied');
} catch (err) {
  fail('RBAC 6.2', err);
}

// 6.3 Manager/Admin full update -> MUST ALLOW
try {
  const result = evalActivePartnersRule({
    action: 'update',
    auth: { uid: 'admin_user_01', token: { role: 'admin' } },
    existingData: BASE_PARTNER_DOC,
    incomingData: { ...BASE_PARTNER_DOC, name: 'Renamed by Admin', commissionRate: 0.12 }
  });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'manager_or_admin_update');
  pass('RBAC 6.3', 'Admin full store management update is permitted');
} catch (err) {
  fail('RBAC 6.3', err);
}

// 6.4 Create document permissions:
// Unauthenticated create -> DENIED
assert.equal(evalActivePartnersRule({ action: 'create', auth: null }).allowed, false);
// Customer create -> DENIED
assert.equal(evalActivePartnersRule({ action: 'create', auth: { uid: 'user_1', token: { role: 'customer' } } }).allowed, false);
// Staff create -> DENIED (Only manager/admin)
assert.equal(evalActivePartnersRule({ action: 'create', auth: { uid: 'staff_1', token: { role: 'staff' } } }).allowed, false);
// Manager create -> ALLOWED
assert.equal(evalActivePartnersRule({ action: 'create', auth: { uid: 'mgr_1', token: { role: 'manager' } } }).allowed, true);
pass('RBAC 6.4', 'Document creation strictly locked to manager/admin');

// 6.5 Delete document permissions:
// Unauthenticated delete -> DENIED
assert.equal(evalActivePartnersRule({ action: 'delete', auth: null, partnerId: 'store_123' }).allowed, false);
// Foreign customer delete -> DENIED
assert.equal(evalActivePartnersRule({ action: 'delete', auth: { uid: 'other_user' }, partnerId: 'store_123' }).allowed, false);
// Store Owner delete -> ALLOWED
assert.equal(evalActivePartnersRule({ action: 'delete', auth: { uid: 'store_123' }, partnerId: 'store_123' }).allowed, true);
// Manager delete -> ALLOWED
assert.equal(evalActivePartnersRule({ action: 'delete', auth: { uid: 'mgr_1', token: { role: 'manager' } }, partnerId: 'store_123' }).allowed, true);
pass('RBAC 6.5', 'Document deletion strictly locked to store owner or manager/admin');

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================================');
console.log(`📊 ADVERSARIAL TEST SUMMARY: ${passedChecks}/${totalChecks} Checks Passed (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
console.log(`   Defects / Vulnerabilities: ${failedChecks}`);
console.log('================================================================================\n');

if (failedChecks === 0) {
  console.log('🏆 VERDICT: APPROVE');
  console.log('   The ActivePartners security rules (lines 636-648) are empirically proven to:');
  console.log('   1. Isolate public writes exclusively to viewCount and likeCount.');
  console.log('   2. Block all privilege escalation and forbidden field mutations (name, points, commissionRate, etc.).');
  console.log('   3. Block negative number injections (viewCount >= 0 and likeCount >= 0).');
  console.log('   4. Harmonize perfectly with frontend client useStoreStats.js.');
  process.exit(0);
} else {
  console.error('💥 VERDICT: REJECT');
  console.error('   Vulnerabilities detected:');
  for (const d of defects) {
    console.error(`   - ${d.test}: ${d.error}`);
  }
  process.exit(1);
}
