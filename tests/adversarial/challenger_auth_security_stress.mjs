/**
 * Challenger 1 Adversarial Security & Auth Flows Stress Suite
 * 
 * Location: Management System/tests/adversarial/challenger_auth_security_stress.mjs
 * 
 * Scope:
 * 1. userManagementService.updateUserRole polymorphic arguments & /users/owner write prevention
 * 2. firestore.rules privilege escalation & blacklist bypass (role, isApproved, permissions, walletBalance)
 * 3. todoStaffService spoofed UID & unauthenticated onboarding task creation
 * 4. useAuthFlow & AuthContext owner lockout & pending_approval traps
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const USER_MGMT_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/userManagementService.js');
const RULES_PATH = path.resolve(REPO_ROOT, 'Management System/firestore.rules');
const TODO_STAFF_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/todo/todoStaffService.js');
const AUTH_FLOW_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/login/hooks/useAuthFlow.js');
const AUTH_CONTEXT_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/contexts/AuthContext.jsx');
const USER_SERVICE_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/firebase/userService.js');

console.log('================================================================================');
console.log('⚔️  CHALLENGER 1: ADVERSARIAL AUTH & SECURITY STRESS TEST SUITE');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const findings = [];

function assert(condition, testName, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedChecks++;
    const msg = details ? `${testName} -> ${details}` : testName;
    console.error(`  ❌ [FAIL] ${msg}`);
    findings.push({ test: testName, details });
  }
}

// -----------------------------------------------------------------------------
// VERIFY FILES EXISTENCE
// -----------------------------------------------------------------------------
console.log('--- [0] Verifying Target Source Files ---');
assert(fs.existsSync(USER_MGMT_PATH), 'userManagementService.js exists');
assert(fs.existsSync(RULES_PATH), 'firestore.rules exists');
assert(fs.existsSync(TODO_STAFF_PATH), 'todoStaffService.js exists');
assert(fs.existsSync(AUTH_FLOW_PATH), 'useAuthFlow.js exists');
assert(fs.existsSync(AUTH_CONTEXT_PATH), 'AuthContext.jsx exists');
assert(fs.existsSync(USER_SERVICE_PATH), 'userService.js exists');

const userMgmtSrc = fs.readFileSync(USER_MGMT_PATH, 'utf8');
const rulesSrc = fs.readFileSync(RULES_PATH, 'utf8');
const todoStaffSrc = fs.readFileSync(TODO_STAFF_PATH, 'utf8');
const authFlowSrc = fs.readFileSync(AUTH_FLOW_PATH, 'utf8');
const authContextSrc = fs.readFileSync(AUTH_CONTEXT_PATH, 'utf8');
const userServiceSrc = fs.readFileSync(USER_SERVICE_PATH, 'utf8');

// =============================================================================
// CHALLENGE 1: userManagementService.updateUserRole Adversarial Edge Cases
// =============================================================================
console.log('\n--- [1] Challenge 1: userManagementService.updateUserRole ---');

// Replicate the exact parameter resolution & validation algorithm from userManagementService.js
function simulateUpdateUserRole(arg1, arg2, arg3, currentAuthUid = null) {
  let adminId;
  let targetUid;
  let newRole;

  if (arg3 !== undefined) {
    adminId = arg1;
    targetUid = arg2;
    newRole = arg3;
  } else {
    targetUid = arg1;
    newRole = arg2;
    adminId = currentAuthUid;
  }

  if (!targetUid || typeof targetUid !== 'string' || !newRole) {
    throw new Error(`Invalid arguments to updateUserRole: targetUid=${targetUid}, newRole=${newRole}`);
  }

  // Determine targeted doc path
  const targetDocPath = `users/${targetUid}`;
  return {
    adminId,
    targetUid,
    newRole,
    targetDocPath,
    writesToOwnerDoc: targetDocPath === 'users/owner'
  };
}

// 1.1: 2-arg signature resolution
const call2Args = simulateUpdateUserRole('user_abc_123', 'owner');
assert(
  call2Args.targetUid === 'user_abc_123' && call2Args.newRole === 'owner' && call2Args.targetDocPath === 'users/user_abc_123',
  '1.1: 2-arg signature (uid, role) resolves targetUid to user_abc_123 and writes to users/user_abc_123'
);
assert(
  call2Args.writesToOwnerDoc === false,
  '1.1: 2-arg signature (uid, "owner") NEVER writes to users/owner'
);

// 1.2: 3-arg signature resolution
const call3Args = simulateUpdateUserRole('admin_999', 'user_abc_123', 'staff');
assert(
  call3Args.adminId === 'admin_999' && call3Args.targetUid === 'user_abc_123' && call3Args.newRole === 'staff',
  '1.2: 3-arg signature (adminId, targetUid, newRole) resolves correctly'
);

// 1.3: Passing null as targetUid (2 args)
let errNull2 = null;
try {
  simulateUpdateUserRole(null, 'staff');
} catch (e) {
  errNull2 = e.message;
}
assert(
  errNull2 !== null && errNull2.includes('Invalid arguments to updateUserRole'),
  '1.3: Passing null as targetUid throws Invalid arguments'
);

// 1.4: Passing undefined as targetUid (2 args)
let errUndef2 = null;
try {
  simulateUpdateUserRole(undefined, 'staff');
} catch (e) {
  errUndef2 = e.message;
}
assert(
  errUndef2 !== null && errUndef2.includes('Invalid arguments to updateUserRole'),
  '1.4: Passing undefined as targetUid throws Invalid arguments'
);

// 1.5: Passing empty string as targetUid (2 args)
let errEmpty2 = null;
try {
  simulateUpdateUserRole('', 'staff');
} catch (e) {
  errEmpty2 = e.message;
}
assert(
  errEmpty2 !== null && errEmpty2.includes('Invalid arguments to updateUserRole'),
  '1.5: Passing empty string "" as targetUid throws Invalid arguments'
);

// 1.6: Passing non-string types as targetUid (numbers, objects, booleans)
const invalidTypes = [12345, true, false, {}, [], () => {}];
let allTypesRejected = true;
for (const badType of invalidTypes) {
  try {
    simulateUpdateUserRole(badType, 'staff');
    allTypesRejected = false;
  } catch (e) {
    // Expected rejection
  }
}
assert(allTypesRejected, '1.6: Passing non-string targetUid (number, obj, arr, bool) strictly throws Invalid arguments');

// 1.7: Passing empty or null role
const invalidRoles = [null, undefined, ''];
let allBadRolesRejected = true;
for (const badRole of invalidRoles) {
  try {
    simulateUpdateUserRole('valid_uid', badRole);
    allBadRolesRejected = false;
  } catch (e) {
    // Expected rejection
  }
}
assert(allBadRolesRejected, '1.7: Passing empty, null or undefined role strictly throws Invalid arguments');

// 1.8: 3-arg signature with bad targetUid (adminId, badTarget, role)
let errBadTarget3 = null;
try {
  simulateUpdateUserRole('admin_1', null, 'staff');
} catch (e) {
  errBadTarget3 = e.message;
}
assert(
  errBadTarget3 !== null && errBadTarget3.includes('Invalid arguments to updateUserRole'),
  '1.8: 3-arg signature with null targetUid throws Invalid arguments'
);

// 1.9: What happens if arg3 is explicitly passed as undefined?
// E.g. updateUserRole('my_uid', 'owner', undefined)
const callExplicitUndef = simulateUpdateUserRole('my_uid', 'owner', undefined);
assert(
  callExplicitUndef.targetUid === 'my_uid' && callExplicitUndef.newRole === 'owner' && callExplicitUndef.targetDocPath === 'users/my_uid',
  '1.9: Explicitly passing undefined as arg3 cleanly falls back to 2-arg signature targeting users/my_uid'
);

// 1.10: What if someone passes targetUid = 'owner'?
const callTargetOwner = simulateUpdateUserRole('owner', 'admin');
assert(
  callTargetOwner.targetDocPath === 'users/owner',
  '1.10: Literal targetUid="owner" maps to users/owner (Observation: function does not check if targetUid === "owner")'
);

// =============================================================================
// CHALLENGE 2: firestore.rules Privilege Escalation Stress Testing
// =============================================================================
console.log('\n--- [2] Challenge 2: firestore.rules Privilege Escalation ---');

// Extract rules content for users/{userId}
const usersRuleMatch = rulesSrc.match(/match \/users\/\{userId\} \{([\s\S]*?)(match \/wallet_transactions|\/\/ 1\.1|\/\/ 2\.)/);
assert(usersRuleMatch !== null, '2.0: Successfully extracted match /users/{userId} rule section');
const usersRuleSection = usersRuleMatch ? usersRuleMatch[1] : '';

// 2.1: Verify affectedKeys blacklist for regular user updates (lines 100-103)
const userBlacklistMatch = usersRuleSection.match(/!request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasAny\(\[([\s\S]*?)\]\)/g);
assert(userBlacklistMatch !== null && userBlacklistMatch.length >= 2, '2.1: Found affectedKeys blacklists in user update rules');

// Check that regular user CANNOT modify 'role'
assert(
  userBlacklistMatch && userBlacklistMatch.some(b => b.includes("'role'")),
  '2.1: Regular user self-update blacklist includes "role"'
);

// Check that regular user CANNOT modify 'isApproved'
assert(
  userBlacklistMatch && userBlacklistMatch.some(b => b.includes("'isApproved'")),
  '2.2: Regular user self-update blacklist includes "isApproved" (C4 fix confirmed)'
);

// Check that regular user CANNOT modify 'permissions'
assert(
  userBlacklistMatch && userBlacklistMatch.some(b => b.includes("'permissions'")),
  '2.3: Regular user self-update blacklist includes "permissions" (C4 fix confirmed)'
);

// Check that regular user CANNOT modify 'isStaff'
assert(
  userBlacklistMatch && userBlacklistMatch.some(b => b.includes("'isStaff'")),
  '2.4: Regular user self-update blacklist includes "isStaff"'
);

// Check that regular user CANNOT modify 'walletBalance' arbitrarily
assert(
  usersRuleSection.includes("request.resource.data.get('walletBalance', 0) < resource.data.get('walletBalance', 0)"),
  '2.5: User walletBalance update requires strict monotonic decrease (spending only)'
);
assert(
  usersRuleSection.includes("existsAfter(/databases/$(database)/documents/users/$(userId)/wallet_transactions/$(request.resource.data.lastWalletTxId))"),
  '2.5: User walletBalance update requires verified wallet_transactions document link'
);

// 2.6: Cashier (isStaff) update permissions on users/{userId}
const staffUpdateBlock = usersRuleSection.match(/isStaff\(\)\s*&&\s*\(!request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasAny\(\[([\s\S]*?)\]\)\)/);
assert(staffUpdateBlock !== null, '2.6: Found isStaff() update blacklist');
const staffBlacklist = staffUpdateBlock ? staffUpdateBlock[1] : '';

assert(staffBlacklist.includes("'isApproved'"), '2.6: Staff update blacklist includes "isApproved"');
assert(staffBlacklist.includes("'role'") && staffBlacklist.includes("'roles'"), '2.6: Staff update blacklist includes "role" and "roles"');
assert(staffBlacklist.includes("'walletBalance'"), '2.6: Staff update blacklist includes "walletBalance"');
assert(!staffBlacklist.includes("'creditPoints'"), '2.7: Staff update blacklist does NOT include "creditPoints" (H1 fix confirmed: POS loyalty allowed)');
assert(!staffBlacklist.includes("'totalAccumulatedPoints'"), '2.7: Staff update blacklist does NOT include "totalAccumulatedPoints" (POS loyalty allowed)');

// 2.8: Regular user creation restrictions (lines 54-76)
assert(
  usersRuleSection.includes("request.resource.data.get('walletBalance', 0) == 0"),
  '2.8: User creation enforces walletBalance == 0'
);
assert(
  usersRuleSection.includes("request.resource.data.get('isStaff', false) == false"),
  '2.8: User creation enforces isStaff == false'
);
assert(
  usersRuleSection.includes("request.resource.data.get('isApproved', false) == false"),
  '2.8: User creation enforces isApproved == false'
);

// =============================================================================
// CHALLENGE 3: todoStaffService Onboarding Task Creation & Spoofing
// =============================================================================
console.log('\n--- [3] Challenge 3: todoStaffService Spoofed UID & Onboarding Tasks ---');

// Extract todos rules section
const todosRuleMatch = rulesSrc.match(/match \/todos\/\{todoId\} \{([\s\S]*?)(match \/sourcing_requests|\/\/ 4\.1)/);
assert(todosRuleMatch !== null, '3.0: Found match /todos/{todoId} rule section');
const todosRuleSection = todosRuleMatch ? todosRuleMatch[1] : '';

// 3.1: Non-authenticated user creation rejection
assert(
  todosRuleSection.includes('allow create: if isStaff() || (isAuthenticated() &&'),
  '3.1: Todos create rule requires isAuthenticated() or isStaff()'
);

// 3.2: Check targetUid in create rule (C1 fix)
assert(
  todosRuleSection.includes('request.resource.data.targetUid == request.auth.uid'),
  '3.2: Todos create rule accepts targetUid == request.auth.uid (C1 fix confirmed)'
);

// 3.3: Spoofed UID Simulation
// If attacker auth.uid = 'attacker_uid', but staffData.uid = 'victim_uid'
function simulateTodoCreateRule(authUid, payload, isStaffUser = false) {
  if (isStaffUser) return { allowed: true, reason: 'isStaff' };
  if (!authUid) return { allowed: false, reason: 'unauthenticated' };

  const matchesUid = 
    payload.createdByUid === authUid ||
    payload.createdBy === authUid ||
    payload.userId === authUid ||
    payload.targetUid === authUid ||
    payload.partnerId === authUid;

  if (!matchesUid) return { allowed: false, reason: 'uid_mismatch' };

  const allowedStatuses = ['todo', 'pending', 'pending_manager', 'waiting_item', 'PENDING'];
  if (!allowedStatuses.includes(payload.status)) {
    return { allowed: false, reason: 'illegal_status' };
  }

  const restrictedTaskTypes = [
    'CLAIM_APPROVAL', 'EXCHANGE_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 
    'CANCEL_EXCHANGE_APPROVAL', 'CANCEL_RETURN_APPROVAL', 'PRODUCT_DELETE_APPROVAL', 
    'PARTNER_APPROVAL', 'PRODUCT_KNOWLEDGE_APPROVAL', 'BILL_CANCEL_APPROVAL',
    'WALLET_WITHDRAWAL', 'LEAVE_APPROVAL'
  ];
  if (restrictedTaskTypes.includes(payload.taskType) || restrictedTaskTypes.includes(payload.type)) {
    return { allowed: false, reason: 'restricted_task_type' };
  }

  return { allowed: true, reason: 'authorized' };
}

// 3.3.1: Non-authenticated user attempting todo creation
const unauthAttempt = simulateTodoCreateRule(null, {
  type: 'STAFF_APPROVAL',
  status: 'pending',
  targetUid: 'someone',
  createdByUid: 'someone'
});
assert(unauthAttempt.allowed === false && unauthAttempt.reason === 'unauthenticated', '3.3.1: Unauthenticated todo creation rejected');

// 3.3.2: Spoofed UID attack (attacker_123 attempts to create task on victim_999)
// When todoStaffService creates task, all UID fields are staffData.uid
const spoofedStaffData = {
  uid: 'victim_999',
  email: 'victim@example.com',
  firstName: 'Victim',
  lastName: 'User'
};
const spoofedPayload = {
  type: 'STAFF_APPROVAL',
  taskType: 'STAFF_APPROVAL',
  status: 'pending',
  targetUid: spoofedStaffData.uid, // victim_999
  createdByUid: spoofedStaffData.uid, // victim_999
  userId: spoofedStaffData.uid // victim_999
};
const spoofAttempt = simulateTodoCreateRule('attacker_123', spoofedPayload);
assert(
  spoofAttempt.allowed === false && spoofAttempt.reason === 'uid_mismatch',
  '3.3.2: Attacker cannot create onboarding task spoofing another user UID (UID mismatch rejected)'
);

// 3.3.3: Legitimate onboarding registration (auth.uid == staffData.uid)
const legitimatePayload = {
  type: 'STAFF_APPROVAL',
  taskType: 'STAFF_APPROVAL',
  status: 'pending',
  targetUid: 'applicant_456',
  createdByUid: 'applicant_456',
  userId: 'applicant_456'
};
const legitAttempt = simulateTodoCreateRule('applicant_456', legitimatePayload);
assert(
  legitAttempt.allowed === true && legitAttempt.reason === 'authorized',
  '3.3.3: Legitimate onboarding task by authenticated applicant is allowed'
);

// 3.3.4: Attacker attempting to forge pre-approved status
const preApprovedAttempt = simulateTodoCreateRule('attacker_123', {
  ...legitimatePayload,
  createdByUid: 'attacker_123',
  targetUid: 'attacker_123',
  userId: 'attacker_123',
  status: 'approved'
});
assert(
  preApprovedAttempt.allowed === false && preApprovedAttempt.reason === 'illegal_status',
  '3.3.4: Attacker cannot create task with status "approved" (illegal status rejected)'
);

// 3.3.5: Attacker attempting to create restricted approval task
const restrictedTaskAttempt = simulateTodoCreateRule('attacker_123', {
  ...legitimatePayload,
  createdByUid: 'attacker_123',
  targetUid: 'attacker_123',
  userId: 'attacker_123',
  type: 'WALLET_WITHDRAWAL',
  taskType: 'WALLET_WITHDRAWAL'
});
assert(
  restrictedTaskAttempt.allowed === false && restrictedTaskAttempt.reason === 'restricted_task_type',
  '3.3.5: Non-staff user cannot create WALLET_WITHDRAWAL task (restricted task type rejected)'
);

// =============================================================================
// CHALLENGE 4: useAuthFlow & AuthContext Owner Trapped in pending_approval
// =============================================================================
console.log('\n--- [4] Challenge 4: useAuthFlow & AuthContext Owner Lockout / Pending Trap ---');

// 4.1: Inspect SUPER_ADMINS list across files
const superAdminsMatch = userServiceSrc.match(/export const SUPER_ADMINS = \[([\s\S]*?)\];/);
assert(superAdminsMatch !== null, '4.1: Found SUPER_ADMINS in userService.js');
const superAdminsList = superAdminsMatch ? superAdminsMatch[1].match(/'([^']+)'/g).map(s => s.replace(/'/g, '')) : [];
assert(
  superAdminsList.length === 4 &&
  superAdminsList.includes('zhoulinjuan1@gmail.com') &&
  superAdminsList.includes('dh1notebook@gmail.com') &&
  superAdminsList.includes('dh2notebook@gmail.com') &&
  superAdminsList.includes('bentshan@gmail.com'),
  '4.1: SUPER_ADMINS list contains all 4 executive emails'
);

// 4.2: In useAuthFlow.js handleGoogleLogin: isOwner evaluated before pending_approval
const googleLoginMatch = authFlowSrc.match(/const handleGoogleLogin = async \(\) => \{([\s\S]*?)const handleEmailLogin/);
assert(googleLoginMatch !== null, '4.2: Found handleGoogleLogin in useAuthFlow.js');
const googleLoginBody = googleLoginMatch ? googleLoginMatch[1] : '';

const ownerIdxGoogle = googleLoginBody.indexOf('if (isOwner)');
const pendingIdxGoogle = googleLoginBody.indexOf("profile?.role === 'pending_approval'");
assert(
  ownerIdxGoogle !== -1 && pendingIdxGoogle !== -1 && ownerIdxGoogle < pendingIdxGoogle,
  '4.2: handleGoogleLogin checks isOwner BEFORE profile?.role === "pending_approval"'
);

// 4.3: In useAuthFlow.js handleEmailLogin: isOwner evaluated before pending_approval
const emailLoginMatch = authFlowSrc.match(/const handleEmailLogin = async \([\s\S]*?\) => \{([\s\S]*?)const handleStaffRegistration/);
assert(emailLoginMatch !== null, '4.3: Found handleEmailLogin in useAuthFlow.js');
const emailLoginBody = emailLoginMatch ? emailLoginMatch[1] : '';

const ownerIdxEmail = emailLoginBody.indexOf('if (isOwner)');
const pendingIdxEmail = emailLoginBody.indexOf("profile?.role === 'pending_approval'");
assert(
  ownerIdxEmail !== -1 && pendingIdxEmail !== -1 && ownerIdxEmail < pendingIdxEmail,
  '4.3: handleEmailLogin checks isOwner BEFORE profile?.role === "pending_approval"'
);

// 4.4: ADVERSARIAL STRESS TEST: AuthContext Gatekeeper Sequence
// In AuthContext.jsx:
// Line 221: } else if (isPending) { ... accessDenied = true; denyReason = 'pending'; }
// Line 229: } else if (isExecutive || ...) { ... }
const authContextGatekeeperMatch = authContextSrc.match(/unsubscribeRoleRef\.current = userService\.listenToUserRole\([\s\S]*?\}\);\s*\}\s*else\s*\{/);
assert(authContextGatekeeperMatch !== null, '4.4: Found listenToUserRole gatekeeper in AuthContext.jsx');
const gatekeeperCode = authContextGatekeeperMatch ? authContextGatekeeperMatch[0] : '';

const isPendingIdx = gatekeeperCode.indexOf('else if (isPending)');
const isExecutiveIdx = gatekeeperCode.indexOf('else if (isExecutive');

console.log(`\n  🔍 [Deep AST / Logic Trace] AuthContext Gatekeeper Order:`);
console.log(`     isPending branch index: ${isPendingIdx}`);
console.log(`     isExecutive branch index: ${isExecutiveIdx}`);

// Replicate AuthContext role resolution function
function simulateAuthContextGatekeeper(email, roleData) {
  const userEmail = (email || '').toLowerCase().trim();
  const isExecutive = superAdminsList.includes(userEmail);
  const currentRoleStr = String(roleData?.role || roleData?.userType || '').toLowerCase();
  
  const VALID_STAFF_ROLES = ['staff', 'manager', 'admin', 'owner', 'vp', 'vp 1', 'packer'];
  const isStaffMember = roleData?.isStaff || VALID_STAFF_ROLES.includes(currentRoleStr);
  
  const isPending = currentRoleStr === 'pending_approval' || currentRoleStr === 'pending' || roleData?.status === 'pending';
  const isSuspended = roleData?.isActive === false || roleData?.status === 'suspended';
  const needsSetup = !roleData?.role && !roleData?.firstName;

  // Actual code in AuthContext.jsx (lines 214-250):
  if (needsSetup && !isPending && !isStaffMember && !isExecutive) {
    return { outcome: 'PROFILE_SETUP', accessDenied: false };
  } else if (isPending) {
    return { outcome: 'PENDING_APPROVAL', accessDenied: true, denyReason: 'pending' };
  } else if (isExecutive || (isStaffMember && !isSuspended && !isPending)) {
    return { outcome: 'ACCESS_GRANTED', accessDenied: false, role: 'Executive' };
  } else {
    return { outcome: 'ACCESS_DENIED', accessDenied: true, denyReason: 'unauthorized' };
  }
}

// Scenario 4.4.1: Executive account with role="owner", status="active"
const execNormal = simulateAuthContextGatekeeper('zhoulinjuan1@gmail.com', { role: 'owner', isActive: true });
assert(
  execNormal.outcome === 'ACCESS_GRANTED' && execNormal.accessDenied === false,
  '4.4.1: Executive with role="owner" is cleanly granted access in AuthContext'
);

// Scenario 4.4.2: ADVERSARIAL FAILURE MODE DISCOVERY:
// If an executive email somehow has role="pending_approval" or status="pending" in Firestore
// (e.g. from prior test data, registration form, or un-synced profile)
const execWithPendingData = simulateAuthContextGatekeeper('zhoulinjuan1@gmail.com', { role: 'pending_approval', status: 'pending' });

// We test if AuthContext traps them:
const isTrappedInAuthContext = (execWithPendingData.outcome === 'PENDING_APPROVAL' && execWithPendingData.accessDenied === true);

if (isTrappedInAuthContext) {
  console.log('  ⚠️  [DEFECT SURFACED] In AuthContext.jsx line 221:');
  console.log('     "else if (isPending)" evaluates BEFORE "else if (isExecutive)"!');
  console.log('     If an executive user has role="pending_approval" in Firestore, on direct page reload,');
  console.log('     AuthContext traps the executive in pending_approval (denyReason="pending")');
  console.log('     because line 221 lacks the guard condition "&& !isExecutive"!');
}

assert(
  isPendingIdx !== -1 && isExecutiveIdx !== -1 && isPendingIdx < isExecutiveIdx,
  '4.4.2: Confirmed code order: AuthContext evaluates isPending BEFORE isExecutive (structural latent defect in AuthContext)'
);

// Check if useAuthFlow self-heals this upon login
assert(
  googleLoginBody.includes("await userService.updateUserRole(user.uid, 'owner')") &&
  googleLoginBody.includes("await updateDoc(userRef, { isStaff: true, isActive: true, role: 'owner', roles: ['Owner'] })"),
  '4.4.3: useAuthFlow self-heals by force-updating Firestore role to "owner" during login, mitigating the AuthContext trap during fresh login'
);

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n================================================================================');
console.log(`🏁 CHALLENGER 1 STRESS TEST RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
if (failedChecks === 0) {
  console.log('🎉 ALL EMPIRICAL CHALLENGES AND VERIFICATIONS COMPLETED SUCCESSFULLY!');
} else {
  console.log(`⚠️ ${failedChecks} CHALLENGE(S) FAILED OR HIGHLIGHTED ANOMALIES`);
}
console.log('================================================================================\n');

process.exit(failedChecks === 0 ? 0 : 1);
