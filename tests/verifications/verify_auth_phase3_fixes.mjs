// Verification script for Phase 3 UX, Session Lifecycle & Navigation Fixes
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

console.log('🧪 Starting Phase 3 Verification...');

// 1. Verify dh-backoffice-react/src/contexts/AuthContext.jsx
const boAuthPath = path.join(projectRoot, 'dh-backoffice-react/src/contexts/AuthContext.jsx');
const boAuthContent = fs.readFileSync(boAuthPath, 'utf8');

// Check H3: denyReason distinction
assert(boAuthContent.includes("const isPending = roleData?.role === 'pending_approval' || roleData?.role === 'pending';"), 'Must check isPending');
assert(boAuthContent.includes("setDenyReason(isSuspended ? 'blocked' : (isPending ? 'pending' : 'unauthorized'))"), 'Must accurately set denyReason pending/blocked/unauthorized (H3 fix)');
console.log('✅ Check 1 Passed: Backoffice AuthContext correctly distinguishes blocked vs pending vs unauthorized (H3 fixed).');

// Check M2: sessionStorage dh_ cleanup & inMemoryRbacCache reset
assert(boAuthContent.includes("key.startsWith('dh_')"), 'Must scan and clear dh_ sessionStorage keys on logout (M2 fix)');
assert(boAuthContent.includes("inMemoryRbacCache = null;"), 'Must reset inMemoryRbacCache on logout (M2 fix)');
console.log('✅ Check 2 Passed: Backoffice AuthContext wipes dh_ session cache and RBAC in-memory cache on logout (M2 fixed).');

// 2. Verify dh-frontend/src/context/AuthContext.jsx
const feAuthPath = path.join(projectRoot, 'dh-frontend/src/context/AuthContext.jsx');
const feAuthContent = fs.readFileSync(feAuthPath, 'utf8');

// Check M1: dispatch dh_auth_logout event
assert(feAuthContent.includes("window.dispatchEvent(new Event('dh_auth_logout'))"), 'Must dispatch dh_auth_logout on logout (M1 fix)');
console.log('✅ Check 3 Passed: Frontend AuthContext dispatches dh_auth_logout to clean userDocumentSubscriptionManager (M1 fixed).');

// 3. Verify dh-frontend/src/pages/Profile.jsx & AuthForm.jsx
const feProfilePath = path.join(projectRoot, 'dh-frontend/src/pages/Profile.jsx');
const feProfileContent = fs.readFileSync(feProfilePath, 'utf8');
assert(feProfileContent.includes("location.state?.returnUrl || queryParams.get('returnUrl')"), 'Must inspect returnUrl from location state or query params (M3 fix)');
assert(feProfileContent.includes("navigate(returnUrl, { replace: true })"), 'Must redirect to returnUrl upon successful login (M3 fix)');
console.log('✅ Check 4 Passed: Frontend Profile page redirects back to returnUrl after login (M3 fixed).');

const feAuthFormPath = path.join(projectRoot, 'dh-frontend/src/components/profile/AuthForm.jsx');
const feAuthFormContent = fs.readFileSync(feAuthFormPath, 'utf8');
assert(feAuthFormContent.includes("function AuthForm({ onSuccess })"), 'AuthForm must accept onSuccess prop');
assert(feAuthFormContent.includes("if (onSuccess) onSuccess();"), 'AuthForm must invoke onSuccess on login completion');
console.log('✅ Check 5 Passed: Frontend AuthForm supports onSuccess callback (M3 fixed).');

// 4. Verify dh-backoffice-react/src/components/common/NetworkHealthIndicator.jsx
const netHealthPath = path.join(projectRoot, 'dh-backoffice-react/src/components/common/NetworkHealthIndicator.jsx');
const netHealthContent = fs.readFileSync(netHealthPath, 'utf8');
assert(netHealthContent.includes("สัญญาณขาดหาย"), 'NetworkHealthIndicator must display clean Thai text สัญญาณขาดหาย without mojibake (M5 fix)');
assert(!netHealthContent.includes("เธชเธฑเธ"), 'NetworkHealthIndicator must not contain mojibake characters');
console.log('✅ Check 6 Passed: NetworkHealthIndicator Mojibake encoding is cleanly repaired (M5 fixed).');

// 5. Verify dh-backoffice-react/src/components/login/RegisterForm.jsx
const regFormPath = path.join(projectRoot, 'dh-backoffice-react/src/components/login/RegisterForm.jsx');
const regFormContent = fs.readFileSync(regFormPath, 'utf8');
assert(regFormContent.includes("grid grid-cols-1 sm:grid-cols-2 gap-4"), 'RegisterForm must use responsive grid classes for mobile screens (L1 fix)');
console.log('✅ Check 7 Passed: RegisterForm layout is mobile-responsive with sm:grid-cols-2 (L1 fixed).');

// 6. Verify dh-backoffice-react/src/components/routing/ManagerRoute.jsx
const managerRoutePath = path.join(projectRoot, 'dh-backoffice-react/src/components/routing/ManagerRoute.jsx');
const managerRouteContent = fs.readFileSync(managerRoutePath, 'utf8');
assert(!managerRouteContent.includes("alert("), 'ManagerRoute must not use raw browser alert (L2 fix)');
assert(managerRouteContent.includes("toast.error("), 'ManagerRoute must use toast.error (L2 fix)');
console.log('✅ Check 8 Passed: ManagerRoute replaced disruptive alert() with non-blocking toast (L2 fixed).');

console.log('\n🎉 ALL PHASE 3 VERIFICATION CHECKS PASSED!');
