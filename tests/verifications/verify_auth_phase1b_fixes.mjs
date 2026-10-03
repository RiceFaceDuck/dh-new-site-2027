// Verification script for Phase 1B Quota & Polling Fixes
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

console.log('🧪 Starting Phase 1B Verification...');

// 1. Verify gasHistoryService.js (C6 Quota Fix)
const gasServicePath = path.join(projectRoot, 'dh-backoffice-react/src/firebase/gasHistoryService.js');
const gasContent = fs.readFileSync(gasServicePath, 'utf8');

assert(!gasContent.includes('_startQueueTimer'), 'gasHistoryService must not start polling queue timer');
assert(!gasContent.includes('setInterval'), 'gasHistoryService constructor must not call setInterval');
assert(gasContent.includes('_canFlush()'), 'gasHistoryService must have _canFlush guard');
assert(gasContent.includes('_debouncedFlush()'), 'gasHistoryService must use debounced flush');
assert(gasContent.includes('if (this.isFlushing || !this._canFlush()) return;'), '_flush must be guarded by _canFlush');
console.log('✅ Check 1 Passed: gasHistoryService 5-second polling loop removed & debounced manager flush installed (C6 fixed).');

// 2. Verify AdminLayout.jsx (H4 Listener Guard)
const adminLayoutPath = path.join(projectRoot, 'dh-backoffice-react/src/layouts/AdminLayout.jsx');
const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');

assert(adminLayoutContent.includes('if (isCheckingAuth || accessDenied) return;'), 'AdminLayout must guard listeners against accessDenied');
assert(adminLayoutContent.includes('[isCheckingAuth, accessDenied]'), 'AdminLayout useEffect must depend on isCheckingAuth and accessDenied');
console.log('✅ Check 2 Passed: AdminLayout listeners guarded against unauthorized/denied states (H4 fixed).');

// 3. Verify Profile.jsx (H5 FOUC & Quota Fix)
const profilePath = path.join(projectRoot, 'dh-frontend/src/pages/Profile.jsx');
const profileContent = fs.readFileSync(profilePath, 'utf8');

assert(!profileContent.includes('getDoc('), 'Profile.jsx must not fire redundant getDoc to Firestore');
assert(!profileContent.includes('onAuthStateChanged('), 'Profile.jsx must not duplicate onAuthStateChanged listener');
assert(profileContent.includes('const isScreenLoading = authLoading && !effectiveUser;'), 'Profile.jsx must use proper boolean logic for loading skeleton');
console.log('✅ Check 3 Passed: Profile.jsx redundant getDoc removed and FOUC flicker eliminated (H5 fixed).');

console.log('\n🎉 ALL PHASE 1B VERIFICATION CHECKS PASSED!');
