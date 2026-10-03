// Verification script for Phase 2 Security Rules & Registration Fixes
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

console.log('🧪 Starting Phase 2 Verification...');

// 1. Verify firestore.rules
const rulesPath = path.join(projectRoot, 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

// Check H1: staff update allowlist/blacklist
const staffIdx = rulesContent.indexOf('isStaff() &&');
const staffEnd = rulesContent.indexOf(') || (', staffIdx);
const staffUpdateBlock = rulesContent.substring(staffIdx, staffEnd);
assert(!staffUpdateBlock.includes("'creditPoints'"), 'isStaff update blacklist must not block creditPoints (H1 fix)');
assert(!staffUpdateBlock.includes("'totalAccumulatedPoints'"), 'isStaff update blacklist must not block totalAccumulatedPoints (H1 fix)');
assert(staffUpdateBlock.includes("'walletBalance'"), 'isStaff update blacklist must continue to protect walletBalance');
assert(staffUpdateBlock.includes("'pendingWithdrawal'"), 'isStaff update blacklist must continue to protect pendingWithdrawal');
console.log('✅ Check 1 Passed: firestore.rules allows staff to issue credit points in POS while strictly protecting wallet balance (H1 fixed).');

// Check C4: user self update blacklist
const userSelfIdx = rulesContent.indexOf('isAuthenticated() && request.auth.uid == userId', staffEnd);
const userSelfEnd = rulesContent.indexOf('match /', userSelfIdx);
const userSelfUpdateBlock = rulesContent.substring(userSelfIdx, userSelfEnd);
assert(userSelfUpdateBlock.includes("'isApproved'"), 'User self update blacklist must include isApproved to prevent privilege escalation (C4 fix)');
assert(userSelfUpdateBlock.includes("'permissions'"), 'User self update blacklist must include permissions');
console.log('✅ Check 2 Passed: firestore.rules prevents self-assignment of isApproved / permissions (C4 fixed).');

// Check C1: todo create rules
const todoMatchIdx = rulesContent.indexOf('match /todos/{todoId}');
const todoUpdateIdx = rulesContent.indexOf('allow update:', todoMatchIdx);
const todoCreateBlock = rulesContent.substring(todoMatchIdx, todoUpdateIdx);
assert(todoCreateBlock.includes('request.resource.data.targetUid == request.auth.uid'), 'Todo create rules must accept targetUid match for staff onboarding (C1 fix)');
console.log('✅ Check 3 Passed: firestore.rules allows targetUid in todo create condition (C1 fixed).');

// 2. Verify todoStaffService.js
const todoServicePath = path.join(projectRoot, 'dh-backoffice-react/src/firebase/todo/todoStaffService.js');
const todoContent = fs.readFileSync(todoServicePath, 'utf8');

assert(todoContent.includes('createdByUid: staffData.uid'), 'todoStaffService must set createdByUid');
assert(todoContent.includes('userId: staffData.uid'), 'todoStaffService must set userId');
assert(todoContent.includes('name: fullName'), 'todoStaffService must set metadata.name for approval card (M6 fix)');
console.log('✅ Check 4 Passed: todoStaffService includes createdByUid, userId, and metadata.name (C1, M6 fixed).');

// 3. Verify ProfileSetup.jsx
const profileSetupPath = path.join(projectRoot, 'dh-backoffice-react/src/pages/settings/ProfileSetup.jsx');
const profileSetupContent = fs.readFileSync(profileSetupPath, 'utf8');

assert(profileSetupContent.includes('if (isOwner) {\n        profileData.userType = \'staff\';') || 
       profileSetupContent.includes("if (isOwner) {\r\n        profileData.userType = 'staff';"), 
       'ProfileSetup must only assign userType for isOwner to avoid non-staff rules violation');
console.log('✅ Check 5 Passed: ProfileSetup safely isolates userType for owner only (C1 fixed).');

console.log('\n🎉 ALL PHASE 2 VERIFICATION CHECKS PASSED!');
