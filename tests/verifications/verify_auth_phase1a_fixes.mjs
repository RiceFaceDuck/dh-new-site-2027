// Verification script for Phase 1A Auth & Admin Fixes
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

console.log('🧪 Starting Phase 1A Verification...');

// 1. Verify SUPER_ADMINS in userService.js
const userServicePath = path.join(projectRoot, 'dh-backoffice-react/src/firebase/userService.js');
const userServiceContent = fs.readFileSync(userServicePath, 'utf8');
assert(userServiceContent.includes('dh1notebook@gmail.com'), 'dh1notebook must be in SUPER_ADMINS');
assert(userServiceContent.includes('dh2notebook@gmail.com'), 'dh2notebook must be in SUPER_ADMINS');
assert(userServiceContent.includes('zhoulinjuan1@gmail.com'), 'zhoulinjuan1 must be in SUPER_ADMINS');
assert(userServiceContent.includes('bentshan@gmail.com'), 'bentshan must be in SUPER_ADMINS');
console.log('✅ Check 1 Passed: SUPER_ADMINS array synchronized with all 4 admin emails.');

// 2. Verify updateUserRole signature handling in userManagementService.js
const userMgmtServicePath = path.join(projectRoot, 'dh-backoffice-react/src/firebase/userManagementService.js');
const userMgmtContent = fs.readFileSync(userMgmtServicePath, 'utf8');
assert(userMgmtContent.includes('export const updateUserRole = async (arg1, arg2, arg3) =>'), 'updateUserRole must support multi-arg signature');
assert(userMgmtContent.includes('if (arg3 !== undefined)'), 'updateUserRole must branch on arg3');
assert(userMgmtContent.includes('targetUid = arg1;') && userMgmtContent.includes('newRole = arg2;'), 'updateUserRole must map (targetUid, newRole) correctly');
console.log('✅ Check 2 Passed: updateUserRole safely handles 2 and 3 argument calls.');

// 3. Verify evaluation order in useAuthFlow.js
const useAuthFlowPath = path.join(projectRoot, 'dh-backoffice-react/src/components/login/hooks/useAuthFlow.js');
const useAuthFlowContent = fs.readFileSync(useAuthFlowPath, 'utf8');
assert(useAuthFlowContent.includes('import { userService, SUPER_ADMINS }'), 'useAuthFlow must import SUPER_ADMINS');
const googleLoginStart = useAuthFlowContent.indexOf('const handleGoogleLogin = async () =>');
const emailLoginStart = useAuthFlowContent.indexOf('const handleEmailLogin = async (email, password) =>');

const googleOwnerIdx = useAuthFlowContent.indexOf('const isOwner = SUPER_ADMINS', googleLoginStart);
const googlePendingIdx = useAuthFlowContent.indexOf("profile?.role === 'pending_approval'", googleLoginStart);
assert(googleOwnerIdx !== -1 && googlePendingIdx !== -1, 'Both isOwner and pending must exist in handleGoogleLogin');
assert(googleOwnerIdx < googlePendingIdx, 'isOwner check must precede pending_approval in handleGoogleLogin');

const emailOwnerIdx = useAuthFlowContent.indexOf('const isOwner = SUPER_ADMINS', emailLoginStart);
const emailPendingIdx = useAuthFlowContent.indexOf("profile?.role === 'pending_approval'", emailLoginStart);
assert(emailOwnerIdx !== -1 && emailPendingIdx !== -1, 'Both isOwner and pending must exist in handleEmailLogin');
assert(emailOwnerIdx < emailPendingIdx, 'isOwner check must precede pending_approval in handleEmailLogin');
console.log('✅ Check 3 Passed: Owner check precedes pending_approval in both login flows.');

// 4. Verify AuthContext.jsx updates
const authContextPath = path.join(projectRoot, 'dh-backoffice-react/src/contexts/AuthContext.jsx');
const authContextContent = fs.readFileSync(authContextPath, 'utf8');
assert(authContextContent.includes("r.includes('admin')"), 'isManagerOrOwner must check admin role');
assert(authContextContent.includes("r.includes('แอดมิน')"), 'isManagerOrOwner must check thai admin role');
assert(authContextContent.includes('currentUser: user'), 'stateValue must export currentUser for parity');
console.log('✅ Check 4 Passed: AuthContext has admin roles and exports currentUser.');

console.log('\n🎉 ALL PHASE 1A VERIFICATION CHECKS PASSED!');
